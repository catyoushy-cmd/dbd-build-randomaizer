'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

function RitualWordmark() {
  return (
    <svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true">
      <polygon
        points="20,4 36,12 36,28 20,36 4,28 4,12"
        fill="none"
        stroke="var(--dbd-accent)"
        strokeWidth="1.2"
      />
      <polygon
        points="20,11 29,15.5 29,24.5 20,29 11,24.5 11,15.5"
        fill="none"
        stroke="var(--dbd-brass)"
        strokeWidth=".8"
      />
      <circle cx="20" cy="20" r="2" fill="var(--dbd-accent)" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-40 border-b border-line-1 bg-[rgba(11,9,8,.85)] backdrop-blur-[12px] [-webkit-backdrop-filter:blur(12px)]">
      <div className="mx-auto flex items-center justify-between px-4 sm:px-10 gap-3 sm:gap-6 h-[58px] max-w-[1280px]">

        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-3 no-underline">
          <RitualWordmark />
          <div className="flex flex-col leading-[1.1]">
            <span className="font-sans font-bold text-[13px] tracking-[.12em] uppercase text-dbd-bone">
              Build Randomaizer
            </span>
            <span className="label-mono text-[10px] tracking-[.18em]">
              Dead by Daylight
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-0.5">
          <NavTab href="/" active={isHome}>Алтарь</NavTab>
          <NavTab href="/roll" active={pathname?.startsWith('/roll')}>Жребий</NavTab>
        </nav>

        {/* Right action */}
        {isHome ? (
          <Link href="/roll" className="ritual-btn ritual-btn-primary px-5 py-[9px] text-[11px] no-underline">
            Бросить
          </Link>
        ) : (
          <Link href="/" className="ritual-btn ritual-btn-ghost px-5 py-[9px] text-[11px] no-underline">
            ← Алтарь
          </Link>
        )}
      </div>
    </header>
  );
}

function NavTab({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'px-[14px] py-2 font-sans text-[12px] tracking-[.18em] uppercase font-semibold no-underline',
        'border-0 border-t border-solid transition-[color,border-color] duration-150',
        active ? 'text-dbd-bone border-t-dbd-accent' : 'text-ink-mute border-t-transparent',
      )}
    >
      {children}
    </Link>
  );
}
