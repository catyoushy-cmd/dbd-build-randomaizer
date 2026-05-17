# DBD Build Randomizer — Implementation Plan (MVP, Phase 1)

**Дата:** 2026-05-17
**Спека:** [2026-05-17-dbd-build-randomizer-design.md](../specs/2026-05-17-dbd-build-randomizer-design.md)
**Статус:** готов к исполнению

План разбит на 8 этапов. После каждого этапа есть явная проверка («Done when»). Этапы 1–6 покрывают функциональный MVP без Supabase; 7 добавляет сохранение в облако; 8 — деплой.

---

## Этап 0. Bootstrap проекта

**Цель:** пустой Next.js 14 + TS strict + Tailwind + shadcn запускается на `localhost:3000`.

1. `git init` в корне `dbd-build-randomaizer/`, добавить `.gitignore` (Next.js + `.env.local`)
2. `npx create-next-app@14 .` — App Router, TypeScript, Tailwind, без `src/`, без ESLint-fancy
3. Установить shadcn CLI: `npx shadcn@latest init` — base color stone, CSS variables on
4. Добавить базовые компоненты: `button`, `card`, `select`, `dropdown-menu`, `tooltip`, `toast`, `dialog`, `skeleton`
5. Создать `app/globals.css` дизайн-токены (по образцу AI-Resume проекта: `--surface`, `--accent-raw`, `--ok`, `--warn`, `--bad`)
6. Подключить шрифты в `app/layout.tsx` через `next/font/google` (Inter + Onest)
7. Создать пустой `app/page.tsx` (лендинг-плейсхолдер) и `app/roll/page.tsx` со словом «Roll»
8. `package.json` скрипты: `dev`, `build`, `lint`, `typecheck` (`tsc --noEmit`), `sync:dbd` (заглушка)

**Done when:** `npm run dev` → `/` и `/roll` открываются, `npx tsc --noEmit` зелёный, shadcn-кнопка рендерится со стилями.

---

## Этап 1. Модель данных и сиды

**Цель:** типы определены, в `data/*.json` лежат рабочие сиды (не полный объём, но достаточно для всех веток алгоритма).

1. `lib/data/types.ts` — все типы из спеки (Perk, Killer, Item, Addon, Offering, BuildCore, PerkRole)
2. `lib/data/index.ts` — типизированные импорты JSON-файлов; экспортирует `PERKS`, `KILLERS`, `ITEMS`, `ADDONS`, `OFFERINGS`, `BUILD_CORES`
3. Сиды (минимальный достаточный набор для тестов алгоритма):
   - `data/perks.json` — ~30 сурв + ~30 киллер перков (популярные: Dead Hard, Decisive, Adrenaline, Iron Will, Sprint Burst, Boil Over, Saboteur, Resilience, Prove Thyself, Hyperfocus, Stake Out, Windows; Hex: Ruin, Pop, Pain Resonance, Save the Best for Last, Bamboozle, Discordance, Lethal Pursuer, Nowhere to Hide, Sloppy Butcher, NOED, Devour Hope) — с заполненными `roles`, `synergy_groups`, `tier`
   - `data/killers.json` — 10 киллеров (Trapper, Wraith, Hillbilly, Nurse, Huntress, Spirit, Blight, Nemesis, Pinhead, Pig)
   - `data/items.json` — по 1–2 предмета каждого типа
   - `data/addons.json` — ~5 аддонов на каждого из 10 киллеров + по 3–4 аддона на каждый тип предмета; с `tags`
   - `data/offerings.json` — ~15 моли (Mori-варианты для киллера, BPS/карты для сурва), с `tags`
   - `data/build-cores.json` — 8 ядер: 2× surv-efficient (Genrush, Stealth-Info), 2× surv-fun (Boil Over Sabo, Exhaustion-stack), 2× killer-efficient (Slowdown-stack, Aura-pressure), 2× killer-fun (Hex-stack, Endgame NOED-build)
4. Валидация формата JSON через лёгкую `zod`-схему в `lib/data/validate.ts` (опционально, но удобно для отладки сидов); вызвать в dev из `lib/data/index.ts`

**Done when:** `npx tsc --noEmit` зелёный, JSON парсятся, `zod`-валидация не ругается, можно сделать `import { PERKS } from '@/lib/data'` и получить типизированный массив.

---

## Этап 2. PRNG и алгоритм рандомизации (ядро)

**Цель:** чистая библиотека без UI — на вход `{ role, killerId?, mode, seed, pins? }`, на выход `Build`.

1. `lib/random/prng.ts` — `mulberry32(seed: number): () => number`, плюс хелперы `pickOne(arr, rng)`, `pickN(arr, n, rng)` без дубликатов, `weightedPick(arr, weightFn, rng)`
2. `lib/random/algorithm.ts` — типы `BuildInput`, `Build`:
   ```ts
   type Build = {
     seed: number;
     role: 'survivor' | 'killer';
     killerId: string | null;        // null для сурва
     mode: 'random' | 'efficient' | 'fun';
     perks: Perk[];                  // length === 4
     item: Item | null;              // только сурв
     addons: Addon[];                // length === 2
     offering: Offering;
     buildCore?: BuildCore;          // только efficient/fun
   };
   ```
