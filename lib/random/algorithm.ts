import { mulberry32, pickOne, pickN, weightedPick } from './prng';
import {
  PERKS, ITEMS, ADDONS, OFFERINGS, BUILD_CORES,
} from '@/lib/data';
import type { Perk, Item, Addon, Offering, BuildCore, Build, PerkRole, ItemType } from '@/lib/data';

export type BuildInput = {
  role: 'survivor' | 'killer';
  killerId?: string | null;
  survivorId?: string | null;
  mode: 'random' | 'efficient' | 'fun';
  seed: number;
};

const SURVIVOR_REQUIRED_ROLES: PerkRole[] = ['chase-escape', 'info', 'gen', 'exhaustion'];
const KILLER_REQUIRED_ROLES: PerkRole[] = ['slowdown', 'chase-power', 'info', 'aura'];

const TIER_SCORE: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 };

function perkPool(role: 'survivor' | 'killer'): Perk[] {
  return PERKS.filter(p => p.role === role && !p.deprecated);
}

function addonPoolForKiller(killerId: string): Addon[] {
  return ADDONS.filter(a => a.scope.type === 'killer' && a.scope.killerId === killerId);
}

function addonPoolForItem(itemType: ItemType): Addon[] {
  return ADDONS.filter(a => a.scope.type === 'item' && a.scope.itemType === itemType);
}

function offeringPool(role: 'survivor' | 'killer'): Offering[] {
  return OFFERINGS.filter(o => o.role === role || o.role === 'both' || (o.role as string) === 'any');
}

function rollRandom(rng: () => number, role: 'survivor' | 'killer', killerId: string | null): Omit<Build, 'seed' | 'role' | 'killerId' | 'survivorId' | 'mode'> {
  const perks = pickN(perkPool(role), 4, rng);

  let item: Item | null = null;
  let addons: Addon[];

  if (role === 'survivor') {
    item = pickOne(ITEMS, rng);
    addons = pickN(addonPoolForItem(item.type), 2, rng);
  } else {
    addons = killerId
      ? pickN(addonPoolForKiller(killerId), 2, rng)
      : [];
  }

  const offering = pickOne(offeringPool(role), rng);
  return { perks, item, addons, offering };
}

function fillPerks(
  existing: Perk[],
  pool: Perk[],
  requiredRoles: PerkRole[],
  rng: () => number,
  preferHighTier: boolean,
): Perk[] {
  const result = [...existing];
  const used = new Set(result.map(p => p.id));

  const coveredRoles = new Set(result.flatMap(p => p.roles));
  const uncoveredRoles = requiredRoles.filter(r => !coveredRoles.has(r));

  for (const role of uncoveredRoles) {
    if (result.length >= 4) break;
    const candidates = pool.filter(p => !used.has(p.id) && p.roles.includes(role));
    if (candidates.length === 0) continue;
    const picked = preferHighTier
      ? weightedPick(candidates, p => TIER_SCORE[p.tier] ?? 1, rng)!
      : pickOne(candidates, rng);
    result.push(picked);
    used.add(picked.id);
  }

  if (result.length < 4) {
    const remaining = pool.filter(p => !used.has(p.id));
    const toAdd = pickN(remaining, 4 - result.length, rng);
    result.push(...toAdd);
  }

  return result.slice(0, 4);
}

function rollEfficient(
  rng: () => number,
  role: 'survivor' | 'killer',
  killerId: string | null,
): Omit<Build, 'seed' | 'role' | 'killerId' | 'survivorId' | 'mode'> & { buildCore?: BuildCore; fallback?: boolean } {
  const cores = BUILD_CORES.filter(c => c.role === role && c.mode === 'efficient');
  const core = pickOne(cores, rng);

  const pool = perkPool(role);
  const requiredPerks = core.required_perks
    .map(id => pool.find(p => p.id === id))
    .filter(Boolean) as Perk[];

  if (requiredPerks.length < core.required_perks.length) {
    return { ...rollRandom(rng, role, killerId), fallback: true };
  }

  const requiredRoles = role === 'survivor' ? SURVIVOR_REQUIRED_ROLES : KILLER_REQUIRED_ROLES;
  const recommended = core.recommended_perks
    .map(id => pool.find(p => p.id === id))
    .filter(Boolean) as Perk[];

  const extendedPool = [
    ...recommended,
    ...pool.filter(p => !recommended.find(r => r.id === p.id)),
  ];

  const perks = fillPerks(requiredPerks, extendedPool, requiredRoles, rng, true);

  let item: Item | null = null;
  let addons: Addon[];

  if (role === 'survivor') {
    const preferredType = core.preferred_item_type;
    const itemPool = preferredType ? ITEMS.filter(i => i.type === preferredType) : ITEMS;
    item = itemPool.length > 0 ? pickOne(itemPool, rng) : pickOne(ITEMS, rng);
    const aPool = addonPoolForItem(item.type);
    const efficientAddons = aPool.filter(a => a.tags.includes('efficient'));
    addons = pickN(efficientAddons.length >= 2 ? efficientAddons : aPool, 2, rng);
  } else {
    const aPool = killerId ? addonPoolForKiller(killerId) : [];
    const efficientAddons = aPool.filter(a => a.tags.includes('efficient'));
    addons = pickN(efficientAddons.length >= 2 ? efficientAddons : aPool, 2, rng);
  }

  const offPool = offeringPool(role);
  const efficientOff = offPool.filter(o => o.tags.includes('efficient'));
  const offering = pickOne(efficientOff.length > 0 ? efficientOff : offPool, rng);

  return { perks, item, addons, offering, buildCore: core };
}

