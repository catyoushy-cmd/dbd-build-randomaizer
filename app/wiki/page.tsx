import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 600;

const CATEGORY_LABEL: Record<string, string> = {
  guide:       'Гайд',
  'tier-list': 'Тир-лист',
  beginner:    'Для новичков',
  meta:        'Мета',
  other:       'Другое',
};

type Article = {
  id: string;
  slug: string;
  title: string;
  category: string;
  cover_url: string | null;
  created_at: string;
};

async function fetchArticles(): Promise<Article[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('wiki_articles')
      .select('id, slug, title, category, cover_url, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false });
    return (data ?? []) as Article[];
  } catch {
    return [];
  }
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '';
  }
}

export default async function WikiIndexPage() {
  const articles = await fetchArticles();

  // Group by category
  const byCat: Record<string, Article[]> = {};
  for (const a of articles) (byCat[a.category] ??= []).push(a);

  const CAT_ORDER = ['beginner', 'guide', 'tier-list', 'meta', 'other'];

  return (
    <div className="mx-auto max-w-[920px] px-5 sm:px-10 pt-10 sm:pt-12 pb-20">
      <div className="mb-8">
        <span className="label-mono text-[11px] text-ink-mute">Вики</span>
        <h1 className="mt-2 text-[28px] font-extrabold text-dbd-bone">Гайды и тир-листы</h1>
        <p className="mt-2 font-sans text-[14px] text-ink-mute max-w-[560px]">
          {articles.length === 0
            ? 'Скоро здесь появятся статьи о мете, обзоры персонажей и гайды для новичков.'
            : `${articles.length} статей по Dead by Daylight.`}
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="border border-line-1 bg-bg-1 px-5 py-10 text-center">
          <p className="m-0 font-sans text-[14px] text-ink-mute">
            Раздел в процессе наполнения. Если хочется внести вклад — пишите в issues на GitHub.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {CAT_ORDER.filter((c) => byCat[c]?.length).map((cat) => (
            <section key={cat}>
              <h2 className="m-0 mb-3 label-mono text-[11px] text-dbd-accent tracking-[.18em]">
                {CATEGORY_LABEL[cat] ?? cat}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {byCat[cat].map((a) => (
                  <Link
                    key={a.id}
                    href={`/wiki/${a.slug}`}
                    className="flex flex-col gap-2 p-5 border border-line-1 bg-bg-1 hover:border-line-ember hover:bg-bg-2 transition-colors no-underline cursor-pointer"
                  >
                    <span className="label-mono text-[10px] text-ink-faint">{fmtDate(a.created_at)}</span>
                    <h3 className="m-0 font-sans font-bold text-[16px] text-dbd-bone leading-tight">
                      {a.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
