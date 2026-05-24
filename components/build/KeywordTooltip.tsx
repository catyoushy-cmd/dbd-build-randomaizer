'use client';

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { EntityTooltipBody } from '@/components/ui/entity-tooltip';
import { IconImg } from '@/components/ui/icon-img';
import type { StatusEffect } from '@/lib/data';

const CATEGORY_LABEL: Record<string, string> = {
  debuff:  'Дебаф',
  buff:    'Баф',
  general: 'Общее',
  aura:    'Аура',
  status:  'Состояние',
};

const CATEGORY_COLOR: Record<string, string> = {
  debuff:  'var(--r-rare)',     // green-ish so it stays neutral despite being a "bad" effect
  buff:    'var(--dbd-accent)',
  aura:    'var(--dbd-brass)',
  status:  'var(--ink-mute)',
  general: 'var(--ink-mute)',
};

type Props = {
  effect: StatusEffect;
  children: React.ReactNode;
};

/**
 * Wraps an inline keyword like «Истощение» in a tooltip that resolves the
 * status effect description from the `status_effects` table.
 */
export function KeywordTooltip({ effect, children }: Props) {
  const color = CATEGORY_COLOR[effect.category] ?? 'var(--ink-mute)';
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="dbd-keyword" data-keyword={effect.source_key ?? effect.id}>{children}</span>} />
      <TooltipContent side="top" style={{ background: 'transparent', border: 'none', padding: 0 }}>
        <EntityTooltipBody
          title={effect.name.ru || effect.name.en}
          subtitle={{
            text: CATEGORY_LABEL[effect.category] ?? effect.category,
            color,
          }}
          description={
            <div className="flex gap-3">
              {effect.icon && (
                <div
                  className="w-10 h-10 shrink-0 border bg-bg-2 flex items-center justify-center overflow-hidden"
                  style={{ borderColor: color }}
                >
                  <IconImg src={effect.icon} alt="" size={36} fallback={null} />
                </div>
              )}
              <p className="m-0 font-sans text-[12.5px] text-ink leading-[1.55] whitespace-pre-line">
                {effect.description?.ru || effect.description?.en}
              </p>
            </div>
          }
        />
      </TooltipContent>
    </Tooltip>
  );
}
