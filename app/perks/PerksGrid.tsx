'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { EntityModal } from '@/components/ui/entity-modal';
import { IconImg } from '@/components/ui/icon-img';
import { PerkDescription } from '@/components/build/PerkDescription';
import type { Perk, Killer, Survivor } from '@/lib/data';

type Props = {
  perks: Perk[];
  killers: Killer[];
  survivors: Survivor[];
};

const ROLE_LABEL: Record<string, string> = {
  gen: 'Ген', 'chase-escape': 'Побег', info: 'Инфо', altruism: 'Альтруизм',
  exhaustion: 'Истощение', boon: 'Дарование', meme: 'Мем',
  slowdown: 'Замедление', 'chase-power': 'Погоня', aura: 'Аура',
  hex: 'Гекс', endgame: 'Финал', stealth: 'Скрытность',
  healing: 'Лечение', chest: 'Сундуки', item: 'Предметы',
  totem: 'Тотемы', map: 'Карта', survival: 'Выживание',
};

// Quick-pick tag chips under the search input.
const QUICK_TAGS_SURVIVOR = ['gen', 'chase-escape', 'info', 'exhaustion', 'healing', 'altruism', 'totem'];
const QUICK_TAGS_KILLER   = ['slowdown', 'chase-power', 'aura', 'hex', 'stealth', 'endgame', 'info'];

export function PerksGrid({ perks, killers, survivors }: Props) {
  const [tab, setTab]       = useState<'survivor' | 'killer'>('survivor');
  const [query, setQuery]   = useState('');
  const [activeTag, setTag] = useState<string | null>(null);
  const [selected, setSelected] = useState<Perk | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return perks.filter((p) => {
      if (p.role !== tab) return false;
      if (activeTag && !p.roles.includes(activeTag as Perk['roles'][number])) return false;
      if (!q) return true;
      return (
        p.name.ru?.toLowerCase().includes(q) ||
        p.name.en?.toLowerCase().includes(q) ||
        p.id.includes(q)
      );
    });
  }, [perks, tab, query, activeTag]);

  // Group by character_slug. Order: generic first, then characters in JSON order.
  const grouped = useMemo(() => {
    const characters = tab === 'survivor' ? survivors : killers;

    /** Map slug → perks[] */
    const buckets = new Map<string | null, Perk[]>();
    for (const p of filtered) {
      const key = p.character_slug ?? null;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(p);
    }

    // Sort perks alphabetically inside each group
    buckets.forEach((arr: Perk[]) => arr.sort((a, b) => (a.name.ru ?? '').localeCompare(b.name.ru ?? '')));

    // Build ordered groups: generic → each character in JSON order
    const groups: Array<{ key: string | null; character?: Killer | Survivor; perks: Perk[] }> = [];
    if (buckets.has(null)) groups.push({ key: null, perks: buckets.get(null)! });
    for (const c of characters) {
      if (buckets.has(c.id)) groups.push({ key: c.id, character: c, perks: buckets.get(c.id)! });
    }
    return groups;
  }, [filtered, killers, survivors, tab]);

  const totalSurvivor = perks.filter((p) => p.role === 'survivor').length;
  const totalKiller   = perks.filter((p) => p.role === 'killer').length;

  return (
    <div className="flex flex-col gap-5">
      {/* Tab + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex">
          {(['survivor', 'killer'] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setTab(r); setTag(null); }}
              className={cn(
                'px-4 py-2.5 label-mono text-[12px] border-b-2 transition-all duration-150',
                tab === r
                  ? 'border-b-dbd-accent text-dbd-bone bg-[rgba(184,67,31,.08)]'
                  : 'border-b-line-1 text-ink-mute hover:text-ink',
              )}
            >
              {r === 'survivor' ? 'Выжившие' : 'Убийцы'} ({r === 'survivor' ? totalSurvivor : totalKiller})
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[220px] max-w-[420px]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск перков..."
            className="w-full bg-bg-2 border-2 border-line-2 px-4 py-2.5 font-sans text-[14px] text-ink placeholder:text-ink-faint focus:border-dbd-accent outline-none transition-colors duration-150"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 label-mono text-[10px] text-ink-faint pointer-events-none">
            ⌕
          </span>
        </div>
      </div>

      {/* Tag chips for quick filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="label-mono text-[10px] text-ink-faint mr-1">Быстрый фильтр:</span>
        {(tab === 'survivor' ? QUICK_TAGS_SURVIVOR : QUICK_TAGS_KILLER).map((t) => (
          <button
            key={t}
            onClick={() => setTag(activeTag === t ? null : t)}
            className={cn(
              'px-3 py-1 label-mono text-[10px] border transition-colors duration-150',
              activeTag === t
                ? 'border-line-ember text-dbd-bone bg-[rgba(184,67,31,.15)]'
                : 'border-line-1 text-ink-mute hover:border-line-2 hover:text-ink',
            )}
          >
            {ROLE_LABEL[t] ?? t}
          </button>
        ))}
        {activeTag && (
          <button
            onClick={() => setTag(null)}
            className="px-2 py-1 label-mono text-[10px] text-ink-faint hover:text-ink"
          >
            ✕ сброс
          </button>
        )}
      </div>

      <p className="label-mono text-[11px] text-ink-mute">{filtered.length} перков</p>

      {/* Groups */}
      <div className="flex flex-col gap-7">
        {grouped.map((group) => (
          <CharacterGroup
            key={group.key ?? '__generic__'}
            character={group.character ?? null}
            perks={group.perks}
            onOpen={setSelected}
          />
        ))}
      </div>

      {/* Modal */}
      <EntityModal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <PerkModalBody
            perk={selected}
            character={resolveCharacter(selected, killers, survivors)}
          />
        )}
      </EntityModal>
    </div>
  );
}

