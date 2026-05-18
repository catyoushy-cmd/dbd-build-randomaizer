import Link from 'next/link';

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

export default function Home() {
  return (
    <div className="mx-auto flex flex-col px-5 sm:px-10 pt-10 sm:pt-16 pb-12 sm:pb-20 gap-10 sm:gap-16 max-w-[860px]">
      {/* ── Hero / Altar ── */}
      <section className="animate-fade-up flex flex-col items-center text-center gap-5">
        {/* Altar ring SVG decoration */}
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
            {/* Cardinal sigils */}
            <g transform="translate(80 8) rotate(0)">
              <polygon points="-4,-3 4,-3 0,6" fill="none" stroke="var(--dbd-brass)" strokeWidth=".8" opacity=".6" />
            </g>
            <g transform="translate(152 80) rotate(90)">
              <polygon points="-4,-3 4,-3 0,6" fill="none" stroke="var(--dbd-brass)" strokeWidth=".8" opacity=".6" />
            </g>
            <g transform="translate(80 152) rotate(180)">
              <polygon points="-4,-3 4,-3 0,6" fill="none" stroke="var(--dbd-brass)" strokeWidth=".8" opacity=".6" />
            </g>
            <g transform="translate(8 80) rotate(270)">
              <polygon points="-4,-3 4,-3 0,6" fill="none" stroke="var(--dbd-brass)" strokeWidth=".8" opacity=".6" />
            </g>
            {/* Centre hex */}
            <polygon points="80,52 96,60 96,76 80,84 64,76 64,60" fill="none" stroke="var(--dbd-accent)" strokeWidth="1" opacity=".8" />
            <circle cx="80" cy="68" r="2.5" fill="var(--dbd-accent)" />
          </svg>
        </div>

        <div>
          <span className="label-mono text-[11px] text-ink-mute">Призыв</span>
          <h1 className="mt-2 mb-2 text-[42px] font-extrabold tracking-[-0.01em] text-dbd-bone leading-[1.05]">
            DBD Randomizer
          </h1>
          <p className="mt-2 mx-auto max-w-[380px] text-ink-mute text-[15px] leading-[1.6] italic">
            Брось четыре жребия в туман.
            <br />
            Что вернётся — то и понесёшь.
          </p>
        </div>

        <Link
          href="/roll"
          className="ritual-btn ritual-btn-primary animate-ritual-glow mt-2 px-14 py-[18px] text-[15px] no-underline inline-block"
        >
          БРОСИТЬ
        </Link>

        <span className="label-mono text-[10px] text-ink-faint">
          Пробел · R — горячие клавиши в рандомайзере
        </span>
      </section>

      {/* ── Divider ── */}
      <div className="ritual-divider">
        <span className="label-mono text-[10px]">Три пути</span>
      </div>

      {/* ── Mode cards ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MODES.map((m) => (
          <Link key={m.label} href={m.href} className="ritual-mode-card">
            <div className="flex items-center gap-3">
              <span className="text-[20px] text-dbd-accent leading-none">{m.glyph}</span>
              <span className="label-mono text-[10px] text-dbd-accent">{m.label}</span>
            </div>
            <div>
              <p className="m-0 font-bold text-[14px] text-dbd-bone tracking-[.02em]">{m.title}</p>
              <p className="m-0 mt-[6px] text-[12px] text-ink-mute leading-[1.55]">{m.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* ── Divider ── */}
      <div className="ritual-divider">
        <span className="label-mono text-[10px]">Обряд</span>
      </div>

      {/* ── How it works ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STEPS.map((step) => (
          <div key={step.n} className="ritual-step-card">
            <span className="label-mono text-[14px] text-dbd-accent leading-none shrink-0 pt-[2px]">
              {step.n}
            </span>
            <p className="m-0 text-[13px] text-ink-mute leading-[1.55]">{step.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
