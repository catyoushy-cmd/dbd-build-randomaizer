/**
 * Shared display labels and ordering helpers used across explorer pages
 * (/perks, /items, /addons, /offerings, /status-effects).
 *
 * Kept as a single module on purpose: these are tiny string tables that
 * frequently move together. Splitting per-entity would just create import
 * churn.
 */

/* ───────── Perk role tags ─────────
 * Labels for the `roles` field on a Perk (mechanical category, NOT
 * survivor/killer). Used by the quick-pick chips on /perks and by the
 * "Назначения" row in the perk modal.
 */
export const PERK_TAG_LABEL: Record<string, string> = {
  gen: 'Ген',
  'chase-escape': 'Побег',
  info: 'Инфо',
  altruism: 'Альтруизм',
  exhaustion: 'Истощение',
  boon: 'Дарование',
  meme: 'Мем',
  slowdown: 'Замедление',
  'chase-power': 'Погоня',
  aura: 'Аура',
  hex: 'Гекс',
  endgame: 'Финал',
  stealth: 'Скрытность',
  healing: 'Лечение',
  chest: 'Сундуки',
  item: 'Предметы',
  totem: 'Тотемы',
  map: 'Карта',
  survival: 'Выживание',
};

/* ───────── Item types ───────── */

export const ITEM_TYPE_LABEL: Record<string, string> = {
  flashlight: 'Фонарики',
  medkit: 'Аптечки',
  toolbox: 'Инструменты',
  map: 'Карты',
  key: 'Ключи',
  misc: 'Особые',
};

export const ITEM_TYPE_SINGULAR: Record<string, string> = {
  flashlight: 'Фонарик',
  medkit: 'Аптечка',
  toolbox: 'Инструменты',
  map: 'Карта',
  key: 'Ключ',
  misc: 'Особый предмет',
};

/** Canonical display order for item-type tabs. */
export const ITEM_TYPE_ORDER = ['medkit', 'toolbox', 'flashlight', 'map', 'key', 'misc'] as const;

/* ───────── Player roles (survivor / killer / both) ─────────
 * Two forms because offerings ("это подношение Выжившим") and build
 * summaries ("Сторона: Выживший") read naturally in different cases.
 */

/** Dative form — used on /offerings ("Выжившим", "Убийцам"). */
export const PLAYER_ROLE_DATIVE: Record<string, string> = {
  survivor: 'Выжившим',
  killer: 'Убийцам',
  both: 'Общее',
};

/** Nominative form — used in build summaries ("Выживший", "Убийца"). */
export const PLAYER_ROLE_LABEL: Record<string, string> = {
  survivor: 'Выживший',
  killer: 'Убийца',
  both: 'Общее',
};

/* ───────── Rarity ─────────
 * Highest tier first. `ultra` and `ultra-rare` are both treated as the
 * top tier — the dataset uses both spellings depending on source. Same
 * for `very-rare`/`veryrare`.
 */
export const RARITY_ORDER = [
  'ultra',
  'ultra-rare',
  'very-rare',
  'veryrare',
  'rare',
  'uncommon',
  'common',
] as const;

/** Sort key: lower = rarer. Unknown rarities sort to the end. */
export function rarityScore(r?: string | null): number {
  const i = RARITY_ORDER.indexOf((r ?? 'common') as (typeof RARITY_ORDER)[number]);
  return i === -1 ? 99 : i;
}

/* ───────── Status-effect categories ─────────
 * Plural for grouping headers ("Дебафы"), singular for chip badges on
 * individual effects ("Дебаф"). Don't merge — different grammatical roles.
 */

export const STATUS_CATEGORY_LABEL_PLURAL: Record<string, string> = {
  debuff: 'Дебафы',
  buff: 'Бафы',
  general: 'Общие',
  aura: 'Ауры',
  status: 'Прочее',
};

export const STATUS_CATEGORY_LABEL_SINGULAR: Record<string, string> = {
  debuff: 'Дебаф',
  buff: 'Баф',
  general: 'Общее',
  aura: 'Аура',
  status: 'Состояние',
};

export const STATUS_CATEGORY_COLOR: Record<string, string> = {
  debuff: 'var(--r-rare)',
  buff: 'var(--dbd-accent)',
  aura: 'var(--dbd-brass)',
  status: 'var(--ink-mute)',
  general: 'var(--ink-mute)',
};
