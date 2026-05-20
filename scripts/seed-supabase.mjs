/**
 * Seed Supabase content tables from local JSON.
 * Idempotent: uses upsert on primary key (id).
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (NOT the anon key — needs to bypass RLS for writes)
 *
 * Run: node scripts/seed-supabase.mjs [perks|killers|survivors|items|addons|offerings|all]
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local manually (no dotenv dependency)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function loadEnv() {
  try {
    const txt = await fs.readFile(path.join(ROOT, '.env.local'), 'utf-8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* file may not exist on CI — fall through to existing env */ }
}

await loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env / .env.local');
  process.exit(1);
}

const REST = `${URL}/rest/v1`;
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=minimal',
};

/** Upsert rows into a PostgREST table. Batches by 200 to stay under request size. */
async function upsertBatch(table, rows) {
  if (!rows.length) return;
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const res = await fetch(`${REST}/${table}?on_conflict=id`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`${table} upsert ${res.status}: ${txt.slice(0, 300)}`);
    }
    process.stdout.write(`  ${table}: ${Math.min(i + BATCH, rows.length)}/${rows.length}\r`);
  }
  console.log(`  ✓ ${table}: ${rows.length} rows upserted`.padEnd(60));
}

/* ── Mappers: JSON shape → DB row shape ── */

const mappers = {
  perks: (p) => ({
    id:             p.id,
    name:           p.name ?? {},
    role:           p.role,
    character:      p.character ?? null,
    character_slug: p.character_slug ?? null,
    icon:           p.icon ?? null,
    description:    p.description ?? {},
    tunables:       p.tunables ?? null,
    roles:          p.roles ?? [],
    synergy_groups: p.synergy_groups ?? [],
    tier:           p.tier ?? null,
    deprecated:     p.deprecated ?? false,
  }),
  killers: (k) => ({
    id:    k.id,
    name:  k.name ?? {},
    power: k.power ?? null,
    icon:  k.icon ?? null,
  }),
  survivors: (s) => ({
    id:   s.id,
    name: s.name ?? {},
    icon: s.icon ?? null,
  }),
  items: (it) => ({
    id:          it.id,
    type:        it.type,
    name:        it.name ?? {},
    description: it.description ?? {},
    rarity:      it.rarity ?? null,
    icon:        it.icon ?? null,
    available_by_default: it.available_by_default ?? true,
  }),
  addons: (a) => ({
    id:          a.id,
    name:        a.name ?? {},
    description: a.description ?? {},
    scope:       a.scope,
    rarity:      a.rarity ?? null,
    tags:        a.tags ?? [],
    icon:        a.icon ?? null,
    available_by_default: a.available_by_default ?? true,
  }),
  offerings: (o) => ({
    id:          o.id,
    name:        o.name ?? {},
    description: o.description ?? {},
    role:        o.role,
    rarity:      o.rarity ?? null,
    tags:        o.tags ?? [],
    icon:        o.icon ?? null,
    available_by_default: o.available_by_default ?? true,
  }),
  'status-effects': (s) => ({
    id:          s.id,
    source_key:  s.source_key ?? null,
    name:        s.name ?? {},
    description: s.description ?? {},
    category:    s.category ?? 'status',
    icon:        s.icon ?? null,
  }),
};

const TABLE_NAME_BY_FILE = {
  'status-effects': 'status_effects',
};

async function seedTable(table) {
  const file = path.join(ROOT, 'data', `${table}.json`);
  const raw = JSON.parse(await fs.readFile(file, 'utf-8'));

  // Dedupe by id (last-wins) — some legacy data files have duplicates
  const byId = new Map();
  for (const row of raw) byId.set(row.id, row);
  if (byId.size !== raw.length) {
    console.log(`  ⚠ ${raw.length - byId.size} duplicate id(s) collapsed`);
  }

  const rows = [...byId.values()].map(mappers[table]);
  const tableName = TABLE_NAME_BY_FILE[table] ?? table;
  await upsertBatch(tableName, rows);
}

async function main() {
  const arg = process.argv[2] ?? 'all';
  const all = ['killers', 'survivors', 'items', 'offerings', 'perks', 'addons', 'status-effects'];
  const tables = arg === 'all' ? all : [arg];
  for (const t of tables) {
    if (!mappers[t]) { console.error(`Unknown table: ${t}`); process.exit(1); }
    console.log(`\n[${t}]`);
    await seedTable(t);
  }
  console.log('\nDone.');
}

main().catch((e) => { console.error('\n', e); process.exit(1); });
