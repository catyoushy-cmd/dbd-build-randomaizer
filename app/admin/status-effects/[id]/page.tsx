import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { StatusEffectForm } from './StatusEffectForm';

type Props = { params: { id: string } };

export default async function StatusEffectEditPage({ params }: Props) {
  const isNew = params.id === 'new';

  let effect: Record<string, unknown> | null = null;
  if (!isNew) {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('status_effects')
      .select('*')
      .eq('id', params.id)
      .single();
    if (!data) notFound();
    effect = data as Record<string, unknown>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-[640px]">
      <div>
        <span className="label-mono text-[10px] text-ink-mute">
          {isNew ? 'Создать' : 'Редактировать'}
        </span>
        <h1 className="mt-1 text-[22px] font-extrabold text-dbd-bone">
          {isNew ? 'Новое состояние' : ((effect?.name as { ru?: string })?.ru ?? 'Состояние')}
        </h1>
      </div>

      <StatusEffectForm effect={effect} isNew={isNew} />
    </div>
  );
}
