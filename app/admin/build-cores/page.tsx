import Link from 'next/link';
import { fetchAllBuildCores } from '@/lib/data/build-cores-db';

export default async function BuildCoresPage() {
  const cores = await fetchAllBuildCores();

  const byGroup = cores.reduce<Record<string, typeof cores>>((acc, c) => {
    const key = `${c.role}:${c.mode}`;
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  const GROUPS = [
    { key: 'survivor:efficient', label: 'Survivor / Efficient' },
    { key: 'survivor:fun',       label: 'Survivor / Fun' },
    { key: 'killer:efficient',   label: 'Killer / Efficient' },
    { key: 'killer:fun',         label: 'Killer / Fun' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="label-mono text-[10px] text-ink-mute">Управление</span>
          <h1 className="mt-1 text-[22px] font-extrabold text-dbd-bone">BuildCores</h1>
        </div>
        <Link href="/admin/build-cores/new" className="ritual-btn ritual-btn-primary px-4 py-2 text-[11px]">
          + Добавить
        </Link>
      </div>

      {GROUPS.map(({ key, label }) => {
        const items = byGroup[key] ?? [];
        return (
          <div key={key} className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="label-mono text-[10px] text-ink-mute">{label}</span>
              <span className="label-mono text-[10px] text-ink-faint">({items.length})</span>
            </div>
            {items.length === 0 ? (
              <p className="text-ink-faint text-[12px] italic pl-2">Нет ядер</p>
            ) : (
              <div className="border border-line-1 divide-y divide-line-1">
                {items.map((core) => (
                  <div
                    key={core.id}
                    className="flex items-center gap-4 px-4 py-3 bg-bg-1 hover:bg-bg-2 transition-colors duration-100"
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-sans text-[13px] font-semibold text-dbd-bone truncate">{core.name}</span>
                      <span className="label-mono text-[9px] text-ink-faint mt-0.5">{core.id}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`label-mono text-[9px] px-2 py-0.5 border ${
                        (core as { active?: boolean }).active !== false
                          ? 'text-dbd-accent border-line-ember'
                          : 'text-ink-faint border-line-1'
                      }`}>
                        {(core as { active?: boolean }).active !== false ? 'active' : 'inactive'}
                      </span>
                      <Link
                        href={`/admin/build-cores/${core.id}`}
                        className="ritual-btn ritual-btn-ghost px-3 py-1 text-[10px]"
                      >
                        Изменить
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
