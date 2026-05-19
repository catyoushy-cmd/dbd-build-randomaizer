'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { saveOverrideAction } from './actions';
import type { ContentOverride } from '@/lib/data/overrides';
import { cn } from '@/lib/utils';

type Item = {
  id: string;
  nameEn: string;
  nameRu: string;
  descriptionRu: string;
  tier: string;
  deprecated: boolean;
  override?: ContentOverride;
};

type Props = {
  items: Item[];
  entityType: string;
  query: string;
};

const TIERS = ['', 'S', 'A', 'B', 'C'];

export function ContentTable({ items, entityType, query: initialQuery }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [editId, setEditId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set('q', value); else params.delete('q');
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <input
        type="search"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Поиск по ID, EN, RU..."
        className="w-full sm:max-w-[360px] bg-bg-2 border border-line-2 px-3 py-2 font-sans text-[12px] text-ink placeholder:text-ink-faint focus:border-dbd-accent outline-none transition-colors duration-150"
      />

      <p className="label-mono text-[9px] text-ink-faint">{items.length} объектов</p>

      {/* Table */}
      <div className="border border-line-1 divide-y divide-line-1 overflow-x-auto">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[1fr_140px_80px_100px_80px] gap-3 px-4 py-2 bg-bg-2">
          {['Название / ID', 'RU название', 'Тир', 'Устаревший', ''].map((h) => (
            <span key={h} className="label-mono text-[9px] text-ink-faint">{h}</span>
          ))}
        </div>

        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            entityType={entityType}
            isEditing={editId === item.id}
            onEdit={() => setEditId(editId === item.id ? null : item.id)}
            isPending={isPending}
            startTransition={startTransition}
          />
        ))}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  entityType,
  isEditing,
  onEdit,
  isPending,
  startTransition,
}: {
  item: Item;
  entityType: string;
  isEditing: boolean;
  onEdit: () => void;
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [nameRu, setNameRu] = useState(item.override?.name_ru ?? item.nameRu);
  const [descRu, setDescRu] = useState(item.override?.description_ru ?? item.descriptionRu);
  const [tier, setTier] = useState(item.override?.tier ?? item.tier ?? '');
  const [deprecated, setDeprecated] = useState(item.override?.deprecated ?? item.deprecated ?? false);

  const hasOverride = !!item.override;

  const handleSave = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('entity_type', entityType);
      fd.set('entity_id', item.id);
      fd.set('name_ru', nameRu);
      fd.set('description_ru', descRu);
      fd.set('tier', tier);
      fd.set('deprecated', deprecated ? 'true' : 'false');
      await saveOverrideAction(fd);
      onEdit();
    });
  };

  return (
    <div className={cn(
      'flex flex-col bg-bg-1 transition-colors duration-100',
      isEditing ? 'bg-bg-2' : 'hover:bg-bg-2',
    )}>
      {/* Main row */}
      <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_80px_100px_80px] items-center gap-3 px-4 py-3">
        {/* Name / ID */}
        <div className="flex flex-col min-w-0">
          <span className="font-sans text-[12px] font-semibold text-dbd-bone truncate">{item.nameEn}</span>
          <span className="label-mono text-[9px] text-ink-faint mt-0.5 truncate">{item.id}</span>
        </div>

        {/* RU name — shown in non-edit mode */}
        <span className={cn(
          'hidden sm:block font-sans text-[11px] truncate',
          nameRu ? 'text-ink' : 'text-ink-faint italic',
        )}>
          {nameRu || '—'}
          {hasOverride && <span className="ml-1 text-dbd-accent text-[9px]">●</span>}
        </span>

        {/* Tier */}
        <span className={cn(
          'hidden sm:block label-mono text-[10px]',
          tier === 'S' ? 'text-dbd-accent' :
          tier === 'A' ? 'text-dbd-bone' :
          tier === 'B' ? 'text-ink-mute' : 'text-ink-faint',
        )}>
          {tier || '—'}
        </span>

        {/* Deprecated */}
        <span className={cn(
          'hidden sm:block label-mono text-[9px]',
          deprecated ? 'text-dbd-blood' : 'text-ink-faint',
        )}>
          {deprecated ? 'deprecated' : '—'}
        </span>

        {/* Edit button */}
        <button
          onClick={onEdit}
          className={cn(
            'px-3 py-1 label-mono text-[9px] border transition-colors duration-150 whitespace-nowrap',
            isEditing
              ? 'border-dbd-accent text-dbd-accent'
              : 'border-line-2 text-ink-mute hover:border-line-ember',
          )}
        >
          {isEditing ? 'Свернуть' : 'Изменить'}
        </button>
      </div>

      {/* Edit panel */}
      {isEditing && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-line-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="flex flex-col gap-1">
              <label className="label-mono text-[9px] text-ink-mute">RU название</label>
              <input
                type="text"
                value={nameRu}
                onChange={(e) => setNameRu(e.target.value)}
                className="bg-bg-1 border border-line-2 px-3 py-2 font-sans text-[12px] text-ink focus:border-dbd-accent outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label-mono text-[9px] text-ink-mute">Тир</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="bg-bg-1 border border-line-2 px-3 py-2 font-sans text-[12px] text-ink focus:border-dbd-accent outline-none"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>{t || '—'}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="label-mono text-[9px] text-ink-mute">RU описание</label>
            <textarea
              value={descRu}
              onChange={(e) => setDescRu(e.target.value)}
              rows={4}
              className="bg-bg-1 border border-line-2 px-3 py-2 font-sans text-[12px] text-ink focus:border-dbd-accent outline-none resize-y"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deprecated}
                onChange={(e) => setDeprecated(e.target.checked)}
                className="accent-dbd-accent"
              />
              <span className="font-sans text-[12px] text-ink-mute">Deprecated (скрыть из роллов)</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="ritual-btn ritual-btn-primary px-4 py-2 text-[11px] disabled:opacity-60"
            >
              {isPending ? 'Сохранение…' : 'Сохранить'}
            </button>
            <button
              onClick={onEdit}
              className="ritual-btn ritual-btn-ghost px-4 py-2 text-[11px]"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
