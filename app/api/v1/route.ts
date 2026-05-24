import { publicJson, corsPreflight } from '@/lib/api/response';

export const revalidate = 3600;

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return publicJson({
    name: 'DBD Build Randomizer Public API',
    version: 'v1',
    docs: `${origin}/api/docs`,
    endpoints: {
      perks:     `${origin}/api/v1/perks`,
      perk:      `${origin}/api/v1/perks/{id}`,
      killers:   `${origin}/api/v1/killers`,
      killer:    `${origin}/api/v1/killers/{id}`,
      survivors: `${origin}/api/v1/survivors`,
      survivor:  `${origin}/api/v1/survivors/{id}`,
      items:     `${origin}/api/v1/items`,
      item:      `${origin}/api/v1/items/{id}`,
      addons:    `${origin}/api/v1/addons`,
      addon:     `${origin}/api/v1/addons/{id}`,
      offerings: `${origin}/api/v1/offerings`,
      offering:  `${origin}/api/v1/offerings/{id}`,
      status_effects: `${origin}/api/v1/status-effects`,
      status_effect:  `${origin}/api/v1/status-effects/{id}`,
      bundle:    `${origin}/api/v1/all`,
    },
    notes: [
      'Public read-only. CORS allowed for all origins.',
      'Responses cached 5 min in the browser + s-maxage; stale-while-revalidate 24h.',
      'Localised name/description fields are { en, ru } objects.',
      'Russian overrides (name.ru, description.ru, tier, deprecated) edited via /admin/content are applied automatically.',
    ],
  });
}

export const OPTIONS = corsPreflight;
