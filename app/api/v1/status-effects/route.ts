import { fetchStatusEffects } from '@/lib/data/content-db';
import { publicJson, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  let effects = await fetchStatusEffects();
  if (category) effects = effects.filter((e) => e.category === category);

  return publicJson({ count: effects.length, status_effects: effects });
}

export const OPTIONS = corsPreflight;
