'use client';

import { useState } from 'react';
import { PerkCard } from './PerkCard';
import { AddonCard } from './AddonCard';
import { SaveBuildButton } from './SaveBuildButton';
import { ShapeCard, rarityColor } from '@/components/ui/shape-card';
import { IconImg } from '@/components/ui/icon-img';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Build } from '@/lib/data';
import type { PinState } from '@/lib/random/pinning';
import { formatDbdText } from '@/lib/dbd-text';

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
    <div className="animate-fade-up" style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Build core banner */}
      {build.buildCore && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '12px 16px',
            border: '1px solid var(--line-ember)',
            background: 'rgba(184,67,31,.08)',
          }}
        >
          <span style={{ color: 'var(--dbd-accent)', fontSize: 16, lineHeight: 1, flexShrink: 0 }}>✦</span>
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-sans, Manrope, system-ui)',
                fontWeight: 700,
                fontSize: 13,
                color: 'var(--dbd-bone)',
              }}
            >
              {build.buildCore.name}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-mute)' }}>
              {build.buildCore.description}
            </p>
          </div>
        </div>
      )}

      {/* Fallback warning */}
      {build.fallback && (
        <div
          style={{
            padding: '10px 14px',
            border: '1px solid var(--dbd-blood)',
            background: 'rgba(122,23,23,.1)',
            fontSize: 12,
            color: 'var(--dbd-blood)',
          }}
        >
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
              pinned={pins.perks[i]}
              onTogglePin={() => onTogglePerkPin(i)}
            />
          ))}
        </div>
      </RitualSection>

      {/* ── Survivor: Item + Addons ── */}
      {build.role === 'survivor' && build.item && (
        <RitualSection
          title="Предмет и аддоны"
          action={<RerollBtn onClick={onRerollAddons}>↺ Перебросить</RerollBtn>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ItemSlot
              item={build.item}
              pinned={pins.item}
              onToggle={onToggleItemPin}
            />
            {build.addons.map((addon, i) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                pinned={pins.addons[i]}
                onTogglePin={() => onToggleAddonPin(i)}
              />
            ))}
          </div>
        </RitualSection>
      )}

      {/* ── Killer: Addons only ── */}
      {build.role === 'killer' && (
        <RitualSection
          title="Аддоны к силе"
          action={<RerollBtn onClick={onRerollAddons}>↺ Перебросить</RerollBtn>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {build.addons.map((addon, i) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                pinned={pins.addons[i]}
                onTogglePin={() => onToggleAddonPin(i)}
              />
            ))}
          </div>
        </RitualSection>
      )}

      {/* ── Offering ── */}
      <RitualSection
        title="Подношение"
        action={<RerollBtn onClick={onRerollOffering}>↺ Перебросить</RerollBtn>}
      >
        <OfferingSlot
          offering={build.offering}
          pinned={pins.offering}
          onToggle={onToggleOfferingPin}
        />
      </RitualSection>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <SaveBuildButton build={build} pins={pins} />
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={handleCopy}
                className="ritual-btn ritual-btn-ghost"
                style={{ padding: '8px 16px', fontSize: 11 }}
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-sans, Manrope, system-ui)',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--dbd-bone)',
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h2>
        {label && (
          <span className="label-mono" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>
            {label}
          </span>
        )}
        <div
          style={{
            flex: 1,
            height: 1,
            background: 'linear-gradient(to right, var(--line-2), transparent)',
          }}
        />
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
  onToggle: () => void;
}) {
  const ring = rarityColor(item.rarity ?? 'common');
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            onClick={onToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              width: '100%',
              padding: '10px 14px',
              background: 'var(--bg-1)',
              border: `1px solid ${pinned ? 'var(--dbd-accent)' : 'var(--line-2)'}`,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color .18s ease',
              outline: pinned ? '1px solid rgba(184,67,31,.25)' : 'none',
            }}
          >
            <ShapeCard shape="rect" size={44} ringColor={ring} pinned={pinned}>
              <IconImg
                src={item.icon}
                alt={item.name.ru}
                size={28}
                fallback={
                  <span style={{ fontFamily: 'var(--font-sans, Manrope, system-ui)', fontWeight: 700, fontSize: 13, color: ring }}>
                    {item.type[0].toUpperCase()}
                  </span>
                }
              />
            </ShapeCard>

            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-sans, Manrope, system-ui)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: pinned ? 'var(--dbd-bone)' : 'var(--ink)',
                }}
              >
                {item.name.ru}
              </span>
              <span className="label-mono" style={{ fontSize: 9, color: ring, marginTop: 2, display: 'block' }}>
                {item.type}
              </span>
            </div>

            {pinned && (
              <span className="label-mono" style={{ fontSize: 9, color: 'var(--dbd-accent)', flexShrink: 0 }}>✦</span>
            )}
          </button>
        }
      />
      <TooltipContent
        side="top"
        style={{
          maxWidth: 280,
          textAlign: 'left',
          background: 'linear-gradient(to bottom, rgba(20,17,15,.97), rgba(11,9,8,.97))',
          border: '1px solid var(--line-2)',
          borderRadius: 0,
          padding: '12px 14px',
        }}
      >
        <div style={{ fontFamily: 'var(--font-sans, Manrope, system-ui)', fontWeight: 700, fontSize: 14, color: 'var(--dbd-bone)' }}>
          {item.name.ru}
        </div>
        {item.description?.ru && (
          <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5, marginTop: 8, whiteSpace: 'pre-line' }}>
            {formatDbdText(item.description.ru)}
          </div>
        )}
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
  onToggle: () => void;
}) {
  const ring = rarityColor(offering.rarity ?? 'common');
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            onClick={onToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              width: '100%',
              padding: '10px 14px',
              background: 'var(--bg-1)',
              border: `1px solid ${pinned ? 'var(--dbd-accent)' : 'var(--line-2)'}`,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color .18s ease',
              outline: pinned ? '1px solid rgba(184,67,31,.25)' : 'none',
            }}
          >
            <ShapeCard shape="pentagon" size={52} ringColor={ring} pinned={pinned}>
              <IconImg
                src={offering.icon}
                alt={offering.name.ru}
                size={28}
                fallback={
                  <span style={{ fontFamily: 'var(--font-sans, Manrope, system-ui)', fontWeight: 700, fontSize: 13, color: ring }}>
                    П
                  </span>
                }
              />
            </ShapeCard>

            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-sans, Manrope, system-ui)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: pinned ? 'var(--dbd-bone)' : 'var(--ink)',
                }}
              >
                {offering.name.ru}
              </span>
              {offering.rarity && (
                <span className="label-mono" style={{ fontSize: 9, color: ring, marginTop: 2, display: 'block' }}>
                  {offering.rarity.replace(/-/g, ' ')}
                </span>
              )}
            </div>

            {pinned && (
              <span className="label-mono" style={{ fontSize: 9, color: 'var(--dbd-accent)', flexShrink: 0 }}>✦</span>
            )}
          </button>
        }
      />
      <TooltipContent
        side="top"
        style={{
          maxWidth: 280,
          textAlign: 'left',
          background: 'linear-gradient(to bottom, rgba(20,17,15,.97), rgba(11,9,8,.97))',
          border: '1px solid var(--line-2)',
          borderRadius: 0,
          padding: '12px 14px',
        }}
      >
        <div style={{ fontFamily: 'var(--font-sans, Manrope, system-ui)', fontWeight: 700, fontSize: 14, color: 'var(--dbd-bone)' }}>
          {offering.name.ru}
        </div>
        {offering.description?.ru && (
          <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5, marginTop: 8, whiteSpace: 'pre-line' }}>
            {formatDbdText(offering.description.ru)}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function RerollBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="label-mono"
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--ink-faint)',
        fontSize: 9,
        padding: '2px 6px',
        transition: 'color .15s ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-mute)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-faint)'; }}
    >
      {children}
    </button>
  );
}
