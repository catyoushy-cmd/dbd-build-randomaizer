'use client';

import { ShapeCard, rarityColor } from '@/components/ui/shape-card';
import { cn } from '@/lib/utils';
import { IconImg } from '@/components/ui/icon-img';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Addon } from '@/lib/data';
import { formatDbdText } from '@/lib/dbd-text';

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
      <TooltipContent
        side="top"
        style={{
          maxWidth: 280,
          textAlign: 'left',
          background: 'linear-gradient(to bottom, rgba(20,17,15,.97), rgba(11,9,8,.97))',
          border: '1px solid var(--line-2)',
          borderRadius: 0,
          padding: '12px 14px',
        }}
      >
        <div className="font-sans font-bold text-[14px] text-dbd-bone">{addon.name.ru}</div>
        <div className="label-mono text-[9px] mt-1" style={{ color: ring }}>
          {addon.rarity.replace(/-/g, ' ')}
        </div>
        {addon.description?.ru && (
          <div className="text-[12px] text-ink leading-[1.5] mt-2 whitespace-pre-line">
            {formatDbdText(addon.description.ru)}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
