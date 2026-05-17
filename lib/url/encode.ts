import type { Build } from '@/lib/data';
import type { BuildInput } from '@/lib/random/algorithm';
import type { Pins } from '@/lib/random/pinning';

const VERSION = 'v1';

export class IncompatibleVersionError extends Error {
  constructor(version: string) {
    super(`Incompatible build version: ${version}. Expected ${VERSION}.`);
    this.name = 'IncompatibleVersionError';
  }
}

export class InvalidBuildCodeError extends Error {
  constructor(reason: string) {
    super(`Invalid build code: ${reason}`);
    this.name = 'InvalidBuildCodeError';
  }
}

/**
 * Short format (no pins): v1.killer.trapper.efficient.12345
 * Short format survivor: v1.survivor.any.fun.99999
 */
export function encodeShort(build: Build): string {
  const role = build.role;
  const characterId =
    role === 'killer'
      ? (build.killerId ?? 'any')
      : (build.survivorId ?? 'any');
  return `${VERSION}.${role}.${characterId}.${build.mode}.${build.seed}`;
}

/**
 * Long format (with pins): /build/v1?p=p1,p2,p3,p4&i=toolbox&a=a1,a2&o=off1&pinned=p1,a1&role=survivor&char=any&mode=fun&seed=12345
 */
export function encodeLong(build: Build, pins: Pins): string {
  const params = new URLSearchParams();
  params.set('ver', VERSION);
  params.set('role', build.role);
  params.set('char', build.role === 'killer' ? (build.killerId ?? 'any') : (build.survivorId ?? 'any'));
  params.set('mode', build.mode);
  params.set('seed', String(build.seed));
  params.set('p', build.perks.map(p => p.id).join(','));
  if (build.item) params.set('i', build.item.id);
  params.set('a', build.addons.map(a => a.id).join(','));
  params.set('o', build.offering.id);

  const pinnedSlots: string[] = [];
  if (pins.perks) {
    pins.perks.forEach((id, idx) => { if (id) pinnedSlots.push(`p${idx}`); });
  }
  if (pins.item) pinnedSlots.push('i');
  if (pins.addons) {
    pins.addons.forEach((id, idx) => { if (id) pinnedSlots.push(`a${idx}`); });
  }
  if (pins.offering) pinnedSlots.push('o');
  if (pinnedSlots.length > 0) params.set('pinned', pinnedSlots.join(','));

  return `?${params.toString()}`;
}

type DecodeResult = {
  input: BuildInput;
  pinnedIds?: {
    perks: (string | null)[];
    item: string | null;
    addons: (string | null)[];
    offering: string | null;
  };
  fullBuildIds?: {
    perkIds: string[];
    itemId: string | null;
    addonIds: string[];
    offeringId: string;
  };
};

/** Decode either short path segment or long query string. */
export function decode(code: string): DecodeResult {
  if (code.startsWith('?') || code.includes('&')) {
    return decodeLong(code);
  }
  return decodeShort(code);
}

function decodeShort(code: string): DecodeResult {
  const parts = code.split('.');
  if (parts.length !== 5) {
    throw new InvalidBuildCodeError(`expected 5 dot-separated parts, got ${parts.length}`);
  }
  const [version, role, characterId, mode, seedStr] = parts;
  if (version !== VERSION) throw new IncompatibleVersionError(version);
  if (role !== 'survivor' && role !== 'killer') {
    throw new InvalidBuildCodeError(`invalid role: ${role}`);
  }
  if (mode !== 'random' && mode !== 'efficient' && mode !== 'fun') {
    throw new InvalidBuildCodeError(`invalid mode: ${mode}`);
  }
  const seed = parseInt(seedStr, 10);
  if (isNaN(seed)) throw new InvalidBuildCodeError(`invalid seed: ${seedStr}`);

  return {
    input: {
      role: role as 'survivor' | 'killer',
      killerId: role === 'killer' && characterId !== 'any' ? characterId : null,
      survivorId: role === 'survivor' && characterId !== 'any' ? characterId : null,
      mode: mode as 'random' | 'efficient' | 'fun',
      seed,
    },
  };
}

function decodeLong(code: string): DecodeResult {
  const params = new URLSearchParams(code.startsWith('?') ? code.slice(1) : code);

  const version = params.get('ver');
  if (version && version !== VERSION) throw new IncompatibleVersionError(version ?? 'unknown');

  const role = params.get('role');
  if (role !== 'survivor' && role !== 'killer') {
    throw new InvalidBuildCodeError(`invalid role: ${role}`);
  }
  const mode = params.get('mode');
  if (mode !== 'random' && mode !== 'efficient' && mode !== 'fun') {
    throw new InvalidBuildCodeError(`invalid mode: ${mode}`);
  }
  const seedStr = params.get('seed');
  const seed = parseInt(seedStr ?? '', 10);
  if (isNaN(seed)) throw new InvalidBuildCodeError(`invalid seed: ${seedStr}`);

  const characterId = params.get('char') ?? 'any';

  const perkIds = (params.get('p') ?? '').split(',').filter(Boolean);
  const itemId = params.get('i') ?? null;
  const addonIds = (params.get('a') ?? '').split(',').filter(Boolean);
  const offeringId = params.get('o');
  if (!offeringId) throw new InvalidBuildCodeError('missing offering');

  const pinnedStr = params.get('pinned') ?? '';
  const pinnedSet = new Set(pinnedStr.split(',').filter(Boolean));

  const pinnedPerks: (string | null)[] = perkIds.map((id, i) =>
    pinnedSet.has(`p${i}`) ? id : null
  );
  while (pinnedPerks.length < 4) pinnedPerks.push(null);

  const pinnedAddons: (string | null)[] = addonIds.map((id, i) =>
    pinnedSet.has(`a${i}`) ? id : null
  );
  while (pinnedAddons.length < 2) pinnedAddons.push(null);

  return {
    input: {
      role: role as 'survivor' | 'killer',
      killerId: role === 'killer' && characterId !== 'any' ? characterId : null,
      survivorId: role === 'survivor' && characterId !== 'any' ? characterId : null,
      mode: mode as 'random' | 'efficient' | 'fun',
      seed,
    },
    pinnedIds: {
      perks: pinnedPerks,
      item: pinnedSet.has('i') ? itemId : null,
      addons: pinnedAddons,
      offering: pinnedSet.has('o') ? offeringId : null,
    },
    fullBuildIds: {
      perkIds,
      itemId,
      addonIds,
      offeringId,
    },
  };
}