3. Функция `rollBuild(input: BuildInput): Build` с тремя ветками. Внутри:
   - `rollRandom(rng, ...)` — спека §«Полный рандом»
   - `rollEfficient(rng, ...)` — выбор ядра + role-coverage добивание
   - `rollFun(rng, ...)` — выбор ядра + meme-fill
4. Хелпер `fillByRoleCoverage(required, pool, requiredRoles, rng)` — общий для efficient/fun
5. **Fallback при битом ядре**: try/catch вокруг ветки → если упало или ядро ссылается на отсутствующий перк → `rollRandom` + флаг `Build.fallback = true` (для UI-тоста)
6. `lib/random/pinning.ts` — `applyPins(build: Build, pins: Pins): Build`: подменяет финальные слоты значениями из пинов
7. **Юнит-тесты** (`vitest`):
   - `prng.test.ts` — один seed → одна последовательность
   - `algorithm.test.ts`:
     - 1000 роллов «полный рандом» → нет дубликатов перков ни в одном; нет дубликатов аддонов
     - 100 efficient роллов для сурва → все required-перки ядра присутствуют; всего 4 уникальных перка
     - 100 fun роллов → аналогично
     - битое ядро (моки) → fallback срабатывает, ролл не падает
   - `pinning.test.ts` — пин-нутый перк не меняется при повторном ролле с тем же seed

**Done when:** все тесты зелёные, `npm run typecheck` зелёный, можно вызвать `rollBuild({role:'killer', killerId:'trapper', mode:'efficient', seed:12345})` из консоли и получить осмысленный билд.

---

## Этап 3. URL-схема (encode / decode)

**Цель:** билд → URL → билд, round-trip без потерь.

1. `lib/url/encode.ts`:
   - `encodeShort(build): string` → `v1.killer.trapper.efficient.12345`
   - `encodeLong(build, pins): string` → query-string `v1?p=...&i=...&a=...&o=...&pinned=...`
   - `decode(code: string): BuildInput` — определяет формат по точке/`?`, парсит, валидирует версию (`v1`)
2. Версионирование: если `v` ≠ `v1` → бросает `IncompatibleVersionError`; UI ловит и показывает баннер «билд старой версии»
3. **Юнит-тесты** (`encode.test.ts`):
   - Round-trip короткого: `decode(encodeShort(b))` === `b.input`
   - Round-trip длинного с пинами
   - Невалидная версия → ошибка
   - Битый код → ошибка с понятным сообщением

**Done when:** тесты зелёные, ручной прогон через консоль работает.

---

## Этап 4. UI `/roll` — главный экран

**Цель:** один экран, форма + результат, без перезагрузок, state в URL через `useSearchParams` / `router.replace`.

1. `app/roll/page.tsx` — client component (или server + клиентский inner)
2. `app/roll/RollForm.tsx`:
   - Toggle `Survivor | Killer` (shadcn Tabs или ToggleGroup)
   - Select персонажа (для сурва — «Любой выживший» + список; для киллера — обязателен)
   - Three-way toggle режима с иконками `🎲 / ⚡ / 🎉`
   - Кнопка `ROLL!` — генерит новый seed (`crypto.getRandomValues`), вызывает `rollBuild`, обновляет URL `?role=...&killer=...&mode=...&seed=...`
3. `app/roll/BuildResult.tsx` — принимает `Build`, рендерит:
   - 4× `PerkCard` (grid 2×2 на десктопе, 1 колонка на мобиле)
   - Для сурва: `ItemCard` + 2× `AddonCard`; для киллера: 2× `AddonCard`
   - `OfferingCard`
   - Если `buildCore` есть → жёлтая полоска с `core.name` + `core.description`
   - Если `fallback === true` → toast «ядро X недоступно, выдан полный рандом»
4. `PerkCard.tsx` — иконка + название, hover-тултип с описанием (shadcn Tooltip)
5. Кнопки внизу: `🔄 Перебросить всё`, `🔒 Закрепить` (state в Zustand-mini-store или просто `useState` на родителе), `🔄 Перебросить аддоны`, `🔄 Перебросить моли`, `📋 Скопировать ссылку`
6. **Закрепление**: клик по карточке → toggle `pinned` для этого слота. Визуально — рамка emerald. Следующий ролл вызывает `applyPins`. При наличии пинов URL переключается на длинный формат.
7. Hydrate из URL при mount: если в URL есть `seed` — сразу рендерим результат
8. История localStorage: `lib/history.ts` — `pushBuild`, `getHistory()` (последние 20); компонент `<RecentRolls>` под формой — chip-список последних роллов с кликом «открыть»

