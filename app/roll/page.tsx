import { Suspense } from 'react';
import { RollClient } from './RollClient';
import { fetchBuildCores } from '@/lib/data/build-cores-db';

export default async function RollPage() {
  const buildCores = await fetchBuildCores();

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-8 text-center text-ink-mute text-sm">
          Загрузка...
        </div>
      }
    >
      <RollClient buildCores={buildCores} />
    </Suspense>
  );
}
