'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Mail } from 'lucide-react';

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
      <div className="space-y-3 text-center py-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
          <Mail size={20} className="text-primary" />
        </div>
        <p className="text-sm font-medium">Письмо отправлено на {email}</p>
        <p className="text-xs text-muted-foreground">
          Открой письмо и нажми на ссылку — тебя перебросит обратно.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="твой@email.com"
        required
        className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 transition-colors"
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Отправить magic link
      </button>
    </form>
  );
}
