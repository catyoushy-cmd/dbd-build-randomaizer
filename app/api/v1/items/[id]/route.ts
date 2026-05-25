import { fetchItems, fetchAddons } from '@/lib/data/content-db';
import { getEntityByIdWithOverrides } from '@/lib/api/entity-routes';
import { corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export const GET = (_req: Request, { params }: { params: { id: string } }) =>
  getEntityByIdWithOverrides(params.id, {
    fetch: fetchItems,
    overrideKind: 'item',
    label: 'item',
    expand: async (item) => {
      const addons = await fetchAddons();
      return {
        compatible_addons: addons.filter(
          (a) => a.scope.type === 'item' && a.scope.itemType === item.type,
        ),
      };
    },
  });

export const OPTIONS = corsPreflight;
