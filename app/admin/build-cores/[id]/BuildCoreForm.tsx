'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveBuildCoreAction, deleteBuildCoreAction } from '../actions';

type Props = {
  core: Record<string, unknown> | null;
  isNew: boolean;
};

function toJsonStr(val: unknown): string {
  if (!val) return '[]';
  if (Array.isArray(val)) return JSON.stringify(val);
  return '[]';
}

export function BuildCoreForm({ core, isNew }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!core?.id) return;
    if (!confirm(`Удалить BuildCore "${core.name}"? Это действие необратимо.`)) return;
    startTransition(async () => {
      await deleteBuildCoreAction(core.id as string);
    });
  };

  return (
    <form
      action={saveBuildCoreAction}
      className="border border-line-2 bg-bg-1 p-6 flex flex-col gap-5"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="ID" name="id" defaultValue={(core?.id as string) ?? ''} required disabled={!isNew} />
        <Field label="Название" name="name" defaultValue={(core?.name as string) ?? ''} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Роль"
          name="role"
          defaultValue={(core?.role as string) ?? 'survivor'}
          options={[
            { value: 'survivor', label: 'Survivor' },
            { value: 'killer',   label: 'Killer' },
          ]}
        />
        <SelectField
          label="Режим"
          name="mode"
          defaultValue={(core?.mode as string) ?? 'efficient'}
          options={[
            { value: 'efficient', label: 'Efficient' },
            { value: 'fun',       label: 'Fun' },
          ]}
        />
      </div>

      <Field
        label="Описание"
        name="description"
        defaultValue={(core?.description as string) ?? ''}
        multiline
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="required_perks (JSON-массив)"
          name="required_perks"
          defaultValue={toJsonStr(core?.required_perks)}
          placeholder='["perk_id_1","perk_id_2"]'
          mono
        />
        <Field
          label="recommended_perks (JSON-массив)"
          name="recommended_perks"
          defaultValue={toJsonStr(core?.recommended_perks)}
          placeholder='["perk_id_1","perk_id_2"]'
          mono
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="forbidden_perks (JSON-массив)"
          name="forbidden_perks"
          defaultValue={toJsonStr(core?.forbidden_perks)}
          placeholder='[]'
          mono
        />
        <Field
          label="preferred_addon_tags (JSON-массив)"
          name="preferred_addon_tags"
          defaultValue={toJsonStr(core?.preferred_addon_tags)}
          placeholder='["efficient"]'
          mono
        />
      </div>

      <Field
        label="preferred_item_type (опционально)"
        name="preferred_item_type"
        defaultValue={(core?.preferred_item_type as string) ?? ''}
        placeholder="medkit, toolbox, flashlight…"
      />

      <div className="flex items-center gap-3">
        <input
          type="hidden"
          name="active"
          value={(core as { active?: boolean })?.active !== false ? 'true' : 'false'}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="active_checkbox"
            defaultChecked={(core as { active?: boolean })?.active !== false}
            onChange={(e) => {
              const hidden = e.currentTarget.closest('form')?.querySelector<HTMLInputElement>('[name="active"]');
              if (hidden) hidden.value = e.currentTarget.checked ? 'true' : 'false';
            }}
            className="accent-dbd-accent"
          />
          <span className="font-sans text-[12px] text-ink-mute">Активен (показывать в роллах)</span>
        </label>
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

/* ── Field helpers ── */
type FieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  mono?: boolean;
};

function Field({ label, name, defaultValue = '', placeholder, required, disabled, multiline, mono }: FieldProps) {
  const inputClass = `w-full bg-bg-2 border border-line-2 px-3 py-2 font-${mono ? 'mono' : 'sans'} text-[12px] text-ink focus:border-dbd-accent outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div className="flex flex-col gap-1">
      <label className="label-mono text-[9px] text-ink-mute">{label}{required && ' *'}</label>
      {multiline ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className={`${inputClass} resize-y`}
        />
      ) : (
        <input
          type="text"
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={inputClass}
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="label-mono text-[9px] text-ink-mute">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full bg-bg-2 border border-line-2 px-3 py-2 font-sans text-[12px] text-ink focus:border-dbd-accent outline-none transition-colors duration-150"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
