import { fetchOfferings } from '@/lib/data/content-db';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { publicJson, publicNotFound, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const [offerings, overrides] = await Promise.all([
    fetchOfferings(),
    fetchOverrides('offering'),
  ]);
  const merged = applyOverrides(offerings, overrides);
  const offering = merged.find((o) => o.id === params.id);
  if (!offering) return publicNotFound(`offering "${params.id}" not found`);
  return publicJson(offering);
}

export const OPTIONS = corsPreflight;
