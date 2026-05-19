'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveArticleAction, deleteArticleAction } from '../actions';
import { cn } from '@/lib/utils';

type Props = {
  article: Record<string, unknown> | null;
  isNew: boolean;
};

const CATEGORIES = [
  { value: 'guide',    label: 'Гайд' },
  { value: 'tier-list', label: 'Тир-лист' },
  { value: 'beginner', label: 'Для новичков' },
  { value: 'meta',     label: 'Мета' },
  { value: 'other',    label: 'Другое' },
];

export function ArticleForm({ article, isNew }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState(false);
  const [bodyMd, setBodyMd] = useState((article?.body_md as string) ?? '');

  const handleDelete = () => {
    if (!article?.id) return;
    if (!confirm(`Удалить статью "${article.title}"?`)) return;
    startTransition(async () => {
      await deleteArticleAction(article.id as string);
    });
  };

  return (
    <form
      action={saveArticleAction}
      className="border border-line-2 bg-bg-1 p-6 flex flex-col gap-5"
    >
      {typeof article?.id === 'string' && <input type="hidden" name="id" value={article.id} />}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="label-mono text-[9px] text-ink-mute">Slug (URL) *</label>
          <input
            type="text"
            name="slug"
            defaultValue={(article?.slug as string) ?? ''}
            required
            placeholder="beginner-guide"
            pattern="[a-z0-9-]+"
            title="Только строчные буквы, цифры и дефис"
            className="bg-bg-2 border border-line-2 px-3 py-2 font-mono text-[12px] text-ink focus:border-dbd-accent outline-none transition-colors duration-150"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label-mono text-[9px] text-ink-mute">Категория</label>
          <select
            name="category"
            defaultValue={(article?.category as string) ?? 'guide'}
            className="bg-bg-2 border border-line-2 px-3 py-2 font-sans text-[12px] text-ink focus:border-dbd-accent outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} label={c.label}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="label-mono text-[9px] text-ink-mute">Заголовок *</label>
        <input
          type="text"
          name="title"
          defaultValue={(article?.title as string) ?? ''}
          required
          className="bg-bg-2 border border-line-2 px-3 py-2 font-sans text-[13px] text-ink focus:border-dbd-accent outline-none transition-colors duration-150"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="label-mono text-[9px] text-ink-mute">URL обложки (опционально)</label>
        <input
          type="url"
          name="cover_url"
          defaultValue={(article?.cover_url as string) ?? ''}
          placeholder="https://..."
          className="bg-bg-2 border border-line-2 px-3 py-2 font-sans text-[12px] text-ink focus:border-dbd-accent outline-none transition-colors duration-150"
        />
      </div>

      {/* Markdown editor with preview toggle */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="label-mono text-[9px] text-ink-mute">Текст (Markdown) *</label>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className={cn(
              'label-mono text-[9px] px-3 py-1 border transition-colors duration-150',
              preview
                ? 'border-dbd-accent text-dbd-accent'
                : 'border-line-2 text-ink-mute hover:border-line-ember',
            )}
          >
            {preview ? 'Редактор' : 'Превью'}
          </button>
        </div>
        {preview ? (
          <div
            className="min-h-[300px] bg-bg-2 border border-line-2 px-4 py-3 font-sans text-[13px] text-ink prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: mdToHtml(bodyMd) }}
          />
        ) : (
          <textarea
            name="body_md"
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            required
            rows={16}
            placeholder="# Заголовок&#10;&#10;Текст статьи в **Markdown** формате..."
            className="bg-bg-2 border border-line-2 px-3 py-2 font-mono text-[12px] text-ink focus:border-dbd-accent outline-none resize-y"
          />
        )}
        {/* Hidden input to carry value when in preview mode */}
        {preview && <input type="hidden" name="body_md" value={bodyMd} />}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="hidden"
          name="published"
          value={(article?.published as boolean) ? 'true' : 'false'}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            defaultChecked={(article?.published as boolean) ?? false}
            onChange={(e) => {
              const hidden = e.currentTarget.closest('form')?.querySelector<HTMLInputElement>('[name="published"]');
              if (hidden) hidden.value = e.currentTarget.checked ? 'true' : 'false';
            }}
            className="accent-dbd-accent"
          />
          <span className="font-sans text-[12px] text-ink-mute">Опубликовано (видно в энциклопедии)</span>
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

/** Very basic Markdown → HTML for preview only. */
function mdToHtml(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|l|p])(.+)$/gm, '$1')
    .trim();
}
