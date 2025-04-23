// entity/Fortress.js - Fortress entity
import { Entity } from './Entity.js';
  
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
