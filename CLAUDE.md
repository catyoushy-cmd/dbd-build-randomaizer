# DBD Build Randomizer — CLAUDE.md

> Инструкции для агентов и разработчиков, работающих с этим репо. Локальный CLAUDE.md, перебивает родительский `~/projects/CLAUDE.md` (тот относится к другому проекту — AI Resume Checker; не путать).

## Что за проект

Веб-рандомайзер билдов Dead by Daylight на Next.js 14. Без AI на хот-пути, без серверных воркеров: рандом считается клиентом из 32-битного seed через `mulberry32`.

Стартовал как «рандомайзер с шерингом», вырос в гибрид:
1. **Рандомайзер** — `/roll`, `/build/[code]`, `/b/[slug]`.
2. **Энциклопедия** — `/perks`, `/killers`, `/survivors`, `/items`, `/addons`, `/offerings`, `/status-effects`, глобальный `/search`.
3. **Wiki** — `/wiki`, `/wiki/[slug]` (статьи из БД с markdown).
4. **Публичный API** — `/api/v1/*` с CORS для сторонних интеграций.
5. **Админка** — `/admin/*` (контент-overrides, статьи, build-cores, состояния).

Базовый жизненный путь рандомайзера:

```
/ (лендинг)
  → /roll  (выбор роли + персонажа + режима → "Бросить")
    клик по карточке слота закрепляет её
    переброс — пины сохраняются, остальное перекатывается
  → /build/<code>   короткая ссылка вида v1.killer.trapper.efficient.12345
  → /b/<slug>       постоянная ссылка из БД (нужен логин для создания)
```

## Стек

| Слой | Технология |
|------|-----------|
| Framework | Next.js 14.2 (App Router, TS strict) |
| UI | Tailwind 4 + shadcn/ui + Radix через `@base-ui/react` |
| Шрифты | Manrope (sans/display) + JetBrains Mono (label-mono) через next/font |
| Стилевые токены | CSS-переменные в `app/globals.css` (палитра ritual: bone/accent/bg-deep) |
| PRNG | `mulberry32` (детерминированный, 32-bit seed) |
| Auth + DB | Supabase (magic-link PKCE), RLS на всех таблицах |
| Тесты | Vitest, node-окружение |
| Контент | Postgres-таблицы (perks/killers/survivors/items/addons/offerings/status_effects), с возможностью переопределить русские названия/описания через `content_overrides` |
| Деплой | Vercel |

## Структура

