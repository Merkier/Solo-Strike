  // units/unitTypes.js - Unit definitions with reimagined fantasy units

  // Define all unit types with their stats
  export const unitTypes = {
    // TIER 1 UNITS
    guardian: {
      name: 'Guardian',
      cost: 110,
      requiredFortressLevel: 1,
      stats: {
        maxHealth: 220,
        health: 220,
        attackPower: {min: 12, max: 13},
        attackType: 'normal',
        attackRange: 35, // melee
        attackSpeed: 0.88,
        speed: 40,
        armorType: 'heavy',
        armorValue: 2,
        color: "#73bed3", // Iridescent scale armor color
        abilities: [
          {
            name: "Phalanx Stance",
            passive: true,
            effect: "defend",
            description: "50% less damage from piercing attacks",
            enabled: false,
            requiredUpgrade: "phalanxStance"
          }
        ],
        possibleUpgrades: ['phalanxStance']
      }
    },
    
    stalker: {
      name: 'Stalker',
      cost: 160,
      requiredFortressLevel: 1,
      stats: {
        maxHealth: 130,
        health: 130,
        attackPower: {min: 16, max: 18},
        attackType: 'pierce',
        attackRange: 85, //500
        attackSpeed: 0.98,
        speed: 40,
        armorType: 'medium',
        armorValue: 0,
        color: "#8e44ad", // Purple for shadowy armor with glowing runes
        abilities: [
          {
            name: "Improved Range",
            passive: true,
            effect: "improvedBow",
            description: "Gain attack range",
            enabled: false,
            requiredUpgrade: "astralString"
          },
          {
            name: "Phantom Arrow",
            passive: true,
            effect: "marksmanship",
            description: "+3 attack damage",
            enabled: false,
            requiredUpgrade: "phantomArrow"
          }
        ],
        possibleUpgrades: ['astralString', 'phantomArrow']
      }
    },
    
    weaver: {
      name: 'Weaver',
      cost: 140,
      requiredFortressLevel: 1,
      stats: {
        maxHealth: 131,
        health: 131,
        maxMana: 200,
        mana: 200,
        attackPower: {min: 11, max: 13},
        attackType: 'magic',
        attackRange: 101, //600
        attackSpeed: 1.37,
        speed: 40,
        armorType: 'unarmored',
        armorValue: 0,
        color: "#3498db", // Cosmic blue for luminescent markings
        abilities: [
          {
            name: "Cleanse",
            manaCost: 75,
            cooldown: 5,
            effect: "purge",
            description: "Dispels a target unit",
            enabled: true
          },
          {
            name: "Storm Aegis",
            manaCost: 100,
            cooldown: 3,
            effect: "castLightningShield",
            description: "Creates a storm shield dealing AoE damage to the target any other enemy in range",
            enabled: false,
            requiredUpgrade: "stormAegis"
          },
          {
            name: "Primal Fury",
            manaCost: 0,
            cooldown: 3,
            effect: "castBloodlust",
            description: "Buff friendly units with increased speed",
            enabled: false,
            requiredUpgrade: "primalFury"
          }
        ],
        possibleUpgrades: ['stormAegis', 'primalFury']
      }
    },
    
    // TIER 2 UNITS (Fortress Level 2)
    leviathan: {
      name: 'Leviathan',
      cost: 300,
      requiredFortressLevel: 2,
      stats: {
        maxHealth: 166,
        health: 166,
        attackPower: {min: 49, max: 53},
        attackType: 'siege',
        attackRange: 120, //800
        attackSpeed: 3.54,
        speed: 30,
        armorType: 'heavy',
        armorValue: 2,
        color: "#e74c3c", // Fiery red for the glowing furnace eyes
        abilities: [
          {
            name: "Inferno Payload",
            passive: true,
            effect: "burningOil",
            description: "Each attack burns the ground for AoE damage",
            enabled: false,
            requiredUpgrade: "infernoPayload"
          }
        ],
        possibleUpgrades: ['infernoPayload']
      }
    },
    
    oracle: {
      name: 'Oracle',
      cost: 160,
      requiredFortressLevel: 2,
      stats: {
        maxHealth: 113,
        health: 113,
        maxMana: 200,
        mana: 200,
        attackPower: {min: 11, max: 13},
        attackType: 'magic',
        attackRange: 101,//600
        attackSpeed: 1.30,
        speed: 40,
        armorType: 'unarmored',
        armorValue: 0,
        color: "#f1c40f", // Gold for sacred geometry patterns
        abilities: [
          {
            name: "Divine Mending",
            manaCost: 10,
            cooldown: 1.2,
            effect: "heal",
            description: "Heals a friendly unit for 25 HP",
            enabled: true
          },
          {
            name: "Arcane Nullification",
            manaCost: 75,
            cooldown: 10,
            effect: "castDispelMagic",
            description: "Area dispel in a 150 radius",
            enabled: false,
            requiredUpgrade: "arcaneNullification"
          },
          {
            name: "Soul Fortification",
            manaCost: 35,
            cooldown: 3,
            effect: "castInnerFire",
            description: "Buff friendly unit with armor and damage",
            enabled: false,
            requiredUpgrade: "soulFortification"
          }
        ],
        possibleUpgrades: ['arcaneNullification', 'soulFortification']
      }
    },
    
    astralNomad: {
      name: 'Astral Nomad',
      cost: 170,
      requiredFortressLevel: 2,
      stats: {
        maxHealth: 196,
        health: 196,
        maxMana: 300,
        mana: 300,
        attackPower: {min: 17, max: 22},
        attackType: 'magic',
        attackRange: 101,//600
        attackSpeed: 1.13,
        speed: 40,
        armorType: 'unarmored',
        armorValue: 0,
        color: "#9b59b6", // Purple for celestial symbols
        abilities: [
          {
            name: "Soul Tether",
            manaCost: 75,
            cooldown: 15,
            effect: "spiritLink",
            description: "Links 4 friendly units to distribute 50% of damage received",
            enabled: true
          },
          {
            name: "Charm Breaker",
            manaCost: 100,
            cooldown: 10,
            effect: "castDisenchant",
            description: "Area dispel in a 120 radius",
            enabled: false,
            requiredUpgrade: "charmBreaker"
          },
          {
            name: "Phantom Summons",
            manaCost: 350,
            cooldown: 30,
            effect: "castAncestralSpirit",
            description: "Resurrect a dead unit",
            enabled: false,
            requiredUpgrade: "phantomSummons"
          }
        ],
        possibleUpgrades: ['charmBreaker', 'phantomSummons']
      }
    },
    
    marauder: {
      name: 'Marauder',
      cost: 160,
      requiredFortressLevel: 2,
      stats: {
        maxHealth: 335,
        health: 335,
        attackPower: {min: 23, max: 27},
        attackType: 'siege',
        attackRange: 35, // melee
        attackSpeed: 1.20,
        speed: 50,
        armorType: 'medium',
        armorValue: 0,
        color: "#c0392b", // Crimson accents on obsidian armor
        abilities: [
          {
            name: "Binding Chains",
            manaCost: 0,
            cooldown: 16,
            effect: "ensnare",
            description: "Temporarily binds an air unit to the ground",
            enabled: true
          }, 
          {
            name: "Plunder",
            passive: true,
            effect: "pillage",
            description: "Gain 10 gold per attack on a building",
            enabled: true
          }
        ],
        possibleUpgrades: []
      }
    },
    
    trampler: {
      name: 'Trampler',
      cost: 270,
      requiredFortressLevel: 2,
      stats: {
        maxHealth: 490,
        health: 490,
        attackPower: {min: 16, max: 20},
        attackType: 'pierce',
        attackRange: 90,//500
        attackSpeed: 0.94,
        speed: 35,
        armorType: 'unarmored',
        armorValue: 1,
        color: "#795548", // Earthy brown for beast hide with tribal markings
        abilities: [
          {
            name: "Consumption",
            cooldown: 20,
            effect: "devour",
            description: "Consumes an enemy unit over time",
            enabled: true
          }, 
          {
            name: "Battle Cadence",
            passive: true,
            effect: "warDrum",
            description: "Nearby friendly units gain 5% damage",
            auraRange: 600,
            enabled: true
          },
          {
            name: "Resonant Echo",
            passive: true,
            effect: "warDrumUpgrade",
            description: "Increases the damage bonus of Battle Cadence by 10%",
            enabled: false,
            requiredUpgrade: "resonantEcho"
          }
        ],
        possibleUpgrades: ['resonantEcho']
      }
    },
    
    // TIER 3 UNITS (Fortress Level 3)
    juggernaut: {
      name: 'Juggernaut',
      cost: 300,
      requiredFortressLevel: 3,
      stats: {
        maxHealth: 637,
        health: 637,
        attackPower: {min: 30, max: 36},
        attackType: 'normal',
        attackRange: 35, // melee
        attackSpeed: 1.24,
        speed: 40,
        armorType: 'heavy',
        armorValue: 3,
        color: "#d35400", // Volcanic rock with molten veins
        abilities: [
          {
            name: "Seismic Slam",
            passive: true,
            effect: "pulverize",
            description: "25% chance to deal 60 AOE damage on attacks",
            enabled: false,
            requiredUpgrade: "seismicSlam"
          }
        ],
        possibleUpgrades: ['seismicSlam']
      }
    },
    
    colossus: {
      name: 'Colossus',
      cost: 310,
      requiredFortressLevel: 3,
      stats: {
        maxHealth: 686,
        health: 686,
        attackPower: {min: 28, max: 40},
        attackType: 'normal',
        attackRange: 35, // melee
        attackSpeed: 1.63,
        speed: 35,
        armorType: 'normal', // Adding 'normal' armor type
        armorValue: 0,
        color: "#7f8c8d", // Stone-like gray with crystal accents
        abilities: [
          {
            name: "Challenging Roar",
            manaCost: 0,
            cooldown: 15,
            effect: "taunt",
            description: "Nearby enemies are forced to attack this unit",
            enabled: true
          },
          {
            name: "Crystalline Carapace",
            passive: true,
            effect: "hardenSkin",
            description: "Reduces all attacks by 8 damage (minimum 3)",
            enabled: false,
            requiredUpgrade: "crystallineCarapace"
          }
        ],
        possibleUpgrades: ['crystallineCarapace']
      }
    },
    
    permafrostDrake: {
      name: 'Permafrost Drake',
      cost: 440,
      requiredFortressLevel: 3,
      stats: {
        maxHealth: 650,
        health: 650,
        attackPower: {min: 85, max: 105},
        attackType: 'magic',
        attackRange: 85,//500
        attackSpeed: 1.95,
        speed: 45,
        armorType: 'light',
        armorValue: 1,
        color: "#00bcd4", // Ice crystal blue
        abilities: [
          {
            name: "Glacial Tempest",
            passive: true,
            effect: "freezingBreath",
            description: "Attacks stop buildings from attacking",
            enabled: false,
            requiredUpgrade: "glacialTempest"
          }
        ],
        possibleUpgrades: ['glacialTempest']
      }
    },
    
    // Basic unit for legacy support
    basic: {
      name: 'Basic',
      cost: 90,
      requiredFortressLevel: 1,
      stats: {
        maxHealth: 165,
        health: 165,
        attackPower: {min: 13, max: 13},
        attackType: 'normal',
        attackRange: 35,
        attackSpeed: 0.88,
        speed: 40,
        armorType: 'medium',
        armorValue: 0,
        color: "#602c2c",
        abilities: []
      }
    },
  };

  // Define available upgrades
  export const unitUpgrades = {
    // Guardian upgrades
    phalanxStance: {
      name: "Phalanx Stance",
      cost: 100,
      effect: "defend",
      description: "50% less damage from piercing attacks",
      requiredFortressLevel: 1
    },
    
    // Stalker upgrades
    astralString: {
      name: "Astral String",
      cost: 50,
      effect: "improvedBow",
      description: "Gain attack range",
      requiredFortressLevel: 1,
      statBoosts: {
        attackRange: 35 // +100 range
      }
    },
    
    phantomArrow: {
      name: "Phantom Arrow",
      cost: 100,
      effect: "marksmanship",
      description: "+3 attack damage",
      requiredFortressLevel: 3,
      statBoosts: {
        attackPowerBonus: 3 // +3 to min and max
      }
    },
    
    // Weaver upgrades
    stormAegis: {
      name: "Storm Aegis",
      cost: 100,
      effect: "lightningShield",
      description: "Forms a static shield around enemy unit, dealing 20 damage per sec",
      requiredFortressLevel: 1
    },
    
    primalFury: {
      name: "Primal Fury",
      cost: 100,
      effect: "bloodlust",
      description: "Increase friendly units attack speed by 40% and move speed by 25%",
      requiredFortressLevel: 3
    },
    
    // Leviathan upgrades
    infernoPayload: {
      name: "Inferno Payload",
      cost: 50,
      effect: "burningOil",
      description: "Each attack burns the ground for AoE damage",
      requiredFortressLevel: 2
    },
    
    // Oracle upgrades
    arcaneNullification: {
      name: "Arcane Nullification",
      cost: 100,
      effect: "dispelMagic",
      description: "Removes all buffs from units in target area",
      requiredFortressLevel: 2
    },
    
    soulFortification: {
      name: "Soul Fortification",
      cost: 100,
      effect: "innerFire",
      description: "Increases armor by 5 and adds 10% damage buff",
      requiredFortressLevel: 3
    },
    
    // Astral Nomad upgrades
    charmBreaker: {
      name: "Charm Breaker",
      cost: 100,
      effect: "disenchant",
      description: "Cast an AOE dispel",
      requiredFortressLevel: 2
    },
    
    phantomSummons: {
      name: "Phantom Summons",
      cost: 100,
      effect: "ancestralSpirit",
      description: "Raises a dead Juggernaut or Astral Nomad back to life",
      requiredFortressLevel: 3
    },
    
    // Trampler upgrades
    resonantEcho: {
      name: "Resonant Echo",
      cost: 150,
      effect: "warDrumUpgrade",
      description: "Increases the damage bonus of Battle Cadence by 10%",
      requiredFortressLevel: 3,
      modifiesAbility: "warDrum",
      abilityBoost: {
        damageBonus: 10 // +10% (total 15%)
      }
    },
    
    // Juggernaut upgrades
    seismicSlam: {
      name: "Seismic Slam",
      cost: 100,
      effect: "pulverize",
      description: "25% chance to deal 60 AOE damage on attacks",
      requiredFortressLevel: 3
    },
    
    // Colossus upgrades
    crystallineCarapace: {
      name: "Crystalline Carapace",
      cost: 150,
      effect: "hardenSkin",
      description: "Reduces all attacks by 8 damage (minimum 3)",
      requiredFortressLevel: 3
    },
    
    // Permafrost Drake upgrades
    glacialTempest: {
      name: "Glacial Tempest",
      cost: 100,
      effect: "freezingBreath",
      description: "Attacks stop buildings from attacking",
      requiredFortressLevel: 3
    }
  };

  // Make unit types available globally
  window.unitTypes = unitTypes;
  window.unitUpgrades = unitUpgrades;