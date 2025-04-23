  // systems/UpgradeSystem.js - Handles all unit upgrades
  export class UpgradeSystem {
    constructor(engine) {
      this.engine = engine;
    }
    
    update(delta) {
      // Nothing to update continuously
    }
    
    purchaseUpgrade(playerId, upgradeId) {
      console.log(`Attempting to purchase upgrade ${upgradeId} for ${playerId}`);
      
      const player = this.engine.players[playerId];
      const upgrade = window.unitUpgrades[upgradeId];
      
      if (!upgrade) {
        console.log(`ERROR: Upgrade ${upgradeId} not found`);
        return false;
      }
      
      // Check fortress level requirement
      if (player.fortressLevel < upgrade.requiredFortressLevel) {
        console.log(`Cannot purchase: Fortress level ${upgrade.requiredFortressLevel} required for ${upgrade.name}`);
        return false;
      }
      
      // Check if player has enough gold
      if (player.gold < upgrade.cost) {
        console.log(`Cannot purchase: Not enough gold. Need ${upgrade.cost}g, have ${player.gold}g`);
        return false;
      }
      
      // Check if upgrade is already purchased
      if (player.purchasedUpgrades && player.purchasedUpgrades.includes(upgradeId)) {
        console.log(`Cannot purchase: ${upgrade.name} already purchased`);
        return false;
      }
      
      // Purchase the upgrade
      player.gold -= upgrade.cost;
      
      // Track purchased upgrades
      if (!player.purchasedUpgrades) {
        player.purchasedUpgrades = [];
      }
      player.purchasedUpgrades.push(upgradeId);
      
      console.log(`SUCCESS: ${playerId} purchased ${upgrade.name} upgrade`);
      
      // Apply upgrade to all existing units of that type
      this.applyUpgradeToUnits(playerId, upgradeId);
      
      return true;
    }
    
    applyUpgradeToUnits(playerId, upgradeId) {
      console.log(`Enabling abilities for upgrade ${upgradeId} on all units for ${playerId}`);
      
      const units = this.engine.entities.getUnits(playerId);
      
      // Find units that can receive this upgrade
      units.forEach(unit => {
        if (this.shouldApplyUpgradeToUnit(unit, upgradeId)) {
          // Check each ability on the unit
          if (unit.abilities) {
            unit.abilities.forEach(ability => {
              // If this ability requires the purchased upgrade, enable it
              if (ability.requiredUpgrade === upgradeId && ability.enabled === false) {
                ability.enabled = true;
                console.log(`Enabled "${ability.name}" ability on ${unit.type} unit`);
              }
            });
          }
          
          // Add to unit's upgrades
          if (!unit.upgrades) {
            unit.upgrades = [];
          }
          
          if (!unit.upgrades.includes(upgradeId)) {
            unit.upgrades.push(upgradeId);
          }
          
          // Apply any stat bonuses from the upgrade
          this.applyStatBonuses(unit, upgradeId);
        }
      });
    }
    
    applyStatBonuses(unit, upgradeId) {
      const upgrade = window.unitUpgrades[upgradeId];
      if (!upgrade || !upgrade.statBoosts) return;
      
      // Apply each stat boost
      const statBoosts = upgrade.statBoosts;
      
      for (const stat in statBoosts) {
        const boostValue = statBoosts[stat];
        
        switch(stat) {
          case 'attackRange':
            unit.attackRange += boostValue;
            break;
            
          case 'attackPowerBonus':
            // For min-max attack power
            if (unit.attackPower && typeof unit.attackPower === 'object') {
              unit.attackPower.min += boostValue;
              unit.attackPower.max += boostValue;
            } else {
              unit.attackPower += boostValue;
            }
            break;
            
          case 'attackSpeed':
            unit.attackSpeed += boostValue;
            break;
            
          case 'speed':
            unit.speed += boostValue;
            break;
            
          case 'health':
          case 'maxHealth':
            unit.health += boostValue;
            unit.maxHealth += boostValue;
            break;
            
          case 'armor':
          case 'armorValue':
            unit.armorValue += boostValue;
            break;
        }
      }
    }
    
    shouldApplyUpgradeToUnit(unit, upgradeId) {
      // Find which unit types can receive this upgrade
      const unitType = window.unitTypes[unit.type];
      
      return unitType && 
             unitType.stats && 
             unitType.stats.possibleUpgrades && 
             unitType.stats.possibleUpgrades.includes(upgradeId);
    }
    
    getAvailableUpgrades(playerId) {
      const player = this.engine.players[playerId];
      const availableUpgrades = [];
      
      // Check each upgrade
      for (const upgradeId in window.unitUpgrades) {
        const upgrade = window.unitUpgrades[upgradeId];
        
        // Skip already purchased upgrades
        if (player.purchasedUpgrades && player.purchasedUpgrades.includes(upgradeId)) {
          continue;
        }
        
        // Check fortress level requirement
        if (player.fortressLevel < upgrade.requiredFortressLevel) {
          continue;
        }
        
        // This upgrade is available
        availableUpgrades.push({
          id: upgradeId,
          name: upgrade.name,
          cost: upgrade.cost,
          description: upgrade.description,
          canAfford: player.gold >= upgrade.cost
        });
      }
      
      return availableUpgrades;
    }
    
    reset() {
      // Nothing specific to reset
    }
  }