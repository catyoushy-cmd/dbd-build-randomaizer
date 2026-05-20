import { fetchItems } from '@/lib/data/content-db';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { publicJson, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  const [itemsRaw, overrides] = await Promise.all([
    fetchItems(),
    fetchOverrides('item'),
  ]);
  let items = applyOverrides(itemsRaw, overrides);

  if (type) items = items.filter((i) => i.type === type);

  return publicJson({ count: items.length, items });
}

export const OPTIONS = corsPreflight;
