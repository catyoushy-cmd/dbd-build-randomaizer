'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { splitDescription } from '@/lib/dbd-text';
import { DbdDescription } from '@/components/build/DbdDescription';
import { rarityColor, rarityKey, rarityLabel } from '@/components/ui/shape-card';
import { EntityModal } from '@/components/ui/entity-modal';
import { IconImg } from '@/components/ui/icon-img';
import { SimilarGrid } from '@/components/ui/similar-grid';
import { PLAYER_ROLE_DATIVE, rarityScore } from '@/lib/ui/labels';
import type { Offering, StatusEffect } from '@/lib/data';

type Props = {
  offerings: Offering[];
  statusEffects?: StatusEffect[];
};

type Role = '' | 'survivor' | 'killer' | 'both';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: '',         label: 'Все' },
  { value: 'survivor', label: 'Выжившим' },
  { value: 'killer',   label: 'Убийцам' },
  { value: 'both',     label: 'Общие' },
];

export function OfferingsGrid({ offerings, statusEffects }: Props) {
  const effectsBySourceKey = useMemo(() => {
    const m = new Map<string, StatusEffect>();
    for (const e of statusEffects ?? []) {
      if (e.source_key) m.set(e.source_key, e);
      m.set(e.id, e);
    }
    return m;
  }, [statusEffects]);

  const [roleFilter, setRoleFilter]   = useState<Role>('');
  const [query, setQuery]             = useState('');
  const [showEvent, setShowEvent]     = useState(false);
  const [selected, setSelected]       = useState<Offering | null>(null);

  const isGlobalSearch = query.trim().length > 0;

  const visible = useMemo(() => {
    return offerings.filter((o) => showEvent || o.available_by_default !== false);
  }, [offerings, showEvent]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { '': visible.length };
    visible.forEach((o) => { m[o.role] = (m[o.role] ?? 0) + 1; });
    return m;
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = visible;

    if (isGlobalSearch) {
      list = list.filter(
        (o) =>
          o.name.ru?.toLowerCase().includes(q) ||
          o.name.en?.toLowerCase().includes(q) ||
          o.id.includes(q),
      );
    } else if (roleFilter) {
      list = list.filter((o) => o.role === roleFilter);
    }

    return list.sort((a, b) => {
      const r = rarityScore(a.rarity) - rarityScore(b.rarity);
      return r !== 0 ? r : (a.name.ru ?? '').localeCompare(b.name.ru ?? '');
    });
  }, [visible, roleFilter, query, isGlobalSearch]);

  // Group by role for non-search view
  const groups = useMemo(() => {
    const m: Record<string, Offering[]> = {};
    filtered.forEach((o) => { (m[o.role] ??= []).push(o); });
    return m;
  }, [filtered]);

  return (
    <div className="flex flex-col gap-5">
      {/* Role tabs */}
      <div className="flex flex-wrap gap-1">
        {ROLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRoleFilter(opt.value)}
            disabled={isGlobalSearch}
            className={cn(
              'px-3 py-2 label-mono text-[11px] border transition-colors duration-150',
              isGlobalSearch && 'opacity-50',
              roleFilter === opt.value && !isGlobalSearch
                ? 'border-line-ember text-dbd-bone bg-[rgba(184,67,31,.12)]'
                : 'border-line-1 text-ink-mute hover:border-line-2 hover:text-ink',
            )}
          >
            {opt.label} ({opt.value === '' ? counts[''] : (counts[opt.value] ?? 0)})
          </button>
        ))}
      </div>

      {/* Search + event toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[420px]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по всем подношениям..."
            className="w-full bg-bg-2 border-2 border-line-2 px-4 py-2.5 font-sans text-[14px] text-ink placeholder:text-ink-faint focus:border-dbd-accent outline-none transition-colors duration-150"
          />
          {isGlobalSearch && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 label-mono text-[9px] text-dbd-accent pointer-events-none">
              ГЛОБАЛЬНЫЙ
            </span>
          )}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showEvent}
            onChange={(e) => setShowEvent(e.target.checked)}
            className="accent-dbd-accent w-4 h-4"
          />
          <span className="font-sans text-[13px] text-ink-mute">Показать ивент-подношения</span>
        </label>
      </div>

      <p className="label-mono text-[11px] text-ink-mute">{filtered.length} подношений</p>

      {/* Render */}
      {filtered.length === 0 ? (
        <p className="text-ink-mute text-[14px] italic py-8 text-center">Ничего не найдено</p>
      ) : isGlobalSearch ? (
        // Flat list during global search
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((o) => <OfferingRow key={o.id} offering={o} onOpen={() => setSelected(o)} />)}
        </div>
      ) : (
        // Grouped by role
        <div className="flex flex-col gap-6">
          {(['survivor', 'killer', 'both'] as const).map((r) => groups[r]?.length ? (
            <RoleSection key={r} role={r} offerings={groups[r]} onOpen={setSelected} />
          ) : null)}
        </div>
      )}

      <EntityModal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <OfferingModalBody
            offering={selected}
            allOfferings={offerings}
            effectsBySourceKey={effectsBySourceKey}
            onPick={setSelected}
          />
        )}
      </EntityModal>
    </div>
  );
}

