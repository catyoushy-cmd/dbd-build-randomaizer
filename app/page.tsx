import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { fetchAllContent } from '@/lib/data/content-db';

export const revalidate = 600;

const MODES = [
  {
    glyph: '⚄',
    title: 'Полный рандом',
    label: 'RANDOM',
    desc: 'Любые 4 перка, случайный предмет и аддоны — чистая лотерея.',
    href: '/roll?mode=random',
  },
  {
    glyph: '⚡',
    title: 'Эффективность',
    label: 'EFFICIENT',
    desc: 'Синергичный билд под реальные задачи. Генераторы, погоня, контроль.',
    href: '/roll?mode=efficient',
  },
  {
    glyph: '✦',
    title: 'Веселье',
    label: 'FUN',
    desc: 'Гиммик-билды, которые редко работают — но когда работают, это незабываемо.',
    href: '/roll?mode=fun',
  },
];

const STEPS = [
  { n: 'I',   text: 'Выбери роль и персонажа' },
  { n: 'II',  text: 'Выбери режим и брось жребий' },
  { n: 'III', text: 'Закрепи понравившиеся слоты и перекинь остальное' },
];

type Article = {
  id: string;
  slug: string;
  title: string;
  category: string;
  cover_url: string | null;
  created_at: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  guide:       'Гайд',
  'tier-list': 'Тир-лист',
  beginner:    'Для новичков',
  meta:        'Мета',
  other:       'Другое',
};

async function fetchLatestArticles(limit = 4): Promise<Article[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('wiki_articles')
      .select('id, slug, title, category, cover_url, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as Article[];
  } catch {
    return [];
  }
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(d);
  } catch {
    return '';
  }
}

