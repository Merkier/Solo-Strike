// entity/Projectile.js - Projectile entity
import { Entity } from './Entity.js';

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

