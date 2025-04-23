// systems/MovementSystem.js - Handles entity movement
import { Fortress } from "../entity/Fortress.js";

export class MovementSystem {
  constructor(engine) {
    this.engine = engine;
  }
  
  update(delta) {
    // Process movement for all units
    const units = this.engine.entities.getUnits();
    
    units.forEach(unit => {
      this.processUnitMovement(unit, delta);
    });
    
    // Apply collision avoidance after all units have moved
    this.applySeparation(units);
  }
  
  processUnitMovement(unit, delta) {
    // Skip units that are attacking
    if (unit.isAttacking) {
      // Check if target is still valid
      const target = this.getTarget(unit.target);
      
      if (!target || !target.active) {
        // Target is gone, clear target and go back to walking forward
        unit.target = null;
        unit.isAttacking = false;
        this.moveForward(unit, delta);
        return;
      }
      
      // Check if target is still in range
      const distance = this.distanceBetween(unit, target);
      if (distance > unit.attackRange) {
        // Target moved out of range, keep following it
        unit.isAttacking = false;
        this.moveTowardTarget(unit, target, delta);
      }
      
      return;
    }
    
    // If we have a target, move toward it
    if (unit.target) {
      const target = this.getTarget(unit.target);
      
      if (!target || !target.active) {
        // Target is gone, clear target and go back to walking forward
        unit.target = null;
        this.moveForward(unit, delta);
      } else {
        // Check if target is in range
        const distance = this.distanceBetween(unit, target);
        
        if (distance > unit.attackRange) {
          // Target out of range, move toward it
          this.moveTowardTarget(unit, target, delta);
        } else {
          // Target in range, start attacking
          unit.isAttacking = true;
        }
      }
    } else {
      // Look for targets in attack range
      const target = this.findNearbyTarget(unit);
      
      if (target) {
        // Found a target, set it
        unit.target = target;
        
        // Check if already in range
        const distance = this.distanceBetween(unit, target);
        
        if (distance <= unit.attackRange) {
          // Already in range, start attacking
          unit.isAttacking = true;
        } else {
          // Not in range, move toward target
          this.moveTowardTarget(unit, target, delta);
        }
      } else {
        // No target found, just move forward
        this.moveForward(unit, delta);
        
      }
    }
  }
  
  // Find nearby targets within detection range
  findNearbyTarget(unit) {
    // Determine enemy player ID
    const enemyId = unit.playerId === 'player1' ? 'player2' : 'player1';
    
    // Get all active enemy units
    const enemyUnits = this.engine.entities.getUnits(enemyId);
    
    // Get the enemy fortress
    const enemyFortress = this.engine.players[enemyId].fortress;
    
    // Set minimum detection range for all units (especially helps melee units)
    const minimumDetectionRange = 150;
    
    // Check if any units are in detection range
    // For melee units (attackRange <= 50), use a larger multiplier to increase their aggro range
    const isNearRangeUnit = unit.attackRange <= 50;
    const detectionRange = isNearRangeUnit ? 
      Math.max(unit.attackRange * 4, minimumDetectionRange) : // 4x for melee units with minimum of 150
      Math.max(unit.attackRange * 1.5, minimumDetectionRange); // 1.5x for ranged with minimum of 150
    
    // Find closest enemy unit within detection range
    let closestEnemy = null;
    let closestDistance = detectionRange;
    
    for (const enemy of enemyUnits) {
      const distance = this.distanceBetween(unit, enemy);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }
    
    // If we found an enemy unit, target it
    if (closestEnemy) {
      return closestEnemy;
    }
    
    // If no enemy units found, check if fortress is close enough to target
    const distanceToFortress = this.distanceBetween(unit, enemyFortress);
    const fortressDetectionRange = 150; // Increased from 200 to 400 for better fortress targeting
    
    // Check if we're close to the fortress or in enemy territory
    const midline = this.engine.canvas.height / 2;
    const inEnemyTerritory = (unit.playerId === 'player1' && unit.y < midline) ||
                            (unit.playerId === 'player2' && unit.y > midline);
    
    // Make fortress targeting more aggressive when in enemy territory
    if (distanceToFortress < fortressDetectionRange || 
        (inEnemyTerritory && distanceToFortress < detectionRange * 2)) {
      // Return a fortress reference object that will be properly recognized by getTarget
      return { type: 'fortress', playerId: enemyId, instance: enemyFortress };
    }
    
    // No suitable target found
    return null;
  }
  
