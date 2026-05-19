import Link from 'next/link';
import { KILLERS, PERKS } from '@/lib/data';
import { IconImg } from '@/components/ui/icon-img';

export const revalidate = 3600;

export default async function KillersPage() {
  // Count personal perks per killer (perks where perk.character is killer's index/id)
  // Our data has perk.character as a free-form string; just count perks where role=killer.
  const killerPerkCount = PERKS.filter((p) => p.role === 'killer').length;

  return (
    <div className="mx-auto max-w-[1100px] px-5 sm:px-10 pt-10 sm:pt-12 pb-16">
      <div className="mb-8">
        <span className="label-mono text-[11px] text-ink-mute">Энциклопедия</span>
        <h1 className="mt-2 text-[28px] font-extrabold text-dbd-bone">Убийцы</h1>
        <p className="mt-2 font-sans text-[14px] text-ink-mute max-w-[640px]">
          {KILLERS.length} убийц в игре. Каждый со своей способностью и набором аддонов.
          Всего {killerPerkCount} перков убийц.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {KILLERS.map((k) => (
          <Link
            key={k.id}
            href={`/addons?killer=${k.id}`}
            className="flex flex-col gap-3 p-4 border border-line-1 bg-bg-1 hover:border-line-ember hover:bg-bg-2 transition-colors no-underline cursor-pointer"
          >
            <div className="aspect-square w-full border border-line-2 bg-bg-2 flex items-center justify-center overflow-hidden">
              <IconImg
                src={k.icon}
                alt={k.name.ru}
                size={180}
                fallback={
                  <div className="flex flex-col items-center gap-1 text-ink-faint">
                    <span className="text-[28px]">⛧</span>
                    <span className="label-mono text-[9px]">no portrait</span>
                  </div>
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[14px] font-semibold text-dbd-bone leading-tight">
                {k.name.ru}
              </span>
              <span className="font-sans text-[12px] text-ink-mute leading-tight">
                {k.power}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
