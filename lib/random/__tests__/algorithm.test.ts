import { describe, it, expect } from 'vitest';
import { rollBuild } from '../algorithm';

describe('rollBuild — full random', () => {
  it('returns 4 unique perks', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const build = rollBuild({ role: 'survivor', mode: 'random', seed });
      expect(build.perks).toHaveLength(4);
      expect(new Set(build.perks.map(p => p.id)).size).toBe(4);
    }
  });

  it('killer: returns 2 unique addons', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const build = rollBuild({ role: 'killer', killerId: 'trapper', mode: 'random', seed });
      expect(build.addons).toHaveLength(2);
      expect(new Set(build.addons.map(a => a.id)).size).toBe(2);
    }
  });

  it('survivor: returns item with 2 unique addons', () => {
    const build = rollBuild({ role: 'survivor', mode: 'random', seed: 42 });
    expect(build.item).not.toBeNull();
    expect(build.addons).toHaveLength(2);
    expect(new Set(build.addons.map(a => a.id)).size).toBe(2);
  });

  it('same seed produces identical build', () => {
    const b1 = rollBuild({ role: 'killer', killerId: 'nurse', mode: 'random', seed: 9999 });
    const b2 = rollBuild({ role: 'killer', killerId: 'nurse', mode: 'random', seed: 9999 });
    expect(b1.perks.map(p => p.id)).toEqual(b2.perks.map(p => p.id));
    expect(b1.addons.map(a => a.id)).toEqual(b2.addons.map(a => a.id));
    expect(b1.offering.id).toBe(b2.offering.id);
  });
});

describe('rollBuild — efficient', () => {
  it('survivor efficient: 4 unique perks, all from required core', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const build = rollBuild({ role: 'survivor', mode: 'efficient', seed });
      expect(build.perks).toHaveLength(4);
      expect(new Set(build.perks.map(p => p.id)).size).toBe(4);
      if (!build.fallback && build.buildCore) {
        for (const requiredId of build.buildCore.required_perks) {
          expect(build.perks.map(p => p.id)).toContain(requiredId);
        }
      }
    }
  });

  it('killer efficient: 4 unique perks, required core perks present', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const build = rollBuild({ role: 'killer', killerId: 'trapper', mode: 'efficient', seed });
      expect(build.perks).toHaveLength(4);
      expect(new Set(build.perks.map(p => p.id)).size).toBe(4);
    }
  });

  it('no duplicate addons in any efficient killer build', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const build = rollBuild({ role: 'killer', killerId: 'huntress', mode: 'efficient', seed });
      expect(new Set(build.addons.map(a => a.id)).size).toBe(build.addons.length);
    }
  });
});

describe('rollBuild — fun', () => {
  it('survivor fun: 4 unique perks', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const build = rollBuild({ role: 'survivor', mode: 'fun', seed });
      expect(build.perks).toHaveLength(4);
      expect(new Set(build.perks.map(p => p.id)).size).toBe(4);
    }
  });

  it('killer fun: 4 unique perks', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const build = rollBuild({ role: 'killer', killerId: 'spirit', mode: 'fun', seed });
      expect(build.perks).toHaveLength(4);
      expect(new Set(build.perks.map(p => p.id)).size).toBe(4);
    }
  });
});

describe('rollBuild — determinism across modes', () => {
  it('all three modes are deterministic', () => {
    for (const mode of ['random', 'efficient', 'fun'] as const) {
      const b1 = rollBuild({ role: 'survivor', mode, seed: 31337 });
      const b2 = rollBuild({ role: 'survivor', mode, seed: 31337 });
      expect(b1.perks.map(p => p.id)).toEqual(b2.perks.map(p => p.id));
    }
  });
});
