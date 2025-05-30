// IX/gameSystems.js - Consolidated game system classes
import { Projectile, Fortress, Unit } from './entities.js'; // Assuming entities.js is in IX/
import { spellTypes } from './data/spellTypes.js';

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
      unit.abilities.forEach(unitAbility => { // Renamed to unitAbility for clarity
        // Skip if ability is passive, disabled, or auto-cast is disabled
        
        // First, resolve to effectiveSpell to check properties like 'passive', 'enabled'
        let effectiveSpell = unitAbility; // Default to unitAbility if not refactored
        if (unitAbility.spellId && spellTypes[unitAbility.spellId]) {
          effectiveSpell = { ...spellTypes[unitAbility.spellId], ...unitAbility };
        } else if (unitAbility.spellId) {
          // This case implies a spellId exists but no baseSpell, which is an error for an ability meant to be auto-cast
          console.warn(`tryAutoCast: Base spell not found for spellId ${unitAbility.spellId} on unit ${unit.type}, ability ${unitAbility.name}. Skipping auto-cast.`);
          return;
        }
        // If no spellId, effectiveSpell remains unitAbility; this might be a non-refactored passive/active ability.
        // Auto-cast should generally work with refactored abilities.

        if (
          effectiveSpell.passive || 
          effectiveSpell.enabled === false || 
          autoCastSettings[effectiveSpell.name] === false // autoCastSettings uses name
        ) {
          return;
        }
        
        // Cooldown is on unitAbility (instance specific)
        if (unitAbility.cooldownRemaining && unitAbility.cooldownRemaining > 0) {
          return;
        }
        
        // Mana cost from effectiveSpell
        if (effectiveSpell.manaCost && unit.mana < effectiveSpell.manaCost) {
          return;
        }
        
        // Try to auto-cast the ability, passing the original unitAbility (which useAbility will resolve by name)
        // but the tryAutoCast decision logic itself uses effectiveSpell.
        this.tryAutoCast(unit, unitAbility, effectiveSpell); // Pass both for context
      });
    });
  }
    
tryAutoCast(unit, unitAbility, effectiveSpell) { // unitAbility is for calling useAbility, effectiveSpell for logic here
  const enemyUnits = this.engine.entities.getUnits()
    .filter(u => u.playerId !== unit.playerId && this.distanceBetween(unit, u) <= unit.attackRange);
  
  const friendlyUnits = this.engine.entities.getUnits()
    .filter(u => u.playerId === unit.playerId && u !== unit && this.distanceBetween(unit, u) <= unit.attackRange);
  
  // Use effectiveSpell for decision logic
  if (effectiveSpell.effect !== 'castBloodlust' && 
      !['dispel', 'castDispelMagic', 'disenchant'].includes(effectiveSpell.effect) && 
      enemyUnits.length === 0 && friendlyUnits.length === 0 && effectiveSpell.requiresTarget !== false) {
    return; 
  }
  
  switch(effectiveSpell.effect) { // Use effectiveSpell for effect
    case 'heal':
      const injuredAllies = friendlyUnits
        .filter(ally => ally.health < ally.maxHealth * 0.7)
        .sort((a, b) => (a.health / a.maxHealth) - (b.health / b.maxHealth));
      
      if (injuredAllies.length > 0) {
        const target = injuredAllies[0]; 
        this.useAbility(unit, unitAbility.name, target.x, target.y, target); // Call with unitAbility.name
      }
      break;
      
    case 'dispel':
    case 'castDispelMagic':
    case 'disenchant':
      const dispelRadius = effectiveSpell.aoeRadius || 150; // Use effectiveSpell
      if (enemyUnits.length >= 3) { 
        const enemiesWithBuffs = enemyUnits.filter(enemy => 
          enemy.buffs && Object.keys(enemy.buffs).length > 0
        );
        
        if (enemiesWithBuffs.length >= 2) { 
          const centerX = enemiesWithBuffs.reduce((sum, u) => sum + u.x, 0) / enemiesWithBuffs.length;
          const centerY = enemiesWithBuffs.reduce((sum, u) => sum + u.y, 0) / enemiesWithBuffs.length;
          
          if (this.distanceBetween(unit, {x: centerX, y: centerY}) <= unit.attackRange) {
            this.useAbility(unit, unitAbility.name, centerX, centerY); // Call with unitAbility.name
          }
        }
      }
      break;
      
    case 'castBloodlust':
      const bloodlustDetectionRange = effectiveSpell.aoeRadius || Math.min(unit.attackRange, 300); // Use effectiveSpell
      const unbuffedFriendlies = this.engine.entities.getUnits(unit.playerId)
        .filter(u => u !== unit && 
                this.distanceBetween(unit, u) <= bloodlustDetectionRange &&
                (!u.buffs || !u.buffs["Bloodlust"])); 
      
      if (unbuffedFriendlies.length >= (effectiveSpell.minUnitsToCast || 3) ) { // Use effectiveSpell
        const centerX = unbuffedFriendlies.reduce((sum, u) => sum + u.x, 0) / unbuffedFriendlies.length;
        const centerY = unbuffedFriendlies.reduce((sum, u) => sum + u.y, 0) / unbuffedFriendlies.length;
        
        if (this.distanceBetween(unit, {x: centerX, y: centerY}) <= unit.attackRange) {
          this.useAbility(unit, unitAbility.name, centerX, centerY); // Call with unitAbility.name
        }
      }
      break;
      
    case 'castLightningShield':
      const unbuffedEnemies = enemyUnits.filter(enemy => 
        !enemy.debuffs || !enemy.debuffs["Lightning Shield"]
      );
      
      if (unbuffedEnemies.length > 0) {
        const sortedEnemies = unbuffedEnemies
          .sort((a, b) => {
            const aValue = a.maxHealth + (typeof a.attackPower === 'object' ? 
              (a.attackPower.min + a.attackPower.max)/2 : a.attackPower);
            const bValue = b.maxHealth + (typeof b.attackPower === 'object' ? 
              (b.attackPower.min + b.attackPower.max)/2 : b.attackPower);
            return bValue - aValue;
          });
        const target = sortedEnemies[0];
        this.useAbility(unit, unitAbility.name, target.x, target.y, target); // Call with unitAbility.name
      }
      break;
      
    case 'taunt':
      const tauntRadius = effectiveSpell.aoeRadius || 150; // Use effectiveSpell
      const nearbyEnemies = enemyUnits.filter(enemy => 
        this.distanceBetween(unit, enemy) < tauntRadius &&
        (!enemy.debuffs || !enemy.debuffs["Taunted"]) 
      );
      
      if (nearbyEnemies.length >= (effectiveSpell.minUnitsToTaunt || 2) ) { // Use effectiveSpell
        this.useAbility(unit, unitAbility.name, unit.x, unit.y); // Call with unitAbility.name
      }
      break;
      
    case 'castInnerFire':
      const unbuffedAllies = friendlyUnits.filter(ally => 
        !ally.buffs || !ally.buffs["Inner Fire"]
      );
      
      if (unbuffedAllies.length > 0) {
        const sortedAllies = unbuffedAllies
          .sort((a, b) => {
            const aAttack = typeof a.attackPower === 'object' ? 
              (a.attackPower.min + a.attackPower.max)/2 : a.attackPower;
            const bAttack = typeof b.attackPower === 'object' ? 
              (b.attackPower.min + b.attackPower.max)/2 : b.attackPower;
            return bAttack - aAttack;
          });
        const target = sortedAllies[0];
        this.useAbility(unit, unitAbility.name, target.x, target.y, target); // Call with unitAbility.name
      }
      break;
  }
}

