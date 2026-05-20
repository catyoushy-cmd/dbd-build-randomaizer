/**
 * Translate the legacy numeric `character` field on every perk to a new
 * `character_slug` field that points at a survivors/killers JSON entry.
 *
 * Mapping (verified empirically on perk data + tricky.lol order):
 *   Survivor perks: character "N" → survivors[N].id   (N=1 → meg-thomas; Dwight=0 unused)
 *   Killer perks:   character "N" → killers[N - 268435456].id
 *
 * Generic perks (character === '') stay with character_slug = null. They will
 * surface in /perks under the «Общие» group.
 *
 * Idempotent.
 *
 * Run: node scripts/fix-perk-characters.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');

const KILLER_OFFSET = 268435456;

function resolveSlug(role, character, survivors, killers) {
  if (character === '' || character == null) return null;
  const n = Number(character);
  if (!Number.isFinite(n)) return null;

  if (role === 'survivor') {
    return survivors[n]?.id ?? null;
  }
  if (role === 'killer') {
    const idx = n - KILLER_OFFSET;
    return killers[idx]?.id ?? null;
  }
  return null;
}

async function main() {
  const perks     = JSON.parse(await fs.readFile(path.join(DATA, 'perks.json'),     'utf-8'));
  const survivors = JSON.parse(await fs.readFile(path.join(DATA, 'survivors.json'), 'utf-8'));
  const killers   = JSON.parse(await fs.readFile(path.join(DATA, 'killers.json'),   'utf-8'));

  let changed = 0;
  let unresolved = 0;
  const unresolvedSample = [];

  for (const p of perks) {
    const slug = resolveSlug(p.role, p.character ?? '', survivors, killers);
    const current = 'character_slug' in p ? p.character_slug : undefined;

    if (current !== slug) {
      p.character_slug = slug;
      changed++;
    }

    if (p.character && slug === null) {
      unresolved++;
      if (unresolvedSample.length < 10) unresolvedSample.push(`${p.id} (char=${p.character})`);
    }
  }

  if (changed === 0) {
    console.log('[perks] no changes');
  } else {
    await fs.writeFile(path.join(DATA, 'perks.json'), JSON.stringify(perks, null, 2) + '\n', 'utf-8');
    console.log(`[perks] updated character_slug on ${changed} perk(s)`);
  }

  if (unresolved > 0) {
    console.log(`\n⚠ ${unresolved} perk(s) had a character index but no matching slug:`);
    for (const s of unresolvedSample) console.log(`   - ${s}`);
  }

  // Tally
  const generic = perks.filter((p) => p.character_slug == null).length;
  const mapped  = perks.length - generic;
  console.log(`\n  ${mapped} perks mapped to character_slug`);
  console.log(`  ${generic} perks remain in the generic bucket`);
}

main().catch((e) => { console.error(e); process.exit(1); });
