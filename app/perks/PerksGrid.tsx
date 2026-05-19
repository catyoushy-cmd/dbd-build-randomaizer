'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Perk } from '@/lib/data';

type Props = {
  survivorPerks: Perk[];
  killerPerks: Perk[];
};

const TIER_COLOR: Record<string, string> = {
  S: 'text-dbd-accent',
  A: 'text-dbd-bone',
  B: 'text-ink-mute',
  C: 'text-ink-faint',
};

const ROLE_LABEL: Record<string, string> = {
  gen: 'Ген',
  'chase-escape': 'Побег',
  info: 'Инфо',
  altruism: 'Альтруизм',
  exhaustion: 'Истощение',
  boon: 'Дарование',
  meme: 'Мем',
  slowdown: 'Замедление',
  'chase-power': 'Погоня',
  aura: 'Аура',
  hex: 'Гекс',
  endgame: 'Финал',
  stealth: 'Скрытность',
};

export function PerksGrid({ survivorPerks, killerPerks }: Props) {
  const [tab, setTab] = useState<'survivor' | 'killer'>('survivor');
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const perks = tab === 'survivor' ? survivorPerks : killerPerks;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return perks.filter((p) => {
      if (tierFilter && p.tier !== tierFilter) return false;
      if (!q) return true;
      return (
        p.name.ru?.toLowerCase().includes(q) ||
        p.name.en?.toLowerCase().includes(q) ||
        p.id.includes(q)
      );
    });
  }, [perks, query, tierFilter]);

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tab */}
        <div className="flex">
          {(['survivor', 'killer'] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setTab(r); setExpandedId(null); }}
              className={cn(
                'px-4 py-2 label-mono text-[10px] border-b-2 transition-all duration-150',
                tab === r
                  ? 'border-b-dbd-accent text-dbd-bone bg-[rgba(184,67,31,.08)]'
                  : 'border-b-line-1 text-ink-mute',
              )}
            >
              {r === 'survivor' ? 'Выжившие' : 'Убийцы'} ({r === 'survivor' ? survivorPerks.length : killerPerks.length})
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск..."
          className="flex-1 min-w-[160px] max-w-[260px] bg-bg-2 border border-line-2 px-3 py-2 font-sans text-[12px] text-ink placeholder:text-ink-faint focus:border-dbd-accent outline-none"
        />

        {/* Tier filter */}
        <div className="flex gap-1">
          {['', 'S', 'A', 'B', 'C'].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={cn(
                'px-3 py-1 label-mono text-[10px] border transition-colors duration-150',
                tierFilter === t
                  ? 'border-line-ember text-dbd-bone bg-[rgba(184,67,31,.12)]'
                  : 'border-line-1 text-ink-faint hover:border-line-2',
              )}
            >
              {t || 'Все'}
            </button>
          ))}
        </div>
      </div>

      <p className="label-mono text-[9px] text-ink-faint">{filtered.length} перков</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map((perk) => (
          <PerkCard
            key={perk.id}
            perk={perk}
            expanded={expandedId === perk.id}
            onToggle={() => setExpandedId(expandedId === perk.id ? null : perk.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PerkCard({ perk, expanded, onToggle }: { perk: Perk; expanded: boolean; onToggle: () => void }) {
  return (
    <div
      className={cn(
        'border cursor-pointer transition-all duration-150',
        expanded ? 'border-line-ember bg-bg-2' : 'border-line-1 bg-bg-1 hover:border-line-2',
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Icon */}
        <div className="w-10 h-10 shrink-0 border border-line-2 bg-bg-2 flex items-center justify-center overflow-hidden">
          {perk.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/icons/perks/${perk.icon}`}
              alt={perk.name.ru || perk.name.en}
              className="w-full h-full object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <span className="text-ink-faint text-[16px]">⚙</span>
          )}
        </div>

        {/* Name + tier */}
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-sans text-[12px] font-semibold text-dbd-bone truncate">
            {perk.name.ru || perk.name.en}
          </span>
          <span className="font-sans text-[10px] text-ink-faint truncate">{perk.name.en}</span>
        </div>

        {/* Tier badge */}
        {perk.tier && (
          <span className={cn('label-mono text-[12px] font-bold shrink-0', TIER_COLOR[perk.tier] ?? 'text-ink-faint')}>
            {perk.tier}
          </span>
        )}

        {/* Expand arrow */}
        <span className={cn('text-ink-faint text-[10px] shrink-0 transition-transform duration-200', expanded ? 'rotate-90' : '')}>
          ▶
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-line-1">
          {/* Description */}
          {(perk.description?.ru || perk.description?.en) && (
            <p className="font-sans text-[12px] text-ink-mute leading-relaxed mt-3">
              {perk.description.ru || perk.description.en}
            </p>
          )}

          {/* Roles */}
          {perk.roles.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {perk.roles.map((r) => (
                <span key={r} className="label-mono text-[9px] px-2 py-0.5 border border-line-2 text-ink-mute">
                  {ROLE_LABEL[r] ?? r}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
