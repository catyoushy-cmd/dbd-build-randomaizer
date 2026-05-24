import { fetchOfferings, fetchStatusEffects } from '@/lib/data/content-db';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { OfferingsGrid } from './OfferingsGrid';

export const revalidate = 3600;

export default async function OfferingsPage() {
  const [offeringsRaw, statusEffects, overrides] = await Promise.all([
    fetchOfferings(),
    fetchStatusEffects(),
    fetchOverrides('offering'),
  ]);
  const offerings = applyOverrides(offeringsRaw, overrides);

  return (
    <div className="mx-auto max-w-[1100px] px-5 sm:px-10 pt-10 sm:pt-12 pb-16">
      <div className="mb-8">
        <span className="label-mono text-[10px] text-ink-mute">Энциклопедия</span>
        <h1 className="mt-2 text-[28px] font-extrabold text-dbd-bone">Подношения</h1>
        <p className="mt-2 font-sans text-[13px] text-ink-mute max-w-[560px]">
          {offerings.length} подношений с описаниями.
        </p>
      </div>

      <OfferingsGrid offerings={offerings} statusEffects={statusEffects} />
    </div>
  );
}
