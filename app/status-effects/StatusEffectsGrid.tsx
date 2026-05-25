'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { IconImg } from '@/components/ui/icon-img';
import {
  STATUS_CATEGORY_LABEL_PLURAL as CATEGORY_LABEL,
  STATUS_CATEGORY_COLOR as CATEGORY_COLOR,
} from '@/lib/ui/labels';
import type { StatusEffect } from '@/lib/data';

type Props = {
  effects: StatusEffect[];
};

const ORDER: StatusEffect['category'][] = ['buff', 'debuff', 'aura', 'general', 'status'];

export function StatusEffectsGrid({ effects }: Props) {
  const [query, setQuery] = useState('');
  const [cat, setCat]     = useState<StatusEffect['category'] | ''>('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return effects.filter((e) => {
      if (cat && e.category !== cat) return false;
      if (!q) return true;
      return (
        e.name.ru?.toLowerCase().includes(q) ||
        e.name.en?.toLowerCase().includes(q) ||
        e.id.includes(q) ||
        (e.description?.ru ?? '').toLowerCase().includes(q)
      );
    });
  }, [effects, query, cat]);

  const grouped = useMemo(() => {
    const m: Record<string, StatusEffect[]> = {};
    filtered.forEach((e) => { (m[e.category] ??= []).push(e); });
    return m;
  }, [filtered]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { '': effects.length };
    effects.forEach((e) => { m[e.category] = (m[e.category] ?? 0) + 1; });
    return m;
  }, [effects]);

  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label={`Все (${counts['']})`} active={cat === ''} onClick={() => setCat('')} />
        {ORDER.filter((c) => counts[c]).map((c) => (
          <FilterChip
            key={c}
            label={`${CATEGORY_LABEL[c]} (${counts[c]})`}
            active={cat === c}
            onClick={() => setCat(c)}
            color={CATEGORY_COLOR[c]}
          />
        ))}
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск состояний..."
        className="w-full max-w-[320px] bg-bg-2 border-2 border-line-2 px-4 py-2.5 font-sans text-[14px] text-ink placeholder:text-ink-faint focus:border-dbd-accent outline-none transition-colors duration-150"
      />

      <p className="label-mono text-[11px] text-ink-mute">{filtered.length} состояний</p>

      <div className="flex flex-col gap-6">
        {ORDER.filter((c) => grouped[c]?.length).map((c) => (
          <section key={c}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="m-0 label-mono text-[12px] tracking-[.2em] font-semibold" style={{ color: CATEGORY_COLOR[c] }}>
                {CATEGORY_LABEL[c]}
              </h2>
              <span className="label-mono text-[10px] text-ink-faint">({grouped[c].length})</span>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${CATEGORY_COLOR[c]}55, transparent)` }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grouped[c].map((e) => <EffectCard key={e.id} effect={e} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label, active, onClick, color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 label-mono text-[11px] border transition-colors duration-150',
        active
          ? 'border-line-ember text-dbd-bone bg-[rgba(184,67,31,.12)]'
          : 'border-line-1 text-ink-mute hover:border-line-2 hover:text-ink',
      )}
      style={active && color ? { color } : undefined}
    >
      {label}
    </button>
  );
}

function EffectCard({ effect: e }: { effect: StatusEffect }) {
  const accent = CATEGORY_COLOR[e.category] ?? 'var(--ink-mute)';
  return (
    <article className="flex gap-3 p-4 border border-line-1 bg-bg-1">
      {/* Icon */}
      <div
        className="w-14 h-14 shrink-0 border bg-bg-2 flex items-center justify-center overflow-hidden"
        style={{ borderColor: accent }}
      >
        <IconImg
          src={e.icon ?? undefined}
          alt={e.name.ru}
          size={48}
          fallback={<span className="text-ink-faint text-[20px]">·</span>}
        />
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <header className="flex items-center gap-2 flex-wrap">
          <h3 className="m-0 font-sans font-bold text-[15px] text-dbd-bone leading-tight">
            {e.name.ru || e.name.en}
          </h3>
          <span className="label-mono text-[9px] px-2 py-0.5 border" style={{ borderColor: accent, color: accent }}>
            {CATEGORY_LABEL[e.category] ?? e.category}
          </span>
          <span className="ml-auto font-sans text-[12px] text-ink-faint">{e.name.en}</span>
        </header>
        {e.description?.ru && (
          <p className="m-0 font-sans text-[13px] text-ink-mute leading-[1.55]">{e.description.ru}</p>
        )}
      </div>
    </article>
  );
}
