import { fetchPerks } from '@/lib/data/content-db';
import { getEntityByIdWithOverrides } from '@/lib/api/entity-routes';
import { corsPreflight } from '@/lib/api/response';

export const revalidate = 600;

export const GET = (_req: Request, { params }: { params: { id: string } }) =>
  getEntityByIdWithOverrides(params.id, {
    fetch: fetchPerks,
    overrideKind: 'perk',
    label: 'perk',
  });

export const OPTIONS = corsPreflight;
