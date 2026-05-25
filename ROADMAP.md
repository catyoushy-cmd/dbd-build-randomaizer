# ROADMAP — как сделать DBD Build Randomizer своими руками

Пошаговый план: от пустой папки до задеплоенного приложения. Без воды, по шагам. После каждого этапа есть критерий «готово».

---

## Этап 0. Что мы вообще строим (полезно сначала)

Веб-приложение: пользователь нажимает кнопку → получает рандомный билд из 4 перков + предмет/аддоны + подношение. Та же кнопка с тем же seed всегда даёт тот же билд → можно шерить ссылкой.

Три режима:
- **Random** — лотерея.
- **Efficient** — «синергичный» билд от заранее составленного ядра (BuildCore).
- **Fun** — мем-билды вокруг гиммика.

Архитектурное ядро:
1. Данные о перках/аддонах/подношениях — статические JSON-файлы.
2. Рандом — детерминированный PRNG (`mulberry32`) на клиенте, без сервера.
3. Сервер нужен только под опциональное сохранение билдов и логин — Supabase.
4. Шеринг — через URL: либо короткий код `v1.role.char.mode.seed`, либо «постоянный» slug из БД.

**Зачем детерминированный рандом?** Чтобы ссылка восстанавливала тот же билд через год, даже если базу перков расширили — пока сам seed и формат не поменялись.

---

## Этап 1. Каркас Next.js (1-2 часа)

### 1.1 Создать проект

```bash
npx create-next-app@latest dbd-randomizer
# → TypeScript: да
# → ESLint: да
# → Tailwind: да
# → src/: нет
# → App Router: да
# → Turbopack: на вкус
# → import alias @/*: да
cd dbd-randomizer
```

### 1.2 Базовая структура

```
app/
  layout.tsx     корневой layout
  page.tsx       лендинг
  roll/page.tsx  основной экран
lib/
  utils.ts       (опц.) хелперы
data/            пустая папка под JSON
public/icons/    пустая папка под иконки
```

### 1.3 Установить shadcn (опционально)

```bash
npx shadcn@latest init
npx shadcn@latest add button card select tooltip sonner
```

**Готово, когда:** `npm run dev` поднимает пустой Next.js на `:3000`, и при заходе на `/roll` рендерится «hello».

---

## Этап 2. Модель данных (3-4 часа)

Здесь самая занудная, но фундаментальная часть. Без правильных типов всё дальнейшее будет переписываться.

### 2.1 TypeScript-типы

`lib/data/types.ts`:

```ts
export type PerkRole =
  | 'gen' | 'chase-escape' | 'info' | 'altruism' | 'exhaustion' | 'boon' | 'meme'
  | 'slowdown' | 'chase-power' | 'aura' | 'hex' | 'endgame' | 'stealth';

export type Tier = 'S' | 'A' | 'B' | 'C';

export type Perk = {
  id: string;                            // 'iron-will'
  name: { en: string; ru: string };
  role: 'survivor' | 'killer';
  character: string | null;              // null = teachable
  icon: string;                          // путь к спрайту
  description: { en: string; ru: string };
  tunables?: Record<string, number[]>;   // динамические значения по тиру
  roles: PerkRole[];                     // ручная курация ролей перка
  synergy_groups: string[];              // 'gen-rush', 'boil-over-combo'
  tier: Tier;
  deprecated?: boolean;
};

export type ItemType = 'flashlight' | 'medkit' | 'toolbox' | 'map' | 'key';
export type Item    = { id; type: ItemType; name; description?; rarity; icon };
export type Addon   = { id; name; description?; scope: { type:'killer'; killerId } | { type:'item'; itemType: ItemType }; rarity; tags: ('efficient'|'meme'|'troll')[]; icon };
export type Offering= { id; name; description?; role:'survivor'|'killer'|'both'; rarity; tags; icon };

export type BuildMode = 'random' | 'efficient' | 'fun';

export type BuildCore = {
  id: string;
  name: string;
  role: 'survivor' | 'killer';
  mode: 'fun' | 'efficient';
  required_perks: string[];              // 2-3 id — каркас
  recommended_perks: string[];           // приоритет при добивании 4-го слота
  preferred_item_type?: ItemType;
  description: string;
};

export type Build = {
  seed: number;
  role: 'survivor' | 'killer';
  killerId: string | null;
  survivorId: string | null;
  mode: BuildMode;
  perks: Perk[];
  item: Item | null;
  addons: Addon[];
  offering: Offering;
  buildCore?: BuildCore;
  fallback?: boolean;
};
```

