/**
 * Download DBD icons from the Dead by Daylight Fandom wiki.
 * Uses the MediaWiki imageinfo API to resolve URLs, then downloads PNGs.
 *
 * Run: node scripts/download-icons.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const ICONS_DIR = path.join(ROOT, 'public', 'icons');
const WIKI_API = 'https://deadbydaylight.fandom.com/api.php';
const UA = 'DBD-Build-Randomizer/1.0 (icon downloader)';
const BATCH = 40; // MediaWiki titles per request
const DELAY_MS = 300; // polite delay between batches

/** slug 'ace-in-the-hole' → camelCase 'aceInTheHole' */
function toCamel(slug) {
  return slug
    .split('-')
    .map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/** Map from category to wiki file prefix */
const PREFIX = {
  perks:     id => `IconPerks_${toCamel(id)}`,
  addons:    id => `IconAddon_${toCamel(id)}`,
  offerings: id => `IconFavors_${toCamel(id)}`,
  items:     id => `IconItems_${toCamel(id)}`,
  killers:   id => `IconPortrait_${toCamel(id)}`,
  survivors: id => `IconPortrait_${toCamel(id)}`,
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** Batch-resolve wiki image URLs: [fileTitle] → url | null */
async function resolveWikiUrls(titles) {
  const result = new Map();
  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    const query = batch.map(t => `File:${t}.png`).join('|');
    const url = `${WIKI_API}?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(query)}&origin=*`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) { console.warn(`  ⚠ Wiki API ${res.status} for batch ${i}–${i+BATCH}`); continue; }
      const data = await res.json();
      for (const page of Object.values(data.query?.pages ?? {})) {
        const fileTitle = page.title?.replace(/^File:/, '').replace(/\.png$/, '').replace(/ /g, '_');
        const imgUrl = page.imageinfo?.[0]?.url;
        if (fileTitle && imgUrl) result.set(fileTitle, imgUrl);
      }
    } catch (e) {
      console.warn(`  ⚠ Wiki batch error:`, e.message);
    }
    if (i + BATCH < titles.length) await sleep(DELAY_MS);
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
  } catch {
    return false;
  }
}

async function processCategory(category, data) {
  console.log(`\n[${category}] ${data.length} entries`);
  const active = data.filter(e => !e.deprecated);

  // Build wiki file title for each entry
  const prefixFn = PREFIX[category];
  const entries = active.map(e => ({
    id: e.id,
    dest: path.join(ICONS_DIR, category, `${e.id}.png`),
    wikiTitle: prefixFn(e.id),
  }));

  // Skip already-downloaded
  const toFetch = [];
  for (const e of entries) {
    try { await fs.access(e.dest); }
    catch { toFetch.push(e); }
  }
  console.log(`  ${entries.length - toFetch.length} already downloaded, ${toFetch.length} to fetch`);
  if (!toFetch.length) return;

  // Resolve wiki URLs
  const titles = [...new Set(toFetch.map(e => e.wikiTitle))];
  const urlMap = await resolveWikiUrls(titles);
  console.log(`  Resolved ${urlMap.size}/${titles.length} wiki URLs`);

  // Download
  let ok = 0, fail = 0;
  for (const e of toFetch) {
    const wikiUrl = urlMap.get(e.wikiTitle);
    if (!wikiUrl) { fail++; continue; }
    const success = await downloadFile(wikiUrl, e.dest);
    if (success) ok++; else fail++;
    if ((ok + fail) % 50 === 0) console.log(`  ... ${ok + fail}/${toFetch.length}`);
    await sleep(50); // polite delay per download
  }
  console.log(`  ✓ ${ok} downloaded, ${fail} failed`);
}

async function main() {
  console.log('DBD icon download starting…');

  for (const sub of ['perks', 'killers', 'survivors', 'items', 'addons', 'offerings']) {
    await fs.mkdir(path.join(ICONS_DIR, sub), { recursive: true });
  }

  const categories = ['perks', 'killers', 'survivors', 'items', 'addons', 'offerings'];
  for (const cat of categories) {
    const data = JSON.parse(await fs.readFile(path.join(DATA_DIR, `${cat}.json`), 'utf-8'));
    await processCategory(cat, data);
  }

  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
