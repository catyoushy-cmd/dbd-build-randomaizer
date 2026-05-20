import { fetchSurvivors, fetchPerks } from '@/lib/data/content-db';
import { IconImg } from '@/components/ui/icon-img';

export const revalidate = 3600;

export default async function SurvivorsPage() {
  const [SURVIVORS, perks] = await Promise.all([fetchSurvivors(), fetchPerks()]);
  const survivorPerkCount = perks.filter((p) => p.role === 'survivor').length;

  return (
    <div className="mx-auto max-w-[1100px] px-5 sm:px-10 pt-10 sm:pt-12 pb-16">
      <div className="mb-8">
        <span className="label-mono text-[11px] text-ink-mute">Энциклопедия</span>
        <h1 className="mt-2 text-[28px] font-extrabold text-dbd-bone">Выжившие</h1>
        <p className="mt-2 font-sans text-[14px] text-ink-mute max-w-[640px]">
          {SURVIVORS.length} выживших со своими тимплейными перками. Всего {survivorPerkCount} перков выживших.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {SURVIVORS.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-3 p-4 border border-line-1 bg-bg-1"
          >
            <div className="aspect-square w-full border border-line-2 bg-bg-2 flex items-center justify-center overflow-hidden">
              <IconImg
                src={s.icon}
                alt={s.name.ru}
                size={180}
                fallback={
                  <div className="flex flex-col items-center gap-1 text-ink-faint">
                    <span className="text-[28px]">☥</span>
                    <span className="label-mono text-[9px]">no portrait</span>
                  </div>
                }
              />
            </div>
            <span className="font-sans text-[14px] font-semibold text-dbd-bone leading-tight">
              {s.name.ru}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
