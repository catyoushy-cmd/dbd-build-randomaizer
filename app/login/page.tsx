import { LoginForm } from './LoginForm';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold">Войти</h1>
          <p className="text-sm text-muted-foreground">
            Для сохранения именованных билдов
          </p>
        </div>

        {searchParams.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Не удалось войти. Попробуй ещё раз.
          </div>
        )}

        <LoginForm next={searchParams.next ?? '/roll'} />

        <p className="text-center text-xs text-muted-foreground">
          Без регистрации — просто введи email, придёт magic link.
        </p>
      </div>
    </div>
  );
}
