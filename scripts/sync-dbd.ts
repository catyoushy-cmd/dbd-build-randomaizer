/**
 * Sync Dead by Daylight data from dbd.tricky.lol API.
 * Run: npm run sync:dbd
 *
 * Merge rules:
 *   - Manual curation fields (roles, synergy_groups, tier, tags) are preserved
 *   - New entities are auto-curated via AI if OPENROUTER_API_KEY is set
 *   - Removed entities are marked deprecated:true, never physically deleted
 *   - Icons downloaded to public/icons/{perks,killers,survivors,items,addons,offerings}/
 *
 * AI default model: deepseek/deepseek-v3-0324:free
 * Override via OPENROUTER_MODEL in .env.local
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const ICONS_DIR = path.join(ROOT, 'public', 'icons');

const API_BASE = 'https://dbd.tricky.lol/api';
const API_IMG_BASE = 'https://dbd.tricky.lol';

// ---------------------------------------------------------------------------
// Env loader (.env.local)
// ---------------------------------------------------------------------------

async function loadEnv(): Promise<Record<string, string>> {
  const env: Record<string, string> = {};
  try {
    const raw = await fs.readFile(path.join(ROOT, '.env.local'), 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  } catch {
    // .env.local absent — rely on process.env
  }
  return env;
}

// ---------------------------------------------------------------------------
// OpenRouter helper
// ---------------------------------------------------------------------------

let openRouterKey = '';
let openRouterModel = 'deepseek/deepseek-v3-0324:free';

async function callOpenRouter(
  messages: { role: string; content: string }[],
): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://dbd-build-randomaizer.vercel.app',
    },
    body: JSON.stringify({
      model: openRouterModel,
      messages,
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text}`);
  }
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content;
}

/** Extract JSON array from AI response (handles markdown code blocks, raw JSON, etc.) */
function safeParseArray<T>(raw: string, key: string): T[] {
  try {
    // Strip markdown code blocks if present
    const stripped = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed)) return parsed as T[];
    const arr = parsed[key] ?? parsed['items'] ?? parsed['data'] ?? Object.values(parsed)[0];
    return Array.isArray(arr) ? arr as T[] : [];
  } catch {
    return [];
  }
}

/** Split array into chunks of size n */
function chunks<T>(arr: T[], n: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) result.push(arr.slice(i, i + n));
  return result;
}

// ---------------------------------------------------------------------------
// AI curation types
// ---------------------------------------------------------------------------

type PerkCuration = {
  id: string;
  roles: string[];
  synergy_groups: string[];
  tier: 'S' | 'A' | 'B' | 'C';
  name_ru: string;
  description_ru: string;
};

type AddonCuration = {
  id: string;
  tags: string[];
  name_ru: string;
};

type NameCuration = {
  id: string;
  name_ru: string;
};

// ---------------------------------------------------------------------------
// AI: curate new perks (in batches of 40)
// ---------------------------------------------------------------------------

