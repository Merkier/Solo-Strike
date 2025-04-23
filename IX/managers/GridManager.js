// managers/GridManager.js - Manages the unit placement grid
export class GridManager {
  constructor(engine) {
    this.engine = engine;
  }
  
  init() {
    // Initialize grid state
    return this;
  }
  
  handleGridClick(x, y, playerId) {
    const player = this.engine.players[playerId];
    if (!player) return false;
    
    // Check if click is within grid bounds
    const grid = player.gridPosition;
    if (!this.isPointInRect(x, y, grid.x, grid.y, grid.width, grid.height)) {
      return false;
    }
    
    // Calculate grid cell coordinates
    const col = Math.floor((x - grid.x) / grid.cellSize);
    const row = Math.floor((y - grid.y) / grid.cellSize);
    
    // Check if cell is valid
    if (row < 0 || row >= player.gridHeight || col < 0 || col >= player.gridWidth) {
      return false;
    }
    
    // Return grid coordinates for further processing
    return { row, col, player };
  }
  
  isPointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
    return x >= rectX && x <= rectX + rectWidth && 
           y >= rectY && y <= rectY + rectHeight;
  }
}
