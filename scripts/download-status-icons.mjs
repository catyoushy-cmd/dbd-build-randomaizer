/**
 * Download status-effect icons from the Russian Dead by Daylight Fandom wiki.
 * Reads `wiki_file` field from data/status-effects.json and saves
 * to public/icons/status-effects/<id>.png.
 *
 * Idempotent.
 *
 * Run: node scripts/download-status-icons.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'status-effects.json');
const DEST = path.join(ROOT, 'public', 'icons', 'status-effects');
// RU wiki responds to fan tools; EN-only fallback is the same DB.
const WIKI_API = 'https://deadbydaylight.fandom.com/ru/api.php';
const UA = 'Mozilla/5.0 (DBD-Randomizer/1.0 status-icons)';

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function resolveWikiUrl(fileTitle) {
  const url = `${WIKI_API}?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent('File:' + fileTitle)}`;
  try {
    const data = await fetchJson(url);
    const page = Object.values(data.query?.pages ?? {})[0];
    return page?.imageinfo?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

async function downloadFile(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
  return true;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  await fs.mkdir(DEST, { recursive: true });
  const effects = JSON.parse(await fs.readFile(DATA, 'utf-8'));
  let ok = 0, fail = 0, skipped = 0;

  for (const e of effects) {
    if (!e.wiki_file) { console.warn(`  - ${e.id}: no wiki_file`); continue; }
    const dest = path.join(DEST, `${e.id}.png`);
    try { await fs.access(dest); skipped++; continue; } catch {}

    const url = await resolveWikiUrl(e.wiki_file);
    if (!url) {
      // Try variants with case-fix
      const variants = [
        e.wiki_file.replace(/^I/, 'i'),
        e.wiki_file.replace(/^i/, 'I'),
      ].filter(v => v !== e.wiki_file);
      let alt = null;
      for (const v of variants) {
        alt = await resolveWikiUrl(v);
        if (alt) { console.log(`  ↪ ${e.id}: matched case-variant ${v}`); break; }
        await sleep(80);
      }
      if (!alt) {
        console.warn(`  ✗ ${e.id}: wiki has no ${e.wiki_file}`);
        fail++;
        continue;
      }
      const success = await downloadFile(alt, dest);
      if (success) { ok++; console.log(`  ✓ ${e.id} (variant)`); }
      else { fail++; }
      await sleep(120);
      continue;
    }
    const success = await downloadFile(url, dest);
    if (success) { ok++; console.log(`  ✓ ${e.id}`); }
    else { fail++; console.warn(`  ✗ ${e.id}: download failed`); }
    await sleep(120);
  }

  console.log(`\nDone. ${ok} downloaded, ${skipped} already on disk, ${fail} failed.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
