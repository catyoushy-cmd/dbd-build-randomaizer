import { fetchSurvivors, fetchPerks } from '@/lib/data/content-db';
import { publicJson, publicNotFound, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const [survivors, perks] = await Promise.all([
    fetchSurvivors(),
    fetchPerks(),
  ]);
  const survivor = survivors.find((s) => s.id === params.id);
  if (!survivor) return publicNotFound(`survivor "${params.id}" not found`);

  const ownPerks = perks.filter(
    (p) => p.role === 'survivor' && (p.character?.toLowerCase().includes(params.id) ?? false),
  );

  return publicJson({ ...survivor, teachable_perks: ownPerks });
}

export const OPTIONS = corsPreflight;
