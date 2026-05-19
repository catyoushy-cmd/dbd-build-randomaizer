import Link from 'next/link';
import { notFound } from 'next/navigation';
import { decode, IncompatibleVersionError } from '@/lib/url/encode';
import { rollBuild } from '@/lib/random/algorithm';
import { KILLERS, SURVIVORS } from '@/lib/data';
import { ResultView } from '@/components/build/ResultView';

type Props = {
  params: { code: string };
};

export function generateMetadata({ params }: Props) {
  return {
    title: `Билд DBD — ${params.code}`,
    description: 'Посмотреть билд Dead by Daylight',
  };
}

export default function BuildPage({ params }: Props) {
  let decodeResult;
  let incompatible = false;

  try {
    decodeResult = decode(params.code);
  } catch (e) {
    if (e instanceof IncompatibleVersionError) {
      incompatible = true;
    } else {
      notFound();
    }
  }

  if (incompatible || !decodeResult) {
    return (
      <main className="mx-auto max-w-[600px] px-5 sm:px-10 pt-16 pb-20 text-center flex flex-col gap-4 items-center">
        <span className="label-mono text-[10px] text-ink-faint">Ошибка</span>
        <h1 className="m-0 text-[28px] font-extrabold text-dbd-bone">Устаревший формат</h1>
        <p className="text-[14px] text-ink-mute max-w-[340px] leading-[1.6]">
          Этот билд создан старой версией и не может быть воспроизведён точно.
        </p>
        <Link href="/roll" className="ritual-btn ritual-btn-primary px-8 py-3 text-[13px] no-underline mt-2">
          Создать новый билд
        </Link>
      </main>
    );
  }

  const { input } = decodeResult;
  const build = rollBuild(input);

  const killerName = input.killerId
    ? (KILLERS.find(k => k.id === input.killerId)?.name.ru ?? input.killerId)
    : null;
  const survivorName = input.survivorId
    ? (SURVIVORS.find(s => s.id === input.survivorId)?.name.ru ?? input.survivorId)
    : null;

  const characterLabel = build.role === 'killer'
    ? (killerName ?? 'Любой убийца')
    : (survivorName ?? 'Любой выживший');

  const modeLabel: Record<string, string> = {
    random: 'Полный рандом',
    efficient: 'Эффективность',
    fun: 'Веселье',
  };

  const rollUrl = `/roll?role=${build.role}&char=${input.killerId ?? input.survivorId ?? 'any'}&mode=${build.mode}&seed=${build.seed}`;

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
              {build.role === 'killer' ? 'убийца' : 'выживший'} · {modeLabel[build.mode] ?? build.mode}
            </span>
            <h1 className="m-0 text-[22px] font-extrabold text-dbd-bone tracking-[-0.01em]">
              {characterLabel}
            </h1>
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
      <ResultView build={build} />
    </main>
  );
}
