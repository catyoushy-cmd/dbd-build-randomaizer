import { fetchPerks, fetchOfferings, fetchItems, fetchAddons } from '@/lib/data/content-db';
import { fetchAllOverrides } from '@/lib/data/overrides';
import { ContentTable } from './ContentTable';

type EntityType = 'perk' | 'offering' | 'item' | 'addon';

type Props = {
  searchParams: { type?: string; q?: string };
};

const TYPE_LABEL: Record<EntityType, string> = {
  perk:     'Перки',
  offering: 'Подношения',
  item:     'Предметы',
  addon:    'Аддоны',
};

export default async function ContentPage({ searchParams }: Props) {
  const raw = (searchParams.type ?? 'perk') as EntityType;
  const type: EntityType = ['perk','offering','item','addon'].includes(raw) ? raw : 'perk';
  const query = (searchParams.q ?? '').toLowerCase();

  // Lazy-load only the source we need
  let sourceList: Array<{
    id: string;
    name?: { en?: string; ru?: string };
    description?: { en?: string; ru?: string };
    tier?: string;
    deprecated?: boolean;
    available_by_default?: boolean;
  }>;

  switch (type) {
    case 'offering': sourceList = await fetchOfferings(); break;
    case 'item':     sourceList = await fetchItems();     break;
    case 'addon':    sourceList = await fetchAddons();    break;
    default:         sourceList = await fetchPerks();
  }

  const overrides = await fetchAllOverrides(type);
  const overridesMap = new Map(overrides.map((o) => [o.entity_id, o]));

  const items = sourceList
    .filter((item) => {
      if (!query) return true;
      const nameEn = item.name?.en?.toLowerCase() ?? '';
      const nameRu = item.name?.ru?.toLowerCase() ?? '';
      const ov = overridesMap.get(item.id);
      return item.id.includes(query) || nameEn.includes(query) || nameRu.includes(query) || (ov?.name_ru ?? '').toLowerCase().includes(query);
    })
    .map((item) => ({
      id: item.id,
      nameEn: item.name?.en ?? item.id,
      nameRu: item.name?.ru ?? '',
      descriptionRu: item.description?.ru ?? '',
      tier: item.tier ?? '',
      deprecated: item.deprecated ?? false,
      availableByDefault: item.available_by_default ?? true,
      override: overridesMap.get(item.id),
    }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="label-mono text-[10px] text-ink-mute">Редактор контента</span>
          <h1 className="mt-1 text-[22px] font-extrabold text-dbd-bone">
            {TYPE_LABEL[type]}
          </h1>
        </div>
        {/* Type switcher */}
        <div className="flex gap-1 flex-wrap">
          {(['perk', 'offering', 'item', 'addon'] as const).map((t) => (
            <a
              key={t}
              href={`/admin/content?type=${t}`}
              className={`px-4 py-2 label-mono text-[10px] border transition-colors duration-150 ${
                type === t
                  ? 'border-line-ember bg-[rgba(184,67,31,.12)] text-dbd-bone'
                  : 'border-line-1 text-ink-mute hover:border-line-2'
              }`}
            >
              {TYPE_LABEL[t]}
            </a>
          ))}
        </div>
      </div>

      <ContentTable items={items} entityType={type} query={query} showAvailability={type !== 'perk'} />
    </div>
  );
}
