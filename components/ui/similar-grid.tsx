'use client';

import { cn } from '@/lib/utils';
import { rarityColor, rarityKey } from '@/components/ui/shape-card';
import { IconImg } from '@/components/ui/icon-img';

type SimilarItem = {
  id: string;
  name: { ru?: string; en?: string };
  icon?: string;
  rarity?: string;
};

type Props<T extends SimilarItem> = {
  items: T[];
  onPick: (item: T) => void;
  /** Number of columns at the smallest breakpoint. Defaults to 2. */
  cols?: 2;
  /** Number of columns at the sm breakpoint. items/addons use 4, offerings uses 3. */
  smCols?: 3 | 4;
};

/**
 * Compact "related entities" grid used at the bottom of the items,
 * addons, and offerings modals. Each cell is a rarity-tinted icon plus
 * a name; click picks a new entity (the parent re-renders the modal).
 *
 * Kept generic over T so the parent's onPick stays type-safe.
 */
export function SimilarGrid<T extends SimilarItem>({ items, onPick, smCols = 4 }: Props<T>) {
  if (items.length === 0) return null;

  const colsClass = smCols === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className={cn('grid gap-2', colsClass)}>
      {items.map((s) => {
        const rk = rarityKey(s.rarity ?? 'common');
        const ringColor = rarityColor(s.rarity ?? 'common');
        return (
          <button
            key={s.id}
            onClick={() => onPick(s)}
            className="flex items-center gap-2 px-2 py-2 border border-line-1 bg-bg-2 hover:border-line-ember transition-colors duration-150 text-left cursor-pointer"
          >
            <div
              className={cn('w-9 h-9 shrink-0 border flex items-center justify-center overflow-hidden', `rarity-bg-${rk}`)}
              style={{ borderColor: ringColor }}
            >
              <IconImg src={s.icon} alt={s.name.ru ?? ''} size={32} fallback={null} />
            </div>
            <span className="font-sans text-[12px] text-ink leading-tight truncate">
              {s.name.ru || s.name.en}
            </span>
          </button>
        );
      })}
    </div>
  );
}
