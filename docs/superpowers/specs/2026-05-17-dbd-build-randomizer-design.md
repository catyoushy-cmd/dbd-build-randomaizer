# DBD Build Randomizer — Design Spec (MVP, Phase 1)

**Дата:** 2026-05-17
**Статус:** утверждённый дизайн, готов к написанию имплементационного плана

## Context

Веб-приложение для игроков Dead by Daylight: пользователь выбирает роль (выживший/убийца) и конкретного персонажа, выбирает один из трёх режимов рандома, и получает готовую сборку — 4 перка + предмет/аддоны + моли. Цель — заменить рутинный «полез в меню, накликал четыре галочки» на одну кнопку с вариативностью и игровыми вызовами.

Три режима покрывают разные потребности:
- **Полный рандом** — лотерея, для разнообразия и стрим-челленджей
- **Эффективность** — синергичный билд, сбалансированный по игровым задачам (генераторы+погоня для сурва; контроль карты+давление для убийцы)
- **Веселье** — билды на синергии вокруг гиммика (Boil Over Sabotage, экспоз-стэк и т.п.), которые редко работают, но интересно играются

Это MVP. **Twitch-интеграция** (стример рандомит, зрители участвуют) — отдельная Фаза 2, в этой спеке только архитектурный задел под неё (Next.js + Supabase сразу, чтобы потом не переписывать).

## Архитектура и стек

- **Next.js 14** (App Router, TypeScript strict)
- **Tailwind CSS** + **shadcn/ui** (Radix primitives)
- **Supabase** — anon-доступ работает, опциональный magic-link логин для сохранения именованных билдов
- Деплой на **Vercel**
- **Без AI** — алгоритм детерминированный
- **Без серверных воркеров** — рандом считается на клиенте; серверная часть нужна только для сохранения именованных билдов (опциональная фича)
- **PRNG**: `mulberry32` (детерминированный по seed, 32-битный)

## Модель данных

JSON-файлы в `data/` импортируются как обычные модули. Источник истины — репо.

```ts
// data/perks.json
type Perk = {
  id: string;                            // 'iron-will'
  name: { en: string; ru: string };
  role: 'survivor' | 'killer';
  character: string | null;              // null = teachable/общий
  icon: string;                          // путь к спрайту
  description: { en: string; ru: string };
  roles: PerkRole[];                     // ['exhaustion', 'chase-escape']
  synergy_groups: string[];              // ['boil-over-combo', ...]
  tier: 'S' | 'A' | 'B' | 'C';           // мягкая подсказка для "эффективности"
  deprecated?: boolean;                  // вычищен из игры, не показывать в новых роллах
};

type PerkRole =
  | 'gen' | 'chase-escape' | 'info' | 'altruism' | 'exhaustion' | 'boon' | 'meme'        // surv
  | 'slowdown' | 'chase-power' | 'aura' | 'hex' | 'endgame' | 'stealth' | 'meme';        // killer

// data/killers.json
type Killer = {
  id: string;                            // 'trapper'
  name: { en: string; ru: string };
  power: string;
  icon: string;
};

// data/items.json — для сурва
type Item = {
  id: string;
  type: 'flashlight' | 'medkit' | 'toolbox' | 'map' | 'key';
  name: { en: string; ru: string };
  rarity: 'common' | 'uncommon' | 'rare' | 'very-rare';
};

// data/addons.json
type Addon = {
  id: string;
  name: { en: string; ru: string };
  scope:
    | { type: 'killer'; killerId: string }
    | { type: 'item'; itemType: Item['type'] };
  rarity: 'common' | 'uncommon' | 'rare' | 'very-rare' | 'ultra-rare';
  tags: ('efficient' | 'meme' | 'troll')[];
};

// data/offerings.json
type Offering = {
  id: string;
  name: { en: string; ru: string };
  role: 'survivor' | 'killer' | 'both';
  tags: ('efficient' | 'meme' | 'troll')[];
};

// data/build-cores.json — сердце "эффективности" и "веселья"
type BuildCore = {
  id: string;                            // 'boil-over-sabo'
  name: string;                          // отображаемое название
  role: 'survivor' | 'killer';
  mode: 'fun' | 'efficient';
  required_perks: string[];              // 2-3 perk ids, каркас
  recommended_perks: string[];           // приоритет при добивании
  preferred_item_type?: Item['type'];    // для сурв-fun "Sabo build" → toolbox
  description: string;                   // короткое объяснение синергии для UI
};
```

**Объём ручной курации:** ~250 перков (поля `roles`, `synergy_groups`, `tier`); все аддоны/моли получают `tags`; ~20-40 build-cores на роль на режим (итого 80-160 ядер).

`name`/`description` локализуются (en + ru) для будущего i18n; UI по умолчанию русский.

## Алгоритм рандомизации

Общие защиты во всех режимах:
- Никаких дубликатов перков
- Аддоны не повторяются
- `deprecated: true` исключаются из всех пулов

