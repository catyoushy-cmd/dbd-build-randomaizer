'use client';

import { useState } from 'react';
import { SaveBuildButton } from './SaveBuildButton';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ResultView } from '@/components/build/ResultView';
import type { Build } from '@/lib/data';
import type { PinState } from '@/lib/random/pinning';

type Props = {
  build: Build;
  pins: PinState;
  onTogglePerkPin: (i: number) => void;
  onToggleAddonPin: (i: number) => void;
  onToggleItemPin: () => void;
  onToggleOfferingPin: () => void;
  onRerollAddons: () => void;
  onRerollOffering: () => void;
  shareUrl: string;
};

export function BuildResult({
  build,
  pins,
  onTogglePerkPin,
  onToggleAddonPin,
  onToggleItemPin,
  onToggleOfferingPin,
  onRerollAddons,
  onRerollOffering,
  shareUrl,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="animate-fade-up mt-8 flex flex-col gap-7">
      <ResultView
        build={build}
        pins={pins}
        onTogglePerkPin={onTogglePerkPin}
        onToggleAddonPin={onToggleAddonPin}
        onToggleItemPin={onToggleItemPin}
        onToggleOfferingPin={onToggleOfferingPin}
        onRerollAddons={onRerollAddons}
        onRerollOffering={onRerollOffering}
      />

      {/* ── Actions ── */}
      <div className="flex items-center justify-between gap-3">
        <SaveBuildButton build={build} pins={pins} />
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={handleCopy}
                className="ritual-btn ritual-btn-ghost px-4 py-2 text-[11px]"
              >
                {copied ? '✓ Скопировано' : '⎘ Скопировать ссылку'}
              </button>
            }
          />
          <TooltipContent side="top">
            Ссылка воспроизведёт точно такой же билд
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
