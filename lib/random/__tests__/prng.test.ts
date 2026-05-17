import { describe, it, expect } from 'vitest';
import { mulberry32, pickOne, pickN, weightedPick } from '../prng';

describe('mulberry32', () => {
  it('same seed produces same sequence', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBeCloseTo(rng2(), 15);
    }
  });

  it('different seeds produce different sequences', () => {
    const r1 = mulberry32(1)();
    const r2 = mulberry32(2)();
    expect(r1).not.toBe(r2);
  });

  it('output is in [0, 1)', () => {
    const rng = mulberry32(99999);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('pickN', () => {
  it('returns n unique elements', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const rng = mulberry32(42);
    const picked = pickN(arr, 4, rng);
    expect(picked).toHaveLength(4);
    expect(new Set(picked).size).toBe(4);
  });

  it('no duplicates across 1000 picks', () => {
    const arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rng = mulberry32(7777);
    for (let i = 0; i < 1000; i++) {
      const picked = pickN(arr, 4, rng);
      expect(new Set(picked).size).toBe(4);
    }
  });

  it('clamps to array length if n > arr.length', () => {
    const arr = [1, 2, 3];
    const rng = mulberry32(1);
    const picked = pickN(arr, 10, rng);
    expect(picked).toHaveLength(3);
  });
});

describe('weightedPick', () => {
  it('returns an element from array', () => {
    const arr = ['a', 'b', 'c'];
    const rng = mulberry32(1);
    const picked = weightedPick(arr, () => 1, rng);
    expect(arr).toContain(picked);
  });

  it('returns undefined for empty array', () => {
    const rng = mulberry32(1);
    expect(weightedPick([], () => 1, rng)).toBeUndefined();
  });

  it('always picks highest-weight item when others have 0 weight', () => {
    const arr = ['a', 'b', 'c'];
    const rng = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const picked = weightedPick(arr, (x) => x === 'b' ? 1000 : 0, rng);
      expect(picked).toBe('b');
    }
  });
});
