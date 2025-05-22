// IX/data/spellTypes.js - Centralized spell definitions

export const spellTypes = {
  // Guardian
  defend: {
    name: "Phalanx Stance",
    passive: true,
    effect: "defend",
    description: "50% less damage from piercing attacks",
    enabled: false,
    requiredUpgrade: "phalanxStance",
    pierceDamageReductionPercentage: 0.5
  },
  // Stalker
  improvedBow: {
    name: "Improved Range",
    passive: true,
    effect: "improvedBow",
    description: "Gain attack range",
    enabled: false,
    requiredUpgrade: "astralString"
  },
  marksmanship: {
    name: "Phantom Arrow",
    passive: true,
    effect: "marksmanship",
    description: "+3 attack damage",
    enabled: false,
    requiredUpgrade: "phantomArrow"
  },
  // Weaver
  purge: {
    name: "Cleanse",
    manaCost: 75,
    cooldown: 5,
    effect: "dispel",  // Changed from "purge" to "dispel" to match AbilitySystem switch case
    description: "Dispels a target unit",
    enabled: true
  },
  castLightningShield: {
    name: "Storm Aegis",
    manaCost: 100,
    cooldown: 3,
    effect: "castLightningShield",
    description: "Creates a storm shield dealing AoE damage to the target any other enemy in range",
    enabled: false,
    requiredUpgrade: "stormAegis",
    effectDuration: 15,
    damagePerSecond: 20,
    aoeRadius: 30,
    splashDamageFactor: 0.5
  },
  castBloodlust: {
    name: "Primal Fury",
    manaCost: 0,
    cooldown: 3,
    effect: "castBloodlust",
    description: "Buff friendly units with increased speed",
    enabled: false,
    requiredUpgrade: "primalFury",
    aoeRadius: 300,
    effectDuration: 15,
    attackSpeedBonusPercentage: 0.4,
    moveSpeedBonusPercentage: 0.25
  },
  // Leviathan
  burningOil: {
    name: "Inferno Payload",
    passive: true,
    effect: "burningOil",
    description: "Each attack burns the ground for AoE damage",
    enabled: false,
    requiredUpgrade: "infernoPayload",
    aoeRadius: 80,
    effectDuration: 5,
    damagePerSecond: 15
  },
  // Oracle
  heal: {
    name: "Divine Mending",
    manaCost: 10,
    cooldown: 1.2,
    effect: "heal",
    description: "Heals a friendly unit for 25 HP",
    enabled: true,
    healAmount: 25
  },
  castDispelMagic: {
    name: "Arcane Nullification",
    manaCost: 75,
    cooldown: 10,
    effect: "castDispelMagic",
    description: "Area dispel in a 150 radius",
    enabled: false,
    requiredUpgrade: "arcaneNullification",
    aoeRadius: 150
  },
  castInnerFire: {
    name: "Soul Fortification",
    manaCost: 35,
    cooldown: 3,
    effect: "castInnerFire",
    description: "Buff friendly unit with armor and damage",
    enabled: false,
    requiredUpgrade: "soulFortification",
    effectDuration: 30,
    armorBonus: 5,
    damageBonusPercentage: 0.1
  },
  // Astral Nomad
  spiritLink: {
    name: "Soul Tether",
    manaCost: 75,
    cooldown: 15,
    effect: "spiritLink",
    description: "Links 4 friendly units to distribute 50% of damage received",
    enabled: true,
    aoeRadius: 300,
    maxLinkedUnits: 4,
    damageSharingPercentage: 0.5,
    effectDuration: 45
  },
  castDisenchant: {
    name: "Charm Breaker",
    manaCost: 100,
    cooldown: 10,
    effect: "castDisenchant",
    description: "Area dispel in a 120 radius",
    enabled: false,
    requiredUpgrade: "charmBreaker",
    aoeRadius: 120
  },
  castAncestralSpirit: {
    name: "Phantom Summons",
    manaCost: 350,
    cooldown: 30,
    effect: "castAncestralSpirit",
    description: "Resurrect a dead unit",
    enabled: false,
    requiredUpgrade: "phantomSummons",
    resurrectableUnitTypes: ["juggernaut", "astralNomad"],
    maxCorpseAgeSeconds: 60
  },
  // Marauder
  ensnare: {
    name: "Binding Chains",
    manaCost: 0,
    cooldown: 16,
    effect: "ensnare",
    description: "Temporarily binds an air unit to the ground",
    enabled: true
  },
  pillage: {
    name: "Plunder",
    passive: true,
    effect: "pillage",
    description: "Gain 10 gold per attack on a building",
    enabled: true,
    goldPerHit: 10
  },
  // Trampler
  devour: {
    name: "Consumption",
    cooldown: 20,
    effect: "devour",
    description: "Consumes an enemy unit over time",
    enabled: true
  },
  warDrum: {
    name: "Battle Cadence",
    passive: true,
    effect: "warDrum",
    description: "Nearby friendly units gain 5% damage",
    auraRange: 600,
    enabled: true
  },
  warDrumUpgrade: {
    name: "Resonant Echo",
    passive: true,
    effect: "warDrumUpgrade",
    description: "Increases the damage bonus of Battle Cadence by 10%",
    enabled: false,
    requiredUpgrade: "resonantEcho"
  },
  // Juggernaut
  pulverize: {
    name: "Seismic Slam",
    passive: true,
    effect: "pulverize",
    description: "25% chance to deal 60 AOE damage on attacks",
    enabled: false,
    requiredUpgrade: "seismicSlam",
    procChance: 0.25,
    aoeRadius: 60,
    aoeDamage: 60
  },
  // Colossus
  taunt: {
    name: "Challenging Roar",
    manaCost: 0,
    cooldown: 15,
    effect: "taunt",
    description: "Nearby enemies are forced to attack this unit",
    enabled: true,
    aoeRadius: 250,
    debuffDuration: 5
  },
  hardenSkin: {
    name: "Crystalline Carapace",
    passive: true,
    effect: "hardenSkin",
    description: "Reduces all attacks by 8 damage (minimum 3)",
    enabled: false,
    requiredUpgrade: "crystallineCarapace",
    damageReductionAmount: 8,
    minDamageTaken: 3
  },
  // Permafrost Drake
  freezingBreath: {
    name: "Glacial Tempest",
    passive: true,
    effect: "freezingBreath",
    description: "Attacks stop buildings from attacking",
    enabled: false,
    requiredUpgrade: "glacialTempest",
    stunDuration: 4
  }
};

// Make spell types available globally
if (typeof window !== 'undefined') {
  window.spellTypes = spellTypes;
}