useAbility(unit, abilityName, targetX, targetY, targetUnit = null) {
  const unitAbility = unit.abilities.find(a => a.name === abilityName);
  if (!unitAbility) {
    console.log(`Ability ${abilityName} not found for unit ${unit.type}`);
    return false;
  }

  // Fetch base spell and create effective spell
  const baseSpell = spellTypes[unitAbility.spellId];
  if (!baseSpell && unitAbility.spellId) { // spellId implies it should have a baseSpell
    console.error(`Base spell not found for spellId: ${unitAbility.spellId} in ability ${abilityName} for unit ${unit.type}`);
    return false; // Or handle as a non-refactored ability if that's a possible state
  }
  
  // If spellId is undefined, it means this ability was not refactored (e.g. a very specific passive not genericized)
  // However, useAbility is typically for active spells which should have spellId.
  // For now, we assume if it has a spellId, baseSpell must exist. If no spellId, it's an error here.
  if (!unitAbility.spellId) {
      console.error(`Ability ${abilityName} for unit ${unit.type} is missing a spellId and cannot be used.`);
      return false;
  }

  const effectiveSpell = { ...baseSpell, ...unitAbility };

  if (effectiveSpell.enabled === false) { // Check effectiveSpell for enabled status
    console.log(`Ability ${abilityName} is not enabled for this unit`);
    return false;
  }
  
  if (unitAbility.cooldownRemaining && unitAbility.cooldownRemaining > 0) { // Cooldown is on unitAbility
    console.log(`${abilityName} is on cooldown: ${unitAbility.cooldownRemaining.toFixed(1)}s`);
    return false;
  }

  const castRange = effectiveSpell.castRange || unit.attackRange; // Use effectiveSpell for castRange
  if (targetUnit) {
    const distance = this.distanceBetween(unit, targetUnit);
    if (distance > castRange) {
      console.log(`Target is out of range for ${abilityName}`);
      return false;
    }
  } else if (targetX !== undefined && targetY !== undefined) {
    const distance = Math.sqrt(
      Math.pow(targetX - unit.x, 2) + 
      Math.pow(targetY - unit.y, 2)
    );
    if (distance > castRange) {
      console.log(`Target location is out of range for ${abilityName}`);
      return false;
    }
  }

  if (effectiveSpell.manaCost && unit.mana < effectiveSpell.manaCost) { // Use effectiveSpell for manaCost
    console.log(`Not enough mana for ${abilityName}`);
    return false;
  }
  
  if (effectiveSpell.manaCost) {
    unit.mana -= effectiveSpell.manaCost; // Use effectiveSpell for manaCost
  }
  
  unitAbility.cooldownRemaining = effectiveSpell.cooldown; // Cooldown set on unitAbility, value from effectiveSpell
  
  let success = false;
  
  switch(effectiveSpell.effect) { // Use effectiveSpell for effect
    case 'heal':
      success = this.castHeal(unit, targetUnit, effectiveSpell); // Pass effectiveSpell
      break;
    case 'dispel':
    case 'castDispelMagic':
    case 'disenchant':
      success = this.castDispel(unit, targetX, targetY, effectiveSpell); // Pass effectiveSpell
      break;
    case 'castBloodlust':
      success = this.castBloodlust(unit, targetX, targetY, effectiveSpell); // Pass effectiveSpell
      break;
    case 'castInnerFire':
      success = this.castInnerFire(unit, targetUnit, effectiveSpell); // Pass effectiveSpell
      break;
    case 'castLightningShield':
      success = this.castLightningShield(unit, targetUnit, effectiveSpell); // Pass effectiveSpell
      break;
    case 'taunt':
      success = this.castTaunt(unit, effectiveSpell); // Pass effectiveSpell
      break;
    case 'spiritLink':
      success = this.castSpiritLink(unit, targetX, targetY, effectiveSpell); // Pass effectiveSpell
      break;
    case 'ancestralSpirit':
      success = this.castAncestralSpirit(unit, targetX, targetY, effectiveSpell); // Pass effectiveSpell
      break;
    default:
      console.log(`Ability effect type not implemented: ${effectiveSpell.effect}`); // Use effectiveSpell
      return false;
  }
  
  console.log(`${unit.type} used ${abilityName} - ${success ? 'SUCCESS' : 'FAILED'}`);
  return success;
}
    
  castHeal(caster, target, effectiveSpell) { // Changed ability to effectiveSpell
    if (!target || target.playerId !== caster.playerId) return false;
    
    this.engine.systems.get('visual').createEffect({
      type: 'heal', x: target.x, y: target.y, duration: 1.5
    });
    
    const healAmount = effectiveSpell.healAmount || 25; // Use effectiveSpell
    target.health = Math.min(target.maxHealth, target.health + healAmount);
    
    this.addBuff({
      name: "Divine Mending", targetUnit: target, source: caster, duration: 1, // Name from effectiveSpell or keep as is?
      // name should be effectiveSpell.name for consistency, but "Divine Mending" is also the original ability.name
      visualOnly: true, visualEffect: "healGlow"
    });
    return true;
  }
    
  castDispel(caster, targetX, targetY, effectiveSpell) { // Changed ability to effectiveSpell
    const radius = effectiveSpell.aoeRadius || 150; // Use effectiveSpell
    this.engine.systems.get('visual').createEffect({
      type: 'dispel', x: targetX, y: targetY, radius: radius, duration: 1.5
    });
    
    const units = this.engine.entities.getUnits();
    const unitsInRange = units.filter(unit => 
      this.distanceBetween(unit, {x: targetX, y: targetY}) <= radius
    );
    
    if (unitsInRange.length === 0) return false;
    
    unitsInRange.forEach(unit => {
      if (unit.playerId !== caster.playerId) this.removeAllBuffs(unit);
      else this.removeAllDebuffs(unit);
    });
    return true;
  }
    
  castBloodlust(caster, targetX, targetY, effectiveSpell) { // Changed ability to effectiveSpell
    const radius = effectiveSpell.aoeRadius || 300; // Use effectiveSpell
    this.engine.systems.get('visual').createEffect({
      type: 'bloodlust', x: targetX, y: targetY, radius: radius, duration: 1.5
    });
    
    const friendlyUnits = this.engine.entities.getUnits(caster.playerId);
    const unitsInRange = friendlyUnits.filter(unit => 
      this.distanceBetween(unit, {x: targetX, y: targetY}) <= radius
    );
    
    if (unitsInRange.length === 0) return false;
    
    unitsInRange.forEach(unit => {
      this.addBuff({
        name: effectiveSpell.name || "Bloodlust", targetUnit: unit, source: caster, // Use effectiveSpell
        duration: effectiveSpell.effectDuration || 15, // Use effectiveSpell
        effect: "bloodlust", // This is the effect key, should be effectiveSpell.effect
        attackSpeedBonusPercentage: effectiveSpell.attackSpeedBonusPercentage || 0.4, // Use effectiveSpell
        moveSpeedBonusPercentage: effectiveSpell.moveSpeedBonusPercentage || 0.25, // Use effectiveSpell
        visualEffect: "bloodlustAura"
      });
    });
    return true;
  }
    
  castInnerFire(caster, target, effectiveSpell) { // Changed ability to effectiveSpell
    if (!target || target.playerId !== caster.playerId) return false;
    
    this.engine.systems.get('visual').createEffect({
      type: 'innerFire', x: target.x, y: target.y, duration: 2.0
    });
    
    this.addBuff({
      name: effectiveSpell.name || "Inner Fire", targetUnit: target, source: caster, // Use effectiveSpell
      duration: effectiveSpell.effectDuration || 30, // Use effectiveSpell
      effect: "innerFire", // This is the effect key, should be effectiveSpell.effect
      armorBonus: effectiveSpell.armorBonus || 5, // Use effectiveSpell
      damageBonusPercentage: effectiveSpell.damageBonusPercentage || 0.1, // Use effectiveSpell
      visualEffect: "innerFireAura"
    });
    return true;
  }
  
  castLightningShield(caster, target, effectiveSpell) { // Changed ability to effectiveSpell
    if (!target || target.playerId === caster.playerId) return false;
    
    const effect = this.engine.systems.get('visual').createEffect({
      type: 'lightningShield', targetUnit: target,
      duration: effectiveSpell.effectDuration || 15, // Use effectiveSpell
      damage: effectiveSpell.damagePerSecond || 20,  // Use effectiveSpell
      radius: effectiveSpell.aoeRadius || 30       // Use effectiveSpell
    });
    
    this.addDebuff({
      name: effectiveSpell.name || "Lightning Shield", targetUnit: target, source: caster, // Use effectiveSpell
      duration: effectiveSpell.effectDuration || 15, // Use effectiveSpell
      effect: "lightningShield", // This is the effect key, should be effectiveSpell.effect
      damagePerSecond: effectiveSpell.damagePerSecond || 20, // Use effectiveSpell
      aoeRadius: effectiveSpell.aoeRadius || 30, // Use effectiveSpell
      splashDamageFactor: effectiveSpell.splashDamageFactor || 0.5, // Use effectiveSpell
      visualEffect: effect
    });
    return true;
  }
    
  castTaunt(caster, effectiveSpell) { // Changed ability to effectiveSpell
    const radius = effectiveSpell.aoeRadius || 250; // Use effectiveSpell
    this.engine.systems.get('visual').createEffect({
      type: 'taunt', x: caster.x, y: caster.y, radius: radius, duration: 1.5
    });
    
    const enemyUnits = this.engine.entities.getUnits().filter(u => u.playerId !== caster.playerId);
    const unitsInRange = enemyUnits.filter(u => this.distanceBetween(u, caster) <= radius);
    
    if (unitsInRange.length === 0) return false;
    
    unitsInRange.forEach(unit => {
      unit.target = caster;
      this.addDebuff({
        name: effectiveSpell.name || "Taunted", targetUnit: unit, source: caster, // Use effectiveSpell
        duration: effectiveSpell.debuffDuration || 5, // Use effectiveSpell
        effect: "taunt", visualOnly: true, visualEffect: "tauntedIndicator"
      });
    });
    return true;
  }
    
  castSpiritLink(caster, targetX, targetY, effectiveSpell) { // Changed ability to effectiveSpell
    const radius = effectiveSpell.aoeRadius || 300; // Use effectiveSpell
    this.engine.systems.get('visual').createEffect({
      type: 'spiritLink', x: targetX, y: targetY, radius: radius, duration: 2.0
    });
    
    const friendlyUnits = this.engine.entities.getUnits(caster.playerId);
    const unitsInRange = friendlyUnits.filter(u => this.distanceBetween(u, {x: targetX, y: targetY}) <= radius);
    
    const maxUnits = effectiveSpell.maxLinkedUnits || 4; // Use effectiveSpell
    if (unitsInRange.length < 2) return false; // Need at least 2
    
    const linkedUnits = unitsInRange.slice(0, maxUnits);
    
    const spiritLinkGroup = {
      id: Date.now(), units: linkedUnits, source: caster,
      damageSharingPercentage: effectiveSpell.damageSharingPercentage || 0.5, // Use effectiveSpell
      duration: effectiveSpell.effectDuration || 45, // Use effectiveSpell
    };
    
    if (!this.spiritLinkGroups) this.spiritLinkGroups = [];
    this.spiritLinkGroups.push(spiritLinkGroup);
    
    linkedUnits.forEach(unit => {
      this.addBuff({
        name: effectiveSpell.name || "Spirit Link", targetUnit: unit, source: caster, // Use effectiveSpell
        duration: effectiveSpell.effectDuration || 45, // Use effectiveSpell
        effect: "spiritLink", spiritLinkGroupId: spiritLinkGroup.id,
        visualEffect: "spiritLinkAura"
      });
    });
    return true;
  }
    
  castAncestralSpirit(caster, targetX, targetY, effectiveSpell) { // Changed ability to effectiveSpell
    this.engine.systems.get('visual').createEffect({
      type: 'ancestralSpirit', x: targetX, y: targetY, duration: 3.0
    });
    
    const resurrectableTypes = effectiveSpell.resurrectableUnitTypes || ["juggernaut", "astralNomad"]; // Use effectiveSpell
    const maxAge = effectiveSpell.maxCorpseAgeSeconds || 60; // Use effectiveSpell

    const validDeadUnits = this.deadUnits.filter(deadUnit => 
      deadUnit.playerId === caster.playerId &&
      resurrectableTypes.includes(deadUnit.type) &&
      (Date.now() / 1000) - deadUnit.deadTime < maxAge
    );
    
    let closestDeadUnit = null;
    let closestDistance = Infinity;
    validDeadUnits.forEach(deadUnit => {
      const distance = Math.sqrt(Math.pow(deadUnit.x - targetX, 2) + Math.pow(deadUnit.y - targetY, 2));
      if (distance < closestDistance) {
        closestDistance = distance;
        closestDeadUnit = deadUnit;
      }
    });
    
    if (!closestDeadUnit) return false;
    
    const waveManager = this.engine.waveManager;
    const resurrectedUnit = new Unit(closestDeadUnit.type, caster.playerId, targetX, targetY);
    
    const player = this.engine.players[caster.playerId];
    waveManager.applyUpgradesToUnit(resurrectedUnit, player);
    
    this.engine.systems.get('visual').createEffect({
      type: 'resurrection', x: targetX, y: targetY, duration: 2.0
    });
    this.engine.entities.add(resurrectedUnit);
    
    const index = this.deadUnits.indexOf(closestDeadUnit);
    if (index !== -1) this.deadUnits.splice(index, 1);
    
    return true;
  }
    
  handleAttackAbilities(attacker, target, damage) {
    let modifiedDamage = damage;
    const effects = [];
    if (!attacker.abilities) return { damage: modifiedDamage, effects };

    attacker.abilities.forEach(unitAbility => { // Renamed to unitAbility
      if (!unitAbility.passive || unitAbility.enabled === false) return;

      let effectivePassiveSpell = unitAbility; // Default to unitAbility if not refactored
      if (unitAbility.spellId) {
        const baseSpell = spellTypes[unitAbility.spellId];
        if (baseSpell) {
          effectivePassiveSpell = { ...baseSpell, ...unitAbility };
        } else {
          console.warn(`handleAttackAbilities: Base spell not found for spellId ${unitAbility.spellId} on unit ${attacker.type}, passive ability ${unitAbility.name}. Using unit's definition.`);
        }
      }
      
      switch(effectivePassiveSpell.effect) { // Use effectivePassiveSpell
        case 'pulverize': // Seismic Slam
          if (Math.random() < (effectivePassiveSpell.procChance || 0.25)) {
            const aoeRadius = effectivePassiveSpell.aoeRadius || 60;
            const aoeDamage = effectivePassiveSpell.aoeDamage || 60;
            const enemyUnits = this.engine.entities.getUnits()
              .filter(otherUnit => 
                otherUnit.playerId !== attacker.playerId && 
                this.distanceBetween(target, otherUnit) <= aoeRadius &&
                otherUnit !== target
              );
            enemyUnits.forEach(enemyUnit => enemyUnit.takeDamage(aoeDamage));
            effects.push({ type: 'seismicSlam', x: target.x, y: target.y, radius: aoeRadius });
          }
          break;
        case 'burningOil': // Inferno Payload
          effects.push({
            type: 'burningOil', x: target.x, y: target.y,
            radius: effectivePassiveSpell.aoeRadius || 80,
            duration: effectivePassiveSpell.effectDuration || 5,
            sourcePlayerId: attacker.playerId,
            damagePerSecond: effectivePassiveSpell.damagePerSecond || 15
          });
          break;
        case 'pillage': // Plunder
          if (target.type === 'fortress') {
            const player = this.engine.players[attacker.playerId];
            player.gold += (effectivePassiveSpell.goldPerHit || 10);
            effects.push({ type: 'plunder', x: attacker.x, y: attacker.y });
          }
          break;
        case 'freezingBreath': // Glacial Tempest
          if (target.type === 'fortress') {
            target.stunned = true;
            target.stunDuration = effectivePassiveSpell.stunDuration || 4;
            effects.push({ type: 'glacialTempest', x: target.x, y: target.y });
          }
          break;
      }
    });
    return { damage: modifiedDamage, effects };
  }
  
  handleDefenseAbilities(defender, attacker, damage, attackType) {
    let modifiedDamage = damage;
    if (!defender.abilities) return modifiedDamage;

    defender.abilities.forEach(unitAbility => { // Renamed to unitAbility
      if (!unitAbility.passive || unitAbility.enabled === false) return;

      let effectivePassiveSpell = unitAbility; // Default to unitAbility if not refactored
      if (unitAbility.spellId) {
        const baseSpell = spellTypes[unitAbility.spellId];
        if (baseSpell) {
          effectivePassiveSpell = { ...baseSpell, ...unitAbility };
        } else {
          console.warn(`handleDefenseAbilities: Base spell not found for spellId ${unitAbility.spellId} on unit ${defender.type}, passive ability ${unitAbility.name}. Using unit's definition.`);
        }
      }
      
      switch(effectivePassiveSpell.effect) { // Use effectivePassiveSpell
        case 'defend': // Phalanx Stance
          if (attackType === 'pierce') {
            modifiedDamage *= (1 - (effectivePassiveSpell.pierceDamageReductionPercentage || 0.5));
            this.engine.systems.get('visual').createEffect({
              type: 'phalanxStance', x: defender.x, y: defender.y, duration: 0.5
            });
          }
          break;
        case 'hardenSkin': // Crystalline Carapace
          modifiedDamage = Math.max(effectivePassiveSpell.minDamageTaken || 3, modifiedDamage - (effectivePassiveSpell.damageReductionAmount || 8));
          this.engine.systems.get('visual').createEffect({
            type: 'crystallineCarapace', x: defender.x, y: defender.y, duration: 0.5
          });
          break;
      }
    });
    
    if (this.spiritLinkGroups) {
      this.spiritLinkGroups.forEach(group => {
        // Spirit Link damage sharing logic itself doesn't directly depend on the defender's other passive abilities' definitions.
        // The group.damageSharingPercentage is set when the Spirit Link is cast, using effectiveSpell at that time.
        // So, no changes needed here based on the current defender's other passives.
        if (group.units.includes(defender)) {
          const damageToShare = modifiedDamage * (group.damageSharingPercentage || 0.5); 
          const numOtherUnits = group.units.length - 1;
          if (numOtherUnits > 0) {
            const sharedDamage = damageToShare / numOtherUnits;
            group.units.forEach(unit => {
              if (unit !== defender && unit.active) {
                unit.takeDamage(sharedDamage);
                this.engine.systems.get('visual').createEffect({
                  type: 'spiritLinkDamage', x: unit.x, y: unit.y, duration: 0.5
                });
              }
            });
            modifiedDamage -= damageToShare;
          }
          this.engine.systems.get('visual').createEffect({
            type: 'spiritLinkDamage', x: defender.x, y: defender.y, duration: 0.5
          });
        }
      });
    }
    return modifiedDamage;
  }
  
