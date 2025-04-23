// systems/VisualEffectSystem.js - Handles all visual effects
export class VisualEffectSystem {
  constructor(engine) {
    this.engine = engine;
    this.activeEffects = [];
  }
  
  update(delta) {
    // Update all active effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      
      // Update elapsed time
      effect.elapsedTime = (Date.now() - effect.startTime) / 1000;
      effect.progress = Math.min(effect.elapsedTime / effect.duration, 1);
      
      // Check if effect has expired
      if (effect.progress >= 1) {
        this.activeEffects.splice(i, 1);
        continue;
      }
      
      // Update effect position if it's attached to a unit
      if (effect.targetUnit) {
        const unit = this.engine.entities.get(effect.targetUnit.id);
        if (unit && unit.active) {
          effect.x = unit.x;
          effect.y = unit.y;
        }
      }
      
      // Update particles if present
      if (effect.particles) {
        this.updateParticles(effect, delta);
      }
    }
  }
  
  render(ctx) {
    // Render all effects
    this.activeEffects.forEach(effect => {
      // Use appropriate rendering method based on effect type
      const renderMethod = this.getEffectRenderMethod(effect.type);
      if (renderMethod) {
        renderMethod.call(this, ctx, effect);
      } else {
        // Default rendering for unknown effects
        this.drawDefaultEffect(ctx, effect);
      }
    });
  }
  
  getEffectRenderMethod(effectType) {
    // Map effect types to their rendering methods
    const renderMethods = {
      // Healing effects
      'heal': this.drawHealEffect,
      'divineMending': this.drawHealEffect,
      
      // AOE effects
      'dispel': this.drawDispelEffect,
      'taunt': this.drawTauntEffect,
      'spiritLink': this.drawSpiritLinkEffect,
      'bloodlust': this.drawBloodlustEffect,
      
      // Unit effects
      'lightningShield': this.drawLightningShieldEffect,
      'innerFire': this.drawInnerFireEffect,
      'phalanxStance': this.drawPhalanxStanceEffect,
      'crystallineCarapace': this.drawCrystallineCarapaceEffect,
      
      // Ground effects
      'burningOil': this.drawBurningOilEffect,
      'seismicSlam': this.drawSeismicSlamEffect,
      
      // Combat effects
      'meleeAttack': this.drawMeleeAttackEffect, // Add the new melee attack effect
      
      // Other effects
      'plunder': this.drawPlunderEffect,
      'glacialTempest': this.drawGlacialTempestEffect,
      'ancestralSpirit': this.drawAncestralSpiritEffect,
      'resurrection': this.drawResurrectionEffect,
      'spiritLinkDamage': this.drawSpiritLinkDamageEffect
    };
    
    return renderMethods[effectType];
  }
  
  createEffect(effectData) {
    // Create a new visual effect
    const effect = {
      ...effectData,
      startTime: Date.now(),
      progress: 0,
      active: true
    };
    
    // Add specific properties based on effect type
    this.initializeEffectProperties(effect);
    
    // Add to active effects
    this.activeEffects.push(effect);
    
    return effect;
  }
  
  createGroundEffect(effectData) {
    // Add to ability system's ground effects
    const abilitySystem = this.engine.systems.get('ability');
    abilitySystem.activeEffects.groundEffects.push(effectData);
    
    // Also create a visual effect
    return this.createEffect(effectData);
  }
  
  initializeEffectProperties(effect) {
    // Set up effect-specific properties
    switch(effect.type) {
      // ===== Healing effects =====
      case 'heal':
      case 'divineMending':
        effect.color = '#2ecc71'; // Green
        effect.particleCount = 15;
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 3,
          speed: 30,
          direction: 'up'
        });
        break;
        
      // ===== AOE effects =====
      case 'dispel':
        effect.color = '#ffffff'; // White
        effect.radius = effect.radius || 120;
        effect.initialRadius = 0;
        effect.finalRadius = effect.radius;
        break;
        
      case 'bloodlust':
        effect.color = '#e74c3c'; // Red
        effect.radius = effect.radius || 100;
        effect.particleCount = 20;
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 4,
          speed: 50,
          direction: 'out',
          radius: effect.radius
        });
        break;
        
      case 'taunt':
        effect.color = '#e67e22'; // Orange
        effect.radius = effect.radius || 250;
        effect.waveCount = 3; // Number of waves
        effect.waveSpeed = 2; // Speed of wave expansion
        break;
        
      case 'spiritLink':
        effect.color = '#9b59b6'; // Purple
        effect.radius = effect.radius || 300;
        effect.particleCount = 30;
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 3,
          speed: 40,
          direction: 'out',
          radius: effect.radius
        });
        break;
        
      // ===== Unit effects =====
      case 'lightningShield':
        effect.color = '#3498db'; // Blue
        effect.radius = 20;
        effect.bolts = 8; // Number of lightning bolts
        effect.boltSegments = 4; // Segments per bolt
        break;
        
      case 'innerFire':
        effect.color = '#f39c12'; // Gold/orange
        effect.particleCount = 15;
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 3,
          speed: 20,
          direction: 'orbit',
          radius: 25
        });
        break;
        
      case 'phalanxStance':
        effect.color = '#3498db'; // Blue
        effect.shieldSize = 30;
        break;
        
      case 'crystallineCarapace':
        effect.color = '#bdc3c7'; // Silver
        effect.particleCount = 8;
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 4,
          speed: 10,
          direction: 'orbit',
          radius: 20
        });
        break;
        
      // ===== Ground effects =====
      case 'burningOil':
        effect.color = 'rgba(255, 100, 0, 0.3)'; // Orange/red
        effect.flameColor = 'rgba(255, 50, 0, 0.7)'; // Brighter for flames
        break;
        
      case 'seismicSlam':
        effect.color = '#795548'; // Brown
        effect.wavesCount = 2;
        effect.groundColor = '#8d6e63'; // Lighter brown
        break;
        
      // ===== Other effects =====
      case 'plunder':
        effect.color = '#f1c40f'; // Gold
        effect.symbolSize = 15;
        effect.yOffset = 0;
        effect.maxOffset = 30;
        break;
        
      case 'glacialTempest':
        effect.color = '#00bcd4'; // Ice blue
        effect.particleCount = 20;
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 3,
          speed: 60,
          direction: 'spiral',
          radius: 40
        });
        break;
        
      case 'ancestralSpirit':
      case 'resurrection':
        effect.color = '#9b59b6'; // Purple
        effect.pillarHeight = 0; // Start at 0 and grow
        effect.maxHeight = 150;
        effect.particleCount = 30;
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 3,
          speed: 30,
          direction: 'up',
          lifetime: [0.5, 2.0]
        });
        break;
        
      case 'spiritLinkDamage':
        effect.color = '#9b59b6'; // Purple
        effect.size = 30;
        effect.particleCount = 10;
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 2,
          speed: 40,
          direction: 'random',
          lifetime: [0.3, 0.8]
        });
        break;

      case 'meleeAttack':
          // Use player's team color
          effect.color = effect.playerId === 'player1' ? '#4f8fba' : '#da863e';
          effect.arcRadius = 30; // Size of the slash arc
          effect.arcWidth = 5;   // Width of the slash
          effect.progress = 0;   // Animation progress
          break;
    }
  }
  
  // ========== Drawing methods for different effects ==========
  
  // ===== Healing effects =====
  drawHealEffect(ctx, effect) {
    // Draw healing particles
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress) * particle.alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Draw healing cross symbol at center
    const crossSize = 10 * (1 - effect.progress);
    ctx.beginPath();
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 1 - effect.progress;
    
    // Vertical line
    ctx.moveTo(effect.x, effect.y - crossSize);
    ctx.lineTo(effect.x, effect.y + crossSize);
    
    // Horizontal line
    ctx.moveTo(effect.x - crossSize, effect.y);
    ctx.lineTo(effect.x + crossSize, effect.y);
    
    ctx.stroke();
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  // ===== AOE effects =====
  drawDispelEffect(ctx, effect) {
    // Draw expanding ring
    const progress = effect.progress;
    const radius = effect.radius * progress;
    
    ctx.beginPath();
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 1 - progress;
    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Add some small particles radiating outward
    const particleCount = 8;
    const angle = Math.PI * 2 / particleCount;
    
    for (let i = 0; i < particleCount; i++) {
      const particleAngle = i * angle + progress * Math.PI; // Rotate with progress
      const particleRadius = radius * 0.8;
      const particleX = effect.x + Math.cos(particleAngle) * particleRadius;
      const particleY = effect.y + Math.sin(particleAngle) * particleRadius;
      
      ctx.beginPath();
      ctx.fillStyle = effect.color;
      ctx.arc(particleX, particleY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1.0;
  }
  
  drawBloodlustEffect(ctx, effect) {
    // Draw particles
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress) * particle.alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Draw center glow
    const innerRadius = effect.radius * 0.2 * (1 - effect.progress * 0.5);
    const gradient = ctx.createRadialGradient(
      effect.x, effect.y, 0,
      effect.x, effect.y, innerRadius
    );
    
    gradient.addColorStop(0, 'rgba(255, 50, 0, 0.7)');
    gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
    
    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(effect.x, effect.y, innerRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  drawTauntEffect(ctx, effect) {
    // Draw multiple expanding rings
    const baseProgress = effect.progress;
    const waveCount = effect.waveCount || 3;
    
    for (let i = 0; i < waveCount; i++) {
      // Calculate wave-specific progress
      const waveDelay = i * (1 / waveCount);
      let waveProgress = (baseProgress - waveDelay) * effect.waveSpeed;
      
      // Only draw visible waves
      if (waveProgress >= 0 && waveProgress <= 1) {
        const radius = effect.radius * waveProgress;
        const alpha = (1 - waveProgress) * 0.5; // Fade out as it expands
        
        ctx.beginPath();
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = alpha;
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    // Draw taunt symbol at center
    ctx.globalAlpha = 1 - baseProgress;
    ctx.fillStyle = effect.color;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', effect.x, effect.y);
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  drawSpiritLinkEffect(ctx, effect) {
    // Draw particles
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress) * particle.alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Draw pulsing circle at center
    const pulseSize = 1 + Math.sin(effect.progress * Math.PI * 4) * 0.2;
    const circleRadius = 40 * pulseSize * (1 - effect.progress * 0.5);
    
    ctx.beginPath();
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1 - effect.progress * 0.7;
    ctx.arc(effect.x, effect.y, circleRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  // ===== Unit effects =====
  drawLightningShieldEffect(ctx, effect) {
    // Get position - either follow a unit or use fixed coordinates
    const x = effect.targetUnit ? effect.targetUnit.x : effect.x;
    const y = effect.targetUnit ? effect.targetUnit.y : effect.y;
    
    // Draw a glowing blue ring
    ctx.beginPath();
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1 - effect.progress * 0.5; // Fade slowly
    
    // Make the shield pulsate slightly
    const pulseAmount = 0.1 * Math.sin(effect.elapsedTime * 10);
    const shieldRadius = 25 * (1 + pulseAmount);
    
    ctx.arc(x, y, shieldRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw lightning bolts around the unit
    for (let i = 0; i < effect.bolts; i++) {
      // Randomize angle slightly over time
      const timeOffset = effect.elapsedTime * 2 + i;
      const angle = (i / effect.bolts) * Math.PI * 2 + Math.sin(timeOffset) * 0.2;
      
      // Draw a lightning bolt
      ctx.beginPath();
      ctx.strokeStyle = '#3498db'; // Blue
      ctx.lineWidth = 2;
      
      // Start at shield edge
      const startX = x + Math.cos(angle) * shieldRadius;
      const startY = y + Math.sin(angle) * shieldRadius;
      ctx.moveTo(startX, startY);
      
      // Create zigzag pattern
      const segmentLength = 10;
      const boltLength = 40;
      const segments = Math.floor(boltLength / segmentLength);
      
      for (let j = 1; j <= segments; j++) {
        const segmentProgress = j / segments;
        const segmentX = x + Math.cos(angle) * (shieldRadius + boltLength * segmentProgress);
        const segmentY = y + Math.sin(angle) * (shieldRadius + boltLength * segmentProgress);
        
        // Add random offset perpendicular to bolt direction
        const perpAngle = angle + Math.PI/2;
        const offsetScale = 5 * (1 - segmentProgress); // Less zigzag toward the end
        const offsetX = Math.cos(perpAngle) * offsetScale * (Math.random() - 0.5);
        const offsetY = Math.sin(perpAngle) * offsetScale * (Math.random() - 0.5);
        
        ctx.lineTo(segmentX + offsetX, segmentY + offsetY);
      }
      
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  drawInnerFireEffect(ctx, effect) {
    // Get position - either follow a unit or use fixed coordinates
    const x = effect.targetUnit ? effect.targetUnit.x : effect.x;
    const y = effect.targetUnit ? effect.targetUnit.y : effect.y;
    
    // Draw particles
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress * 0.3) * particle.alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Draw inner glow
    const innerGlow = ctx.createRadialGradient(
      x, y, 0,
      x, y, 20
    );
    
    innerGlow.addColorStop(0, 'rgba(243, 156, 18, 0.5)');
    innerGlow.addColorStop(1, 'rgba(243, 156, 18, 0)');
    
    ctx.beginPath();
    ctx.fillStyle = innerGlow;
    ctx.globalAlpha = 1 - effect.progress * 0.3;
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  drawPhalanxStanceEffect(ctx, effect) {
    // Get position - either follow a unit or use fixed coordinates
    const x = effect.targetUnit ? effect.targetUnit.x : effect.x;
    const y = effect.targetUnit ? effect.targetUnit.y : effect.y;
    
    // Draw shield icon
    const shieldSize = effect.shieldSize || 20;
    
    // Shield outline
    ctx.beginPath();
    ctx.fillStyle = effect.color;
    ctx.globalAlpha = 1 - effect.progress;
    
    // Draw shield shape
    ctx.beginPath();
    ctx.moveTo(x, y - shieldSize/2);
    ctx.lineTo(x + shieldSize/2, y - shieldSize/4);
    ctx.lineTo(x + shieldSize/2, y + shieldSize/4);
    ctx.lineTo(x, y + shieldSize/2);
    ctx.lineTo(x - shieldSize/2, y + shieldSize/4);
    ctx.lineTo(x - shieldSize/2, y - shieldSize/4);
    ctx.closePath();
    ctx.fill();
    
    // Draw cross on shield
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x, y - shieldSize/4);
    ctx.lineTo(x, y + shieldSize/4);
    ctx.stroke();
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(x - shieldSize/4, y);
    ctx.lineTo(x + shieldSize/4, y);
    ctx.stroke();
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  drawCrystallineCarapaceEffect(ctx, effect) {
    // Get position - either follow a unit or use fixed coordinates
    const x = effect.targetUnit ? effect.targetUnit.x : effect.x;
    const y = effect.targetUnit ? effect.targetUnit.y : effect.y;
    
    // Draw particles
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress) * particle.alpha;
        
        // Draw diamond shapes for crystal effect
        const size = particle.size;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y - size);
        ctx.lineTo(particle.x + size, particle.y);
        ctx.lineTo(particle.x, particle.y + size);
        ctx.lineTo(particle.x - size, particle.y);
        ctx.closePath();
        ctx.fill();
      });
    }
    
    // Draw hexagonal shield
    const shieldSize = 20 * (1 - effect.progress * 0.5);
    
    ctx.beginPath();
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1 - effect.progress;
    
    // Draw hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      const pointX = x + Math.cos(angle) * shieldSize;
      const pointY = y + Math.sin(angle) * shieldSize;
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    ctx.closePath();
    ctx.stroke();
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  // ===== Ground effects =====
  drawBurningOilEffect(ctx, effect) {
    // Draw burning oil effect (red circle with flames)
    ctx.beginPath();
    ctx.fillStyle = effect.color;
    ctx.globalAlpha = 0.5 + Math.sin(effect.elapsedTime * 8) * 0.2; // Pulsating effect
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw flames around the perimeter
    const flameCount = Math.floor(effect.radius / 10); // Scale flame count with radius
    
    for (let i = 0; i < flameCount; i++) {
      // Calculate flame position on the perimeter with some randomization
      const angle = (i / flameCount) * Math.PI * 2 + Math.sin(effect.elapsedTime * 3) * 0.1;
      const radiusVariation = 0.7 + Math.sin(effect.elapsedTime * 10 + i) * 0.1; // Flame "dancing" effect
      
      const flameX = effect.x + Math.cos(angle) * effect.radius * radiusVariation;
      const flameY = effect.y + Math.sin(angle) * effect.radius * radiusVariation;
      
      // Flame size varies with time
      const flameSize = 8 + Math.sin(effect.elapsedTime * 12 + i * 2) * 3;
      
      // Draw flame (triangle shape)
      ctx.beginPath();
      ctx.fillStyle = effect.flameColor;
      
      // Triangle pointing toward center
      const centerAngle = Math.atan2(effect.y - flameY, effect.x - flameX);
      
      const p1x = flameX;
      const p1y = flameY;
      
      const p2x = flameX + Math.cos(centerAngle + 0.5) * flameSize;
      const p2y = flameY + Math.sin(centerAngle + 0.5) * flameSize;
      
      const p3x = flameX + Math.cos(centerAngle - 0.5) * flameSize;
      const p3y = flameY + Math.sin(centerAngle - 0.5) * flameSize;
      
      const tipX = flameX + Math.cos(centerAngle + Math.PI) * flameSize * 1.5;
      const tipY = flameY + Math.sin(centerAngle + Math.PI) * flameSize * 1.5;
      
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(p3x, p3y);
      ctx.closePath();
      
      ctx.fill();
    }
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  drawSeismicSlamEffect(ctx, effect) {
    const wavesCount = effect.wavesCount || 2;
    
    // Draw ground cracks
    ctx.beginPath();
    ctx.fillStyle = effect.groundColor;
    ctx.globalAlpha = 0.5 * (1 - effect.progress);
    
    // Draw a circular "crater"
    ctx.arc(effect.x, effect.y, effect.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw cracks radiating outward
    const crackCount = 8;
    
    for (let i = 0; i < crackCount; i++) {
      const angle = (i / crackCount) * Math.PI * 2;
      
      ctx.beginPath();
      ctx.strokeStyle = effect.groundColor;
      ctx.lineWidth = 3;
      
      // Start from crater edge
      const startX = effect.x + Math.cos(angle) * effect.radius * 0.3;
      const startY = effect.y + Math.sin(angle) * effect.radius * 0.3;
      ctx.moveTo(startX, startY);
      
      // Create zigzag crack
      const segments = 3;
      const maxLength = effect.radius * 0.8;
      
      for (let j = 1; j <= segments; j++) {
        const segmentLength = (j / segments) * maxLength;
        const segmentX = effect.x + Math.cos(angle) * segmentLength;
        const segmentY = effect.y + Math.sin(angle) * segmentLength;
        
        // Add random offset perpendicular to crack direction
        const perpAngle = angle + Math.PI/2;
        const offsetScale = 10 * (j / segments); // Wider cracks further out
        const offsetX = Math.cos(perpAngle) * offsetScale * (Math.random() - 0.5);
        const offsetY = Math.sin(perpAngle) * offsetScale * (Math.random() - 0.5);
        
        ctx.lineTo(segmentX + offsetX, segmentY + offsetY);
      }
      
      ctx.stroke();
    }
    
    // Draw expanding circular waves
    for (let i = 0; i < wavesCount; i++) {
      // Stagger wave starts
      const waveDelay = i * 0.3;
      const waveProgress = Math.max(0, Math.min(1, (effect.progress - waveDelay) * 2));
      
      if (waveProgress > 0 && waveProgress < 1) {
        const radius = effect.radius * waveProgress;
        
        ctx.beginPath();
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 6 * (1 - waveProgress);
        ctx.globalAlpha = 0.7 * (1 - waveProgress);
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  // ===== Other effects =====
  drawPlunderEffect(ctx, effect) {
    // Get position
    const x = effect.x;
    const y = effect.y;
    
    // Calculate current y-offset (coin floating upward)
    effect.yOffset = effect.maxOffset * effect.progress;
    
    // Draw gold coin
    ctx.beginPath();
    ctx.fillStyle = effect.color;
    ctx.globalAlpha = 1 - effect.progress;
    ctx.arc(x, y - effect.yOffset, effect.symbolSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw coin details
    ctx.strokeStyle = '#e67e22'; // Darker gold/copper
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - effect.yOffset, effect.symbolSize * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw $ symbol
    ctx.fillStyle = '#e67e22';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', x, y - effect.yOffset);
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  drawGlacialTempestEffect(ctx, effect) {
    // Get position
    const x = effect.x;
    const y = effect.y;
    
    // Draw particles
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress) * particle.alpha;
        
        // Draw snowflake/ice crystal shape
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Draw frost ring
    const ringRadius = 30 * (1 + effect.progress);
    
    ctx.beginPath();
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 3 * (1 - effect.progress);
    ctx.globalAlpha = 0.7 * (1 - effect.progress);
    ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw "frozen" symbol
    const symbolSize = 12 * (1 - effect.progress * 0.5);
    
    ctx.beginPath();
    ctx.fillStyle = effect.color;
    ctx.globalAlpha = 1 - effect.progress;
    
    // Draw snowflake shape
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(angle) * symbolSize,
        y + Math.sin(angle) * symbolSize
      );
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add small perpendicular lines for snowflake detail
      const midpointX = x + Math.cos(angle) * symbolSize * 0.6;
      const midpointY = y + Math.sin(angle) * symbolSize * 0.6;
      const perpAngle = angle + Math.PI/2;
      
      ctx.beginPath();
      ctx.moveTo(
        midpointX - Math.cos(perpAngle) * symbolSize * 0.2,
        midpointY - Math.sin(perpAngle) * symbolSize * 0.2
      );
      ctx.lineTo(
        midpointX + Math.cos(perpAngle) * symbolSize * 0.2,
        midpointY + Math.sin(perpAngle) * symbolSize * 0.2
      );
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  drawMeleeAttackEffect(ctx, effect) {
    // Calculate animation progress (0 to 1)
    const progress = effect.progress;
    
    // Arc swings from -π/3 to π/3 relative to the base angle
    const startAngle = effect.angle - Math.PI/3 * 0.5;
    const endAngle = effect.angle + Math.PI/3 * 0.5;
    
    // Current arc angle based on progress
    const arcAngle = startAngle + (endAngle - startAngle) * progress;
    
    // Calculate arc position (slightly in front of the unit in the direction of attack)
    const offsetDistance = 0;
    const x = effect.x + Math.cos(effect.angle) * offsetDistance;
    const y = effect.y + Math.sin(effect.angle) * offsetDistance;
    
    // Draw the arc
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = effect.arcWidth;
    ctx.lineCap = 'round'; // Rounded ends for smoother appearance
    
    // Draw the slash arc
    ctx.beginPath();
    
    // Arc sweeps from startAngle to current arcAngle
    ctx.arc(x, y, effect.arcRadius, 
            startAngle, 
            startAngle + (endAngle - startAngle) * progress,
            false);
    
    ctx.stroke();
    
    // Add a glow effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = effect.arcWidth / 2;
    ctx.beginPath();
    ctx.arc(x, y, effect.arcRadius, 
            startAngle, 
            startAngle + (endAngle - startAngle) * progress, 
            false);
    ctx.stroke();
    
    // Reset line settings
    ctx.lineCap = 'butt';
  }

  drawAncestralSpiritEffect(ctx, effect) {
    // Draw particles
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress * 0.3) * particle.alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Draw pillar of light
    effect.pillarHeight = effect.maxHeight * effect.progress;
    
    // Create gradient for pillar
    const gradient = ctx.createLinearGradient(
      effect.x, effect.y,
      effect.x, effect.y - effect.pillarHeight
    );
    
    gradient.addColorStop(0, 'rgba(155, 89, 182, 0.8)'); // Solid at bottom
    gradient.addColorStop(1, 'rgba(155, 89, 182, 0)'); // Fade at top
    
    // Draw pillar
    ctx.fillStyle = gradient;
    const pillarWidth = 30 * (1 - effect.progress * 0.5);
    
    ctx.beginPath();
    ctx.moveTo(effect.x - pillarWidth/2, effect.y);
    ctx.lineTo(effect.x + pillarWidth/2, effect.y);
    ctx.lineTo(effect.x + pillarWidth/3, effect.y - effect.pillarHeight);
    ctx.lineTo(effect.x - pillarWidth/3, effect.y - effect.pillarHeight);
    ctx.closePath();
    ctx.fill();
    
    // Draw base glow
    const baseGlow = ctx.createRadialGradient(
      effect.x, effect.y, 0,
      effect.x, effect.y, 40
    );
    
    baseGlow.addColorStop(0, 'rgba(155, 89, 182, 0.5)');
    baseGlow.addColorStop(1, 'rgba(155, 89, 182, 0)');
    
    ctx.fillStyle = baseGlow;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 40, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  drawResurrectionEffect(ctx, effect) {
    // Similar to ancestral spirit but with different color
    this.drawAncestralSpiritEffect(ctx, effect);
  }
  
  drawSpiritLinkDamageEffect(ctx, effect) {
    // Draw particles
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress) * particle.alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Draw pulsing ring
    const pulseAmount = Math.sin(effect.progress * Math.PI);
    const ringSize = effect.size * (1 + pulseAmount * 0.2);
    
    ctx.beginPath();
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 2 * (1 - effect.progress);
    ctx.globalAlpha = 0.7 * (1 - effect.progress);
    ctx.arc(effect.x, effect.y, ringSize, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  // Default effect rendering for any unknown types
  drawDefaultEffect(ctx, effect) {
    // Default visual for any effect without specific rendering
    ctx.beginPath();
    ctx.fillStyle = effect.color || '#ffffff';
    ctx.globalAlpha = 1 - effect.progress;
    ctx.arc(effect.x, effect.y, (effect.radius || 20) * (1 - effect.progress * 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
  
  // Particle system
  createParticles(x, y, count, options) {
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      // Create particle with common properties
      const particle = {
        x,
        y,
        color: options.color || '#ffffff',
        size: options.size || 2,
        age: 0,
        maxAge: options.lifetime ? 
          (Math.random() * (options.lifetime[1] - options.lifetime[0]) + options.lifetime[0]) : 
          1,
        alpha: 1
      };
      
      // Set direction and speed based on pattern
      const speed = options.speed || 50;
      
      switch(options.direction) {
        case 'up':
          // Particles moving upward
          const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI/3;
          particle.vx = Math.cos(angle) * speed;
          particle.vy = Math.sin(angle) * speed;
          break;
          
        case 'out':
          // Particles moving outward
          const outAngle = Math.random() * Math.PI * 2;
          particle.vx = Math.cos(outAngle) * speed;
          particle.vy = Math.sin(outAngle) * speed;
          break;
          
        case 'orbit':
          // Particles orbiting
          const orbitAngle = Math.random() * Math.PI * 2;
          const radius = options.radius || 20;
          particle.orbitAngle = orbitAngle;
          particle.orbitSpeed = speed / radius;
          particle.orbitRadius = radius;
          break;
          
        case 'spiral':
          // Particles in a spiral pattern
          const spiralAngle = Math.random() * Math.PI * 2;
          particle.spiralAngle = spiralAngle;
          particle.spiralSpeed = speed / 100;
          particle.spiralRadius = 0; // Starts at center and grows
          particle.spiralGrowth = options.radius || 40;
          break;
          
        case 'random':
          // Random direction
          const randomAngle = Math.random() * Math.PI * 2;
          particle.vx = Math.cos(randomAngle) * speed;
          particle.vy = Math.sin(randomAngle) * speed;
          particle.deceleration = 0.95; // Slow down over time
          break;
          
        default:
          // Random direction
          const defaultAngle = Math.random() * Math.PI * 2;
          particle.vx = Math.cos(defaultAngle) * speed;
          particle.vy = Math.sin(defaultAngle) * speed;
      }
      
      // Add gravity if specified
      if (options.gravity) {
        particle.gravity = options.gravity;
      }
      
      particles.push(particle);
    }
    
    return particles;
  }
  
  updateParticles(effect, delta) {
    if (!effect.particles) return;
    
    // Update each particle
    for (let i = effect.particles.length - 1; i >= 0; i--) {
      const particle = effect.particles[i];
      
      // Update age
      particle.elapsedTime = (Date.now() - particle.startTime) / 1000;
      particle.progress = Math.min(particle.elapsedTime / particle.duration, 1);
      
      // Check if effect has expired
      if (particle.progress >= 1) {
        // Remove old particle
        effect.particles.splice(i, 1);
        continue;
      }
  
      // If particle is attached to a target unit that's moving
      if (effect.targetUnit) {
        const unit = this.engine.entities.get(effect.targetUnit.id);
        if (unit && unit.active) {
          // Update particle position relative to the unit
          if (particle.relativeX !== undefined && particle.relativeY !== undefined) {
            particle.x = unit.x + particle.relativeX;
            particle.y = unit.y + particle.relativeY;
          }
        } else {
          // Target unit is no longer active, remove particle
          effect.particles.splice(i, 1);
        }
      }
      
      // Update alpha based on age
      particle.alpha = 1 - (particle.age / particle.maxAge);
      
      // Update position based on velocity
      if (particle.vx !== undefined && particle.vy !== undefined) {
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        
        // Apply gravity if present
        if (particle.gravity) {
          particle.vy += particle.gravity * delta;
        }
        
        // Apply deceleration if present
        if (particle.deceleration) {
          particle.vx *= Math.pow(particle.deceleration, delta * 60);
          particle.vy *= Math.pow(particle.deceleration, delta * 60);
        }
      }
      // Update position for orbiting particles
      else if (particle.orbitAngle !== undefined) {
        particle.orbitAngle += particle.orbitSpeed * delta;
        // Position around the center point
        particle.x = effect.x + Math.cos(particle.orbitAngle) * particle.orbitRadius;
        particle.y = effect.y + Math.sin(particle.orbitAngle) * particle.orbitRadius;
      }
      // Update position for spiral particles
      else if (particle.spiralAngle !== undefined) {
        particle.spiralAngle += particle.spiralSpeed * delta;
        // Increase radius over time
        const ageRatio = particle.age / particle.maxAge;
        particle.spiralRadius = particle.spiralGrowth * ageRatio;
        
        // Position in a spiral pattern
        particle.x = effect.x + Math.cos(particle.spiralAngle) * particle.spiralRadius;
        particle.y = effect.y + Math.sin(particle.spiralAngle) * particle.spiralRadius;
      }
    }
    
    // Generate new particles if needed
    if (effect.particles.length < effect.particleCount / 3) {
      const newParticles = this.createParticles(
        effect.x, effect.y, 
        Math.floor(effect.particleCount / 6), // Add a few new particles
        {
          color: effect.color,
          size: effect.particles[0]?.size || 2,
          speed: effect.particles[0]?.vx ? Math.sqrt(Math.pow(effect.particles[0].vx, 2) + Math.pow(effect.particles[0].vy, 2)) : 30,
          direction: effect.particles[0]?.orbitAngle !== undefined ? 'orbit' : 
                    effect.particles[0]?.spiralAngle !== undefined ? 'spiral' : 'out',
          radius: effect.radius,
          lifetime: [0.5, 1]
        }
      );
      
      effect.particles.push(...newParticles);
    }
  }
  
  reset() {
    this.activeEffects = [];
  }
}