import { fetchAllContent } from '@/lib/data/content-db';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { publicJson, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET() {
  const [content, perkOv, itemOv, addonOv, offeringOv] = await Promise.all([
    fetchAllContent(),
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
    },
    perks:     applyOverrides(content.perks,     perkOv),
    killers:   content.killers,
    survivors: content.survivors,
    items:     applyOverrides(content.items,     itemOv),
    addons:    applyOverrides(content.addons,    addonOv),
    offerings: applyOverrides(content.offerings, offeringOv),
  });
}

export const OPTIONS = corsPreflight;
