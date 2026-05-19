import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';

export default async function ArticlesPage() {
  const supabase = createServiceClient();
  const { data: articles } = await supabase
    .from('wiki_articles')
    .select('id, slug, title, category, published, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="label-mono text-[10px] text-ink-mute">Вики</span>
          <h1 className="mt-1 text-[22px] font-extrabold text-dbd-bone">Статьи</h1>
        </div>
        <Link href="/admin/articles/new" className="ritual-btn ritual-btn-primary px-4 py-2 text-[11px]">
          + Добавить
        </Link>
      </div>

      {(!articles || articles.length === 0) ? (
        <p className="text-ink-faint text-[13px]">Статей пока нет</p>
      ) : (
        <div className="border border-line-1 divide-y divide-line-1">
          {articles.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-4 px-4 py-3 bg-bg-1 hover:bg-bg-2 transition-colors duration-100"
            >
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-sans text-[13px] font-semibold text-dbd-bone truncate">{a.title}</span>
                <span className="label-mono text-[9px] text-ink-faint mt-0.5">/wiki/{a.slug} · {a.category}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`label-mono text-[9px] px-2 py-0.5 border ${
                  a.published
                    ? 'text-dbd-accent border-line-ember'
                    : 'text-ink-faint border-line-1'
                }`}>
                  {a.published ? 'published' : 'draft'}
                </span>
                <Link
                  href={`/admin/articles/${a.id}`}
                  className="ritual-btn ritual-btn-ghost px-3 py-1 text-[10px]"
                >
                  Изменить
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
