import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createClient } from '@/lib/supabase/server';
import type { BuildInput } from '@/lib/random/algorithm';

export type SaveBuildRequest = {
  role: 'survivor' | 'killer';
  killer_id: string | null;
  mode: string;
  seed: number;
  pinned_state: unknown | null;
  note: string | null;
};

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: SaveBuildRequest = await request.json();
  const slug = nanoid(6);

  const { data, error } = await supabase
    .from('saved_builds')
    .insert({
      user_id: user.id,
      slug,
      role: body.role,
      killer_id: body.killer_id,
      mode: body.mode,
      seed: body.seed,
      pinned_state: body.pinned_state ?? null,
      note: body.note ?? null,
    })
    .select('slug')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slug: data.slug });
}
