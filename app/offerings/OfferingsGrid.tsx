'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatDbdText } from '@/lib/dbd-text';
import { rarityColor, rarityKey, rarityLabel } from '@/components/ui/shape-card';
import { EntityModal } from '@/components/ui/entity-modal';
import { IconImg } from '@/components/ui/icon-img';
import type { Offering } from '@/lib/data';

type Props = {
  offerings: Offering[];
};

const ROLE_OPTIONS = [
  { value: '',         label: 'Все',       count: (l: Offering[]) => l.length },
  { value: 'survivor', label: 'Выжившие',  count: (l: Offering[]) => l.filter(o => o.role === 'survivor').length },
  { value: 'killer',   label: 'Убийцы',    count: (l: Offering[]) => l.filter(o => o.role === 'killer').length },
  { value: 'both',     label: 'Общие',     count: (l: Offering[]) => l.filter(o => o.role === 'both').length },
] as const;

export function OfferingsGrid({ offerings }: Props) {
  const [roleFilter, setRoleFilter] = useState<'' | 'survivor' | 'killer' | 'both'>('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Offering | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return offerings.filter((o) => {
      // Role filter: empty = all; survivor/killer = role match OR 'both'; 'both' = only 'both'
      if (roleFilter === 'survivor' && o.role !== 'survivor' && o.role !== 'both') return false;
      if (roleFilter === 'killer'   && o.role !== 'killer'   && o.role !== 'both') return false;
      if (roleFilter === 'both'     && o.role !== 'both') return false;
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
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value)}
              className={cn(
                'px-3 py-2 label-mono text-[11px] border transition-colors duration-150',
                roleFilter === opt.value
                  ? 'border-line-ember text-dbd-bone bg-[rgba(184,67,31,.12)]'
                  : 'border-line-1 text-ink-mute hover:border-line-2 hover:text-ink',
              )}
            >
              {opt.label} ({opt.count(offerings)})
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск подношений..."
          className="flex-1 min-w-[180px] max-w-[280px] bg-bg-2 border border-line-2 px-3 py-2 font-sans text-[13px] text-ink placeholder:text-ink-faint focus:border-dbd-accent outline-none"
        />
      </div>

      <p className="label-mono text-[11px] text-ink-mute">{filtered.length} подношений</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((offering) => (
          <OfferingRow key={offering.id} offering={offering} onOpen={() => setSelected(offering)} />
        ))}
      </div>

      {/* Modal */}
      <EntityModal open={!!selected} onClose={() => setSelected(null)}>
        {selected && <OfferingModalBody offering={selected} />}
      </EntityModal>
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = {
  survivor: 'Выживший',
  killer:   'Убийца',
  both:     'Общее',
};

function OfferingRow({ offering, onOpen }: { offering: Offering; onOpen: () => void }) {
  const rk = rarityKey(offering.rarity ?? 'common');
  const ringColor = rarityColor(offering.rarity ?? 'common');

  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-3 px-4 py-3 text-left border border-line-1 bg-bg-1 hover:border-line-ember hover:bg-bg-2 transition-colors duration-150 cursor-pointer"
    >
      {/* Icon with rarity background tile */}
      <div
        className={cn('w-12 h-12 shrink-0 border flex items-center justify-center overflow-hidden', `rarity-bg-${rk}`)}
        style={{ borderColor: ringColor }}
      >
        <IconImg
          src={offering.icon}
          alt={offering.name.ru || offering.name.en}
          size={42}
          fallback={<span className="text-ink-faint text-base">✦</span>}
        />
      </div>

      {/* Name */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-sans text-[14px] font-semibold text-dbd-bone truncate">
          {offering.name.ru || offering.name.en}
        </span>
        <span className="font-sans text-[12px] truncate" style={{ color: ringColor }}>
          {rarityLabel(offering.rarity ?? 'common')}
        </span>
      </div>

      {/* Role badge */}
      <span className="label-mono text-[10px] px-2 py-1 border border-line-2 text-ink-mute shrink-0">
        {ROLE_LABEL[offering.role] ?? offering.role}
      </span>
    </button>
  );
}

function OfferingModalBody({ offering }: { offering: Offering }) {
  const rk = rarityKey(offering.rarity ?? 'common');
  const ringColor = rarityColor(offering.rarity ?? 'common');

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <div
          className={cn('w-16 h-16 shrink-0 border flex items-center justify-center overflow-hidden', `rarity-bg-${rk}`)}
          style={{ borderColor: ringColor }}
        >
          <IconImg
            src={offering.icon}
            alt={offering.name.ru}
            size={56}
            fallback={<span className="text-ink-faint">✦</span>}
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0 pt-1">
          <h2 className="m-0 font-sans font-bold text-[20px] text-dbd-bone leading-tight">
            {offering.name.ru || offering.name.en}
          </h2>
          <span className="font-sans text-[13px] text-ink-mute">{offering.name.en}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetaCell label="Редкость" value={rarityLabel(offering.rarity ?? 'common')} color={ringColor} />
        <MetaCell label="Сторона"  value={ROLE_LABEL[offering.role] ?? offering.role} />
      </div>

      {(offering.description?.ru || offering.description?.en) && (
        <div className="flex flex-col gap-2 pt-2 border-t border-line-1">
          <span className="label-mono text-[11px] text-ink-mute">Описание</span>
          <p className="m-0 font-sans text-[14px] text-ink leading-[1.6] whitespace-pre-line">
            {formatDbdText(offering.description?.ru || offering.description?.en)}
          </p>
        </div>
      )}
    </div>
  );
}

function MetaCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-1 border border-line-1 bg-bg-2 px-3 py-2">
      <span className="label-mono text-[10px] text-ink-faint">{label}</span>
      <span className="font-sans text-[13px] font-semibold" style={{ color: color ?? 'var(--ink)' }}>
        {value}
      </span>
    </div>
  );
}
