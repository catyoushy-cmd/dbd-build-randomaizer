import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { publicJson, publicNotFound } from './response';

/**
 * Generic [id] route handler for content entities that follow the
 * fetch → apply overrides → find-by-id → 404-or-json flow. Used by
 * /api/v1/{perks,addons,items,offerings}/[id].
 *
 * Pass `expand` to attach related data to the response body (e.g.
 * /items/[id] includes its compatible addons).
 *
 * The label is used in the 404 message — keep it singular and lowercase.
 */
export async function getEntityByIdWithOverrides<
  T extends {
    id: string;
    name?: { ru?: string };
    description?: { ru?: string };
    tier?: string;
    deprecated?: boolean;
    available_by_default?: boolean;
  },
>(
  id: string,
  opts: {
    fetch: () => Promise<T[]>;
    overrideKind: string;
    label: string;
    expand?: (entity: T) => Promise<Record<string, unknown>> | Record<string, unknown>;
  },
): Promise<Response> {
  const [raw, overrides] = await Promise.all([opts.fetch(), fetchOverrides(opts.overrideKind)]);
  const merged = applyOverrides(raw, overrides);
  const entity = merged.find((e) => e.id === id);
  if (!entity) return publicNotFound(`${opts.label} "${id}" not found`);
  const extra = opts.expand ? await opts.expand(entity) : {};
  return publicJson({ ...entity, ...extra });
}
