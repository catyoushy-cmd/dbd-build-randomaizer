'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDbdText } from '@/lib/dbd-text';
import { rarityColor, rarityKey, rarityLabel } from '@/components/ui/shape-card';
import { EntityModal } from '@/components/ui/entity-modal';
import { IconImg } from '@/components/ui/icon-img';
import type { Item } from '@/lib/data';

type Props = {
  items: Item[];
};

const ITEM_TYPE_LABEL: Record<string, string> = {
  flashlight: 'Фонарики',
  medkit:     'Аптечки',
  toolbox:    'Инструменты',
  map:        'Карты',
  key:        'Ключи',
};

const ITEM_TYPE_SINGULAR: Record<string, string> = {
  flashlight: 'Фонарик',
  medkit:     'Аптечка',
  toolbox:    'Инструменты',
  map:        'Карта',
  key:        'Ключ',
};

const ITEM_TYPE_ORDER = ['medkit', 'toolbox', 'flashlight', 'map', 'key'] as const;

export function ItemsGrid({ items }: Props) {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Item | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((it) => {
      if (typeFilter && it.type !== typeFilter) return false;
      if (!q) return true;
      return (
        it.name.ru?.toLowerCase().includes(q) ||
        it.name.en?.toLowerCase().includes(q) ||
        it.id.includes(q)
      );
    });
  }, [items, query, typeFilter]);

  // Group by type for tab counts
  const byType = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((it) => { m[it.type] = (m[it.type] ?? 0) + 1; });
    return m;
  }, [items]);

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type tabs */}
        <div className="flex flex-wrap gap-1">
          <TypeBtn label={`Все (${items.length})`} active={typeFilter === ''} onClick={() => setTypeFilter('')} />
          {ITEM_TYPE_ORDER.map((t) => (
            <TypeBtn
              key={t}
              label={`${ITEM_TYPE_LABEL[t]} (${byType[t] ?? 0})`}
              active={typeFilter === t}
              onClick={() => setTypeFilter(t)}
            />
          ))}
        </div>

        {/* Search */}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск предметов..."
          className="flex-1 min-w-[180px] max-w-[280px] bg-bg-2 border border-line-2 px-3 py-2 font-sans text-[13px] text-ink placeholder:text-ink-faint focus:border-dbd-accent outline-none"
        />
      </div>

      <p className="label-mono text-[11px] text-ink-mute">{filtered.length} предметов</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item) => (
          <ItemRow key={item.id} item={item} onOpen={() => setSelected(item)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-ink-mute text-[14px] italic py-8 text-center">
          Ничего не найдено
        </p>
      )}

      {/* Modal */}
      <EntityModal open={!!selected} onClose={() => setSelected(null)}>
        {selected && <ItemModalBody item={selected} />}
      </EntityModal>
    </div>
  );
}

function TypeBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 label-mono text-[11px] border transition-colors duration-150',
        active
          ? 'border-line-ember text-dbd-bone bg-[rgba(184,67,31,.12)]'
          : 'border-line-1 text-ink-mute hover:border-line-2 hover:text-ink',
      )}
    >
      {label}
    </button>
  );
}

function ItemRow({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const rk = rarityKey(item.rarity ?? 'common');
  const ringColor = rarityColor(item.rarity ?? 'common');

  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-3 px-4 py-3 text-left border border-line-1 bg-bg-1 hover:border-line-ember hover:bg-bg-2 transition-colors duration-150 cursor-pointer"
    >
      <div
        className={cn('w-12 h-12 shrink-0 border flex items-center justify-center overflow-hidden', `rarity-bg-${rk}`)}
        style={{ borderColor: ringColor }}
      >
        <IconImg
          src={item.icon}
          alt={item.name.ru || item.name.en}
          size={42}
          fallback={<span className="text-ink-faint text-base">⚙</span>}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-sans text-[14px] font-semibold text-dbd-bone truncate">
          {item.name.ru || item.name.en}
        </span>
        <span className="font-sans text-[12px] truncate" style={{ color: ringColor }}>
          {rarityLabel(item.rarity ?? 'common')}
        </span>
      </div>

      <span className="label-mono text-[10px] px-2 py-1 border border-line-2 text-ink-mute shrink-0">
        {item.type}
      </span>
    </button>
  );
}

function ItemModalBody({ item }: { item: Item }) {
  const rk = rarityKey(item.rarity ?? 'common');
  const ringColor = rarityColor(item.rarity ?? 'common');

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <div
          className={cn('w-16 h-16 shrink-0 border flex items-center justify-center overflow-hidden', `rarity-bg-${rk}`)}
          style={{ borderColor: ringColor }}
        >
          <IconImg
            src={item.icon}
            alt={item.name.ru}
            size={56}
            fallback={<span className="text-ink-faint">⚙</span>}
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0 pt-1">
          <h2 className="m-0 font-sans font-bold text-[20px] text-dbd-bone leading-tight">
            {item.name.ru || item.name.en}
          </h2>
          <span className="font-sans text-[13px] text-ink-mute">{item.name.en}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetaCell label="Редкость" value={rarityLabel(item.rarity ?? 'common')} color={ringColor} />
        <MetaCell label="Тип" value={ITEM_TYPE_SINGULAR[item.type] ?? item.type} />
      </div>

      {(item.description?.ru || item.description?.en) && (
        <div className="flex flex-col gap-2 pt-2 border-t border-line-1">
          <span className="label-mono text-[11px] text-ink-mute">Описание</span>
          <p className="m-0 font-sans text-[14px] text-ink leading-[1.6] whitespace-pre-line">
            {formatDbdText(item.description?.ru || item.description?.en)}
          </p>
        </div>
      )}

      <div className="pt-2 border-t border-line-1">
        <Link
          href={`/addons?item=${item.type}`}
          className="ritual-btn ritual-btn-ghost inline-block px-4 py-2 text-[11px] no-underline"
        >
          → Аддоны для типа «{item.type}»
        </Link>
      </div>
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
