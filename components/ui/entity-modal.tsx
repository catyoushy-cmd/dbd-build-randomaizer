'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Lightweight modal/lightbox for showing perk/offering details on click.
 * Uses native dialog semantics + ESC close + backdrop click.
 */
export function EntityModal({ open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg-deep/85 backdrop-blur-sm" />

      {/* Body */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-[520px] w-full max-h-[85vh] overflow-y-auto bg-bg-1 border border-line-ember shadow-[0_24px_80px_rgba(0,0,0,.7)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-ink-mute hover:text-dbd-bone bg-transparent border border-line-1 hover:border-line-ember transition-colors z-10"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
