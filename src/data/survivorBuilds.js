const generalItems = [
  "Paul's Goat Hoof", "Hopoo Feather", "Tougher Times", "Cautious Slug",
  "Oddly-shaped Opal", "Delicate Watch", "Armor-Piercing Rounds",
];

const generalEquipment = ["Royal Capacitor", "Recycler", "Executive Card"];

const preset = (id, name, focus, s, a, equipment = generalEquipment) => ({
  id,
  name,
  focus,
  tiers: { S: s, A: a, B: [...generalItems, ...equipment] },
});

// These are starter priorities, not a universal tier list or a complete loadout.
export const survivorBuilds = [
  preset('commando', 'Commando', 'Rapid-fire on-hit chains',
    ["Tri-Tip Dagger", "AtG Missile Mk. 1", "Ukulele", "57 Leaf Clover"],
    ["Soldier's Syringe", "Lens-Maker's Glasses", "Predatory Instincts", "Harvester's Scythe"]),
  preset('huntress', 'Huntress', 'Mobile critical-hit damage',
    ["Lens-Maker's Glasses", "Predatory Instincts", "AtG Missile Mk. 1", "Ukulele"],
    ["Soldier's Syringe", "Harvester's Scythe", "Backup Magazine", "Laser Scope"]),
  preset('bandit', 'Bandit', 'Backstab burst and bleed',
    ["Crowbar", "Kjaro's Band", "Runald's Band", "Shatterspleen"],
    ["Backup Magazine", "Harvester's Scythe", "Laser Scope", "Purity"]),
  preset('mul-t', 'MUL-T', 'Nailgun on-hit damage',
    ["Tri-Tip Dagger", "AtG Missile Mk. 1", "Ukulele", "Soldier's Syringe"],
    ["Lens-Maker's Glasses", "Predatory Instincts", "57 Leaf Clover", "Plasma Shrimp"]),
  preset('engineer', 'Engineer', 'Stationary turrets and healing',
    ["Bustling Fungus", "N'kuhana's Opinion", "Spare Drone Parts", "Aegis"],
    ["Rejuvenation Rack", "AtG Missile Mk. 1", "Ukulele", "Soldier's Syringe"]),
  preset('artificer', 'Artificer', 'Skill burst and ignition',
    ["Ignition Tank", "Kjaro's Band", "Runald's Band", "Crowbar"],
    ["Backup Magazine", "Alien Head", "Purity", "Gasoline"]),
  preset('mercenary', 'Mercenary', 'Melee skill uptime',
    ["Focus Crystal", "Backup Magazine", "Alien Head", "Lysate Cell"],
    ["Soldier's Syringe", "Hardlight Afterburner", "Bandolier", "Ukulele"]),
  preset('rex', 'REX', 'Healing and skill sustain',
    ["Rejuvenation Rack", "Razorwire", "Leeching Seed", "Death Mark"],
    ["Medkit", "N'kuhana's Opinion", "Backup Magazine", "Primordial Cube"]),
  preset('loader', 'Loader', 'Charged punch burst',
    ["Crowbar", "Kjaro's Band", "Runald's Band", "Focus Crystal"],
    ["Backup Magazine", "Hardlight Afterburner", "Alien Head", "H3AD-5T v2"]),
  preset('acrid', 'Acrid', 'Poison, spread and mobility',
    ["Death Mark", "Ukulele", "Gasoline", "Visions of Heresy"],
    ["Backup Magazine", "Old Guillotine", "Will-o'-the-wisp", "Focus Crystal"]),
  preset('captain', 'Captain', 'Shotgun procs and drones',
    ["Tri-Tip Dagger", "AtG Missile Mk. 1", "Spare Drone Parts", "Ukulele"],
    ["Soldier's Syringe", "Lens-Maker's Glasses", "57 Leaf Clover", "Pocket I.C.B.M."]),
  preset('railgunner', 'Railgunner', 'Weak-point burst damage',
    ["Crowbar", "Kjaro's Band", "Runald's Band", "Laser Scope"],
    ["Lens-Maker's Glasses", "Ukulele", "AtG Missile Mk. 1", "Hardlight Afterburner"]),
  preset('void-fiend', 'Void Fiend', 'Corrupted on-hit damage',
    ["AtG Missile Mk. 1", "Ukulele", "Lens-Maker's Glasses", "Plasma Shrimp"],
    ["Soldier's Syringe", "Tri-Tip Dagger", "57 Leaf Clover", "Predatory Instincts"]),
  preset('seeker', 'Seeker', 'Close-range healing and sustain',
    ["Focus Crystal", "Rejuvenation Rack", "N'kuhana's Opinion", "Razorwire"],
    ["Backup Magazine", "Alien Head", "Medkit", "Hardlight Afterburner"]),
  preset('chef', 'CHEF', 'Debuffs and fire damage',
    ["Ignition Tank", "Death Mark", "Gasoline", "Focus Crystal"],
    ["Backup Magazine", "Ukulele", "Tri-Tip Dagger", "Alien Head"]),
  preset('false-son', 'False Son', 'Health scaling and melee burst',
    ["Bison Steak", "Infusion", "Focus Crystal", "Kjaro's Band"],
    ["Runald's Band", "Titanic Knurl", "Alien Head", "Transcendence"]),
  {
    ...preset('operator', 'Operator', 'Drone fleet and on-hit chains',
      ["Spare Drone Parts"],
      ["Soldier's Syringe", "Crowbar", "Ukulele", "AtG Missile Mk. 1",
        "Paul's Goat Hoof", "Death Mark", "Predatory Instincts", "Harvester's Scythe"],
      ["The Back-up", "Gorag's Opus"]),
    source: 'https://rogueranker.com/operator-ror2/',
  },
  preset('drifter', 'Drifter', 'Close-range damage and skill uptime',
    ["Focus Crystal", "Backup Magazine", "Alien Head", "Hardlight Afterburner"],
    ["Crowbar", "Kjaro's Band", "Runald's Band", "Bandolier"]),
  preset('heretic', 'Heretic', 'Skill damage and regeneration',
    ["Rejuvenation Rack", "Alien Head", "Lysate Cell", "Purity"],
    ["Backup Magazine", "Hardlight Afterburner", "AtG Missile Mk. 1", "Ukulele"]),
  {
    ...preset('enforcer', 'Enforcer', 'Shielded close-range damage and barrier support',
      ["Focus Crystal", "Soldier's Syringe", "Tri-Tip Dagger", "AtG Missile Mk. 1"],
      ["Ukulele", "Topaz Brooch", "Backup Magazine", "Hardlight Afterburner"]),
    dlc: 'Hallowed Concepts',
    source: 'https://riskofrain2.wiki.gg/wiki/Enforcer',
  },
  {
    ...preset('acolyte', 'Acolyte', 'Melee damage and healing converted into attack speed',
      ["Focus Crystal", "Harvester's Scythe", "Leeching Seed", "Rejuvenation Rack"],
      ["Lens-Maker's Glasses", "Predatory Instincts", "Ukulele", "Alien Head"]),
    dlc: 'Hallowed Concepts',
    source: 'https://riskofrain2.wiki.gg/wiki/Acolyte',
  },
];

export const buildTierOrder = ['S', 'A', 'B'];

export const getSurvivorBuild = (role, builds = survivorBuilds) => {
  return builds.find(build => build.id === role);
};

export const getBuildTier = (itemName, role, builds = survivorBuilds) => {
  const build = getSurvivorBuild(role, builds);
  return build ? buildTierOrder.find(tier => build.tiers[tier].includes(itemName)) || null : null;
};
