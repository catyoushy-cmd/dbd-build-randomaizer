'use client';

import { RefreshCw, Copy, Check, Info } from 'lucide-react';
import { useState } from 'react';
import { PerkCard } from './PerkCard';
import { AddonCard } from './AddonCard';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Build } from '@/lib/data';
import { cn } from '@/lib/utils';

type PinState = {
  perks: boolean[];
  item: boolean;
  addons: boolean[];
  offering: boolean;
};

type Props = {
  build: Build;
  pins: PinState;
  onTogglePerkPin: (i: number) => void;
  onToggleAddonPin: (i: number) => void;
  onToggleItemPin: () => void;
  onToggleOfferingPin: () => void;
  onRerollAddons: () => void;
  onRerollOffering: () => void;
  shareUrl: string;
};

export function BuildResult({
  build,
  pins,
  onTogglePerkPin,
  onToggleAddonPin,
  onToggleItemPin,
  onToggleOfferingPin,
  onRerollAddons,
  onRerollOffering,
  shareUrl,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="mt-8 space-y-6 animate-fade-up">
      {/* Build core info banner */}
      {build.buildCore && (
        <div className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-primary">{build.buildCore.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{build.buildCore.description}</p>
          </div>
        </div>
      )}

      {/* Fallback warning */}
      {build.fallback && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          Ядро недоступно — выдан полный рандом.
        </div>
      )}

      {/* Perks — 2×2 grid */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Перки
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {build.perks.map((perk, i) => (
            <PerkCard
              key={perk.id}
              perk={perk}
              index={i}
              pinned={pins.perks[i]}
              onTogglePin={() => onTogglePerkPin(i)}
            />
          ))}
        </div>
      </section>

      {/* Survivor: Item + Addons */}
      {build.role === 'survivor' && build.item && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Предмет и аддоны
            </h2>
            <button
              onClick={onRerollAddons}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw size={11} />
              Перебросить
            </button>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 space-y-2">
            {/* Item */}
            <button
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-150',
                'hover:bg-secondary/50',
                pins.item
                  ? 'border-primary/60 ring-1 ring-primary/30'
                  : 'border-border hover:border-border/80',
              )}
              onClick={onToggleItemPin}
            >
              <div className="h-9 w-9 shrink-0 rounded-lg bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                {build.item.type[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{build.item.name.ru}</p>
                <p className="text-xs text-muted-foreground capitalize">{build.item.type}</p>
              </div>
            </button>

            {/* Addons */}
            <div className="space-y-1.5">
              {build.addons.map((addon, i) => (
                <AddonCard
                  key={addon.id}
                  addon={addon}
                  pinned={pins.addons[i]}
                  onTogglePin={() => onToggleAddonPin(i)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Killer: Addons only */}
      {build.role === 'killer' && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Аддоны к силе
            </h2>
            <button
              onClick={onRerollAddons}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw size={11} />
              Перебросить
            </button>
          </div>
          <div className="space-y-1.5">
            {build.addons.map((addon, i) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                pinned={pins.addons[i]}
                onTogglePin={() => onToggleAddonPin(i)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Offering */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Моли
          </h2>
          <button
            onClick={onRerollOffering}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw size={11} />
            Перебросить
          </button>
        </div>
        <button
          className={cn(
            'group relative flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150',
            'bg-card hover:bg-secondary/50',
            pins.offering
              ? 'border-primary/60 ring-1 ring-primary/30'
              : 'border-border hover:border-border/80',
          )}
          onClick={onToggleOfferingPin}
        >
          <div className="h-9 w-9 shrink-0 rounded-lg bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
            M
          </div>
          <span className="text-sm font-medium">{build.offering.name.ru}</span>
        </button>
      </section>

      {/* Copy link */}
      <div className="flex justify-end">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/20"
              >
                {copied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
                {copied ? 'Скопировано!' : 'Скопировать ссылку'}
              </button>
            }
          />
          <TooltipContent side="top">
            Ссылка воспроизведёт точно такой же билд
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