**Done when:**
- Все 3 режима роллятся для сурва (с/без выбора персонажа) и для киллера
- URL обновляется при каждом ролле
- Перезагрузка страницы по тому же URL = тот же билд
- Пин-нутый слот не меняется при rerolll
- История работает (последние 20 в localStorage)

---

## Этап 5. Read-only страница билда `/build/[code]`

**Цель:** делиться ссылкой; чужой человек видит ту же сборку.

1. `app/build/[code]/page.tsx` — Server Component
2. На сервере: `decode(params.code)` → `rollBuild(input)` (с восстановлением пинов через `applyPins`) → рендерим тот же `BuildResult`
3. Кнопка «Скопировать себе» → `router.push('/roll?role=...&killer=...&mode=...&seed=...')`
4. Catch `IncompatibleVersionError` → fallback-UI «билд сгенерирован старой версией данных, перерендерь на /roll»

**Done when:** открытие `/build/v1.killer.trapper.efficient.12345` в инкогнито показывает идентичный билд.

---

## Этап 6. Лендинг и общая навигация

1. `app/page.tsx` — лендинг: H1 «Рандомайзер билдов для DBD», подзаголовок, три CTA-карточки режимов → `/roll?mode=...`, краткое «как работает»
2. `components/layout/Header.tsx` — контекстный (на `/` кнопка «К рандомайзеру», на `/roll` — «На главную»)
3. `components/layout/Footer.tsx` — однострочный
4. `app/history/page.tsx` — отдельная страница со всей localStorage-историей (если решим вынести из `/roll`)

**Done when:** навигация работает, лендинг открывается на mobile/desktop без горизонтального скролла.

---

## Этап 7. Supabase — опциональное сохранение билдов

**Цель:** залогиненный юзер может сохранить именованный билд → `/b/{slug}`.

1. Supabase проект — создать вручную, ENV в `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
2. `supabase/migrations/001_init.sql` — таблица `saved_builds` + RLS из спеки
3. `lib/supabase/{client,server}.ts` — копия паттерна из AI-Resume Checker
4. `middleware.ts` — обновление сессии Supabase (без защиты роутов)
5. `app/login/page.tsx` — magic link форма (PKCE)
6. `app/auth/callback/route.ts` — `exchangeCodeForSession` + redirect на `?next=`
7. На `/roll` и `/build/[code]` — кнопка `💾 Сохранить`. Без сессии → инлайн email-форма (как в AI-Resume). С сессией → диалог: `note?`, кнопка «Сохранить». Сервер генерит `slug` (6 симв. nanoid), пишет в `saved_builds`, возвращает URL `/b/{slug}`
8. `app/b/[slug]/page.tsx` — Server Component, по `slug` достаёт строку, восстанавливает билд (`rollBuild` + `applyPins(pinned_state)`), рендерит read-only вид. Публично доступен (RLS `select using (true)`).

**Done when:**
- Magic link приходит на email, callback логинит
- Сохранение билда работает, slug-страница открывается публично
- Несохранённый билд для анонима продолжает работать через URL-кодирование (БД не обязательна)

---

## Этап 8. Деплой и sync-скрипт

1. `scripts/sync-dbd.ts` — скрипт по спеке §«Sync-скрипт»:
   - Источник: при имплементации выбираем `dbd-info.com` или `dbd.tricky.lol` (тот, у которого стабильнее структура)
   - Merge-логика сохраняет ручные поля (`roles`, `synergy_groups`, `tier`, `tags`)
   - Новые сущности добавляются с пустыми ручными полями
   - Удалённые помечаются `deprecated: true`, не удаляются физически
   - Иконки скачиваются в `public/icons/{perks,killers,items,offerings}/`
   - `package.json`: `"sync:dbd": "tsx scripts/sync-dbd.ts"`
2. **Vercel**: подключить репо, прописать ENV (Supabase + `NEXT_PUBLIC_APP_URL`), задеплоить
3. Supabase URL Configuration → добавить production-URL и `localhost:3000/auth/callback`
4. Запустить полный smoke-test по чеклисту верификации из спеки

**Done when:** прод-URL открывается, все верификационные пункты из спеки проходят.

---

## Не делаем в этом плане

Точно по спеке §«Out of scope»: Twitch, кастомные пулы, тир-листы аддонов, PWA, OG-картинки, языки кроме en/ru.

## Ключевые риски

- **Объём ручной курации** (~250 перков × `roles` + `synergy_groups` + `tier`). На Этапе 1 сидим только ~60 перков для прогона алгоритма. Полный набор — отдельный data-pass после Этапа 5.
- **Источник для sync-скрипта**: если у `dbd-info.com` нет публичного JSON-API, придётся скрейпить HTML. Это решение откладываем до Этапа 8 — не блокирует MVP.
- **Иконки**: лицензия на спрайты BHVR — серая зона. Для MVP используем оригинальные иконки игры, ссылаемся как fan-project. Если возникнут претензии — заменяем на собственные SVG.
