'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { rollBuild, type BuildInput } from '@/lib/random/algorithm';
import type { BuildCore } from '@/lib/data';
import {
  applyPins,
  EMPTY_PIN_STATE,
  hasAnyPins,
  pinStateToApiPins,
} from '@/lib/random/pinning';
import { encodeShort } from '@/lib/url/encode';
import { KILLERS, SURVIVORS, PERKS, ITEMS, ADDONS, OFFERINGS } from '@/lib/data';
import { pushHistory } from '@/lib/history';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { BuildResult } from './BuildResult';
import type { Build, BuildMode } from '@/lib/data';

type Props = {
  buildCores?: BuildCore[];
};

const MODE_OPTIONS: { value: BuildMode; label: string; glyph: string; desc: string }[] = [
  { value: 'random',    label: 'Рандом',        glyph: '⚄', desc: 'Полная лотерея' },
  { value: 'efficient', label: 'Эффективность', glyph: '⚡', desc: 'Синергичный' },
  { value: 'fun',       label: 'Веселье',       glyph: '✦', desc: 'Гиммик-билды' },
];

const ALL_DATA = { perks: PERKS, items: ITEMS, addons: ADDONS, offerings: OFFERINGS };

export function RollClient({ buildCores }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const pathname     = usePathname();

  const [role,    setRole]    = useState<'survivor' | 'killer'>('survivor');
  const [charId,  setCharId]  = useState<string>('any');
  const [mode,    setMode]    = useState<BuildMode>('random');
  const [build,   setBuild]   = useState<Build | null>(null);
  const [pins,    setPins]    = useState(EMPTY_PIN_STATE);

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
        setBuild(rollBuild(input, buildCores));
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

    let newBuild = rollBuild(input, buildCores);

    if (build && hasAnyPins(pins)) {
      newBuild = applyPins(newBuild, pinStateToApiPins(pins, build), ALL_DATA);
    }

    setBuild(newBuild);
    updateUrl(newBuild);

    if (newBuild.fallback) {
      toast.warning('Ядро недоступно — выдан полный рандом');
    }

    const charName = role === 'killer'
      ? KILLERS.find(k => k.id === charId)?.name.ru
      : SURVIVORS.find(s => s.id === charId)?.name.ru;
    const charLabel = charName ?? 'Любой';
    const modeLabel = MODE_OPTIONS.find(m2 => m2.value === mode)?.label ?? mode;
    const roleLabel = role === 'killer' ? 'Убийца' : 'Выживший';

    pushHistory({
      code:   encodeShort(newBuild),
      role,
      charId: charId !== 'any' ? charId : null,
      mode,
      seed,
      label:  `${roleLabel} / ${charLabel} / ${modeLabel}`,
      ts:     Date.now(),
    });
  }, [role, charId, mode, build, pins, updateUrl, buildCores]);

  const handleRerollAddons = useCallback(() => {
    if (!build) return;
    const newSeed = crypto.getRandomValues(new Uint32Array(1))[0];
    const tempBuild = rollBuild({ role: build.role, killerId: build.killerId, survivorId: build.survivorId, mode: build.mode, seed: newSeed }, buildCores);
    const nextAddons = pins.addons.map((p, i) =>
      p ? build.addons[i] : (tempBuild.addons[i] ?? build.addons[i])
    );
    const nextItem = pins.item ? build.item : (build.role === 'survivor' ? (tempBuild.item ?? build.item) : null);
    setBuild({ ...build, addons: nextAddons, item: nextItem });
  }, [build, pins, buildCores]);

  const handleRerollOffering = useCallback(() => {
    if (!build || pins.offering) return;
    const newSeed = crypto.getRandomValues(new Uint32Array(1))[0];
    const tempBuild = rollBuild({ role: build.role, killerId: build.killerId, survivorId: build.survivorId, mode: build.mode, seed: newSeed }, buildCores);
    setBuild({ ...build, offering: tempBuild.offering });
  }, [build, pins, buildCores]);

  const shareUrl = build
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/build/${encodeShort(build)}`
    : '';

  const characters = role === 'killer' ? KILLERS : SURVIVORS;

  return (
    <div className="mx-auto px-5 sm:px-10 pt-10 sm:pt-12 pb-12 sm:pb-20 max-w-[600px]">
      {/* Page title */}
      <div className="mb-8 text-center">
        <span className="label-mono text-[10px] text-ink-mute">Алтарь призыва</span>
        <h1 className="mt-2 text-[28px] font-extrabold text-dbd-bone tracking-[-0.01em]">
          Бросить жребий
        </h1>
      </div>

      {/* ── Controls panel ── */}
      <div className="border border-line-2 bg-bg-1 p-6 flex flex-col gap-[22px]">
        {/* Role */}
        <ControlGroup label="I. Роль">
          <div className="flex">
            {(['survivor', 'killer'] as const).map((r) => (
              <button
                key={r}
                onClick={() => { setRole(r); setCharId('any'); setBuild(null); setPins(EMPTY_PIN_STATE); }}
                className={cn(
                  'flex-1 py-[11px] px-4 font-sans text-[12px] font-bold tracking-[.15em] uppercase',
                  'border-0 border-b-2 cursor-pointer transition-all duration-[180ms]',
                  role === r
                    ? 'bg-dbd-accent text-white border-b-dbd-glow'
                    : 'bg-transparent text-ink-mute border-b-line-2',
                )}
              >
                {r === 'survivor' ? 'Выживший' : 'Убийца'}
              </button>
            ))}
          </div>
        </ControlGroup>

        {/* Divider */}
        <div className="h-px bg-line-1" />

        {/* Character */}
        <ControlGroup label="II. Персонаж">
          <Select
            value={charId}
            onValueChange={(v) => { setCharId(v as string); setBuild(null); setPins(EMPTY_PIN_STATE); }}
          >
            <SelectTrigger
              className="w-full bg-bg-2 border border-line-2 rounded-none text-ink font-sans text-[13px]"
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
        <div className="h-px bg-line-1" />

        {/* Mode */}
        <ControlGroup label="III. Режим">
          <div className="grid grid-cols-3 gap-2">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-[6px] py-3 px-2 border cursor-pointer transition-all duration-[180ms]',
                  mode === opt.value
                    ? 'border-line-ember bg-[rgba(184,67,31,.12)]'
                    : 'border-line-1 bg-bg-2',
                )}
              >
                <span className={cn('text-[18px] leading-none', mode === opt.value ? 'text-dbd-accent' : 'text-ink-faint')}>
                  {opt.glyph}
                </span>
                <span className={cn('label-mono text-[9px] tracking-[.15em]', mode === opt.value ? 'text-dbd-bone' : 'text-ink-mute')}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </ControlGroup>

        {/* Roll button */}
        <button
          onClick={handleRoll}
          className="ritual-btn ritual-btn-primary w-full py-[18px] text-[15px] tracking-[.25em] mt-1"
        >
          {build ? '✦ ПЕРЕБРОСИТЬ' : '✦ БРОСИТЬ'}
        </button>

        {!build && (
          <p className="label-mono text-[9px] text-ink-faint text-center -mt-2">
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
    <div className="flex flex-col gap-[10px]">
      <span className="label-mono text-[10px] text-ink-mute">{label}</span>
      {children}
    </div>
  );
}
