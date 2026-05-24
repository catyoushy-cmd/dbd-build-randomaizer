/**
 * Download killer + survivor portraits.
 *
 * Step 1: fetch dbd.tricky.lol /api/characters — each character has an
 *   `image` field like "UI/Icons/CharPortraits/K01_TheTrapper_Portrait.png".
 *   We extract the K## / S## index from it.
 * Step 2: match by name.en against our data/killers.json + data/survivors.json
 *   to learn which K## belongs to which slug.
 * Step 3: ask fandom wiki for File:K01_charSelect_portrait.png URLs and download.
 *
 * Run: node scripts/download-character-icons.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const ICONS_DIR = path.join(ROOT, 'public', 'icons');
const WIKI_API = 'https://deadbydaylight.fandom.com/api.php';
const TRICKY_API = 'https://dbd.tricky.lol/api/characters';
const UA = 'DBD-Build-Randomizer/1.0 (character icon downloader)';

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

/**
 * Extract code from any of:
 *   "UI/Icons/CharPortraits/K01_TheTrapper_Portrait.png"   → "K01"
 *   "UI/Icons/CharPortraits/Qatar/T_UI_S19_NancyWheeler_Portrait.png" → "S19"
 */
function codeFromImage(img) {
  if (!img) return null;
  // Try plain prefix first
  let m = img.match(/\/([KS]\d{2})_/);
  if (m) return m[1];
  // Then T_UI_ wrapped form
  m = img.match(/T_UI_([KS]\d{2})_/);
  return m?.[1] ?? null;
}

async function buildCodeMap() {
  console.log('Fetching character codes from tricky.lol…');
  const data = await fetchJson(TRICKY_API);
  /** Map "the trapper" → { code, image }, etc. */
  const byNameEn = new Map();
  for (const v of Object.values(data)) {
    const code = codeFromImage(v.image);
    if (!code) continue;
    const key = (v.name ?? '').toLowerCase().trim();
    if (key) byNameEn.set(key, { code, image: v.image });
  }
  console.log(`  ${byNameEn.size} characters mapped`);
  return byNameEn;
}

async function resolveWikiUrl(fileTitle) {
  const url = `${WIKI_API}?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent('File:' + fileTitle)}&origin=*`;
  try {
    const data = await fetchJson(url);
    const page = Object.values(data.query?.pages ?? {})[0];
    return page?.imageinfo?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

/** Build candidate file titles from a tricky-style image path + code. */
function candidateFilenames(code, trickyImage, nameEn) {
  const candidates = new Set();
  // Classic format: K01_charSelect_portrait.png
  candidates.add(`${code}_charSelect_portrait.png`);
  // New format from tricky API: T_UI_K42_TheFirst_Portrait.png — extract just the basename
  if (trickyImage) {
    const last = trickyImage.split('/').pop();
    if (last) candidates.add(last);
  }
  // Underscored name from nameEn: 'The Dark Lord' → 'The_Dark_Lord_charSelect_portrait.png'
  if (nameEn) {
    const slug = nameEn.replace(/[^A-Za-z0-9]+/g, '_');
    candidates.add(`${slug}_charSelect_portrait.png`);
  }
  return [...candidates];
}

async function downloadFile(url, dest) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, buf);
    return true;
  } catch {
    return false;
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function processCategory(category, data, codeMap) {
  console.log(`\n[${category}] ${data.length} entries`);
  let ok = 0, fail = 0, missing = 0;

  for (const entry of data) {
    const dest = path.join(ICONS_DIR, category, `${entry.id}.png`);
    try { await fs.access(dest); continue; } catch {}

    const key = (entry.name?.en ?? '').toLowerCase().trim();
    const info = codeMap.get(key);
    if (!info) {
      console.warn(`  ⚠ no code for ${entry.id} (${entry.name?.en})`);
      missing++;
      continue;
    }

    const candidates = candidateFilenames(info.code, info.image, entry.name?.en);
    let wikiUrl = null;
    let chosen = null;
    for (const cand of candidates) {
      wikiUrl = await resolveWikiUrl(cand);
      if (wikiUrl) { chosen = cand; break; }
      await sleep(100);
    }

    if (!wikiUrl) {
      console.warn(`  ⚠ wiki has none of [${candidates.join(', ')}] for ${entry.id}`);
      fail++;
      continue;
    }

    const success = await downloadFile(wikiUrl, dest);
    if (success) { ok++; console.log(`  ✓ ${entry.id} (${info.code} via ${chosen})`); }
    else { fail++; console.warn(`  ✗ failed to download ${entry.id}`); }

    await sleep(150);
  }

  console.log(`[${category}] ${ok} downloaded, ${fail} failed, ${missing} missing-code`);
}

async function main() {
  console.log('Character portrait download starting…\n');

  await fs.mkdir(path.join(ICONS_DIR, 'killers'), { recursive: true });
  await fs.mkdir(path.join(ICONS_DIR, 'survivors'), { recursive: true });

  const codeMap = await buildCodeMap();

  const killers   = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'killers.json'),   'utf-8'));
  const survivors = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'survivors.json'), 'utf-8'));

  await processCategory('killers',   killers,   codeMap);
  await processCategory('survivors', survivors, codeMap);

  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
