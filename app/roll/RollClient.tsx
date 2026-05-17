'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Dices, Zap, PartyPopper } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const MODE_OPTIONS: { value: BuildMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'random', label: 'Рандом', icon: <Dices size={15} />, desc: 'Полная лотерея' },
  { value: 'efficient', label: 'Эффективность', icon: <Zap size={15} />, desc: 'Синергичный и сбалансированный' },
  { value: 'fun', label: 'Веселье', icon: <PartyPopper size={15} />, desc: 'Гиммик-билды и редкие синергии' },
];

const EMPTY_PINS = {
  perks: [false, false, false, false],
  item: false,
  addons: [false, false],
  offering: false,
};

function toApiPins(pins: typeof EMPTY_PINS, build: Build | null): Pins {
  if (!build) return {};
  return {
    perks: pins.perks.map((p, i) => (p ? build.perks[i]?.id ?? null : null)),
    item: pins.item ? (build.item?.id ?? null) : null,
    addons: pins.addons.map((p, i) => (p ? build.addons[i]?.id ?? null : null)),
    offering: pins.offering ? build.offering.id : null,
  };
}

function hasPins(pins: typeof EMPTY_PINS) {
  return pins.perks.some(Boolean) || pins.item || pins.addons.some(Boolean) || pins.offering;
}

const ALL_DATA = { perks: PERKS, items: ITEMS, addons: ADDONS, offerings: OFFERINGS };

export function RollClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [role, setRole] = useState<'survivor' | 'killer'>('survivor');
  const [charId, setCharId] = useState<string>('any');
  const [mode, setMode] = useState<BuildMode>('random');
  const [build, setBuild] = useState<Build | null>(null);
  const [pins, setPins] = useState(EMPTY_PINS);

  // Hydrate from URL on mount
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
          killerId: r === 'killer' && c !== 'any' ? c : null,
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
      ? (newBuild.killerId ?? 'any')
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
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const input: BuildInput = {
      role,
      killerId: role === 'killer' && charId !== 'any' ? charId : null,
      survivorId: role === 'survivor' && charId !== 'any' ? charId : null,
      mode,
      seed,
    };

    let newBuild = rollBuild(input);

    if (build && hasPins(pins)) {
      newBuild = applyPins(newBuild, toApiPins(pins, build), ALL_DATA);
    }

    // Reset pins for newly rolled slots
    const nextPins = {
      perks: pins.perks.map((p) => p),
      item: pins.item,
      addons: pins.addons.map((p) => p),
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
      charId: charId !== 'any' ? charId : null,
      mode,
      seed,
      label: `${roleLabel} / ${charLabel} / ${modeLabel}`,
      ts: Date.now(),
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
    if (!build) return;
    if (pins.offering) return;
    const newSeed = crypto.getRandomValues(new Uint32Array(1))[0];
    const tempBuild = rollBuild({ role: build.role, killerId: build.killerId, survivorId: build.survivorId, mode: build.mode, seed: newSeed });
    setBuild({ ...build, offering: tempBuild.offering });
  }, [build, pins]);

  const shareUrl = build
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/build/${encodeShort(build)}`
    : '';

  const characters = role === 'killer' ? KILLERS : SURVIVORS;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-center text-3xl font-bold tracking-tight">
        DBD Build Randomizer
      </h1>

      {/* Form */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        {/* Role toggle */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Роль
          </label>
          <div className="flex gap-2">
            {(['survivor', 'killer'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setCharId('any');
                  setBuild(null);
                  setPins(EMPTY_PINS);
                }}
                className={cn(
                  'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-150',
                  role === r
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-border/80',
                )}
              >
                {r === 'survivor' ? '🧍 Выживший' : '🔪 Убийца'}
              </button>
            ))}
          </div>
        </div>

        {/* Character select */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Персонаж
          </label>
          <Select
            value={charId}
            onValueChange={(v) => {
              setCharId(v as string);
              setBuild(null);
              setPins(EMPTY_PINS);
            }}
          >
            <SelectTrigger className="w-full">
              <span className="flex flex-1 text-left text-sm">
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
        </div>

        {/* Mode */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Режим
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center text-xs font-medium transition-all duration-150',
                  mode === opt.value
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-border/80',
                )}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Roll button */}
        <button
          onClick={handleRoll}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
        >
          {build ? '🔄 Перебросить' : '🎲 ROLL!'}
        </button>
      </div>

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

      {/* Pin hint */}
      {!build && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          После ролла — клик по карточке закрепляет слот. Следующий ролл не тронет закреплённое.
        </p>
      )}
    </div>
  );
}
