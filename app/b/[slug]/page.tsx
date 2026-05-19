import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { rollBuild } from '@/lib/random/algorithm';
import { applyPins } from '@/lib/random/pinning';
import { KILLERS, PERKS, ITEMS, ADDONS, OFFERINGS } from '@/lib/data';
import { ResultView } from '@/components/build/ResultView';
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
    <main className="mx-auto max-w-[600px] px-5 sm:px-10 pt-10 sm:pt-12 pb-12 sm:pb-20">
      {/* ── Page header ── */}
      <div className="mb-8">
        <Link href="/" className="label-mono text-[10px] text-ink-faint no-underline hover:text-ink-mute transition-colors mb-4 block">
          ← Алтарь
        </Link>

        <div className="flex items-start justify-between gap-4 border border-line-2 bg-bg-1 p-5">
          <div>
            <span className="label-mono text-[9px] text-ink-faint block mb-1">
              {row.role === 'killer' ? 'убийца' : 'выживший'} · {modeLabel[row.mode] ?? row.mode}
            </span>
            <h1 className="m-0 text-[22px] font-extrabold text-dbd-bone tracking-[-0.01em]">
              {characterLabel}
            </h1>
            {row.note && (
              <p className="m-0 mt-2 text-[13px] text-ink-mute italic">
                {row.note}
              </p>
            )}
          </div>
          <Link
            href={rollUrl}
            className="ritual-btn ritual-btn-ghost shrink-0 px-4 py-2 text-[11px] no-underline"
          >
            Скопировать себе →
          </Link>
        </div>
      </div>

      {/* ── Build display (readonly) ── */}
      <ResultView build={finalBuild} />
    </main>
  );
}
