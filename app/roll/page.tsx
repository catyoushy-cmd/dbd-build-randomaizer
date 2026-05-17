import { Suspense } from 'react';
import { RollClient } from './RollClient';

export default function RollPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-8 text-center text-muted-foreground text-sm">
          Загрузка...
        </div>
      }
    >
      <RollClient />
    </Suspense>
  );
}
