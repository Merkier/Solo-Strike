// systems/VisualEffectSystem.js - Handles all visual effects
export class VisualEffectSystem {
  constructor(engine) {
    this.engine = engine;
    this.activeEffects = [];
  }
  
  update(delta) {
    // Update all active effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i]; // Correctly defined here
      
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
        this.updateParticles(effect, delta); // effect is passed as argument
      }
    }
  }
  
  render(ctx) {
    // Render all effects
    this.activeEffects.forEach(effect => { // Correctly defined here
      // Use appropriate rendering method based on effect type
      const renderMethod = this.getEffectRenderMethod(effect.type);
      if (renderMethod) {
        renderMethod.call(this, ctx, effect); // effect is passed as argument
      } else {
        // Default rendering for unknown effects
        this.drawDefaultEffect(ctx, effect); // effect is passed as argument
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
      'meleeAttack': this.drawMeleeAttackEffect,
      
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
    const effect = { // Correctly defined here
      ...effectData,
      startTime: Date.now(),
      progress: 0,
      active: true
    };
    
    // Add specific properties based on effect type
    this.initializeEffectProperties(effect); // effect is passed as argument
    
    // Add to active effects
    this.activeEffects.push(effect); // effect is passed as argument
    
    return effect;
  }
  
  createGroundEffect(effectData) {
    // Add to ability system's ground effects
    const abilitySystem = this.engine.systems.get('ability');
    abilitySystem.activeEffects.groundEffects.push(effectData);
    
    // Also create a visual effect
    return this.createEffect(effectData);
  }
  
  initializeEffectProperties(effect) { // effect is parameter, correct
    // Set up effect-specific properties
    switch(effect.type) {
      // ===== Healing effects =====
      case 'heal':
      case 'divineMending':
        effect.color = '#2ecc71'; // Green
        effect.particleCount = 8; // Reduced
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 2, // Smaller
          speed: 20, // Slower
          direction: 'up'
        });
        break;
        
      // ===== AOE effects =====
      case 'dispel':
        effect.color = '#ffffff'; // White
        effect.radius = effect.radius || 120;
        effect.initialRadius = 0;
        effect.finalRadius = effect.radius;
        // No particles for simpler dispel
        break;
        
      case 'bloodlust':
        effect.color = '#e74c3c'; // Red
        effect.radius = effect.radius || 100;
        effect.particleCount = 10; // Reduced
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 3, // Smaller
          speed: 30, // Slower
          direction: 'out',
          radius: effect.radius
        });
        break;
        
      case 'taunt':
        effect.color = '#e67e22'; // Orange
        effect.radius = effect.radius || 250;
        effect.waveCount = 1; // Reduced
        effect.waveSpeed = 1.5; 
        break;
        
      case 'spiritLink':
        effect.color = '#9b59b6'; // Purple
        effect.radius = effect.radius || 300;
        effect.particleCount = 10; // Reduced
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 2, // Smaller
          speed: 25, // Slower
          direction: 'out',
          radius: effect.radius
        });
        break;
        
      // ===== Unit effects =====
      case 'lightningShield':
        effect.color = '#3498db'; // Blue
        effect.radius = 20; // This is for particle init if they were used, shield drawn differently
        effect.bolts = 3; // Reduced
        effect.boltSegments = 2; // Simplified further in drawing method
        break;
        
      case 'innerFire':
        effect.color = '#f39c12'; // Gold/orange
        effect.particleCount = 8; // Reduced
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 2, // Smaller
          speed: 15, // Slower
          direction: 'orbit',
          radius: 25 // Radius for orbit path
        });
        break;
        
      case 'phalanxStance':
        effect.color = '#3498db'; // Blue
        effect.shieldSize = 25; 
        break;
        
      case 'crystallineCarapace':
        effect.color = '#bdc3c7'; // Silver
        effect.particleCount = 5; // Reduced
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 3, // Smaller
          speed: 8, // Slower
          direction: 'orbit',
          radius: 20 // Radius for orbit path
        });
        break;
        
      // ===== Ground effects =====
      case 'burningOil':
        effect.color = 'rgba(255, 100, 0, 0.3)'; 
        effect.flameColor = 'rgba(255, 50, 0, 0.7)'; 
        break;
        
      case 'seismicSlam':
        effect.color = '#795548'; // Brown
        effect.wavesCount = 1; // Reduced, used in drawing
        effect.groundColor = '#8d6e63'; 
        break;
        
      // ===== Other effects =====
      case 'plunder':
        effect.color = '#f1c40f'; // Gold
        effect.symbolSize = 12; // Smaller
        effect.yOffset = 0;
        effect.maxOffset = 20; // Reduced
        break;
        
      case 'glacialTempest':
        effect.color = '#00bcd4'; // Ice blue
        effect.particleCount = 10; // Reduced
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 2, // Smaller
          speed: 40, 
          direction: 'spiral',
          radius: 30 
        });
        break;
        
      case 'ancestralSpirit':
      case 'resurrection':
        effect.color = '#9b59b6'; // Purple
        effect.pillarHeight = 0;
        effect.maxHeight = 120; // Reduced height
        effect.particleCount = 10; // Reduced
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 2, // Smaller
          speed: 20, // Slower
          direction: 'up',
          lifetime: [0.5, 1.5] 
        });
        break;
        
      case 'spiritLinkDamage':
        effect.color = '#9b59b6'; // Purple
        effect.size = 25; // Smaller, used for ring size in drawing
        effect.particleCount = 5; // Reduced
        effect.particles = this.createParticles(effect.x, effect.y, effect.particleCount, {
          color: effect.color,
          size: 1, // Smaller
          speed: 30, 
          direction: 'random',
          lifetime: [0.3, 0.6] 
        });
        break;

      case 'meleeAttack':
          effect.color = effect.playerId === 'player1' ? '#4f8fba' : '#da863e';
          effect.arcRadius = 25; 
          effect.arcWidth = 3;   
          effect.progress = 0;
          break;
    }
  }
  
  // ========== Drawing methods for different effects ==========
  
  drawHealEffect(ctx, effect) { // effect is parameter
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress) * particle.alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    const circleSize = 8 * (1 - effect.progress);
    ctx.beginPath();
    ctx.fillStyle = effect.color;
    ctx.globalAlpha = 1 - effect.progress;
    ctx.arc(effect.x, effect.y, circleSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
  
  drawDispelEffect(ctx, effect) { // effect is parameter
    const progress = effect.progress;
    const radius = effect.radius * progress;
    ctx.beginPath();
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 2; 
    ctx.globalAlpha = 1 - progress;
    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }
  
  drawBloodlustEffect(ctx, effect) { // effect is parameter
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress) * particle.alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    const pulseFactor = 0.1 * Math.sin(effect.elapsedTime * 10); 
    const innerRadius = (effect.radius * 0.15) * (1 + pulseFactor) * (1 - effect.progress * 0.5) ;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(231, 76, 60, 0.5)'; 
    ctx.arc(effect.x, effect.y, innerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
  
  drawTauntEffect(ctx, effect) { // effect is parameter
    const baseProgress = effect.progress;
    let waveProgress = baseProgress * effect.waveSpeed;
    if (waveProgress >= 0 && waveProgress <= 1) {
      const radius = effect.radius * waveProgress;
      const alpha = (1 - waveProgress) * 0.4; 
      ctx.beginPath();
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 2; 
      ctx.globalAlpha = alpha;
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1 - baseProgress;
    ctx.fillStyle = effect.color;
    ctx.font = 'bold 20px Arial'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', effect.x, effect.y);
    ctx.globalAlpha = 1.0;
  }
  
  drawSpiritLinkEffect(ctx, effect) { // effect is parameter
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress) * particle.alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    const circleRadius = 30 * (1 - effect.progress * 0.5);
    ctx.beginPath();
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 1; 
    ctx.globalAlpha = 0.8 - effect.progress * 0.7; 
    ctx.arc(effect.x, effect.y, circleRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }
  
  drawLightningShieldEffect(ctx, effect) { // effect is parameter
    const x = effect.targetUnit ? effect.targetUnit.x : effect.x;
    const y = effect.targetUnit ? effect.targetUnit.y : effect.y;
    const shieldRadius = 20; 

    ctx.beginPath();
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 1; 
    ctx.globalAlpha = 0.8 - effect.progress * 0.5;
    ctx.arc(x, y, shieldRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    for (let i = 0; i < effect.bolts; i++) {
      const angle = (i / effect.bolts) * Math.PI * 2 + effect.elapsedTime * 2; 
      ctx.beginPath();
      ctx.strokeStyle = effect.color; 
      ctx.lineWidth = 1; 
      const startX = x + Math.cos(angle) * shieldRadius;
      const startY = y + Math.sin(angle) * shieldRadius;
      const endX = x + Math.cos(angle) * (shieldRadius + 15); 
      const endY = y + Math.sin(angle) * (shieldRadius + 15);
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }
  
  drawInnerFireEffect(ctx, effect) { // effect is parameter
    const x = effect.targetUnit ? effect.targetUnit.x : effect.x;
    const y = effect.targetUnit ? effect.targetUnit.y : effect.y;
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress * 0.3) * particle.alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.beginPath();
    ctx.fillStyle = 'rgba(243, 156, 18, 0.3)'; 
    ctx.globalAlpha = 0.7 - effect.progress * 0.3;
    ctx.arc(x, y, 10, 0, Math.PI * 2); 
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
  
  drawPhalanxStanceEffect(ctx, effect) { // effect is parameter
    const x = effect.targetUnit ? effect.targetUnit.x : effect.x;
    const y = effect.targetUnit ? effect.targetUnit.y : effect.y;
    const shieldSize = effect.shieldSize || 20;
    
    ctx.beginPath();
    ctx.fillStyle = effect.color;
    ctx.globalAlpha = 0.8 - effect.progress; 
    ctx.fillRect(x - shieldSize/2, y - shieldSize/2, shieldSize, shieldSize);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1; 
    ctx.beginPath();
    ctx.moveTo(x, y - shieldSize/3);
    ctx.lineTo(x, y + shieldSize/3);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }
  
  drawCrystallineCarapaceEffect(ctx, effect) { // effect is parameter
    const x = effect.targetUnit ? effect.targetUnit.x : effect.x;
    const y = effect.targetUnit ? effect.targetUnit.y : effect.y;
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress) * particle.alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    const shieldSize = 15 * (1 - effect.progress * 0.5); 
    ctx.beginPath();
    ctx.strokeStyle = effect.color; 
    ctx.lineWidth = 1; 
    ctx.globalAlpha = 0.8 - effect.progress;
    ctx.arc(x, y, shieldSize, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }
  
  drawBurningOilEffect(ctx, effect) { // effect is parameter
    ctx.beginPath();
    ctx.fillStyle = effect.color; 
    ctx.globalAlpha = 0.4 + Math.sin(effect.elapsedTime * 6) * 0.15; 
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    ctx.fill();
    
    const flameCount = 3; 
    for (let i = 0; i < flameCount; i++) {
      const angle = (i / flameCount) * Math.PI * 2 + effect.elapsedTime * 2; 
      const flameX = effect.x + Math.cos(angle) * effect.radius * 0.8;
      const flameY = effect.y + Math.sin(angle) * effect.radius * 0.8;
      const flameSize = 6 + Math.sin(effect.elapsedTime * 10 + i) * 2; 
      
      ctx.beginPath();
      ctx.fillStyle = effect.flameColor; 
      ctx.moveTo(flameX, flameY - flameSize / 2);
      ctx.lineTo(flameX - flameSize / 2, flameY + flameSize / 2);
      ctx.lineTo(flameX + flameSize / 2, flameY + flameSize / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }
  
  drawSeismicSlamEffect(ctx, effect) { // effect is parameter
    const waveProgress = effect.progress; 
    if (waveProgress > 0 && waveProgress < 1) {
      const radius = effect.radius * waveProgress;
      ctx.beginPath();
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 4 * (1 - waveProgress); 
      ctx.globalAlpha = 0.6 * (1 - waveProgress); 
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }
  
  drawPlunderEffect(ctx, effect) { // effect is parameter
    const x = effect.x;
    const y = effect.y;
    effect.yOffset = effect.maxOffset * effect.progress; 
    
    ctx.beginPath();
    ctx.fillStyle = effect.color;
    ctx.globalAlpha = 0.9 - effect.progress; 
    ctx.arc(x, y - effect.yOffset, effect.symbolSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000000'; 
    ctx.font = `bold ${effect.symbolSize * 1.2}px Arial`; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', x, y - effect.yOffset);
    ctx.globalAlpha = 1.0;
  }
  
  drawGlacialTempestEffect(ctx, effect) { // effect is parameter
    const x = effect.x;
    const y = effect.y;
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress) * particle.alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); 
        ctx.fill();
      });
    }
    const ringRadius = 25 * (1 + effect.progress); 
    ctx.beginPath();
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 2 * (1 - effect.progress); 
    ctx.globalAlpha = 0.6 * (1 - effect.progress); 
    ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  drawMeleeAttackEffect(ctx, effect) { // effect is parameter
    const progress = effect.progress;
    const startAngle = effect.angle - Math.PI / 6; 
    const endAngle = effect.angle + Math.PI / 6;   
    
    const x = effect.x + Math.cos(effect.angle) * 0; 
    const y = effect.y + Math.sin(effect.angle) * 0; 
    
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = effect.arcWidth; 
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.arc(x, y, effect.arcRadius, 
            startAngle, 
            startAngle + (endAngle - startAngle) * progress,
            false);
    ctx.stroke();
    
    ctx.lineCap = 'butt';
    ctx.globalAlpha = 1.0;
  }

  drawAncestralSpiritEffect(ctx, effect) { // effect is parameter
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress * 0.3) * particle.alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    effect.pillarHeight = effect.maxHeight * effect.progress;
    const pillarWidth = 15 * (1 - effect.progress * 0.5); 
    
    ctx.fillStyle = 'rgba(155, 89, 182, 0.6)'; 
    ctx.globalAlpha = 0.7 - effect.progress * 0.5;
    ctx.fillRect(effect.x - pillarWidth/2, effect.y - effect.pillarHeight, pillarWidth, effect.pillarHeight);
    
    ctx.globalAlpha = 1.0;
  }
  
  drawResurrectionEffect(ctx, effect) { // effect is parameter
    this.drawAncestralSpiritEffect(ctx, effect); // effect is passed
  }
  
  drawSpiritLinkDamageEffect(ctx, effect) { // effect is parameter
    if (effect.particles) {
      effect.particles.forEach(particle => {
        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (1 - effect.progress) * particle.alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    const pulseAmount = Math.sin(effect.progress * Math.PI * 2); 
    const ringSize = effect.size * (1 + pulseAmount * 0.1); 
    
    ctx.beginPath();
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 1 * (1 - effect.progress); 
    ctx.globalAlpha = 0.6 * (1 - effect.progress); 
    ctx.arc(effect.x, effect.y, ringSize, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }
  
  drawDefaultEffect(ctx, effect) { // effect is parameter
    ctx.beginPath();
    ctx.fillStyle = effect.color || '#ffffff';
    ctx.globalAlpha = 0.8 - effect.progress; 
    ctx.arc(effect.x, effect.y, (effect.radius || 15) * (1 - effect.progress * 0.5), 0, Math.PI * 2); 
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
  
  createParticles(x, y, count, options) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const particle = {
        x, y,
        color: options.color || '#ffffff',
        size: options.size || 1, 
        age: 0,
        maxAge: options.lifetime ? (Math.random() * (options.lifetime[1] - options.lifetime[0]) + options.lifetime[0]) : 1,
        alpha: 1,
        // startTime and duration are not strictly needed if we tie to effect.progress
      };
      
      const speed = options.speed || 30; 
      const angle = Math.random() * Math.PI * 2; 
      
      switch(options.direction) {
        case 'up':
          const upAngle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI/4; 
          particle.vx = Math.cos(upAngle) * speed;
          particle.vy = Math.sin(upAngle) * speed;
          break;
        case 'out':
          particle.vx = Math.cos(angle) * speed;
          particle.vy = Math.sin(angle) * speed;
          break;
        case 'orbit':
          const orbitAngle = Math.random() * Math.PI * 2;
          const radius = options.radius || 15; 
          particle.orbitAngle = orbitAngle;
          particle.orbitSpeed = speed / (radius + 0.1); 
          particle.orbitRadius = radius;
          break;
        case 'spiral':
          const spiralAngle = Math.random() * Math.PI * 2;
          particle.spiralAngle = spiralAngle;
          particle.spiralSpeed = speed / 150; 
          particle.spiralRadius = 0;
          particle.spiralGrowth = options.radius || 30; 
          break;
        case 'random':
        default:
          particle.vx = Math.cos(angle) * speed * (Math.random() * 0.5 + 0.5); 
          particle.vy = Math.sin(angle) * speed * (Math.random() * 0.5 + 0.5);
          particle.deceleration = 0.92; 
      }
      if (options.gravity) particle.gravity = options.gravity;
      particles.push(particle);
    }
    return particles;
  }
  
  updateParticles(effect, delta) { // effect is parameter
    if (!effect.particles) return;
    
    for (let i = effect.particles.length - 1; i >= 0; i--) {
      const particle = effect.particles[i]; 
      
      particle.alpha = 1 - effect.progress; 

      if (effect.progress >= 0.99) { 
        effect.particles.splice(i, 1);
        continue;
      }
  
      if (effect.targetUnit) {
        const unit = this.engine.entities.get(effect.targetUnit.id); 
        if (unit && unit.active) {
          if (particle.relativeX !== undefined && particle.relativeY !== undefined) {
            particle.x = unit.x + particle.relativeX;
            particle.y = unit.y + particle.relativeY;
          }
        } else {
          effect.particles.splice(i, 1);
          continue; 
        }
      }
      
      if (particle.vx !== undefined && particle.vy !== undefined) {
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        if (particle.gravity) particle.vy += particle.gravity * delta;
        if (particle.deceleration) {
          particle.vx *= Math.pow(particle.deceleration, delta * 60); 
          particle.vy *= Math.pow(particle.deceleration, delta * 60);
        }
      } else if (particle.orbitAngle !== undefined) {
        particle.orbitAngle += particle.orbitSpeed * delta;
        particle.x = effect.x + Math.cos(particle.orbitAngle) * particle.orbitRadius;
        particle.y = effect.y + Math.sin(particle.orbitAngle) * particle.orbitRadius;
      } else if (particle.spiralAngle !== undefined) {
        particle.spiralAngle += particle.spiralSpeed * delta;
        const ageRatio = effect.progress; 
        particle.spiralRadius = particle.spiralGrowth * ageRatio;
        particle.x = effect.x + Math.cos(particle.spiralAngle) * particle.spiralRadius;
        particle.y = effect.y + Math.sin(particle.spiralAngle) * particle.spiralRadius;
      }
    }
  }
  
  reset() {
    this.activeEffects = [];
  }
}
