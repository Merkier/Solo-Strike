// IX/entities.js - Consolidated entity classes
import { unitTypes } from './data/unitTypes.js'; // Import unitTypes

// Base entity class
export class Entity {
  constructor(id, x, y) {
    this.id = id || crypto.randomUUID();
    this.x = x;
    this.y = y;
    this.active = true;
  }
  
  update(delta) {
    // Base update logic
  }
  
  render(ctx) {
    // Base render logic
  }
}

// Game unit entity
export class Unit extends Entity {
  constructor(type, playerId, x, y) {
    super(`unit_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, x, y);
    this.type = type;         // Unit type (e.g., 'guardian')
    this.playerId = playerId; // Which player owns this unit
    this.width = 20;
    this.height = 20;
    
    // Unit stats
    this.stats = {};
    
    // Combat properties
    this.health = 0;
    this.maxHealth = 0;
    this.mana = 0;
    this.maxMana = 0;
    this.attackPower = 0;
    this.attackType = 'normal';
    this.attackRange = 0;
    this.attackSpeed = 1.0;
    this.lastAttackTime = 0;
    this.armorType = 'medium';
    this.armorValue = 0;

    
    // Movement
    this.speed = 0;
    this.target = null;
    
    // Visual properties
    this.color = '#ffffff';
    
    // Ability & upgrade tracking
    this.abilities = [];
    this.upgrades = [];
    this.buffs = {};
    this.debuffs = {};
    
    // Initialize based on unit type
    this.initializeFromType(type);
  }
  
  initializeFromType(type) {
    // Load unit data from unitTypes config
    const unitData = unitTypes[type]; // Use imported unitTypes
    if (!unitData || !unitData.stats) {
      console.error(`Invalid unit type: ${type}`);
      return;
    }
    
    const stats = unitData.stats;
    
    // Copy core stats
    this.maxHealth = stats.maxHealth;
    this.health = stats.health || stats.maxHealth;
    
    // Handle attack power (min-max range or fixed)
    if (stats.attackPower && typeof stats.attackPower === 'object') {
      this.attackPower = { ...stats.attackPower };
    } else {
      this.attackPower = stats.attackPower;
    }
    
    // Copy other stats
    this.attackType = stats.attackType || 'normal';
    this.attackRange = stats.attackRange;
    this.attackSpeed = stats.attackSpeed;
    this.speed = stats.speed;
    this.armorType = stats.armorType || 'medium';
    this.armorValue = stats.armorValue || 0;
    this.color = stats.color || '#ffffff';
    
    // Initialize mana if unit has it
    if (stats.maxMana) {
      this.maxMana = stats.maxMana;
      this.mana = stats.mana || stats.maxMana;
    }
    
    // Deep copy abilities
    if (stats.abilities && Array.isArray(stats.abilities)) {
      this.abilities = JSON.parse(JSON.stringify(stats.abilities));
    }
  }
  
  update(delta) {
    if (!this.active) return;
    
    // Regenerate mana
    if (this.maxMana) {
      this.mana = Math.min(this.maxMana, this.mana + 5 * delta);
    }
    
    // Update ability cooldowns
    if (this.abilities) {
      this.abilities.forEach(ability => {
        if (ability.cooldownRemaining && ability.cooldownRemaining > 0) {
          ability.cooldownRemaining -= delta;
          if (ability.cooldownRemaining < 0) ability.cooldownRemaining = 0;
        }
      });
    }
    
    // Movement and combat will be handled by respective systems
  }
  
  render(ctx, drawUnitIconFn) {
    if (!this.active) return;
    
    // Save context
    ctx.save();
    
    // Draw unit body (placeholder - will be enhanced)
    ctx.fillStyle = this.playerId === 'player1' ? '#3498db' : '#e74c3c';
    ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    
    // Draw unit inner shape using the passed function
    if (drawUnitIconFn) {
      drawUnitIconFn(ctx, this.x, this.y, this.width/1.1, this.color);
    } else {
      // Fallback to simple shape if no drawing function is provided
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - this.width/4, this.y - this.height/4, this.width/2, this.height/2);
    }
    
    // Draw health bar
    this.renderHealthBar(ctx);
    
    // Restore context
    ctx.restore();
  }
  
  renderHealthBar(ctx) {
    const healthPercent = this.health / this.maxHealth;
    const barWidth = this.width;
    const barHeight = 4;
    
    // Background
    ctx.fillStyle = '#555555';
    ctx.fillRect(
      this.x - barWidth/2,
      this.y - this.height/2 - barHeight - 2,
      barWidth,
      barHeight
    );
    
    // Fill based on health percentage
    ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : '#e74c3c';
    ctx.fillRect(
      this.x - barWidth/2,
      this.y - this.height/2 - barHeight - 2,
      barWidth * healthPercent,
      barHeight
    );
  }
  
  takeDamage(amount) {
    // Apply damage
    this.health -= amount;
    
    // Check if unit died
    if (this.health <= 0) {
      this.health = 0;
      this.active = false;
      
      //Clean up buffs and debuffs
      const gameEngine = window.gameEngine;
      
      // Remove visual effects
      if (gameEngine.systems.get('visual')) {
        const visualSystem = gameEngine.systems.get('visual');
        // Remove any effects targeting this unit
        visualSystem.activeEffects = visualSystem.activeEffects.filter(effect => 
          effect.targetUnit !== this
        );
      }
      
      // Remove buffs/debuffs from ability system
      if (gameEngine.systems.get('ability')) {
        const abilitySystem = gameEngine.systems.get('ability');
        
        // Remove from buffs
        abilitySystem.activeEffects.buffs = 
          abilitySystem.activeEffects.buffs.filter(buff => 
            buff.targetUnit !== this
          );
        
        // Remove from debuffs
        abilitySystem.activeEffects.debuffs = 
          abilitySystem.activeEffects.debuffs.filter(debuff => 
            debuff.targetUnit !== this
          );
      }
      
      // Add to dead units list for potential resurrection
      if (gameEngine.systems.get('ability')) {
        gameEngine.systems.get('ability').addDeadUnit(this);
      }
      
      return true; // Unit died
    }
    
    return false; // Unit still alive
  }
  
  // Method to use an ability - delegates to AbilitySystem
  useAbility(abilityName, targetX, targetY, targetUnit = null) {
    const gameEngine = window.gameEngine;
    return gameEngine.systems.get('ability').useAbility(this, abilityName, targetX, targetY, targetUnit);
  }
  
  // Check if unit has an upgrade
  hasUpgrade(upgradeId) {
    return this.upgrades && this.upgrades.includes(upgradeId);
  }
}

// Fortress entity
export class Fortress extends Entity {
  constructor(playerId, x, y) {
    super(`fortress_${playerId}`, x, y);
    this.playerId = playerId;
    this.type = 'fortress'; // Add this line to identify fortress targets
    this.armorType = 'fortified'; // Add this for damage calculations
    this.armorValue = 5; // Add some base armor value
    this.health = 4000;
    this.maxHealth = 4000;
    this.attackPower = 87;
    this.attackRange = 150;
    this.attackSpeed = 0.5;
    this.lastAttackTime = 0;
    this.radius = 0;  // Will be calculated based on canvas size
    this.stunned = false;
    this.stunDuration = 0;
  }
  
  update(delta) {
    // Update stun duration if stunned
    if (this.stunned) {
      this.stunDuration -= delta;
      if (this.stunDuration <= 0) {
        this.stunned = false;
      }
    }
  }
  
  render(ctx, canvasWidth, canvasHeight) {
    // Calculate radius based on canvas size
    this.radius = Math.min(canvasWidth, canvasHeight) * 0.07;
    
    // Draw fortress (circle)
    ctx.beginPath();
    ctx.fillStyle = this.playerId === 'player1' ? '#4f8fba' : '#da863e';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw health circle around fortress
    this.renderHealthCircle(ctx);
  }
  
  renderHealthCircle(ctx) {
    const borderThickness = 15;
    const healthRatio = Math.max(this.health / this.maxHealth, 0);
    const startAngle = -Math.PI / 2; // Start from the top
    const endAngle = startAngle + healthRatio * 2 * Math.PI;
    
    // Draw background (missing health)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + borderThickness, 0, Math.PI * 2);
    ctx.lineWidth = borderThickness;
    ctx.strokeStyle = '#444';
    ctx.stroke();
    
    // Draw health arc
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + borderThickness, startAngle, endAngle);
    ctx.lineWidth = borderThickness;
    ctx.strokeStyle = this.playerId === 'player1' ? '#4f8fba' : '#da863e';
    ctx.stroke();
  }
  
  takeDamage(amount) {
    this.health -= amount;
    
    // Limit to minimum of 0
    if (this.health < 0) {
      this.health = 0;
    }
    
    return this.health <= 0; // Return true if fortress is destroyed
  }
  
  canAttack() {
    return !this.stunned;
  }
}

// Projectile entity
export class Projectile extends Entity {
  constructor(startX, startY, endX, endY, playerId) {
    super(`projectile_${Date.now()}`, startX, startY);
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.playerId = playerId;
    this.progress = 0;  // 0 to 1 for animation
    this.speed = 5;     // Higher = faster projectile
  }
  
  update(delta) {
    // Update progress
    this.progress += this.speed * delta;
    
    // Calculate current position
    this.x = this.startX + (this.endX - this.startX) * this.progress;
    this.y = this.startY + (this.endY - this.startY) * this.progress;
    
    // Mark as inactive when complete
    if (this.progress >= 1) {
      this.active = false;
    }
  }
  
  render(ctx) {
    // Draw projectile
    ctx.fillStyle = this.playerId === 'player1' ? '#3498db' : '#e74c3c';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
