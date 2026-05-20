import { fetchSurvivors } from '@/lib/data/content-db';
import { publicJson, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET() {
  const survivors = await fetchSurvivors();
  return publicJson({ count: survivors.length, survivors });
}

export const OPTIONS = corsPreflight;
