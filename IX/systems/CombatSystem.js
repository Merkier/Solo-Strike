// systems/CombatSystem.js - Handles all combat calculations
import { Projectile } from "../entity/Projectile.js";
import { Fortress } from "../entity/Fortress.js";

export class CombatSystem {
  constructor(engine) {
    this.engine = engine;
  }
  
  update(delta) {
    // Process attacks for all units
    const units = this.engine.entities.getUnits();
    units.forEach(unit => this.processAttacks(unit, delta));
    
    // Process fortress attacks
    this.processFortressAttacks(delta);
  }
  
  processAttacks(unit, delta) {
    // Skip if unit has no target
    if (!unit.target) return;
    
    const currentTime = Date.now() / 1000;
    
    // Check attack cooldown
    if (currentTime - unit.lastAttackTime >= unit.attackSpeed) {
      // Unit can attack
      unit.lastAttackTime = currentTime;
      
      // Check if target is in range
      const target = this.getTarget(unit.target);
      if (!target) {
        unit.target = null;
        return;
      }
      
      const distance = this.distanceBetween(unit, target);
      if (distance <= unit.attackRange) {
        // Target in range, attack it
        this.executeAttack(unit, target);
      }
    }
  }
  

executeAttack(unit, target) {
  // Calculate damage based on min-max range
  let damage;
  if (typeof unit.attackPower === 'object') {
    damage = this.getRandomDamage(unit.attackPower.min, unit.attackPower.max);
  } else {
    damage = unit.attackPower;
  }
  
  // Apply any damage bonuses from buffs
  damage = this.applyDamageModifiers(unit, damage);
  
  // Let AbilitySystem handle any passive attack abilities
  const abilitySystem = this.engine.systems.get('ability');
  const abilityResults = abilitySystem.handleAttackAbilities(unit, target, damage);
  damage = abilityResults.damage;
  
  // Calculate final damage based on armor, after passive abilities
  const finalDamage = this.calculateDamage(
    damage,
    unit.attackType,
    target.armorType,
    target.armorValue
  );
  
  // Let AbilitySystem handle any defensive abilities
  const damageAfterDefense = abilitySystem.handleDefenseAbilities(
    target, unit, finalDamage, unit.attackType
  );
  
  // Deal damage to target
  target.takeDamage(damageAfterDefense);
  
  // Create appropriate visual for the attack type
  if (unit.attackRange > 50) { // Ranged unit
    this.createProjectile(unit, target);
  } else { // Melee unit
    // Create melee attack visual (slash)
    const visualSystem = this.engine.systems.get('visual');
    if (visualSystem) {
      // Calculate angle between attacker and target
      const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
      
      visualSystem.createEffect({
        type: 'meleeAttack',
        x: unit.x,
        y: unit.y,
        angle: angle,
        targetX: target.x,
        targetY: target.y,
        playerId: unit.playerId,
        duration: 0.3 // Short duration for quick slash effect
      });
    }
  }
  
  // Create any visual effects from abilities
  if (abilityResults.effects && abilityResults.effects.length > 0) {
    // Process all effects
    abilityResults.effects.forEach(effect => {
      const visualSystem = this.engine.systems.get('visual');
      
      // Create appropriate effect based on type
      if (effect.type === 'seismicSlam') {
        visualSystem.createGroundEffect({
          type: 'seismicSlam',
          x: effect.x,
          y: effect.y,
          radius: effect.radius,
          duration: 0.5,
          visualOnly: true
        });
      } else if (effect.type === 'burningOil') {
        visualSystem.createGroundEffect({
          type: 'burningOil',
          x: effect.x,
          y: effect.y,
          radius: effect.radius,
          duration: effect.duration,
          sourcePlayerId: effect.sourcePlayerId,
          damagePerSecond: effect.damagePerSecond
        });
      } else if (effect.type === 'plunder') {
        visualSystem.createEffect({
          type: 'plunder',
          x: effect.x,
          y: effect.y,
          duration: 0.7
        });
      } else if (effect.type === 'glacialTempest') {
        visualSystem.createEffect({
          type: 'glacialTempest',
          x: effect.x,
          y: effect.y,
          duration: 1.5
        });
      }
    });
  }
}
  
