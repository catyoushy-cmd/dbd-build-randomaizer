import Link from 'next/link';
import { Dices, Zap, PartyPopper, Shuffle } from 'lucide-react';

const MODES = [
  {
    icon: <Dices size={22} className="text-primary" />,
    title: 'Полный рандом',
    desc: 'Любые 4 перка, случайный предмет и аддоны — чистая лотерея.',
    href: '/roll?mode=random',
  },
  {
    icon: <Zap size={22} className="text-primary" />,
    title: 'Эффективность',
    desc: 'Синергичный билд под реальные задачи. Генераторы, погоня, контроль.',
    href: '/roll?mode=efficient',
  },
  {
    icon: <PartyPopper size={22} className="text-primary" />,
    title: 'Веселье',
    desc: 'Гиммик-билды, которые редко работают — но когда работают, это незабываемо.',
    href: '/roll?mode=fun',
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-12">
      {/* Hero */}
      <section className="text-center space-y-4 animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          <Shuffle size={12} />
          Dead by Daylight Build Randomizer
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Хватит выбирать перки вручную
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Выбери выжившего или убийцу, нажми Roll — получи готовый билд за секунду.
        </p>
        <Link
          href="/roll"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-base font-bold text-primary-foreground shadow-lg hover:opacity-90 transition-all active:scale-[0.98]"
        >
          <Dices size={18} />
          Начать роллить
        </Link>
      </section>

      {/* Mode cards */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
          Три режима
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map((m) => (
            <Link
              key={m.title}
              href={m.href}
              className="hover-lift flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              {m.icon}
              <div>
                <p className="font-semibold text-sm">{m.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
          Как работает
        </h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { n: '1', text: 'Выбери роль и персонажа' },
            { n: '2', text: 'Выбери режим и нажми Roll' },
            { n: '3', text: 'Закрепи понравившиеся слоты и перекинь остальное' },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {step.n}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
