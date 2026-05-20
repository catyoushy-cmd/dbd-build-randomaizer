import { fetchAddons } from '@/lib/data/content-db';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { publicJson, publicNotFound, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const [addons, overrides] = await Promise.all([
    fetchAddons(),
    fetchOverrides('addon'),
  ]);
  const merged = applyOverrides(addons, overrides);
  const addon = merged.find((a) => a.id === params.id);
  if (!addon) return publicNotFound(`addon "${params.id}" not found`);
  return publicJson(addon);
}

export const OPTIONS = corsPreflight;
