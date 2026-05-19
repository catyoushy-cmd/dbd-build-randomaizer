'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { upsertOverride } from '@/lib/data/overrides';

export async function saveOverrideAction(formData: FormData) {
  await requireAdmin();

  const entity_type = formData.get('entity_type') as string;
  const entity_id   = formData.get('entity_id') as string;
  const name_ru     = (formData.get('name_ru') as string | null) || null;
  const description_ru = (formData.get('description_ru') as string | null) || null;
  const tier        = (formData.get('tier') as string | null) || null;
  const deprecated  = formData.get('deprecated') === 'true' ? true : null;

  await upsertOverride({ entity_type, entity_id, name_ru, description_ru, tier, deprecated });
  revalidatePath('/admin/content');
}
