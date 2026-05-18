import type { Build, Perk, Item, Addon, Offering } from '@/lib/data';

/** API-formatted pins: ids of pinned items, null for free slots. */
export type Pins = {
  perks?: (string | null)[];   // array of 4, null = not pinned, string = perk id
  item?: string | null;
  addons?: (string | null)[];  // array of 2
  offering?: string | null;
};

/** UI-formatted pin state: which slots the user has locked. */
export type PinState = {
  perks: boolean[];
  item: boolean;
  addons: boolean[];
  offering: boolean;
};

export const EMPTY_PIN_STATE: PinState = {
  perks:    [false, false, false, false],
  item:     false,
  addons:   [false, false],
  offering: false,
};

/** Any slot pinned? */
export function hasAnyPins(state: PinState): boolean {
  return (
    state.perks.some(Boolean) ||
    state.item ||
    state.addons.some(Boolean) ||
    state.offering
  );
}

/** Convert UI pin state + current build → API-formatted ids. */
export function pinStateToApiPins(state: PinState, build: Build | null): Pins {
  if (!build) return {};
  return {
    perks:    state.perks.map((p, i) => (p ? build.perks[i]?.id ?? null : null)),
    item:     state.item ? (build.item?.id ?? null) : null,
    addons:   state.addons.map((p, i) => (p ? build.addons[i]?.id ?? null : null)),
    offering: state.offering ? build.offering.id : null,
  };
}

export function applyPins(build: Build, pins: Pins, allData: {
  perks: Perk[];
  items: Item[];
  addons: Addon[];
  offerings: Offering[];
}): Build {
  const result = { ...build };

  if (pins.perks) {
    result.perks = build.perks.map((perk, i) => {
      const pinnedId = pins.perks?.[i];
      if (!pinnedId) return perk;
      const found = allData.perks.find(p => p.id === pinnedId);
      return found ?? perk;
    });
  }

  if (pins.item && build.item !== null) {
    const found = allData.items.find(i => i.id === pins.item);
    if (found) result.item = found;
  }

  if (pins.addons) {
    result.addons = build.addons.map((addon, i) => {
      const pinnedId = pins.addons?.[i];
      if (!pinnedId) return addon;
      const found = allData.addons.find(a => a.id === pinnedId);
      return found ?? addon;
    });
  }

  if (pins.offering) {
    const found = allData.offerings.find(o => o.id === pins.offering);
    if (found) result.offering = found;
  }

  return result;
}
