/**
 * Download missing DBD icons using exact image paths from the dbd.tricky.lol API.
 * The API image path last segment matches the Fandom wiki file name.
 *
 * Run: node scripts/fix-icons.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const ICONS_DIR = path.join(ROOT, 'public', 'icons');
const API_BASE = 'https://dbd.tricky.lol/api';
const WIKI_API = 'https://dead-by-daylight.fandom.com/ru/api.php';
const UA = 'DBD-Build-Randomizer/1.0';
const BATCH = 40;
const DELAY = 300;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** /Game/UI/.../iconPerks_aceInTheHole → IconPerks_aceInTheHole */
function apiPathToWikiTitle(imagePath) {
  if (!imagePath) return null;
  const base = imagePath.split('/').pop();
  if (!base) return null;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function resolveWikiUrls(titles) {
  const result = new Map();
  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    const q = batch.map(t => `File:${t}.png`).join('|');
    const url = `${WIKI_API}?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(q)}&origin=*`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      const data = await res.json();
      for (const page of Object.values(data.query?.pages ?? {})) {
        const key = page.title?.replace(/^(?:File|Файл):/, '').replace(/\.png$/, '').replace(/ /g, '_');
        const imgUrl = page.imageinfo?.[0]?.url;
        if (key && imgUrl) result.set(key, imgUrl);
      }
    } catch (e) { console.warn('  ⚠ wiki batch error:', e.message); }
    await sleep(DELAY);
  }
  return result;
}

async function downloadFile(url, dest) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, buf);
    return true;
  } catch { return false; }
}

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function processCategory(category, apiEndpoint, getImagePath) {
  console.log(`\n[${category}]`);

  // Load local data to find missing icons
  const localData = JSON.parse(await fs.readFile(path.join(DATA_DIR, `${category}.json`), 'utf-8'));
  const missingLocal = localData.filter(e => !e.deprecated && e.icon);
  const missing = [];
  for (const e of missingLocal) {
    const dest = path.join(ROOT, 'public', e.icon);
    if (!await fileExists(dest)) missing.push(e);
  }

  if (!missing.length) { console.log('  ✓ all icons present'); return; }
  console.log(`  ${missing.length} missing, fetching from API…`);

  // Fetch API data to get exact image paths
  let apiData;
  try {
    apiData = await fetchJson(`${API_BASE}/${apiEndpoint}`);
  } catch (e) {
    console.warn(`  ⚠ API unavailable: ${e.message}`);
    return;
  }

  // Build id → wikiTitle map using API image paths
  function slug(name) {
    return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  const idToWikiTitle = new Map();
  for (const [, api] of Object.entries(apiData)) {
    const id = slug(api.name);
    const imagePath = getImagePath(api);
    const wikiTitle = apiPathToWikiTitle(imagePath);
    if (id && wikiTitle) idToWikiTitle.set(id, wikiTitle);
  }

  // Map missing entries to wiki titles
  const toFetch = missing.map(e => ({
    id: e.id,
    dest: path.join(ROOT, 'public', e.icon),
    wikiTitle: idToWikiTitle.get(e.id),
  })).filter(e => e.wikiTitle);

  const skipped = missing.length - toFetch.length;
  if (skipped) console.log(`  ${skipped} without API image path (skipped)`);

  // Resolve wiki URLs
  const uniqueTitles = [...new Set(toFetch.map(e => e.wikiTitle))];
  const urlMap = await resolveWikiUrls(uniqueTitles);
  console.log(`  Resolved ${urlMap.size}/${uniqueTitles.length} wiki URLs`);

  // Download
  let ok = 0, fail = 0;
  for (const e of toFetch) {
    const wikiUrl = urlMap.get(e.wikiTitle);
    if (!wikiUrl) { fail++; continue; }
    const success = await downloadFile(wikiUrl, e.dest);
    if (success) ok++; else fail++;
    await sleep(50);
  }
  console.log(`  ✓ ${ok} downloaded, ${fail} failed`);
}

async function main() {
  console.log('Downloading missing icons…');

  await processCategory('perks', 'perks', api => api.image);
  await processCategory('addons', 'addons', api => api.image);
  await processCategory('offerings', 'offerings', api => api.image);
  await processCategory('items', 'items', api => api.image);

  // Count totals
  const total = (await Promise.all(
    ['perks','addons','offerings','items','killers','survivors'].map(async cat => {
      try {
        const files = await fs.readdir(path.join(ICONS_DIR, cat));
        return files.filter(f => f.endsWith('.png')).length;
      } catch { return 0; }
    })
  )).reduce((a, b) => a + b, 0);
  console.log(`\nTotal icons on disk: ${total}`);
}

main().catch(e => { console.error(e); process.exit(1); });
