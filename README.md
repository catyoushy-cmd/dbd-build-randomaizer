# DBD Build Randomizer

Веб-приложение для игроков **Dead by Daylight**: выбираешь роль и режим — получаешь готовую сборку (4 перка + предмет/аддоны + подношение). Ссылка на билд воспроизводит его точь-в-точь.

Демо: <https://dbd-build-randomaizer.vercel.app>

## Что умеет

- **Три режима**:
  - `random` — чистая лотерея;
  - `efficient` — синергичный билд от заранее составленного ядра (BuildCore);
  - `fun` — мем-сборка вокруг гиммика (Boil Over Sabo, Hex stack и т.п.).
- **Закрепление слотов**: понравились 2 перка из 4 — закрепи и перебрось остальное.
- **Шеринг по ссылке**: короткий код `v1.killer.trapper.efficient.12345` восстанавливает билд детерминированно из seed.
- **Сохранение в БД** (с magic-link авторизацией): `/b/<slug>` — постоянная ссылка с заметкой.
- **Локальная история** последних 20 роллов в localStorage.

## Стек

- **Next.js 14** (App Router, TS strict), деплой на Vercel.
- **PRNG** mulberry32 → детерминированный рандом по 32-битному seed.
- **Supabase** — auth (magic link через PKCE) + Postgres + RLS для `saved_builds`.
- **Tailwind 4** + **shadcn/ui** (Radix через `@base-ui/react`).
- **Vitest** — тесты алгоритма и URL-кодирования (28 кейсов).
- **Данные DBD** в `data/*.json` — обновляются скриптом `npm run sync:dbd` из dbd.tricky.lol.

## Структура

```
app/
  page.tsx              лендинг "Алтарь"
  roll/                 основной экран: форма + результат
  b/[slug]/             постоянная ссылка на сохранённый билд (Supabase)
  build/[code]/         короткая ссылка по коду v1.role.char.mode.seed
  login/, auth/callback магик-линк через Supabase
  api/saves/            POST: сохранить билд (требует auth)
components/
  ui/                   shadcn-примитивы + кастомный ShapeCard
  layout/               Header, Footer
lib/
  data/                 типы + типизированный импорт из data/*.json
  random/               algorithm.ts, prng.ts, pinning.ts + тесты
  url/encode.ts         короткий и длинный формат + декодер с версионированием
  supabase/             server.ts / client.ts
  dbd-text.ts           парсер DBD-разметки (<br>, {Tunable.X}, {Keyword.Y})
  history.ts            localStorage-история
data/                   perks/killers/survivors/items/addons/offerings/build-cores
scripts/
  sync-dbd.ts           синк из dbd.tricky.lol (сохраняет ручную курацию)
  download-icons.mjs    докачка иконок в public/icons/
supabase/migrations/    SQL: saved_builds + RLS
docs/                   спека и план MVP (superpowers)
```

## Запуск

```bash
npm install
cp .env.local.example .env.local   # подставить ключи Supabase
npm run dev                        # http://localhost:3000
```

Переменные окружения — см. `.env.local.example`. Без них работает всё, кроме сохранения в БД.

## Полезные команды

| | |
|--|--|
| `npm run dev`        | dev-сервер на :3000 |
| `npm run build`      | прод-сборка |
| `npm run typecheck`  | `tsc --noEmit` |
| `npm run lint`       | `next lint` |
| `npm run test`       | vitest (28 кейсов) |
| `npm run sync:dbd`   | обновить данные DBD из tricky.lol (сохраняет ручную курацию) |

## Алгоритм рандома

Каждый ролл получает 32-битный `seed` → `mulberry32(seed)` даёт детерминированную последовательность чисел. Тот же `(role, char, mode, seed)` всегда даёт идентичный билд — это позволяет шерить билды одной строкой.

Подробности логики — `lib/random/algorithm.ts`. Закрепление слотов — `lib/random/pinning.ts` (после переброса заменяет нужные элементы по id).

## Документация

- [CLAUDE.md](CLAUDE.md) — правила работы с этим репо для агентов и разработчиков.
- [ROADMAP.md](ROADMAP.md) — как создать такое приложение с нуля (пошагово, на русском).
- [docs/superpowers/specs/](docs/superpowers/specs/) — исходный design spec MVP.
- [docs/superpowers/plans/](docs/superpowers/plans/) — план реализации.

## Лицензия

Фан-проект, не аффилирован с Behaviour Interactive. Использует общедоступное API dbd.tricky.lol для игровых данных.
