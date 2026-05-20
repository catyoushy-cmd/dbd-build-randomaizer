/**
 * Repair data/items.json:
 * - rarity "visceral" → "ultra-rare" (this was the in-game label some patches used)
 * - rarity "none" → drop the field (interpreter treats missing as common)
 * - Remove duplicate entries (some ids appear twice with different shapes)
 *
 * Idempotent.
 *
 * Run: node scripts/fix-items-data.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'data', 'items.json');

async function main() {
  const raw = JSON.parse(await fs.readFile(FILE, 'utf-8'));

  // 1. Dedupe by id (keep richest entry — one with description/icon)
  const byId = new Map();
  for (const it of raw) {
    const existing = byId.get(it.id);
    if (!existing) { byId.set(it.id, it); continue; }
    // Prefer the entry with non-empty description
    const incomingHasDesc = !!(it.description?.ru || it.description?.en);
    const existingHasDesc = !!(existing.description?.ru || existing.description?.en);
    if (incomingHasDesc && !existingHasDesc) byId.set(it.id, it);
  }
  const deduped = [...byId.values()];
  const removedDups = raw.length - deduped.length;

  // 2. Rarity normalisation
  let rarityChanges = 0;
  for (const it of deduped) {
    if (it.rarity === 'visceral') {
      it.rarity = 'ultra-rare';
      rarityChanges++;
    } else if (it.rarity === 'none') {
      delete it.rarity;
      rarityChanges++;
    }
  }

  if (removedDups === 0 && rarityChanges === 0) {
    console.log('[items] no changes');
    return;
  }

  await fs.writeFile(FILE, JSON.stringify(deduped, null, 2) + '\n', 'utf-8');
  if (removedDups)   console.log(`[items] removed ${removedDups} duplicate id(s)`);
  if (rarityChanges) console.log(`[items] normalised ${rarityChanges} rarity field(s)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
