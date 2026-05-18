export type PerkRole =
  // Survivor
  | 'gen'
  | 'chase-escape'
  | 'info'
  | 'altruism'
  | 'exhaustion'
  | 'boon'
  | 'meme'
  // Killer
  | 'slowdown'
  | 'chase-power'
  | 'aura'
  | 'hex'
  | 'endgame'
  | 'stealth';

export type Tier = 'S' | 'A' | 'B' | 'C';

export type Perk = {
  id: string;
  name: { en: string; ru: string };
  role: 'survivor' | 'killer';
  character: string | null;
  icon: string;
  description: { en: string; ru: string };
  tunables?: Record<string, number[] | undefined>;
  roles: PerkRole[];
  synergy_groups: string[];
  tier: Tier;
  deprecated?: boolean;
};

export type Killer = {
  id: string;
  name: { en: string; ru: string };
  power: string;
  icon: string;
};

export type Survivor = {
  id: string;
  name: { en: string; ru: string };
  icon: string;
};

export type ItemType = 'flashlight' | 'medkit' | 'toolbox' | 'map' | 'key';

export type Item = {
  id: string;
  type: ItemType;
  name: { en: string; ru: string };
  description?: { en: string; ru: string };
  rarity: 'common' | 'uncommon' | 'rare' | 'very-rare';
  icon: string;
};

export type AddonTag = 'efficient' | 'meme' | 'troll';

export type Addon = {
  id: string;
  name: { en: string; ru: string };
  description?: { en: string; ru: string };
  scope:
    | { type: 'killer'; killerId: string }
    | { type: 'item'; itemType: ItemType };
  rarity: 'common' | 'uncommon' | 'rare' | 'very-rare' | 'ultra-rare';
  tags: AddonTag[];
  icon: string;
};

export type OfferingTag = 'efficient' | 'meme' | 'troll';

export type Offering = {
  id: string;
  name: { en: string; ru: string };
  description?: { en: string; ru: string };
  role: 'survivor' | 'killer' | 'both';
  rarity: string;
  tags: OfferingTag[];
  icon: string;
};

export type BuildMode = 'random' | 'efficient' | 'fun';

export type BuildCore = {
  id: string;
  name: string;
  role: 'survivor' | 'killer';
  mode: 'fun' | 'efficient';
  required_perks: string[];
  recommended_perks: string[];
  preferred_item_type?: ItemType;
  description: string;
};

export type Build = {
  seed: number;
  role: 'survivor' | 'killer';
  killerId: string | null;
  survivorId: string | null;
  mode: BuildMode;
  perks: Perk[];
  item: Item | null;
  addons: Addon[];
  offering: Offering;
  buildCore?: BuildCore;
  fallback?: boolean;
};