function RoleSection({
  role, offerings, onOpen,
}: {
  role: 'survivor' | 'killer' | 'both';
  offerings: Offering[];
  onOpen: (o: Offering) => void;
}) {
  const accent = role === 'killer' ? 'var(--dbd-blood)' : role === 'survivor' ? 'var(--dbd-accent)' : 'var(--dbd-brass)';
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="m-0 label-mono text-[12px] tracking-[.2em] font-semibold" style={{ color: accent }}>
          {PLAYER_ROLE_DATIVE[role]}
        </h2>
        <span className="label-mono text-[10px] text-ink-faint">({offerings.length})</span>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${accent}55, transparent)` }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {offerings.map((o) => <OfferingRow key={o.id} offering={o} onOpen={() => onOpen(o)} />)}
      </div>
    </section>
  );
}

function OfferingRow({ offering: o, onOpen }: { offering: Offering; onOpen: () => void }) {
  const rk = rarityKey(o.rarity ?? 'common');
  const ringColor = rarityColor(o.rarity ?? 'common');
  const isEvent = o.available_by_default === false;

  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-3 px-4 py-3 text-left border border-line-1 bg-bg-1 hover:border-line-ember hover:bg-bg-2 transition-colors duration-150 cursor-pointer"
    >
      <div
        className={cn('w-12 h-12 shrink-0 border-2 flex items-center justify-center overflow-hidden', `rarity-bg-${rk}`)}
        style={{ borderColor: ringColor }}
      >
        <IconImg src={o.icon} alt={o.name.ru || o.name.en} size={42} fallback={<span className="text-ink-faint">✦</span>} />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-sans text-[14px] font-semibold text-dbd-bone leading-tight truncate">{o.name.ru || o.name.en}</span>
        <span className="font-sans text-[12px] mt-0.5 truncate" style={{ color: ringColor }}>{rarityLabel(o.rarity ?? 'common')}</span>
      </div>
      <span className="label-mono text-[9px] px-2 py-0.5 border border-line-2 text-ink-mute shrink-0">
        {PLAYER_ROLE_DATIVE[o.role]}
      </span>
      {isEvent && (
        <span className="label-mono text-[9px] text-ink-faint shrink-0">event</span>
      )}
    </button>
  );
}

/* ───────── Modal ───────── */

function OfferingModalBody({
  offering: o, allOfferings, effectsBySourceKey, onPick,
}: {
  offering: Offering;
  allOfferings: Offering[];
  effectsBySourceKey: Map<string, StatusEffect>;
  onPick: (o: Offering) => void;
}) {
  const rk = rarityKey(o.rarity ?? 'common');
  const ringColor = rarityColor(o.rarity ?? 'common');
  const { mechanics, flavor } = splitDescription(o.description?.ru);

  const similar = useMemo(() => {
    return allOfferings
      .filter((x) => x.id !== o.id && x.role === o.role && x.available_by_default !== false)
      .sort((a, b) => rarityScore(a.rarity) - rarityScore(b.rarity))
      .slice(0, 6);
  }, [allOfferings, o.id, o.role]);

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <div
          className={cn('w-20 h-20 shrink-0 border-2 flex items-center justify-center overflow-hidden', `rarity-bg-${rk}`)}
          style={{ borderColor: ringColor }}
        >
          <IconImg src={o.icon} alt={o.name.ru} size={72} fallback={<span className="text-ink-faint">✦</span>} />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0 pt-1">
          <h2 className="m-0 font-sans font-bold text-[22px] text-dbd-bone leading-tight">{o.name.ru || o.name.en}</h2>
          <span className="font-sans text-[13px] text-ink-mute">{o.name.en}</span>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="label-mono text-[11px] font-semibold" style={{ color: ringColor }}>{rarityLabel(o.rarity ?? 'common')}</span>
            <span className="text-ink-faint">·</span>
            <span className="label-mono text-[11px] text-ink-mute">{PLAYER_ROLE_DATIVE[o.role]}</span>
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
          <span className="label-mono text-[10px] text-ink-mute">Похожие подношения</span>
          <SimilarGrid items={similar} onPick={onPick} smCols={3} />
        </div>
      )}
    </div>
  );
}
