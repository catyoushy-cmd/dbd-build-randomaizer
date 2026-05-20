/**
 * Server-side content loaders that read perks / killers / survivors / items /
 * addons / offerings from Supabase. On any error (RLS, network, project
 * sleeping during build, …) each loader falls back to the bundled JSON, so
 * static builds keep working and the site never breaks because of the DB.
 *
 * Convention: same shape as lib/data/types.ts. Snake_case columns from the DB
 * are mapped back to the camelCase / nested-object shape the UI expects.
 */

import { createClient } from '@/lib/supabase/server';
import PERKS_JSON      from '@/data/perks.json';
import KILLERS_JSON    from '@/data/killers.json';
import SURVIVORS_JSON  from '@/data/survivors.json';
import ITEMS_JSON      from '@/data/items.json';
import ADDONS_JSON     from '@/data/addons.json';
import OFFERINGS_JSON  from '@/data/offerings.json';
import STATUS_EFFECTS_JSON from '@/data/status-effects.json';
import type {
  Perk, Killer, Survivor, Item, Addon, Offering, StatusEffect,
} from '@/lib/data/types';

/* ───────── Perks ───────── */

export async function fetchPerks(): Promise<Perk[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('perks')
      .select('id,name,role,character,character_slug,icon,description,tunables,roles,synergy_groups,tier,deprecated')
      .order('id');
    if (error || !data?.length) {
      if (error) console.warn('[content-db] perks fallback:', error.message);
      return PERKS_JSON as Perk[];
    }
    return data.map((r) => ({
      id:             r.id,
      name:           r.name as Perk['name'],
      role:           r.role,
      character:      r.character ?? null,
      character_slug: r.character_slug ?? null,
      icon:           r.icon ?? '',
      description:    r.description as Perk['description'],
      tunables:       r.tunables ?? undefined,
      roles:          r.roles ?? [],
      synergy_groups: r.synergy_groups ?? [],
      tier:           r.tier ?? 'C',
      deprecated:     r.deprecated ?? false,
    })) as Perk[];
  } catch (e) {
    console.warn('[content-db] perks fallback (exception):', (e as Error).message);
    return PERKS_JSON as Perk[];
  }
}

/* ───────── Killers ───────── */

export async function fetchKillers(): Promise<Killer[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('killers')
      .select('id,name,power,icon')
      .order('id');
    if (error || !data?.length) return KILLERS_JSON as Killer[];
    return data.map((r) => ({
      id:    r.id,
      name:  r.name as Killer['name'],
      power: r.power ?? '',
      icon:  r.icon ?? '',
    }));
  } catch {
    return KILLERS_JSON as Killer[];
  }
}

/* ───────── Survivors ───────── */

export async function fetchSurvivors(): Promise<Survivor[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('survivors')
      .select('id,name,icon')
      .order('id');
    if (error || !data?.length) return SURVIVORS_JSON as Survivor[];
    return data.map((r) => ({
      id:   r.id,
      name: r.name as Survivor['name'],
      icon: r.icon ?? '',
    }));
  } catch {
    return SURVIVORS_JSON as Survivor[];
  }
}

/* ───────── Items ───────── */

export async function fetchItems(): Promise<Item[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('items')
      .select('id,type,name,description,rarity,icon,available_by_default')
      .order('id');
    if (error || !data?.length) return ITEMS_JSON as Item[];
    return data.map((r) => ({
      id:          r.id,
      type:        r.type as Item['type'],
      name:        r.name as Item['name'],
      description: r.description as Item['description'],
      rarity:      (r.rarity ?? 'common') as Item['rarity'],
      icon:        r.icon ?? '',
      available_by_default: r.available_by_default ?? true,
    }));
  } catch {
    return ITEMS_JSON as Item[];
  }
}

/* ───────── Addons ───────── */

export async function fetchAddons(): Promise<Addon[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('addons')
      .select('id,name,description,scope,rarity,tags,icon,available_by_default')
      .order('id');
    if (error || !data?.length) return ADDONS_JSON as Addon[];
    return data.map((r) => ({
      id:          r.id,
      name:        r.name as Addon['name'],
      description: r.description as Addon['description'],
      scope:       r.scope as Addon['scope'],
      rarity:      (r.rarity ?? 'common') as Addon['rarity'],
      tags:        (r.tags ?? []) as Addon['tags'],
      icon:        r.icon ?? '',
      available_by_default: r.available_by_default ?? true,
    }));
  } catch {
    return ADDONS_JSON as Addon[];
  }
}

/* ───────── Offerings ───────── */

export async function fetchOfferings(): Promise<Offering[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('offerings')
      .select('id,name,description,role,rarity,tags,icon,available_by_default')
      .order('id');
    if (error || !data?.length) return OFFERINGS_JSON as Offering[];
    return data.map((r) => ({
      id:          r.id,
      name:        r.name as Offering['name'],
      description: r.description as Offering['description'],
      role:        r.role as Offering['role'],
      rarity:      r.rarity ?? 'common',
      tags:        (r.tags ?? []) as Offering['tags'],
      icon:        r.icon ?? '',
      available_by_default: r.available_by_default ?? true,
    }));
  } catch {
    return OFFERINGS_JSON as Offering[];
  }
}

/* ───────── Status effects ───────── */

export async function fetchStatusEffects(): Promise<StatusEffect[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('status_effects')
      .select('id,source_key,name,description,category,icon')
      .order('category')
      .order('id');
    if (error || !data?.length) return STATUS_EFFECTS_JSON as StatusEffect[];
    return data.map((r) => ({
      id:          r.id,
      source_key:  r.source_key ?? null,
      name:        r.name as StatusEffect['name'],
      description: r.description as StatusEffect['description'],
      category:    (r.category ?? 'status') as StatusEffect['category'],
      icon:        r.icon ?? null,
    }));
  } catch {
    return STATUS_EFFECTS_JSON as StatusEffect[];
  }
}

/**
 * Convenience: fetch everything in parallel.
 * Useful for pages that need the full pool (e.g. /roll, /api/v1/all).
 */
export async function fetchAllContent() {
  const [perks, killers, survivors, items, addons, offerings] = await Promise.all([
    fetchPerks(),
    fetchKillers(),
    fetchSurvivors(),
    fetchItems(),
    fetchAddons(),
    fetchOfferings(),
  ]);
  return { perks, killers, survivors, items, addons, offerings };
}
