'use client';

import { ShapeCard, rarityColor, rarityLabel } from '@/components/ui/shape-card';
import { cn } from '@/lib/utils';
import { IconImg } from '@/components/ui/icon-img';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { EntityTooltipBody } from '@/components/ui/entity-tooltip';
import { DbdDescription } from '@/components/build/DbdDescription';
import type { Addon } from '@/lib/data';

type Props = {
  addon: Addon;
  pinned?: boolean;
  onTogglePin?: () => void;
};

export function AddonCard({ addon, pinned = false, onTogglePin }: Props) {
  const ring = rarityColor(addon.rarity);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            onClick={onTogglePin}
            aria-label={addon.name.ru}
            className={cn(
              'flex items-center gap-[14px] w-full px-[14px] py-[10px] bg-bg-1 cursor-pointer text-left',
              'transition-[border-color,background] duration-[180ms] border',
              pinned
                ? 'border-dbd-accent outline outline-1 outline-[rgba(184,67,31,.25)]'
                : 'border-line-2 outline-none',
            )}
          >
            <ShapeCard shape="rect" size={44} ringColor={ring} pinned={pinned}>
              <IconImg
                src={addon.icon}
                alt={addon.name.ru}
                size={28}
                fallback={
                  <span
                    style={{
                      fontFamily: 'var(--font-sans, Manrope, system-ui)',
                      fontWeight: 700,
                      fontSize: 13,
                      color: ring,
                      textShadow: `0 0 8px ${ring}`,
                    }}
                  >
                    {addon.rarity[0].toUpperCase()}
                  </span>
                }
              />
            </ShapeCard>

            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  'block font-sans text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-[180ms]',
                  pinned ? 'text-dbd-bone' : 'text-ink',
                )}
              >
                {addon.name.ru}
              </span>
              <span className="label-mono text-[9px] mt-[2px] block" style={{ color: ring }}>
                {addon.rarity.replace(/-/g, ' ')}
              </span>
            </div>

            {pinned && (
              <span className="label-mono text-[9px] text-dbd-accent shrink-0">✦</span>
            )}
          </button>
        }
      />
      <TooltipContent side="top" style={{ background: 'transparent', border: 'none', padding: 0 }}>
        <EntityTooltipBody
          title={addon.name.ru}
          subtitle={{ text: rarityLabel(addon.rarity).toUpperCase(), color: ring }}
          description={addon.description?.ru ? <DbdDescription raw={addon.description.ru} size="sm" /> : undefined}
        />
      </TooltipContent>
    </Tooltip>
  );
}
