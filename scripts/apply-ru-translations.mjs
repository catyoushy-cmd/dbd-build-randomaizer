/**
 * Fetch Russian text from dbd.tricky.lol API and update local data files.
 * Run: node scripts/apply-ru-translations.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const API_BASE = 'https://dbd.tricky.lol/api';
const UA = 'DBD-Build-Randomizer/1.0';

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function slug(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function fetchRu(endpoint) {
  const res = await fetch(`${API_BASE}/${endpoint}?locale=ru`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${endpoint}`);
  return res.json();
}

async function fetchEn(endpoint) {
  const res = await fetch(`${API_BASE}/${endpoint}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${endpoint}`);
  return res.json();
}

async function updateAddons() {
  console.log('\n[addons]');
  const [ruData, enData] = await Promise.all([fetchRu('addons'), fetchEn('addons')]);

  const local = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'addons.json'), 'utf-8'));

  // Build slug → {nameRu, descRu} map from API
  const ruMap = new Map();
  for (const [, api] of Object.entries(ruData)) {
    const id = slug(enData[Object.keys(enData).find(k => k === Object.keys(ruData).find(rk => ruData[rk] === api))]?.name || api.name);
    // Use name-based slug from the english API
  }

  // Better approach: match by iterating english and russian in tandem (same keys)
  const enEntries = Object.entries(enData);
  const ruEntries = Object.entries(ruData);

  // They should have the same keys
  for (const [key, enApi] of enEntries) {
    const ruApi = ruData[key];
    if (!ruApi) continue;
    const id = slug(enApi.name);
    ruMap.set(id, {
      nameRu: ruApi.name || enApi.name,
      descRu: stripHtml(ruApi.description || enApi.description || ''),
    });
  }

  let updated = 0;
  for (const addon of local) {
    const t = ruMap.get(addon.id);
    if (t) {
      addon.name.ru = t.nameRu;
      if (addon.description) addon.description.ru = t.descRu;
      else addon.description = { en: addon.description?.en || '', ru: t.descRu };
      updated++;
    }
  }

  await fs.writeFile(path.join(DATA_DIR, 'addons.json'), JSON.stringify(local, null, 2), 'utf-8');
  console.log(`  Updated ${updated}/${local.length} addons`);
}

async function updateOfferings() {
  console.log('\n[offerings]');
  const [ruData, enData] = await Promise.all([fetchRu('offerings'), fetchEn('offerings')]);

  const local = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'offerings.json'), 'utf-8'));

  const ruMap = new Map();
  for (const [key, enApi] of Object.entries(enData)) {
    const ruApi = ruData[key];
    if (!ruApi) continue;
    const id = slug(enApi.name);
    ruMap.set(id, {
      nameRu: ruApi.name || enApi.name,
      descRu: stripHtml(ruApi.description || enApi.description || ''),
    });
  }

  let updated = 0;
  for (const offering of local) {
    const t = ruMap.get(offering.id);
    if (t) {
      offering.name.ru = t.nameRu;
      if (offering.description) offering.description.ru = t.descRu;
      updated++;
    }
  }

  await fs.writeFile(path.join(DATA_DIR, 'offerings.json'), JSON.stringify(local, null, 2), 'utf-8');
  console.log(`  Updated ${updated}/${local.length} offerings`);
}

async function updateItems() {
  console.log('\n[items]');
  const [ruData, enData] = await Promise.all([fetchRu('items'), fetchEn('items')]);

  const local = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'items.json'), 'utf-8'));

  const ruMap = new Map();
  for (const [key, enApi] of Object.entries(enData)) {
    const ruApi = ruData[key];
    if (!ruApi) continue;
    const id = slug(enApi.name);
    ruMap.set(id, {
      nameRu: ruApi.name || enApi.name,
      descRu: stripHtml(ruApi.description || enApi.description || ''),
    });
  }

  let updated = 0;
  for (const item of local) {
    const t = ruMap.get(item.id);
    if (t) {
      item.name.ru = t.nameRu;
      if (item.description) item.description.ru = t.descRu;
      else item.description = { en: item.description?.en || '', ru: t.descRu };
      updated++;
    }
  }

  await fs.writeFile(path.join(DATA_DIR, 'items.json'), JSON.stringify(local, null, 2), 'utf-8');
  console.log(`  Updated ${updated}/${local.length} items`);
}

async function updatePerks() {
  console.log('\n[perks]');
  const [ruData, enData] = await Promise.all([fetchRu('perks'), fetchEn('perks')]);

  const local = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'perks.json'), 'utf-8'));

  const ruMap = new Map();
  for (const [key, enApi] of Object.entries(enData)) {
    const ruApi = ruData[key];
    if (!ruApi) continue;
    const id = slug(enApi.name);
    ruMap.set(id, {
      nameRu: ruApi.name || enApi.name,
      descRu: stripHtml(ruApi.description || enApi.description || ''),
    });
  }

  let updated = 0, skipped = 0;
  for (const perk of local) {
    const t = ruMap.get(perk.id);
    if (t) {
      perk.name.ru = t.nameRu;
      perk.description.ru = t.descRu;
      updated++;
    } else {
      skipped++;
    }
  }

  await fs.writeFile(path.join(DATA_DIR, 'perks.json'), JSON.stringify(local, null, 2), 'utf-8');
  console.log(`  Updated ${updated}/${local.length} perks, ${skipped} skipped (no API match)`);
}

async function main() {
  console.log('Applying Russian translations from dbd.tricky.lol API…');
  await updateAddons();
  await updateOfferings();
  await updateItems();
  await updatePerks();
  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
