'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dices } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
          <Dices size={18} className="text-primary" />
          <span className="text-sm">DBD Randomizer</span>
        </Link>

        {isHome ? (
          <Link
            href="/roll"
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            К рандомайзеру
          </Link>
        ) : (
          <Link
            href="/"
            className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            На главную
          </Link>
        )}
      </div>
    </header>
  );
}
