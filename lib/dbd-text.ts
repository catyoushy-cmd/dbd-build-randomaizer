/**
 * Parser for DBD raw description strings.
 *
 * Source data contains:
 *   - HTML fragments (<br>, <ul><li>...</li></ul>)
 *   - Keyword tokens: {Keyword.Exhausted}, optionally pre-wrapped in «»
 *   - Tunable tokens: {Tunable.S07P03.HasteDuration} or {Tunable.…%}
 *   - Input tokens: {Input.ActivateAbility}
 *
 * Two output shapes:
 *
 * 1. `formatDbdText(raw, tunables?)` — flat string with values resolved to the
 *    maximum tier (used in plain tooltips). Keyword highlight isn't possible
 *    in plain text.
 *
 * 2. `parseDbdText(raw, tunables?)` — array of typed segments suitable for
 *    React rendering:
 *      - { type: 'text',     value: string }
 *      - { type: 'keyword',  label: string, key: string }
 *      - { type: 'tunable',  values: [string,string,string] }
 *      - { type: 'newline' }
 *      - { type: 'bullet' }
 *    Bullets/newlines are kept as explicit segments so a renderer can wrap
 *    them however it wants (e.g. styled <li>).
 */

/**
 * Official RU translations from the localised DBD client / fandom wiki.
 * Keep in sync with data/status-effects.json (the encyclopedia source of truth).
 */
const KEYWORDS: Record<string, string> = {
  // Survivor debuffs
  Blindness:       'Слепота',
  Broken:          'Ослабление',
  Exhausted:       'Усталость',
  Exposed:         'Уязвимость',
  Hemorrhage:      'Кровотечение',
  Hindered:        'Замедление',
  Incapacitated:   'Обездвиживание',
  Mangled:         'Травма',
  Oblivious:       'Забывчивость',
  DeepWound:       'Глубокая рана',
  Cursed:          'Проклятие',
  // Buffs / movement
  Elusive:         'Ускользание',
  Endurance:       'Стойкость',
  Haste:           'Спешка',
  Undetectable:    'Незаметность',
  undetectable:    'Незаметность',
  Blessed:         'Благословение',
  // Killer / special
  KillerEndurance: 'Хладнокровие',
  Glyph:           'Символ',
  Reveal:          'Раскрыт',
};

/** Result segment types for the rich parser. */
export type DbdSegment =
  | { type: 'text'; value: string }
  | { type: 'keyword'; label: string; key: string }
  | { type: 'tunable'; values: [string, string, string] }
  | { type: 'newline' }
  | { type: 'bullet' };

/** Resolve a tunable token to a tuple of three tier values (raw → t1/t2/t3 strings). */
function resolveTunable(
  keyRaw: string,
  pct: string,
  trailing: string,
  tunables?: Record<string, number[] | undefined>,
): [string, string, string] {
  const wantsPct = pct === '%' || trailing === '%';
  const fallback = wantsPct ? '?%' : '?';
  if (!tunables) return [fallback, fallback, fallback];

  // Tunable keys come in two flavours:
  //   "hasteduration"      (no %)
  //   "modifychestchance%" (with %)
  const variants = [keyRaw.toLowerCase() + pct, keyRaw.toLowerCase()];
  let vals: number[] | undefined;
  for (const k of variants) {
    if (tunables[k]) { vals = tunables[k]; break; }
  }
  if (!vals || vals.length === 0) return [fallback, fallback, fallback];

  // Real DBD perks have up to 3 tier values. Constant tunables have 1 — repeat it.
  const get = (i: number) => vals![Math.min(i, vals!.length - 1)];
  const fmt = (n: number) => (wantsPct ? `${n}%` : String(n));
  return [fmt(get(0)), fmt(get(1)), fmt(get(2))];
}

/** Common pre-processing: strip HTML tags into newline/bullet markers + plain text. */
function preprocess(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '\n ')          //  = bullet marker
    .replace(/<\/li>/gi, '')
    .replace(/<\/?ul>/gi, '\n')
    .replace(/<\/?[^>]+>/g, '');
}

