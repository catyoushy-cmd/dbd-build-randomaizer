'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);
    if (authError) {
      setError('Не удалось отправить письмо. Проверь email или попробуй позже.');
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="w-12 h-12 border border-dbd-accent bg-[rgba(184,67,31,.1)] flex items-center justify-center">
          <span className="text-dbd-accent text-xl">✉</span>
        </div>
        <p className="font-sans font-semibold text-[13px] text-dbd-bone m-0">
          Письмо отправлено на {email}
        </p>
        <p className="text-[12px] text-ink-mute m-0">
          Открой письмо и нажми на ссылку — тебя перебросит обратно.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="твой@email.com"
        required
        className={[
          'w-full bg-bg-2 border border-line-2 px-3 py-[10px]',
          'font-sans text-[13px] text-ink placeholder:text-ink-faint',
          'outline-none focus:border-dbd-accent transition-colors duration-150',
        ].join(' ')}
      />
      {error && (
        <p className="text-[12px] text-dbd-blood m-0">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="ritual-btn ritual-btn-primary py-[11px] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '...' : 'Отправить magic link'}
      </button>
    </form>
  );
}
