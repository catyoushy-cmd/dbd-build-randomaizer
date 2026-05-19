import Link from 'next/link';
import { fetchAllBuildCores } from '@/lib/data/build-cores-db';
import { fetchAllOverrides } from '@/lib/data/overrides';
import { PERKS, OFFERINGS } from '@/lib/data';

export default async function AdminDashboard() {
  const [cores, perkOverrides, offeringOverrides] = await Promise.all([
    fetchAllBuildCores(),
    fetchAllOverrides('perk'),
    fetchAllOverrides('offering'),
  ]);

  const stats = [
    { label: 'BuildCores',       value: cores.length,             href: '/admin/build-cores' },
    { label: 'Всего перков',     value: PERKS.length,             href: '/admin/content?type=perk' },
    { label: 'Переопределений',  value: perkOverrides.length + offeringOverrides.length, href: '/admin/content' },
    { label: 'Подношений',       value: OFFERINGS.length,         href: '/admin/content?type=offering' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className="label-mono text-[10px] text-ink-mute">Панель управления</span>
        <h1 className="mt-1 text-[24px] font-extrabold text-dbd-bone">DBD Admin</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="border border-line-2 bg-bg-1 p-4 flex flex-col gap-1 hover:border-line-ember transition-colors duration-150"
          >
            <span className="text-[28px] font-extrabold text-dbd-bone leading-none">{s.value}</span>
            <span className="label-mono text-[9px] text-ink-mute mt-1">{s.label}</span>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="border border-line-1 bg-bg-1 p-5 flex flex-col gap-3">
        <span className="label-mono text-[10px] text-ink-mute">Быстрые действия</span>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/build-cores/new" className="ritual-btn ritual-btn-primary px-4 py-2 text-[11px]">
            + Новый BuildCore
          </Link>
          <Link href="/admin/content?type=perk" className="ritual-btn ritual-btn-ghost px-4 py-2 text-[11px]">
            Редактировать перки
          </Link>
          <Link href="/admin/content?type=offering" className="ritual-btn ritual-btn-ghost px-4 py-2 text-[11px]">
            Редактировать подношения
          </Link>
          <Link href="/admin/articles/new" className="ritual-btn ritual-btn-ghost px-4 py-2 text-[11px]">
            + Новая статья
          </Link>
        </div>
      </div>
    </div>
  );
}
