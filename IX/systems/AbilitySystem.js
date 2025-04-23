// systems/AbilitySystem.js - Handles all abilities
export class AbilitySystem {
  constructor(engine) {
    this.engine = engine;
    this.deadUnits = []; // Store recently dead units for resurrection abilities
    this.activeEffects = {
      buffs: [],
      debuffs: [],
      groundEffects: []
    };
  }
    
  update(delta) {
    // Update ability cooldowns and auto-cast logic
    this.updateCooldowns(delta);
    this.processAutoCast();
    
    // Process active effects
    this.updateActiveEffects(delta);
  }
    
  updateCooldowns(delta) {
    // Update ability cooldowns for all units
    const units = this.engine.entities.getUnits();
    
    units.forEach(unit => {
      if (!unit.abilities) return;
      
      unit.abilities.forEach(ability => {
        if (ability.cooldownRemaining && ability.cooldownRemaining > 0) {
          ability.cooldownRemaining -= delta;
          if (ability.cooldownRemaining < 0) ability.cooldownRemaining = 0;
        }
      });
    });
  }
    
  processAutoCast() {
    // Auto-cast abilities based on settings
    const units = this.engine.entities.getUnits();
    
    units.forEach(unit => {
      // Skip if unit has no abilities
      if (!unit.abilities) return;
      
      // Check auto-cast settings
      const autoCastSettings = this.engine.playerManager.getAutoCastSettings(unit.type, unit.playerId);
      
      // Check each ability
      unit.abilities.forEach(ability => {
        // Skip if ability is passive, disabled, or auto-cast is disabled
        if (
          ability.passive || 
          ability.enabled === false || 
          autoCastSettings[ability.name] === false
        ) {
          return;
        }
        
        // Skip if ability is on cooldown
        if (ability.cooldownRemaining && ability.cooldownRemaining > 0) {
          return;
        }
        
        // Skip if not enough mana
        if (ability.manaCost && unit.mana < ability.manaCost) {
          return;
        }
        
        // Try to auto-cast the ability
        this.tryAutoCast(unit, ability);
      });
    });
  }
    
// Update the tryAutoCast method in AbilitySystem.js to check for targets within range first

// This is the current implementation of tryAutoCast with our improvements:
tryAutoCast(unit, ability) {
  // First check: get only enemies within attack range
  const enemyUnits = this.engine.entities.getUnits()
    .filter(u => u.playerId !== unit.playerId && this.distanceBetween(unit, u) <= unit.attackRange);
  
  // Get friendly units within range as well
  const friendlyUnits = this.engine.entities.getUnits()
    .filter(u => u.playerId === unit.playerId && u !== unit && this.distanceBetween(unit, u) <= unit.attackRange);
  
  // Early return if no units in range and ability needs targets
  if (ability.effect !== 'bloodlust' && ability.effect !== 'castBloodlust' && 
      !['dispel', 'castDispelMagic', 'disenchant'].includes(ability.effect) &&
      enemyUnits.length === 0 && friendlyUnits.length === 0) {
    return; // No suitable targets in range
  }
  
  // Auto-cast logic based on ability effect type
  switch(ability.effect) {
    // Healing abilities
    case 'heal':
      // Heal injured friendly units within range
      const injuredAllies = friendlyUnits
        .filter(ally => ally.health < ally.maxHealth * 0.7)
        .sort((a, b) => (a.health / a.maxHealth) - (b.health / b.maxHealth));
      
      if (injuredAllies.length > 0) {
        const target = injuredAllies[0]; // Most injured
        this.useAbility(unit, ability.name, target.x, target.y, target);
      }
      break;
      
    // Dispel abilities - only cast if enemies are in detection range
    case 'dispel':
    case 'castDispelMagic':
    case 'disenchant':
      if (enemyUnits.length >= 3) {
        // Check for enemies with buffs
        const enemiesWithBuffs = enemyUnits.filter(enemy => 
          enemy.buffs && Object.keys(enemy.buffs).length > 0
        );
        
        // Only cast if there are enemies with buffs to dispel
        if (enemiesWithBuffs.length >= 2) {
          // Simple clustering - find center of nearby enemy group
          const centerX = enemiesWithBuffs.reduce((sum, u) => sum + u.x, 0) / enemiesWithBuffs.length;
          const centerY = enemiesWithBuffs.reduce((sum, u) => sum + u.y, 0) / enemiesWithBuffs.length;
          
          // Verify center point is within range
          if (this.distanceBetween(unit, {x: centerX, y: centerY}) <= unit.attackRange) {
            this.useAbility(unit, ability.name, centerX, centerY);
          }
        }
      }
      break;
      
    // Group buff abilities - cast if we have friendly units within range
    case 'bloodlust':
    case 'castBloodlust':
      // Get detection range for finding groups of friendly units
      const detectionRange = Math.min(unit.attackRange, 300); // Use whichever is smaller
      
      // Filter out units that already have the buff
      const unbuffedFriendlies = this.engine.entities.getUnits(unit.playerId)
        .filter(u => u !== unit && 
                this.distanceBetween(unit, u) <= detectionRange &&
                (!u.buffs || !u.buffs["Bloodlust"])); // Check if unit already has buff
      
      if (unbuffedFriendlies.length >= 3) {
        // Center of friendly group
        const centerX = unbuffedFriendlies.reduce((sum, u) => sum + u.x, 0) / unbuffedFriendlies.length;
        const centerY = unbuffedFriendlies.reduce((sum, u) => sum + u.y, 0) / unbuffedFriendlies.length;
        
        // Verify center is within casting range
        if (this.distanceBetween(unit, {x: centerX, y: centerY}) <= unit.attackRange) {
          this.useAbility(unit, ability.name, centerX, centerY);
        }
      }
      break;
      
    // Single target enemy abilities
    case 'castLightningShield':
      // Filter out enemies that already have Lightning Shield
      const unbuffedEnemies = enemyUnits.filter(enemy => 
        !enemy.debuffs || !enemy.debuffs["Lightning Shield"]
      );
      
      if (unbuffedEnemies.length > 0) {
        // Sort by estimated unit value (health + attack power)
        const sortedEnemies = unbuffedEnemies
          .sort((a, b) => {
            const aValue = a.maxHealth + (typeof a.attackPower === 'object' ? 
              (a.attackPower.min + a.attackPower.max)/2 : a.attackPower);
              
            const bValue = b.maxHealth + (typeof b.attackPower === 'object' ? 
              (b.attackPower.min + b.attackPower.max)/2 : b.attackPower);
              
            return bValue - aValue;
          });
          
        const target = sortedEnemies[0];
        this.useAbility(unit, ability.name, target.x, target.y, target);
      }
      break;
      
    // Self-centered abilities
    case 'taunt':
      // Cast taunt when surrounded by enemy units
      const nearbyEnemies = enemyUnits.filter(enemy => 
        this.distanceBetween(unit, enemy) < 150 &&
        (!enemy.debuffs || !enemy.debuffs["Taunted"]) // Avoid targeting already taunted enemies
      );
      
      if (nearbyEnemies.length >= 2) {
        this.useAbility(unit, ability.name, unit.x, unit.y);
      }
      break;
      
    // Single target buff abilities  
    case 'castInnerFire':
      // Filter out units that already have Inner Fire buff
      const unbuffedAllies = friendlyUnits.filter(ally => 
        !ally.buffs || !ally.buffs["Inner Fire"]
      );
      
      if (unbuffedAllies.length > 0) {
        // Prefer high damage units
        const sortedAllies = unbuffedAllies
          .sort((a, b) => {
            const aAttack = typeof a.attackPower === 'object' ? 
              (a.attackPower.min + a.attackPower.max)/2 : a.attackPower;
              
            const bAttack = typeof b.attackPower === 'object' ? 
              (b.attackPower.min + b.attackPower.max)/2 : b.attackPower;
              
            return bAttack - aAttack;
          });
          
        const target = sortedAllies[0];
        this.useAbility(unit, ability.name, target.x, target.y, target);
      }
      break;
  }
}

// Also update the useAbility method to ensure targets are in range:
useAbility(unit, abilityName, targetX, targetY, targetUnit = null) {
  // Find the ability
  const ability = unit.abilities.find(a => a.name === abilityName);
  if (!ability) {
    console.log(`Ability ${abilityName} not found for unit ${unit.type}`);
    return false;
  }
  
  // Check if ability is enabled
  if (ability.enabled === false) {
    console.log(`Ability ${abilityName} is not enabled for this unit`);
    return false;
  }
  
  // Check cooldown
  if (ability.cooldownRemaining && ability.cooldownRemaining > 0) {
    console.log(`${abilityName} is on cooldown: ${ability.cooldownRemaining.toFixed(1)}s`);
    return false;
  }

  // Check if target is within range
  if (targetUnit) {
    const distance = this.distanceBetween(unit, targetUnit);
    if (distance > unit.attackRange) {
      console.log(`Target is out of range for ${abilityName}`);
      return false;
    }
  } else if (targetX !== undefined && targetY !== undefined) {
    // For ground-targeted abilities
    const distance = Math.sqrt(
      Math.pow(targetX - unit.x, 2) + 
      Math.pow(targetY - unit.y, 2)
    );
    if (distance > unit.attackRange) {
      console.log(`Target location is out of range for ${abilityName}`);
      return false;
    }
  }

  // Check mana
  if (ability.manaCost && unit.mana < ability.manaCost) {
    console.log(`Not enough mana for ${abilityName}`);
    return false;
  }
  
  // Use mana
  if (ability.manaCost) {
    unit.mana -= ability.manaCost;
  }
  
  // Start cooldown
  ability.cooldownRemaining = ability.cooldown;
  
  // Handle ability based on effect type
  let success = false;
  
  // Dispatch to appropriate ability handler
  switch(ability.effect) {
    // Healing abilities
    case 'heal':
      success = this.castHeal(unit, targetUnit);
      break;
      
    // Dispel abilities
    case 'dispel':
    case 'castDispelMagic':
    case 'disenchant':
      success = this.castDispel(unit, targetX, targetY);
      break;
      
    // Buff abilities
    case 'bloodlust':
    case 'castBloodlust':
      success = this.castBloodlust(unit, targetX, targetY);
      break;
      
    case 'castInnerFire':
      success = this.castInnerFire(unit, targetUnit);
      break;
      
    // Special effects
    case 'castLightningShield':
      success = this.castLightningShield(unit, targetUnit);
      break;
      
    case 'taunt':
      success = this.castTaunt(unit);
      break;
      
    case 'spiritLink':
      success = this.castSpiritLink(unit, targetX, targetY);
      break;
      
    case 'ancestralSpirit':
      success = this.castAncestralSpirit(unit, targetX, targetY);
      break;
      
    // Default case for abilities not yet implemented
    default:
      console.log(`Ability effect type not implemented: ${ability.effect}`);
      return false;
  }
  
  console.log(`${unit.type} used ${abilityName} - ${success ? 'SUCCESS' : 'FAILED'}`);
  return success;
}
  // ========== Active ability implementations ==========
    
