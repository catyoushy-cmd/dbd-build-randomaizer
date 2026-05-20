/**
 * Mark non-default (event / removed / spec) items / addons / offerings with
 *   available_by_default: false
 * Items, addons and offerings without the flag are considered available
 * (the JSON shape simply omits `available_by_default` for the default-true case).
 *
 * Idempotent. Re-runs produce zero changes.
 *
 * Run: node scripts/mark-default-availability.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');

/* ─── Predicates ─── */

const ITEM_NOT_DEFAULT = (it) => {
  // Anniversary / event re-skins of the base items
  if (/^anniversary-/.test(it.id)) return true;
  if (/^halloween-/.test(it.id))   return true;
  if (/^christmas-/.test(it.id))   return true;
  if (/-lunchbox$/.test(it.id))    return true;

  // Specific event / killer-only "items" that don't belong in the base random pool
  const blacklist = new Set([
    'camping-aid-kit', // shows up twice in the JSON (dup-merged in seed)
    'void-crystal',    // The Singularity-spec mob drop
    'blood-can',       // The Mastermind quest item
    'worn-out-tools',  // killer-spec item
    'pocket-mirror',   // The Onryō spec
    'antidote',        // The Plague spec
    'glowing-fungus',  // event tool
    'will-o-wisp',     // The Knight artifact
    'emp',             // The Singularity counter
    'all-hallows-eve-lunchbox',
  ]);
  if (blacklist.has(it.id)) return true;

  // rarity 'none' typically means it's not a real player item
  if (it.rarity === 'none' || it.rarity === 'visceral') return true;

  return false;
};

const OFFERING_NOT_DEFAULT = (o) => {
  // Currently unaware of any non-default offerings in the data — leave hook in place.
  // Anniversary cakes (gateau/cake/flan/terrormisu) ARE part of the default
  // experience now (BP bonus is permanent on most events), so keep them.
  return false;
};

const ADDON_NOT_DEFAULT = (a) => {
  if (/^anniversary-/.test(a.id)) return true;
  return false;
};

/* ─── Apply ─── */

async function processFile(name, predicate) {
  const file = path.join(DATA, `${name}.json`);
  const raw = JSON.parse(await fs.readFile(file, 'utf-8'));

  let changed = 0;
  const flipped = [];

  for (const entry of raw) {
    const shouldHide = predicate(entry);
    const has = 'available_by_default' in entry;
    const current = has ? entry.available_by_default : true;

    if (shouldHide && current !== false) {
      entry.available_by_default = false;
      changed++;
      flipped.push(entry.id);
    } else if (!shouldHide && has && entry.available_by_default === false) {
      // Predicate no longer flags it — restore default by removing the field
      delete entry.available_by_default;
      changed++;
      flipped.push(`(restored) ${entry.id}`);
    }
  }

  if (changed === 0) {
    console.log(`[${name}] no changes`);
    return;
  }

  await fs.writeFile(file, JSON.stringify(raw, null, 2) + '\n', 'utf-8');
  console.log(`[${name}] ${changed} change(s):`);
  for (const id of flipped) console.log(`   - ${id}`);
}

async function main() {
  console.log('Marking non-default availability…\n');
  await processFile('items',     ITEM_NOT_DEFAULT);
  await processFile('addons',    ADDON_NOT_DEFAULT);
  await processFile('offerings', OFFERING_NOT_DEFAULT);
  console.log('\nDone.');
}

main().catch((e) => { console.error(e); process.exit(1); });
