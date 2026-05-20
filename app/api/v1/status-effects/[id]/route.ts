import { fetchStatusEffects } from '@/lib/data/content-db';
import { publicJson, publicNotFound, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const effects = await fetchStatusEffects();
  const effect = effects.find((e) => e.id === params.id || e.source_key === params.id);
  if (!effect) return publicNotFound(`status effect "${params.id}" not found`);
  return publicJson(effect);
}

export const OPTIONS = corsPreflight;
