'use client';

import { useState } from 'react';
import { ShapeCard } from '@/components/ui/shape-card';
import { cn } from '@/lib/utils';
import { IconImg } from '@/components/ui/icon-img';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { EntityTooltipBody } from '@/components/ui/entity-tooltip';
import type { Perk } from '@/lib/data';
import { formatDbdText } from '@/lib/dbd-text';

const ROLE_LABEL_PERK: Record<string, string> = {
  gen: 'Ген', 'chase-escape': 'Побег', info: 'Инфо', altruism: 'Альтруизм',
  exhaustion: 'Истощение', boon: 'Дарование', meme: 'Мем',
  slowdown: 'Замедление', 'chase-power': 'Погоня', aura: 'Аура',
  hex: 'Гекс', endgame: 'Финал', stealth: 'Скрытность',
};

/* All perks are displayed as tier-III purple (design spec) */
const PERK_RING = 'var(--perk-tier3-edge)';
const PERK_TINT = '#3a2057';

type Props = {
  perk: Perk;
  pinned?: boolean;
  onTogglePin?: () => void;
};

export function PerkCard({ perk, pinned = false, onTogglePin }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            className="flex flex-col items-center gap-[10px] cursor-pointer pb-1"
            onClick={onTogglePin}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label={`${perk.name.ru}${pinned ? ' (закреплён)' : ''}`}
          >
            <div
              className="transition-[filter] duration-[250ms]"
              style={{
                filter: hovered
                  ? 'drop-shadow(0 0 18px rgba(126,81,179,.55))'
                  : pinned
                  ? 'drop-shadow(0 0 12px rgba(184,67,31,.4))'
                  : 'none',
              }}
            >
              <ShapeCard
                shape="diamond"
                size={118}
                ringColor={PERK_RING}
                innerTint={PERK_TINT}
                pinned={pinned}
              >
                <IconImg
                  src={perk.icon}
                  alt={perk.name.ru}
                  size={52}
                  fallback={<PerkSigil glyph={perk.tier ?? '?'} />}
                />
              </ShapeCard>
            </div>

            {/* Perk name below */}
            <div className="text-center max-w-[120px]">
              <span
                className={cn(
                  'block font-sans text-[11px] font-semibold leading-[1.3] tracking-[.04em] transition-colors duration-200',
                  pinned ? 'text-dbd-bone' : 'text-ink-mute',
                )}
              >
                {perk.name.ru}
              </span>
              {pinned && (
                <span className="label-mono text-[9px] text-dbd-accent mt-[2px] block">
                  заперт
                </span>
              )}
            </div>
          </div>
        }
      />
      <TooltipContent side="top" style={{ background: 'transparent', border: 'none', padding: 0 }}>
        <EntityTooltipBody
          variant="perk"
          title={perk.name.ru}
          subtitle={{ text: 'УР. III · перк', color: 'var(--perk-tier3-edge)' }}
          meta={[
            ...(perk.tier ? [{ label: 'Тир', value: <span className="font-bold text-dbd-bone">{perk.tier}</span> }] : []),
            ...(perk.roles?.length
              ? [{ label: 'Роли', value: perk.roles.map((r) => ROLE_LABEL_PERK[r] ?? r).join(', ') }]
              : []),
          ]}
          description={formatDbdText(perk.description.ru, perk.tunables)}
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
