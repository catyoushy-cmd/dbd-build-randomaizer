import { fetchAllContent, fetchStatusEffects } from '@/lib/data/content-db';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { publicJson, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET() {
  const [content, statusEffects, perkOv, itemOv, addonOv, offeringOv] = await Promise.all([
    fetchAllContent(),
    fetchStatusEffects(),
    fetchOverrides('perk'),
    fetchOverrides('item'),
    fetchOverrides('addon'),
    fetchOverrides('offering'),
  ]);

  return publicJson({
    version: 'v1',
    generated_at: new Date().toISOString(),
    counts: {
      perks:     content.perks.length,
      killers:   content.killers.length,
      survivors: content.survivors.length,
      items:     content.items.length,
      addons:    content.addons.length,
      offerings: content.offerings.length,
      status_effects: statusEffects.length,
    },
    perks:           applyOverrides(content.perks,     perkOv),
    killers:         content.killers,
    survivors:       content.survivors,
    items:           applyOverrides(content.items,     itemOv),
    addons:          applyOverrides(content.addons,    addonOv),
    offerings:       applyOverrides(content.offerings, offeringOv),
    status_effects:  statusEffects,
  });
}

export const OPTIONS = corsPreflight;