  // Healing ability
  castHeal(caster, target) {
    if (!target || target.playerId !== caster.playerId) return false;
    
    // Create visual effect
    this.engine.systems.get('visual').createEffect({
      type: 'heal',
      x: target.x,
      y: target.y,
      duration: 1.5
    });
    
    // Heal for 25 HP
    target.health = Math.min(target.maxHealth, target.health + 25);
    
    // Add buff for visual indicator
    this.addBuff({
      name: "Divine Mending",
      targetUnit: target,
      source: caster,
      duration: 1,
      visualOnly: true,
      visualEffect: "healGlow"
    });
    
    return true;
  }
    
  // Dispel abilities
  castDispel(caster, targetX, targetY) {
    // Create visual effect
    this.engine.systems.get('visual').createEffect({
      type: 'dispel',
      x: targetX,
      y: targetY,
      radius: 150,
      duration: 1.5
    });
    
    // Find units in range
    const units = this.engine.entities.getUnits();
    const radius = 150;
    
    const unitsInRange = units.filter(unit => {
      const distance = this.distanceBetween(unit, {x: targetX, y: targetY});
      return distance <= radius;
    });
    
    if (unitsInRange.length === 0) return false;
    
    // Remove buffs/debuffs based on relationship
    unitsInRange.forEach(unit => {
      if (unit.playerId !== caster.playerId) {
        // Remove buffs from enemies
        this.removeAllBuffs(unit);
      } else {
        // Remove debuffs from allies
        this.removeAllDebuffs(unit);
      }
    });
    
    return true;
  }
    