addBuff(buffData) {
  const { targetUnit, effect, name } = buffData;
  if (!targetUnit.buffs) targetUnit.buffs = {};
  const existingBuff = targetUnit.buffs[name];
  
  if (existingBuff) {
    if (existingBuff.effect === effect) {
      existingBuff.duration = buffData.duration;
      return;
    } else {
      console.log(`Unit already has a ${name} buff with a different effect`);
      return;
    }
  }
    
  if (effect === "bloodlust") {
    targetUnit._originalAttackSpeed = targetUnit.attackSpeed;
    targetUnit._originalSpeed = targetUnit.speed;
    targetUnit.attackSpeed /= (1 + (buffData.attackSpeedBonusPercentage || 0)); // Use data-driven
    targetUnit.speed *= (1 + (buffData.moveSpeedBonusPercentage || 0)); // Use data-driven
  } else if (effect === "innerFire") {
    targetUnit._originalArmorValue = targetUnit.armorValue;
    targetUnit._originalAttackPower = JSON.parse(JSON.stringify(targetUnit.attackPower)); // Deep copy for objects
    
    targetUnit.armorValue += (buffData.armorBonus || 0); // Use data-driven
    
    if (typeof targetUnit.attackPower === 'object') {
      targetUnit.attackPower.min *= (1 + (buffData.damageBonusPercentage || 0)); // Use data-driven
      targetUnit.attackPower.max *= (1 + (buffData.damageBonusPercentage || 0)); // Use data-driven
    } else {
      targetUnit.attackPower *= (1 + (buffData.damageBonusPercentage || 0)); // Use data-driven
    }
  }
    
  targetUnit.buffs[buffData.name] = buffData;
  this.activeEffects.buffs.push(buffData);
}
    
  addDebuff(debuffData) {
    const { targetUnit, effect, name } = debuffData;
    if (!targetUnit.debuffs) targetUnit.debuffs = {};
    const existingDebuff = targetUnit.debuffs[name];
    
    if (existingDebuff) {
      if (existingDebuff.effect === effect) {
        existingDebuff.duration = debuffData.duration;
        return;
      } else {
        console.log(`Unit already has a ${name} debuff with a different effect`);
        return;
      }
    }
    
    if (effect === "slow") { // Assuming "slow" might be a generic effect type
      targetUnit._originalSpeed = targetUnit.speed;
      targetUnit.speed *= (1 - (debuffData.speedReductionPercentage || 0)); // Use data-driven if available
    }
    
    targetUnit.debuffs[debuffData.name] = debuffData;
    this.activeEffects.debuffs.push(debuffData);
  }
    
  removeAllBuffs(unit) {
    if (!unit.buffs) unit.buffs = {};
    const buffNames = Object.keys(unit.buffs);
    buffNames.forEach(name => this.removeBuff(unit.buffs[name]));
  }
    
  removeAllDebuffs(unit) {
    if (!unit.debuffs) unit.debuffs = {};
    const debuffNames = Object.keys(unit.debuffs);
    debuffNames.forEach(name => this.removeDebuff(unit.debuffs[name]));
  }
    
  removeBuff(buff) {
    const { targetUnit, effect } = buff;
    if (effect === "bloodlust") {
      if (targetUnit._originalAttackSpeed) targetUnit.attackSpeed = targetUnit._originalAttackSpeed;
      if (targetUnit._originalSpeed) targetUnit.speed = targetUnit._originalSpeed;
      delete targetUnit._originalAttackSpeed; delete targetUnit._originalSpeed;
    } else if (effect === "innerFire") {
      if (targetUnit._originalArmorValue !== undefined) targetUnit.armorValue = targetUnit._originalArmorValue; // Check for undefined
      if (targetUnit._originalAttackPower) targetUnit.attackPower = targetUnit._originalAttackPower;
      delete targetUnit._originalArmorValue; delete targetUnit._originalAttackPower;
    }
    if (targetUnit.buffs) delete targetUnit.buffs[buff.name]; // Check if buffs exist
    const index = this.activeEffects.buffs.indexOf(buff);
    if (index !== -1) this.activeEffects.buffs.splice(index, 1);
  }
    
  removeDebuff(debuff) {
    const { targetUnit, effect } = debuff;
    if (effect === "slow") {
      if (targetUnit._originalSpeed) targetUnit.speed = targetUnit._originalSpeed;
      delete targetUnit._originalSpeed;
    }
    if (targetUnit.debuffs) delete targetUnit.debuffs[debuff.name]; // Check if debuffs exist
    const index = this.activeEffects.debuffs.indexOf(debuff);
    if (index !== -1) this.activeEffects.debuffs.splice(index, 1);
  }
    
  updateActiveEffects(delta) {
    this.activeEffects.buffs = this.activeEffects.buffs.filter(buff => {
      buff.duration -= delta;
      if (buff.duration <= 0) { this.removeBuff(buff); return false; }
      return true;
    });
    
    this.activeEffects.debuffs = this.activeEffects.debuffs.filter(debuff => {
      debuff.duration -= delta;
      if (debuff.effect === "lightningShield") {
        const target = debuff.targetUnit;
        if (target && target.active) {
          target.takeDamage((debuff.damagePerSecond || 0) * delta); // Use data-driven
          const nearbyUnits = this.engine.entities.getUnits()
            .filter(unit => 
              unit.playerId === target.playerId && unit !== target &&
              this.distanceBetween(unit, target) <= (debuff.aoeRadius || 0) // Use data-driven
            );
          nearbyUnits.forEach(unit => {
            // Use splashDamageFactor from debuffData
            const splashDamage = (debuff.damagePerSecond || 0) * (debuff.splashDamageFactor || 0) * delta;
            unit.takeDamage(splashDamage);
          });
          if (debuff.visualEffect) {
            debuff.visualEffect.x = target.x; debuff.visualEffect.y = target.y;
          }
        }
      }
      if (debuff.duration <= 0) { this.removeDebuff(debuff); return false; }
      return true;
    });
    
    this.activeEffects.groundEffects = this.activeEffects.groundEffects.filter(effect => {
      effect.duration -= delta;
      if (effect.duration <= 0) return false;
      if (!effect.visualOnly) this.applyGroundEffectDamage(effect, delta);
      return true;
    });
    
    if (this.spiritLinkGroups) {
      this.spiritLinkGroups = this.spiritLinkGroups.filter(group => {
        group.duration -= delta;
        if (group.duration <= 0) {
          group.units.forEach(unit => {
            if (unit.buffs && unit.buffs["Spirit Link"]) this.removeBuff(unit.buffs["Spirit Link"]);
          });
          return false;
        }
        group.units = group.units.filter(unit => unit.active);
        if (group.units.length < 2) {
          group.units.forEach(unit => {
            if (unit.buffs && unit.buffs["Spirit Link"]) this.removeBuff(unit.buffs["Spirit Link"]);
          });
          return false;
        }
        return true;
      });
    }
  }
    
  applyGroundEffectDamage(effect, delta) {
    if (effect.type === "burningOil") {
      const units = this.engine.entities.getUnits();
      const unitsInRange = units.filter(unit => 
        unit.playerId !== effect.sourcePlayerId &&
        this.distanceBetween(unit, effect) <= (effect.radius || 0) // Use data-driven radius
      );
      unitsInRange.forEach(unit => {
        unit.takeDamage((effect.damagePerSecond || 0) * delta); // Use data-driven damage
      });
    }
  }
    
  addDeadUnit(unit) {
    this.deadUnits.push({
      type: unit.type, playerId: unit.playerId, x: unit.x, y: unit.y,
      deadTime: Date.now() / 1000
    });
    if (this.deadUnits.length > 20) this.deadUnits.shift();
  }
  
  distanceBetween(entity1, entity2) {
    return Math.sqrt(Math.pow(entity2.x - entity1.x, 2) + Math.pow(entity2.y - entity1.y, 2));
  }
    
  reset() {
    this.activeEffects = { buffs: [], debuffs: [], groundEffects: [] };
    this.deadUnits = [];
    if (this.spiritLinkGroups) this.spiritLinkGroups = [];
  }
}