Каждый ролл получает **seed** (uint32) → весь рандом через `mulberry32(seed)`. Seed кладётся в URL — точная сборка воспроизводится по ссылке.

### Полный рандом

1. 4 уникальных перка случайно из пула роли
2. Сурв: случайный `Item` → 2 случайных аддона из `addons.filter(a => a.scope.type === 'item' && a.scope.itemType === item.type)`
3. Киллер: 2 случайных аддона из `addons.filter(a => a.scope.type === 'killer' && a.scope.killerId === selectedKiller.id)`
4. Случайная моли из `offerings.filter(o => o.role === selectedRole || o.role === 'both')`

### Эффективность

1. Выбираем случайное `BuildCore` где `mode === 'efficient'` и `role` совпадает
2. Берём `core.required_perks` (2-3 перка)
3. **Добиваем до 4** через role-coverage:
   - Список обязательных к покрытию ролей: surv = `['chase-escape', 'info', 'gen', 'exhaustion']`, killer = `['slowdown', 'chase-power', 'info', 'aura']`
   - Определяем, какие из этих ролей уже покрыты required-перками
   - Из непокрытых добираем по одному перку этой роли, приоритет `tier: S → A → B → C`
   - Если все обязательные покрыты, но перков < 4 — добираем из `recommended_perks`, затем из S/A-тира случайно
4. Сурв-предмет: если `preferred_item_type` указан — берём предмет этого типа; иначе случайный. Аддоны — приоритет `tags.includes('efficient')`
5. Аддоны киллера — приоритет `tags.includes('efficient')`
6. Моли — приоритет efficient

### Веселье

1. Случайное `BuildCore` где `mode === 'fun'` и `role` совпадает
2. Берём все `required_perks` (часто 3-4, иногда полный билд из 4)
3. Если перков < 4, добиваем из `recommended_perks`, затем из перков с `roles.includes('meme')`
4. Предмет/аддоны — приоритет `tags.includes('meme')` или `'troll'`
5. Моли — fun-теги

### Fallback при битых данных

Если ядро требует перк, которого нет в пуле (опечатка / sync вычистил) — фолбэк на «Полный рандом», в UI показываем тост «ядро X недоступно, выдан полный рандом». Это диагностический сигнал, не пользовательская фича.

### Пин-нутые слоты

Если у юзера есть закреплённые перки/аддоны/предмет/моли:
- Ролл генерируется как обычно по seed
- Финальные слоты, помеченные «закреплено», подменяются пользовательскими значениями
- В URL такой ролл кодируется длинным форматом (см. ниже), а не одним seed

## UX-флоу и страницы

```
/                    Лендинг: краткое "что это", CTA → /roll
/roll                Главный экран рандомайзера
/build/[code]        Просмотр конкретной сборки (для шеринга)
/b/[slug]            Короткая ссылка на сохранённый билд (требует Supabase)
/history             История роллов (localStorage + явно сохранённые из БД)
/login               Magic link (опциональный)
/auth/callback       Supabase PKCE callback
```

### Главный экран `/roll`

Один экран без перезагрузок, state в URL.

```
[ Роль: Сурв | Киллер ]
[ Персонаж: dropdown с иконкой ]   ← для сурва "Любой выживший" допустим
[ Режим: 🎲 Рандом | ⚡ Эффективность | 🎉 Веселье ]
[              ROLL!              ]

──── Результат ────
4 перка (карточки: иконка, название, hover-описание)

Сурв: предмет + 2 аддона
Киллер: 2 аддона к силе

Моли

Если режим=efficient/fun:
  💡 Билд: "Boil Over Sabotage" — короткое описание синергии из core.description

[ 🔄 Перебросить всё ] [ 🔒 Закрепить → перебросить остальное ]
[ 📋 Скопировать ссылку ] [ 💾 Сохранить ]
```

### Микро-фичи

- **Закрепить слот**: клик по карточке → пин. Следующий ролл оставляет пин-нутые
- **Перебросить только аддоны / только моли**: отдельные кнопки на блоках
- **Hover-тултип** с описанием перка
- **История localStorage**: последние 20 роллов чип-списком под формой
- **State формы в URL**: `?role=killer&killer=trapper&mode=efficient&seed=12345`

### `/build/[code]`

Read-only карточка сборки + кнопка «Скопировать себе» (открывает `/roll` с пред-заполненным state).

## Шаринг — URL-схема

Билд кодируется в URL, БД не обязательна:

```
Короткий (без пинов):
  /build/v1.killer.trapper.efficient.12345
                                    └─ seed

Длинный (с пинами / руками подменёнными слотами):
  /build/v1?p=p1,p2,p3,p4&i=toolbox&a=a1,a2&o=off1&pinned=p1,a1
```

- `v1` — версия схемы; при изменении алгоритма/данных старые ссылки показывают предупреждение «билд сгенерирован старой версией данных»
- Длинный формат при необходимости base64-сжимается