```
app/
  page.tsx                лендинг "Алтарь" + последние статьи wiki
  layout.tsx              Manrope+JetBrains, TooltipProvider, Header/Footer
  globals.css             ritual-палитра, анимации (fade-up, ring-pulse), .ritual-btn, .shape-*

  roll/
    page.tsx              <Suspense> wrapper
    RollClient.tsx        форма, гидрация из URL, handleRoll, applyPins
    BuildResult.tsx       результат: перки/предмет/аддоны/моли + share/save
    PerkCard.tsx          diamond ShapeCard, tooltip с описанием
    AddonCard.tsx         rect ShapeCard с рарити-цветом
    SaveBuildButton.tsx   сохранение в Supabase (требует auth)
  build/[code]/           декод v1.role.char.mode.seed → rollBuild
  b/[slug]/               SSR: select из saved_builds → rollBuild + applyPins

  perks/PerksGrid.tsx     /perks: сурв/убийца, группировка по персонажу, ?focus=<id>
  killers/page.tsx        список убийц
  survivors/page.tsx      список выживших
  items/ItemsGrid.tsx     /items: tabs по типу, поиск, модал с совместимыми аддонами
  addons/AddonsExplorer.tsx /addons: по убийце/типу, ?killer=/?item=, группировка по рарити
  offerings/OfferingsGrid.tsx /offerings: tabs по стороне, группировка по стороне
  status-effects/StatusEffectsGrid.tsx /status-effects: tabs по категории
  search/page.tsx         глобальный поиск по всему контенту

  wiki/page.tsx           витрина статей
  wiki/[slug]/page.tsx    одиночная статья (DBD-разметка + markdown)

  admin/                  закрытая зона (см. lib/admin/auth.ts)
    layout.tsx            гард + админ-нав
    page.tsx              дашборд
    content/              overrides на названия/описания контента
    articles/             CRUD статей
    build-cores/          CRUD ядер для efficient/fun
    status-effects/       просмотр + редактирование

  login/                  magic-link форма
  auth/callback/          exchangeCodeForSession → redirect ?next=

  api/
    saves/route.ts        POST: создать saved_build (auth required)
    docs/                 страница с описанием публичного API
    v1/
      route.ts            корневой index публичного API
      perks|killers|survivors|items|addons|offerings|status-effects/
        route.ts          GET — список с фильтрами
        [id]/route.ts     GET — отдельная сущность
      all/route.ts        дамп всего контента одним JSON

components/
  ui/                     shadcn (button, card, dialog, select, sonner, tabs, tooltip, …)
  ui/shape-card.tsx       diamond/pentagon/rect clip-path слот с pinned-индикатором
  ui/icon-img.tsx         <img> с фолбэком; единая точка для иконок контента
  ui/entity-modal.tsx     общая модалка для энциклопедии
  ui/entity-tooltip.tsx   tooltip-карточка для перков/предметов
  ui/similar-grid.tsx     общий блок «похожие/совместимые» в модалках
  build/PerkDescription.tsx, DbdDescription.tsx, KeywordTooltip.tsx
  build/ResultView.tsx    общий рендер билда (на /build, /b)
  layout/Header.tsx       контекстный header
  layout/Footer.tsx       минимальная подвальная строка

lib/
  data/types.ts           все TS-типы контента
  data/index.ts           ре-экспорты типов + статические JSON (для роллера)
  data/content-db.ts      fetch* из Postgres для энциклопедии (perks, killers, …)
  data/overrides.ts       fetchOverrides + applyOverrides; admin upsertOverride
  data/build-cores-db.ts  CRUD ядер для админки
  random/algorithm.ts     rollBuild(input) — random/efficient/fun
  random/prng.ts          mulberry32 + pickOne / pickN / weightedPick
  random/pinning.ts       applyPins(build, pins, allData)
  random/__tests__/       vitest
  url/encode.ts           encodeShort / encodeLong / decode + IncompatibleVersionError
  url/__tests__/          vitest
  supabase/server.ts      createClient() / createServiceClient()
  supabase/client.ts      createClient() для 'use client'
  admin/auth.ts           requireAdmin() через ADMIN_EMAILS
  api/response.ts         publicJson / corsPreflight / publicNotFound для /api/v1
  api/entity-routes.ts    getEntityByIdWithOverrides — общий [id] хелпер для v1
  ui/labels.ts            общие лейблы/ordering: PERK_TAG_LABEL, ITEM_TYPE_*, RARITY_ORDER, rarityScore, PLAYER_ROLE_*, STATUS_CATEGORY_*
  dbd-text.ts             парсер DBD-разметки: <ul><li>, {Keyword.X}, {Tunable.S07P03.X%}
  markdown.ts             markdown → HTML для wiki/статей
  category-cover.tsx      обложки категорий статей
  use-media-query.ts      useIsMobile()
  history.ts              localStorage-история (последние 20 роллов)
  utils.ts                cn(), мелкие хелперы

data/
  perks.json, killers.json, survivors.json, items.json, addons.json,
  offerings.json, build-cores.json
  — статический исходник для роллера; «правда» для энциклопедии
    давно живёт в БД и приоритетна

scripts/
  sync-dbd.ts             идемпотентный мерж из dbd.tricky.lol — сохраняет ручную курацию
  download-icons.mjs      докачка иконок (perks: 309, addons: 903, offerings: 124, items: 45, killers/survivors)
  apply-ru-translations.mjs, fix-icons.mjs, translate-dbd.mjs  вспомогательные

supabase/migrations/001_saved_builds.sql
middleware.ts             обновление Supabase-сессии (без защиты роутов)
```

## База данных

### Контентные таблицы (живут в Supabase)

- `perks` — id, name(jsonb), role, character, character_slug, icon, description(jsonb), tunables, roles, synergy_groups, tier, deprecated
- `killers` — id, name, power, icon
- `survivors` — id, name, icon
- `items` — id, type, name, description, rarity, icon, available_by_default
- `addons` — id, name, description, scope, rarity, tags, icon, available_by_default
- `offerings` — id, name, description, role, rarity, tags, icon, available_by_default
- `status_effects` — id, source_key, name, description, category, icon

