'use client';

import { useState } from 'react';
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

const NAV_ITEMS = [
  { href: '/',          label: 'Алтарь',     match: (p: string) => p === '/' },
  { href: '/roll',      label: 'Жребий',     match: (p: string) => p.startsWith('/roll') },
  { href: '/perks',     label: 'Перки',      match: (p: string) => p.startsWith('/perks') },
  { href: '/items',     label: 'Предметы',   match: (p: string) => p.startsWith('/items') },
  { href: '/addons',    label: 'Аддоны',     match: (p: string) => p.startsWith('/addons') },
  { href: '/offerings', label: 'Подношения', match: (p: string) => p.startsWith('/offerings') },
];

export function Header() {
  const pathname = usePathname() ?? '/';
  const isHome = pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line-1 bg-[rgba(11,9,8,.85)] backdrop-blur-[12px] [-webkit-backdrop-filter:blur(12px)]">
      <div className="mx-auto flex items-center justify-between px-4 sm:px-10 gap-3 sm:gap-6 h-[58px] max-w-[1280px]">

        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-3 no-underline shrink-0">
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

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavTab key={item.href} href={item.href} active={item.match(pathname)}>
              {item.label}
            </NavTab>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label="Меню"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden w-10 h-10 flex items-center justify-center border border-line-2 text-ink hover:text-dbd-bone hover:border-line-ember transition-colors"
          >
            {menuOpen ? <CloseIcon /> : <BurgerIcon />}
          </button>

          {/* Right action — hidden on mobile to save space */}
          {isHome ? (
            <Link href="/roll" className="hidden sm:inline-block ritual-btn ritual-btn-primary px-5 py-[9px] text-[11px] no-underline">
              Бросить
            </Link>
          ) : (
            <Link href="/" className="hidden sm:inline-block ritual-btn ritual-btn-ghost px-5 py-[9px] text-[11px] no-underline">
              ← Алтарь
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-line-1 bg-bg-1">
          <ul className="m-0 p-0 list-none flex flex-col">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'block px-5 py-3 font-sans text-[13px] tracking-[.12em] uppercase font-semibold no-underline border-b border-line-1 transition-colors',
                    item.match(pathname)
                      ? 'text-dbd-bone bg-[rgba(184,67,31,.1)]'
                      : 'text-ink hover:text-dbd-bone hover:bg-bg-2',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
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

function BurgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
