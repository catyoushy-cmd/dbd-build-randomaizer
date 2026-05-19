'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatDbdText } from '@/lib/dbd-text';
import { rarityColor, rarityKey, rarityLabel } from '@/components/ui/shape-card';
import { EntityModal } from '@/components/ui/entity-modal';
import { IconImg } from '@/components/ui/icon-img';
import type { Addon, Killer } from '@/lib/data';

type Mode = 'killer' | 'item';

type Props = {
  addons: Addon[];
  killers: Killer[];
  initialKiller: string | null;
  initialItem: string | null;
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
  toolbox:    'Инструменты', // pluralia tantum
  map:        'Карта',
  key:        'Ключ',
};

const ITEM_TYPES = ['medkit', 'toolbox', 'flashlight', 'map', 'key'] as const;

export function AddonsExplorer({ addons, killers, initialKiller, initialItem }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine initial mode + selection
  const [mode, setMode] = useState<Mode>(initialItem ? 'item' : 'killer');
  const [killerId, setKillerId] = useState<string>(
    initialKiller ?? (killers[0]?.id ?? ''),
  );
  const [itemType, setItemType] = useState<string>(initialItem ?? 'medkit');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Addon | null>(null);

  // Reflect selection in URL (so links from /items work and are shareable)
  useEffect(() => {
    const params = new URLSearchParams();
    if (mode === 'killer') params.set('killer', killerId);
    else params.set('item', itemType);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [mode, killerId, itemType, pathname, router]);

  // Filter addons by current selection + search query
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return addons
      .filter((a) => {
        if (mode === 'killer') {
          return a.scope.type === 'killer' && a.scope.killerId === killerId;
        }
        return a.scope.type === 'item' && a.scope.itemType === itemType;
      })
      .filter((a) => {
        if (!q) return true;
        return (
          a.name.ru?.toLowerCase().includes(q) ||
          a.name.en?.toLowerCase().includes(q) ||
          a.id.includes(q)
        );
      })
      .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
  }, [addons, mode, killerId, itemType, query]);

  // Group by rarity for visual separation
  const groups = useMemo(() => {
    const m: Record<string, Addon[]> = {};
    filtered.forEach((a) => {
      (m[a.rarity] ??= []).push(a);
    });
    return m;
  }, [filtered]);

  return (
    <div className="flex flex-col gap-5">
      {/* Mode tabs */}
      <div className="flex">
        {(['killer', 'item'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'px-5 py-2.5 label-mono text-[11px] border-b-2 transition-all duration-150',
              mode === m
                ? 'border-b-dbd-accent text-dbd-bone bg-[rgba(184,67,31,.08)]'
                : 'border-b-line-1 text-ink-mute hover:text-ink',
            )}
          >
            {m === 'killer' ? 'По убийце' : 'По предмету'}
          </button>
        ))}
      </div>

      {/* Selector */}
      <div className="flex flex-wrap items-center gap-3">
        {mode === 'killer' ? (
          <select
            value={killerId}
            onChange={(e) => setKillerId(e.target.value)}
            className="bg-bg-2 border border-line-2 px-3 py-2 font-sans text-[13px] text-ink focus:border-dbd-accent outline-none min-w-[220px]"
          >
            {killers.map((k) => (
              <option key={k.id} value={k.id}>{k.name.ru} — {k.power}</option>
            ))}
          </select>
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

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск аддонов..."
          className="flex-1 min-w-[180px] max-w-[280px] bg-bg-2 border border-line-2 px-3 py-2 font-sans text-[13px] text-ink placeholder:text-ink-faint focus:border-dbd-accent outline-none"
        />
      </div>

      <p className="label-mono text-[11px] text-ink-mute">{filtered.length} аддонов</p>

      {/* Grouped by rarity */}
      {filtered.length === 0 ? (
        <p className="text-ink-mute text-[14px] italic py-8 text-center">
          Нет аддонов под текущий выбор
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {RARITY_ORDER.filter((r) => groups[r]?.length).map((r) => (
            <RaritySection
              key={r}
              rarity={r}
              addons={groups[r]}
              onOpen={setSelected}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <EntityModal open={!!selected} onClose={() => setSelected(null)}>
        {selected && <AddonModalBody addon={selected} killers={killers} />}
      </EntityModal>
    </div>
  );
}

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'very-rare', 'veryrare', 'ultra-rare', 'ultra', 'event'] as const;

function RaritySection({
  rarity,
  addons,
  onOpen,
}: {
  rarity: string;
  addons: Addon[];
  onOpen: (a: Addon) => void;
}) {
  const color = rarityColor(rarity);
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="m-0 label-mono text-[12px] tracking-[.18em]" style={{ color }}>
          {rarityLabel(rarity)}
        </h2>
        <span className="label-mono text-[10px] text-ink-faint">({addons.length})</span>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${color}33, transparent)` }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {addons.map((a) => (
          <AddonRow key={a.id} addon={a} onOpen={() => onOpen(a)} />
        ))}
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
        className={cn('w-12 h-12 shrink-0 border flex items-center justify-center overflow-hidden', `rarity-bg-${rk}`)}
        style={{ borderColor: ringColor }}
      >
        <IconImg
          src={addon.icon}
          alt={addon.name.ru || addon.name.en}
          size={42}
          fallback={<span className="text-ink-faint text-base">✦</span>}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-sans text-[14px] font-semibold text-dbd-bone truncate">
          {addon.name.ru || addon.name.en}
        </span>
        <span className="font-sans text-[12px] truncate" style={{ color: ringColor }}>
          {rarityLabel(addon.rarity)}
        </span>
      </div>
    </button>
  );
}

function AddonModalBody({ addon, killers }: { addon: Addon; killers: Killer[] }) {
  const rk = rarityKey(addon.rarity ?? 'common');
  const ringColor = rarityColor(addon.rarity ?? 'common');

  const scope = addon.scope;
  let scopeLabel: string;
  if (scope.type === 'killer') {
    const killer = killers.find((k) => k.id === scope.killerId);
    scopeLabel = killer ? `${killer.name.ru} (${killer.power})` : scope.killerId;
  } else {
    const t = scope.itemType;
    scopeLabel = ITEM_TYPE_SINGULAR[t] ?? t;
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <div
          className={cn('w-16 h-16 shrink-0 border flex items-center justify-center overflow-hidden', `rarity-bg-${rk}`)}
          style={{ borderColor: ringColor }}
        >
          <IconImg
            src={addon.icon}
            alt={addon.name.ru}
            size={56}
            fallback={<span className="text-ink-faint">✦</span>}
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0 pt-1">
          <h2 className="m-0 font-sans font-bold text-[20px] text-dbd-bone leading-tight">
            {addon.name.ru || addon.name.en}
          </h2>
          <span className="font-sans text-[13px] text-ink-mute">{addon.name.en}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 border border-line-1 bg-bg-2 px-3 py-2">
          <span className="label-mono text-[10px] text-ink-faint">Редкость</span>
          <span className="font-sans text-[13px] font-semibold" style={{ color: ringColor }}>
            {rarityLabel(addon.rarity)}
          </span>
        </div>
        <div className="flex flex-col gap-1 border border-line-1 bg-bg-2 px-3 py-2">
          <span className="label-mono text-[10px] text-ink-faint">
            {addon.scope.type === 'killer' ? 'Убийца' : 'Тип предмета'}
          </span>
          <span className="font-sans text-[13px] font-semibold text-ink">{scopeLabel}</span>
        </div>
      </div>

      {(addon.description?.ru || addon.description?.en) && (
        <div className="flex flex-col gap-2 pt-2 border-t border-line-1">
          <span className="label-mono text-[11px] text-ink-mute">Описание</span>
          <p className="m-0 font-sans text-[14px] text-ink leading-[1.6] whitespace-pre-line">
            {formatDbdText(addon.description?.ru || addon.description?.en)}
          </p>
        </div>
      )}
    </div>
  );
}
