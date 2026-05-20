/**
 * Repair `role` field in data/offerings.json.
 *
 * Original sync left every offering with role='both', which broke the
 * survivor/killer filter on /offerings. We re-classify by id/name pattern,
 * falling back to 'both' for genuinely cross-role items (BP cakes, etc.)
 * and printing warnings for anything the ruleset can't identify so a human
 * can refine the rules later.
 *
 * Idempotent.
 *
 * Run: node scripts/fix-offering-roles.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'data', 'offerings.json');

/* ─── Ruleset ─── */

const RULES = [
  // BP / Anniversary cakes — affect everyone in the trial
  { role: 'both',
    test: (o) => /\b(cake|gateau|flan|terrormisu|cobbler|pie|streamers|pudding|tarhana)\b/i.test(o.id) },

  // Killer Moris (kill instantly during/after a single hook)
  { role: 'killer',
    test: (o) => /\b(mori|memento)\b/i.test(o.id) && !/petrified|sapling/.test(o.id) },

  // Killer shrouds / oaks / sealed envelopes / hex statuettes
  { role: 'killer',
    test: (o) => /^(shroud-of-|putrid-oak|sealed-envelope|black-salt-statuette|vigo-s-shroud|hagspice|black-incense|cut-coxcomb)/.test(o.id) },

  // Killer hooks (only killers can pull these)
  { role: 'killer',
    test: (o) => /^(hooked|iridescent-flesh|distressing-pin|crowdfunded-coupon)/.test(o.id) },

  // White Ward, survivor wards (preserve player's items / addons)
  { role: 'survivor',
    test: (o) => /(white-ward|chalk-pouch|survivor-pudding|bog-laurel-sachet|cream-chalk-pouch)/.test(o.id) },

  // Black Ward is technically survivor-side too (saves the survivor's item)
  { role: 'survivor',
    test: (o) => o.id === 'black-ward' },

  // Map offerings — Reagents (visual fog), Wreaths, Bouquets, Blueprints — all map-altering;
  // these have historically been offered by either side but are flavoured "survivor" in modern DBD.
  // Mark as survivor unless we have evidence they're killer-only.
  { role: 'survivor',
    test: (o) => /^(.*-reagent|.*-bouquet|.*-wreath|.*-blueprint|.*-splinter|.*-key|.*-feather|.*-sachet)$/.test(o.id) },

  // Bloody Party Streamers — global BP bonus, both sides eligible
  { role: 'both',
    test: (o) => o.id === 'bloody-party-streamers' },

  // The big white sapling / cypress-sapling / shrouded compass — both
  { role: 'both',
    test: (o) => /(sapling|compass|petrified)/.test(o.id) },
];

/* ─── Apply ─── */

async function main() {
  const raw = JSON.parse(await fs.readFile(FILE, 'utf-8'));
  let changed = 0;
  const unresolved = [];

  for (const o of raw) {
    let newRole = null;
    for (const rule of RULES) {
      if (rule.test(o)) { newRole = rule.role; break; }
    }

    if (newRole === null) {
      // No rule matched — keep current role but warn so we can iterate the ruleset
      if (o.role === 'both') unresolved.push(o.id);
      continue;
    }

    if (o.role !== newRole) {
      console.log(`  ${o.id}: ${o.role} → ${newRole}`);
      o.role = newRole;
      changed++;
    }
  }

  if (changed > 0) {
    await fs.writeFile(FILE, JSON.stringify(raw, null, 2) + '\n', 'utf-8');
    console.log(`\n[offerings] ${changed} role(s) updated`);
  } else {
    console.log('[offerings] no role changes');
  }

  if (unresolved.length > 0) {
    console.log(`\n⚠ ${unresolved.length} offering(s) without rule (kept as 'both'):`);
    for (const id of unresolved) console.log(`   - ${id}`);
    console.log('\nAdd patterns to RULES if you can classify these.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
