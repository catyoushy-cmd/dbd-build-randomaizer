'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function saveStatusEffectAction(formData: FormData) {
  await requireAdmin();
  const supabase = createServiceClient();

  const id          = (formData.get('id') as string).trim();
  const source_key  = ((formData.get('source_key') as string | null) || '').trim() || null;
  const name_en     = ((formData.get('name_en') as string | null) || '').trim();
  const name_ru     = ((formData.get('name_ru') as string | null) || '').trim();
  const desc_en     = ((formData.get('description_en') as string | null) || '').trim();
  const desc_ru     = ((formData.get('description_ru') as string | null) || '').trim();
  const category    = (formData.get('category') as string) || 'status';
  const icon        = ((formData.get('icon') as string | null) || '').trim() || null;

  const row = {
    id,
    source_key,
    name:        { en: name_en, ru: name_ru },
    description: { en: desc_en, ru: desc_ru },
    category,
    icon,
  };

  const { error } = await supabase
    .from('status_effects')
    .upsert(row, { onConflict: 'id' });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/status-effects');
  revalidatePath('/status-effects');
  redirect('/admin/status-effects');
}

export async function deleteStatusEffectAction(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from('status_effects').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/status-effects');
  redirect('/admin/status-effects');
}