Это «правда» для энциклопедии и API. Соответствующие JSON в `/data` сохраняются для нужд роллера и быстрых fallback-ов.

### `content_overrides`

```sql
entity_type        text  -- 'perk' | 'addon' | 'item' | 'offering'
entity_id          text
name_ru            text
description_ru     text
tier               text
deprecated         boolean
available_by_default boolean
PRIMARY KEY (entity_type, entity_id)
```

Используется чтобы переопределять русские названия/описания из админки без правки JSON-источников. `applyOverrides(items, overrides)` мерджит их поверх контента в /api/v1 и в энциклопедии.

### `wiki_articles`

```sql
id           uuid PK
slug         text UNIQUE
title        text
body_md      text
category     text  -- beginner | guide | tier-list | meta | tips | lore | other
published    boolean
cover_url    text
excerpt      text
author_id    uuid FK → auth.users
created_at   timestamptz default now()
```

RLS: публичный select только для `published = true`, write — только admin.

### `build_cores`

CRUD-таблица для ядер `efficient`/`fun`. Колонки: `id, name, role, mode, description, active, preferred_item_type, required_perks, recommended_perks, forbidden_perks, preferred_addon_tags`. Используется в админке `/admin/build-cores`.

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

## Переменные окружения

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # для admin server actions и /api/saves (override RLS)
NEXT_PUBLIC_APP_URL=         # http://localhost:3000 в dev, прод-URL на Vercel
OPENROUTER_API_KEY=          # только для scripts/sync-dbd.ts (AI-курация новых сущностей)
OPENROUTER_MODEL=            # опционально (по умолчанию deepseek/deepseek-v3-0324:free)
ADMIN_EMAILS=                # CSV списка email; пусто = админка открыта (только dev)
```

## Ключевые инварианты алгоритма

1. **Детерминизм**: один и тот же `(role, char, mode, seed)` всегда даёт одинаковый билд. Тесты в `lib/random/__tests__/algorithm.test.ts` это гарантируют. Любое изменение `algorithm.ts`/`prng.ts`/`pickN` обязано сохранять детерминизм.
2. **Уникальность**: 4 перка, 2 аддона — без дубликатов. Покрыто тестами.
3. **Не показываем `deprecated: true`** в новых роллах (`perkPool` фильтрует).
4. **Fallback**: если `BuildCore.required_perks` ссылается на удалённый/опечатанный id — `rollBuild` возвращает полный рандом с `fallback: true`. UI должен показать пред-уведомление.
5. **URL-формат**: `encodeShort` версионирован префиксом `v1.` — менять формат можно только бампая версию + обработчик `IncompatibleVersionError` в `/build/[code]/page.tsx`.

## Энциклопедия и /api/v1

### Общие паттерны страниц

Пять explorer'ов (`PerksGrid`, `ItemsGrid`, `AddonsExplorer`, `OfferingsGrid`, `StatusEffectsGrid`) делят:
- Лейблы и ordering — `lib/ui/labels.ts` (PERK_TAG_LABEL, ITEM_TYPE_*, RARITY_ORDER, rarityScore, PLAYER_ROLE_*, STATUS_CATEGORY_*). При добавлении новой категории — править здесь, не в страницах.
- Общую модалку — `components/ui/entity-modal.tsx`.
- Общий компонент «похожие сущности» внизу модалки — `components/ui/similar-grid.tsx` (items/addons/offerings).
- Tooltip-карточки — `components/ui/entity-tooltip.tsx`.

Если повторяешь паттерн третий раз — выноси в `components/ui/*`. Если первый-второй — оставляй inline, разница важнее общности.

### /api/v1

Публичный read-only API с permissive CORS. См. `lib/api/response.ts`:
- `publicJson(data)` — JSON с CORS + `Cache-Control: max-age=300, s-maxage=300, stale-while-revalidate=86400`.
- `corsPreflight` — экспортируется как `OPTIONS` в каждом роуте.
- `publicNotFound(msg)` — 404 с CORS.

Для `[id]` роутов с `applyOverrides` есть общий хелпер `lib/api/entity-routes.ts::getEntityByIdWithOverrides(id, opts)`. Использует `perks/[id]`, `addons/[id]`, `items/[id]` (с `expand` для compatible_addons), `offerings/[id]`. Killers/survivors/status-effects не используют overrides и инлайнят логику сами.

Список-роуты не делят helper — слишком разные параметры (perks: role/tier/deprecated, addons: killer/item/rarity, items: type, и т. д.).

## Админка

Гард — `lib/admin/auth.ts::requireAdmin()`. Срабатывает по `ADMIN_EMAILS`:
- пусто → гард выключен (для локалки и тестов);
- CSV email'ов → только эти юзеры пускаются.

Вызывается:
- В `app/admin/layout.tsx` — защита всех страниц одним вызовом.
- В каждом server action (`*/actions.ts`) — отдельно, потому что server actions можно дёрнуть мимо страницы.

**Не переноси требование в middleware** — middleware не покрывает server actions, а layout уже покрывает страницы. Двойная защита здесь правильная.

## Парсер описаний (`lib/dbd-text.ts`)

Сырые описания DBD приходят с HTML и template-переменными:
- `<ul><li>...</li></ul>` → `• ...`
- `{Keyword.Exhausted}` → `Истощение` (словарь в файле)
- `{Tunable.S07P03.HasteDuration%}` → `?%` или максимальный tier из `perk.tunables.hasteduration%`
- `{Input.*}` → `кнопку активной способности`

При добавлении ключевого слова — править словарь `KEYWORDS` в `lib/dbd-text.ts`.

## Стилистика UI

Две эстетики — известный технический долг:
- **`/` и `/roll`** — кастомная "ritual" эстетика на inline-стилях с CSS-переменными (`var(--dbd-accent)`, `.ritual-btn`, `.shape-diamond`). Не Tailwind.
- **Энциклопедия, `/build/[code]`, `/b/[slug]`, `/login`, `/admin`** — Tailwind + shadcn, но всё ещё с ritual-токенами через CSS-переменные (`text-dbd-bone`, `bg-bg-1`, `border-line-ember`).

## Что нельзя ломать

- `lib/random/algorithm.ts` / `prng.ts` — детерминизм. Если меняешь, добавь свежие тесты на тот же seed.
- `lib/url/encode.ts` — формат `v1.*`. Изменения только через bump версии.
- `supabase/migrations/001_saved_builds.sql` — RLS-политики. Снимать публичный select имеет смысл, только если переехать на `/api/builds/[slug]` с серверной проверкой.
- `middleware.ts` matcher — исключает статику; не трогать без причины.
- `/api/v1/*` — публичный API. Меняя формат ответа или фильтры, заводи `v2` рядом, а не ломай `v1`.

## Известные тех-долги

1. **Двойная стилистика** (inline ritual vs Tailwind) — единый UI-язык.
2. **`SaveBuildButton` не пробрасывает `pins`** — закреплённое состояние не сохраняется (всегда `null`). Чтобы починить, нужно поднять `pins` в `RollClient` и передать через prop в `BuildResult` → `SaveBuildButton`.
3. **`<img onError>` скрывает битые иконки тихо** — нет фолбэка-плейсхолдера. См. `components/ui/icon-img.tsx`.
4. **`/api/v1/[entity]/[id]`** делают `.find()` по всему массиву (fetch + filter). На текущих ~300 перков ок, на масштабе — индекс или прямой `select … where id = ?`.

## Воркфлоу для агента

1. **Перед изменениями БД** — `mcp__supabase__list_tables` / `apply_migration`.
2. **Перед коммитом**: `npm run typecheck && npm run lint && npm run test`.
3. **`/roll` рендерит `RollClient` под Suspense** — не убирать обёртку, иначе `useSearchParams()` сломает прод-сборку.
4. **Любые правки `algorithm.ts`/`prng.ts`** → прогнать тесты и руками проверить, что `seed=42` даёт ровно тот же билд (snapshot можно добавить).
5. **dev-сервер на 3000** — Supabase redirect и OAuth завязаны на этот порт.
6. **Лейблы для энциклопедии** → `lib/ui/labels.ts`, не inline в страницах.
7. **`/api/v1` ответы** — через `publicJson()`, никогда `NextResponse.json` напрямую (иначе нет CORS/cache).
