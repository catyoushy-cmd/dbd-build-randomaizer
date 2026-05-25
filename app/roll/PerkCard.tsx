'use client';

import { useState } from 'react';
import { ShapeCard } from '@/components/ui/shape-card';
import { cn } from '@/lib/utils';
import { IconImg } from '@/components/ui/icon-img';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { EntityTooltipBody } from '@/components/ui/entity-tooltip';
import { DbdDescription } from '@/components/build/DbdDescription';
import { PERK_TAG_LABEL } from '@/lib/ui/labels';
import type { Perk } from '@/lib/data';

/* All perks are displayed as tier-III purple (design spec) */
const PERK_RING = 'var(--perk-tier3-edge)';
const PERK_TINT = '#3a2057';

type Props = {
  perk: Perk;
  pinned?: boolean;
  onTogglePin?: () => void;
  /** Diamond side length in px. Default 132. */
  size?: number;
  /** Hide the name caption below (used when in a tight diamond cluster). */
  hideCaption?: boolean;
  /** Tooltip position. Defaults to 'top'. */
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
};

export function PerkCard({
  perk,
  pinned = false,
  onTogglePin,
  size = 132,
  hideCaption = false,
  tooltipSide = 'top',
}: Props) {
  const [hovered, setHovered] = useState(false);
  const iconSize = Math.round(size * 0.66);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            className="flex flex-col items-center gap-2 cursor-pointer pb-1"
            onClick={onTogglePin}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label={`${perk.name.ru}${pinned ? ' (закреплён)' : ''}`}
          >
            <div
              className="transition-[filter] duration-[250ms]"
              style={{
                filter: hovered
                  ? 'drop-shadow(0 0 18px rgba(160,76,230,.6))'
                  : pinned
                  ? 'drop-shadow(0 0 14px rgba(210,74,31,.45))'
                  : 'drop-shadow(0 0 6px rgba(0,0,0,.5))',
              }}
            >
              <ShapeCard
                shape="diamond"
                size={size}
                ringColor={PERK_RING}
                innerTint={PERK_TINT}
                pinned={pinned}
              >
                <IconImg
                  src={perk.icon}
                  alt={perk.name.ru}
                  size={iconSize}
                  fallback={<PerkSigil glyph={perk.tier ?? '?'} />}
                />
              </ShapeCard>
            </div>

            {/* Perk name below */}
            {!hideCaption && (
              <div className="text-center" style={{ maxWidth: size }}>
                <span
                  className={cn(
                    'block font-sans text-[13px] font-semibold leading-[1.25] tracking-[.02em] transition-colors duration-200',
                    pinned ? 'text-dbd-bone' : 'text-ink',
                  )}
                >
                  {perk.name.ru}
                </span>
                {pinned && (
                  <span className="label-mono text-[10px] text-dbd-accent mt-[3px] block">
                    заперт
                  </span>
                )}
              </div>
            )}
          </div>
        }
      />
      <TooltipContent side={tooltipSide} style={{ background: 'transparent', border: 'none', padding: 0 }}>
        <EntityTooltipBody
          variant="perk"
          title={perk.name.ru}
          subtitle={{ text: 'УР. III · перк', color: 'var(--perk-tier3-edge)' }}
          meta={[
            ...(perk.tier ? [{ label: 'Тир', value: <span className="font-bold text-dbd-bone">{perk.tier}</span> }] : []),
            ...(perk.roles?.length
              ? [{ label: 'Роли', value: perk.roles.map((r) => PERK_TAG_LABEL[r] ?? r).join(', ') }]
              : []),
          ]}
          description={<DbdDescription raw={perk.description.ru} tunables={perk.tunables} size="sm" />}
          footer={perk.character ? `Персонаж: ${perk.character}` : undefined}
        />
      </TooltipContent>
    </Tooltip>
  );
}

function PerkSigil({ glyph }: { glyph: string }) {
  return (
    <div style={{ position: 'relative', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 60 60" width="52" height="52" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="30" cy="30" r="26" fill="none" stroke="var(--perk-tier3-edge)" strokeWidth="0.6" opacity=".6" />
        <circle cx="30" cy="30" r="20" fill="none" stroke="var(--perk-tier3-edge)" strokeWidth="0.4" opacity=".4" strokeDasharray="2 3" />
        <polygon points="30,12 46,42 14,42" fill="none" stroke="var(--perk-tier3-edge)" strokeWidth="0.5" opacity=".7" />
      </svg>
      <span
        style={{
          position: 'relative',
          fontFamily: 'var(--font-sans, Manrope, system-ui)',
          fontWeight: 800,
          fontSize: 14,
          color: 'var(--dbd-bone)',
          textShadow: '0 0 12px var(--perk-tier3-edge), 0 2px 0 rgba(0,0,0,.6)',
        }}
      >
        {glyph}
      </span>
    </div>
  );
}
