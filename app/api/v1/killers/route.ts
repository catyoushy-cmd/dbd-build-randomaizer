import { fetchKillers } from '@/lib/data/content-db';
import { publicJson, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET() {
  const killers = await fetchKillers();
  return publicJson({ count: killers.length, killers });
}

export const OPTIONS = corsPreflight;
