'use client';

import { useState, useEffect } from 'react';

/**
 * Reactive media-query hook. Returns true if the query matches.
 * SSR-safe — defaults to false on initial render.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const update = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return matches;
}

/** Convenience: matches when viewport ≤ 480px wide. */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 480px)');
}
