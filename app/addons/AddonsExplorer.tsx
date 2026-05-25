'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { rarityColor, rarityKey, rarityLabel } from '@/components/ui/shape-card';
import { EntityModal } from '@/components/ui/entity-modal';
import { IconImg } from '@/components/ui/icon-img';
import { SimilarGrid } from '@/components/ui/similar-grid';
import { splitDescription } from '@/lib/dbd-text';
import { DbdDescription } from '@/components/build/DbdDescription';
import {
  ITEM_TYPE_LABEL,
  ITEM_TYPE_SINGULAR,
  RARITY_ORDER,
  rarityScore,
} from '@/lib/ui/labels';
import type { Addon, Killer, Item, StatusEffect } from '@/lib/data';

type Mode = 'killer' | 'item';

type Props = {
  addons: Addon[];
  killers: Killer[];
  items: Item[];
  statusEffects?: StatusEffect[];
  initialKiller: string | null;
  initialItem: string | null;
};

// /addons doesn't surface 'misc' — only the five mainline item categories.
const ITEM_TYPES = ['medkit', 'toolbox', 'flashlight', 'map', 'key'] as const;

export function AddonsExplorer({ addons, killers, items, statusEffects, initialKiller, initialItem }: Props) {
  const effectsBySourceKey = useMemo(() => {
    const m = new Map<string, StatusEffect>();
    for (const e of statusEffects ?? []) {
      if (e.source_key) m.set(e.source_key, e);
      m.set(e.id, e);
    }
    return m;
  }, [statusEffects]);

  const router = useRouter();
  const pathname = usePathname();

  const [mode, setMode]         = useState<Mode>(initialItem ? 'item' : 'killer');
  const [killerId, setKillerId] = useState<string>(initialKiller ?? (killers[0]?.id ?? ''));
  const [itemType, setItemType] = useState<string>(initialItem ?? 'medkit');
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState<Addon | null>(null);

  // Reflect selection in URL when not in global-search mode
  useEffect(() => {
    if (query.trim()) return; // global search → don't pollute URL
    const params = new URLSearchParams();
    if (mode === 'killer') params.set('killer', killerId);
    else params.set('item', itemType);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [mode, killerId, itemType, pathname, router, query]);

  const isGlobalSearch = query.trim().length > 0;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = addons;

    if (isGlobalSearch) {
      list = list.filter(
        (a) =>
          a.name.ru?.toLowerCase().includes(q) ||
          a.name.en?.toLowerCase().includes(q) ||
          a.id.includes(q),
      );
    } else {
      list = list.filter((a) => {
        if (mode === 'killer') return a.scope.type === 'killer' && a.scope.killerId === killerId;
        return a.scope.type === 'item' && a.scope.itemType === itemType;
      });
    }

    return list.sort((a, b) => {
      const r = rarityScore(a.rarity) - rarityScore(b.rarity);
      return r !== 0 ? r : (a.name.ru ?? '').localeCompare(b.name.ru ?? '');
    });
  }, [addons, mode, killerId, itemType, query, isGlobalSearch]);

  const groups = useMemo(() => {
    const m: Record<string, Addon[]> = {};
    filtered.forEach((a) => { (m[a.rarity] ??= []).push(a); });
    return m;
  }, [filtered]);

  const selectedKiller = killers.find((k) => k.id === killerId);

  return (
    <div className="flex flex-col gap-5">
      {/* Mode tabs */}
      <div className="flex">
        {(['killer', 'item'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setQuery(''); }}
            disabled={isGlobalSearch}
            className={cn(
              'px-5 py-2.5 label-mono text-[11px] border-b-2 transition-all duration-150',
              isGlobalSearch && 'opacity-50',
              mode === m && !isGlobalSearch
                ? 'border-b-dbd-accent text-dbd-bone bg-[rgba(184,67,31,.08)]'
                : 'border-b-line-1 text-ink-mute hover:text-ink',
            )}
          >
            {m === 'killer' ? 'По убийце' : 'По предмету'}
          </button>
        ))}
      </div>

      {/* Selector */}
      {!isGlobalSearch && (
        <div className="flex flex-wrap items-center gap-3">
          {mode === 'killer' ? (
            <KillerDropdown killers={killers} value={killerId} onChange={setKillerId} selectedKiller={selectedKiller} />
          ) : (
            <div className="flex flex-wrap gap-1">
              {ITEM_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setItemType(t)}
                  className={cn(
                    'px-3 py-2 label-mono text-[11px] border transition-colors duration-150',
                    itemType === t
                      ? 'border-line-ember text-dbd-bone bg-[rgba(184,67,31,.12)]'
                      : 'border-line-1 text-ink-mute hover:border-line-2 hover:text-ink',
                  )}
                >
                  {ITEM_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-[420px]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по всем аддонам..."
            className="w-full bg-bg-2 border-2 border-line-2 px-4 py-2.5 font-sans text-[14px] text-ink placeholder:text-ink-faint focus:border-dbd-accent outline-none transition-colors duration-150"
          />
          {isGlobalSearch && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 label-mono text-[9px] text-dbd-accent pointer-events-none">
              ГЛОБАЛЬНЫЙ
            </span>
          )}
        </div>
        {isGlobalSearch && (
          <p className="label-mono text-[10px] text-ink-faint">
            Поиск по всем {addons.length} аддонам · выбор убийцы/предмета временно игнорируется
          </p>
        )}
      </div>

      <p className="label-mono text-[11px] text-ink-mute">{filtered.length} аддонов</p>

      {/* Grouped by rarity */}
      {filtered.length === 0 ? (
        <p className="text-ink-mute text-[14px] italic py-8 text-center">Ничего не найдено</p>
      ) : (
        <div className="flex flex-col gap-6">
          {RARITY_ORDER.map((r) => groups[r]?.length && (
            <RaritySection key={r} rarity={r} addons={groups[r]} onOpen={setSelected} />
          )).filter(Boolean)}
        </div>
      )}

      <EntityModal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <AddonModalBody
            addon={selected}
            killers={killers}
            items={items}
            allAddons={addons}
            effectsBySourceKey={effectsBySourceKey}
            onPick={setSelected}
          />
        )}
      </EntityModal>
    </div>
  );
}

