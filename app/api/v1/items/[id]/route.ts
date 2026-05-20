import { fetchItems, fetchAddons } from '@/lib/data/content-db';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { publicJson, publicNotFound, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const [itemsRaw, overrides, addons] = await Promise.all([
    fetchItems(),
    fetchOverrides('item'),
    fetchAddons(),
  ]);
  const items = applyOverrides(itemsRaw, overrides);
  const item = items.find((i) => i.id === params.id);
  if (!item) return publicNotFound(`item "${params.id}" not found`);

  const compatibleAddons = addons.filter(
    (a) => a.scope.type === 'item' && a.scope.itemType === item.type,
  );

  return publicJson({ ...item, compatible_addons: compatibleAddons });
}

export const OPTIONS = corsPreflight;
