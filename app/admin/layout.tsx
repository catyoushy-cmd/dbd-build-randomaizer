import { requireAdmin } from '@/lib/admin/auth';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/admin', label: 'Дашборд' },
  { href: '/admin/build-cores', label: 'BuildCores' },
  { href: '/admin/content', label: 'Контент' },
  { href: '/admin/articles', label: 'Статьи' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-bg-deep">
      {/* Admin top bar */}
      <header className="sticky top-0 z-40 border-b border-line-2 bg-bg-1">
        <div className="mx-auto max-w-[1100px] px-5 h-12 flex items-center gap-6">
          <span className="label-mono text-[10px] text-dbd-accent tracking-[.2em]">ADMIN</span>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1 font-sans text-[12px] text-ink-mute hover:text-dbd-bone transition-colors duration-150"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto">
            <Link
              href="/"
              className="label-mono text-[10px] text-ink-faint hover:text-ink-mute transition-colors duration-150"
            >
              ← На сайт
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[1100px] px-5 py-8">
        {children}
      </main>
    </div>
  );
}
