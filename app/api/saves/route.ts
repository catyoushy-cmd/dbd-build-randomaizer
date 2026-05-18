import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createClient } from '@/lib/supabase/server';

export type SaveBuildRequest = {
  role: 'survivor' | 'killer';
  killer_id: string | null;
  mode: string;
  seed: number;
  pinned_state: unknown | null;
  note: string | null;
};

const VALID_ROLES = new Set(['survivor', 'killer']);
const VALID_MODES = new Set(['random', 'efficient', 'fun']);
const MAX_NOTE_LEN = 200;
const SLUG_MAX_RETRIES = 5;

function validate(body: Partial<SaveBuildRequest>): SaveBuildRequest | string {
  if (!body || typeof body !== 'object') return 'Invalid body';
  if (typeof body.role !== 'string' || !VALID_ROLES.has(body.role)) return 'Invalid role';
  if (typeof body.mode !== 'string' || !VALID_MODES.has(body.mode)) return 'Invalid mode';
  if (typeof body.seed !== 'number' || !Number.isFinite(body.seed)) return 'Invalid seed';
  if (body.killer_id !== null && typeof body.killer_id !== 'string') return 'Invalid killer_id';

  let note: string | null = null;
  if (body.note != null) {
    if (typeof body.note !== 'string') return 'Invalid note';
    note = body.note.trim().slice(0, MAX_NOTE_LEN) || null;
  }

  return {
    role: body.role as 'survivor' | 'killer',
    killer_id: body.killer_id ?? null,
    mode: body.mode,
    seed: body.seed,
    pinned_state: body.pinned_state ?? null,
    note,
  };
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = validate(raw as Partial<SaveBuildRequest>);
  if (typeof parsed === 'string') {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  for (let attempt = 0; attempt < SLUG_MAX_RETRIES; attempt++) {
    const slug = nanoid(6);
    const { data, error } = await supabase
      .from('saved_builds')
      .insert({
        user_id: user.id,
        slug,
        role: parsed.role,
        killer_id: parsed.killer_id,
        mode: parsed.mode,
        seed: parsed.seed,
        pinned_state: parsed.pinned_state,
        note: parsed.note,
      })
      .select('slug')
      .single();

    if (!error) return NextResponse.json({ slug: data.slug });

    // 23505 = unique_violation in Postgres — slug collision, retry
    if ((error as { code?: string }).code === '23505') continue;

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: 'Could not allocate slug' }, { status: 500 });
}
