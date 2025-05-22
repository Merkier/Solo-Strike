// units/unitTypes.js - Unit definitions with reimagined fantasy units

  // Define all unit types with their stats
  export const unitTypes = {
  "guardian": {
    "name": "Guardian",
    "cost": 110,
    "requiredFortressLevel": 1,
    "stats": {
      "maxHealth": 220,
      "health": 220,
      "attackPower": {
        "min": 12,
        "max": 13
      },
      "attackType": "normal",
      "attackRange": 35,
      "attackSpeed": 0.88,
      "speed": 40,
      "armorType": "heavy",
      "armorValue": 2,
      "color": "#73bed3",
      "abilities": [
        {
          "spellId": "defend",
          "name": "Phalanx Stance",
          "enabled": false,
          "passive": true,
          "requiredUpgrade": "phalanxStance"
        }
      ],
      "possibleUpgrades": [
        "phalanxStance"
      ]
    }
  },
  "stalker": {
    "name": "Stalker",
    "cost": 160,
    "requiredFortressLevel": 1,
    "stats": {
      "maxHealth": 130,
      "health": 130,
      "attackPower": {
        "min": 16,
        "max": 18
      },
      "attackType": "pierce",
      "attackRange": 85,
      "attackSpeed": 0.98,
      "speed": 40,
      "armorType": "medium",
      "armorValue": 0,
      "color": "#8e44ad",
      "abilities": [
        {
          "spellId": "improvedBow",
          "name": "Improved Range",
          "enabled": false,
          "passive": true,
          "requiredUpgrade": "astralString"
        },
        {
          "spellId": "marksmanship",
          "name": "Phantom Arrow",
          "enabled": false,
          "passive": true,
          "requiredUpgrade": "phantomArrow"
        }
      ],
      "possibleUpgrades": [
        "astralString",
        "phantomArrow"
      ]
    }
  },
  "weaver": {
    "name": "Weaver",
    "cost": 140,
    "requiredFortressLevel": 1,
    "stats": {
      "maxHealth": 131,
      "health": 131,
      "maxMana": 200,
      "mana": 200,
      "attackPower": {
        "min": 11,
        "max": 13
      },
      "attackType": "magic",
      "attackRange": 101,
      "attackSpeed": 1.37,
      "speed": 40,
      "armorType": "unarmored",
      "armorValue": 0,
      "color": "#3498db",
      "abilities": [
        {
          "spellId": "purge",
          "name": "Cleanse",
          "enabled": true
        },
        {
          "spellId": "castLightningShield",
          "name": "Storm Aegis",
          "enabled": false,
          "requiredUpgrade": "stormAegis"
        },
        {
          "spellId": "castBloodlust",
          "name": "Primal Fury",
          "enabled": false,
          "requiredUpgrade": "primalFury"
        }
      ],
      "possibleUpgrades": [
        "stormAegis",
        "primalFury"
      ]
    }
  },
  "leviathan": {
    "name": "Leviathan",
    "cost": 300,
    "requiredFortressLevel": 2,
    "stats": {
      "maxHealth": 166,
      "health": 166,
      "attackPower": {
        "min": 49,
        "max": 53
      },
      "attackType": "siege",
      "attackRange": 120,
      "attackSpeed": 3.54,
      "speed": 30,
      "armorType": "heavy",
      "armorValue": 2,
      "color": "#e74c3c",
      "abilities": [
        {
          "spellId": "burningOil",
          "name": "Inferno Payload",
          "enabled": false,
          "passive": true,
          "requiredUpgrade": "infernoPayload"
        }
      ],
      "possibleUpgrades": [
        "infernoPayload"
      ]
    }
  },
  "oracle": {
    "name": "Oracle",
    "cost": 160,
    "requiredFortressLevel": 2,
    "stats": {
      "maxHealth": 113,
      "health": 113,
      "maxMana": 200,
      "mana": 200,
      "attackPower": {
        "min": 11,
        "max": 13
      },
      "attackType": "magic",
      "attackRange": 101,
      "attackSpeed": 1.3,
      "speed": 40,
      "armorType": "unarmored",
      "armorValue": 0,
      "color": "#f1c40f",
      "abilities": [
        {
          "spellId": "heal",
          "name": "Divine Mending",
          "enabled": true
        },
        {
          "spellId": "castDispelMagic",
          "name": "Arcane Nullification",
          "enabled": false
        },
        {
          "spellId": "castInnerFire",
          "name": "Soul Fortification",
          "enabled": false
        }
      ],
      "possibleUpgrades": [
        "arcaneNullification",
        "soulFortification"
      ]
    }
  },
  "astralNomad": {
    "name": "Astral Nomad",
    "cost": 170,
    "requiredFortressLevel": 2,
    "stats": {
      "maxHealth": 196,
      "health": 196,
      "maxMana": 300,
      "mana": 300,
      "attackPower": {
        "min": 17,
        "max": 22
      },
      "attackType": "magic",
      "attackRange": 101,
      "attackSpeed": 1.13,
      "speed": 40,
      "armorType": "unarmored",
      "armorValue": 0,
      "color": "#9b59b6",
      "abilities": [
        {
          "spellId": "spiritLink",
          "name": "Soul Tether",
          "enabled": true
        },
        {
          "spellId": "castDisenchant",
          "name": "Charm Breaker",
          "enabled": false
        },
        {
          "spellId": "castAncestralSpirit",
          "name": "Phantom Summons",
          "enabled": false
        }
      ],
      "possibleUpgrades": [
        "charmBreaker",
        "phantomSummons"
      ]
    }
  },
  "marauder": {
    "name": "Marauder",
    "cost": 160,
    "requiredFortressLevel": 2,
    "stats": {
      "maxHealth": 335,
      "health": 335,
      "attackPower": {
        "min": 23,
        "max": 27
      },
      "attackType": "siege",
      "attackRange": 35,
      "attackSpeed": 1.2,
      "speed": 50,
      "armorType": "medium",
      "armorValue": 0,
      "color": "#c0392b",
      "abilities": [
        {
          "spellId": "ensnare",
          "name": "Binding Chains",
          "enabled": true
        },
        {
          "spellId": "pillage",
          "name": "Plunder",
          "enabled": true,
          "passive": true
        }
      ],
      "possibleUpgrades": []
    }
  },
  "trampler": {
    "name": "Trampler",
    "cost": 270,
    "requiredFortressLevel": 2,
    "stats": {
      "maxHealth": 490,
      "health": 490,
      "attackPower": {
        "min": 16,
        "max": 20
      },
      "attackType": "pierce",
      "attackRange": 90,
      "attackSpeed": 0.94,
      "speed": 35,
      "armorType": "unarmored",
      "armorValue": 1,
      "color": "#795548",
      "abilities": [
        {
          "spellId": "devour",
          "name": "Consumption",
          "enabled": true
        },
        {
          "spellId": "warDrum",
          "name": "Battle Cadence",
          "enabled": true,
          "passive": true
        },
        {
          "spellId": "warDrumUpgrade",
          "name": "Resonant Echo",
          "enabled": false,
          "passive": true,
          "requiredUpgrade": "resonantEcho"
        }
      ],
      "possibleUpgrades": [
        "resonantEcho"
      ]
    }
  },
  "juggernaut": {
    "name": "Juggernaut",
    "cost": 300,
    "requiredFortressLevel": 3,
    "stats": {
      "maxHealth": 637,
      "health": 637,
      "attackPower": {
        "min": 30,
        "max": 36
      },
      "attackType": "normal",
      "attackRange": 35,
      "attackSpeed": 1.24,
      "speed": 40,
      "armorType": "heavy",
      "armorValue": 3,
      "color": "#d35400",
      "abilities": [
        {
          "spellId": "pulverize",
          "name": "Seismic Slam",
          "enabled": false,
          "passive": true,
          "requiredUpgrade": "seismicSlam"
        }
      ],
      "possibleUpgrades": [
        "seismicSlam"
      ]
    }
  },
  "colossus": {
    "name": "Colossus",
    "cost": 310,
    "requiredFortressLevel": 3,
    "stats": {
      "maxHealth": 686,
      "health": 686,
      "attackPower": {
        "min": 28,
        "max": 40
      },
      "attackType": "normal",
      "attackRange": 35,
      "attackSpeed": 1.63,
      "speed": 35,
      "armorType": "normal",
      "armorValue": 0,
      "color": "#7f8c8d",
      "abilities": [
        {
          "spellId": "taunt",
          "name": "Challenging Roar",
          "enabled": true
        },
        {
          "spellId": "hardenSkin",
          "name": "Crystalline Carapace",
          "enabled": false,
          "passive": true,
          "requiredUpgrade": "crystallineCarapace"
        }
      ],
      "possibleUpgrades": [
        "crystallineCarapace"
      ]
    }
  },
  "permafrostDrake": {
    "name": "Permafrost Drake",
    "cost": 440,
    "requiredFortressLevel": 3,
    "stats": {
      "maxHealth": 650,
      "health": 650,
      "attackPower": {
        "min": 85,
        "max": 105
      },
      "attackType": "magic",
      "attackRange": 85,
      "attackSpeed": 1.95,
      "speed": 45,
      "armorType": "light",
      "armorValue": 1,
      "color": "#00bcd4",
      "abilities": [
        {
          "spellId": "freezingBreath",
          "name": "Glacial Tempest",
          "enabled": false,
          "passive": true,
          "requiredUpgrade": "glacialTempest"
        }
      ],
      "possibleUpgrades": [
        "glacialTempest"
      ]
    }
  },
  "basic": {
    "name": "Basic",
    "cost": 90,
    "requiredFortressLevel": 1,
    "stats": {
      "maxHealth": 165,
      "health": 165,
      "attackPower": {
        "min": 13,
        "max": 13
      },
      "attackType": "normal",
      "attackRange": 35,
      "attackSpeed": 0.88,
      "speed": 40,
      "armorType": "medium",
      "armorValue": 0,
      "color": "#602c2c",
      "abilities": []
    }
  }
};

  // Define available upgrades
  export const unitUpgrades = {
  "phalanxStance": {
    "name": "Phalanx Stance",
    "cost": 100,
    "effect": "defend",
    "description": "50% less damage from piercing attacks",
    "requiredFortressLevel": 1
  },
  "astralString": {
    "name": "Astral String",
    "cost": 50,
    "effect": "improvedBow",
    "description": "Gain attack range",
    "requiredFortressLevel": 1,
    "statBoosts": {
      "attackRange": 35
    }
  },
  "phantomArrow": {
    "name": "Phantom Arrow",
    "cost": 100,
    "effect": "marksmanship",
    "description": "+3 attack damage",
    "requiredFortressLevel": 3,
    "statBoosts": {
      "attackPowerBonus": 3
    }
  },
  "stormAegis": {
    "name": "Storm Aegis",
    "cost": 100,
    "effect": "lightningShield",
    "description": "Forms a static shield around enemy unit, dealing 20 damage per sec",
    "requiredFortressLevel": 1
  },
  "primalFury": {
    "name": "Primal Fury",
    "cost": 100,
    "effect": "bloodlust",
    "description": "Increase friendly units attack speed by 40% and move speed by 25%",
    "requiredFortressLevel": 3
  },
  "infernoPayload": {
    "name": "Inferno Payload",
    "cost": 50,
    "effect": "burningOil",
    "description": "Each attack burns the ground for AoE damage",
    "requiredFortressLevel": 2
  },
  "arcaneNullification": {
    "name": "Arcane Nullification",
    "cost": 100,
    "effect": "dispelMagic",
    "description": "Removes all buffs from units in target area",
    "requiredFortressLevel": 2
  },
  "soulFortification": {
    "name": "Soul Fortification",
    "cost": 100,
    "effect": "innerFire",
    "description": "Increases armor by 5 and adds 10% damage buff",
    "requiredFortressLevel": 3
  },
  "charmBreaker": {
    "name": "Charm Breaker",
    "cost": 100,
    "effect": "disenchant",
    "description": "Cast an AOE dispel",
    "requiredFortressLevel": 2
  },
  "phantomSummons": {
    "name": "Phantom Summons",
    "cost": 100,
    "effect": "ancestralSpirit",
    "description": "Raises a dead Juggernaut or Astral Nomad back to life",
    "requiredFortressLevel": 3
  },
  "resonantEcho": {
    "name": "Resonant Echo",
    "cost": 150,
    "effect": "warDrumUpgrade",
    "description": "Increases the damage bonus of Battle Cadence by 10%",
    "requiredFortressLevel": 3,
    "modifiesAbility": "warDrum",
    "abilityBoost": {
      "damageBonus": 10
    }
  },
  "seismicSlam": {
    "name": "Seismic Slam",
    "cost": 100,
    "effect": "pulverize",
    "description": "25% chance to deal 60 AOE damage on attacks",
    "requiredFortressLevel": 3
  },
  "crystallineCarapace": {
    "name": "Crystalline Carapace",
    "cost": 150,
    "effect": "hardenSkin",
    "description": "Reduces all attacks by 8 damage (minimum 3)",
    "requiredFortressLevel": 3
  },
  "glacialTempest": {
    "name": "Glacial Tempest",
    "cost": 100,
    "effect": "freezingBreath",
    "description": "Attacks stop buildings from attacking",
    "requiredFortressLevel": 3
  }
};

  // Make unit types available globally
  if (typeof window !== 'undefined') {
    window.unitTypes = unitTypes;
    window.unitUpgrades = unitUpgrades;
  }