function rollFun(
  rng: () => number,
  role: 'survivor' | 'killer',
  killerId: string | null,
): Omit<Build, 'seed' | 'role' | 'killerId' | 'survivorId' | 'mode'> & { buildCore?: BuildCore; fallback?: boolean } {
  const cores = BUILD_CORES.filter(c => c.role === role && c.mode === 'fun');
  const core = pickOne(cores, rng);

  const pool = perkPool(role);
  const requiredPerks = core.required_perks
    .map(id => pool.find(p => p.id === id))
    .filter(Boolean) as Perk[];

  if (requiredPerks.length < core.required_perks.length) {
    return { ...rollRandom(rng, role, killerId), fallback: true };
  }

  const recommended = core.recommended_perks
    .map(id => pool.find(p => p.id === id))
    .filter(Boolean) as Perk[];

  const memePerkPool = pool.filter(p => p.roles.includes('meme'));
  const extendedPool = [
    ...recommended,
    ...memePerkPool.filter(p => !recommended.find(r => r.id === p.id)),
    ...pool.filter(p =>
      !recommended.find(r => r.id === p.id) &&
      !memePerkPool.find(m => m.id === p.id)
    ),
  ];

  const perks = fillPerks(requiredPerks, extendedPool, [], rng, false);

  let item: Item | null = null;
  let addons: Addon[];

  if (role === 'survivor') {
    const preferredType = core.preferred_item_type;
    const itemPool = preferredType ? ITEMS.filter(i => i.type === preferredType) : ITEMS;
    item = itemPool.length > 0 ? pickOne(itemPool, rng) : pickOne(ITEMS, rng);
    const aPool = addonPoolForItem(item.type);
    const memeAddons = aPool.filter(a => a.tags.includes('meme') || a.tags.includes('troll'));
    addons = pickN(memeAddons.length >= 2 ? memeAddons : aPool, 2, rng);
  } else {
    const aPool = killerId ? addonPoolForKiller(killerId) : [];
    const memeAddons = aPool.filter(a => a.tags.includes('meme') || a.tags.includes('troll'));
    addons = pickN(memeAddons.length >= 2 ? memeAddons : aPool, 2, rng);
  }

  const offPool = offeringPool(role);
  const funOff = offPool.filter(o => o.tags.includes('meme') || o.tags.includes('troll'));
  const offering = pickOne(funOff.length > 0 ? funOff : offPool, rng);

  return { perks, item, addons, offering, buildCore: core };
}

export function rollBuild(input: BuildInput): Build {
  const { role, killerId = null, survivorId = null, mode, seed } = input;
  const rng = mulberry32(seed);

  let result: Omit<Build, 'seed' | 'role' | 'killerId' | 'survivorId' | 'mode'> & {
    buildCore?: BuildCore;
    fallback?: boolean;
  };

  try {
    if (mode === 'random') {
      result = rollRandom(rng, role, killerId);
    } else if (mode === 'efficient') {
      result = rollEfficient(rng, role, killerId);
    } else {
      result = rollFun(rng, role, killerId);
    }
  } catch {
    result = { ...rollRandom(mulberry32(seed), role, killerId), fallback: true };
  }

  return {
    seed,
    role,
    killerId,
    survivorId,
    mode,
    perks: result.perks,
    item: result.item,
    addons: result.addons,
    offering: result.offering,
    buildCore: result.buildCore,
    fallback: result.fallback,
  };
}
