import { fetchAddons } from '@/lib/data/content-db';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { publicJson, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const killer = searchParams.get('killer');
  const item   = searchParams.get('item');
  const rarity = searchParams.get('rarity');

  const [addonsRaw, overrides] = await Promise.all([
    fetchAddons(),
    fetchOverrides('addon'),
  ]);
  let addons = applyOverrides(addonsRaw, overrides);

  if (killer) addons = addons.filter((a) => a.scope.type === 'killer' && a.scope.killerId === killer);
  if (item)   addons = addons.filter((a) => a.scope.type === 'item'   && a.scope.itemType === item);
  if (rarity) addons = addons.filter((a) => a.rarity === rarity);

  return publicJson({ count: addons.length, addons });
}

export const OPTIONS = corsPreflight;
