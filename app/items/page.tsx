import { fetchItems, fetchAddons, fetchStatusEffects } from '@/lib/data/content-db';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { ItemsGrid } from './ItemsGrid';

export const revalidate = 3600;

export default async function ItemsPage() {
  const [itemsRaw, addons, statusEffects, overrides] = await Promise.all([
    fetchItems(),
    fetchAddons(),
    fetchStatusEffects(),
    fetchOverrides('item'),
  ]);
  const items = applyOverrides(itemsRaw, overrides);

  return (
    <div className="mx-auto max-w-[1100px] px-5 sm:px-10 pt-10 sm:pt-12 pb-16">
      <div className="mb-8">
        <span className="label-mono text-[11px] text-ink-mute">Энциклопедия</span>
        <h1 className="mt-2 text-[28px] font-extrabold text-dbd-bone">Предметы выживших</h1>
        <p className="mt-2 font-sans text-[14px] text-ink-mute max-w-[640px]">
          Базовые предметы Dead by Daylight, сгруппированные по типу. К каждому подходят свои аддоны —
          смотрите прямо в карточке.
        </p>
      </div>

      <ItemsGrid items={items} addons={addons} statusEffects={statusEffects} />
    </div>
  );
}
