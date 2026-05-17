/** mulberry32 — fast deterministic PRNG, 32-bit seed */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

/** Pick one random element from array. */
export function pickOne<T>(arr: T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Pick n unique elements from array (no duplicates). */
export function pickN<T>(arr: T[], n: number, rng: Rng): T[] {
  const pool = [...arr];
  const result: T[] = [];
  const count = Math.min(n, pool.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * (pool.length - i));
    result.push(pool[idx]);
    pool[idx] = pool[pool.length - 1 - i];
  }
  return result;
}

/** Pick one element, weighted by a score function (higher = more likely). */
export function weightedPick<T>(arr: T[], scoreFn: (item: T) => number, rng: Rng): T | undefined {
  if (arr.length === 0) return undefined;
  const scores = arr.map(scoreFn);
  const total = scores.reduce((a, b) => a + b, 0);
  if (total === 0) return pickOne(arr, rng);
  let threshold = rng() * total;
  for (let i = 0; i < arr.length; i++) {
    threshold -= scores[i];
    if (threshold <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}