  // Bloodlust buff
  castBloodlust(caster, targetX, targetY) {
    // Create visual effect
    this.engine.systems.get('visual').createEffect({
      type: 'bloodlust',
      x: targetX,
      y: targetY,
      radius: 300,
      duration: 1.5
    });
    
    // Find friendly units in range
    const friendlyUnits = this.engine.entities.getUnits(caster.playerId);
    const radius = 300;
    
    const unitsInRange = friendlyUnits.filter(unit => {
      return this.distanceBetween(unit, {x: targetX, y: targetY}) <= radius;
    });
    
    if (unitsInRange.length === 0) return false;
    
    // Apply Bloodlust buff to all units in range
    unitsInRange.forEach(unit => {
      this.addBuff({
        name: "Bloodlust",
        targetUnit: unit,
        source: caster,
        duration: 15, // 15 seconds
        effect: "bloodlust",
        attackSpeedBonus: 0.4, // 40% attack speed
        moveSpeedBonus: 0.25, // 25% move speed
        visualEffect: "bloodlustAura"
      });
    });
    
    return true;
  }
    
  // Inner Fire buff
  castInnerFire(caster, target) {
    if (!target || target.playerId !== caster.playerId) return false;
    
    // Create visual effect
    this.engine.systems.get('visual').createEffect({
      type: 'innerFire',
      x: target.x,
      y: target.y,
      duration: 2.0
    });
    
    // Apply Inner Fire buff
    this.addBuff({
      name: "Inner Fire",
      targetUnit: target,
      source: caster,
      duration: 30, // 30 seconds
      effect: "innerFire",
      armorBonus: 5, // +5 armor
      damageBonus: 0.1, // 10% damage
      visualEffect: "innerFireAura"
    });
    
    return true;
  }
  
