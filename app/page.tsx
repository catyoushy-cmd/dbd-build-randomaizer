import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { fetchAllContent } from '@/lib/data/content-db';
import { CategoryCover } from '@/lib/category-cover';
import { IconImg } from '@/components/ui/icon-img';

export const revalidate = 600;

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  cover_url: string | null;
  created_at: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  beginner:    'Для новичков',
  guide:       'Гайд',
  'tier-list': 'Тир-лист',
  meta:        'Мета',
  tips:        'Советы',
  lore:        'Лор',
  other:       'Другое',
};

async function fetchLatestArticles(limit = 4): Promise<Article[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('wiki_articles')
      .select('id, slug, title, excerpt, category, cover_url, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data ?? []) as Article[];
  } catch {
    return [];
  }
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(iso));
  } catch {
    return '';
  }
}

export default async function Home() {
  const [content, articles] = await Promise.all([
    fetchAllContent(),
    fetchLatestArticles(4),
  ]);

  // Pick a hero perk preview (S-tier perk with an icon)
  const heroPerk = content.perks.find((p) => p.id === 'adrenaline')
    ?? content.perks.find((p) => p.tier === 'S' && p.role === 'survivor')
    ?? content.perks[0];

  // Sample portraits for killer/survivor cards
  const heroKiller = content.killers[0];   // Trapper
  const heroSurvivor = content.survivors[0]; // Dwight

  const availableItems = content.items.filter((i) => i.available_by_default !== false).length;
  const availableOfferings = content.offerings.filter((o) => o.available_by_default !== false).length;

  return (
    <div className="mx-auto flex flex-col px-5 sm:px-10 pt-10 sm:pt-16 pb-12 sm:pb-20 gap-12 sm:gap-16 max-w-[1080px]">
      {/* ── Hero ── */}
      <section className="animate-fade-up flex flex-col items-start gap-5 max-w-[760px]">
        <span className="label-mono text-[11px] text-dbd-accent">Dead by Daylight · фан-проект</span>
        <h1 className="m-0 text-[40px] sm:text-[52px] font-extrabold tracking-[-0.02em] text-dbd-bone leading-[1.02]">
          Перки, аддоны, гайды и рандомайзер билдов
        </h1>
        <p className="m-0 text-ink text-[16px] sm:text-[17px] leading-[1.55] max-w-[600px]">
          Энциклопедия Dead by Daylight на русском: 309 перков с описаниями и переводом,
          903 аддона по убийцам и предметам, 94 персонажа и тир-листы.
          В довесок — рандомайзер билдов для тех, кому надоело играть&nbsp;«своё».
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          <Link href="/perks" className="ritual-btn ritual-btn-primary px-7 py-[14px] text-[14px] no-underline">
            Открыть энциклопедию →
          </Link>
          <Link href="/roll" className="ritual-btn ritual-btn-ghost px-6 py-[14px] text-[13px] no-underline">
            Бросить жребий
          </Link>
        </div>
      </section>

      {/* ── Encyclopedia — varied layout ── */}
      <section className="flex flex-col gap-4">
        <div className="ritual-divider">
          <span className="label-mono text-[10px]">Энциклопедия</span>
        </div>

        {/* Row 1: Perks (large hero card) */}
        <Link
          href="/perks"
          className="group relative flex flex-col sm:flex-row items-stretch border border-line-2 bg-bg-1 hover:border-line-ember transition-colors duration-200 overflow-hidden no-underline"
        >
          <div className="flex flex-col gap-3 p-6 sm:p-7 flex-1">
            <span className="label-mono text-[10px] text-dbd-accent">Основа любого билда</span>
            <h2 className="m-0 font-sans font-bold text-[24px] text-dbd-bone leading-tight group-hover:text-dbd-accent transition-colors">
              Перки <span className="text-ink-mute text-[16px] font-normal">— {content.perks.length}</span>
            </h2>
            <p className="m-0 font-sans text-[14px] text-ink-mute leading-[1.55]">
              309 перков с описаниями, тиерами уровней и русским переводом. Сгруппированы по персонажам
              в порядке выхода в игре. Поиск с тегами по назначению — погоня, генраш, лечение, тотемы.
            </p>
            <span className="label-mono text-[11px] text-dbd-accent mt-1">309 перков →</span>
          </div>
          <div className="hidden sm:flex items-center justify-center px-6 py-6 border-l border-line-1 bg-bg-2 min-w-[180px]">
            {heroPerk && (
              <div className="w-24 h-24 border border-line-ember bg-bg-1 flex items-center justify-center overflow-hidden">
                <IconImg src={heroPerk.icon} alt={heroPerk.name.ru} size={88} fallback={<span className="text-ink-faint">⚙</span>} />
              </div>
            )}
          </div>
        </Link>

        {/* Row 2: Killers + Survivors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/killers"
            className="group flex items-center gap-4 border border-line-1 bg-bg-1 hover:border-line-ember transition-colors duration-200 p-5 no-underline"
          >
            <div className="w-16 h-16 shrink-0 border border-line-2 bg-bg-2 flex items-center justify-center overflow-hidden">
              {heroKiller && <IconImg src={heroKiller.icon} alt={heroKiller.name.ru} size={56} fallback={<span className="text-dbd-blood">⛧</span>} />}
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <h3 className="m-0 font-sans font-bold text-[18px] text-dbd-bone leading-tight group-hover:text-dbd-accent transition-colors">
                Убийцы <span className="text-ink-mute text-[14px] font-normal">— {content.killers.length}</span>
              </h3>
              <p className="m-0 font-sans text-[13px] text-ink-mute leading-[1.5]">
                42 убийцы со своей силой и набором аддонов
              </p>
            </div>
          </Link>

          <Link
            href="/survivors"
            className="group flex items-center gap-4 border border-line-1 bg-bg-1 hover:border-line-ember transition-colors duration-200 p-5 no-underline"
          >
            <div className="w-16 h-16 shrink-0 border border-line-2 bg-bg-2 flex items-center justify-center overflow-hidden">
              {heroSurvivor && <IconImg src={heroSurvivor.icon} alt={heroSurvivor.name.ru} size={56} fallback={<span className="text-dbd-accent">☥</span>} />}
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <h3 className="m-0 font-sans font-bold text-[18px] text-dbd-bone leading-tight group-hover:text-dbd-accent transition-colors">
                Выжившие <span className="text-ink-mute text-[14px] font-normal">— {content.survivors.length}</span>
              </h3>
              <p className="m-0 font-sans text-[13px] text-ink-mute leading-[1.5]">
                52 выживших, общий пул перков
              </p>
            </div>
          </Link>
        </div>

        {/* Row 3: Items / Addons / Offerings compact */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CompactCard
            href="/items"
            glyph="⚙"
            title="Предметы"
            count={availableItems}
            desc="Базовые предметы выжившего"
          />
          <CompactCard
            href="/addons"
            glyph="✦"
            title="Аддоны"
            count={content.addons.length}
            desc="По убийцам и типам предметов"
          />
          <CompactCard
            href="/offerings"
            glyph="⌘"
            title="Подношения"
            count={availableOfferings}
            desc="Влияют на матч и карту"
          />
        </div>
      </section>

      {/* ── Latest articles ── */}
      <section className="flex flex-col gap-4">
        <div className="ritual-divider">
          <span className="label-mono text-[10px]">Последние гайды</span>
        </div>

        {articles.length === 0 ? (
          <div className="border border-line-1 bg-bg-1 px-5 py-8 text-center">
            <p className="m-0 font-sans text-[14px] text-ink-mute">
              Пока ни одной статьи. <span className="text-ink-faint">Скоро здесь появятся гайды и тир-листы.</span>
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
            <div className="flex justify-end mt-2">
              <Link href="/wiki" className="label-mono text-[10px] text-dbd-accent hover:text-dbd-glow no-underline">
                Все гайды →
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ── API teaser ── */}
      <section className="border border-line-1 bg-bg-1 px-5 sm:px-7 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="flex-1">
          <span className="label-mono text-[10px] text-dbd-accent">Для контент-мейкеров</span>
          <h3 className="m-0 mt-1 font-sans font-bold text-[18px] text-dbd-bone">Публичный JSON API</h3>
          <p className="m-0 mt-2 font-sans text-[13.5px] text-ink-mute leading-[1.55] max-w-[520px]">
            Все данные доступны через REST без ключей и регистрации. CORS открыт.
            Подойдёт для стрим-оверлеев, дискорд-ботов, сайдкиков.
          </p>
          <code className="block mt-3 font-mono text-[12px] text-ink-mute bg-bg-2 border border-line-1 px-3 py-1.5 max-w-[420px] truncate">
            GET /api/v1/perks?role=killer&amp;tier=S
          </code>
        </div>
        <Link href="/api/docs" className="ritual-btn ritual-btn-ghost px-5 py-2.5 text-[12px] no-underline shrink-0">
          Документация →
        </Link>
      </section>
    </div>
  );
}

/* ───────── Compact card ───────── */

function CompactCard({
  href, glyph, title, count, desc,
}: {
  href: string;
  glyph: string;
  title: string;
  count: number;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 p-5 border border-line-1 bg-bg-1 hover:border-line-ember transition-colors duration-200 no-underline"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-[22px] text-dbd-accent leading-none">{glyph}</span>
        <span className="font-sans text-[16px] font-bold text-dbd-bone group-hover:text-dbd-accent transition-colors">{title}</span>
        <span className="ml-auto label-mono text-[10px] text-ink-faint">{count}</span>
      </div>
      <p className="m-0 font-sans text-[13px] text-ink-mute leading-[1.5]">{desc}</p>
    </Link>
  );
}

/* ───────── Article card ───────── */

function ArticleCard({ article: a }: { article: Article }) {
  return (
    <Link
      href={`/wiki/${a.slug}`}
      className="group flex flex-col border border-line-1 bg-bg-1 hover:border-line-ember transition-colors duration-200 no-underline overflow-hidden"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-bg-2 border-b border-line-1">
        {a.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <CategoryCover category={a.category} className="w-full h-full" />
        )}
      </div>
      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2">
          <span className="label-mono text-[10px] px-2 py-0.5 border border-line-2 text-dbd-accent">
            {CATEGORY_LABEL[a.category] ?? a.category}
          </span>
          <span className="label-mono text-[10px] text-ink-faint">{fmtDate(a.created_at)}</span>
        </div>
        <h3 className="m-0 font-sans font-bold text-[17px] text-dbd-bone leading-tight group-hover:text-dbd-accent transition-colors">
          {a.title}
        </h3>
        {a.excerpt && (
          <p className="m-0 font-sans text-[13px] text-ink-mute leading-[1.55] line-clamp-2">
            {a.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
