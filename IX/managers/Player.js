// managers/Player.js - Player class
import { Fortress } from "../entity/Fortress.js";
export class Player {
  constructor(id, engine) {
    this.id = id;
    this.engine = engine;
    
    // Resources
    this.gold = 280; // Starting gold
    this.goldIncomeLevel = 0; // Gold upgrade level (0-4)
    this.goldIncomeRate = 5; // Base gold per second
    
    // Fortress
    this.fortressLevel = 1; // Starting fortress level
    this.fortress = this.createFortress();
    
    // Unit placement grid
    this.gridWidth = 15;
    this.gridHeight = 4;
    this.grid = Array(this.gridHeight).fill().map(() => 
      Array(this.gridWidth).fill(null)
    );
    
    // Upgrade tracking
    this.purchasedUpgrades = [];
    
    // Calculate grid position
    this.updateGridPosition();
  }
  
  createFortress() {
    // Create a fortress entity for this player
    const x = this.engine.canvas.width / 2;
    const y = this.id === 'player1' ? 
      this.engine.canvas.height - 100 : 100;
    
    return new Fortress(this.id, x, y);
  }
  
  updateGridPosition() {
    // Calculate grid cell size based on canvas dimensions
    const canvas = this.engine.canvas;
    const maxGridWidth = canvas.width * 0.9;
    const cellSize = Math.min(
      maxGridWidth / this.gridWidth,
      canvas.height * 0.5 / this.gridHeight
    );
    
    const gridWidth = this.gridWidth * cellSize;
    const gridHeight = this.gridHeight * cellSize;
    
    // Position grids on opposite sides but centered horizontally
    let gridX = (canvas.width - gridWidth) / 2;
    let gridY;
    
    if (this.id === 'player1') {
      // Bottom side of screen
      gridY = canvas.height - gridHeight;
    } else {
      // Top side of screen
      gridY = 0;
    }
    
    // Store grid position information for hit detection
    this.gridPosition = {
      x: gridX,
      y: gridY,
      width: gridWidth,
      height: gridHeight,
      cellSize
    };
  }
  
  // Upgrade gold income
  upgradeGoldIncome() {
    if (this.goldIncomeLevel < 4) {
      // Calculate upgrade cost: 150g + 50g per level
      const upgradeCost = 150 + (this.goldIncomeLevel * 50);
      
      if (this.gold >= upgradeCost) {
        this.gold -= upgradeCost;
        this.goldIncomeLevel++;
        
        // Start cooldown
        this.engine.playerManager.goldUpgradeCooldowns[this.id] = 90; // 90 second cooldown
        
        // Update income rate
        this.goldIncomeRate = 5 + (this.goldIncomeLevel * 0.5);
        
        return true;
      }
    }
    return false;
  }
  
  // Upgrade fortress
  upgradeFortress() {
    if (this.fortressLevel < 3) {
      // Calculate upgrade cost: 250g + 50g per level
      const upgradeCost = 250 + ((this.fortressLevel - 1) * 50);
      
      if (this.gold >= upgradeCost) {
        this.gold -= upgradeCost;
        this.fortressLevel++;
        return true;
      }
    }
    return false;
  }
  
  // Purchase and place a unit
  purchaseUnit(type, row, col) {
    // Check if the unit type exists
    if (!window.unitTypes[type]) return false;
    
    // Check required fortress level
    const unitData = window.unitTypes[type];
    if (this.fortressLevel < unitData.requiredFortressLevel) return false;
    
    // Check gold
    if (this.gold < unitData.cost) return false;
    
    // Check if grid cell is empty
    if (this.grid[row][col] !== null) return false;
    
    // Purchase the unit
    this.gold -= unitData.cost;
    this.grid[row][col] = type;
    
    return true;
  }
  
  // Get unit at a specific grid position
  getUnitAt(row, col) {
    if (row >= 0 && row < this.gridHeight && 
        col >= 0 && col < this.gridWidth) {
      return this.grid[row][col];
    }
    return null;
  }
  
  // Remove unit from a grid position
  removeUnitAt(row, col) {
    if (row >= 0 && row < this.gridHeight && 
        col >= 0 && col < this.gridWidth) {
      this.grid[row][col] = null;
      return true;
    }
    return false;
  }
  
  // Sell unit and get partial refund
  sellUnit(row, col) {
    const unitType = this.getUnitAt(row, col);
    if (!unitType) return 0;
    
    // Calculate refund (75% of cost)
    const unitData = window.unitTypes[unitType];
    const refund = Math.floor(unitData.cost * 0.75);
    
    // Remove unit from grid
    this.removeUnitAt(row, col);
    
    // Add gold refund
    this.gold += refund;
    
    return refund;
  }
  
  // Move unit from one grid position to another
  moveUnit(fromRow, fromCol, toRow, toCol) {
    // Get the unit type
    const unitType = this.getUnitAt(fromRow, fromCol);
    if (!unitType) return false;
    
    // Check if destination is empty
    if (this.getUnitAt(toRow, toCol) !== null) return false;
    
    // Move the unit
    this.grid[toRow][toCol] = unitType;
    this.grid[fromRow][fromCol] = null;
    
    return true;
  }
}