  // Lightning Shield ability
  castLightningShield(caster, target) {
    if (!target || target.playerId === caster.playerId) return false;
    
    // Create visual effect tied to target
    const effect = this.engine.systems.get('visual').createEffect({
      type: 'lightningShield',
      targetUnit: target,
      duration: 15,
      damage: 20, // 20 damage per second
      radius: 30 // 30 unit radius
    });
    
    // Add debuff
    this.addDebuff({
      name: "Lightning Shield",
      targetUnit: target,
      source: caster,
      duration: 15, // 15 seconds
      effect: "lightningShield",
      damagePerSecond: 20,
      aoeRadius: 30,
      visualEffect: effect
    });
    
    return true;
  }
    
  // Taunt ability
  castTaunt(caster) {
    // Create visual effect around caster
    this.engine.systems.get('visual').createEffect({
      type: 'taunt',
      x: caster.x,
      y: caster.y,
      radius: 250,
      duration: 1.5
    });
    
    // Find enemy units in range
    const enemyUnits = this.engine.entities.getUnits()
      .filter(unit => unit.playerId !== caster.playerId);
    
    const radius = 250;
    
    const unitsInRange = enemyUnits.filter(unit => {
      return this.distanceBetween(unit, caster) <= radius;
    });
    
    if (unitsInRange.length === 0) return false;
    
    // Force enemies to target the caster
    unitsInRange.forEach(unit => {
      unit.target = caster;
      
      // Add visual indicator
      this.addDebuff({
        name: "Taunted",
        targetUnit: unit,
        source: caster,
        duration: 5, // 5 seconds
        effect: "taunt",
        visualOnly: true,
        visualEffect: "tauntedIndicator"
      });
    });
    
    return true;
  }
    
  // Spirit Link ability
  castSpiritLink(caster, targetX, targetY) {
    // Create visual effect
    this.engine.systems.get('visual').createEffect({
      type: 'spiritLink',
      x: targetX,
      y: targetY,
      radius: 300,
      duration: 2.0
    });
    
    // Find friendly units in range
    const friendlyUnits = this.engine.entities.getUnits(caster.playerId);
    const radius = 300;
    
    const unitsInRange = friendlyUnits.filter(unit => {
      return this.distanceBetween(unit, {x: targetX, y: targetY}) <= radius;
    });
    
    // Need at least 2 units to link
    if (unitsInRange.length < 2) return false;
    
    // Limit to 4 units maximum
    const linkedUnits = unitsInRange.slice(0, 4);
    
    // Create spirit link group
    const spiritLinkGroup = {
      id: Date.now(),
      units: linkedUnits,
      source: caster,
      damageSharing: 0.5, // 50% damage sharing
      duration: 45, // 45 seconds
    };
    
    // Store spirit link group
    if (!this.spiritLinkGroups) {
      this.spiritLinkGroups = [];
    }
    this.spiritLinkGroups.push(spiritLinkGroup);
    
    // Add visual buff effect to linked units
    linkedUnits.forEach(unit => {
      this.addBuff({
        name: "Spirit Link",
        targetUnit: unit,
        source: caster,
        duration: 45,
        effect: "spiritLink",
        spiritLinkGroupId: spiritLinkGroup.id,
        visualEffect: "spiritLinkAura"
      });
    });
    
    return true;
  }
    
