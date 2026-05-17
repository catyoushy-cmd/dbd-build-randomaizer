/**
 * Sync Dead by Daylight data from dbd.tricky.lol API.
 * Run: npm run sync:dbd
 *
 * Merge rules:
 *   - Manual curation fields (roles, synergy_groups, tier, tags) are preserved
 *   - New entities are added with empty curation fields
 *   - Removed entities are marked deprecated:true, never physically deleted
 *   - Icons are downloaded to public/icons/{perks,killers,items,addons,offerings}/
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const ICONS_DIR = path.join(ROOT, 'public', 'icons');

const API_BASE = 'https://dbd.tricky.lol/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

async function downloadIcon(url: string, destPath: string): Promise<void> {
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

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ---------------------------------------------------------------------------
// API response types (dbd.tricky.lol)
// ---------------------------------------------------------------------------

type ApiPerk = {
  id: string;
  name: string;
  description: string;
  character: string;
  role: 'Survivor' | 'Killer';
  image: string; // URL
};

type ApiCharacter = {
  id: string;
  name: string;
  role: 'Survivor' | 'Killer';
  image: string;
  power?: string;
};

type ApiItem = {
  id: string;
  name: string;
  type: string;
  image: string;
};

type ApiAddon = {
  id: string;
  name: string;
  description: string;
  parentItem: string; // item type or killer id
  rarity: string;
  image: string;
};

type ApiOffering = {
  id: string;
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

  let apiPerks: ApiPerk[];
  try {
    const data = await fetchJson<Record<string, ApiPerk>>(`${API_BASE}/perks`);
    apiPerks = Object.values(data);
  } catch (e) {
    console.warn('  ⚠ Could not fetch perks:', e);
    return;
  }

  const existing = await readJson<LocalPerk>('perks.json');
  const existingById = new Map(existing.map(p => [p.id, p]));
  const seenIds = new Set<string>();

  const merged: LocalPerk[] = [];

  for (const api of apiPerks) {
    const id = slug(api.id || api.name);
    seenIds.add(id);

    const prev = existingById.get(id);
    const iconLocal = `/icons/perks/${id}.png`;

    if (api.image) {
      await downloadIcon(api.image, path.join(ICONS_DIR, 'perks', `${id}.png`));
    }

    merged.push({
      id,
      name: { en: api.name, ru: prev?.name.ru ?? api.name },
      role: api.role === 'Killer' ? 'killer' : 'survivor',
      character: slug(api.character ?? ''),
      icon: iconLocal,
      description: { en: api.description ?? '', ru: prev?.description.ru ?? api.description ?? '' },
      // Preserve manual curation fields
      roles: prev?.roles ?? [],
      synergy_groups: prev?.synergy_groups ?? [],
      tier: prev?.tier ?? 'B',
    });
  }

  // Mark removed entries as deprecated
  for (const old of existing) {
    if (!seenIds.has(old.id) && !old.deprecated) {
      merged.push({ ...old, deprecated: true });
      console.log(`  deprecated perk: ${old.id}`);
    }
  }

  await writeJson('perks.json', merged);
  console.log(`  ✓ ${merged.filter(p => !p.deprecated).length} perks (${merged.filter(p => p.deprecated).length} deprecated)`);
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

async function syncKillers(): Promise<void> {
  console.log('Syncing killers…');

  let apiKillers: ApiCharacter[];
  try {
    const data = await fetchJson<Record<string, ApiCharacter>>(`${API_BASE}/characters`);
    apiKillers = Object.values(data).filter(c => c.role === 'Killer');
  } catch (e) {
    console.warn('  ⚠ Could not fetch killers:', e);
    return;
  }

  const existing = await readJson<LocalKiller>('killers.json');
  const existingById = new Map(existing.map(k => [k.id, k]));
  const seenIds = new Set<string>();
  const merged: LocalKiller[] = [];

  for (const api of apiKillers) {
    const id = slug(api.id || api.name.replace(/^The /, ''));
    seenIds.add(id);

    const prev = existingById.get(id);
    const iconLocal = `/icons/killers/${id}.png`;

    if (api.image) {
      await downloadIcon(api.image, path.join(ICONS_DIR, 'killers', `${id}.png`));
    }

    merged.push({
      id,
      name: { en: api.name, ru: prev?.name.ru ?? api.name },
      power: prev?.power ?? api.power ?? '',
      icon: iconLocal,
    });
  }

  for (const old of existing) {
    if (!seenIds.has(old.id) && !old.deprecated) {
      merged.push({ ...old, deprecated: true });
      console.log(`  deprecated killer: ${old.id}`);
    }
  }

  await writeJson('killers.json', merged);
  console.log(`  ✓ ${merged.filter(k => !k.deprecated).length} killers`);
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

  let apiItems: ApiItem[];
  try {
    const data = await fetchJson<Record<string, ApiItem>>(`${API_BASE}/items`);
    apiItems = Object.values(data);
  } catch (e) {
    console.warn('  ⚠ Could not fetch items:', e);
    return;
  }

  const existing = await readJson<LocalItem>('items.json');
  const existingById = new Map(existing.map(i => [i.id, i]));
  const seenIds = new Set<string>();
  const merged: LocalItem[] = [];

  for (const api of apiItems) {
    const id = slug(api.id || api.name);
    seenIds.add(id);
    const prev = existingById.get(id);
    const iconLocal = `/icons/items/${id}.png`;

    if (api.image) {
      await downloadIcon(api.image, path.join(ICONS_DIR, 'items', `${id}.png`));
    }

    merged.push({
      id,
      name: { en: api.name, ru: prev?.name.ru ?? api.name },
      type: (api.type ?? 'misc').toLowerCase(),
      icon: iconLocal,
    });
  }

  for (const old of existing) {
    if (!seenIds.has(old.id) && !old.deprecated) {
      merged.push({ ...old, deprecated: true });
      console.log(`  deprecated item: ${old.id}`);
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

async function syncAddons(): Promise<void> {
  console.log('Syncing addons…');

  let apiAddons: ApiAddon[];
  try {
    const data = await fetchJson<Record<string, ApiAddon>>(`${API_BASE}/addons`);
    apiAddons = Object.values(data);
  } catch (e) {
    console.warn('  ⚠ Could not fetch addons:', e);
    return;
  }

  const killers = await readJson<LocalKiller>('killers.json');
  const killerIds = new Set(killers.map(k => k.id));

  const existing = await readJson<LocalAddon>('addons.json');
  const existingById = new Map(existing.map(a => [a.id, a]));
  const seenIds = new Set<string>();
  const merged: LocalAddon[] = [];

  for (const api of apiAddons) {
    const id = slug(api.id || api.name);
    seenIds.add(id);
    const prev = existingById.get(id);
    const iconLocal = `/icons/addons/${id}.png`;

    if (api.image) {
      await downloadIcon(api.image, path.join(ICONS_DIR, 'addons', `${id}.png`));
    }

    const parentSlug = slug(api.parentItem ?? '');
    const isKillerAddon = killerIds.has(parentSlug);

    const scope: LocalAddon['scope'] = isKillerAddon
      ? { type: 'killer', killerId: parentSlug }
      : { type: 'item', itemType: parentSlug || 'misc' };

    merged.push({
      id,
      name: { en: api.name, ru: prev?.name.ru ?? api.name },
      scope: prev?.scope ?? scope,
      rarity: (api.rarity ?? 'common').toLowerCase(),
      tags: prev?.tags ?? [],
      icon: iconLocal,
    });
  }

  for (const old of existing) {
    if (!seenIds.has(old.id) && !old.deprecated) {
      merged.push({ ...old, deprecated: true });
      console.log(`  deprecated addon: ${old.id}`);
    }
  }

  await writeJson('addons.json', merged);
  console.log(`  ✓ ${merged.filter(a => !a.deprecated).length} addons`);
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

  let apiOfferings: ApiOffering[];
  try {
    const data = await fetchJson<Record<string, ApiOffering>>(`${API_BASE}/offerings`);
    apiOfferings = Object.values(data);
  } catch (e) {
    console.warn('  ⚠ Could not fetch offerings:', e);
    return;
  }

  const existing = await readJson<LocalOffering>('offerings.json');
  const existingById = new Map(existing.map(o => [o.id, o]));
  const seenIds = new Set<string>();
  const merged: LocalOffering[] = [];

  for (const api of apiOfferings) {
    const id = slug(api.id || api.name);
    seenIds.add(id);
    const prev = existingById.get(id);
    const iconLocal = `/icons/offerings/${id}.png`;

    if (api.image) {
      await downloadIcon(api.image, path.join(ICONS_DIR, 'offerings', `${id}.png`));
    }

    const role: LocalOffering['role'] =
      api.role === 'Killer' ? 'killer' : api.role === 'Survivor' ? 'survivor' : 'any';

    merged.push({
      id,
      name: { en: api.name, ru: prev?.name.ru ?? api.name },
      role,
      rarity: (api.rarity ?? 'common').toLowerCase(),
      tags: prev?.tags ?? [],
      icon: iconLocal,
    });
  }

  for (const old of existing) {
    if (!seenIds.has(old.id) && !old.deprecated) {
      merged.push({ ...old, deprecated: true });
      console.log(`  deprecated offering: ${old.id}`);
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

  await fs.mkdir(DATA_DIR, { recursive: true });
  for (const sub of ['perks', 'killers', 'items', 'addons', 'offerings']) {
    await fs.mkdir(path.join(ICONS_DIR, sub), { recursive: true });
  }

  await syncPerks();
  await syncKillers();
  await syncItems();
  await syncAddons();
  await syncOfferings();

  console.log('\nDone. Review manual curation fields (roles/synergy_groups/tier/tags) for new entries.');
}

main().catch(err => { console.error(err); process.exit(1); });
