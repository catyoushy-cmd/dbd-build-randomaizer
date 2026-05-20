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
import { KILLERS, PERKS, ITEMS, ADDONS, OFFERINGS } from '@/lib/data';
import { pushHistory } from '@/lib/history';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { IconImg } from '@/components/ui/icon-img';
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
  const [killerId, setKillerId] = useState<string>('any'); // only relevant when role === 'killer'
  const [mode,    setMode]    = useState<BuildMode>('random');
  const [build,   setBuild]   = useState<Build | null>(null);
  const [pins,    setPins]    = useState(EMPTY_PIN_STATE);
  const [formExpanded, setFormExpanded] = useState(true);

  /* Hydrate from URL on mount */
  useEffect(() => {
    const seedParam = searchParams.get('seed');
    const roleParam = searchParams.get('role') as 'survivor' | 'killer' | null;
    const charParam = searchParams.get('char');
    const modeParam = searchParams.get('mode') as BuildMode | null;

    if (seedParam && roleParam && modeParam) {
      const seed = parseInt(seedParam, 10);
      if (!isNaN(seed)) {
        setRole(roleParam);
        if (roleParam === 'killer') setKillerId(charParam ?? 'any');
        setMode(modeParam);
        const input: BuildInput = {
          role: roleParam,
          killerId:   roleParam === 'killer' && charParam && charParam !== 'any' ? charParam : null,
          survivorId: null,
          mode: modeParam,
          seed,
        };
        setBuild(rollBuild(input, buildCores));
        setFormExpanded(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUrl = useCallback((newBuild: Build) => {
    const charParam = newBuild.role === 'killer' ? (newBuild.killerId ?? 'any') : 'any';
    const params = new URLSearchParams({
      role: newBuild.role,
      char: charParam,
      mode: newBuild.mode,
      seed: String(newBuild.seed),
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router]);

  const handleRoll = useCallback(() => {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const input: BuildInput = {
      role,
      killerId:   role === 'killer' && killerId !== 'any' ? killerId : null,
      survivorId: null,
      mode,
      seed,
    };

    let newBuild = rollBuild(input, buildCores);

    if (build && hasAnyPins(pins)) {
      newBuild = applyPins(newBuild, pinStateToApiPins(pins, build), ALL_DATA);
    }

    setBuild(newBuild);
    setFormExpanded(false);
    updateUrl(newBuild);

    if (newBuild.fallback) {
      toast.warning('Ядро недоступно — выдан полный рандом');
    }

    const charName = role === 'killer'
      ? KILLERS.find((k) => k.id === killerId)?.name.ru
      : undefined;
    const charLabel = charName ?? (role === 'killer' ? 'Любой убийца' : 'Выжившие');
    const modeLabel = MODE_OPTIONS.find((m2) => m2.value === mode)?.label ?? mode;
    const roleLabel = role === 'killer' ? 'Убийца' : 'Выживший';

    pushHistory({
      code:   encodeShort(newBuild),
      role,
      charId: role === 'killer' && killerId !== 'any' ? killerId : null,
      mode,
      seed,
      label:  `${roleLabel} / ${charLabel} / ${modeLabel}`,
      ts:     Date.now(),
    });
  }, [role, killerId, mode, build, pins, updateUrl, buildCores]);

  const handleRerollAddons = useCallback(() => {
    if (!build) return;
    const newSeed = crypto.getRandomValues(new Uint32Array(1))[0];
    const tempBuild = rollBuild(
      { role: build.role, killerId: build.killerId, survivorId: build.survivorId, mode: build.mode, seed: newSeed },
      buildCores,
    );
    const nextAddons = pins.addons.map((p, i) =>
      p ? build.addons[i] : (tempBuild.addons[i] ?? build.addons[i])
    );
    const nextItem = pins.item ? build.item : (build.role === 'survivor' ? (tempBuild.item ?? build.item) : null);
    setBuild({ ...build, addons: nextAddons, item: nextItem });
  }, [build, pins, buildCores]);

  const handleRerollOffering = useCallback(() => {
    if (!build || pins.offering) return;
    const newSeed = crypto.getRandomValues(new Uint32Array(1))[0];
    const tempBuild = rollBuild(
      { role: build.role, killerId: build.killerId, survivorId: build.survivorId, mode: build.mode, seed: newSeed },
      buildCores,
    );
    setBuild({ ...build, offering: tempBuild.offering });
  }, [build, pins, buildCores]);

  const shareUrl = build
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/build/${encodeShort(build)}`
    : '';

  const selectedKiller = KILLERS.find((k) => k.id === killerId);
  const modeLabelCur   = MODE_OPTIONS.find((m) => m.value === mode);

  return (
    <div className="mx-auto px-5 sm:px-10 pt-6 sm:pt-10 pb-12 sm:pb-20 max-w-[640px]">
      {!build && (
        <div className="mb-6 text-center">
          <span className="label-mono text-[10px] text-ink-mute">Алтарь призыва</span>
          <h1 className="mt-2 text-[26px] font-extrabold text-dbd-bone tracking-[-0.01em]">
            Бросить жребий
          </h1>
        </div>
      )}

      {/* Compact summary bar — shown after first roll when form is collapsed */}
      {build && !formExpanded && (
        <div className="mb-5 border border-line-2 bg-bg-1 px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="label-mono text-[10px] text-dbd-accent">
              {role === 'killer' ? 'Убийца' : 'Выживший'}
            </span>
            {role === 'killer' && selectedKiller && killerId !== 'any' && (
              <>
                <span className="text-ink-faint">·</span>
                <div className="w-5 h-5 shrink-0 border border-line-1 bg-bg-2 flex items-center justify-center overflow-hidden">
                  <IconImg src={selectedKiller.icon} alt={selectedKiller.name.ru} size={18} fallback={null} />
                </div>
                <span className="font-sans text-[12px] text-ink truncate">{selectedKiller.name.ru}</span>
              </>
            )}
            <span className="text-ink-faint">·</span>
            <span className="font-sans text-[12px] text-ink">{modeLabelCur?.label}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRoll}
              className="ritual-btn ritual-btn-primary px-4 py-2 text-[11px]"
            >
              ⟲ Перебросить
            </button>
            <button
              onClick={() => setFormExpanded(true)}
              className="ritual-btn ritual-btn-ghost px-3 py-2 text-[11px]"
              title="Изменить настройки"
            >
              ⚙
            </button>
            {hasAnyPins(pins) && (
              <button
                onClick={() => setPins(EMPTY_PIN_STATE)}
                className="ritual-btn ritual-btn-ghost px-3 py-2 text-[11px]"
                title="Сбросить пины"
              >
                ↻
              </button>
            )}
          </div>
        </div>
      )}

      {/* Settings panel */}
      {formExpanded && (
        <div className="border border-line-2 bg-bg-1 p-6 flex flex-col gap-[22px]">
          <ControlGroup label="I. Роль">
            <div className="flex">
              {(['survivor', 'killer'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setKillerId('any');
                    setBuild(null);
                    setPins(EMPTY_PIN_STATE);
                  }}
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
            {role === 'survivor' && (
              <p className="label-mono text-[10px] text-ink-faint mt-2">
                У всех выживших общий пул перков — выбор персонажа не нужен.
              </p>
            )}
          </ControlGroup>

          {role === 'killer' && (
            <>
              <div className="h-px bg-line-1" />
              <ControlGroup label="II. Убийца">
                <Select
                  value={killerId}
                  onValueChange={(v) => { setKillerId(v as string); setBuild(null); setPins(EMPTY_PIN_STATE); }}
                >
                  <SelectTrigger className="w-full bg-bg-2 border border-line-2 rounded-none text-ink font-sans text-[13px]">
                    <span style={{ flex: 1, textAlign: 'left', fontSize: 13 }}>
                      {killerId === 'any'
                        ? 'Любой убийца'
                        : (KILLERS.find((k) => k.id === killerId)?.name.ru ?? killerId)}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Любой убийца</SelectItem>
                    {KILLERS.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.name.ru}{k.power ? ` — ${k.power}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ControlGroup>
            </>
          )}

          <div className="h-px bg-line-1" />

          <ControlGroup label={`${role === 'killer' ? 'III' : 'II'}. Режим`}>
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

          <button
            onClick={handleRoll}
            className="ritual-btn ritual-btn-primary w-full py-[18px] text-[15px] tracking-[.25em] mt-1"
          >
            {build ? '✦ ПЕРЕБРОСИТЬ' : '✦ БРОСИТЬ'}
          </button>

          {build && (
            <button
              onClick={() => setFormExpanded(false)}
              className="label-mono text-[10px] text-ink-faint hover:text-ink bg-transparent border-0 cursor-pointer -mt-2"
            >
              ← Свернуть настройки
            </button>
          )}

          {!build && (
            <p className="label-mono text-[9px] text-ink-faint text-center -mt-2">
              Клик по карточке в результате — закрепляет слот
            </p>
          )}
        </div>
      )}

      {/* Result */}
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
