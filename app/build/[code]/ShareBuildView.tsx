'use client';

import { Info } from 'lucide-react';
import type { Build } from '@/lib/data';
import { cn } from '@/lib/utils';

const TIER_COLOR: Record<string, string> = {
  S: 'text-amber-400 border-amber-400/40',
  A: 'text-emerald-400 border-emerald-400/40',
  B: 'text-sky-400 border-sky-400/40',
  C: 'text-stone-400 border-stone-400/40',
};

const RARITY_COLOR: Record<string, string> = {
  'common':     'border-stone-500/40 text-stone-400',
  'uncommon':   'border-yellow-600/40 text-yellow-600',
  'rare':       'border-green-500/40 text-green-400',
  'very-rare':  'border-purple-500/40 text-purple-400',
  'ultra-rare': 'border-pink-500/40 text-pink-400',
};

export function ShareBuildView({ build }: { build: Build }) {
  return (
    <div className="space-y-6">
      {build.buildCore && (
        <div className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-primary">{build.buildCore.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{build.buildCore.description}</p>
          </div>
        </div>
      )}

      {/* Perks */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Перки
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {build.perks.map((perk) => (
            <div
              key={perk.id}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center"
            >
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-lg border-2 bg-secondary text-xs font-bold',
                  TIER_COLOR[perk.tier] ?? 'text-stone-400 border-stone-400/40',
                )}
              >
                {perk.tier}
              </div>
              <span className="text-xs font-medium leading-tight line-clamp-2">
                {perk.name.ru}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Survivor item + addons */}
      {build.role === 'survivor' && build.item && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Предмет и аддоны
          </h2>
          <div className="rounded-xl border border-border bg-card p-3 space-y-2">
            <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                {build.item.type[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{build.item.name.ru}</p>
                <p className="text-xs text-muted-foreground capitalize">{build.item.type}</p>
              </div>
            </div>
            {build.addons.map((addon) => (
              <div
                key={addon.id}
                className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2"
              >
                <div className={cn('h-8 w-8 shrink-0 rounded border-2 bg-secondary flex items-center justify-center text-[10px] font-bold', RARITY_COLOR[addon.rarity])}>
                  {addon.rarity[0].toUpperCase()}
                </div>
                <span className="text-xs font-medium">{addon.name.ru}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Killer addons */}
      {build.role === 'killer' && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Аддоны к силе
          </h2>
          <div className="space-y-1.5">
            {build.addons.map((addon) => (
              <div
                key={addon.id}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2"
              >
                <div className={cn('h-8 w-8 shrink-0 rounded border-2 bg-secondary flex items-center justify-center text-[10px] font-bold', RARITY_COLOR[addon.rarity])}>
                  {addon.rarity[0].toUpperCase()}
                </div>
                <span className="text-xs font-medium">{addon.name.ru}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Offering */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Моли
        </h2>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
            M
          </div>
          <span className="text-sm font-medium">{build.offering.name.ru}</span>
        </div>
      </section>
    </div>
  );
}
