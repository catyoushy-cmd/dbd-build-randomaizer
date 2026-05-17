import Link from 'next/link';
import { notFound } from 'next/navigation';
import { decode, IncompatibleVersionError } from '@/lib/url/encode';
import { rollBuild } from '@/lib/random/algorithm';
import { KILLERS, SURVIVORS } from '@/lib/data';
import { ShareBuildView } from './ShareBuildView';

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
      <main className="mx-auto max-w-2xl px-4 py-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">Устаревший формат</h1>
        <p className="text-muted-foreground">
          Этот билд создан старой версией данных и не может быть воспроизведён точно.
        </p>
        <Link
          href="/roll"
          className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
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
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 block">
            ← На главную
          </Link>
          <h1 className="text-2xl font-bold">
            {build.role === 'killer' ? '🔪' : '🧍'} {characterLabel}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {modeLabel[build.mode] ?? build.mode}
          </p>
        </div>
        <Link
          href={rollUrl}
          className="shrink-0 rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          Скопировать себе →
        </Link>
      </div>

      <ShareBuildView build={build} />
    </main>
  );
}
