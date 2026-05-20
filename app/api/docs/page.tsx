import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API · DBD Build Randomizer',
  description: 'Публичный JSON API для контент-мейкеров: перки, аддоны, подношения, предметы, персонажи Dead by Daylight.',
};

const ENDPOINTS: { method: string; path: string; query?: string; desc: string; example?: string }[] = [
  { method: 'GET', path: '/api/v1',                   desc: 'Корневой эндпоинт со списком всех ресурсов.' },
  { method: 'GET', path: '/api/v1/all',               desc: 'Весь контент в одном ответе. Удобно для офлайн-кеша или скриптов.' },
  { method: 'GET', path: '/api/v1/perks',             query: '?role=survivor|killer&tier=S|A|B|C&deprecated=true', desc: 'Список перков. По умолчанию устаревшие скрыты.', example: '/api/v1/perks?role=survivor&tier=S' },
  { method: 'GET', path: '/api/v1/perks/{id}',        desc: 'Один перк по slug.', example: '/api/v1/perks/adrenaline' },
  { method: 'GET', path: '/api/v1/killers',           desc: 'Все убийцы.' },
  { method: 'GET', path: '/api/v1/killers/{id}',      desc: 'Убийца + его уникальные аддоны + перки, которые он открывает.', example: '/api/v1/killers/trapper' },
  { method: 'GET', path: '/api/v1/survivors',         desc: 'Все выжившие.' },
  { method: 'GET', path: '/api/v1/survivors/{id}',    desc: 'Выживший + его teachable-перки.', example: '/api/v1/survivors/dwight-fairfield' },
  { method: 'GET', path: '/api/v1/items',             query: '?type=medkit|toolbox|flashlight|map|key', desc: 'Все предметы выживших.' },
  { method: 'GET', path: '/api/v1/items/{id}',        desc: 'Предмет + совместимые аддоны.', example: '/api/v1/items/camping-aid-kit' },
  { method: 'GET', path: '/api/v1/addons',            query: '?killer=<id>&item=<type>&rarity=common|...', desc: 'Аддоны с фильтрами.', example: '/api/v1/addons?killer=trapper' },
  { method: 'GET', path: '/api/v1/addons/{id}',       desc: 'Один аддон по slug.' },
  { method: 'GET', path: '/api/v1/offerings',         query: '?role=survivor|killer|both&rarity=...', desc: 'Подношения.' },
  { method: 'GET', path: '/api/v1/offerings/{id}',    desc: 'Одно подношение по slug.' },
  { method: 'GET', path: '/api/v1/status-effects',    query: '?category=debuff|buff|aura|general|status', desc: 'Игровые состояния (Истощение, Кровотечение, Стойкость и т.п.).' },
  { method: 'GET', path: '/api/v1/status-effects/{id}', desc: 'Одно состояние по slug или по source_key (например, "Exhausted").', example: '/api/v1/status-effects/exhausted' },
];

