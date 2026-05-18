'use client';

import { useState } from 'react';
import { ShapeCard } from '@/components/ui/shape-card';
import { IconImg } from '@/components/ui/icon-img';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Perk } from '@/lib/data';
import { formatDbdText } from '@/lib/dbd-text';

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
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              paddingBottom: 4,
            }}
            onClick={onTogglePin}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label={`${perk.name.ru}${pinned ? ' (закреплён)' : ''}`}
          >
            <div
              style={{
                filter: hovered
                  ? 'drop-shadow(0 0 18px rgba(126,81,179,.55))'
                  : pinned
                  ? 'drop-shadow(0 0 12px rgba(184,67,31,.4))'
                  : 'none',
                transition: 'filter .25s ease',
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
            <div style={{ textAlign: 'center', maxWidth: 120 }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-sans, Manrope, system-ui)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: pinned ? 'var(--dbd-bone)' : 'var(--ink-mute)',
                  lineHeight: 1.3,
                  letterSpacing: '.04em',
                  transition: 'color .2s ease',
                }}
              >
                {perk.name.ru}
              </span>
              {pinned && (
                <span
                  className="label-mono"
                  style={{ fontSize: 9, color: 'var(--dbd-accent)', marginTop: 2, display: 'block' }}
                >
                  заперт
                </span>
              )}
            </div>
          </div>
        }
      />
      <TooltipContent
        side="top"
        style={{
          maxWidth: 280,
          textAlign: 'left',
          background: 'linear-gradient(to bottom, rgba(28,23,32,.97), rgba(11,9,12,.97))',
          border: '1px solid var(--perk-tier3)',
          borderRadius: 0,
          padding: '14px 16px',
          boxShadow: '0 18px 40px rgba(0,0,0,.6)',
        }}
      >
        <div className="label-mono" style={{ color: 'var(--perk-tier3-edge)', fontSize: 9 }}>
          УР. III · перк
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans, Manrope, system-ui)',
            fontWeight: 700,
            fontSize: 15,
            color: 'var(--dbd-bone)',
            marginTop: 4,
          }}
        >
          {perk.name.ru}
        </div>
        <div
          style={{
            height: 1,
            margin: '10px 0',
            background: 'linear-gradient(to right, var(--line-2), transparent)',
          }}
        />
        <div
          style={{
            fontSize: 12,
            color: 'var(--ink)',
            lineHeight: 1.55,
            whiteSpace: 'pre-line',
          }}
        >
          {formatDbdText(perk.description.ru, perk.tunables)}
        </div>
        {perk.character && (
          <div
            className="label-mono"
            style={{ marginTop: 10, fontSize: 9, color: 'var(--ink-faint)' }}
          >
            {perk.character}
          </div>
        )}
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
