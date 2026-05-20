import { fetchKillers, fetchAddons, fetchPerks } from '@/lib/data/content-db';
import { publicJson, publicNotFound, corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const [killers, addons, perks] = await Promise.all([
    fetchKillers(),
    fetchAddons(),
    fetchPerks(),
  ]);
  const killer = killers.find((k) => k.id === params.id);
  if (!killer) return publicNotFound(`killer "${params.id}" not found`);

  // Include the killer's own add-ons + perks that reference this character.
  const ownAddons = addons.filter(
    (a) => a.scope.type === 'killer' && a.scope.killerId === params.id,
  );
  const ownPerks = perks.filter(
    (p) => p.role === 'killer' && (p.character?.toLowerCase().includes(params.id) ?? false),
  );

  return publicJson({
    ...killer,
    addons:        ownAddons,
    teachable_perks: ownPerks,
  });
}

export const OPTIONS = corsPreflight;
