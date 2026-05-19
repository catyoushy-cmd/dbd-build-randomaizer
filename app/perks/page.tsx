import { PERKS } from '@/lib/data';
import { fetchOverrides, applyOverrides } from '@/lib/data/overrides';
import { PerksGrid } from './PerksGrid';

export const revalidate = 3600; // ISR — 1 hour

export default async function PerksPage() {
  const overrides = await fetchOverrides('perk');
  const perks = applyOverrides(PERKS, overrides);

  // Sort: S → A → B → C → no tier
  const TIER_ORDER = ['S', 'A', 'B', 'C'];
  const sorted = [...perks].sort((a, b) => {
    const ta = TIER_ORDER.indexOf(a.tier ?? '');
    const tb = TIER_ORDER.indexOf(b.tier ?? '');
    if (ta !== tb) return (ta === -1 ? 99 : ta) - (tb === -1 ? 99 : tb);
    return (a.name?.ru ?? a.name?.en ?? '').localeCompare(b.name?.ru ?? b.name?.en ?? '');
  });

  const survivorPerks = sorted.filter((p) => p.role === 'survivor' && !p.deprecated);
  const killerPerks   = sorted.filter((p) => p.role === 'killer'   && !p.deprecated);

  return (
    <div className="mx-auto max-w-[1100px] px-5 sm:px-10 pt-10 sm:pt-12 pb-16">
      <div className="mb-8">
        <span className="label-mono text-[10px] text-ink-mute">Энциклопедия</span>
        <h1 className="mt-2 text-[28px] font-extrabold text-dbd-bone">Перки</h1>
        <p className="mt-2 font-sans text-[13px] text-ink-mute max-w-[560px]">
          {perks.length} перков — с тирами, описаниями и переводами. Нажмите на перк, чтобы развернуть описание.
        </p>
      </div>

      <PerksGrid survivorPerks={survivorPerks} killerPerks={killerPerks} />
    </div>
  );
}
