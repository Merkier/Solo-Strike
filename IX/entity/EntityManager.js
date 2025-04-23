// entity/EntityManager.js - Manages all game entities
import { Unit } from "../entity/Unit.js";
  import { Projectile } from "../entity/Projectile.js";
export class EntityManager {
  constructor() {
    this.entities = new Map();
    this.unitsByPlayer = {
      player1: new Set(),
      player2: new Set()
    };
    this.projectiles = new Set();
  }
  
  add(entity) {
    // Add to main entities map
    this.entities.set(entity.id, entity);
    
    // Add to specific collections for faster access
    if (entity instanceof Unit) {
      this.unitsByPlayer[entity.playerId].add(entity.id);
    } else if (entity instanceof Projectile) {
      this.projectiles.add(entity.id);
    }
    
    return entity;
  }
  
  remove(entityId) {
    const entity = this.entities.get(entityId);
    
    if (entity) {
      // Remove from specific collections
      if (entity instanceof Unit) {
        this.unitsByPlayer[entity.playerId].delete(entity.id);
      } else if (entity instanceof Projectile) {
        this.projectiles.delete(entity.id);
      }
      
      // Remove from main map
      this.entities.delete(entityId);
    }
  }
  
  get(entityId) {
    return this.entities.get(entityId);
  }
  
  getAll() {
    return Array.from(this.entities.values());
  }
  
  getUnits(playerId = null) {
    if (playerId) {
      // Get units for specific player
      return Array.from(this.unitsByPlayer[playerId])
        .map(id => this.entities.get(id))
        .filter(entity => entity && entity.active);
    } else {
      // Get all active units
      return this.getAll()
        .filter(entity => entity instanceof Unit && entity.active);
    }
  }
  
  getProjectiles() {
    return Array.from(this.projectiles)
      .map(id => this.entities.get(id))
      .filter(entity => entity && entity.active);
  }
  
  update(delta) {
    // Update all entities
    for (const entity of this.entities.values()) {
      if (entity.active) {
        entity.update(delta);
      }
    }
    
    // Clean up inactive entities
    this.cleanupInactive();
  }
  
  cleanupInactive() {
    // Find inactive entities
    const inactiveIds = [];
    
    for (const [id, entity] of this.entities.entries()) {
      if (!entity.active) {
        inactiveIds.push(id);
      }
    }
    
    // Remove them
    inactiveIds.forEach(id => this.remove(id));
  }
  
  clear() {
    this.entities.clear();
    this.unitsByPlayer.player1.clear();
    this.unitsByPlayer.player2.clear();
    this.projectiles.clear();
  }
}