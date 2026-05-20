import { fetchAddons, fetchKillers } from '@/lib/data/content-db';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { AddonsExplorer } from './AddonsExplorer';

export const revalidate = 3600;

type Props = {
  searchParams: { item?: string; killer?: string };
};

export default async function AddonsPage({ searchParams }: Props) {
  const [addonsRaw, killers, overrides] = await Promise.all([
    fetchAddons(),
    fetchKillers(),
    fetchOverrides('addon'),
  ]);
  const addons = applyOverrides(addonsRaw, overrides);

  // Initial selection from query params
  const initialKiller = searchParams.killer ?? null;
  const initialItem = searchParams.item ?? null;

  return (
    <div className="mx-auto max-w-[1100px] px-5 sm:px-10 pt-10 sm:pt-12 pb-16">
      <div className="mb-8">
        <span className="label-mono text-[11px] text-ink-mute">Энциклопедия</span>
        <h1 className="mt-2 text-[28px] font-extrabold text-dbd-bone">Аддоны</h1>
        <p className="mt-2 font-sans text-[14px] text-ink-mute max-w-[640px]">
          В DBD каждый аддон привязан либо к конкретному убийце (модификаторы силы), либо к типу предмета
          выжившего (фонарик / аптечка / инструменты / карта / ключ). Всего {addons.length} аддонов.
        </p>
      </div>

      <AddonsExplorer
        addons={addons}
        killers={killers}
        initialKiller={initialKiller}
        initialItem={initialItem}
      />
    </div>
  );
}