  processFortressAttacks(delta) {
    // Process attacks for player fortresses
    Object.values(this.engine.players).forEach(player => {
      const fortress = player.fortress;
      if (!fortress || !fortress.canAttack()) return;
      
      const currentTime = Date.now() / 1000;
      
      // Check attack cooldown
      if (currentTime - fortress.lastAttackTime >= fortress.attackSpeed) {
        fortress.lastAttackTime = currentTime;
        
        // Find closest enemy unit in range
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
        
        // Attack closest enemy if found
        if (closestUnit) {
          // Deal damage to target
          closestUnit.takeDamage(fortress.attackPower);
          
          // Create projectile
          this.createProjectile(fortress, closestUnit);
        }
      }
    });
  }
  
  distanceBetween(entity1, entity2) {
    return Math.sqrt(
      Math.pow(entity2.x - entity1.x, 2) + 
      Math.pow(entity2.y - entity1.y, 2)
    );
  }
  
  getRandomDamage(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  applyDamageModifiers(unit, baseDamage) {
    let damage = baseDamage;
    
    // Apply buff effects
    if (unit.buffs) {
      // Inner Fire - 10% damage boost
      if (unit.buffs.innerFire) {
        damage *= 1.1;
      }
      
      // War Drum Aura - damage boost from nearby units
      if (unit.buffs.warDrum) {
        damage *= (1 + unit.buffs.warDrum);
      }
    }
    
    return damage;
  }
  
  calculateDamage(baseDamage, attackType, armorType, armorValue) {
    // Get the damage modifier for this attack-armor combination
    const typeModifier = this.getDamageTypeModifier(attackType, armorType);
    
    // Calculate damage reduction from armor value
    const damageReduction = this.calculateArmorReduction(armorValue);
    
    // Apply armor reduction after type modifier
    const finalDamage = baseDamage * typeModifier * (1 - damageReduction);
    
    // Ensure minimum 1 damage
    return Math.max(1, Math.round(finalDamage));
  }
  
  calculateArmorReduction(armorValue) {
    // Each point of armor provides 6% EHP
    // Formula: Damage Reduction = Armor * 0.06 / (1 + Armor * 0.06)
    const armorMultiplier = armorValue * 0.06;
    return armorMultiplier / (1 + armorMultiplier);
  }
  
  getDamageTypeModifier(attackType, armorType) {
    // Damage type modifiers based on attack vs armor
    const armorTypes = {
      unarmored: {
        normal: 1.00, pierce: 1.50, siege: 1.50, magic: 1.00, spell: 1.00, hero: 1.00, chaos: 1.00
      },
      light: {
        normal: 1.00, pierce: 2.00, siege: 1.00, magic: 1.25, spell: 1.00, hero: 1.00, chaos: 1.00
      },
      medium: {
        normal: 1.50, pierce: 0.75, siege: 0.50, magic: 0.75, spell: 1.00, hero: 1.00, chaos: 1.00
      },
      heavy: {
        normal: 0.70, pierce: 0.35, siege: 1.50, magic: 0.35, spell: 1.00, hero: 0.50, chaos: 1.00
      },
      fortified: {
        normal: 0.70, pierce: 0.35, siege: 1.50, magic: 0.35, spell: 1.00, hero: 0.50, chaos: 1.00
      },
      hero: {
        normal: 1.00, pierce: 0.50, siege: 0.50, magic: 0.50, spell: 0.70, hero: 1.00, chaos: 1.00
      }
    };
    
    // Get modifier or default to 1.0
    const armorTypeObj = armorTypes[armorType] || armorTypes.unarmored;
    return armorTypeObj[attackType] || 1.0;
  }
  
  createProjectile(source, target) {
    const projectile = new Projectile(
      source.x, source.y, 
      target.x, target.y, 
      source.playerId
    );
    
    this.engine.entities.add(projectile);
  }
  
  getTarget(targetInfo) {
    // Handle string IDs or entity references
    if (typeof targetInfo === 'string') {
      return this.engine.entities.get(targetInfo);
    } else if (targetInfo.id) {
      return this.engine.entities.get(targetInfo.id);
    } else if (targetInfo.type === 'fortress') {
      // Handle fortress targets
      return this.engine.players[targetInfo.playerId].fortress;
    }
    
    return targetInfo;
  }
  
  reset() {
    // Nothing specific to reset
  }
}