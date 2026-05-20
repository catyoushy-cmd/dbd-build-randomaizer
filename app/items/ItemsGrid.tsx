'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { rarityColor, rarityKey, rarityLabel } from '@/components/ui/shape-card';
import { EntityModal } from '@/components/ui/entity-modal';
import { IconImg } from '@/components/ui/icon-img';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { EntityTooltipBody } from '@/components/ui/entity-tooltip';
import { splitDescription, formatDbdText } from '@/lib/dbd-text';
import type { Item, Addon } from '@/lib/data';

type Props = {
  items: Item[];
  addons: Addon[];
};

const ITEM_TYPE_LABEL: Record<string, string> = {
  flashlight: 'Фонарики',
  medkit:     'Аптечки',
  toolbox:    'Инструменты',
  map:        'Карты',
  key:        'Ключи',
  misc:       'Особые',
};
const ITEM_TYPE_SINGULAR: Record<string, string> = {
  flashlight: 'Фонарик',
  medkit:     'Аптечка',
  toolbox:    'Инструменты',
  map:        'Карта',
  key:        'Ключ',
  misc:       'Особый предмет',
};
const ITEM_TYPE_ORDER = ['medkit', 'toolbox', 'flashlight', 'map', 'key', 'misc'] as const;

const RARITY_RANK: Record<string, number> = {
  'ultra-rare': 0, ultra: 0,
  'very-rare':  1, veryrare: 1,
  rare:         2,
  uncommon:     3,
  common:       4,
};

function rarityScore(r?: string): number {
  return RARITY_RANK[r ?? 'common'] ?? 99;
}