  // Resurrect ability
  castAncestralSpirit(caster, targetX, targetY) {
    // Create visual effect
    this.engine.systems.get('visual').createEffect({
      type: 'ancestralSpirit',
      x: targetX,
      y: targetY,
      duration: 3.0
    });
    
    // Find dead units that can be resurrected (within last 60 seconds)
    const validDeadUnits = this.deadUnits.filter(deadUnit => {
      // Check if unit is from the same player
      if (deadUnit.playerId !== caster.playerId) return false;
      
      // Check if unit type is valid for resurrection
      if (!['juggernaut', 'astralNomad'].includes(deadUnit.type)) return false;
      
      // Check if unit died recently (within 60 seconds)
      const currentTime = Date.now() / 1000;
      return currentTime - deadUnit.deadTime < 60;
    });
    
    // Find closest dead unit to target location
    let closestDeadUnit = null;
    let closestDistance = Infinity;
    
    validDeadUnits.forEach(deadUnit => {
      const distance = Math.sqrt(
        Math.pow(deadUnit.x - targetX, 2) + 
        Math.pow(deadUnit.y - targetY, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestDeadUnit = deadUnit;
      }
    });
    
    if (!closestDeadUnit) return false;
    
    // Create new unit at target location
    const unitData = window.unitTypes[closestDeadUnit.type];
    
    // Use WaveManager to spawn unit since it has the proper setup logic
    const waveManager = this.engine.waveManager;
    
    // Create a temporary unit and let WaveManager apply upgrades
    const unit = new Unit(
      closestDeadUnit.type, 
      caster.playerId,
      targetX, 
      targetY
    );
    
    // Apply upgrades and effects
    const player = this.engine.players[caster.playerId];
    waveManager.applyUpgradesToUnit(unit, player);
    
    // Add resurrection visual effect
    this.engine.systems.get('visual').createEffect({
      type: 'resurrection',
      x: targetX,
      y: targetY,
      duration: 2.0
    });
    
    // Add unit to entities
    this.engine.entities.add(unit);
    
    // Remove from dead units list
    const index = this.deadUnits.indexOf(closestDeadUnit);
    if (index !== -1) {
      this.deadUnits.splice(index, 1);
    }
    
    return true;
  }
    
  // ========== Passive ability methods ==========
  
  // These methods are called from CombatSystem when attacks occur
  
  /**
   * Handle a unit attacking - trigger any passive abilities that activate on attack
   * @param {Object} attacker - The attacking unit
   * @param {Object} target - The target being attacked
   * @param {Number} damage - The damage being dealt
   * @returns {Object} Modified damage and effects
   */
  handleAttackAbilities(attacker, target, damage) {
    let modifiedDamage = damage;
    const effects = [];
    
    // Skip if unit has no abilities
    if (!attacker.abilities) return { damage: modifiedDamage, effects };
    
    // Check each ability
    attacker.abilities.forEach(ability => {
      // Skip if ability is not passive or is disabled
      if (!ability.passive || ability.enabled === false) return;
      
      // Process passive abilities that trigger on attack
      switch(ability.effect) {
        case 'pulverize': // Seismic Slam
          // 25% chance to proc
          if (Math.random() < 0.25) {
            // Find enemy units in AoE
            const aoeRadius = 60;
            const enemyUnits = this.engine.entities.getUnits()
              .filter(otherUnit => 
                otherUnit.playerId !== attacker.playerId && 
                this.distanceBetween(target, otherUnit) <= aoeRadius &&
                otherUnit !== target // Exclude the main target
              );
            
            // Deal AoE damage
            enemyUnits.forEach(enemyUnit => {
              enemyUnit.takeDamage(60); // Flat 60 damage
            });
            
            // Add visual effect
            effects.push({
              type: 'seismicSlam',
              x: target.x,
              y: target.y,
              radius: aoeRadius
            });
          }
          break;
          
        case 'burningOil': // Inferno Payload
          // Create ground effect
          effects.push({
            type: 'burningOil',
            x: target.x,
            y: target.y,
            radius: 80,
            duration: 5,
            sourcePlayerId: attacker.playerId,
            damagePerSecond: 15
          });
          break;
          
        case 'pillage': // Plunder
          // Only works against fortresses
          if (target.type === 'fortress') {
            // Gain gold per attack on buildings
            const player = this.engine.players[attacker.playerId];
            player.gold += 10; // +10 gold per attack
            
            // Add visual effect
            effects.push({
              type: 'plunder',
              x: attacker.x,
              y: attacker.y
            });
          }
          break;
          
        case 'freezingBreath': // Glacial Tempest
          // Only works against fortresses
          if (target.type === 'fortress') {
            // Stun the fortress
            target.stunned = true;
            target.stunDuration = 4; // 4 seconds
            
            // Add visual effect
            effects.push({
              type: 'glacialTempest',
              x: target.x,
              y: target.y
            });
          }
          break;
      }
    });
    
    return { damage: modifiedDamage, effects };
  }
  
  /**
   * Handle a unit being attacked - trigger any passive abilities that activate on being attacked
   * @param {Object} defender - The unit being attacked
   * @param {Object} attacker - The attacking unit
   * @param {Number} damage - The damage being dealt
   * @param {String} attackType - The type of attack (normal, pierce, etc.)
   * @returns {Number} Modified damage
   */
  handleDefenseAbilities(defender, attacker, damage, attackType) {
    let modifiedDamage = damage;
    
    // Skip if unit has no abilities
    if (!defender.abilities) return modifiedDamage;
    
    // Check each ability
    defender.abilities.forEach(ability => {
      // Skip if ability is not passive or is disabled
      if (!ability.passive || ability.enabled === false) return;
      
      // Process passive abilities that trigger on being attacked
      switch(ability.effect) {
        case 'defend': // Phalanx Stance
          // Reduce piercing damage by 50%
          if (attackType === 'pierce') {
            modifiedDamage *= 0.5;
            
            // Add visual effect
            this.engine.systems.get('visual').createEffect({
              type: 'phalanxStance',
              x: defender.x,
              y: defender.y,
              duration: 0.5
            });
          }
          break;
          
        case 'hardenSkin': // Crystalline Carapace
          // Reduce all damage by 8 (minimum 3)
          modifiedDamage = Math.max(3, modifiedDamage - 8);
          
          // Add visual effect
          this.engine.systems.get('visual').createEffect({
            type: 'crystallineCarapace',
            x: defender.x,
            y: defender.y,
            duration: 0.5
          });
          break;
      }
    });
    
    // Handle spirit link damage sharing
    if (this.spiritLinkGroups) {
      // Check if unit is part of a spirit link group
      this.spiritLinkGroups.forEach(group => {
        if (group.units.includes(defender)) {
          // Calculate damage to share
          const damageToShare = modifiedDamage * group.damageSharing;
          const sharedDamage = damageToShare / (group.units.length - 1);
          
          // Apply shared damage to other units in group
          group.units.forEach(unit => {
            if (unit !== defender && unit.active) {
              unit.takeDamage(sharedDamage);
              
              // Add visual effect
              this.engine.systems.get('visual').createEffect({
                type: 'spiritLinkDamage',
                x: unit.x,
                y: unit.y,
                duration: 0.5
              });
            }
          });
          
          // Reduce damage to defender
          modifiedDamage -= damageToShare;
          
          // Add visual effect
          this.engine.systems.get('visual').createEffect({
            type: 'spiritLinkDamage',
            x: defender.x,
            y: defender.y,
            duration: 0.5
          });
        }
      });
    }
    
    return modifiedDamage;
  }
  
  // ========== Buff and debuff management ==========
    
// In AbilitySystem.js, update the addBuff method
addBuff(buffData) {
  const { targetUnit, effect, name } = buffData;
  
  // Check if this buff already exists
  if (!targetUnit.buffs) targetUnit.buffs = {};
  const existingBuff = targetUnit.buffs[name];
  
  if (existingBuff) {
    // CHANGE THIS: Instead of just refreshing, check if it's the same effect
    if (existingBuff.effect === effect) {
      // Same buff and effect, just refresh duration
      existingBuff.duration = buffData.duration;
      return;
    } else {
      // Different effect with same name - don't allow multiple
      console.log(`Unit already has a ${name} buff with a different effect`);
      return;
    }
  }
    
    // Apply buff effects to unit
    if (effect === "bloodlust") {
      // Store original values
      targetUnit._originalAttackSpeed = targetUnit.attackSpeed;
      targetUnit._originalSpeed = targetUnit.speed;
      
      // Apply bonuses
      targetUnit.attackSpeed /= (1 + buffData.attackSpeedBonus);
      targetUnit.speed *= (1 + buffData.moveSpeedBonus);
    } else if (effect === "innerFire") {
      // Store original values
      targetUnit._originalArmorValue = targetUnit.armorValue;
      targetUnit._originalAttackPower = targetUnit.attackPower;
      
      // Apply bonuses
      targetUnit.armorValue += buffData.armorBonus;
      
      // Apply attack power bonus
      if (typeof targetUnit.attackPower === 'object') {
        targetUnit.attackPower = {
          min: targetUnit.attackPower.min * (1 + buffData.damageBonus),
          max: targetUnit.attackPower.max * (1 + buffData.damageBonus)
        };
      } else {
        targetUnit.attackPower *= (1 + buffData.damageBonus);
      }
    }
    
    // Add to unit's buffs
    targetUnit.buffs[buffData.name] = buffData;
    
    // Also track in active effects for animation
    this.activeEffects.buffs.push(buffData);
  }
    
  addDebuff(debuffData) {
    const { targetUnit, effect, name } = debuffData;
    
    // Check if this debuff already exists
    if (!targetUnit.debuffs) targetUnit.debuffs = {};
    const existingDebuff = targetUnit.debuffs[name];
    
    if (existingDebuff) {
      // CHANGE THIS: Instead of just refreshing, check if it's the same effect
      if (existingDebuff.effect === effect) {
        // Same debuff and effect, just refresh duration
        existingDebuff.duration = debuffData.duration;
        return;
      } else {
        // Different effect with same name - don't allow multiple
        console.log(`Unit already has a ${name} debuff with a different effect`);
        return;
      }
    }
    
    // Apply debuff effects to unit
    if (effect === "slow") {
      // Store original values
      targetUnit._originalSpeed = targetUnit.speed;
      
      // Apply slow
      targetUnit.speed *= (1 - debuffData.speedReduction);
    } else if (effect === "lightningShield") {
      // No direct stat changes, just damage over time handled in updateActiveEffects
    }
    
    // Add to unit's debuffs
    targetUnit.debuffs[debuffData.name] = debuffData;
    
    // Also track in active effects for animation
    this.activeEffects.debuffs.push(debuffData);
  }
    
  removeAllBuffs(unit) {
    // Initialize buffs if not present
    if (!unit.buffs) unit.buffs = {};
    
    // Remove all buffs from a unit
    const buffNames = Object.keys(unit.buffs);
    
    buffNames.forEach(name => {
      const buff = unit.buffs[name];
      this.removeBuff(buff);
    });
  }
    
  removeAllDebuffs(unit) {
    // Initialize debuffs if not present
    if (!unit.debuffs) unit.debuffs = {};
    
    // Remove all debuffs from a unit
    const debuffNames = Object.keys(unit.debuffs);
    
    debuffNames.forEach(name => {
      const debuff = unit.debuffs[name];
      this.removeDebuff(debuff);
    });
  }
    
  removeBuff(buff) {
    const { targetUnit, effect } = buff;
    
    // Remove buff effects
    if (effect === "bloodlust") {
      // Restore original values
      if (targetUnit._originalAttackSpeed) {
        targetUnit.attackSpeed = targetUnit._originalAttackSpeed;
        delete targetUnit._originalAttackSpeed;
      }
      
      if (targetUnit._originalSpeed) {
        targetUnit.speed = targetUnit._originalSpeed;
        delete targetUnit._originalSpeed;
      }
    } else if (effect === "innerFire") {
      // Restore original values
      if (targetUnit._originalArmorValue) {
        targetUnit.armorValue = targetUnit._originalArmorValue;
        delete targetUnit._originalArmorValue;
      }
      
      if (targetUnit._originalAttackPower) {
        targetUnit.attackPower = targetUnit._originalAttackPower;
        delete targetUnit._originalAttackPower;
      }
    }
    
    // Remove from unit's buffs
    delete targetUnit.buffs[buff.name];
    
    // Remove from active effects
    const index = this.activeEffects.buffs.indexOf(buff);
    if (index !== -1) {
      this.activeEffects.buffs.splice(index, 1);
    }
  }
    
  removeDebuff(debuff) {
    const { targetUnit, effect } = debuff;
    
    // Remove debuff effects
    if (effect === "slow") {
      // Restore original values
      if (targetUnit._originalSpeed) {
        targetUnit.speed = targetUnit._originalSpeed;
        delete targetUnit._originalSpeed;
      }
    }
    
    // Remove from unit's debuffs
    delete targetUnit.debuffs[debuff.name];
    
    // Remove from active effects
    const index = this.activeEffects.debuffs.indexOf(debuff);
    if (index !== -1) {
      this.activeEffects.debuffs.splice(index, 1);
    }
  }
    
  updateActiveEffects(delta) {
    // Update buff durations
    this.activeEffects.buffs.forEach((buff, index) => {
      buff.duration -= delta;
      
      // Remove expired buffs
      if (buff.duration <= 0) {
        this.removeBuff(buff);
      }
    });
    
    // Update debuff durations
    this.activeEffects.debuffs.forEach((debuff, index) => {
      debuff.duration -= delta;
      
      // Apply periodic effects
      if (debuff.effect === "lightningShield") {
        // Apply lightning shield damage
        const target = debuff.targetUnit;
        if (target && target.active) {
          // Direct damage to target
          target.takeDamage(debuff.damagePerSecond * delta);
          
          // Find nearby units to damage
          const nearbyUnits = this.engine.entities.getUnits()
            .filter(unit => 
              unit.playerId === target.playerId && // Same team as target
              unit !== target && // Not the target itself
              this.distanceBetween(unit, target) <= debuff.aoeRadius
            );
          
          // Deal reduced damage to nearby units
          nearbyUnits.forEach(unit => {
            unit.takeDamage(debuff.damagePerSecond * 0.5 * delta); // 50% damage
          });
          
          // Update visual effect if needed
          if (debuff.visualEffect) {
            debuff.visualEffect.x = target.x;
            debuff.visualEffect.y = target.y;
          }
        }
      }
      
      // Remove expired debuffs
      if (debuff.duration <= 0) {
        this.removeDebuff(debuff);
      }
    });
    
    // Update ground effects
    this.activeEffects.groundEffects.forEach((effect, index) => {
      effect.duration -= delta;
      
      // Remove expired effects
      if (effect.duration <= 0) {
        this.activeEffects.groundEffects.splice(index, 1);
      } else if (!effect.visualOnly) {
        // Apply damage from ground effects
        this.applyGroundEffectDamage(effect, delta);
      }
    });
    
    // Update spirit link groups
    if (this.spiritLinkGroups) {
      this.spiritLinkGroups.forEach((group, index) => {
        // Update duration
        group.duration -= delta;
        
        // Check for expired groups
        if (group.duration <= 0) {
          // Remove buff from all linked units
          group.units.forEach(unit => {
            if (unit.buffs && unit.buffs["Spirit Link"]) {
              this.removeBuff(unit.buffs["Spirit Link"]);
            }
          });
          
          // Remove the group
          this.spiritLinkGroups.splice(index, 1);
        }
        
        // Remove dead units from group
        group.units = group.units.filter(unit => unit.active);
        
        // Remove group if fewer than 2 units remain
        if (group.units.length < 2) {
          // Remove buff from remaining units
          group.units.forEach(unit => {
            if (unit.buffs && unit.buffs["Spirit Link"]) {
              this.removeBuff(unit.buffs["Spirit Link"]);
            }
          });
          
          // Remove the group
          this.spiritLinkGroups.splice(index, 1);
        }
      });
    }
  }
    
  applyGroundEffectDamage(effect, delta) {
    // Handle ground effect damage (like Burning Oil)
    if (effect.type === "burningOil") {
      const units = this.engine.entities.getUnits();
      
      // Find units in the effect area
      const unitsInRange = units.filter(unit => {
        // Only damage enemy units
        if (unit.playerId === effect.sourcePlayerId) return false;
        
        // Check distance
        return this.distanceBetween(unit, effect) <= effect.radius;
      });
      
      // Deal damage to each unit
      unitsInRange.forEach(unit => {
        unit.takeDamage(effect.damagePerSecond * delta);
      });
    }
  }
    
  // Track dead units (for resurrection abilities)
  addDeadUnit(unit) {
    this.deadUnits.push({
      type: unit.type,
      playerId: unit.playerId,
      x: unit.x,
      y: unit.y,
      deadTime: Date.now() / 1000
    });
    
    // Limit dead unit list size
    if (this.deadUnits.length > 20) {
      this.deadUnits.shift(); // Remove oldest
    }
  }
  
  // Helper function for measuring distance
  distanceBetween(entity1, entity2) {
    return Math.sqrt(
      Math.pow(entity2.x - entity1.x, 2) + 
      Math.pow(entity2.y - entity1.y, 2)
    );
  }
    
  // Initialize or reset system
  reset() {
    this.activeEffects = {
      buffs: [],
      debuffs: [],
      groundEffects: []
    };
    
    this.deadUnits = [];
    
    if (this.spiritLinkGroups) {
      this.spiritLinkGroups = [];
    }
  }
}