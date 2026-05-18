import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { rollBuild } from '@/lib/random/algorithm';
import { applyPins } from '@/lib/random/pinning';
import { KILLERS, PERKS, ITEMS, ADDONS, OFFERINGS } from '@/lib/data';
import { ShareBuildView } from '@/app/build/[code]/ShareBuildView';
import type { Pins } from '@/lib/random/pinning';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  return { title: `Билд DBD — ${params.slug}` };
}

export default async function SavedBuildPage({ params }: Props) {
  const supabase = createClient();

  const { data: row, error } = await supabase
    .from('saved_builds')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !row) notFound();

  const build = rollBuild({
    role: row.role as 'survivor' | 'killer',
    killerId: row.killer_id ?? null,
    survivorId: null,
    mode: row.mode as 'random' | 'efficient' | 'fun',
    seed: row.seed,
  });

  const finalBuild = row.pinned_state
    ? applyPins(build, row.pinned_state as Pins, {
        perks: PERKS,
        items: ITEMS,
        addons: ADDONS,
        offerings: OFFERINGS,
      })
    : build;

  const characterLabel =
    row.role === 'killer'
      ? (KILLERS.find(k => k.id === row.killer_id)?.name.ru ?? 'Любой убийца')
      : 'Любой выживший';

  const modeLabel: Record<string, string> = {
    random: 'Полный рандом',
    efficient: 'Эффективность',
    fun: 'Веселье',
  };

  const rollUrl = `/roll?role=${row.role}&char=${row.killer_id ?? 'any'}&mode=${row.mode}&seed=${row.seed}`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 block">
            ← На главную
          </Link>
          <h1 className="text-2xl font-bold">
            {row.role === 'killer' ? '🔪' : '🧍'} {characterLabel}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {modeLabel[row.mode] ?? row.mode}
            {row.note && <span className="ml-2 text-foreground/70">— {row.note}</span>}
          </p>
        </div>
        <Link
          href={rollUrl}
          className="shrink-0 rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          Скопировать себе →
        </Link>
      </div>

      <ShareBuildView build={finalBuild} />
    </main>
  );
}
