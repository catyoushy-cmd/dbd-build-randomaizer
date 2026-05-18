/**
 * Translate Dead by Daylight addon names/descriptions and offering descriptions to Russian.
 * Run: node scripts/translate-dbd.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash:free';
const BATCH = 20; // items per AI call
const DELAY = 1000;

if (!OPENROUTER_API_KEY) {
  console.error('Missing OPENROUTER_API_KEY');
  process.exit(1);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function translateBatch(items) {
  // items: [{ id, nameEn, descEn }]
  const prompt = `Translate the following Dead by Daylight game items from English to Russian.
Return ONLY a valid JSON array with the same order and count. Each element: { "id": "...", "nameRu": "...", "descRu": "..." }.
Use natural, game-appropriate Russian. Keep proper nouns like killer/perk names in context.
Strip any HTML tags from descriptions in the translation.

Items to translate:
${JSON.stringify(items.map(i => ({ id: i.id, nameEn: i.nameEn, descEn: i.descEn })), null, 2)}`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data.choices[0]?.message?.content || '';

  // Extract JSON array
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No JSON array in response: ${content.substring(0, 200)}`);
  return JSON.parse(match[0]);
}

async function translateField(items) {
  // items: [{ id, descEn }] — description only
  const prompt = `Translate the following Dead by Daylight offering descriptions from English to Russian.
Return ONLY a valid JSON array with the same order and count. Each element: { "id": "...", "descRu": "..." }.
Use natural, game-appropriate Russian. Strip any HTML tags.

Items to translate:
${JSON.stringify(items.map(i => ({ id: i.id, descEn: i.descEn })), null, 2)}`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data.choices[0]?.message?.content || '';

  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No JSON array in response: ${content.substring(0, 200)}`);
  return JSON.parse(match[0]);
}

async function processAddons() {
  console.log('\n[addons] Loading…');
  const addons = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'addons.json'), 'utf-8'));
  const toTranslate = addons.filter(a => a.name?.ru === a.name?.en);
  console.log(`  ${toTranslate.length} addons need translation`);

  const idMap = new Map();

  for (let i = 0; i < toTranslate.length; i += BATCH) {
    const batch = toTranslate.slice(i, i + BATCH);
    const input = batch.map(a => ({
      id: a.id,
      nameEn: a.name.en,
      descEn: stripHtml(a.description?.en || ''),
    }));

    let attempts = 0;
    while (attempts < 3) {
      try {
        const results = await translateBatch(input);
        for (const r of results) {
          if (r.id && r.nameRu) idMap.set(r.id, { nameRu: r.nameRu, descRu: r.descRu || '' });
        }
        console.log(`  ✓ ${Math.min(i + BATCH, toTranslate.length)}/${toTranslate.length}`);
        break;
      } catch (e) {
        attempts++;
        console.warn(`  ⚠ batch ${i} attempt ${attempts} failed: ${e.message}`);
        await sleep(2000 * attempts);
      }
    }
    await sleep(DELAY);
  }

  // Apply translations
  let updated = 0;
  for (const addon of addons) {
    const t = idMap.get(addon.id);
    if (t) {
      addon.name.ru = t.nameRu;
      if (addon.description) addon.description.ru = t.descRu || addon.description.en;
      updated++;
    }
  }

  await fs.writeFile(path.join(DATA_DIR, 'addons.json'), JSON.stringify(addons, null, 2), 'utf-8');
  console.log(`  Saved ${updated} translated addons`);
}

async function processOfferings() {
  console.log('\n[offerings] Loading…');
  const offerings = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'offerings.json'), 'utf-8'));
  const toTranslate = offerings.filter(o => o.description?.ru === o.description?.en && o.description?.en);
  console.log(`  ${toTranslate.length} offerings need description translation`);

  const idMap = new Map();

  for (let i = 0; i < toTranslate.length; i += BATCH) {
    const batch = toTranslate.slice(i, i + BATCH);
    const input = batch.map(o => ({
      id: o.id,
      descEn: stripHtml(o.description?.en || ''),
    }));

    let attempts = 0;
    while (attempts < 3) {
      try {
        const results = await translateField(input);
        for (const r of results) {
          if (r.id && r.descRu) idMap.set(r.id, r.descRu);
        }
        console.log(`  ✓ ${Math.min(i + BATCH, toTranslate.length)}/${toTranslate.length}`);
        break;
      } catch (e) {
        attempts++;
        console.warn(`  ⚠ batch ${i} attempt ${attempts} failed: ${e.message}`);
        await sleep(2000 * attempts);
      }
    }
    await sleep(DELAY);
  }

  // Apply translations
  let updated = 0;
  for (const offering of offerings) {
    const t = idMap.get(offering.id);
    if (t && offering.description) {
      offering.description.ru = t;
      updated++;
    }
  }

  await fs.writeFile(path.join(DATA_DIR, 'offerings.json'), JSON.stringify(offerings, null, 2), 'utf-8');
  console.log(`  Saved ${updated} translated offerings`);
}

async function main() {
  console.log(`Using model: ${MODEL}`);
  await processAddons();
  await processOfferings();
  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
