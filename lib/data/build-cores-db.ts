import { createClient } from '@/lib/supabase/server';
import BUILD_CORES_JSON from '@/data/build-cores.json';
import type { BuildCore } from '@/lib/data/types';

/**
 * Fetch active BuildCores from Supabase.
 * Falls back to JSON if the DB is unavailable (e.g., during static build).
 */
export async function fetchBuildCores(): Promise<BuildCore[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('build_cores')
      .select('*')
      .eq('active', true)
      .order('role')
      .order('mode')
      .order('name');

    if (error || !data?.length) {
      console.warn('[build-cores-db] Falling back to JSON:', error?.message);
      return BUILD_CORES_JSON as BuildCore[];
    }

    // Map snake_case DB columns to camelCase BuildCore type
    return data.map((row) => ({
      id:                  row.id,
      role:                row.role,
      mode:                row.mode,
      name:                row.name,
      description:         row.description,
      required_perks:      row.required_perks ?? [],
      recommended_perks:   row.recommended_perks ?? [],
      forbidden_perks:     row.forbidden_perks ?? [],
      preferred_item_type: row.preferred_item_type ?? undefined,
      preferred_addon_tags: row.preferred_addon_tags ?? [],
    })) as BuildCore[];
  } catch {
    return BUILD_CORES_JSON as BuildCore[];
  }
}

/** Admin: fetch all BuildCores (including inactive). */
export async function fetchAllBuildCores() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('build_cores')
    .select('*')
    .order('role')
    .order('mode')
    .order('name');

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Admin: upsert a BuildCore row. */
export async function upsertBuildCore(core: Record<string, unknown>) {
  const supabase = createClient();
  const { error } = await supabase
    .from('build_cores')
    .upsert(core, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

/** Admin: delete a BuildCore by id. */
export async function deleteBuildCore(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('build_cores')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
