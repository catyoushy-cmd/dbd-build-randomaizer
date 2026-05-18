# DBD Build Randomizer — CLAUDE.md

> Инструкции для агентов и разработчиков, работающих с этим репо. Локальный CLAUDE.md, перебивает родительский `~/projects/CLAUDE.md` (тот относится к другому проекту — AI Resume Checker; не путать).

## Что за проект

Веб-рандомайзер билдов Dead by Daylight на Next.js 14. Без AI на хот-пути, без серверных воркеров: рандом считается клиентом из 32-битного seed через `mulberry32`. Серверная часть — только Supabase (auth + сохранение именованных билдов) и API-роут `/api/saves`.

Жизненный путь пользователя:

```
/ (лендинг)
  → /roll  (выбор роли + персонажа + режима → "Бросить")
    клик по карточке слота закрепляет её
    переброс — пины сохраняются, остальное перекатывается
  → /build/<code>           короткая ссылка вида v1.killer.trapper.efficient.12345
  → /b/<slug>               постоянная ссылка из БД (нужен логин для создания)
```

## Стек

| Слой | Технология |
|------|-----------|
| Framework | Next.js 14.2 (App Router, TS strict) |
| UI | Tailwind 4 + shadcn/ui + Radix через `@base-ui/react` |
| Шрифты | Manrope (sans/display) + JetBrains Mono (label-mono) через next/font |
| Стилевой токены | CSS-переменные в `app/globals.css` (палитра ritual: bone/accent/bg-deep) |
| PRNG | `mulberry32` (детерминированный, 32-bit seed) |
| Auth + DB | Supabase (magic-link PKCE), RLS на `saved_builds` |
| Тесты | Vitest, node-окружение |
| Данные | `data/*.json` (perks/killers/items/addons/offerings/build-cores) |
| Деплой | Vercel |

## Структура

```
app/
  page.tsx              лендинг "Алтарь"
  layout.tsx            Manrope+JetBrains, TooltipProvider, Header/Footer
  globals.css           ritual-палитра, анимации (fade-up, ring-pulse), .ritual-btn, .shape-*
  roll/
    page.tsx            <Suspense> wrapper
    RollClient.tsx      форма, гидрация из URL, handleRoll, applyPins
    BuildResult.tsx     результат: перки/предмет/аддоны/моли + share/save
    PerkCard.tsx        diamond ShapeCard, tooltip с описанием
    AddonCard.tsx       rect ShapeCard с рарити-цветом
    SaveBuildButton.tsx сохранение в Supabase (требует auth)
  build/[code]/         декод v1.role.char.mode.seed → rollBuild
  b/[slug]/             SSR: select из saved_builds → rollBuild + applyPins
  login/                magic-link форма
  auth/callback/        exchangeCodeForSession → redirect ?next=
  api/saves/route.ts    POST: создать saved_build (auth required)
components/
  ui/                   shadcn (button, card, dialog, select, sonner, tabs, tooltip, …)
  ui/shape-card.tsx     diamond/pentagon/rect clip-path слот с pinned-индикатором
  layout/Header.tsx     контекстный header: на / — "Бросить", иначе "← Алтарь"
  layout/Footer.tsx     минимальная подвальная строка
lib/
  data/types.ts         все TS-типы для JSON-данных
  data/index.ts         типизированные ре-экспорты JSON
  random/algorithm.ts   rollBuild(input) — random/efficient/fun
  random/prng.ts        mulberry32 + pickOne / pickN / weightedPick
  random/pinning.ts     applyPins(build, pins, allData)
  random/__tests__/     vitest
  url/encode.ts         encodeShort / encodeLong / decode + IncompatibleVersionError
  url/__tests__/        vitest
  supabase/server.ts    createClient() / createServiceClient()
  supabase/client.ts    createClient() для 'use client'
  dbd-text.ts           парсер DBD-разметки: <ul><li>, {Keyword.X}, {Tunable.S07P03.X%}
  history.ts            localStorage-история (последние 20 роллов)
data/
  perks.json            ~300 перков с tier/roles/synergy_groups
  build-cores.json      ~8 ядер для efficient/fun (расширяется)
  killers.json, survivors.json, items.json, addons.json, offerings.json
scripts/
  sync-dbd.ts           идемпотентный мерж из dbd.tricky.lol — сохраняет ручную курацию
  download-icons.mjs    докачка иконок (perks: 309, addons: 903, offerings: 124, items: 45)
  apply-ru-translations.mjs, fix-icons.mjs, translate-dbd.mjs  вспомогательные
supabase/migrations/001_saved_builds.sql
middleware.ts           обновление Supabase-сессии (без защиты роутов)
```

## База данных

### `saved_builds`