// systems/CombatSystem.js - Handles all combat calculations
export class CombatSystem {
  constructor(engine) {
    this.engine = engine;
  }
  
  update(delta) {
    const units = this.engine.entities.getUnits();
    units.forEach(unit => this.processAttacks(unit, delta));
    this.processFortressAttacks(delta);
  }
  
  processAttacks(unit, delta) {
    if (!unit.target) return;
    const currentTime = Date.now() / 1000;
    if (currentTime - unit.lastAttackTime >= unit.attackSpeed) {
      unit.lastAttackTime = currentTime;
      const target = this.getTarget(unit.target);
      if (!target) { unit.target = null; return; }
      const distance = this.distanceBetween(unit, target);
      if (distance <= unit.attackRange) this.executeAttack(unit, target);
    }
  }
  
  executeAttack(unit, target) {
    let damage = (typeof unit.attackPower === 'object') ? 
      this.getRandomDamage(unit.attackPower.min, unit.attackPower.max) : unit.attackPower;
    
    damage = this.applyDamageModifiers(unit, damage);
    
    const abilitySystem = this.engine.systems.get('ability');
    const abilityResults = abilitySystem.handleAttackAbilities(unit, target, damage);
    damage = abilityResults.damage;
    
    const finalDamage = this.calculateDamage(damage, unit.attackType, target.armorType, target.armorValue);
    const damageAfterDefense = abilitySystem.handleDefenseAbilities(target, unit, finalDamage, unit.attackType);
    target.takeDamage(damageAfterDefense);
    
    if (unit.attackRange > 50) { // Ranged unit
      this.createProjectile(unit, target);
    } else { // Melee unit
      const visualSystem = this.engine.systems.get('visual');
      if (visualSystem) {
        const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
        visualSystem.createEffect({
          type: 'meleeAttack', x: unit.x, y: unit.y, angle: angle,
          targetX: target.x, targetY: target.y, playerId: unit.playerId, duration: 0.3
        });
      }
    }
    
    if (abilityResults.effects && abilityResults.effects.length > 0) {
      const visualSystem = this.engine.systems.get('visual');
      abilityResults.effects.forEach(effect => {
        if (effect.type === 'seismicSlam') {
          visualSystem.createGroundEffect({
            type: 'seismicSlam', x: effect.x, y: effect.y, radius: effect.radius,
            duration: 0.5, visualOnly: true
          });
        } else if (effect.type === 'burningOil') {
          visualSystem.createGroundEffect({
            type: 'burningOil', x: effect.x, y: effect.y, radius: effect.radius,
            duration: effect.duration, sourcePlayerId: effect.sourcePlayerId,
            damagePerSecond: effect.damagePerSecond
          });
        } else if (effect.type === 'plunder') {
          visualSystem.createEffect({ type: 'plunder', x: effect.x, y: effect.y, duration: 0.7 });
        } else if (effect.type === 'glacialTempest') {
          visualSystem.createEffect({ type: 'glacialTempest', x: effect.x, y: effect.y, duration: 1.5 });
        }
      });
    }
  }
  
