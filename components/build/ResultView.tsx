'use client';

import { PerkCard } from '@/app/roll/PerkCard';
import { AddonCard } from '@/app/roll/AddonCard';
import { ShapeCard, rarityColor, rarityLabel } from '@/components/ui/shape-card';
import { IconImg } from '@/components/ui/icon-img';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { EntityTooltipBody } from '@/components/ui/entity-tooltip';
import { cn } from '@/lib/utils';
import { formatDbdText } from '@/lib/dbd-text';
import type { Build } from '@/lib/data';
import type { PinState } from '@/lib/random/pinning';

const ITEM_TYPE_LABEL: Record<string, string> = {
  flashlight: 'Фонарик',
  medkit:     'Аптечка',
  toolbox:    'Инструменты',
  map:        'Карта',
  key:        'Ключ',
};

const ROLE_LABEL_OFFERING: Record<string, string> = {
  survivor: 'Выживший',
  killer:   'Убийца',
  both:     'Общее',
};

type Props = {
  build: Build;
  /** When provided, enables pin/reroll interactions */
  pins?: PinState;
  onTogglePerkPin?: (i: number) => void;
  onToggleAddonPin?: (i: number) => void;
  onToggleItemPin?: () => void;
  onToggleOfferingPin?: () => void;
  onRerollAddons?: () => void;
  onRerollOffering?: () => void;
};

export function ResultView({
  build,
  pins,
  onTogglePerkPin,
  onToggleAddonPin,
  onToggleItemPin,
  onToggleOfferingPin,
  onRerollAddons,
  onRerollOffering,
}: Props) {
  return (
    <div className="flex flex-col gap-7">

      {/* ── BuildCore banner ── */}
      {build.buildCore && (
        <div className="flex items-start gap-3 px-4 py-3 border border-line-ember bg-[rgba(184,67,31,.08)]">
          <span className="text-dbd-accent text-base leading-none shrink-0">✦</span>
          <div>
            <p className="m-0 font-sans font-bold text-[13px] text-dbd-bone">{build.buildCore.name}</p>
            <p className="m-0 mt-[3px] text-[12px] text-ink-mute">{build.buildCore.description}</p>
          </div>
        </div>
      )}

      {/* ── Fallback warning ── */}
      {build.fallback && (
        <div className="px-[14px] py-[10px] border border-dbd-blood bg-[rgba(122,23,23,.1)] text-[12px] text-dbd-blood">
          Ядро недоступно — выдан полный рандом.
        </div>
      )}

      {/* ── Perks ── */}
      <RitualSection title="Перки" label="4 жребия">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 justify-items-center">
          {build.perks.map((perk, i) => (
            <PerkCard
              key={perk.id}
              perk={perk}
              pinned={pins?.perks[i]}
              onTogglePin={onTogglePerkPin ? () => onTogglePerkPin(i) : undefined}
            />
          ))}
        </div>
      </RitualSection>

      {/* ── Survivor: Item + Addons ── */}
      {build.role === 'survivor' && build.item && (
        <RitualSection
          title="Предмет и аддоны"
          action={onRerollAddons ? <RerollBtn onClick={onRerollAddons}>↺ Перебросить</RerollBtn> : undefined}
        >
          <div className="flex flex-col gap-2">
            <ItemSlot
              item={build.item}
              pinned={pins?.item ?? false}
              onToggle={onToggleItemPin}
            />
            {build.addons.map((addon, i) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                pinned={pins?.addons[i]}
                onTogglePin={onToggleAddonPin ? () => onToggleAddonPin(i) : undefined}
              />
            ))}
          </div>
        </RitualSection>
      )}

      {/* ── Killer: Addons only ── */}
      {build.role === 'killer' && (
        <RitualSection
          title="Аддоны к силе"
          action={onRerollAddons ? <RerollBtn onClick={onRerollAddons}>↺ Перебросить</RerollBtn> : undefined}
        >
          <div className="flex flex-col gap-2">
            {build.addons.map((addon, i) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                pinned={pins?.addons[i]}
                onTogglePin={onToggleAddonPin ? () => onToggleAddonPin(i) : undefined}
              />
            ))}
          </div>
        </RitualSection>
      )}

      {/* ── Offering ── */}
      <RitualSection
        title="Подношение"
        action={onRerollOffering ? <RerollBtn onClick={onRerollOffering}>↺ Перебросить</RerollBtn> : undefined}
      >
        <OfferingSlot
          offering={build.offering}
          pinned={pins?.offering ?? false}
          onToggle={onToggleOfferingPin}
        />
      </RitualSection>

    </div>
  );
}

/* ── Section wrapper ── */
function RitualSection({
  title,
  label,
  action,
  children,
}: {
  title: string;
  label?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-[14px]">
        <h2 className="m-0 font-sans font-bold text-[13px] text-dbd-bone tracking-[.08em] uppercase">
          {title}
        </h2>
        {label && (
          <span className="label-mono text-[9px] text-ink-faint">{label}</span>
        )}
        <div className="flex-1 h-px bg-gradient-to-r from-line-2 to-transparent" />
        {action}
      </div>
      {children}
    </section>
  );
}

