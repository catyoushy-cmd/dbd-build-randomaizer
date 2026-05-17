import type { Build, Perk, Item, Addon, Offering } from '@/lib/data';

export type Pins = {
  perks?: (string | null)[];   // array of 4, null = not pinned, string = perk id
  item?: string | null;
  addons?: (string | null)[];  // array of 2
  offering?: string | null;
};

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
