import { createClient, createServiceClient } from '@/lib/supabase/server';

export type ContentOverride = {
  entity_type: string;
  entity_id: string;
  name_ru?: string | null;
  description_ru?: string | null;
  tier?: string | null;
  deprecated?: boolean | null;
};

/** Fetch all overrides for a given entity type. Cached at ISR level by Next.js. */
export async function fetchOverrides(entityType: string): Promise<Map<string, ContentOverride>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('content_overrides')
      .select('*')
      .eq('entity_type', entityType);

    if (error || !data) return new Map();

    return new Map(data.map((row) => [row.entity_id, row as ContentOverride]));
  } catch {
    return new Map();
  }
}

/** Merge an array of data items with their overrides. */
export function applyOverrides<T extends { id: string; name?: { ru?: string }; description?: { ru?: string }; tier?: string; deprecated?: boolean }>(
  items: T[],
  overrides: Map<string, ContentOverride>,
): T[] {
  return items.map((item) => {
    const ov = overrides.get(item.id);
    if (!ov) return item;

    return {
      ...item,
      ...(ov.name_ru != null && {
        name: { ...(item.name ?? {}), ru: ov.name_ru },
      }),
      ...(ov.description_ru != null && {
        description: { ...(item.description ?? {}), ru: ov.description_ru },
      }),
      ...(ov.tier != null && { tier: ov.tier }),
      ...(ov.deprecated != null && { deprecated: ov.deprecated }),
    };
  });
}

/** Admin: upsert a single override. */
export async function upsertOverride(override: Omit<ContentOverride, never>) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('content_overrides')
    .upsert(override, { onConflict: 'entity_type,entity_id' });
  if (error) throw new Error(error.message);
}

/** Admin: fetch all overrides for a type (for the editor table). */
export async function fetchAllOverrides(entityType: string): Promise<ContentOverride[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('content_overrides')
    .select('*')
    .eq('entity_type', entityType)
    .order('entity_id');
  if (error) throw new Error(error.message);
  return (data ?? []) as ContentOverride[];
}
