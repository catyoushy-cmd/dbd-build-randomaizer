import { fetchStatusEffects } from '@/lib/data/content-db';
import { StatusEffectsGrid } from './StatusEffectsGrid';

export const revalidate = 3600;

export default async function StatusEffectsPage() {
  const effects = await fetchStatusEffects();

  return (
    <div className="mx-auto max-w-[920px] px-5 sm:px-10 pt-10 sm:pt-12 pb-16">
      <div className="mb-8">
        <span className="label-mono text-[11px] text-ink-mute">Энциклопедия</span>
        <h1 className="mt-2 text-[28px] font-extrabold text-dbd-bone">Состояния</h1>
        <p className="mt-2 font-sans text-[14px] text-ink-mute max-w-[640px]">
          Игровые состояния (статус-эффекты), упоминаемые в описаниях перков и аддонов.
          При наведении на состояние в описании перка появляется такая же справка.
        </p>
      </div>

      <StatusEffectsGrid effects={effects} />
    </div>
  );
}
