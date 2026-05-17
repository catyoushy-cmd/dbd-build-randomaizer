import type { Perk, Killer, Survivor, Item, Addon, Offering, BuildCore } from './types';

import perksRaw from '@/data/perks.json';
import killersRaw from '@/data/killers.json';
import survivorsRaw from '@/data/survivors.json';
import itemsRaw from '@/data/items.json';
import addonsRaw from '@/data/addons.json';
import offeringsRaw from '@/data/offerings.json';
import buildCoresRaw from '@/data/build-cores.json';

export const PERKS = perksRaw as Perk[];
export const KILLERS = killersRaw as Killer[];
export const SURVIVORS = survivorsRaw as Survivor[];
export const ITEMS = itemsRaw as Item[];
export const ADDONS = addonsRaw as Addon[];
export const OFFERINGS = offeringsRaw as Offering[];
export const BUILD_CORES = buildCoresRaw as BuildCore[];

export type { Perk, Killer, Survivor, Item, Addon, Offering, BuildCore };
export * from './types';