## Supabase — минимум для MVP

Только для опциональной фичи «сохранить именованный билд».

```sql
create table saved_builds (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  slug            text unique not null,           -- короткий код: /b/ab12cd
  role            text not null,
  killer_id       text,
  mode            text not null,
  seed            bigint not null,
  pinned_state    jsonb,                          -- если есть пины
  note            text,
  created_at      timestamptz default now()
);

alter table saved_builds enable row level security;

-- public select: любой может открыть публичную ссылку
create policy saved_builds_select on saved_builds for select using (true);
-- insert/update/delete: только владелец
create policy saved_builds_insert on saved_builds for insert with check (auth.uid() = user_id);
create policy saved_builds_update on saved_builds for update using (auth.uid() = user_id);
create policy saved_builds_delete on saved_builds for delete using (auth.uid() = user_id);
```

История анонимного пользователя — только localStorage (последние 20).
История залогиненного — те же 20 в localStorage **плюс** явно сохранённые билды в `saved_builds`. Никакой автоматической синхронизации полной истории — это явный шаг.

Magic link — Supabase Auth с PKCE flow (как в прошлом проекте), `/auth/callback` route handler.

## Sync-скрипт `scripts/sync-dbd.ts`

Запускается вручную: `npm run sync:dbd`

1. Тянет данные с публичного источника (выбрать при имплементации — `dbd.tricky.lol`, `dbd-info.com`, либо ручной HTML-экспорт)
2. Мерджит с `data/*.json` по `id`:
   - **Новые** перки/аддоны → добавить с пустыми ручными полями (`roles: []`, `synergy_groups: []`, `tier: 'B'`, `tags: []`)
   - **Существующие** → обновить только поля из источника (`name`, `description`, `icon`); **не трогать** ручные поля курации
   - **Удалённые из источника** → пометить `deprecated: true` (не удалять, чтобы старые URL продолжали работать)
3. Скачивает новые иконки в `public/icons/{perks,killers,items,offerings}/`
4. После запуска — `git diff` и ручной коммит

Скрипт **никогда не пушит в репо автоматически** — все обновления проходят ручное ревью.

## Структура директорий (предложение)

```
app/
  layout.tsx
  globals.css
  page.tsx                          # лендинг
  roll/
    page.tsx                        # главный экран (client component)
    RollForm.tsx
    BuildResult.tsx
    PerkCard.tsx
    AddonCard.tsx
  build/[code]/page.tsx             # read-only сборка по seed
  b/[slug]/page.tsx                 # read-only сборка по slug из Supabase
  history/page.tsx
  login/page.tsx
  auth/callback/route.ts

lib/
  random/prng.ts                    # mulberry32
  random/algorithm.ts               # три режима, добивание ролями
  random/pinning.ts                 # подмена пин-нутых слотов
  data/index.ts                     # типы + импорт JSON
  url/encode.ts                     # build → URL и обратно
  supabase/{client,server}.ts

data/
  perks.json
  killers.json
  items.json
  addons.json
  offerings.json
  build-cores.json

scripts/
  sync-dbd.ts                       # ручной запуск

public/icons/                       # иконки спрайтов
supabase/migrations/001_init.sql
components/ui/                      # shadcn
```

## Out of scope (явно не делаем в MVP)

- ❌ Twitch-интеграция, голосование зрителей (Фаза 2)
- ❌ Аккаунт-облако всей истории (только явно сохранённые билды)
- ❌ Кастомные пулы / бан-листы / «только мои персонажи»
- ❌ Кастомные пользовательские build cores
- ❌ Тир-листы по аддонам (только теги efficient/meme/troll)
- ❌ Языки кроме русского и английского
- ❌ OG-картинки превью билда
- ❌ PWA / оффлайн

## Верификация (как тестировать end-to-end)

1. `npm run dev` → `/roll`, прокликать все 3 режима для сурва и пары киллеров — визуально результат разумный, синергии в efficient/fun читаются
2. Открыть тот же URL `/build/v1.killer.trapper.efficient.12345` в инкогнито → сборка идентичная (детерминизм seed)
3. Закрепить 2 перка → ребросить → закреплённые не меняются, остальные обновились
4. Скопировать ссылку → открыть в новой вкладке → та же сборка
5. Залогиниться через magic link, сохранить сборку → в инкогнито открыть `/b/{slug}` → сборка отображается
6. Запустить `npm run sync:dbd` (после реализации) → JSON обновляется, ручные теги (`roles`, `synergy_groups`, `tier`, `tags`) сохранены
7. Юнит-тесты:
   - PRNG детерминированность: один seed → одна сборка
   - Алгоритм добивания: нет дубликатов перков, нет дубликатов аддонов
   - Битое ядро (требует перк, которого нет): фолбэчит на полный рандом без падений
   - URL encode/decode: round-trip короткого и длинного формата