/* ── Item slot (survivor) ── */
function ItemSlot({
  item,
  pinned,
  onToggle,
}: {
  item: NonNullable<Build['item']>;
  pinned: boolean;
  onToggle?: () => void;
}) {
  const ring = rarityColor(item.rarity ?? 'common');
  const El = onToggle ? 'button' : 'div';

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <El
            onClick={onToggle}
            className={cn(
              'flex items-center gap-[14px] w-full px-[14px] py-[10px] bg-bg-1 text-left',
              'transition-[border-color] duration-[180ms] border',
              onToggle && 'cursor-pointer',
              pinned
                ? 'border-dbd-accent outline outline-1 outline-[rgba(184,67,31,.25)]'
                : 'border-line-2 outline-none',
            )}
          >
            <ShapeCard shape="rect" size={44} ringColor={ring} pinned={pinned}>
              <IconImg
                src={item.icon}
                alt={item.name.ru}
                size={28}
                fallback={
                  <span className="font-sans font-bold text-[13px]" style={{ color: ring }}>
                    {item.type[0].toUpperCase()}
                  </span>
                }
              />
            </ShapeCard>

            <div className="flex-1 min-w-0">
              <span className={cn('block font-sans text-[13px] font-semibold', pinned ? 'text-dbd-bone' : 'text-ink')}>
                {item.name.ru}
              </span>
              <span className="label-mono text-[9px] mt-[2px] block" style={{ color: ring }}>
                {item.type}
              </span>
            </div>

            {pinned && (
              <span className="label-mono text-[9px] text-dbd-accent shrink-0">✦</span>
            )}
          </El>
        }
      />
      <TooltipContent side="top" style={{ background: 'transparent', border: 'none', padding: 0 }}>
        <EntityTooltipBody
          title={item.name.ru}
          subtitle={{ text: rarityLabel(item.rarity ?? 'common').toUpperCase(), color: ring }}
          meta={[
            { label: 'Тип', value: ITEM_TYPE_LABEL[item.type] ?? item.type },
          ]}
          description={item.description?.ru ? formatDbdText(item.description.ru) : undefined}
        />
      </TooltipContent>
    </Tooltip>
  );
}

/* ── Offering slot ── */
function OfferingSlot({
  offering,
  pinned,
  onToggle,
}: {
  offering: Build['offering'];
  pinned: boolean;
  onToggle?: () => void;
}) {
  const ring = rarityColor(offering.rarity ?? 'common');
  const El = onToggle ? 'button' : 'div';

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <El
            onClick={onToggle}
            className={cn(
              'flex items-center gap-[14px] w-full px-[14px] py-[10px] bg-bg-1 text-left',
              'transition-[border-color] duration-[180ms] border',
              onToggle && 'cursor-pointer',
              pinned
                ? 'border-dbd-accent outline outline-1 outline-[rgba(184,67,31,.25)]'
                : 'border-line-2 outline-none',
            )}
          >
            <ShapeCard shape="pentagon" size={52} ringColor={ring} pinned={pinned}>
              <IconImg
                src={offering.icon}
                alt={offering.name.ru}
                size={28}
                fallback={
                  <span className="font-sans font-bold text-[13px]" style={{ color: ring }}>П</span>
                }
              />
            </ShapeCard>

            <div className="flex-1 min-w-0">
              <span className={cn('block font-sans text-[13px] font-semibold', pinned ? 'text-dbd-bone' : 'text-ink')}>
                {offering.name.ru}
              </span>
              {offering.rarity && (
                <span className="label-mono text-[9px] mt-[2px] block" style={{ color: ring }}>
                  {offering.rarity.replace(/-/g, ' ')}
                </span>
              )}
            </div>

            {pinned && (
              <span className="label-mono text-[9px] text-dbd-accent shrink-0">✦</span>
            )}
          </El>
        }
      />
      <TooltipContent side="top" style={{ background: 'transparent', border: 'none', padding: 0 }}>
        <EntityTooltipBody
          title={offering.name.ru}
          subtitle={{ text: rarityLabel(offering.rarity ?? 'common').toUpperCase(), color: ring }}
          meta={[
            { label: 'Сторона', value: ROLE_LABEL_OFFERING[offering.role] ?? offering.role },
          ]}
          description={offering.description?.ru ? formatDbdText(offering.description.ru) : undefined}
        />
      </TooltipContent>
    </Tooltip>
  );
}

function RerollBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="label-mono text-[9px] text-ink-faint bg-transparent border-none cursor-pointer px-[6px] py-[2px] hover:text-ink-mute transition-colors duration-150"
    >
      {children}
    </button>
  );
}
