'use client';

import { Fragment } from 'react';
import { parseDbdText, type DbdSegment } from '@/lib/dbd-text';
import { KeywordTooltip } from '@/components/build/KeywordTooltip';
import type { StatusEffect } from '@/lib/data';

type Props = {
  raw: string | undefined;
  /** Multi-tier tunable map (perks). Items/addons/offerings normally pass none. */
  tunables?: Record<string, number[] | undefined>;
  /** Coloured tier values for multi-tier tunables. */
  colorTiers?: boolean;
  /** Map source-key → StatusEffect (used to attach hover tooltips to keywords). */
  effectsBySourceKey?: Map<string, StatusEffect>;
  /** Visual size — 'sm' for compact tooltips, 'md' (default) for modal bodies. */
  size?: 'sm' | 'md';
};

const SIZE = {
  sm: 'text-[12.5px] leading-[1.55]',
  md: 'text-[14px] leading-[1.65]',
} as const;

/**
 * Render any DBD description string (perks, items, addons, offerings).
 *   - Tunable {X / X / X} values colour-coded by tier (perks only).
 *   - Keywords («Истощение», etc.) become hover-tooltips when an effect is
 *     present in `effectsBySourceKey`.
 *   - Bullets and line breaks preserved.
 */
export function DbdDescription({
  raw,
  tunables,
  colorTiers = true,
  effectsBySourceKey,
  size = 'md',
}: Props) {
  const segments = parseDbdText(raw, tunables);
  if (segments.length === 0) return null;

  return (
    <p className={`font-sans text-ink m-0 ${SIZE[size]}`}>
      {segments.map((seg, i) => (
        <Fragment key={i}>{renderSegment(seg, colorTiers, effectsBySourceKey)}</Fragment>
      ))}
    </p>
  );
}

function renderSegment(seg: DbdSegment, colorTiers: boolean, effects?: Map<string, StatusEffect>) {
  switch (seg.type) {
    case 'text':
      return <span>{seg.value}</span>;

    case 'keyword': {
      const effect = effects?.get(seg.key);
      const inner = <>«{seg.label}»</>;
      if (effect) {
        return <KeywordTooltip effect={effect}>{inner}</KeywordTooltip>;
      }
      return (
        <span
          className="dbd-keyword"
          data-keyword={seg.key}
          aria-label={`Состояние: ${seg.label}`}
        >
          {inner}
        </span>
      );
    }

    case 'tunable': {
      const [t1, t2, t3] = seg.values;
      if (!colorTiers || (t1 === t2 && t2 === t3)) {
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

/** Backwards-compatible alias — older imports keep working. */
export { DbdDescription as PerkDescription };
