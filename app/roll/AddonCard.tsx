'use client';

import { ShapeCard, rarityColor } from '@/components/ui/shape-card';
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              width: '100%',
              padding: '10px 14px',
              background: 'var(--bg-1)',
              border: `1px solid ${pinned ? 'var(--dbd-accent)' : 'var(--line-2)'}`,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color .18s ease, background .18s ease',
              outline: pinned ? '1px solid rgba(184,67,31,.25)' : 'none',
            }}
          >
            <ShapeCard shape="rect" size={44} ringColor={ring} pinned={pinned}>
              {addon.icon ? (
                <img
                  src={addon.icon}
                  alt={addon.name.ru}
                  style={{ width: 28, height: 28, objectFit: 'contain', opacity: .9 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
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
              )}
            </ShapeCard>

            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-sans, Manrope, system-ui)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: pinned ? 'var(--dbd-bone)' : 'var(--ink)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transition: 'color .18s ease',
                }}
              >
                {addon.name.ru}
              </span>
              <span
                className="label-mono"
                style={{ fontSize: 9, color: ring, marginTop: 2, display: 'block' }}
              >
                {addon.rarity.replace(/-/g, ' ')}
              </span>
            </div>

            {pinned && (
              <span
                className="label-mono"
                style={{ fontSize: 9, color: 'var(--dbd-accent)', flexShrink: 0 }}
              >
                ✦
              </span>
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
        <div style={{ fontFamily: 'var(--font-sans, Manrope, system-ui)', fontWeight: 700, fontSize: 14, color: 'var(--dbd-bone)' }}>
          {addon.name.ru}
        </div>
        <div className="label-mono" style={{ fontSize: 9, color: ring, marginTop: 4 }}>
          {addon.rarity.replace(/-/g, ' ')}
        </div>
        {addon.description?.ru && (
          <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5, marginTop: 8, whiteSpace: 'pre-line' }}>
            {formatDbdText(addon.description.ru)}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
