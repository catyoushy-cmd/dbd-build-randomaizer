'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { IconImg } from '@/components/ui/icon-img';
import { rarityColor, rarityKey, rarityLabel } from '@/components/ui/shape-card';
import type { Perk, Killer, Survivor, Item, Addon, Offering, StatusEffect } from '@/lib/data';

type Props = {
  perks: Perk[];
  killers: Killer[];
  survivors: Survivor[];
  items: Item[];
  addons: Addon[];
  offerings: Offering[];
  statusEffects: StatusEffect[];
  initialQuery: string;
};

type ResultKind = 'perk' | 'killer' | 'survivor' | 'item' | 'addon' | 'offering' | 'status';

type Result = {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  icon?: string | null;
  rarity?: string;
  score: number; // lower = better match
};

const KIND_LABEL: Record<ResultKind, string> = {
  perk:     'Перк',
  killer:   'Убийца',
  survivor: 'Выживший',
  item:     'Предмет',
  addon:    'Аддон',
  offering: 'Подношение',
  status:   'Состояние',
};

const KIND_ORDER: ResultKind[] = ['perk', 'killer', 'survivor', 'item', 'addon', 'offering', 'status'];

/** Lightweight fuzzy score — lower = better. -1 = no match. */
function score(haystack: string, query: string): number {
  if (!haystack) return -1;
  const h = haystack.toLowerCase();
  const q = query.toLowerCase();
  if (h === q) return 0;
  if (h.startsWith(q)) return 1;
  const idx = h.indexOf(q);
  return idx >= 0 ? 2 + idx / 100 : -1;
}

function bestMatch(...candidates: (string | undefined | null)[]): number {
  let best = -1;
  for (const c of candidates) {
    if (!c) continue;
    const s = scoreCache(c);
    if (best < 0 || (s >= 0 && s < best)) best = s;
  }
  return best;
}

// scoreCache is bound per-render via closure
let scoreCache: (s: string) => number = () => -1;

