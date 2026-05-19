'use client';

import { type CSSProperties, type ReactNode } from 'react';

export type SlotShape = 'diamond' | 'pentagon' | 'rect';

const CLIP: Record<SlotShape, string> = {
  diamond: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
  pentagon: 'polygon(50% 0, 100% 36.32%, 80.9% 95.1%, 19.1% 95.1%, 0 36.32%)',
  rect: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
};

export function rarityColor(rarity: string): string {
  switch (rarity) {
    case 'common':    return 'var(--r-common)';
    case 'uncommon':  return 'var(--r-uncommon)';
    case 'rare':      return 'var(--r-rare)';
    case 'very-rare':
    case 'veryrare':  return 'var(--r-veryrare)';
    case 'ultra-rare':
    case 'ultra':     return 'var(--r-ultra)';
    case 'event':     return 'var(--r-event)';
    default:          return 'var(--ink-faint)';
  }
}

/** Normalize rarity string for CSS class suffix (e.g. "very-rare" → "veryrare"). */
export function rarityKey(rarity: string): string {
  return rarity.replace(/-/g, '').toLowerCase();
}

/** Human-readable rarity label in Russian. */
export function rarityLabel(rarity: string): string {
  const key = rarityKey(rarity);
  switch (key) {
    case 'common':    return 'обычная';
    case 'uncommon':  return 'необычная';
    case 'rare':      return 'редкая';
    case 'veryrare':  return 'очень редкая';
    case 'ultra':
    case 'ultrarare': return 'легендарная';
    case 'event':     return 'ивент';
    default:          return rarity;
  }
}

type ShapeCardProps = {
  shape?: SlotShape;
  size?: number;
  /** outer ring colour (usually rarity) */
  ringColor?: string;
  /** inner tint for gradient background */
  innerTint?: string;
  pinned?: boolean;
  dim?: boolean;
  children?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
};

/**
 * Reusable clip-path slot — used for perks (diamond), addons (rect), offerings (pentagon).
 * Matches the design prototype's ShapeCard primitive exactly.
 */
export function ShapeCard({
  shape = 'diamond',
  size = 100,
  ringColor = 'var(--line-2)',
  innerTint,
  pinned = false,
  dim = false,
  children,
  onClick,
  style = {},
}: ShapeCardProps) {
  const clip = CLIP[shape];

  const innerBg = innerTint
    ? `linear-gradient(160deg, ${innerTint}cc 0%, #14101c 60%, #0b0810 100%)`
    : `linear-gradient(160deg, #1a1411 0%, #100d0b 100%)`;

  const ringStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    clipPath: clip,
    WebkitClipPath: clip,
    background: pinned
      ? `linear-gradient(135deg, ${ringColor}, #e9651e)`
      : ringColor,
    transition: 'background .25s ease',
  };

  const innerStyle: CSSProperties = {
    position: 'absolute',
    inset: 2,
    clipPath: clip,
    WebkitClipPath: clip,
    background: innerBg,
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.04)',
  };

  const textureStyle: CSSProperties = {
    position: 'absolute',
    inset: 2,
    clipPath: clip,
    WebkitClipPath: clip,
    opacity: 0.3,
    mixBlendMode: 'overlay',
    background:
      'radial-gradient(ellipse at 30% 20%, rgba(255,220,170,.18), transparent 60%), ' +
      'radial-gradient(ellipse at 80% 90%, rgba(0,0,0,.5), transparent 60%)',
    pointerEvents: 'none',
  };

  const pinnedBadge: CSSProperties = {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: 'var(--dbd-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 9,
    boxShadow: '0 0 0 2px var(--bg-deep), 0 0 10px rgba(232,101,30,.6)',
    pointerEvents: 'none',
  };

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: size,
        height: size,
        cursor: onClick ? 'pointer' : 'default',
        filter: dim ? 'grayscale(.6) brightness(.55)' : 'none',
        transition: 'filter .3s ease, transform .3s ease',
        flexShrink: 0,
        ...style,
      }}
    >
      <div style={ringStyle} />
      <div style={innerStyle} />
      <div style={textureStyle} />
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}>
        {children}
      </div>
      {pinned && (
        <div style={pinnedBadge}>✦</div>
      )}
    </div>
  );
}
