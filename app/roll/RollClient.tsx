'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { rollBuild, type BuildInput } from '@/lib/random/algorithm';
import { applyPins, type Pins } from '@/lib/random/pinning';
import { encodeShort } from '@/lib/url/encode';
import { KILLERS, SURVIVORS, PERKS, ITEMS, ADDONS, OFFERINGS } from '@/lib/data';
import { pushHistory } from '@/lib/history';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { BuildResult } from './BuildResult';
import type { Build, BuildMode } from '@/lib/data';

const MODE_OPTIONS: { value: BuildMode; label: string; glyph: string; desc: string }[] = [
  { value: 'random',    label: 'Рандом',        glyph: '⚄', desc: 'Полная лотерея' },
  { value: 'efficient', label: 'Эффективность', glyph: '⚡', desc: 'Синергичный' },
  { value: 'fun',       label: 'Веселье',       glyph: '✦', desc: 'Гиммик-билды' },
];

const EMPTY_PINS = {
  perks:    [false, false, false, false],
  item:     false,
  addons:   [false, false],
  offering: false,
};

function toApiPins(pins: typeof EMPTY_PINS, build: Build | null): Pins {
  if (!build) return {};
  return {
    perks:    pins.perks.map((p, i) => (p ? build.perks[i]?.id ?? null : null)),
    item:     pins.item ? (build.item?.id ?? null) : null,
    addons:   pins.addons.map((p, i) => (p ? build.addons[i]?.id ?? null : null)),
    offering: pins.offering ? build.offering.id : null,
  };
}

function hasPins(pins: typeof EMPTY_PINS) {
  return pins.perks.some(Boolean) || pins.item || pins.addons.some(Boolean) || pins.offering;
}

const ALL_DATA = { perks: PERKS, items: ITEMS, addons: ADDONS, offerings: OFFERINGS };