export function SearchClient({
  perks, killers, survivors, items, addons, offerings, statusEffects, initialQuery,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [kindFilter, setKindFilter] = useState<ResultKind | ''>('');

  // Sync to URL ?q=
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const q = query.trim();
    if (q) params.set('q', q); else params.delete('q');
    const next = params.toString();
    router.replace(`${pathname}${next ? `?${next}` : ''}`, { scroll: false });
  }, [query, pathname, router, searchParams]);

  const results: Result[] = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];

    scoreCache = (s: string) => score(s, q);
    const out: Result[] = [];

    for (const p of perks) {
      const s = bestMatch(p.name.ru, p.name.en, p.id);
      if (s < 0) continue;
      out.push({
        kind: 'perk',
        id: p.id,
        title: p.name.ru || p.name.en,
        subtitle: p.name.en,
        href: `/perks?focus=${p.id}`,
        icon: p.icon,
        score: s,
      });
    }
    for (const k of killers) {
      const s = bestMatch(k.name.ru, k.name.en, k.power, k.id);
      if (s < 0) continue;
      out.push({
        kind: 'killer',
        id: k.id,
        title: k.name.ru,
        subtitle: k.power ?? k.name.en,
        href: `/addons?killer=${k.id}`,
        icon: k.icon,
        score: s,
      });
    }
    for (const sv of survivors) {
      const s = bestMatch(sv.name.ru, sv.name.en, sv.id);
      if (s < 0) continue;
      out.push({
        kind: 'survivor',
        id: sv.id,
        title: sv.name.ru,
        subtitle: sv.name.en,
        href: `/survivors`,
        icon: sv.icon,
        score: s,
      });
    }
    for (const it of items) {
      const s = bestMatch(it.name.ru, it.name.en, it.id);
      if (s < 0) continue;
      out.push({
        kind: 'item',
        id: it.id,
        title: it.name.ru,
        subtitle: it.type,
        href: `/items`,
        icon: it.icon,
        rarity: it.rarity,
        score: s,
      });
    }
    for (const a of addons) {
      const s = bestMatch(a.name.ru, a.name.en, a.id);
      if (s < 0) continue;
      const sub = a.scope.type === 'killer' ? a.scope.killerId : a.scope.itemType;
      const href = a.scope.type === 'killer'
        ? `/addons?killer=${a.scope.killerId}`
        : `/addons?item=${a.scope.itemType}`;
      out.push({
        kind: 'addon',
        id: a.id,
        title: a.name.ru,
        subtitle: sub,
        href,
        icon: a.icon,
        rarity: a.rarity,
        score: s,
      });
    }
    for (const o of offerings) {
      const s = bestMatch(o.name.ru, o.name.en, o.id);
      if (s < 0) continue;
      out.push({
        kind: 'offering',
        id: o.id,
        title: o.name.ru,
        subtitle: o.role,
        href: `/offerings`,
        icon: o.icon,
        rarity: o.rarity,
        score: s,
      });
    }
    for (const e of statusEffects) {
      const s = bestMatch(e.name.ru, e.name.en, e.id, e.source_key ?? undefined);
      if (s < 0) continue;
      out.push({
        kind: 'status',
        id: e.id,
        title: e.name.ru,
        subtitle: e.category,
        href: `/status-effects`,
        score: s,
      });
    }

    return out.sort((a, b) => a.score - b.score).slice(0, 80);
  }, [query, perks, killers, survivors, items, addons, offerings, statusEffects]);

  const filtered = kindFilter ? results.filter((r) => r.kind === kindFilter) : results;

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    results.forEach((r) => { m[r.kind] = (m[r.kind] ?? 0) + 1; });
    return m;
  }, [results]);

  return (
    <div className="flex flex-col gap-5">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        placeholder="Введите запрос (минимум 2 символа)…"
        className="w-full bg-bg-2 border-2 border-line-2 px-4 py-3 font-sans text-[15px] text-ink placeholder:text-ink-faint focus:border-dbd-accent outline-none transition-colors duration-150"
      />

      {query.trim().length < 2 ? (
        <p className="text-ink-mute text-[13px] italic">Введите хотя бы 2 символа.</p>
      ) : results.length === 0 ? (
        <p className="text-ink-mute text-[14px] italic py-8 text-center">Ничего не найдено</p>
      ) : (
        <>
          {/* Kind filter chips */}
          <div className="flex flex-wrap gap-1">
            <FilterChip label={`Все (${results.length})`} active={kindFilter === ''} onClick={() => setKindFilter('')} />
            {KIND_ORDER.filter((k) => counts[k]).map((k) => (
              <FilterChip
                key={k}
                label={`${KIND_LABEL[k]} (${counts[k]})`}
                active={kindFilter === k}
                onClick={() => setKindFilter(k)}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((r) => <ResultRow key={`${r.kind}:${r.id}`} result={r} />)}
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 label-mono text-[11px] border transition-colors duration-150',
        active
          ? 'border-line-ember text-dbd-bone bg-[rgba(184,67,31,.12)]'
          : 'border-line-1 text-ink-mute hover:border-line-2 hover:text-ink',
      )}
    >
      {label}
    </button>
  );
}

function ResultRow({ result: r }: { result: Result }) {
  const ringColor = r.rarity ? rarityColor(r.rarity) : 'var(--line-2)';
  const rk = r.rarity ? rarityKey(r.rarity) : null;

  return (
    <Link
      href={r.href}
      className="flex items-center gap-3 px-4 py-3 border border-line-1 bg-bg-1 hover:border-line-ember hover:bg-bg-2 transition-colors duration-150 no-underline"
    >
      {/* Icon */}
      <div
        className={cn(
          'w-12 h-12 shrink-0 border flex items-center justify-center overflow-hidden',
          rk && `rarity-bg-${rk}`,
        )}
        style={{ borderColor: ringColor }}
      >
        {r.icon ? (
          <IconImg src={r.icon} alt="" size={42} fallback={<span className="text-ink-faint">·</span>} />
        ) : (
          <span className="text-ink-faint text-[18px]">·</span>
        )}
      </div>

      {/* Title + subtitle */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-sans text-[14px] font-semibold text-dbd-bone leading-tight truncate">
          {r.title}
        </span>
        <span className="font-sans text-[12px] text-ink-mute mt-0.5 truncate">
          {r.subtitle}
          {r.rarity && <span className="ml-2" style={{ color: ringColor }}>{rarityLabel(r.rarity)}</span>}
        </span>
      </div>

      {/* Kind badge */}
      <span className="label-mono text-[10px] px-2 py-1 border border-line-2 text-ink-mute shrink-0">
        {KIND_LABEL[r.kind]}
      </span>
    </Link>
  );
}