### 2.2 JSON-файлы с типизированным импортом

`data/perks.json`, `data/killers.json`, `data/items.json`, `data/addons.json`, `data/offerings.json`, `data/build-cores.json`.

`lib/data/index.ts`:

```ts
import type { Perk, Killer, Item, Addon, Offering, BuildCore } from './types';
import perksRaw    from '@/data/perks.json';
import killersRaw  from '@/data/killers.json';
// ...
export const PERKS    = perksRaw    as Perk[];
export const KILLERS  = killersRaw  as Killer[];
// ...
export type { Perk, Killer, Item, Addon, Offering, BuildCore };
export * from './types';
```

### 2.3 Откуда взять начальные данные

Два пути:
1. **Руками** — для MVP хватит 30-40 перков на роль. Долго, но контроль полный.
2. **Скриптом из API** — есть открытый <https://dbd.tricky.lol/api>. Качаешь, мапишь в свой формат, доливаешь поля курации (`tier`, `roles`, `synergy_groups`) вручную или через LLM.

В этом проекте — комбо: `scripts/sync-dbd.ts` тянет из tricky.lol, сохраняя ручную курацию (мерж по id, новые поля курации не трогаются).

**Готово, когда:** `import { PERKS } from '@/lib/data'` в любом файле даёт типизированный массив перков, и на `/roll/page.tsx` можно вывести их количество.

---

## Этап 3. Алгоритм рандома (3-5 часов)

### 3.1 PRNG

`lib/random/prng.ts`:

```ts
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickOne<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  // partial Fisher-Yates через копию массива
  const pool = [...arr];
  const out: T[] = [];
  const count = Math.min(n, pool.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * (pool.length - i));
    out.push(pool[idx]);
    pool[idx] = pool[pool.length - 1 - i];
  }
  return out;
}

export function weightedPick<T>(arr: T[], score: (x: T) => number, rng: () => number): T | undefined {
  if (!arr.length) return;
  const total = arr.reduce((a, x) => a + score(x), 0);
  if (total === 0) return pickOne(arr, rng);
  let t = rng() * total;
  for (const x of arr) {
    t -= score(x);
    if (t <= 0) return x;
  }
  return arr[arr.length - 1];
}
```

**Почему mulberry32:** просто, быстро, детерминированный, влезает в 10 строк, для геймплейного рандома хватает с запасом. Не криптостойкий — нам и не надо.

### 3.2 Сам ролл

`lib/random/algorithm.ts` (упрощённо):

```ts
export function rollBuild(input: BuildInput): Build {
  const rng = mulberry32(input.seed);

  if (input.mode === 'random')    return rollRandom(rng, input);
  if (input.mode === 'efficient') return rollEfficient(rng, input);
  return rollFun(rng, input);
}
```

Каждая ветка:
1. **random** — `pickN(perks, 4, rng)`, случайный предмет + 2 аддона (для сурва), случайный аддон-пар для киллера, случайное подношение.
2. **efficient** — выбираем `BuildCore` режима `efficient` по роли, кладём `required_perks`, добиваем нужные «слоты ролей» (`SURVIVOR_REQUIRED_ROLES`) через `weightedPick` с предпочтением высокого `tier`.
3. **fun** — то же, но с предпочтением перков с ролью `meme` и аддонов с `tag: meme|troll`.

