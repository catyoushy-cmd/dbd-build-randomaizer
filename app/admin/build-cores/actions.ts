'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { upsertBuildCore, deleteBuildCore } from '@/lib/data/build-cores-db';

export async function saveBuildCoreAction(formData: FormData) {
  await requireAdmin();

  const id = (formData.get('id') as string).trim();
  const name = (formData.get('name') as string).trim();
  const role = formData.get('role') as string;
  const mode = formData.get('mode') as string;
  const description = (formData.get('description') as string | null)?.trim() ?? null;
  const active = formData.get('active') === 'true';
  const preferred_item_type = (formData.get('preferred_item_type') as string | null)?.trim() || null;

  const parseJsonArray = (key: string): string[] => {
    try {
      const val = formData.get(key) as string | null;
      if (!val?.trim()) return [];
      return JSON.parse(val);
    } catch {
      const val = formData.get(key) as string | null;
      return (val ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    }
  };

  const core = {
    id,
    name,
    role,
    mode,
    description,
    active,
    preferred_item_type,
    required_perks:      parseJsonArray('required_perks'),
    recommended_perks:   parseJsonArray('recommended_perks'),
    forbidden_perks:     parseJsonArray('forbidden_perks'),
    preferred_addon_tags: parseJsonArray('preferred_addon_tags'),
  };

  await upsertBuildCore(core);
  revalidatePath('/admin/build-cores');
  redirect('/admin/build-cores');
}

export async function deleteBuildCoreAction(id: string) {
  await requireAdmin();
  await deleteBuildCore(id);
  revalidatePath('/admin/build-cores');
  redirect('/admin/build-cores');
}
