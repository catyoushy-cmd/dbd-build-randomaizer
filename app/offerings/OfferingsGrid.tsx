'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Offering } from '@/lib/data';

type Props = {
  offerings: Offering[];
};

const RARITY_COLOR: Record<string, string> = {
  'common':     'text-ink-faint border-line-1',
  'uncommon':   'text-dbd-bone border-line-2',
  'rare':       'text-dbd-accent border-line-ember',
  'very-rare':  'text-dbd-glow border-dbd-glow',
  'ultra-rare': 'text-dbd-blood border-dbd-blood',
};

export function OfferingsGrid({ offerings }: Props) {
  const [roleFilter, setRoleFilter] = useState<'' | 'survivor' | 'killer' | 'both'>('');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return offerings.filter((o) => {
      if (roleFilter && o.role !== roleFilter && o.role !== 'both') return false;
      if (!q) return true;
      return (
        o.name.ru?.toLowerCase().includes(q) ||
        o.name.en?.toLowerCase().includes(q) ||
        o.id.includes(q)
      );
    });
  }, [offerings, query, roleFilter]);

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Role filter */}
        <div className="flex gap-1">
          {([
            { value: '', label: 'Все' },
            { value: 'survivor', label: 'Выжившие' },
            { value: 'killer', label: 'Убийцы' },
            { value: 'both', label: 'Общие' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value)}
              className={cn(
                'px-3 py-2 label-mono text-[10px] border transition-colors duration-150',
                roleFilter === opt.value
                  ? 'border-line-ember text-dbd-bone bg-[rgba(184,67,31,.12)]'
                  : 'border-line-1 text-ink-mute hover:border-line-2',
              )}
            >
              {opt.label}
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
      </div>

      <p className="label-mono text-[9px] text-ink-faint">{filtered.length} подношений</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map((offering) => (
          <OfferingCard
            key={offering.id}
            offering={offering}
            expanded={expandedId === offering.id}
            onToggle={() => setExpandedId(expandedId === offering.id ? null : offering.id)}
          />
        ))}
      </div>
    </div>
  );
}

function OfferingCard({
  offering,
  expanded,
  onToggle,
}: {
  offering: Offering;
  expanded: boolean;
  onToggle: () => void;
}) {
  const rarityClass = RARITY_COLOR[offering.rarity] ?? 'text-ink-faint border-line-1';

  return (
    <div
      className={cn(
        'border cursor-pointer transition-all duration-150',
        expanded ? 'border-line-ember bg-bg-2' : 'border-line-1 bg-bg-1 hover:border-line-2',
      )}
    >
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        {/* Icon */}
        <div className="w-9 h-9 shrink-0 border border-line-2 bg-bg-2 flex items-center justify-center overflow-hidden">
          {offering.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/icons/offerings/${offering.icon}`}
              alt={offering.name.ru || offering.name.en}
              className="w-full h-full object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <span className="text-ink-faint text-[14px]">✦</span>
          )}
        </div>

        {/* Name */}
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-sans text-[12px] font-semibold text-dbd-bone truncate">
            {offering.name.ru || offering.name.en}
          </span>
          <span className="font-sans text-[10px] text-ink-faint truncate">{offering.name.en}</span>
        </div>

        {/* Rarity */}
        <span className={cn('label-mono text-[9px] px-2 py-0.5 border shrink-0', rarityClass)}>
          {offering.rarity}
        </span>

        <span className={cn('text-ink-faint text-[10px] shrink-0 transition-transform duration-200', expanded ? 'rotate-90' : '')}>
          ▶
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-line-1">
          {(offering.description?.ru || offering.description?.en) && (
            <p className="font-sans text-[12px] text-ink-mute leading-relaxed mt-3">
              {offering.description?.ru || offering.description?.en}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <span className="label-mono text-[9px] px-2 py-0.5 border border-line-1 text-ink-faint">
              {offering.role === 'both' ? 'Все роли' : offering.role === 'survivor' ? 'Выживший' : 'Убийца'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
