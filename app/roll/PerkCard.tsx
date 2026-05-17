'use client';

import { Lock, LockOpen } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Perk } from '@/lib/data';
import { cn } from '@/lib/utils';

const TIER_COLOR: Record<string, string> = {
  S: 'text-amber-400 border-amber-400/40',
  A: 'text-emerald-400 border-emerald-400/40',
  B: 'text-sky-400 border-sky-400/40',
  C: 'text-stone-400 border-stone-400/40',
};

type Props = {
  perk: Perk;
  pinned?: boolean;
  onTogglePin?: () => void;
  index: number;
};

export function PerkCard({ perk, pinned = false, onTogglePin }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            className={cn(
              'group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-150',
              'bg-card hover:bg-secondary/50',
              pinned
                ? 'border-primary/60 ring-1 ring-primary/30'
                : 'border-border hover:border-border/80',
            )}
            onClick={onTogglePin}
            aria-label={`${perk.name.ru}${pinned ? ' (закреплён)' : ''}`}
          >
            {/* Icon placeholder — будет заменён реальным спрайтом */}
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-lg border-2 bg-secondary text-xs font-bold',
                TIER_COLOR[perk.tier] ?? 'text-stone-400 border-stone-400/40',
              )}
              title={perk.tier}
            >
              {perk.tier}
            </div>

            <span className="text-xs font-medium leading-tight text-foreground line-clamp-2">
              {perk.name.ru}
            </span>

            {/* Pin indicator */}
            <span
              className={cn(
                'absolute right-1.5 top-1.5 rounded p-0.5 transition-opacity',
                pinned
                  ? 'opacity-100 text-primary'
                  : 'opacity-0 group-hover:opacity-60 text-muted-foreground',
              )}
            >
              {pinned ? <Lock size={12} /> : <LockOpen size={12} />}
            </span>
          </button>
        }
      />
      <TooltipContent side="top" className="max-w-xs text-left">
        <div className="space-y-1">
          <p className="font-semibold">{perk.name.ru}</p>
          <p className="text-xs opacity-80">{perk.description.ru}</p>
          {perk.character && (
            <p className="text-xs opacity-50">Персонаж: {perk.character}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
