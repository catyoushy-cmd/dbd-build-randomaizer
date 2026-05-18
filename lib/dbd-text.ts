const KEYWORDS: Record<string, string> = {
  Blindness:       'Слепота',
  Broken:          'Сломлен',
  Elusive:         'Неуловимость',
  Endurance:       'Стойкость',
  Exhausted:       'Истощение',
  Exposed:         'Незащищённость',
  Haste:           'Бодрость',
  Hemorrhage:      'Кровотечение',
  Hindered:        'Помеха',
  Mangled:         'Повреждение',
  Oblivious:       'Забвение',
  Undetectable:    'Необнаруживаемость',
  undetectable:    'Необнаруживаемость',
};

/**
 * Convert DBD raw description (HTML + template vars) → readable Russian text.
 * Pass `tunables` from perk data to resolve numeric values (max tier = last array element).
 *
 * Tunable key mapping: "{Tunable.S02P03.HasteDuration}" → last segment lowercased → "hasteduration"
 */
export function formatDbdText(
  raw: string | undefined,
  tunables?: Record<string, number[] | undefined>,
): string {
  if (!raw) return '';

  return raw
    // block tags → line breaks / bullets
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<\/?ul>/gi, '')
    .replace(/<\/?[^>]+>/g, '')
    // {Keyword.X} — source may already wrap in «», handle both cases
    .replace(/«\{Keyword\.(\w+)\}»/g, (_, key) =>
      `«${KEYWORDS[key] ?? key}»`
    )
    .replace(/\{Keyword\.(\w+)\}/g, (_, key) =>
      KEYWORDS[key] ?? key
    )
    // {Input.*} → generic label
    .replace(/\{Input\.[^}]+\}/g, 'кнопку активной способности')
    // {Tunable.PREFIX.KEY} or {Tunable.PREFIX.KEY%}
    .replace(/\{Tunable\.(?:[^.}]+\.)?([^}%]+)(%?)\}/g, (_, keyRaw, pct) => {
      if (tunables) {
        const key = keyRaw.toLowerCase() + pct; // e.g. "hasteduration" or "haste%"
        const vals = tunables[key];
        if (vals && vals.length > 0) {
          const maxVal = vals[vals.length - 1]; // last = highest tier
          return pct ? `${maxVal}%` : String(maxVal);
        }
      }
      return pct ? '?%' : '?';
    })
    // collapse whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
}
