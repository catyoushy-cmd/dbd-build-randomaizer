'use client';

import { useState, useEffect } from 'react';
import { Bookmark, Loader2, Check, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Build } from '@/lib/data';
import { cn } from '@/lib/utils';

type Props = {
  build: Build;
  className?: string;
};

type SaveState = 'idle' | 'loading' | 'saved' | 'error';

export function SaveBuildButton({ build, className }: Props) {
  const [user, setUser] = useState<{ email?: string } | null | undefined>(undefined); // undefined = loading
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
  }, []);

  const handleSave = async () => {
    if (!user) {
      // Redirect to login, come back to current page
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    if (!showNoteInput) {
      setShowNoteInput(true);
      return;
    }

    setSaveState('loading');

    const res = await fetch('/api/saves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: build.role,
        killer_id: build.killerId,
        mode: build.mode,
        seed: build.seed,
        pinned_state: null,
        note: note.trim() || null,
      }),
    });

    if (res.ok) {
      const { slug } = await res.json();
      setSavedSlug(slug);
      setSaveState('saved');
      setShowNoteInput(false);
    } else {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  if (user === undefined) return null; // still loading auth

  if (saveState === 'saved' && savedSlug) {
    return (
      <a
        href={`/b/${savedSlug}`}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors',
          className,
        )}
      >
        <Check size={13} />
        Сохранено — /b/{savedSlug}
      </a>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {showNoteInput && (
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Заметка (необязательно)"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowNoteInput(false); }}
          className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 transition-colors"
        />
      )}
      <button
        onClick={handleSave}
        disabled={saveState === 'loading'}
        className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/20 disabled:opacity-50"
      >
        {saveState === 'loading' ? (
          <Loader2 size={13} className="animate-spin" />
        ) : user ? (
          <Bookmark size={13} />
        ) : (
          <LogIn size={13} />
        )}
        {saveState === 'loading'
          ? 'Сохраняем...'
          : saveState === 'error'
          ? 'Ошибка, попробуй ещё'
          : user
          ? showNoteInput ? 'Сохранить' : 'Сохранить билд'
          : 'Войти и сохранить'}
      </button>
    </div>
  );
}
