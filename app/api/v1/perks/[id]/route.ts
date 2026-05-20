import { fetchPerks } from '@/lib/data/content-db';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { publicJson, publicNotFound, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const [perks, overrides] = await Promise.all([
    fetchPerks(),
    fetchOverrides('perk'),
  ]);
  const merged = applyOverrides(perks, overrides);
  const perk = merged.find((p) => p.id === params.id);
  if (!perk) return publicNotFound(`perk "${params.id}" not found`);
  return publicJson(perk);
}

export const OPTIONS = corsPreflight;
