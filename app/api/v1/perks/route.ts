import { fetchPerks } from '@/lib/data/content-db';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { publicJson, corsPreflight } from '@/lib/api/response';

export const revalidate = 600; // 10 min ISR

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role        = searchParams.get('role');
  const tier        = searchParams.get('tier');
  const includeDep  = searchParams.get('deprecated') === 'true';

  const [perksRaw, overrides] = await Promise.all([
    fetchPerks(),
    fetchOverrides('perk'),
  ]);
  let perks = applyOverrides(perksRaw, overrides);

  if (role) perks = perks.filter((p) => p.role === role);
  if (tier) perks = perks.filter((p) => p.tier === tier);
  if (!includeDep) perks = perks.filter((p) => !p.deprecated);

  return publicJson({ count: perks.length, perks });
}

export const OPTIONS = corsPreflight;