export function RollClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const pathname     = usePathname();

  const [role,    setRole]    = useState<'survivor' | 'killer'>('survivor');
  const [charId,  setCharId]  = useState<string>('any');
  const [mode,    setMode]    = useState<BuildMode>('random');
  const [build,   setBuild]   = useState<Build | null>(null);
  const [pins,    setPins]    = useState(EMPTY_PINS);

  /* Hydrate from URL on mount */
  useEffect(() => {
    const seedParam = searchParams.get('seed');
    const roleParam = searchParams.get('role') as 'survivor' | 'killer' | null;
    const charParam = searchParams.get('char');
    const modeParam = searchParams.get('mode') as BuildMode | null;

    if (seedParam && roleParam && modeParam) {
      const seed = parseInt(seedParam, 10);
      if (!isNaN(seed)) {
        const r = roleParam;
        const m = modeParam;
        const c = charParam ?? 'any';
        setRole(r);
        setCharId(c);
        setMode(m);
        const input: BuildInput = {
          role: r,
          killerId:   r === 'killer'   && c !== 'any' ? c : null,
          survivorId: r === 'survivor' && c !== 'any' ? c : null,
          mode: m,
          seed,
        };
        setBuild(rollBuild(input));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUrl = useCallback((newBuild: Build) => {
    const charParam = newBuild.role === 'killer'
      ? (newBuild.killerId   ?? 'any')
      : (newBuild.survivorId ?? 'any');
    const params = new URLSearchParams({
      role: newBuild.role,
      char: charParam,
      mode: newBuild.mode,
      seed: String(newBuild.seed),
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router]);

  const handleRoll = useCallback(() => {
    const seed  = crypto.getRandomValues(new Uint32Array(1))[0];
    const input: BuildInput = {
      role,
      killerId:   role === 'killer'   && charId !== 'any' ? charId : null,
      survivorId: role === 'survivor' && charId !== 'any' ? charId : null,
      mode,
      seed,
    };

    let newBuild = rollBuild(input);

    if (build && hasPins(pins)) {
      newBuild = applyPins(newBuild, toApiPins(pins, build), ALL_DATA);
    }

    const nextPins = {
      perks:    pins.perks.map((p) => p),
      item:     pins.item,
      addons:   pins.addons.map((p) => p),
      offering: pins.offering,
    };

    setBuild(newBuild);
    setPins(nextPins);
    updateUrl(newBuild);

    if (newBuild.fallback) {
      toast.warning('Ядро недоступно — выдан полный рандом');
    }

    const charLabel = role === 'killer'
      ? (KILLERS.find(k => k.id === (charId !== 'any' ? charId : ''))?.name.ru ?? 'Любой')
      : (SURVIVORS.find(s => s.id === (charId !== 'any' ? charId : ''))?.name.ru ?? 'Любой');

    const modeLabel = MODE_OPTIONS.find(m2 => m2.value === mode)?.label ?? mode;
    const roleLabel = role === 'killer' ? 'Убийца' : 'Выживший';
    const code = encodeShort(newBuild);

    pushHistory({
      code,
      role,
      charId:    charId !== 'any' ? charId : null,
      mode,
      seed,
      label:     `${roleLabel} / ${charLabel} / ${modeLabel}`,
      ts:        Date.now(),
    });
  }, [role, charId, mode, build, pins, updateUrl]);

  const handleRerollAddons = useCallback(() => {
    if (!build) return;
    const newSeed = crypto.getRandomValues(new Uint32Array(1))[0];
    const tempBuild = rollBuild({ role: build.role, killerId: build.killerId, survivorId: build.survivorId, mode: build.mode, seed: newSeed });
    const nextAddons = pins.addons.map((p, i) =>
      p ? build.addons[i] : (tempBuild.addons[i] ?? build.addons[i])
    );
    const nextItem = pins.item ? build.item : (build.role === 'survivor' ? (tempBuild.item ?? build.item) : null);
    setBuild({ ...build, addons: nextAddons, item: nextItem });
  }, [build, pins]);

  const handleRerollOffering = useCallback(() => {
    if (!build || pins.offering) return;
    const newSeed = crypto.getRandomValues(new Uint32Array(1))[0];
    const tempBuild = rollBuild({ role: build.role, killerId: build.killerId, survivorId: build.survivorId, mode: build.mode, seed: newSeed });
    setBuild({ ...build, offering: tempBuild.offering });
  }, [build, pins]);

  const shareUrl = build
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/build/${encodeShort(build)}`
    : '';

  const characters = role === 'killer' ? KILLERS : SURVIVORS;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '48px 40px 80px',
      }}
    >
      {/* Page title */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <span className="label-mono" style={{ color: 'var(--ink-mute)', fontSize: 10 }}>Алтарь призыва</span>
        <h1
          style={{
            margin: '8px 0 0',
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--dbd-bone)',
            letterSpacing: '-.01em',
          }}
        >
          Бросить жребий
        </h1>
      </div>

      {/* ── Controls panel ── */}
      <div
        style={{
          border: '1px solid var(--line-2)',
          background: 'var(--bg-1)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        {/* Role */}
        <ControlGroup label="I. Роль">
          <div style={{ display: 'flex' }}>
            {(['survivor', 'killer'] as const).map((r) => (
              <button
                key={r}
                onClick={() => { setRole(r); setCharId('any'); setBuild(null); setPins(EMPTY_PINS); }}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  fontFamily: 'var(--font-sans, Manrope, system-ui)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '.15em',
                  textTransform: 'uppercase',
                  background: role === r ? 'var(--dbd-accent)' : 'transparent',
                  color: role === r ? '#fff' : 'var(--ink-mute)',
                  border: 'none',
                  borderBottom: `2px solid ${role === r ? 'var(--dbd-accent-glow)' : 'var(--line-2)'}`,
                  cursor: 'pointer',
                  transition: 'all .18s ease',
                }}
              >
                {r === 'survivor' ? 'Выживший' : 'Убийца'}
              </button>
            ))}
          </div>
        </ControlGroup>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--line-1)' }} />

        {/* Character */}
        <ControlGroup label="II. Персонаж">
          <Select
            value={charId}
            onValueChange={(v) => { setCharId(v as string); setBuild(null); setPins(EMPTY_PINS); }}
          >
            <SelectTrigger
              style={{
                width: '100%',
                background: 'var(--bg-2)',
                border: '1px solid var(--line-2)',
                borderRadius: 0,
                color: 'var(--ink)',
                fontFamily: 'var(--font-sans, Manrope, system-ui)',
                fontSize: 13,
              }}
            >
              <span style={{ flex: 1, textAlign: 'left', fontSize: 13 }}>
                {charId === 'any'
                  ? (role === 'survivor' ? 'Любой выживший' : 'Любой убийца')
                  : (characters.find(c => c.id === charId)?.name.ru ?? charId)}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">
                {role === 'survivor' ? 'Любой выживший' : 'Любой убийца'}
              </SelectItem>
              {characters.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name.ru}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ControlGroup>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--line-1)' }} />

        {/* Mode */}
        <ControlGroup label="III. Режим">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 8px',
                  border: `1px solid ${mode === opt.value ? 'var(--line-ember)' : 'var(--line-1)'}`,
                  background: mode === opt.value ? 'rgba(184,67,31,.12)' : 'var(--bg-2)',
                  cursor: 'pointer',
                  transition: 'all .18s ease',
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, color: mode === opt.value ? 'var(--dbd-accent)' : 'var(--ink-faint)' }}>
                  {opt.glyph}
                </span>
                <span
                  className="label-mono"
                  style={{
                    fontSize: 9,
                    color: mode === opt.value ? 'var(--dbd-bone)' : 'var(--ink-mute)',
                    letterSpacing: '.15em',
                  }}
                >
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </ControlGroup>

        {/* Roll button */}
        <button
          onClick={handleRoll}
          className="ritual-btn ritual-btn-primary"
          style={{
            width: '100%',
            padding: '18px',
            fontSize: 15,
            letterSpacing: '.25em',
            marginTop: 4,
          }}
        >
          {build ? '✦ ПЕРЕБРОСИТЬ' : '✦ БРОСИТЬ'}
        </button>

        {!build && (
          <p
            className="label-mono"
            style={{ textAlign: 'center', fontSize: 9, color: 'var(--ink-faint)', marginTop: -8 }}
          >
            Клик по карточке в результате — закрепляет слот
          </p>
        )}
      </div>

      {/* ── Result ── */}
      {build && (
        <BuildResult
          build={build}
          pins={pins}
          onTogglePerkPin={(i) =>
            setPins((p) => ({ ...p, perks: p.perks.map((v, idx) => (idx === i ? !v : v)) }))
          }
          onToggleAddonPin={(i) =>
            setPins((p) => ({ ...p, addons: p.addons.map((v, idx) => (idx === i ? !v : v)) }))
          }
          onToggleItemPin={() => setPins((p) => ({ ...p, item: !p.item }))}
          onToggleOfferingPin={() => setPins((p) => ({ ...p, offering: !p.offering }))}
          onRerollAddons={handleRerollAddons}
          onRerollOffering={handleRerollOffering}
          shareUrl={shareUrl}
        />
      )}
    </div>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span className="label-mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
        {label}
      </span>
      {children}
    </div>
  );
}