export default function ApiDocsPage() {
  return (
    <div className="mx-auto max-w-[920px] px-5 sm:px-10 pt-10 sm:pt-12 pb-20">
      <div className="mb-10">
        <span className="label-mono text-[11px] text-ink-mute">Для контент-мейкеров</span>
        <h1 className="mt-2 text-[28px] font-extrabold text-dbd-bone">Публичный API</h1>
        <p className="mt-3 font-sans text-[14px] text-ink leading-[1.6] max-w-[640px]">
          Бесплатный read-only JSON-API: перки, аддоны, подношения, предметы, персонажи Dead by Daylight
          с русским переводом. Без авторизации, без ключей, CORS разрешён для любых доменов.
          Сборка билдов, оверлеи для стримов, дискорд-боты — берите и пользуйтесь.
        </p>
      </div>

      {/* Quick facts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <FactCell title="309" sub="перков" />
        <FactCell title="903" sub="аддона" />
        <FactCell title="124" sub="подношения" />
        <FactCell title="42 + 52" sub="персонажа" />
      </div>

      {/* Quick start */}
      <Section title="Быстрый старт">
        <pre className="bg-bg-2 border border-line-2 p-4 font-mono text-[12.5px] text-ink overflow-x-auto whitespace-pre">
{`curl https://your-domain.vercel.app/api/v1/perks?role=killer&tier=S
# → { "count": 18, "perks": [ … ] }`}
        </pre>
        <pre className="mt-3 bg-bg-2 border border-line-2 p-4 font-mono text-[12.5px] text-ink overflow-x-auto whitespace-pre">
{`fetch('/api/v1/killers/trapper')
  .then(r => r.json())
  .then(killer => {
    // killer.addons — все аддоны Trapper'а
    // killer.teachable_perks — его teachable-перки
  });`}
        </pre>
      </Section>

      {/* Endpoint list */}
      <Section title="Эндпоинты">
        <div className="border border-line-1 divide-y divide-line-1">
          {ENDPOINTS.map((ep) => (
            <div key={ep.path + (ep.query ?? '')} className="px-4 py-4 bg-bg-1">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="label-mono text-[10px] px-2 py-0.5 border border-line-ember text-dbd-accent">
                  {ep.method}
                </span>
                <code className="font-mono text-[13px] text-dbd-bone">
                  {ep.path}
                  {ep.query && <span className="text-ink-mute">{ep.query}</span>}
                </code>
              </div>
              <p className="mt-2 font-sans text-[13px] text-ink-mute leading-snug">{ep.desc}</p>
              {ep.example && (
                <code className="block mt-2 font-mono text-[12px] text-ink-faint">→ {ep.example}</code>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Data shape */}
      <Section title="Формат данных">
        <ul className="m-0 pl-5 font-sans text-[13.5px] text-ink leading-[1.7] space-y-1">
          <li>Локализованные поля — объекты <code className="text-dbd-accent">{`{ en: string, ru: string }`}</code>.</li>
          <li>Описания приходят с исходной разметкой DBD (теги, <code>{'{Tunable.*}'}</code>, <code>{'{Keyword.*}'}</code>) — используйте <a className="text-dbd-accent underline" href="https://github.com/catyoushy-cmd/dbd-build-randomaizer/blob/main/lib/dbd-text.ts">dbd-text.ts</a> как референс парсера.</li>
          <li>Поле <code className="text-dbd-accent">tunables</code> у перков — массивы значений для уровней 1/2/3 (последний = максимальный).</li>
          <li>Иконки лежат на нашем CDN: <code className="text-dbd-accent">https://your-domain.vercel.app{`{icon}`}</code>.</li>
          <li>Аддоны имеют <code className="text-dbd-accent">scope.type</code>: либо <code>killer</code> с <code>killerId</code>, либо <code>item</code> с <code>itemType</code>.</li>
        </ul>
      </Section>

      {/* Limits + license */}
      <Section title="Лимиты и условия">
        <ul className="m-0 pl-5 font-sans text-[13.5px] text-ink leading-[1.7] space-y-1">
          <li>Ответы кешируются 5 минут в браузере + 24 часа stale-while-revalidate. Не бойтесь спама — Vercel edge закроет дубли.</li>
          <li>Не нужен <code className="text-dbd-accent">Authorization</code> заголовок. CORS <code>*</code>.</li>
          <li>Данные — фан-контент по Dead by Daylight; авторские права на сами перки/иконки принадлежат BHVR. Этот API не аффилирован с BHVR, использовать на свой страх.</li>
          <li>Если хотите автоматизированный сток — поставьте звезду на <a className="text-dbd-accent underline" href="https://github.com/catyoushy-cmd/dbd-build-randomaizer">репозиторий</a> и пишите в issues.</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="m-0 mb-4 font-sans font-bold text-[18px] text-dbd-bone tracking-[.04em] uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function FactCell({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="border border-line-1 bg-bg-1 px-4 py-3 flex flex-col gap-1">
      <span className="font-sans text-[24px] font-extrabold text-dbd-bone leading-none">{title}</span>
      <span className="label-mono text-[10px] text-ink-mute">{sub}</span>
    </div>
  );
}