Тонкий момент: если ядро ссылается на удалённый id перка — не падаем, возвращаем `rollRandom(...)` с `fallback: true`. UI покажет «Ядро недоступно, выдан полный рандом».

### 3.3 Пины

`lib/random/pinning.ts`:

```ts
export function applyPins(build: Build, pins: Pins, all: Pools): Build {
  // Для каждого слота: если есть pinned id → находим в pool и подставляем,
  // иначе оставляем то, что выдал ролл.
}
```

Пины — это «снепшот id», который пользователь хочет сохранить. После следующего ролла applyPins подменяет соответствующие слоты обратно.

### 3.4 Тесты

`lib/random/__tests__/algorithm.test.ts` под Vitest:

- 4 уникальных перка на 100 seed'ах;
- 2 уникальных аддона;
- одинаковый seed = одинаковый билд (детерминизм);
- efficient: все required-перки присутствуют (если не было fallback);
- fun: 4 перка, без дублей.

**Готово, когда:** `npm run test` зелёный, и в Node-консоли можно прогнать `rollBuild({role:'killer', killerId:'trapper', mode:'efficient', seed: 42})`.

---

## Этап 4. URL-шеринг (1-2 часа)

### 4.1 Короткий формат

`v1.killer.trapper.efficient.12345` — 5 частей через точку. Версия впереди, чтобы можно было ломать формат без боли в будущем.

`lib/url/encode.ts`:

```ts
export function encodeShort(build: Build): string {
  const char = build.role === 'killer' ? (build.killerId ?? 'any') : (build.survivorId ?? 'any');
  return `v1.${build.role}.${char}.${build.mode}.${build.seed}`;
}

export function decode(code: string): DecodeResult { /* parse + IncompatibleVersionError */ }
```

### 4.2 Страница `/build/[code]`

SSR: `decode(params.code)` → `rollBuild(input)` → рендер.

При `IncompatibleVersionError` показать «Этот билд создан старой версией данных» с кнопкой «Создать новый».

### 4.3 Длинный формат (опционально)

Если нужно шерить пины — `?p=p1,p2,p3,p4&i=toolbox&a=a1,a2&o=off1&pinned=p0,a1`. Дороже, но без БД.

**Готово, когда:** копируешь `/build/v1.killer.trapper.efficient.42` в новой вкладке и видишь тот же билд.

---

## Этап 5. UI рандомайзера (4-6 часов)

### 5.1 Хедер + лендинг

Простой лендинг с CTA «Бросить» → `/roll`. Можно сразу с тремя карточками режимов, можно без — это косметика.

### 5.2 Главный экран `/roll`

Компонент `RollClient.tsx` (`'use client'`):

- 3 контрола: роль (survivor/killer), персонаж (Select), режим (3 кнопки).
- Кнопка «Бросить».
- При клике: `seed = crypto.getRandomValues(new Uint32Array(1))[0]` → `rollBuild(...)` → `setBuild(...)`.
- Параллельно пишем `(role, char, mode, seed)` в URL через `router.replace(...)` — позволяет скопировать ссылку и иметь back/forward в браузере.

### 5.3 Гидрация из URL

При монтировании компонента читаем `searchParams` → если есть `seed`, делаем `rollBuild` с теми же параметрами и показываем билд. Это покрывает кейс «открыл ссылку — увидел билд».

### 5.4 Карточки результата

`BuildResult.tsx`:

- 4 перка в ряд (компоненты `PerkCard` с tooltip-описанием).
- Предмет + 2 аддона (для сурва) или 2 аддона (для киллера).
- Подношение.
- Кнопка «Перебросить аддоны/подношение» — частичный ролл.
- Клик по слоту = pin (визуально подсвечивается, при следующем перебросе остаётся).
- Кнопка «Скопировать ссылку».

**Совет:** не делай кастомные слот-карточки сразу — сначала текстовые `<div>{name}</div>`. Косметика делается ПОТОМ.

### 5.5 Парсер описаний

Описания DBD приходят с HTML и переменными:

