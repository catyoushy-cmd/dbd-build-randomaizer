import { LoginForm } from './LoginForm';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <div className="mx-auto max-w-[400px] px-5 pt-16 pb-20">
      <div className="border border-line-2 bg-bg-1 p-7 flex flex-col gap-6">
        <div className="text-center flex flex-col gap-1">
          <span className="label-mono text-[10px] text-ink-faint">Доступ к алтарю</span>
          <h1 className="m-0 text-[24px] font-extrabold text-dbd-bone">Войти</h1>
          <p className="m-0 text-[13px] text-ink-mute">
            Для сохранения именованных билдов
          </p>
        </div>

        {searchParams.error && (
          <div className="px-3 py-[10px] border border-dbd-blood bg-[rgba(122,23,23,.1)] text-[12px] text-dbd-blood">
            Не удалось войти. Попробуй ещё раз.
          </div>
        )}

        <LoginForm next={searchParams.next ?? '/roll'} />

        <p className="text-center text-[11px] text-ink-faint">
          Без регистрации — просто введи email, придёт magic link.
        </p>
      </div>
    </div>
  );
}