  processFortressAttacks(delta) {
    Object.values(this.engine.players).forEach(player => {
      const fortress = player.fortress;
      if (!fortress || !fortress.canAttack()) return;
      const currentTime = Date.now() / 1000;
      if (currentTime - fortress.lastAttackTime >= fortress.attackSpeed) {
        fortress.lastAttackTime = currentTime;
        const enemyId = player.id === 'player1' ? 'player2' : 'player1';
        const enemyUnits = this.engine.entities.getUnits(enemyId);
        let closestUnit = null;
        let closestDistance = Infinity;
        enemyUnits.forEach(unit => {
          const distance = this.distanceBetween(fortress, unit);
          if (distance <= fortress.attackRange && distance < closestDistance) {
            closestDistance = distance;
            closestUnit = unit;
          }
        });
        if (closestUnit) {
          closestUnit.takeDamage(fortress.attackPower);
          this.createProjectile(fortress, closestUnit);
        }
      }
    });
  }
  
  distanceBetween(entity1, entity2) {
    return Math.sqrt(Math.pow(entity2.x - entity1.x, 2) + Math.pow(entity2.y - entity1.y, 2));
  }
  
  getRandomDamage(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  
  applyDamageModifiers(unit, baseDamage) {
    let damage = baseDamage;
    if (unit.buffs) {
      if (unit.buffs.innerFire) damage *= (1 + (unit.buffs.innerFire.damageBonusPercentage || 0)); // Use data-driven
      if (unit.buffs.warDrum) damage *= (1 + (unit.buffs.warDrum.damageBonusPercentage || 0)); // Use data-driven
    }
    return damage;
  }
  
  calculateDamage(baseDamage, attackType, armorType, armorValue) {
    const typeModifier = this.getDamageTypeModifier(attackType, armorType);
    const damageReduction = this.calculateArmorReduction(armorValue);
    const finalDamage = baseDamage * typeModifier * (1 - damageReduction);
    return Math.max(1, Math.round(finalDamage));
  }
  
  calculateArmorReduction(armorValue) {
    const armorMultiplier = armorValue * 0.06;
    return armorMultiplier / (1 + armorMultiplier);
  }
  
  getDamageTypeModifier(attackType, armorType) {
    const armorTypes = {
      unarmored: { normal: 1.00, pierce: 1.50, siege: 1.50, magic: 1.00, spell: 1.00, hero: 1.00, chaos: 1.00 },
      light: { normal: 1.00, pierce: 2.00, siege: 1.00, magic: 1.25, spell: 1.00, hero: 1.00, chaos: 1.00 },
      medium: { normal: 1.50, pierce: 0.75, siege: 0.50, magic: 0.75, spell: 1.00, hero: 1.00, chaos: 1.00 },
      heavy: { normal: 0.70, pierce: 0.35, siege: 1.50, magic: 0.35, spell: 1.00, hero: 0.50, chaos: 1.00 },
      fortified: { normal: 0.70, pierce: 0.35, siege: 1.50, magic: 0.35, spell: 1.00, hero: 0.50, chaos: 1.00 },
      hero: { normal: 1.00, pierce: 0.50, siege: 0.50, magic: 0.50, spell: 0.70, hero: 1.00, chaos: 1.00 }
    };
    const armorTypeObj = armorTypes[armorType] || armorTypes.unarmored;
    return armorTypeObj[attackType] || 1.0;
  }
  
  createProjectile(source, target) {
    const projectile = new Projectile(source.x, source.y, target.x, target.y, source.playerId);
    this.engine.entities.add(projectile);
  }
  
  getTarget(targetInfo) {
    if (typeof targetInfo === 'string') return this.engine.entities.get(targetInfo);
    if (targetInfo && targetInfo.id) return this.engine.entities.get(targetInfo.id);
    if (targetInfo && targetInfo.type === 'fortress') {
      return targetInfo.instance || this.engine.players[targetInfo.playerId].fortress;
    }
    return targetInfo;
  }
  reset() {}
}

// systems/MovementSystem.js - Handles entity movement
export class MovementSystem {
  constructor(engine) { this.engine = engine; }
  update(delta) {
    const units = this.engine.entities.getUnits();
    units.forEach(unit => this.processUnitMovement(unit, delta));
    this.applySeparation(units);
  }
  processUnitMovement(unit, delta) {
    if (unit.isAttacking) {
      const target = this.getTarget(unit.target);
      if (!target || !target.active) {
        unit.target = null; unit.isAttacking = false; this.moveForward(unit, delta); return;
      }
      if (this.distanceBetween(unit, target) > unit.attackRange) {
        unit.isAttacking = false; this.moveTowardTarget(unit, target, delta);
      }
      return;
    }
    if (unit.target) {
      const target = this.getTarget(unit.target);
      if (!target || !target.active) {
        unit.target = null; this.moveForward(unit, delta);
      } else {
        if (this.distanceBetween(unit, target) > unit.attackRange) this.moveTowardTarget(unit, target, delta);
        else unit.isAttacking = true;
      }
    } else {
      const target = this.findNearbyTarget(unit);
      if (target) {
        unit.target = target;
        if (this.distanceBetween(unit, target) <= unit.attackRange) unit.isAttacking = true;
        else this.moveTowardTarget(unit, target, delta);
      } else {
        this.moveForward(unit, delta);
      }
    }
  }
  findNearbyTarget(unit) {
    const enemyId = unit.playerId === 'player1' ? 'player2' : 'player1';
    const enemyUnits = this.engine.entities.getUnits(enemyId);
    const enemyFortress = this.engine.players[enemyId].fortress;
    const minimumDetectionRange = 150;
    const isNearRangeUnit = unit.attackRange <= 50;
    const detectionRange = isNearRangeUnit ? 
      Math.max(unit.attackRange * 4, minimumDetectionRange) : 
      Math.max(unit.attackRange * 1.5, minimumDetectionRange);
    let closestEnemy = null;
    let closestDistance = detectionRange;
    for (const enemy of enemyUnits) {
      const distance = this.distanceBetween(unit, enemy);
      if (distance < closestDistance) { closestDistance = distance; closestEnemy = enemy; }
    }
    if (closestEnemy) return closestEnemy;
    const distanceToFortress = this.distanceBetween(unit, enemyFortress);
    const fortressDetectionRange = 150; 
    const midline = this.engine.canvas.height / 2;
    const inEnemyTerritory = (unit.playerId === 'player1' && unit.y < midline) || (unit.playerId === 'player2' && unit.y > midline);
    if (distanceToFortress < fortressDetectionRange || (inEnemyTerritory && distanceToFortress < detectionRange * 2)) {
      return { type: 'fortress', playerId: enemyId, instance: enemyFortress };
    }
    return null;
  }
  moveTowardTarget(unit, target, delta) {
    let targetX, targetY;
    const actualTarget = (target instanceof Fortress || (target.type === 'fortress' && target.instance)) ? (target.instance || target) : target;
    targetX = actualTarget.x; targetY = actualTarget.y;
    const dx = targetX - unit.x; const dy = targetY - unit.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return; // Avoid division by zero
    const normalizedDx = dx / distance; const normalizedDy = dy / distance;
    const moveDistance = unit.speed * delta;
    unit.x += normalizedDx * moveDistance; unit.y += normalizedDy * moveDistance;
  }
  moveForward(unit, delta) {
    const targetY = (unit.playerId === 'player1') ? 0 : this.engine.canvas.height;
    this.moveTowardTarget(unit, { x: unit.x, y: targetY }, delta);
    if (!unit.target) {
      const target = this.findNearbyTarget(unit);
      if (target) unit.target = target;
    }
  }
  applySeparation(units) {
    const minDistance = 30; 
    const grid = this.buildSpatialGrid(units, minDistance);
    units.forEach(unit => {
      const nearby = this.getNearbyUnits(unit, grid, minDistance);
      nearby.forEach(otherUnit => {
        if (otherUnit === unit) return;
        const dx = otherUnit.x - unit.x; const dy = otherUnit.y - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance && distance > 0) {
          const overlap = minDistance - distance;
          const normalizedDx = dx / distance; const normalizedDy = dy / distance;
          const pushDistance = overlap / 2;
          unit.x -= normalizedDx * pushDistance; unit.y -= normalizedDy * pushDistance;
          otherUnit.x += normalizedDx * pushDistance; otherUnit.y += normalizedDy * pushDistance;
        }
      });
    });
  }
  buildSpatialGrid(units, cellSize) {
    const grid = {};
    units.forEach(unit => {
      const cellX = Math.floor(unit.x / cellSize); const cellY = Math.floor(unit.y / cellSize);
      const cellKey = `${cellX},${cellY}`;
      if (!grid[cellKey]) grid[cellKey] = [];
      grid[cellKey].push(unit);
    });
    return grid;
  }
  getNearbyUnits(unit, grid, cellSize) {
    const cellX = Math.floor(unit.x / cellSize); const cellY = Math.floor(unit.y / cellSize);
    const nearby = [];
    for (let x = cellX - 1; x <= cellX + 1; x++) {
      for (let y = cellY - 1; y <= cellY + 1; y++) {
        const cellKey = `${x},${y}`;
        if (grid[cellKey]) nearby.push(...grid[cellKey]);
      }
    }
    return nearby;
  }
  distanceBetween(entity1, entity2) {
    const e1 = (entity1 && entity1.type === 'fortress' && entity1.instance) ? entity1.instance : entity1;
    const e2 = (entity2 && entity2.type === 'fortress' && entity2.instance) ? entity2.instance : entity2;
    return Math.sqrt(Math.pow(e2.x - e1.x, 2) + Math.pow(e2.y - e1.y, 2));
  }
  getTarget(targetInfo) {
    if (typeof targetInfo === 'string') return this.engine.entities.get(targetInfo);
    if (targetInfo && targetInfo.id) return this.engine.entities.get(targetInfo.id);
    if (targetInfo && targetInfo.type === 'fortress') {
      return targetInfo.instance || this.engine.players[targetInfo.playerId].fortress;
    }
    return targetInfo;
  }
  reset() {}
}

