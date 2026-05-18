'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        borderBottom: '1px solid var(--line-1)',
        background: 'rgba(11,9,8,.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 40px',
          height: 58,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        {/* Wordmark */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
          }}
        >
          <RitualWordmark />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span
              style={{
                fontFamily: 'var(--font-sans, Manrope, system-ui)',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: 'var(--dbd-bone)',
              }}
            >
              Build Randomaizer
            </span>
            <span
              className="label-mono"
              style={{ fontSize: 10, letterSpacing: '.18em' }}
            >
              Dead by Daylight
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <NavTab href="/" active={isHome}>Алтарь</NavTab>
          <NavTab href="/roll" active={pathname?.startsWith('/roll')}>Жребий</NavTab>
        </nav>

        {/* Right action */}
        {isHome ? (
          <Link
            href="/roll"
            className="ritual-btn ritual-btn-primary"
            style={{ padding: '9px 20px', fontSize: 11, textDecoration: 'none' }}
          >
            Бросить
          </Link>
        ) : (
          <Link
            href="/"
            className="ritual-btn ritual-btn-ghost"
            style={{ padding: '9px 20px', fontSize: 11, textDecoration: 'none' }}
          >
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
      style={{
        padding: '8px 14px',
        fontFamily: 'var(--font-sans, Manrope, system-ui)',
        fontSize: 12,
        letterSpacing: '.18em',
        textTransform: 'uppercase',
        fontWeight: 600,
        color: active ? 'var(--dbd-bone)' : 'var(--ink-mute)',
        borderTop: active
          ? '1px solid var(--dbd-accent)'
          : '1px solid transparent',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        textDecoration: 'none',
        transition: 'color .15s ease, border-color .15s ease',
      }}
    >
      {children}
    </Link>
  );
}