/** Flat-string version. Tunables collapse to highest tier (last array element). */
export function formatDbdText(
  raw: string | undefined,
  tunables?: Record<string, number[] | undefined>,
): string {
  if (!raw) return '';

  return preprocess(raw)
    .replace(/ /g, '• ')
    .replace(/«\{Keyword\.(\w+)\}»/g, (_, key) => `«${KEYWORDS[key] ?? key}»`)
    .replace(/\{Keyword\.(\w+)\}/g, (_, key) => KEYWORDS[key] ?? key)
    .replace(/\{Input\.[^}]+\}/g, 'кнопку активной способности')
    .replace(/\{Tunable\.(?:[^.}]+\.)?([^}%]+)(%?)\}(%?)/g, (_, keyRaw, pct, trailing) => {
      const [, , t3] = resolveTunable(keyRaw, pct, trailing, tunables);
      return t3; // highest-tier value
    })
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
}

/**
 * Rich AST. Walks the raw string once and emits typed segments so a renderer
 * can colour tunables / decorate keywords / lay out bullets correctly.
 */
export function parseDbdText(
  raw: string | undefined,
  tunables?: Record<string, number[] | undefined>,
): DbdSegment[] {
  if (!raw) return [];

  // Tokenise: every {…} and  marker becomes a segment.
  const pre = preprocess(raw);
  const segments: DbdSegment[] = [];

  // Regex matches keywords / tunables / inputs / bullets / newlines.
  // The remaining characters between matches become 'text'.
  const RE = /«\{Keyword\.(\w+)\}»|\{Keyword\.(\w+)\}|\{Input\.[^}]+\}|\{Tunable\.(?:[^.}]+\.)?([^}%]+)(%?)\}(%?)|( )|(\n)/g;

  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = RE.exec(pre)) !== null) {
    if (m.index > cursor) {
      const text = pre.slice(cursor, m.index).replace(/ {2,}/g, ' ');
      if (text) segments.push({ type: 'text', value: text });
    }
    cursor = m.index + m[0].length;

    if (m[1]) {
      // «{Keyword.X}» — keep quotes outside
      const k = m[1];
      segments.push({ type: 'keyword', label: KEYWORDS[k] ?? k, key: k });
    } else if (m[2]) {
      // bare {Keyword.X}
      const k = m[2];
      segments.push({ type: 'keyword', label: KEYWORDS[k] ?? k, key: k });
    } else if (m[3] !== undefined) {
      // {Tunable…}
      segments.push({ type: 'tunable', values: resolveTunable(m[3], m[4] ?? '', m[5] ?? '', tunables) });
    } else if (m[6]) {
      segments.push({ type: 'bullet' });
    } else if (m[7]) {
      segments.push({ type: 'newline' });
    } else {
      // {Input.*} or anything we don't handle specially → plain replacement
      segments.push({ type: 'text', value: 'кнопку активной способности' });
    }
  }
  if (cursor < pre.length) {
    const text = pre.slice(cursor).replace(/ {2,}/g, ' ');
    if (text) segments.push({ type: 'text', value: text });
  }

  // Collapse runs of newlines (>2) into a single one
  return collapseBlankRuns(segments);
}

function collapseBlankRuns(segs: DbdSegment[]): DbdSegment[] {
  const out: DbdSegment[] = [];
  let consecutiveNL = 0;
  for (const s of segs) {
    if (s.type === 'newline') {
      consecutiveNL++;
      if (consecutiveNL > 2) continue;
    } else {
      consecutiveNL = 0;
    }
    out.push(s);
  }
  // trim leading/trailing newlines
  while (out.length && out[0].type === 'newline') out.shift();
  while (out.length && out[out.length - 1].type === 'newline') out.pop();
  return out;
}

/**
 * Split a description into "mechanics" and "flavor" halves.
 * Heuristic: first paragraph (until first \n\n) is mechanics, rest is flavor.
 * If there's no \n\n, everything is mechanics.
 */
export function splitDescription(raw: string | undefined): { mechanics: string; flavor: string } {
  if (!raw) return { mechanics: '', flavor: '' };
  const cleaned = raw.replace(/<br\s*\/?>/gi, '\n');
  // Find first double newline
  const idx = cleaned.indexOf('\n\n');
  if (idx === -1) return { mechanics: cleaned.trim(), flavor: '' };
  return {
    mechanics: cleaned.slice(0, idx).trim(),
    flavor: cleaned.slice(idx + 2).trim(),
  };
}
