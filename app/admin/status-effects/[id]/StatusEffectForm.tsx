'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveStatusEffectAction, deleteStatusEffectAction } from '../actions';

type Props = {
  effect: Record<string, unknown> | null;
  isNew: boolean;
};

const CATEGORIES = [
  { value: 'debuff',  label: 'Дебаф' },
  { value: 'buff',    label: 'Баф' },
  { value: 'aura',    label: 'Аура' },
  { value: 'general', label: 'Общее' },
  { value: 'status',  label: 'Прочее' },
];

export function StatusEffectForm({ effect, isNew }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const name = (effect?.name as { en?: string; ru?: string }) ?? {};
  const desc = (effect?.description as { en?: string; ru?: string }) ?? {};

  const handleDelete = () => {
    if (!effect?.id) return;
    if (!confirm(`Удалить состояние "${name.ru ?? effect.id}"?`)) return;
    startTransition(async () => {
      await deleteStatusEffectAction(effect.id as string);
    });
  };

  return (
    <form action={saveStatusEffectAction} className="border border-line-2 bg-bg-1 p-6 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="ID (slug)"
          name="id"
          required
          disabled={!isNew}
          defaultValue={(effect?.id as string) ?? ''}
          placeholder="exhausted"
        />
        <Field
          label="Source key (raw {Keyword.X})"
          name="source_key"
          defaultValue={(effect?.source_key as string) ?? ''}
          placeholder="Exhausted"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Название EN" name="name_en" defaultValue={name.en ?? ''} required />
        <Field label="Название RU" name="name_ru" defaultValue={name.ru ?? ''} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Описание EN" name="description_en" defaultValue={desc.en ?? ''} multiline />
        <Field label="Описание RU" name="description_ru" defaultValue={desc.ru ?? ''} multiline />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="label-mono text-[9px] text-ink-mute">Категория</label>
          <select
            name="category"
            defaultValue={(effect?.category as string) ?? 'status'}
            className="bg-bg-2 border border-line-2 px-3 py-2 font-sans text-[12px] text-ink focus:border-dbd-accent outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <Field label="Иконка (URL/path)" name="icon" defaultValue={(effect?.icon as string) ?? ''} />
      </div>

      <div className="h-px bg-line-1" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="ritual-btn ritual-btn-primary px-5 py-2 text-[11px] disabled:opacity-60"
          >
            {isPending ? 'Сохранение…' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="ritual-btn ritual-btn-ghost px-5 py-2 text-[11px]"
          >
            Отмена
          </button>
        </div>
        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="ritual-btn px-5 py-2 text-[11px] text-dbd-blood border-dbd-blood hover:bg-[rgba(180,30,30,.12)] disabled:opacity-60"
          >
            Удалить
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label, name, defaultValue = '', placeholder, required, disabled, multiline,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
}) {
  const cls = 'w-full bg-bg-2 border border-line-2 px-3 py-2 font-sans text-[12px] text-ink focus:border-dbd-accent outline-none transition-colors duration-150 disabled:opacity-50';
  return (
    <div className="flex flex-col gap-1">
      <label className="label-mono text-[9px] text-ink-mute">{label}{required ? ' *' : ''}</label>
      {multiline ? (
        <textarea name={name} defaultValue={defaultValue} placeholder={placeholder} rows={3} className={`${cls} resize-y`} />
      ) : (
        <input
          type="text"
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={cls}
        />
      )}
    </div>
  );
}