export function ItemsGrid({ items, addons }: Props) {
  const [typeFilter, setTypeFilter]   = useState<string>('');
  const [query, setQuery]             = useState('');
  const [showEvent, setShowEvent]     = useState(false);
  const [selected, setSelected]       = useState<Item | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items
      .filter((it) => {
        if (!showEvent && it.available_by_default === false) return false;
        if (typeFilter && it.type !== typeFilter) return false;
        if (!q) return true;
        return (
          it.name.ru?.toLowerCase().includes(q) ||
          it.name.en?.toLowerCase().includes(q) ||
          it.id.includes(q)
        );
      })
      .sort((a, b) => {
        const r = rarityScore(a.rarity) - rarityScore(b.rarity);
        if (r !== 0) return r;
        return (a.name.ru ?? '').localeCompare(b.name.ru ?? '');
      });
  }, [items, typeFilter, query, showEvent]);

  const byType = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((it) => {
      if (!showEvent && it.available_by_default === false) return;
      m[it.type] = (m[it.type] ?? 0) + 1;
    });
    return m;
  }, [items, showEvent]);

  const totalVisible = items.filter((it) => showEvent || it.available_by_default !== false).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Type tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <TypeBtn label={`Все (${totalVisible})`} active={typeFilter === ''} onClick={() => setTypeFilter('')} />
        {ITEM_TYPE_ORDER.map((t) => byType[t] && (
          <TypeBtn
            key={t}
            label={`${ITEM_TYPE_LABEL[t]} (${byType[t]})`}
            active={typeFilter === t}
            onClick={() => setTypeFilter(t)}
          />
        ))}
      </div>

      {/* Search + event toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск предметов..."
            className="w-full bg-bg-2 border-2 border-line-2 px-4 py-2.5 font-sans text-[14px] text-ink placeholder:text-ink-faint focus:border-dbd-accent outline-none transition-colors duration-150"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showEvent}
            onChange={(e) => setShowEvent(e.target.checked)}
            className="accent-dbd-accent w-4 h-4"
          />
          <span className="font-sans text-[13px] text-ink-mute">Показать ивент-предметы</span>
        </label>
      </div>

      <p className="label-mono text-[11px] text-ink-mute">{filtered.length} предметов</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-ink-mute text-[14px] italic py-8 text-center">Ничего не найдено</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((it) => <ItemRow key={it.id} item={it} onOpen={() => setSelected(it)} />)}
        </div>
      )}

      <EntityModal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <ItemModalBody
            item={selected}
            allItems={items}
            allAddons={addons}
            onPick={setSelected}
          />
        )}
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
  const eventTag = item.available_by_default === false;

  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-3 px-4 py-3 text-left border border-line-1 bg-bg-1 hover:border-line-ember hover:bg-bg-2 transition-colors duration-150 cursor-pointer"
    >
      <div
        className={cn('w-14 h-14 shrink-0 border-2 flex items-center justify-center overflow-hidden', `rarity-bg-${rk}`)}
        style={{ borderColor: ringColor }}
      >
        <IconImg src={item.icon} alt={item.name.ru || item.name.en} size={48} fallback={<span className="text-ink-faint">⚙</span>} />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-sans text-[14px] font-semibold text-dbd-bone leading-tight truncate">
          {item.name.ru || item.name.en}
        </span>
        <span className="font-sans text-[12px] mt-0.5 truncate" style={{ color: ringColor }}>
          {rarityLabel(item.rarity ?? 'common')} · {ITEM_TYPE_SINGULAR[item.type] ?? item.type}
        </span>
      </div>
      {eventTag && (
        <span className="label-mono text-[9px] px-2 py-0.5 border border-line-1 text-ink-faint shrink-0">event</span>
      )}
    </button>
  );
}

/* ───────── Modal ───────── */

function ItemModalBody({
  item,
  allItems,
  allAddons,
  onPick,
}: {
  item: Item;
  allItems: Item[];
  allAddons: Addon[];
  onPick: (i: Item) => void;
}) {
  const rk = rarityKey(item.rarity ?? 'common');
  const ringColor = rarityColor(item.rarity ?? 'common');
  const { mechanics, flavor } = splitDescription(item.description?.ru);

  const compatibleAddons = useMemo(() => {
    return allAddons
      .filter((a) => a.scope.type === 'item' && a.scope.itemType === item.type && a.available_by_default !== false)
      .sort((a, b) => {
        const r = rarityScore(a.rarity) - rarityScore(b.rarity);
        return r !== 0 ? r : (a.name.ru ?? '').localeCompare(b.name.ru ?? '');
      });
  }, [allAddons, item.type]);

  const similar = useMemo(() => {
    return allItems
      .filter((i) => i.type === item.type && i.id !== item.id && i.available_by_default !== false)
      .sort((a, b) => rarityScore(a.rarity) - rarityScore(b.rarity))
      .slice(0, 8);
  }, [allItems, item.type, item.id]);

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className={cn('w-20 h-20 shrink-0 border-2 flex items-center justify-center overflow-hidden', `rarity-bg-${rk}`)}
          style={{ borderColor: ringColor }}
        >
          <IconImg src={item.icon} alt={item.name.ru} size={72} fallback={<span className="text-ink-faint">⚙</span>} />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0 pt-1">
          <h2 className="m-0 font-sans font-bold text-[22px] text-dbd-bone leading-tight">{item.name.ru || item.name.en}</h2>
          <span className="font-sans text-[13px] text-ink-mute">{item.name.en}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="label-mono text-[11px] font-semibold" style={{ color: ringColor }}>
              {rarityLabel(item.rarity ?? 'common')}
            </span>
            <span className="text-ink-faint">·</span>
            <span className="label-mono text-[11px] text-ink-mute">{ITEM_TYPE_SINGULAR[item.type] ?? item.type}</span>
          </div>
        </div>
      </div>

      {/* Mechanics */}
      {mechanics && (
        <div className="flex flex-col gap-2">
          <span className="label-mono text-[10px] text-ink-mute">Механика</span>
          <p className="m-0 font-sans text-[14px] text-ink leading-[1.65] whitespace-pre-line">
            {formatDbdText(mechanics)}
          </p>
        </div>
      )}

      {/* Flavor */}
      {flavor && (
        <div className="flex flex-col gap-2 pt-2 border-t border-line-1">
          <span className="label-mono text-[10px] text-ink-faint">Описание</span>
          <p className="m-0 font-sans text-[13px] text-ink-mute italic leading-[1.6] whitespace-pre-line">
            {flavor}
          </p>
        </div>
      )}

      {/* Compatible addons */}
      {compatibleAddons.length > 0 && (
        <div className="flex flex-col gap-3 pt-2 border-t border-line-1">
          <div className="flex items-center justify-between">
            <span className="label-mono text-[10px] text-ink-mute">Совместимые аддоны ({compatibleAddons.length})</span>
            <Link
              href={`/addons?item=${item.type}`}
              className="label-mono text-[10px] text-dbd-accent hover:text-dbd-glow no-underline"
              onClick={(e) => e.stopPropagation()}
            >
              Все →
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {compatibleAddons.slice(0, 16).map((a) => <AddonChip key={a.id} addon={a} />)}
          </div>
        </div>
      )}

      {/* Similar items */}
      {similar.length > 0 && (
        <div className="flex flex-col gap-3 pt-2 border-t border-line-1">
          <span className="label-mono text-[10px] text-ink-mute">Похожие предметы</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {similar.map((s) => (
              <button
                key={s.id}
                onClick={() => onPick(s)}
                className="flex items-center gap-2 px-2 py-2 border border-line-1 bg-bg-2 hover:border-line-ember transition-colors duration-150 text-left cursor-pointer"
              >
                <div
                  className={cn('w-9 h-9 shrink-0 border flex items-center justify-center overflow-hidden', `rarity-bg-${rarityKey(s.rarity ?? 'common')}`)}
                  style={{ borderColor: rarityColor(s.rarity ?? 'common') }}
                >
                  <IconImg src={s.icon} alt={s.name.ru} size={32} fallback={null} />
                </div>
                <span className="font-sans text-[12px] text-ink leading-tight truncate">{s.name.ru || s.name.en}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddonChip({ addon }: { addon: Addon }) {
  const rk = rarityKey(addon.rarity ?? 'common');
  const ringColor = rarityColor(addon.rarity ?? 'common');
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            className={cn('w-12 h-12 border-2 flex items-center justify-center overflow-hidden cursor-help', `rarity-bg-${rk}`)}
            style={{ borderColor: ringColor }}
          >
            <IconImg src={addon.icon} alt={addon.name.ru} size={40} fallback={null} />
          </div>
        }
      />
      <TooltipContent side="top" style={{ background: 'transparent', border: 'none', padding: 0 }}>
        <EntityTooltipBody
          title={addon.name.ru}
          subtitle={{ text: rarityLabel(addon.rarity).toUpperCase(), color: ringColor }}
          description={addon.description?.ru ? formatDbdText(addon.description.ru) : undefined}
        />
      </TooltipContent>
    </Tooltip>
  );
}
