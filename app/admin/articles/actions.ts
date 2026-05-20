'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function saveArticleAction(formData: FormData) {
  const user = await requireAdmin();
  const supabase = createServiceClient();

  const id         = (formData.get('id') as string | null) || undefined;
  const slug       = (formData.get('slug') as string).trim();
  const title      = (formData.get('title') as string).trim();
  const body_md    = (formData.get('body_md') as string).trim();
  const category   = (formData.get('category') as string) || 'guide';
  const published  = formData.get('published') === 'true';
  const cover_url  = (formData.get('cover_url') as string | null)?.trim() || null;
  const excerpt    = (formData.get('excerpt') as string | null)?.trim() || null;

  const row = {
    ...(id ? { id } : {}),
    slug,
    title,
    body_md,
    category,
    published,
    cover_url,
    excerpt,
    author_id: user?.id ?? null,
  };

  const { error } = await supabase
    .from('wiki_articles')
    .upsert(row, { onConflict: 'slug' });

  if (error) throw new Error(error.message);
  revalidatePath('/admin/articles');
  redirect('/admin/articles');
}

export async function deleteArticleAction(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from('wiki_articles').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/articles');
  redirect('/admin/articles');
}
