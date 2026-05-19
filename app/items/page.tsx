import { ITEMS } from '@/lib/data';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { ItemsGrid } from './ItemsGrid';

export const revalidate = 3600;

export default async function ItemsPage() {
  const overrides = await fetchOverrides('item');
  const items = applyOverrides(ITEMS, overrides);

  return (
    <div className="mx-auto max-w-[1100px] px-5 sm:px-10 pt-10 sm:pt-12 pb-16">
      <div className="mb-8">
        <span className="label-mono text-[11px] text-ink-mute">Энциклопедия</span>
        <h1 className="mt-2 text-[28px] font-extrabold text-dbd-bone">Предметы выживших</h1>
        <p className="mt-2 font-sans text-[14px] text-ink-mute max-w-[560px]">
          {items.length} предметов разных типов. К каждому подходят свои аддоны — посмотреть их можно в разделе{' '}
          <a href="/addons" className="text-dbd-accent hover:text-dbd-glow underline-offset-4 hover:underline">Аддоны</a>.
        </p>
      </div>

      <ItemsGrid items={items} />
    </div>
  );
}
