// managers/WaveManager.js - Manages wave spawning
import { Unit } from "../entity/Unit.js";
export class WaveManager {
  constructor(engine) {
    this.engine = engine;
  }
  
  init() {
    // Initialize wave state
    return this;
  }
  
  spawnWave() {
    console.log("Spawning new wave of units");
    
    // Log grid state before spawning
    Object.values(this.engine.players).forEach(player => {
      console.log(`${player.id} grid state:`, JSON.stringify(player.grid));
    });
    
    // Track units created for debugging
    const unitsCreated = {
      player1: 0,
      player2: 0
    };
  
    // Spawn units for each player
    Object.values(this.engine.players).forEach(player => {
      // Calculate base spawn position (at the fortress)
      const baseSpawnY = player.id === 'player1' ? 
        this.engine.canvas.height - 100 - 30 : 
        100 + 30;
      
      // Calculate formation width and height in pixels
      const cellSizePx = player.gridPosition.cellSize;
      const formationWidth = player.gridWidth * cellSizePx;
      
      // Center the formation horizontally
      const formationStartX = (this.engine.canvas.width - formationWidth) / 2;
      
      // Loop through grid and spawn units
      for (let gridRow = 0; gridRow < player.gridHeight; gridRow++) {
        // For player 1, reverse the row order when spawning
        const row = player.id === 'player1' ? 
          (player.gridHeight - 1 - gridRow) : // Reversed for player 1
          gridRow;                            // Normal for player 2
        
        for (let col = 0; col < player.gridWidth; col++) {
          const unitType = player.grid[row][col];
          
          if (unitType) {
            console.log(`${player.id} spawning ${unitType} at grid [${row},${col}]`);
            
            // Calculate spawn position with a small random offset to prevent exact overlaps
            const spawnX = formationStartX + (col + 0.5) * cellSizePx + (Math.random() - 0.5) * 5;
            
            // Calculate Y position with offset from base position and a small random offset
            const rowOffset = gridRow * cellSizePx;
            const spawnY = player.id === 'player1' ? 
              baseSpawnY - rowOffset + (Math.random() - 0.5) * 5 : 
              baseSpawnY + rowOffset + (Math.random() - 0.5) * 5;
            
            // Create new unit
            const unit = new Unit(unitType, player.id, spawnX, spawnY);
            
            // Apply any purchased upgrades to the unit
            this.applyUpgradesToUnit(unit, player);
            
            // Add to entities
            this.engine.entities.add(unit);
            unitsCreated[player.id]++;
            
            console.log(`${unitType} spawned at x:${unit.x}, y:${unit.y}`);
          }
        }
      }
    });
    
    // Log final counts AFTER all spawning is complete
    console.log("=== FINAL UNIT COUNTS ===");
    Object.values(this.engine.players).forEach(player => {
      const actualCount = this.engine.entities.getUnits(player.id).length;
      console.log(`${player.id}: Created=${unitsCreated[player.id]}, Final count=${actualCount}`);
    });
  }

  
  
  applyUpgradesToUnit(unit, player) {
    // Apply each purchased upgrade if it applies to this unit type
    player.purchasedUpgrades.forEach(upgradeId => {
      const upgradeSystem = this.engine.systems.get('upgrade');
      if (upgradeSystem.shouldApplyUpgradeToUnit(unit, upgradeId)) {
        // Enable any abilities that require this upgrade
        if (unit.abilities) {
          unit.abilities.forEach(ability => {
            if (ability.requiredUpgrade === upgradeId) {
              ability.enabled = true;
            }
          });
        }
        
        // Add to unit's upgrades list
        if (!unit.upgrades) {
          unit.upgrades = [];
        }
        
        if (!unit.upgrades.includes(upgradeId)) {
          unit.upgrades.push(upgradeId);
        }
        
        // Apply any stat bonuses
        upgradeSystem.applyStatBonuses(unit, upgradeId);
      }
    });
  }
}

