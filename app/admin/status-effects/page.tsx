import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';

const CATEGORY_LABEL: Record<string, string> = {
  debuff:  'Дебаф',
  buff:    'Баф',
  general: 'Общее',
  aura:    'Аура',
  status:  'Состояние',
};

export default async function StatusEffectsAdminPage() {
  const supabase = createServiceClient();
  const { data: effects } = await supabase
    .from('status_effects')
    .select('id, source_key, name, category')
    .order('category')
    .order('id');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="label-mono text-[10px] text-ink-mute">Управление</span>
          <h1 className="mt-1 text-[22px] font-extrabold text-dbd-bone">Состояния</h1>
        </div>
        <Link href="/admin/status-effects/new" className="ritual-btn ritual-btn-primary px-4 py-2 text-[11px]">
          + Добавить
        </Link>
      </div>

      <div className="border border-line-1 divide-y divide-line-1">
        {(effects ?? []).map((e) => (
          <div key={e.id} className="flex items-center gap-4 px-4 py-3 bg-bg-1 hover:bg-bg-2 transition-colors">
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-sans text-[13px] font-semibold text-dbd-bone truncate">
                {(e.name as { ru?: string; en?: string })?.ru ?? (e.name as { en?: string })?.en ?? e.id}
              </span>
              <span className="label-mono text-[9px] text-ink-faint mt-0.5">
                {e.id}{e.source_key ? ` · src: ${e.source_key}` : ''}
              </span>
            </div>
            <span className="label-mono text-[9px] px-2 py-0.5 border border-line-2 text-ink-mute">
              {CATEGORY_LABEL[e.category] ?? e.category}
            </span>
            <Link
              href={`/admin/status-effects/${e.id}`}
              className="ritual-btn ritual-btn-ghost px-3 py-1 text-[10px]"
            >
              Изменить
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