// systems/UpgradeSystem.js - Handles all unit upgrades
export class UpgradeSystem {
  constructor(engine) { this.engine = engine; }
  update(delta) {}
  purchaseUpgrade(playerId, upgradeId) {
    const player = this.engine.players[playerId];
    const upgrade = window.unitUpgrades[upgradeId];
    if (!upgrade) { console.log(`ERROR: Upgrade ${upgradeId} not found`); return false; }
    if (player.fortressLevel < upgrade.requiredFortressLevel) { console.log(`Cannot purchase: Fortress level ${upgrade.requiredFortressLevel} required`); return false; }
    if (player.gold < upgrade.cost) { console.log(`Cannot purchase: Not enough gold`); return false; }
    if (player.purchasedUpgrades && player.purchasedUpgrades.includes(upgradeId)) { console.log(`Cannot purchase: Already purchased`); return false; }
    player.gold -= upgrade.cost;
    if (!player.purchasedUpgrades) player.purchasedUpgrades = [];
    player.purchasedUpgrades.push(upgradeId);
    console.log(`SUCCESS: ${playerId} purchased ${upgrade.name}`);
    this.applyUpgradeToUnits(playerId, upgradeId);
    return true;
  }
  applyUpgradeToUnits(playerId, upgradeId) {
    const units = this.engine.entities.getUnits(playerId);
    units.forEach(unit => {
      if (this.shouldApplyUpgradeToUnit(unit, upgradeId)) {
        if (unit.abilities) {
          unit.abilities.forEach(ability => {
            if (ability.requiredUpgrade === upgradeId && ability.enabled === false) {
              ability.enabled = true;
            }
          });
        }
        if (!unit.upgrades) unit.upgrades = [];
        if (!unit.upgrades.includes(upgradeId)) unit.upgrades.push(upgradeId);
        this.applyStatBonuses(unit, upgradeId);
      }
    });
  }
  applyStatBonuses(unit, upgradeId) {
    const upgrade = window.unitUpgrades[upgradeId];
    if (!upgrade || !upgrade.statBoosts) return;
    const { statBoosts } = upgrade;
    for (const stat in statBoosts) {
      const boostValue = statBoosts[stat];
      switch(stat) {
        case 'attackRange': unit.attackRange += boostValue; break;
        case 'attackPowerBonus':
          if (unit.attackPower && typeof unit.attackPower === 'object') {
            unit.attackPower.min += boostValue; unit.attackPower.max += boostValue;
          } else unit.attackPower += boostValue;
          break;
        case 'attackSpeed': unit.attackSpeed += boostValue; break;
        case 'speed': unit.speed += boostValue; break;
        case 'health': case 'maxHealth': unit.health += boostValue; unit.maxHealth += boostValue; break;
        case 'armor': case 'armorValue': unit.armorValue += boostValue; break;
      }
    }
  }
  shouldApplyUpgradeToUnit(unit, upgradeId) {
    const unitTypeData = window.unitTypes[unit.type];
    return unitTypeData && unitTypeData.stats && unitTypeData.stats.possibleUpgrades && 
           unitTypeData.stats.possibleUpgrades.includes(upgradeId);
  }
  getAvailableUpgrades(playerId) {
    const player = this.engine.players[playerId];
    const availableUpgrades = [];
    for (const upgradeId in window.unitUpgrades) {
      const upgrade = window.unitUpgrades[upgradeId];
      if (player.purchasedUpgrades && player.purchasedUpgrades.includes(upgradeId)) continue;
      if (player.fortressLevel < upgrade.requiredFortressLevel) continue;
      availableUpgrades.push({
        id: upgradeId, name: upgrade.name, cost: upgrade.cost,
        description: upgrade.description, canAfford: player.gold >= upgrade.cost
      });
    }
    return availableUpgrades;
  }
  reset() {}
}
