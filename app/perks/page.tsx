import { fetchPerks, fetchKillers, fetchSurvivors } from '@/lib/data/content-db';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { PerksGrid } from './PerksGrid';

export const revalidate = 3600;

export default async function PerksPage() {
  const [perksRaw, killers, survivors, overrides] = await Promise.all([
    fetchPerks(),
    fetchKillers(),
    fetchSurvivors(),
    fetchOverrides('perk'),
  ]);
  const perks = applyOverrides(perksRaw, overrides);

  // Filter out deprecated
  const active = perks.filter((p) => !p.deprecated);

  return (
    <div className="mx-auto max-w-[1100px] px-5 sm:px-10 pt-10 sm:pt-12 pb-16">
      <div className="mb-8">
        <span className="label-mono text-[11px] text-ink-mute">Энциклопедия</span>
        <h1 className="mt-2 text-[28px] font-extrabold text-dbd-bone">Перки</h1>
        <p className="mt-2 font-sans text-[14px] text-ink-mute max-w-[640px]">
          {active.length} перков, сгруппированных по персонажам в порядке появления в игре. Нажмите на перк, чтобы открыть полное описание.
        </p>
      </div>

      <PerksGrid perks={active} killers={killers} survivors={survivors} />
    </div>
  );
}
