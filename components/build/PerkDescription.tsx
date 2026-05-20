'use client';

import { Fragment } from 'react';
import { parseDbdText, type DbdSegment } from '@/lib/dbd-text';

type Props = {
  raw: string | undefined;
  tunables?: Record<string, number[] | undefined>;
  /** Coloured tier values (only meaningful when `tunables` carries multi-tier arrays). */
  colorTiers?: boolean;
};

/**
 * Render DBD description AST.
 *   - Tunable values: shown inline as «t1 / t2 / t3» with each tier in its
 *     own colour (yellow / green / purple — matches the in-game tier ramp).
 *   - Keywords («Истощение», etc.): wrapped in <span.dbd-keyword> with a
 *     subtle dotted accent underline (tooltip-on-hover comes later).
 *   - Bullets: small dot + line break before the item.
 */
export function PerkDescription({ raw, tunables, colorTiers = true }: Props) {
  const segments = parseDbdText(raw, tunables);
  if (segments.length === 0) return null;

  return (
    <p className="font-sans text-[14px] text-ink leading-[1.65] m-0">
      {segments.map((seg, i) => (
        <Fragment key={i}>{renderSegment(seg, colorTiers)}</Fragment>
      ))}
    </p>
  );
}

function renderSegment(seg: DbdSegment, colorTiers: boolean) {
  switch (seg.type) {
    case 'text':
      return <span>{seg.value}</span>;

    case 'keyword':
      return (
        <span
          className="dbd-keyword"
          data-keyword={seg.key}
          aria-label={`Состояние: ${seg.label}`}
        >
          «{seg.label}»
        </span>
      );

    case 'tunable': {
      const [t1, t2, t3] = seg.values;
      if (!colorTiers || (t1 === t2 && t2 === t3)) {
        // No variance: render the value once
        return <strong className="text-dbd-bone">{t3}</strong>;
      }
      return (
        <span className="tier-vals">
          <span className="tunable-t1">{t1}</span>
          <span className="tier-sep">/</span>
          <span className="tunable-t2">{t2}</span>
          <span className="tier-sep">/</span>
          <span className="tunable-t3">{t3}</span>
        </span>
      );
    }

    case 'bullet':
      return (
        <>
          <br />
          <span className="text-dbd-accent select-none">•&nbsp;</span>
        </>
      );

    case 'newline':
      return <br />;
  }
}