  moveTowardTarget(unit, target, delta) {
    // Get target position
    let targetX, targetY;
    
    if (target instanceof Fortress || (target.type === 'fortress' && target.instance)) {
      // Handle both direct fortress instances and fortress reference objects
      const fortress = target.instance || target;
      targetX = fortress.x;
      targetY = fortress.y;
    } else {
      targetX = target.x;
      targetY = target.y;
    }
    
    // Calculate direction
    const dx = targetX - unit.x;
    const dy = targetY - unit.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize direction
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;
    
    // Move unit
    const moveDistance = unit.speed * delta;
    unit.x += normalizedDx * moveDistance;
    unit.y += normalizedDy * moveDistance;
  }
  
  // Modified moveForward method for more straightforward path
  moveForward(unit, delta) {
    // Calculate target position
    const canvas = this.engine.canvas;
    let targetY;
    
    if (unit.playerId === 'player1') {
      // Player 1 units move up
      targetY = 0;
    } else {
      // Player 2 units move down
      targetY = canvas.height;
    }
    
    // Create a temporary target at the same x position
    const targetPosition = {
      x: unit.x,
      y: targetY
    };
    
    // Use moveTowardTarget to move in a straight line
    this.moveTowardTarget(unit, targetPosition, delta);
    
    // Check if we should look for targets
    // We do this here too so units will target enemies while they're moving forward
    if (!unit.target) {
      const target = this.findNearbyTarget(unit);
      if (target) {
        unit.target = target;
      }
    }
  }
  
  applySeparation(units) {
    // Simple collision avoidance
    const minDistance = 30; // Minimum distance between units
    
    // Use a grid to optimize collision detection
    const grid = this.buildSpatialGrid(units, minDistance);
    
    // Check each unit
    units.forEach(unit => {
      // Get potentially colliding units from nearby cells
      const nearby = this.getNearbyUnits(unit, grid, minDistance);
      
      // Apply separation for each nearby unit
      nearby.forEach(otherUnit => {
        if (otherUnit === unit) return;
        
        // Calculate distance between units
        const dx = otherUnit.x - unit.x;
        const dy = otherUnit.y - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If units are too close, push them apart
        if (distance < minDistance && distance > 0) {
          // Calculate overlap
          const overlap = minDistance - distance;
          
          // Normalize direction
          const normalizedDx = dx / distance;
          const normalizedDy = dy / distance;
          
          // Move units apart (half the overlap distance each)
          const pushDistance = overlap / 2;
          
          unit.x -= normalizedDx * pushDistance;
          unit.y -= normalizedDy * pushDistance;
          
          otherUnit.x += normalizedDx * pushDistance;
          otherUnit.y += normalizedDy * pushDistance;
        }
      });
    });
  }
  
  buildSpatialGrid(units, cellSize) {
    // Build a spatial grid for faster collision detection
    const grid = {};
    
    units.forEach(unit => {
      // Get grid cell for this unit
      const cellX = Math.floor(unit.x / cellSize);
      const cellY = Math.floor(unit.y / cellSize);
      const cellKey = `${cellX},${cellY}`;
      
      // Add unit to cell
      if (!grid[cellKey]) {
        grid[cellKey] = [];
      }
      
      grid[cellKey].push(unit);
    });
    
    return grid;
  }
  
  getNearbyUnits(unit, grid, cellSize) {
    // Get all units in the same and adjacent cells
    const cellX = Math.floor(unit.x / cellSize);
    const cellY = Math.floor(unit.y / cellSize);
    
    const nearby = [];
    
    // Check 3x3 grid of cells around unit
    for (let x = cellX - 1; x <= cellX + 1; x++) {
      for (let y = cellY - 1; y <= cellY + 1; y++) {
        const cellKey = `${x},${y}`;
        
        if (grid[cellKey]) {
          nearby.push(...grid[cellKey]);
        }
      }
    }
    
    return nearby;
  }
  
  distanceBetween(entity1, entity2) {
    // Handle fortress reference objects
    if (entity2 && entity2.type === 'fortress' && entity2.instance) {
      entity2 = entity2.instance;
    }
    if (entity1 && entity1.type === 'fortress' && entity1.instance) {
      entity1 = entity1.instance;
    }
    
    return Math.sqrt(
      Math.pow(entity2.x - entity1.x, 2) + 
      Math.pow(entity2.y - entity1.y, 2)
    );
  }
  
  getTarget(targetInfo) {
    // Handle string IDs or entity references
    if (typeof targetInfo === 'string') {
      return this.engine.entities.get(targetInfo);
    } else if (targetInfo && targetInfo.id) {
      return this.engine.entities.get(targetInfo.id);
    } else if (targetInfo && targetInfo.type === 'fortress') {
      // Handle fortress targets - get the actual fortress instance
      if (targetInfo.instance) {
        // If we already have the instance, use it
        return targetInfo.instance;
      } else {
        // Otherwise look it up
        return this.engine.players[targetInfo.playerId].fortress;
      }
    }
    
    return targetInfo;
  }
  
  reset() {
    // Nothing specific to reset
  }
}