function resolveCharacter(perk: Perk, killers: Killer[], survivors: Survivor[]): Killer | Survivor | null {
  if (!perk.character_slug) return null;
  const pool = perk.role === 'killer' ? killers : survivors;
  return pool.find((c) => c.id === perk.character_slug) ?? null;
}

/* ───────── Character group ───────── */

function CharacterGroup({
  character,
  perks,
  onOpen,
}: {
  character: Killer | Survivor | null;
  perks: Perk[];
  onOpen: (p: Perk) => void;
}) {
  return (
    <section>
      <header className="flex items-center gap-3 mb-3 pb-2 border-b border-line-1">
        <div className="w-10 h-10 shrink-0 border border-line-2 bg-bg-2 flex items-center justify-center overflow-hidden">
          {character ? (
            <IconImg
              src={character.icon}
              alt={character.name.ru}
              size={36}
              fallback={<span className="text-ink-faint text-[18px]">⌧</span>}
            />
          ) : (
            <span className="text-dbd-accent text-[18px]">⌘</span>
          )}
        </div>
        <h2 className="m-0 font-sans font-bold text-[15px] text-dbd-bone">
          {character ? character.name.ru : 'Общие перки'}
        </h2>
        {'power' in (character ?? {}) && (character as Killer).power && (
          <span className="label-mono text-[10px] text-ink-faint">{(character as Killer).power}</span>
        )}
        <span className="ml-auto label-mono text-[10px] text-ink-faint">{perks.length} перк{plural(perks.length)}</span>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {perks.map((p) => <PerkRow key={p.id} perk={p} onOpen={() => onOpen(p)} />)}
      </div>
    </section>
  );
}

function plural(n: number) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return '';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'а';
  return 'ов';
}

/* ───────── Card ───────── */

function PerkRow({ perk, onOpen }: { perk: Perk; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-3 px-4 py-3 text-left border border-line-1 bg-bg-1 hover:border-line-ember hover:bg-bg-2 transition-colors duration-150 cursor-pointer"
    >
      <div className="w-14 h-14 shrink-0 border border-line-2 bg-bg-2 flex items-center justify-center overflow-hidden">
        <IconImg
          src={perk.icon}
          alt={perk.name.ru || perk.name.en}
          size={52}
          fallback={<span className="text-ink-faint text-[18px]">⚙</span>}
        />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-sans text-[14px] font-semibold text-dbd-bone leading-tight truncate">
          {perk.name.ru || perk.name.en}
        </span>
        <span className="font-sans text-[12px] text-ink-mute mt-0.5 truncate">{perk.name.en}</span>
      </div>
    </button>
  );
}

/* ───────── Modal ───────── */

function PerkModalBody({ perk, character }: { perk: Perk; character: Killer | Survivor | null }) {
  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 shrink-0 border border-line-ember bg-bg-2 flex items-center justify-center overflow-hidden">
          <IconImg
            src={perk.icon}
            alt={perk.name.ru}
            size={72}
            fallback={<span className="text-ink-faint">⚙</span>}
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0 pt-1">
          <h2 className="m-0 font-sans font-bold text-[22px] text-dbd-bone leading-tight">
            {perk.name.ru || perk.name.en}
          </h2>
          <span className="font-sans text-[13px] text-ink-mute">{perk.name.en}</span>
          {character && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-7 h-7 shrink-0 border border-line-1 bg-bg-2 flex items-center justify-center overflow-hidden">
                <IconImg src={character.icon} alt={character.name.ru} size={26} fallback={null} />
              </div>
              <span className="label-mono text-[10px] text-ink-faint">Персонаж:</span>
              <span className="font-sans text-[13px] text-ink">{character.name.ru}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tier legend */}
      <div className="flex items-center justify-end gap-3 label-mono text-[10px] text-ink-faint">
        <span>Уровни:</span>
        <span className="tunable-t1 font-bold">I</span>
        <span>/</span>
        <span className="tunable-t2 font-bold">II</span>
        <span>/</span>
        <span className="tunable-t3 font-bold">III</span>
      </div>

      {/* Description with coloured tier values and highlighted keywords */}
      <div className="flex flex-col gap-2">
        <span className="label-mono text-[10px] text-ink-mute">Описание</span>
        <div className="border-l-2 border-line-ember pl-4">
          <PerkDescription raw={perk.description.ru} tunables={perk.tunables} />
        </div>
      </div>

      {/* Meta */}
      {perk.roles.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-line-1">
          <span className="label-mono text-[10px] text-ink-mute shrink-0">Назначения:</span>
          <div className="flex flex-wrap gap-1.5">
            {perk.roles.map((r) => (
              <span key={r} className="label-mono text-[11px] px-2 py-1 border border-line-2 text-ink">
                {ROLE_LABEL[r] ?? r}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
