import { describe, it, expect } from 'vitest';
import { encodeShort, encodeLong, decode, IncompatibleVersionError, InvalidBuildCodeError } from '../encode';
import { rollBuild } from '@/lib/random/algorithm';
import type { Pins } from '@/lib/random/pinning';

function makeBuild(role: 'survivor' | 'killer', mode: 'random' | 'efficient' | 'fun') {
  return rollBuild({
    role,
    killerId: role === 'killer' ? 'trapper' : null,
    mode,
    seed: 42,
  });
}

describe('encodeShort / decodeShort round-trip', () => {
  it('killer build round-trips', () => {
    const build = makeBuild('killer', 'efficient');
    const code = encodeShort(build);
    expect(code).toMatch(/^v1\.killer\.trapper\.efficient\.\d+$/);
    const { input } = decode(code);
    expect(input.role).toBe('killer');
    expect(input.killerId).toBe('trapper');
    expect(input.mode).toBe('efficient');
    expect(input.seed).toBe(build.seed);
  });

  it('survivor build round-trips', () => {
    const build = makeBuild('survivor', 'fun');
    const code = encodeShort(build);
    const { input } = decode(code);
    expect(input.role).toBe('survivor');
    expect(input.mode).toBe('fun');
    expect(input.seed).toBe(build.seed);
  });

  it('decoding short code produces same build', () => {
    const build = makeBuild('killer', 'random');
    const code = encodeShort(build);
    const { input } = decode(code);
    const build2 = rollBuild(input);
    expect(build2.perks.map(p => p.id)).toEqual(build.perks.map(p => p.id));
    expect(build2.offering.id).toBe(build.offering.id);
  });
});

describe('encodeLong / decodeLong round-trip', () => {
  it('encodes and decodes with pins', () => {
    const build = makeBuild('survivor', 'fun');
    const pins: Pins = {
      perks: [build.perks[0].id, null, null, null],
      item: null,
      addons: [build.addons[0].id, null],
      offering: null,
    };
    const code = encodeLong(build, pins);
    const result = decode(code);
    expect(result.input.role).toBe('survivor');
    expect(result.input.mode).toBe('fun');
    expect(result.pinnedIds?.perks[0]).toBe(build.perks[0].id);
    expect(result.pinnedIds?.perks[1]).toBeNull();
    expect(result.pinnedIds?.addons[0]).toBe(build.addons[0].id);
  });

  it('no pins: pinnedIds all null', () => {
    const build = makeBuild('killer', 'efficient');
    const pins: Pins = {};
    const code = encodeLong(build, pins);
    const result = decode(code);
    expect(result.pinnedIds?.perks.every(p => p === null)).toBe(true);
    expect(result.pinnedIds?.offering).toBeNull();
  });
});

describe('error cases', () => {
  it('throws IncompatibleVersionError on wrong version', () => {
    expect(() => decode('v2.killer.trapper.efficient.42')).toThrow(IncompatibleVersionError);
  });

  it('throws InvalidBuildCodeError on wrong part count', () => {
    expect(() => decode('v1.killer.trapper')).toThrow(InvalidBuildCodeError);
  });

  it('throws InvalidBuildCodeError on invalid role', () => {
    expect(() => decode('v1.wizard.trapper.efficient.42')).toThrow(InvalidBuildCodeError);
  });

  it('throws InvalidBuildCodeError on invalid seed', () => {
    expect(() => decode('v1.killer.trapper.efficient.abc')).toThrow(InvalidBuildCodeError);
  });
});