export default async function Home() {
  const [content, articles] = await Promise.all([
    fetchAllContent(),
    fetchLatestArticles(4),
  ]);

  const ENCYCLOPEDIA = [
    { href: '/perks',     label: 'Перки',       count: content.perks.length,     glyph: '◆' },
    { href: '/killers',   label: 'Убийцы',      count: content.killers.length,   glyph: '⛧' },
    { href: '/survivors', label: 'Выжившие',    count: content.survivors.length, glyph: '☥' },
    { href: '/items',     label: 'Предметы',    count: content.items.length,     glyph: '⚙' },
    { href: '/addons',    label: 'Аддоны',      count: content.addons.length,    glyph: '✦' },
    { href: '/offerings', label: 'Подношения',  count: content.offerings.length, glyph: '⌘' },
  ];

  return (
    <div className="mx-auto flex flex-col px-5 sm:px-10 pt-10 sm:pt-16 pb-12 sm:pb-20 gap-10 sm:gap-16 max-w-[920px]">
      {/* ── Hero / Altar ── */}
      <section className="animate-fade-up flex flex-col items-center text-center gap-5">
        <div className="relative w-[160px] h-[160px] mb-2">
          <svg viewBox="0 0 160 160" className="w-full h-full">
            <defs>
              <radialGradient id="altarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"  stopColor="var(--dbd-accent)" stopOpacity=".3" />
                <stop offset="60%" stopColor="var(--dbd-accent)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="80" cy="80" r="75" fill="url(#altarGlow)" />
            <circle cx="80" cy="80" r="72" fill="none" stroke="var(--line-1)" strokeWidth="1" />
            <circle cx="80" cy="80" r="58" fill="none" stroke="var(--line-1)" strokeWidth=".5" strokeDasharray="2 6" />
            <circle cx="80" cy="80" r="42" fill="none" stroke="var(--line-2)" strokeWidth=".5" />
            <g transform="translate(80 8) rotate(0)"><polygon points="-4,-3 4,-3 0,6" fill="none" stroke="var(--dbd-brass)" strokeWidth=".8" opacity=".6" /></g>
            <g transform="translate(152 80) rotate(90)"><polygon points="-4,-3 4,-3 0,6" fill="none" stroke="var(--dbd-brass)" strokeWidth=".8" opacity=".6" /></g>
            <g transform="translate(80 152) rotate(180)"><polygon points="-4,-3 4,-3 0,6" fill="none" stroke="var(--dbd-brass)" strokeWidth=".8" opacity=".6" /></g>
            <g transform="translate(8 80) rotate(270)"><polygon points="-4,-3 4,-3 0,6" fill="none" stroke="var(--dbd-brass)" strokeWidth=".8" opacity=".6" /></g>
            <polygon points="80,52 96,60 96,76 80,84 64,76 64,60" fill="none" stroke="var(--dbd-accent)" strokeWidth="1" opacity=".8" />
            <circle cx="80" cy="68" r="2.5" fill="var(--dbd-accent)" />
          </svg>
        </div>

        <div>
          <span className="label-mono text-[11px] text-ink-mute">Призыв</span>
          <h1 className="mt-2 mb-2 text-[42px] font-extrabold tracking-[-0.01em] text-dbd-bone leading-[1.05]">
            DBD Randomizer
          </h1>
          <p className="mt-2 mx-auto max-w-[420px] text-ink text-[15px] leading-[1.6]">
            Случайные билды, справочник по перкам и аддонам, гайды по мете.
            Брось четыре жребия в туман — и узнай, что вернётся.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/roll"
            className="ritual-btn ritual-btn-primary animate-ritual-glow px-10 py-[16px] text-[15px] no-underline inline-block"
          >
            ✦ БРОСИТЬ
          </Link>
          <Link
            href="/perks"
            className="ritual-btn ritual-btn-ghost px-8 py-[16px] text-[13px] no-underline inline-block"
          >
            Открыть энциклопедию →
          </Link>
        </div>

        <span className="label-mono text-[10px] text-ink-faint">
          Пробел · R — горячие клавиши в рандомайзере
        </span>
      </section>

      {/* ── Three modes ── */}
      <div className="ritual-divider">
        <span className="label-mono text-[10px]">Три пути</span>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MODES.map((m) => (
          <Link key={m.label} href={m.href} className="ritual-mode-card">
            <div className="flex items-center gap-3">
              <span className="text-[20px] text-dbd-accent leading-none">{m.glyph}</span>
              <span className="label-mono text-[10px] text-dbd-accent">{m.label}</span>
            </div>
            <div>
              <p className="m-0 font-bold text-[14px] text-dbd-bone tracking-[.02em]">{m.title}</p>
              <p className="m-0 mt-[6px] text-[13px] text-ink-mute leading-[1.55]">{m.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* ── Encyclopedia ── */}
      <div className="ritual-divider">
        <span className="label-mono text-[10px]">Энциклопедия</span>
      </div>

      <section className="flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ENCYCLOPEDIA.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="flex flex-col items-start gap-2 p-4 border border-line-1 bg-bg-1 hover:border-line-ember hover:bg-bg-2 transition-colors no-underline cursor-pointer"
            >
              <span className="text-[22px] text-dbd-accent leading-none">{e.glyph}</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-sans text-[14px] font-semibold text-dbd-bone">{e.label}</span>
                <span className="label-mono text-[10px] text-ink-mute">{e.count} шт.</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Latest articles ── */}
      <div className="ritual-divider">
        <span className="label-mono text-[10px]">Последние гайды</span>
      </div>

      <section className="flex flex-col gap-4">
        {articles.length === 0 ? (
          <div className="border border-line-1 bg-bg-1 px-5 py-8 text-center">
            <p className="m-0 font-sans text-[14px] text-ink-mute">
              Пока ни одной статьи. <span className="text-ink-faint">Скоро здесь появятся гайды и тир-листы.</span>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/wiki/${a.slug}`}
                className="flex flex-col gap-2 p-5 border border-line-1 bg-bg-1 hover:border-line-ember hover:bg-bg-2 transition-colors no-underline cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="label-mono text-[10px] px-2 py-0.5 border border-line-2 text-dbd-accent">
                    {CATEGORY_LABEL[a.category] ?? a.category}
                  </span>
                  <span className="label-mono text-[10px] text-ink-faint">{fmtDate(a.created_at)}</span>
                </div>
                <h3 className="m-0 font-sans font-bold text-[16px] text-dbd-bone leading-tight">
                  {a.title}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── How it works ── */}
      <div className="ritual-divider">
        <span className="label-mono text-[10px]">Обряд</span>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STEPS.map((step) => (
          <div key={step.n} className="ritual-step-card">
            <span className="label-mono text-[14px] text-dbd-accent leading-none shrink-0 pt-[2px]">
              {step.n}
            </span>
            <p className="m-0 text-[13px] text-ink leading-[1.55]">{step.text}</p>
          </div>
        ))}
      </section>

      {/* ── API for makers ── */}
      <section className="border border-line-1 bg-bg-1 px-5 sm:px-7 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex-1">
          <span className="label-mono text-[10px] text-dbd-accent">Для контент-мейкеров</span>
          <h3 className="m-0 mt-1 font-sans font-bold text-[16px] text-dbd-bone">Публичный API</h3>
          <p className="m-0 mt-2 font-sans text-[13px] text-ink-mute leading-[1.55] max-w-[480px]">
            Бесплатный JSON для перков, аддонов, подношений и персонажей.
            Без ключей, CORS открыт. Подойдёт для оверлеев, ботов и сайдкиков.
          </p>
        </div>
        <Link href="/api/docs" className="ritual-btn ritual-btn-ghost px-5 py-2 text-[12px] no-underline shrink-0">
          Документация →
        </Link>
      </section>
    </div>
  );
}
