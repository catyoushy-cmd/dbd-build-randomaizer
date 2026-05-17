'use client';

const KEY = 'dbd-roll-history';
const MAX = 20;

export type HistoryEntry = {
  code: string;      // short URL code: v1.killer.trapper.efficient.12345
  role: 'survivor' | 'killer';
  charId: string | null;
  mode: 'random' | 'efficient' | 'fun';
  seed: number;
  label: string;     // e.g. "Убийца / Охотник / Эффективность"
  ts: number;
};

export function pushHistory(entry: HistoryEntry): void {
  try {
    const prev = getHistory();
    const next = [entry, ...prev.filter(e => e.code !== entry.code)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
