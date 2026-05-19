'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatDbdText } from '@/lib/dbd-text';
import { EntityModal } from '@/components/ui/entity-modal';
import { IconImg } from '@/components/ui/icon-img';
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
  gen: 'Ген', 'chase-escape': 'Побег', info: 'Инфо', altruism: 'Альтруизм',
  exhaustion: 'Истощение', boon: 'Дарование', meme: 'Мем',
  slowdown: 'Замедление', 'chase-power': 'Погоня', aura: 'Аура',
  hex: 'Гекс', endgame: 'Финал', stealth: 'Скрытность',
  healing: 'Лечение', chest: 'Сундуки', item: 'Предмет',
  totem: 'Тотемы', map: 'Карта', survival: 'Выживание',
};

const TIER_LEVELS = [1, 2, 3] as const;

export function PerksGrid({ survivorPerks, killerPerks }: Props) {
  const [tab, setTab] = useState<'survivor' | 'killer'>('survivor');
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [selected, setSelected] = useState<Perk | null>(null);

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
              onClick={() => setTab(r)}
              className={cn(
                'px-4 py-2 label-mono text-[11px] border-b-2 transition-all duration-150',
                tab === r
                  ? 'border-b-dbd-accent text-dbd-bone bg-[rgba(184,67,31,.08)]'
                  : 'border-b-line-1 text-ink-mute hover:text-ink',
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
          placeholder="Поиск перков..."
          className="flex-1 min-w-[180px] max-w-[280px] bg-bg-2 border border-line-2 px-3 py-2 font-sans text-[13px] text-ink placeholder:text-ink-faint focus:border-dbd-accent outline-none"
        />

        {/* Tier filter */}
        <div className="flex gap-1">
          {['', 'S', 'A', 'B', 'C'].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={cn(
                'px-3 py-1.5 label-mono text-[11px] border transition-colors duration-150',
                tierFilter === t
                  ? 'border-line-ember text-dbd-bone bg-[rgba(184,67,31,.12)]'
                  : 'border-line-1 text-ink-mute hover:border-line-2 hover:text-ink',
              )}
            >
              {t || 'Все'}
            </button>
          ))}
        </div>
      </div>

      <p className="label-mono text-[11px] text-ink-mute">{filtered.length} перков</p>

      {/* Grid — fixed-height cards, no expand-in-place */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((perk) => (
          <PerkRow key={perk.id} perk={perk} onOpen={() => setSelected(perk)} />
        ))}
      </div>

      {/* Modal */}
      <EntityModal open={!!selected} onClose={() => setSelected(null)}>
        {selected && <PerkModalBody perk={selected} />}
      </EntityModal>
    </div>
  );
}

/* ───────── Grid card ───────── */

function PerkRow({ perk, onOpen }: { perk: Perk; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-3 px-4 py-3 text-left border border-line-1 bg-bg-1 hover:border-line-ember hover:bg-bg-2 transition-colors duration-150 cursor-pointer"
    >
      {/* Icon */}
      <div className="w-12 h-12 shrink-0 border border-line-2 bg-bg-2 flex items-center justify-center overflow-hidden">
        <IconImg
          src={perk.icon}
          alt={perk.name.ru || perk.name.en}
          size={42}
          fallback={<span className="text-ink-faint text-base">⚙</span>}
        />
      </div>

      {/* Name */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-sans text-[14px] font-semibold text-dbd-bone truncate">
          {perk.name.ru || perk.name.en}
        </span>
        <span className="font-sans text-[12px] text-ink-mute truncate">{perk.name.en}</span>
      </div>

      {/* Tier badge */}
      {perk.tier && (
        <span className={cn('label-mono text-[14px] font-bold shrink-0', TIER_COLOR[perk.tier] ?? 'text-ink-faint')}>
          {perk.tier}
        </span>
      )}
    </button>
  );
}

/* ───────── Modal body ───────── */

function PerkModalBody({ perk }: { perk: Perk }) {
  const [tier, setTier] = useState<1 | 2 | 3>(3);

  // Build tier-specific tunables (index 0,1,2 → tier 1,2,3)
  const tieredTunables = useMemo(() => {
    if (!perk.tunables) return undefined;
    const result: Record<string, number[]> = {};
    for (const [key, vals] of Object.entries(perk.tunables)) {
      if (!vals) continue;
      // Single-value tunables (constants) — use as-is at all tiers
      const tierIdx = Math.min(tier - 1, vals.length - 1);
      result[key] = [vals[tierIdx]];
    }
    return result;
  }, [perk.tunables, tier]);

  const description = formatDbdText(perk.description.ru, tieredTunables);
  const hasMultipleTiers = perk.tunables && Object.values(perk.tunables).some(v => v && v.length > 1);

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 shrink-0 border border-line-ember bg-bg-2 flex items-center justify-center overflow-hidden">
          <IconImg
            src={perk.icon}
            alt={perk.name.ru}
            size={56}
            fallback={<span className="text-ink-faint">⚙</span>}
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0 pt-1">
          <h2 className="m-0 font-sans font-bold text-[20px] text-dbd-bone leading-tight">
            {perk.name.ru || perk.name.en}
          </h2>
          <span className="font-sans text-[13px] text-ink-mute">{perk.name.en}</span>
        </div>
        {perk.tier && (
          <span className={cn('label-mono text-[18px] font-bold shrink-0 pt-1', TIER_COLOR[perk.tier] ?? 'text-ink-faint')}>
            {perk.tier}
          </span>
        )}
      </div>

      {/* Tier level switcher */}
      {hasMultipleTiers && (
        <div className="flex flex-col gap-2">
          <span className="label-mono text-[11px] text-ink-mute">Уровень перка</span>
          <div className="flex gap-1">
            {TIER_LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setTier(lvl)}
                className={cn(
                  'flex-1 px-4 py-2 label-mono text-[12px] border transition-colors duration-150',
                  tier === lvl
                    ? 'border-line-ember text-dbd-bone bg-[rgba(184,67,31,.15)]'
                    : 'border-line-1 text-ink-mute hover:border-line-2 hover:text-ink',
                )}
              >
                Ур. {lvl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="flex flex-col gap-2">
        <span className="label-mono text-[11px] text-ink-mute">Описание</span>
        <p className="m-0 font-sans text-[14px] text-ink leading-[1.6] whitespace-pre-line">
          {description}
        </p>
      </div>

      {/* Meta */}
      {(perk.roles.length > 0 || perk.character) && (
        <div className="flex flex-col gap-2 pt-2 border-t border-line-1">
          {perk.roles.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="label-mono text-[11px] text-ink-mute shrink-0">Роли:</span>
              <div className="flex flex-wrap gap-1.5">
                {perk.roles.map((r) => (
                  <span key={r} className="label-mono text-[11px] px-2 py-1 border border-line-2 text-ink">
                    {ROLE_LABEL[r] ?? r}
                  </span>
                ))}
              </div>
            </div>
          )}
          {perk.character && (
            <div className="flex items-center gap-3">
              <span className="label-mono text-[11px] text-ink-mute">Персонаж:</span>
              <span className="font-sans text-[13px] text-ink">{perk.character}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