```
Whenever you loot an item from a Chest, it will have:
<ul><li>A Visceral or lower rarity add-on.</li></ul>
You suffer from {Keyword.Exhausted} for {Tunable.S07P03.ExhaustionDuration}s.
```

`lib/dbd-text.ts` — простая функция-конвейер на регулярках, превращающая это в нормальный текст. См. реализацию в репо.

**Готово, когда:** на `/roll` можно нажать «Бросить», увидеть 4 перка + аддоны + моли с описаниями, переброс работает, пины работают, ссылка восстанавливает билд.

---

## Этап 6. Supabase: auth + сохранение (2-3 часа)

Эта часть **опциональна**. Без неё работает шеринг по short-URL — для MVP этого хватает.

### 6.1 Проект Supabase

1. Создать проект в supabase.com.
2. SQL Editor → миграция `001_saved_builds.sql`:

```sql
create table saved_builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  slug text unique not null,
  role text not null,
  killer_id text,
  mode text not null,
  seed bigint not null,
  pinned_state jsonb,
  note text,
  created_at timestamptz default now()
);

alter table saved_builds enable row level security;

create policy "select_public" on saved_builds for select using (true);
create policy "insert_owner" on saved_builds for insert with check (auth.uid() = user_id);
create policy "delete_owner" on saved_builds for delete using (auth.uid() = user_id);
```

3. Auth → URL Configuration → добавить `http://localhost:3000/auth/callback` и прод-URL.

### 6.2 SSR-клиенты

`lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({name, value, options}) => cookieStore.set(name, value, options)) } },
  );
}
```

`lib/supabase/client.ts` — `createBrowserClient(...)`. И `middleware.ts` — `await supabase.auth.getUser()` для обновления сессии.

### 6.3 Magic-link логин

- `/login/page.tsx` — форма с email.
- `signInWithOtp({ email, options: { emailRedirectTo: '/auth/callback?next=/roll' } })`.
- `/auth/callback/route.ts` — `exchangeCodeForSession(code)` → redirect на `?next=`.

### 6.4 API `/api/saves`

```ts
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // валидация + nanoid(6) + retry на коллизию slug → insert → return { slug }
}
```

### 6.5 Страница `/b/[slug]`

SSR: `select * from saved_builds where slug = ?` (RLS пускает всех на select) → `rollBuild(...)` → `applyPins(...)` → рендер.

**Готово, когда:** залогиненный юзер жмёт «Сохранить» на `/roll`, получает `/b/abc123`, и эта ссылка работает у любого без логина.

---

## Этап 7. Деплой (30 мин)

1. Залить в GitHub.
2. <https://vercel.com/new> → импорт репо → подложить env-переменные (Supabase ключи + `NEXT_PUBLIC_APP_URL`).
3. В Supabase Auth → URL Configuration добавить прод-URL.
4. Готово.

`vercel.json` — задаёт `NEXT_PUBLIC_APP_URL` (опционально, можно сразу в Vercel UI).

**Готово, когда:** прод-URL открывает приложение, бросок работает, шеринг работает, сохранение в БД работает.

---

## Этап 8. Что дорабатывать дальше

Это уже не MVP, а следующая жизнь:

1. **История роллов** — `localStorage` с последними N билдами (см. `lib/history.ts` в репо).
2. **Импорт/экспорт** — выгрузить свои сохранённые билды JSON-ом.
3. **Расширение BuildCore'ов** — это вечная история, в MVP их 8, в проде надо 50-100.
4. **Двойная стилистика → одна** — если стартуешь с нуля, выбирай ОДНО: либо Tailwind везде (быстрее), либо кастомные CSS-токены везде (атмосфернее).
5. **Twitch-интеграция** — стример рандомит, чат участвует. Отдельная фаза 2.
6. **Иконки** — DBD сами не лежат свободно. Качай через `scripts/download-icons.mjs` с tricky.lol с правильным User-Agent. Уважай rate limit.
7. **i18n** — структура `name: { en, ru }` уже готова, нужен только переключатель и проброс через UI.