/* ───────── Killer dropdown with icons ───────── */

function KillerDropdown({
  killers, value, onChange, selectedKiller,
}: {
  killers: Killer[];
  value: string;
  onChange: (id: string) => void;
  selectedKiller?: Killer;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 min-w-[260px] bg-bg-2 border border-line-2 px-3 py-2 text-left hover:border-line-ember transition-colors"
      >
        {selectedKiller ? (
          <>
            <div className="w-7 h-7 shrink-0 border border-line-1 bg-bg-1 flex items-center justify-center overflow-hidden">
              <IconImg src={selectedKiller.icon} alt={selectedKiller.name.ru} size={26} fallback={<span className="text-ink-faint text-[12px]">⛧</span>} />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-sans text-[13px] text-dbd-bone leading-tight truncate">{selectedKiller.name.ru}</span>
              <span className="label-mono text-[9px] text-ink-faint truncate">{selectedKiller.power}</span>
            </div>
          </>
        ) : (
          <span className="font-sans text-[13px] text-ink-mute">Выбрать убийцу…</span>
        )}
        <span className="text-ink-faint text-[10px]">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[150]" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-[151] w-[320px] max-h-[400px] overflow-y-auto bg-bg-1 border border-line-ember shadow-[0_18px_40px_rgba(0,0,0,.6)]">
            {killers.map((k) => (
              <button
                key={k.id}
                onClick={() => { onChange(k.id); setOpen(false); }}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-bg-2 transition-colors',
                  k.id === value && 'bg-[rgba(184,67,31,.08)]',
                )}
              >
                <div className="w-8 h-8 shrink-0 border border-line-1 bg-bg-2 flex items-center justify-center overflow-hidden">
                  <IconImg src={k.icon} alt={k.name.ru} size={28} fallback={<span className="text-ink-faint text-[12px]">⛧</span>} />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-sans text-[13px] text-dbd-bone leading-tight truncate">{k.name.ru}</span>
                  <span className="label-mono text-[9px] text-ink-faint truncate">{k.power}</span>
                </div>
                {k.id === value && <span className="text-dbd-accent text-[10px]">✦</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ───────── Section + Row ───────── */

function RaritySection({
  rarity, addons, onOpen,
}: {
  rarity: string;
  addons: Addon[];
  onOpen: (a: Addon) => void;
}) {
  const color = rarityColor(rarity);
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="m-0 label-mono text-[12px] tracking-[.2em] font-semibold" style={{ color }}>
          {rarityLabel(rarity)}
        </h2>
        <span className="label-mono text-[10px] text-ink-faint">({addons.length})</span>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${color}55, transparent)` }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {addons.map((a) => <AddonRow key={a.id} addon={a} onOpen={() => onOpen(a)} />)}
      </div>
    </section>
  );
}

function AddonRow({ addon, onOpen }: { addon: Addon; onOpen: () => void }) {
  const rk = rarityKey(addon.rarity ?? 'common');
  const ringColor = rarityColor(addon.rarity ?? 'common');

  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-3 px-4 py-3 text-left border border-line-1 bg-bg-1 hover:border-line-ember hover:bg-bg-2 transition-colors duration-150 cursor-pointer"
    >
      <div
        className={cn('w-12 h-12 shrink-0 border-2 flex items-center justify-center overflow-hidden', `rarity-bg-${rk}`)}
        style={{ borderColor: ringColor }}
      >
        <IconImg src={addon.icon} alt={addon.name.ru || addon.name.en} size={42} fallback={<span className="text-ink-faint">✦</span>} />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-sans text-[14px] font-semibold text-dbd-bone leading-tight truncate">{addon.name.ru || addon.name.en}</span>
        <span className="font-sans text-[12px] mt-0.5 truncate" style={{ color: ringColor }}>{rarityLabel(addon.rarity)}</span>
      </div>
    </button>
  );
}

/* ───────── Modal ───────── */

function AddonModalBody({
  addon, killers, items, allAddons, effectsBySourceKey, onPick,
}: {
  addon: Addon;
  killers: Killer[];
  items: Item[];
  allAddons: Addon[];
  effectsBySourceKey: Map<string, StatusEffect>;
  onPick: (a: Addon) => void;
}) {
  const rk = rarityKey(addon.rarity ?? 'common');
  const ringColor = rarityColor(addon.rarity ?? 'common');
  const { mechanics, flavor } = splitDescription(addon.description?.ru);

  const scope = addon.scope;
  let scopeLabel: string;
  let scopeIcon: string | undefined;
  if (scope.type === 'killer') {
    const killer = killers.find((k) => k.id === scope.killerId);
    scopeLabel = killer ? `${killer.name.ru} — ${killer.power}` : scope.killerId;
    scopeIcon = killer?.icon;
  } else {
    scopeLabel = ITEM_TYPE_SINGULAR[scope.itemType] ?? scope.itemType;
    scopeIcon = items.find((i) => i.type === scope.itemType)?.icon;
  }

  const similar = useMemo(() => {
    return allAddons
      .filter((a) => {
        if (a.id === addon.id) return false;
        if (scope.type === 'killer') return a.scope.type === 'killer' && a.scope.killerId === scope.killerId;
        return a.scope.type === 'item' && a.scope.itemType === scope.itemType;
      })
      .sort((a, b) => rarityScore(a.rarity) - rarityScore(b.rarity))
      .slice(0, 8);
  }, [allAddons, addon.id, scope]);

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className={cn('w-20 h-20 shrink-0 border-2 flex items-center justify-center overflow-hidden', `rarity-bg-${rk}`)}
          style={{ borderColor: ringColor }}
        >
          <IconImg src={addon.icon} alt={addon.name.ru} size={72} fallback={<span className="text-ink-faint">✦</span>} />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0 pt-1">
          <h2 className="m-0 font-sans font-bold text-[22px] text-dbd-bone leading-tight">{addon.name.ru || addon.name.en}</h2>
          <span className="font-sans text-[13px] text-ink-mute">{addon.name.en}</span>
          <span className="label-mono text-[11px] font-semibold mt-1" style={{ color: ringColor }}>{rarityLabel(addon.rarity)}</span>
          <div className="flex items-center gap-2 mt-1">
            {scopeIcon && (
              <div className="w-6 h-6 shrink-0 border border-line-1 bg-bg-2 flex items-center justify-center overflow-hidden">
                <IconImg src={scopeIcon} alt="" size={22} fallback={null} />
              </div>
            )}
            <span className="label-mono text-[10px] text-ink-faint">{scope.type === 'killer' ? 'Убийца:' : 'Тип предмета:'}</span>
            <span className="font-sans text-[12px] text-ink">{scopeLabel}</span>
          </div>
        </div>
      </div>

      {mechanics && (
        <div className="flex flex-col gap-2">
          <span className="label-mono text-[10px] text-ink-mute">Механика</span>
          <DbdDescription raw={mechanics} effectsBySourceKey={effectsBySourceKey} />
        </div>
      )}

      {flavor && (
        <div className="flex flex-col gap-2 pt-2 border-t border-line-1">
          <span className="label-mono text-[10px] text-ink-faint">Описание</span>
          <p className="m-0 font-sans text-[13px] text-ink-mute italic leading-[1.6] whitespace-pre-line">{flavor}</p>
        </div>
      )}

      {similar.length > 0 && (
        <div className="flex flex-col gap-3 pt-2 border-t border-line-1">
          <span className="label-mono text-[10px] text-ink-mute">
            {scope.type === 'killer' ? 'Ещё аддоны этого убийцы' : 'Ещё аддоны для этого типа'}
          </span>
          <SimilarGrid items={similar} onPick={onPick} />
        </div>
      )}
    </div>
  );
}
