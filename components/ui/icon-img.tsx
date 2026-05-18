'use client';

import Image from 'next/image';
import { useState, type ReactNode } from 'react';

type Props = {
  src: string | undefined | null;
  alt: string;
  size: number;
  className?: string;
  fallback?: ReactNode;
};

/**
 * Square icon wrapper around next/image.
 * Falls back to a ritual-styled sigil if the image is missing, fails to load,
 * or src is empty.
 */
export function IconImg({ src, alt, size, className, fallback }: Props) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <span
        aria-label={alt}
        className={className}
        style={{
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {fallback ?? <DefaultSigil size={size} />}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', opacity: 0.9 }}
      onError={() => setErrored(true)}
      unoptimized
    />
  );
}

function DefaultSigil({ size }: { size: number }) {
  const r = size / 2 - 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--ink-faint)"
        strokeWidth=".7"
        opacity=".5"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r * 0.6}
        fill="none"
        stroke="var(--ink-faint)"
        strokeWidth=".5"
        strokeDasharray="2 3"
        opacity=".4"
      />
    </svg>
  );
}
