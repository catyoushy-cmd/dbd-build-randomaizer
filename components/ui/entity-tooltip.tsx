'use client';

import type { ReactNode } from 'react';

type Meta = { label: string; value: ReactNode };

type Props = {
  title: string;
  subtitle?: { text: string; color?: string };
  meta?: Meta[];
  description?: string;
  footer?: string;
  /** Visual variant: standard (warm tones) or perk (purple ritual tones). */
  variant?: 'standard' | 'perk';
};

/**
 * Unified tooltip body for perks / addons / items / offerings.
 * Layout: title → subtitle (rarity / type) → meta grid → description → footer.
 * All items are stacked vertically with consistent spacing.
 */
export function EntityTooltipBody({
  title,
  subtitle,
  meta,
  description,
  footer,
  variant = 'standard',
}: Props) {
  const isPerk = variant === 'perk';

  return (
    <div
      className="flex flex-col gap-3"
      style={{
        maxWidth: 320,
        minWidth: 240,
        textAlign: 'left',
        background: isPerk
          ? 'linear-gradient(to bottom, rgba(28,23,32,.97), rgba(11,9,12,.97))'
          : 'linear-gradient(to bottom, rgba(20,17,15,.97), rgba(11,9,8,.97))',
        border: `1px solid ${isPerk ? 'var(--perk-tier3)' : 'var(--line-2)'}`,
        borderRadius: 0,
        padding: '14px 16px',
        boxShadow: '0 18px 40px rgba(0,0,0,.6)',
      }}
    >
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="font-sans font-bold text-[15px] text-dbd-bone leading-tight">
          {title}
        </div>
        {subtitle && (
          <div
            className="label-mono text-[10px]"
            style={{ color: subtitle.color ?? 'var(--ink-mute)' }}
          >
            {subtitle.text}
          </div>
        )}
      </div>

      {/* Meta grid — label / value pairs in column */}
      {meta && meta.length > 0 && (
        <>
          <div className="h-px bg-gradient-to-r from-line-2 to-transparent" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 m-0">
            {meta.map((m, i) => (
              <div key={i} className="contents">
                <dt className="label-mono text-[10px] text-ink-faint whitespace-nowrap">
                  {m.label}
                </dt>
                <dd className="m-0 font-sans text-[12px] text-ink">
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {/* Description */}
      {description && (
        <>
          {(!meta || meta.length === 0) && (
            <div className="h-px bg-gradient-to-r from-line-2 to-transparent" />
          )}
          <p className="m-0 font-sans text-[12.5px] text-ink leading-[1.55] whitespace-pre-line">
            {description}
          </p>
        </>
      )}

      {/* Footer */}
      {footer && (
        <div className="label-mono text-[10px] text-ink-faint pt-1">
          {footer}
        </div>
      )}
    </div>
  );
}
