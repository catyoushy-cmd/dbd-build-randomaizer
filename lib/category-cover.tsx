/**
 * SVG placeholder cover for wiki articles without `cover_url`.
 * One unique gradient + sigil per category — keeps the article cards visually
 * distinct without forcing the author to upload an image.
 */

import type { ReactElement } from 'react';

type Theme = {
  bg: [string, string]; // gradient start, end
  accent: string;
  sigil: ReactElement;
};

const SIGILS = {
  diamond: <polygon points="50,15 85,50 50,85 15,50" fill="none" strokeWidth="2.5" />,
  hex:     <polygon points="50,12 84,32 84,68 50,88 16,68 16,32" fill="none" strokeWidth="2.5" />,
  star:    <polygon points="50,10 60,40 92,40 65,58 75,90 50,70 25,90 35,58 8,40 40,40" fill="none" strokeWidth="2" />,
  cross:   <path d="M 30 30 L 70 70 M 70 30 L 30 70" fill="none" strokeWidth="3" strokeLinecap="square" />,
  ring:    <circle cx="50" cy="50" r="34" fill="none" strokeWidth="2.5" />,
  triangle: <polygon points="50,18 86,80 14,80" fill="none" strokeWidth="2.5" />,
};

const CATEGORY_THEMES: Record<string, Theme> = {
  beginner:    { bg: ['#1c2c1c', '#0c1808'], accent: '#5fb858', sigil: SIGILS.ring },
  guide:       { bg: ['#1a1d2e', '#0a0c18'], accent: '#5e8ad4', sigil: SIGILS.hex },
  'tier-list': { bg: ['#2c1a26', '#180a14'], accent: '#d24a1f', sigil: SIGILS.star },
  meta:        { bg: ['#2a1b1b', '#150909'], accent: '#a01e1e', sigil: SIGILS.diamond },
  tips:        { bg: ['#1d2728', '#0a1213'], accent: '#3fb8a8', sigil: SIGILS.cross },
  lore:        { bg: ['#28202e', '#100c18'], accent: '#a04ce6', sigil: SIGILS.triangle },
  other:       { bg: ['#21201e', '#0e0d0b'], accent: '#c39b59', sigil: SIGILS.ring },
};

/** Returns a cover-shaped SVG element. Use as the article card image fallback. */
export function CategoryCover({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const theme = CATEGORY_THEMES[category] ?? CATEGORY_THEMES.other;
  const gradId = `cover-${category.replace(/[^a-z]/g, '')}-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <svg
      viewBox="0 0 200 100"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={`Обложка категории «${category}»`}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stopColor={theme.bg[0]} />
          <stop offset="100%" stopColor={theme.bg[1]} />
        </linearGradient>
        <pattern id={`${gradId}-grid`} width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M 14 0 L 0 0 0 14" fill="none" stroke={theme.accent} strokeOpacity="0.08" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width="200" height="100" fill={`url(#${gradId})`} />
      <rect width="200" height="100" fill={`url(#${gradId}-grid)`} />

      {/* Accent glow */}
      <ellipse cx="50%" cy="50%" rx="80" ry="40" fill={theme.accent} opacity="0.08" />

      {/* Sigil, centred and tinted */}
      <g transform="translate(50 0)" stroke={theme.accent} opacity="0.85">
        {theme.sigil}
      </g>
    </svg>
  );
}