---

## Что получилось пост-MVP (фазы 4 → 6f)

Этот roadmap описывает **минимальный** рандомайзер. Реальный репозиторий уехал заметно дальше — ниже короткая хронология, чтобы новый разработчик не путался, читая код vs читая roadmap.

| Фаза | Что добавили |
|------|-------------|
| 4. Полировка роллера | diamond-of-diamonds layout перков, фикс парсера tunable'ов, корректные DBD-цвета рарити |
| 5. Иконки + БД + публичный API | докачка иконок (perks/addons/offerings/items/killers/survivors), миграция контента в Supabase, `/api/v1/*` с CORS, страница `/api/docs`, hub `/wiki` со статьями |
| 6a. Чистка данных | content-флаги, excerpt, perk.character_slug |
| 6b. UI rework | redesign энциклопедии на cleaned data |
| 6c. Состояния + tooltip'ы | таблица `status_effects`, keyword-тултипы в описаниях, страница `/status-effects`, админ-CRUD |
| 6d. Унификация описаний | один `DbdDescription` везде, глобальный `/search` |
| 6e. Focus-режим перков | `/perks?focus=<id>` авто-открывает модал, более крупные иконки и портреты |
| 6f. Финальный пас по статусам | точные русские названия + игровые иконки status-effect'ов |

Архитектурно из этого следует:

- **Контент теперь живёт в Postgres**, не в JSON. JSON остался как fallback и единственный источник для роллера (который работает целиком на клиенте). При расхождении приоритет — у БД.
- **`/api/v1/*` — публичный контракт.** Любые изменения формата ответа делаются через `v2`, не через ломку `v1`.
- **Админка существует** и закрыта через `lib/admin/auth.ts::requireAdmin()` по `ADMIN_EMAILS`. Если переменная пустая — гард выключен (только для локалки).
- **Wiki — отдельная плоскость.** Markdown-статьи в `wiki_articles`, рендер через `lib/markdown.ts`.

Подробности — в `CLAUDE.md` (структура директорий, таблиц БД, инвариантов).

---

## Полезные принципы (выводы из факт-чека MVP)

1. **Версионируй URL-формат сразу.** `v1.*` — это копеечная страховка от боли через год.
2. **Детерминизм > красивый рандом.** Сначала добейся, что один seed = один билд. Все рюшечки потом.
3. **JSON-файлы — нормальный backend для статичных данных.** Подключай `as Type[]` и не выпендривайся с БД, пока сами данные статичны.
4. **RLS на share-таблицах = публичный select.** Если ссылку должны открывать незалогиненные — `using (true)` это нормально. Не лезь в `service_role` без причины.
5. **`Suspense` вокруг компонентов с `useSearchParams`** — обязателен в Next 14 App Router, иначе prod-сборка упадёт.
6. **Минимум LLM-генерации в проде.** Все «эффективные ядра», «синергии», «теги мемности» — это **ручная курация**. Делай LLM-помощник для сидинга, но не клади модель в hot path.

---

## Итого по объёму работ

| Этап | Время | Что получаешь |
|------|-------|---------------|
| 1. Каркас | 1-2ч | Next.js хелло-ворлд |
| 2. Данные | 3-4ч | Типизированные JSON с 30-40 перками |
| 3. Алгоритм | 3-5ч | `rollBuild` + тесты, детерминированный |
| 4. URL | 1-2ч | Шеринг по короткой ссылке |
| 5. UI | 4-6ч | Рабочий рандомайзер с пинами |
| 6. БД | 2-3ч | Сохранение билдов + magic-link |
| 7. Деплой | 0.5ч | Прод-URL на Vercel |
| **Итого MVP** | **15-22ч** | Рабочее приложение |

Дальше — наполнение данных и BuildCore'ов. Это работа, которой нет конца, и она важнее, чем кажется: алгоритм без хороших ядер выдаёт мусорные «эффективные» билды.
