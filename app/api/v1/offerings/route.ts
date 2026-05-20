import { fetchOfferings } from '@/lib/data/content-db';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { publicJson, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role   = searchParams.get('role');
  const rarity = searchParams.get('rarity');

  const [offeringsRaw, overrides] = await Promise.all([
    fetchOfferings(),
    fetchOverrides('offering'),
  ]);
  let offerings = applyOverrides(offeringsRaw, overrides);

  if (role) {
    // 'survivor' or 'killer' query includes 'both'; 'both' is exact
    offerings = role === 'both'
      ? offerings.filter((o) => o.role === 'both')
      : offerings.filter((o) => o.role === role || o.role === 'both');
  }
  if (rarity) offerings = offerings.filter((o) => o.rarity === rarity);

  return publicJson({ count: offerings.length, offerings });
}

export const OPTIONS = corsPreflight;