async function aiCuratePerks(
  perks: { id: string; nameEn: string; descEn: string; role: 'survivor' | 'killer' }[],
): Promise<Map<string, PerkCuration>> {
  if (!perks.length) return new Map();
  const result = new Map<string, PerkCuration>();

  for (const batch of chunks(perks, 40)) {
    console.log(`  🤖 AI curation: ${batch.length} perk(s) (${result.size + batch.length}/${perks.length})…`);

    const prompt = `You are a Dead by Daylight expert. Curate these perks. Reply with ONLY valid JSON, no markdown.

SURVIVOR ROLES (use 1-3): gen, chase-escape, info, exhaustion, healing, meme
KILLER ROLES (use 1-3): slowdown, chase-power, info, aura, meme
SYNERGY GROUPS (0-2): exhaustion-stack, gen-rush, slowdown-stack, aura-stack, info-pack, healing-stack, regression-stack
TIER: S=top meta, A=strong, B=situational, C=weak

PERKS:
${batch.map(p => `id:${p.id} role:${p.role}\n${p.nameEn}: ${p.descEn}`).join('\n---\n')}

Reply ONLY with this JSON:
{"perks":[{"id":"...","roles":["..."],"synergy_groups":[],"tier":"B","name_ru":"...","description_ru":"..."}]}`;

    try {
      const raw = await callOpenRouter([{ role: 'user', content: prompt }]);
      const arr = safeParseArray<PerkCuration>(raw, 'perks');
      arr.forEach(p => result.set(p.id, p));
    } catch (e) {
      console.warn('  ⚠ AI perk batch failed:', e);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// AI: curate new addons (in batches of 60)
// ---------------------------------------------------------------------------

async function aiCurateAddons(
  addons: { id: string; nameEn: string; descEn: string; rarity: string }[],
): Promise<Map<string, AddonCuration>> {
  if (!addons.length) return new Map();
  const result = new Map<string, AddonCuration>();

  for (const batch of chunks(addons, 60)) {
    console.log(`  🤖 AI curation: ${batch.length} addon(s) (${result.size + batch.length}/${addons.length})…`);

    const prompt = `You are a Dead by Daylight expert. Tag these addons and translate names to Russian. Reply with ONLY valid JSON, no markdown.

TAGS (0-2): efficient (strong meta), meme (gimmick/fun), troll (disrupts opponents)

ADDONS:
${batch.map(a => `id:${a.id} rarity:${a.rarity}\n${a.nameEn}: ${a.descEn}`).join('\n---\n')}

Reply ONLY with this JSON:
{"addons":[{"id":"...","tags":[],"name_ru":"..."}]}`;

    try {
      const raw = await callOpenRouter([{ role: 'user', content: prompt }]);
      const arr = safeParseArray<AddonCuration>(raw, 'addons');
      arr.forEach(a => result.set(a.id, a));
    } catch (e) {
      console.warn('  ⚠ AI addon batch failed:', e);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// AI: curate new offerings (in batches of 30)
// ---------------------------------------------------------------------------

async function aiCurateOfferings(
  offerings: { id: string; nameEn: string; descEn: string; rarity: string }[],
): Promise<Map<string, AddonCuration>> {
  if (!offerings.length) return new Map();
  const result = new Map<string, AddonCuration>();

  for (const batch of chunks(offerings, 30)) {
    console.log(`  🤖 AI curation: ${batch.length} offering(s)…`);

    const prompt = `You are a Dead by Daylight expert. Tag these offerings and translate names to Russian. Reply with ONLY valid JSON, no markdown.

TAGS: efficient (meta/useful), meme (gimmick), troll (disrupts opponents)

OFFERINGS:
${batch.map(o => `id:${o.id} rarity:${o.rarity}\n${o.nameEn}: ${o.descEn}`).join('\n---\n')}

Reply ONLY with this JSON:
{"offerings":[{"id":"...","tags":[],"name_ru":"..."}]}`;

    try {
      const raw = await callOpenRouter([{ role: 'user', content: prompt }]);
      const arr = safeParseArray<AddonCuration>(raw, 'offerings');
      arr.forEach(o => result.set(o.id, o));
    } catch (e) {
      console.warn('  ⚠ AI offering batch failed:', e);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// AI: translate names (killers / survivors / items)
// ---------------------------------------------------------------------------

async function aiTranslateNames(
  items: { id: string; nameEn: string }[],
  entityType: string,
): Promise<Map<string, string>> {
  if (!items.length) return new Map();
  const result = new Map<string, string>();

  for (const batch of chunks(items, 50)) {
    console.log(`  🤖 AI translation: ${batch.length} ${entityType}(s)…`);

    const prompt = `Translate these Dead by Daylight ${entityType} names to natural Russian. Reply with ONLY valid JSON, no markdown.

${batch.map(i => `${i.id}: ${i.nameEn}`).join('\n')}

Reply ONLY with this JSON: {"items":[{"id":"...","name_ru":"..."}]}`;

    try {
      const raw = await callOpenRouter([{ role: 'user', content: prompt }]);
      const arr = safeParseArray<NameCuration>(raw, 'items');
      arr.forEach(i => result.set(i.id, i.name_ru));
    } catch (e) {
      console.warn(`  ⚠ AI ${entityType} translation batch failed:`, e);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

/** Resolve a potentially relative API image path to a full downloadable URL */
function imageUrl(p: string): string {
  if (!p) return '';
  if (p.startsWith('http')) return p;
  // API returns paths like /Game/UI/... without extension
  return `${API_IMG_BASE}${p}.png`;
}

async function downloadIcon(url: string, destPath: string): Promise<void> {
  if (!url) return;
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, buf);
  } catch {
    // Icon download failure is non-fatal
  }
}

async function readJson<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.writeFile(
    path.join(DATA_DIR, file),
    JSON.stringify(data, null, 2) + '\n',
    'utf-8',
  );
}

function slug(name: unknown): string {
  if (!name) return '';
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ---------------------------------------------------------------------------
// API response types (dbd.tricky.lol — real structure)
// ---------------------------------------------------------------------------

type ApiPerk = {
  name: string;
  description: string;
  character: number;   // character numeric index (0-based or arbitrary)
  role: 'survivor' | 'killer';
  image: string;       // relative path, e.g. /Game/UI/.../iconPerks_deadHard
  categories?: string[];
};

type ApiCharacter = {
  name: string;
  role: 'survivor' | 'killer';
  image: string;
  item?: string;       // killer power item path, e.g. "Item_Slasher_Beartrap"
  index?: number;
};

type ApiItem = {
  name: string;
  type: string;
  image: string;
};

type ApiAddon = {
  type: 'poweraddon' | 'itemaddon' | string;
  item_type: string | null;       // survivor item type, e.g. "medkit", "flashlight"
  parents: string[];              // for killer addons: ["Item_Slasher_Beartrap"]
  name: string;
  description: string;
  role: 'killer' | 'survivor';
  rarity: string;
  image: string;
};

type ApiOffering = {
  name: string;
  description: string;
  role: 'Survivor' | 'Killer' | 'All';
  rarity: string;
  image: string;
};

// ---------------------------------------------------------------------------
// Sync: Perks
// ---------------------------------------------------------------------------

type LocalPerk = {
  id: string;
  name: { en: string; ru: string };
  role: 'survivor' | 'killer';
  character: string;
  icon: string;
  description: { en: string; ru: string };
  roles: string[];
  synergy_groups: string[];
  tier: 'S' | 'A' | 'B' | 'C';
  deprecated?: boolean;
};

async function syncPerks(): Promise<void> {
  console.log('Syncing perks…');

  let apiEntries: [string, ApiPerk][];
  try {
    const data = await fetchJson<Record<string, ApiPerk>>(`${API_BASE}/perks`);
    apiEntries = Object.entries(data);
  } catch (e) {
    console.warn('  ⚠ Could not fetch perks:', e);
    return;
  }

  const existing = await readJson<LocalPerk>('perks.json');
  const existingById = new Map(existing.map(p => [p.id, p]));
  const seenIds = new Set<string>();
  const toAiCurate: { id: string; nameEn: string; descEn: string; role: 'survivor' | 'killer' }[] = [];
  const merged: LocalPerk[] = [];

  for (const [, api] of apiEntries) {
    // Use name-based slug for stable IDs across API changes
    const id = slug(api.name);
    if (!id) continue;
    seenIds.add(id);

    const prev = existingById.get(id);
    const isNew = !prev;
    const role = api.role === 'killer' ? 'killer' as const : 'survivor' as const;
    const iconLocal = `/icons/perks/${id}.png`;

    await downloadIcon(imageUrl(api.image), path.join(ICONS_DIR, 'perks', `${id}.png`));

    if (isNew && openRouterKey) {
      toAiCurate.push({ id, nameEn: api.name, descEn: api.description ?? '', role });
    }

    merged.push({
      id,
      name: { en: api.name, ru: prev?.name.ru ?? api.name },
      role,
      // Preserve existing character linkage; for new perks leave empty
      character: prev?.character ?? '',
      icon: iconLocal,
      description: { en: api.description ?? '', ru: prev?.description.ru ?? api.description ?? '' },
      roles: prev?.roles ?? [],
      synergy_groups: prev?.synergy_groups ?? [],
      tier: prev?.tier ?? 'B',
    });
  }

  // AI curation for new perks
  if (toAiCurate.length) {
    const curation = await aiCuratePerks(toAiCurate);
    for (const entry of merged) {
      const ai = curation.get(entry.id);
      if (!ai) continue;
      if (!entry.roles.length && ai.roles?.length) entry.roles = ai.roles;
      if (!entry.synergy_groups.length && ai.synergy_groups?.length) entry.synergy_groups = ai.synergy_groups;
      if (entry.tier === 'B' && ai.tier && ai.tier !== 'B') entry.tier = ai.tier;
      if (entry.name.ru === entry.name.en && ai.name_ru) entry.name.ru = ai.name_ru;
      if (entry.description.ru === entry.description.en && ai.description_ru) {
        entry.description.ru = ai.description_ru;
      }
    }
    console.log(`  ✓ AI curated ${curation.size}/${toAiCurate.length} new perk(s)`);
  }

  // Mark removed entries as deprecated
  for (const old of existing) {
    if (!seenIds.has(old.id) && !old.deprecated) {
      merged.push({ ...old, deprecated: true });
      console.log(`  deprecated: ${old.id}`);
    }
  }

  await writeJson('perks.json', merged);
  const active = merged.filter(p => !p.deprecated);
  const needsReview = active.filter(p => !p.roles.length || p.name.ru === p.name.en);
  console.log(`  ✓ ${active.length} perks (${merged.filter(p => p.deprecated).length} deprecated)`);
  if (needsReview.length) {
    console.log(`  ⚠ ${needsReview.length} need manual review: ${needsReview.slice(0, 5).map(p => p.id).join(', ')}${needsReview.length > 5 ? '…' : ''}`);
  }
}

// ---------------------------------------------------------------------------
// Sync: Killers
// ---------------------------------------------------------------------------

type LocalKiller = {
  id: string;
  name: { en: string; ru: string };
  power: string;
  icon: string;
  deprecated?: boolean;
};

async function syncKillers(): Promise<{ powerItemToSlug: Map<string, string> }> {
  console.log('Syncing killers…');

  const powerItemToSlug = new Map<string, string>();

  let apiEntries: [string, ApiCharacter][];
  try {
    const data = await fetchJson<Record<string, ApiCharacter>>(`${API_BASE}/characters`);
    apiEntries = Object.entries(data).filter(([, v]) => v.role === 'killer');
  } catch (e) {
    console.warn('  ⚠ Could not fetch killers:', e);
    return { powerItemToSlug };
  }

  const existing = await readJson<LocalKiller>('killers.json');
  const existingById = new Map(existing.map(k => [k.id, k]));
  const seenIds = new Set<string>();
  const merged: LocalKiller[] = [];
  const toTranslate: { id: string; nameEn: string }[] = [];

  for (const [, api] of apiEntries) {
    // Remove "The " prefix for cleaner IDs: "The Trapper" → "trapper"
    const id = slug(api.name.replace(/^The\s+/i, ''));
    if (!id) continue;
    seenIds.add(id);

    // Build power item → killer slug map for addon classification
    if (api.item) powerItemToSlug.set(api.item, id);

    const prev = existingById.get(id);
    const iconLocal = `/icons/killers/${id}.png`;

    await downloadIcon(imageUrl(api.image), path.join(ICONS_DIR, 'killers', `${id}.png`));

    if (!prev && openRouterKey) toTranslate.push({ id, nameEn: api.name });

    merged.push({
      id,
      name: { en: api.name, ru: prev?.name.ru ?? api.name },
      power: prev?.power ?? '',
      icon: iconLocal,
    });
  }

  if (toTranslate.length) {
    const translations = await aiTranslateNames(toTranslate, 'killer');
    for (const entry of merged) {
      const ru = translations.get(entry.id);
      if (ru && entry.name.ru === entry.name.en) entry.name.ru = ru;
    }
  }

  for (const old of existing) {
    if (!seenIds.has(old.id) && !old.deprecated) {
      merged.push({ ...old, deprecated: true });
      console.log(`  deprecated: ${old.id}`);
    }
  }

  await writeJson('killers.json', merged);
  console.log(`  ✓ ${merged.filter(k => !k.deprecated).length} killers`);
  return { powerItemToSlug };
}

// ---------------------------------------------------------------------------
// Sync: Survivors
// ---------------------------------------------------------------------------

type LocalSurvivor = {
  id: string;
  name: { en: string; ru: string };
  icon: string;
  deprecated?: boolean;
};

async function syncSurvivors(): Promise<void> {
  console.log('Syncing survivors…');

  let apiEntries: [string, ApiCharacter][];
  try {
    const data = await fetchJson<Record<string, ApiCharacter>>(`${API_BASE}/characters`);
    apiEntries = Object.entries(data).filter(([, v]) => v.role === 'survivor');
  } catch (e) {
    console.warn('  ⚠ Could not fetch survivors:', e);
    return;
  }

  const existing = await readJson<LocalSurvivor>('survivors.json');
  const existingById = new Map(existing.map(s => [s.id, s]));
  const seenIds = new Set<string>();
  const merged: LocalSurvivor[] = [];
  const toTranslate: { id: string; nameEn: string }[] = [];

  for (const [, api] of apiEntries) {
    const id = slug(api.name);
    if (!id) continue;
    seenIds.add(id);

    const prev = existingById.get(id);
    const iconLocal = `/icons/survivors/${id}.png`;

    await downloadIcon(imageUrl(api.image), path.join(ICONS_DIR, 'survivors', `${id}.png`));

    if (!prev && openRouterKey) toTranslate.push({ id, nameEn: api.name });

    merged.push({
      id,
      name: { en: api.name, ru: prev?.name.ru ?? api.name },
      icon: iconLocal,
    });
  }

  if (toTranslate.length) {
    const translations = await aiTranslateNames(toTranslate, 'survivor');
    for (const entry of merged) {
      const ru = translations.get(entry.id);
      if (ru && entry.name.ru === entry.name.en) entry.name.ru = ru;
    }
  }

  for (const old of existing) {
    if (!seenIds.has(old.id) && !old.deprecated) {
      merged.push({ ...old, deprecated: true });
      console.log(`  deprecated: ${old.id}`);
    }
  }

  await writeJson('survivors.json', merged);
  console.log(`  ✓ ${merged.filter(s => !s.deprecated).length} survivors`);
}

// ---------------------------------------------------------------------------
// Sync: Items
// ---------------------------------------------------------------------------

type LocalItem = {
  id: string;
  name: { en: string; ru: string };
  type: string;
  icon: string;
  deprecated?: boolean;
};

async function syncItems(): Promise<void> {
  console.log('Syncing items…');

  let apiEntries: [string, ApiItem][];
  try {
    const data = await fetchJson<Record<string, ApiItem>>(`${API_BASE}/items`);
    apiEntries = Object.entries(data);
  } catch (e) {
    console.warn('  ⚠ Could not fetch items:', e);
    return;
  }

  const existing = await readJson<LocalItem>('items.json');
  const existingById = new Map(existing.map(i => [i.id, i]));
  const seenIds = new Set<string>();
  const merged: LocalItem[] = [];
  const toTranslate: { id: string; nameEn: string }[] = [];

  for (const [, api] of apiEntries) {
    const id = slug(api.name);
    if (!id) continue;
    seenIds.add(id);

    const prev = existingById.get(id);
    const iconLocal = `/icons/items/${id}.png`;

    await downloadIcon(imageUrl(api.image), path.join(ICONS_DIR, 'items', `${id}.png`));

    if (!prev && openRouterKey) toTranslate.push({ id, nameEn: api.name });

    merged.push({
      id,
      name: { en: api.name, ru: prev?.name.ru ?? api.name },
      type: (api.type ?? 'misc').toLowerCase(),
      icon: iconLocal,
    });
  }

  if (toTranslate.length) {
    const translations = await aiTranslateNames(toTranslate, 'item');
    for (const entry of merged) {
      const ru = translations.get(entry.id);
      if (ru && entry.name.ru === entry.name.en) entry.name.ru = ru;
    }
  }

  for (const old of existing) {
    if (!seenIds.has(old.id) && !old.deprecated) {
      merged.push({ ...old, deprecated: true });
      console.log(`  deprecated: ${old.id}`);
    }
  }

  await writeJson('items.json', merged);
  console.log(`  ✓ ${merged.filter(i => !i.deprecated).length} items`);
}

// ---------------------------------------------------------------------------
// Sync: Addons
// ---------------------------------------------------------------------------

type LocalAddon = {
  id: string;
  name: { en: string; ru: string };
  scope: { type: 'killer' | 'item'; killerId?: string; itemType?: string };
  rarity: string;
  tags: string[];
  icon: string;
  deprecated?: boolean;
};

async function syncAddons(powerItemToSlug: Map<string, string>): Promise<void> {
  console.log('Syncing addons…');

  let apiEntries: [string, ApiAddon][];
  try {
    const data = await fetchJson<Record<string, ApiAddon>>(`${API_BASE}/addons`);
    apiEntries = Object.entries(data);
  } catch (e) {
    console.warn('  ⚠ Could not fetch addons:', e);
    return;
  }

  const existing = await readJson<LocalAddon>('addons.json');
  const existingById = new Map(existing.map(a => [a.id, a]));
  const seenIds = new Set<string>();
  const toAiCurate: { id: string; nameEn: string; descEn: string; rarity: string }[] = [];
  const merged: LocalAddon[] = [];

  for (const [, api] of apiEntries) {
    const id = slug(api.name);
    if (!id) continue;

    // Deduplicate by id — keep first occurrence
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const prev = existingById.get(id);
    const iconLocal = `/icons/addons/${id}.png`;

    await downloadIcon(imageUrl(api.image), path.join(ICONS_DIR, 'addons', `${id}.png`));

    // Determine scope from real API fields
    let scope: LocalAddon['scope'];
    if (prev?.scope) {
      scope = prev.scope;
    } else if (api.role === 'killer') {
      const parentPath = api.parents?.[0] ?? '';
      const killerId = powerItemToSlug.get(parentPath) ?? null;
      scope = killerId
        ? { type: 'killer', killerId }
        : { type: 'killer', killerId: 'unknown' };
    } else {
      scope = { type: 'item', itemType: api.item_type?.toLowerCase() || 'misc' };
    }

    if (!prev && openRouterKey) {
      toAiCurate.push({ id, nameEn: api.name, descEn: api.description ?? '', rarity: api.rarity ?? 'common' });
    }

    merged.push({
      id,
      name: { en: api.name, ru: prev?.name.ru ?? api.name },
      scope,
      rarity: (api.rarity ?? 'common').toLowerCase(),
      tags: prev?.tags ?? [],
      icon: iconLocal,
    });
  }

  // AI curation for new addons
  if (toAiCurate.length) {
    const curation = await aiCurateAddons(toAiCurate);
    for (const entry of merged) {
      const ai = curation.get(entry.id);
      if (!ai) continue;
      if (!entry.tags.length && ai.tags?.length) entry.tags = ai.tags;
      if (entry.name.ru === entry.name.en && ai.name_ru) entry.name.ru = ai.name_ru;
    }
    console.log(`  ✓ AI curated ${curation.size}/${toAiCurate.length} new addon(s)`);
  }

  // Mark removed entries as deprecated
  for (const old of existing) {
    if (!seenIds.has(old.id) && !old.deprecated) {
      merged.push({ ...old, deprecated: true });
      console.log(`  deprecated: ${old.id}`);
    }
  }

  await writeJson('addons.json', merged);
  const active = merged.filter(a => !a.deprecated);
  const killerAddons = active.filter(a => a.scope.type === 'killer');
  const unknownKiller = killerAddons.filter(a => a.scope.killerId === 'unknown');
  console.log(`  ✓ ${active.length} addons (${killerAddons.length} killer, ${active.length - killerAddons.length} item)`);
  if (unknownKiller.length) {
    console.log(`  ⚠ ${unknownKiller.length} killer addons with unknown killerId — check powerItemToSlug mapping`);
  }
}

// ---------------------------------------------------------------------------
// Sync: Offerings
// ---------------------------------------------------------------------------

type LocalOffering = {
  id: string;
  name: { en: string; ru: string };
  role: 'survivor' | 'killer' | 'any';
  rarity: string;
  tags: string[];
  icon: string;
  deprecated?: boolean;
};

async function syncOfferings(): Promise<void> {
  console.log('Syncing offerings…');

  let apiEntries: [string, ApiOffering][];
  try {
    const data = await fetchJson<Record<string, ApiOffering>>(`${API_BASE}/offerings`);
    apiEntries = Object.entries(data);
  } catch (e) {
    console.warn('  ⚠ Could not fetch offerings:', e);
    return;
  }

  const existing = await readJson<LocalOffering>('offerings.json');
  const existingById = new Map(existing.map(o => [o.id, o]));
  const seenIds = new Set<string>();
  const toAiCurate: { id: string; nameEn: string; descEn: string; rarity: string }[] = [];
  const merged: LocalOffering[] = [];

  for (const [, api] of apiEntries) {
    const id = slug(api.name);
    if (!id) continue;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const prev = existingById.get(id);
    const iconLocal = `/icons/offerings/${id}.png`;

    await downloadIcon(imageUrl(api.image), path.join(ICONS_DIR, 'offerings', `${id}.png`));

    const role: LocalOffering['role'] =
      api.role === 'Killer' ? 'killer' : api.role === 'Survivor' ? 'survivor' : 'any';

    if (!prev && openRouterKey) {
      toAiCurate.push({ id, nameEn: api.name, descEn: api.description ?? '', rarity: api.rarity ?? 'common' });
    }

    merged.push({
      id,
      name: { en: api.name, ru: prev?.name.ru ?? api.name },
      role,
      rarity: (api.rarity ?? 'common').toLowerCase(),
      tags: prev?.tags ?? [],
      icon: iconLocal,
    });
  }

  if (toAiCurate.length) {
    const curation = await aiCurateOfferings(toAiCurate);
    for (const entry of merged) {
      const ai = curation.get(entry.id);
      if (!ai) continue;
      if (!entry.tags.length && ai.tags?.length) entry.tags = ai.tags;
      if (entry.name.ru === entry.name.en && ai.name_ru) entry.name.ru = ai.name_ru;
    }
    console.log(`  ✓ AI curated ${curation.size}/${toAiCurate.length} new offering(s)`);
  }

  for (const old of existing) {
    if (!seenIds.has(old.id) && !old.deprecated) {
      merged.push({ ...old, deprecated: true });
      console.log(`  deprecated: ${old.id}`);
    }
  }

  await writeJson('offerings.json', merged);
  console.log(`  ✓ ${merged.filter(o => !o.deprecated).length} offerings`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('DBD data sync starting…\n');

  const env = await loadEnv();
  openRouterKey = env.OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY ?? '';
  openRouterModel = env.OPENROUTER_MODEL ?? process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-v3-0324:free';

  if (openRouterKey) {
    console.log(`AI curation enabled (model: ${openRouterModel})\n`);
  } else {
    console.log('ℹ No OPENROUTER_API_KEY — AI curation skipped.\n');
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  for (const sub of ['perks', 'killers', 'survivors', 'items', 'addons', 'offerings']) {
    await fs.mkdir(path.join(ICONS_DIR, sub), { recursive: true });
  }

  await syncPerks();
  // syncKillers returns the powerItem→slug map needed by syncAddons
  const { powerItemToSlug } = await syncKillers();
  await syncSurvivors();
  await syncItems();
  await syncAddons(powerItemToSlug);
  await syncOfferings();

  console.log('\nDone.');
  if (!openRouterKey) {
    console.log('Tip: set OPENROUTER_API_KEY in .env.local to auto-curate new entries.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
