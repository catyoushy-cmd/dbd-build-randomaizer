import { NextResponse } from 'next/server';

/**
 * Wrap a payload as a JSON response with permissive CORS + cache headers.
 * Use for the public /api/v1 routes — third-party tooling needs unrestricted
 * read access.
 *
 * @param data        Body to serialize.
 * @param maxAge      Browser cache (seconds). Default 5 min.
 * @param swr         Stale-while-revalidate (seconds). Default 1 day.
 */
export function publicJson<T>(
  data: T,
  { maxAge = 300, swr = 86400 }: { maxAge?: number; swr?: number } = {},
) {
  return NextResponse.json(data, {
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control':                `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${swr}`,
    },
  });
}

/** Standard CORS preflight handler. Export as `OPTIONS` in any public route. */
export function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age':       '86400',
    },
  });
}

/** 404 with the same CORS headers. */
export function publicNotFound(message = 'Not found') {
  return NextResponse.json(
    { error: message },
    {
      status: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
}