```sql
id           uuid PK default gen_random_uuid()
user_id      uuid FK → auth.users  NOT NULL
slug         text UNIQUE NOT NULL  (nanoid(6) с retry на коллизию)
role         text NOT NULL  ('survivor' | 'killer')
killer_id    text                  (null для survivor)
mode         text NOT NULL  ('random' | 'efficient' | 'fun')
seed         bigint NOT NULL
pinned_state jsonb                 (формат Pins из lib/random/pinning.ts)
note         text                  (≤ 200 симв., тримится в /api/saves)
created_at   timestamptz default now()
```

RLS:
- `saved_builds_select_public` — `using (true)`: share-ссылки публичные.
- `saved_builds_insert_owner` — `auth.uid() = user_id`.
- `saved_builds_delete_owner` — `auth.uid() = user_id`.

Из-за публичного select на `/b/[slug]` достаточно anon-клиента, **не нужен service role**.

## Переменные окружения

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # только если будут серверные операции в обход RLS
NEXT_PUBLIC_APP_URL=         # http://localhost:3000 в dev, прод-URL на Vercel
OPENROUTER_API_KEY=          # только для scripts/sync-dbd.ts (AI-курация новых сущностей)
OPENROUTER_MODEL=            # опционально (по умолчанию deepseek/deepseek-v3-0324:free)
```

## Ключевые инварианты алгоритма

1. **Детерминизм**: один и тот же `(role, char, mode, seed)` всегда даёт одинаковый билд. Тесты в `lib/random/__tests__/algorithm.test.ts` это гарантируют. Любое изменение `algorithm.ts`/`prng.ts`/`pickN` обязано сохранять детерминизм.
2. **Уникальность**: 4 перка, 2 аддона — без дубликатов. Покрыто тестами.
3. **Не показываем `deprecated: true`** в новых роллах (`perkPool` фильтрует).
4. **Fallback**: если `BuildCore.required_perks` ссылается на удалённый/опечатанный id — `rollBuild` возвращает полный рандом с `fallback: true`. UI должен показать пред-уведомление.
5. **URL-формат**: `encodeShort` версионирован префиксом `v1.` — менять формат можно только бампая версию + обработчик `IncompatibleVersionError` в `/build/[code]/page.tsx`.

## Парсер описаний (`lib/dbd-text.ts`)

Сырые описания DBD приходят с HTML и template-переменными:
- `<ul><li>...</li></ul>` → `• ...`
- `{Keyword.Exhausted}` → `Истощение` (словарь в файле)
- `{Tunable.S07P03.HasteDuration%}` → `?%` или максимальный tier из `perk.tunables.hasteduration%`
- `{Input.*}` → `кнопку активной способности`

При добавлении ключевого слова — править словарь `KEYWORDS` в `lib/dbd-text.ts`.

## Стилистика UI

Две эстетики, и это знание полезное:
- **`/` и `/roll`** — кастомная "ritual" эстетика на inline-стилях с CSS-переменными (`var(--dbd-accent)`, `.ritual-btn`, `.shape-diamond`). Не Tailwind.
- **`/build/[code]`, `/b/[slug]`, `/login`** — Tailwind + shadcn по-обычному.

Это несоответствие — известный технический долг. См. ROADMAP.md.

## Что нельзя ломать

- `lib/random/algorithm.ts` / `prng.ts` — детерминизм. Если меняешь, добавь свежие тесты на тот же seed.
- `lib/url/encode.ts` — формат `v1.*`. Изменения только через bump версии.
- `supabase/migrations/001_saved_builds.sql` — RLS-политики. Снимать публичный select имеет смысл, только если переехать на `/api/builds/[slug]` с серверной проверкой.
- `middleware.ts` matcher — исключает статику; не трогать без причины.

## Известные тех-долги (см. ROADMAP)

1. Двойная стилистика (inline ritual vs Tailwind) — единый UI-язык.
2. Иконок персонажей нет в `public/icons/{killers,survivors}` (0 файлов), хотя `data/` ссылается на пути. UI пока их не использует.
3. `SaveBuildButton` не пробрасывает `pins` — закреплённое состояние не сохраняется (всегда `null`). Чтобы починить, нужно поднять `pins` в `RollClient` и передать через prop в `BuildResult` → `SaveBuildButton`.
4. ESLint warning'и на `<img>` — мигрировать на `next/image` (когда понятно, что иконки реально нужны и они стабильно резолвятся).
5. `<img onError>` скрывает битые иконки тихо — нет фолбэка-плейсхолдера.

## Воркфлоу для агента

1. **Перед изменениями БД** — `mcp__supabase__list_tables` / `apply_migration`.
2. **Перед коммитом**: `npm run typecheck && npm run lint && npm run test`.
3. **`/roll` рендерит `RollClient` под Suspense** — не убирать обёртку, иначе `useSearchParams()` сломает прод-сборку.
4. **Любые правки `algorithm.ts`/`prng.ts`** → прогнать тесты и руками проверить, что `seed=42` даёт ровно тот же билд (snapshot можно добавить).
5. **dev-сервер на 3000** — Supabase redirect и OAuth завязаны на этот порт.
