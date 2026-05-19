import { PERKS, OFFERINGS } from '@/lib/data';
import { fetchAllOverrides } from '@/lib/data/overrides';
import { ContentTable } from './ContentTable';

type Props = {
  searchParams: { type?: string; q?: string };
};

export default async function ContentPage({ searchParams }: Props) {
  const type = searchParams.type === 'offering' ? 'offering' : 'perk';
  const query = (searchParams.q ?? '').toLowerCase();

  const [perkOverrides, offeringOverrides] = await Promise.all([
    fetchAllOverrides('perk'),
    fetchAllOverrides('offering'),
  ]);

  const overridesMap = new Map(
    (type === 'perk' ? perkOverrides : offeringOverrides).map((o) => [o.entity_id, o]),
  );

  const rawItems = type === 'perk' ? PERKS : OFFERINGS;

  const items = rawItems
    .filter((item) => {
      if (!query) return true;
      const nameEn = (item as { name?: { en?: string } }).name?.en?.toLowerCase() ?? '';
      const nameRu = (item as { name?: { ru?: string } }).name?.ru?.toLowerCase() ?? '';
      const ov = overridesMap.get(item.id);
      return item.id.includes(query) || nameEn.includes(query) || nameRu.includes(query) || (ov?.name_ru ?? '').toLowerCase().includes(query);
    })
    .map((item) => ({
      id: item.id,
      nameEn: (item as { name?: { en?: string } }).name?.en ?? item.id,
      nameRu: (item as { name?: { ru?: string } }).name?.ru ?? '',
      descriptionRu: (item as { description?: { ru?: string } }).description?.ru ?? '',
      tier: (item as { tier?: string }).tier ?? '',
      deprecated: (item as { deprecated?: boolean }).deprecated ?? false,
      override: overridesMap.get(item.id),
    }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="label-mono text-[10px] text-ink-mute">Редактор контента</span>
          <h1 className="mt-1 text-[22px] font-extrabold text-dbd-bone">
            {type === 'perk' ? 'Перки' : 'Подношения'}
          </h1>
        </div>
        {/* Type switcher */}
        <div className="flex gap-1">
          {(['perk', 'offering'] as const).map((t) => (
            <a
              key={t}
              href={`/admin/content?type=${t}`}
              className={`px-4 py-2 label-mono text-[10px] border transition-colors duration-150 ${
                type === t
                  ? 'border-line-ember bg-[rgba(184,67,31,.12)] text-dbd-bone'
                  : 'border-line-1 text-ink-mute hover:border-line-2'
              }`}
            >
              {t === 'perk' ? 'Перки' : 'Подношения'}
            </a>
          ))}
        </div>
      </div>

      <ContentTable items={items} entityType={type} query={query} />
    </div>
  );
}
