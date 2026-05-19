import { notFound } from 'next/navigation';
import { fetchAllBuildCores } from '@/lib/data/build-cores-db';
import { BuildCoreForm } from './BuildCoreForm';

type Props = { params: { id: string } };

export default async function BuildCoreEditPage({ params }: Props) {
  const isNew = params.id === 'new';

  let core: Record<string, unknown> | null = null;
  if (!isNew) {
    const cores = await fetchAllBuildCores();
    const found = cores.find((c) => c.id === params.id);
    if (!found) notFound();
    core = found as Record<string, unknown>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-[700px]">
      <div>
        <span className="label-mono text-[10px] text-ink-mute">
          {isNew ? 'Создать' : 'Редактировать'}
        </span>
        <h1 className="mt-1 text-[22px] font-extrabold text-dbd-bone">
          {isNew ? 'Новый BuildCore' : (core?.name as string)}
        </h1>
      </div>

      <BuildCoreForm core={core} isNew={isNew} />
    </div>
  );
}
