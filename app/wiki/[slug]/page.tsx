import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { renderMarkdown } from '@/lib/markdown';

export const revalidate = 600;

const CATEGORY_LABEL: Record<string, string> = {
  guide:       'Гайд',
  'tier-list': 'Тир-лист',
  beginner:    'Для новичков',
  meta:        'Мета',
  other:       'Другое',
};

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('wiki_articles')
      .select('title')
      .eq('slug', params.slug)
      .eq('published', true)
      .single();
    return { title: data ? `${data.title} · DBD Wiki` : 'Статья · DBD Wiki' };
  } catch {
    return { title: 'Статья · DBD Wiki' };
  }
}

export default async function ArticlePage({ params }: Props) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('wiki_articles')
    .select('id, slug, title, body_md, category, cover_url, created_at')
    .eq('slug', params.slug)
    .eq('published', true)
    .single();

  if (error || !data) notFound();

  const html = renderMarkdown(data.body_md ?? '');
  const created = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(data.created_at));

  return (
    <article className="mx-auto max-w-[760px] px-5 sm:px-10 pt-10 sm:pt-12 pb-20">
      <div className="mb-6">
        <Link href="/wiki" className="label-mono text-[10px] text-ink-mute hover:text-ink no-underline">
          ← Все статьи
        </Link>
      </div>

      <header className="mb-8 pb-6 border-b border-line-1 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="label-mono text-[10px] px-2 py-1 border border-line-ember text-dbd-accent">
            {CATEGORY_LABEL[data.category] ?? data.category}
          </span>
          <span className="label-mono text-[10px] text-ink-faint">{created}</span>
        </div>
        <h1 className="m-0 text-[32px] font-extrabold text-dbd-bone leading-[1.1] tracking-[-0.01em]">
          {data.title}
        </h1>
      </header>

      <div
        className="wiki-prose font-sans text-[15px] text-ink leading-[1.7]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
