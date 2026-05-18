import { describe, it, expect } from 'vitest';
import { rollBuild } from '../algorithm';
import {
  EMPTY_PIN_STATE,
  hasAnyPins,
  pinStateToApiPins,
  applyPins,
} from '../pinning';
import { PERKS, ITEMS, ADDONS, OFFERINGS } from '@/lib/data';

const ALL = { perks: PERKS, items: ITEMS, addons: ADDONS, offerings: OFFERINGS };

describe('pinStateToApiPins → applyPins roundtrip', () => {
  it('with no pins: hasAnyPins false, applyPins returns equivalent perks', () => {
    const build = rollBuild({ role: 'killer', killerId: 'trapper', mode: 'random', seed: 7 });
    expect(hasAnyPins(EMPTY_PIN_STATE)).toBe(false);
    const apiPins = pinStateToApiPins(EMPTY_PIN_STATE, build);
    expect(apiPins.perks?.every(p => p === null)).toBe(true);
  });

  it('pinning perk slot 0 and 2 keeps them after reroll', () => {
    const build1 = rollBuild({ role: 'survivor', mode: 'random', seed: 1 });
    const pinState = { ...EMPTY_PIN_STATE, perks: [true, false, true, false] };
    expect(hasAnyPins(pinState)).toBe(true);

    const apiPins = pinStateToApiPins(pinState, build1);

    const build2 = rollBuild({ role: 'survivor', mode: 'random', seed: 2 });
    const merged = applyPins(build2, apiPins, ALL);

    // pinned slots match build1; other slots came from build2
    expect(merged.perks[0].id).toBe(build1.perks[0].id);
    expect(merged.perks[2].id).toBe(build1.perks[2].id);
    expect(merged.perks[1].id).toBe(build2.perks[1].id);
    expect(merged.perks[3].id).toBe(build2.perks[3].id);
  });

  it('pinning offering keeps it', () => {
    const build1 = rollBuild({ role: 'killer', killerId: 'nurse', mode: 'random', seed: 11 });
    const pinState = { ...EMPTY_PIN_STATE, offering: true };

    const apiPins = pinStateToApiPins(pinState, build1);
    expect(apiPins.offering).toBe(build1.offering.id);

    const build2 = rollBuild({ role: 'killer', killerId: 'nurse', mode: 'random', seed: 22 });
    const merged = applyPins(build2, apiPins, ALL);

    expect(merged.offering.id).toBe(build1.offering.id);
  });

  it('pinning item keeps it across reroll (survivor)', () => {
    const build1 = rollBuild({ role: 'survivor', mode: 'random', seed: 100 });
    const pinState = { ...EMPTY_PIN_STATE, item: true };

    const apiPins = pinStateToApiPins(pinState, build1);
    expect(apiPins.item).toBe(build1.item!.id);

    const build2 = rollBuild({ role: 'survivor', mode: 'random', seed: 200 });
    const merged = applyPins(build2, apiPins, ALL);

    expect(merged.item?.id).toBe(build1.item!.id);
  });
});
