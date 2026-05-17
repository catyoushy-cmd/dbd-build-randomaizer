'use client';

import { Lock, LockOpen } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Addon } from '@/lib/data';
import { cn } from '@/lib/utils';

const RARITY_COLOR: Record<string, string> = {
  'common':     'border-stone-500/40 text-stone-400',
  'uncommon':   'border-yellow-600/40 text-yellow-600',
  'rare':       'border-green-500/40 text-green-400',
  'very-rare':  'border-purple-500/40 text-purple-400',
  'ultra-rare': 'border-pink-500/40 text-pink-400',
};

type Props = {
  addon: Addon;
  pinned?: boolean;
  onTogglePin?: () => void;
};

export function AddonCard({ addon, pinned = false, onTogglePin }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            className={cn(
              'group relative flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all duration-150 w-full',
              'bg-card hover:bg-secondary/50',
              pinned
                ? 'border-primary/60 ring-1 ring-primary/30'
                : 'border-border hover:border-border/80',
            )}
            onClick={onTogglePin}
            aria-label={addon.name.ru}
          >
            <div
              className={cn(
                'h-8 w-8 shrink-0 rounded border-2 bg-secondary flex items-center justify-center text-[10px] font-bold',
                RARITY_COLOR[addon.rarity] ?? 'border-stone-500/40 text-stone-400',
              )}
            >
              {addon.rarity[0].toUpperCase()}
            </div>
            <span className="text-xs font-medium text-foreground line-clamp-1 flex-1">
              {addon.name.ru}
            </span>
            <span
              className={cn(
                'shrink-0 transition-opacity',
                pinned
                  ? 'opacity-100 text-primary'
                  : 'opacity-0 group-hover:opacity-60 text-muted-foreground',
              )}
            >
              {pinned ? <Lock size={11} /> : <LockOpen size={11} />}
            </span>
          </button>
        }
      />
      <TooltipContent side="top">
        <p className="font-semibold">{addon.name.ru}</p>
        <p className="text-xs opacity-70 capitalize">{addon.rarity.replace('-', ' ')}</p>
      </TooltipContent>
    </Tooltip>
  );
}
