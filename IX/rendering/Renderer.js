// rendering/Renderer.js - Main rendering system
export class Renderer {
  constructor(engine) {
    this.engine = engine;
    this.ctx = engine.ctx;
    this.canvas = engine.canvas;
    
    // Layers ordered by z-index
    this.renderLayers = [
      this.renderBackground.bind(this),   // Background layer (terrain, etc.)
      this.renderWorld.bind(this),        // World elements (fortresses, midfield)
      this.renderEntities.bind(this),     // Game entities (units, projectiles)
      this.renderEffects.bind(this),      // Visual effects
      this.renderUI.bind(this)            // UI elements
    ];
  }
  
  render() {
    // Execute all render layers in order
    this.renderLayers.forEach(renderFunction => renderFunction());
  }
  
  renderBackground() {
    // Clear the canvas first
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background color/pattern
    this.ctx.fillStyle = '#1f2533'; // Dark blue-gray background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid pattern
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    
    // Vertical grid lines
    const gridSize = 40;
    for (let x = 0; x < this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = 0; y < this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }
  
  renderWorld() {
    // Draw dividing line (midfield)
    this.drawMidFieldLine();
    
    // Draw fortresses
    this.drawFortresses();
    
    // Draw player grids
    this.drawPlayerGrids();
  }
  
  drawMidFieldLine() {
    // Use controlling player's color or default to white if no control
    if (this.engine.state.midFieldControl) {
      // Use the fortress colors for consistency
      const color = this.engine.state.midFieldControl === 'player1' ? 
        '#4f8fba' : '#da863e';
      
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 3; // Make line thicker to be more noticeable
    } else {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // Default white when no control
      this.ctx.lineWidth = 2;
    }
    
    this.ctx.setLineDash([10, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height / 2);
    this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
  
  drawFortresses() {
    // Draw both player fortresses
    Object.values(this.engine.players).forEach(player => {
      const fortress = player.fortress;
      if (fortress) {
        fortress.render(this.ctx, this.canvas.width, this.canvas.height);
      }
    });
  }
  
  drawPlayerGrids() {
    // Draw unit placement grids for both players
    Object.values(this.engine.players).forEach(player => {
      this.drawPlayerGrid(player);
    });
  }
  
  drawPlayerGrid(player) {
    if (!player.gridPosition) return;
    
    // Get grid position
    const gridX = player.gridPosition.x;
    const gridY = player.gridPosition.y;
    const gridWidth = player.gridPosition.width;
    const gridHeight = player.gridPosition.height;
    const cellSize = player.gridPosition.cellSize;
    
    // Draw grid background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.fillRect(gridX, gridY, gridWidth, gridHeight);
    
    // Draw grid lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i <= player.gridWidth; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(gridX + i * cellSize, gridY);
      this.ctx.lineTo(gridX + i * cellSize, gridY + gridHeight);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= player.gridHeight; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(gridX, gridY + i * cellSize);
      this.ctx.lineTo(gridX + gridWidth, gridY + i * cellSize);
      this.ctx.stroke();
    }
    
    // Draw units on the grid
    this.drawUnitsOnGrid(player);
  }
  
  drawUnitsOnGrid(player) {
    const grid = player.gridPosition;
    
    for (let row = 0; row < player.gridHeight; row++) {
      for (let col = 0; col < player.gridWidth; col++) {
        const unitType = player.getUnitAt(row, col);
        
        if (unitType) {
          const cellX = grid.x + col * grid.cellSize;
          const cellY = grid.y + row * grid.cellSize;
          const iconSize = grid.cellSize * 0.7;
          
          // Draw unit background
          this.ctx.fillStyle = player.id === 'player1' ? 
            'rgba(79, 143, 186, 0.5)' : 'rgba(218, 134, 62, 0.5)';
          this.ctx.fillRect(
            cellX, cellY, 
            grid.cellSize, grid.cellSize
          );
          
          // Draw unit icon
          this.drawUnitIcon(
            this.ctx,
            unitType,
            cellX + grid.cellSize/2,
            cellY + grid.cellSize/2,
            iconSize,
            window.unitTypes[unitType].stats.color || '#ffffff'
          );
        }
      }
    }
  }

  drawUnitIcon(ctx, unitType, x, y, size, color) {
    ctx.fillStyle = color;
    
    switch(unitType) {
      case 'guardian':
        // Shield shape
        ctx.beginPath();
        ctx.moveTo(x - size/3, y - size/3);
        ctx.lineTo(x + size/3, y - size/3);
        ctx.lineTo(x + size/3, y + size/3);
        ctx.lineTo(x, y + size/2);
        ctx.lineTo(x - size/3, y + size/3);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'stalker':
        // Triangle shape (asymmetrical for dynamic look)
        ctx.beginPath();
        ctx.moveTo(x, y - size/2);
        ctx.lineTo(x + size/3, y + size/3);
        ctx.lineTo(x - size/3, y + size/2);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'weaver':
        // Circle with orb
        ctx.beginPath();
        ctx.arc(x, y, size/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Floating orb
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y - size/4, size/8, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'leviathan':
        // Mechanical construct
        ctx.fillRect(x - size/3, y - size/3, 2*size/3, 2*size/3);
        
        // Cannon detail
        ctx.fillStyle = '#555555';
        ctx.fillRect(x - size/4, y - size/2, size/2, size/3);
        break;
        
      case 'oracle':
        // Circular icon with sacred geometry
        ctx.beginPath();
        ctx.arc(x, y, size/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Cross symbol (simplified sacred geometry)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - size/8, y - size/3, size/4, size*2/3); // Vertical
        ctx.fillRect(x - size/3, y - size/8, size*2/3, size/4); // Horizontal
        break;
        
      case 'astralNomad':
        // Spiritual entity
        ctx.beginPath();
        ctx.arc(x, y, size/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Spectral aura
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(x, y, size/2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
        
      case 'marauder':
        // Aggressive jagged shape
        ctx.beginPath();
        ctx.moveTo(x - size/3, y - size/3);
        ctx.lineTo(x, y - size/2);
        ctx.lineTo(x + size/3, y - size/3);
        ctx.lineTo(x + size/2, y);
        ctx.lineTo(x + size/3, y + size/3);
        ctx.lineTo(x, y + size/2);
        ctx.lineTo(x - size/3, y + size/3);
        ctx.lineTo(x - size/2, y);
        ctx.closePath();
        ctx.fill();
        
        // Battle mark
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x - size/6, y - size/12);
        ctx.lineTo(x + size/6, y - size/12);
        ctx.lineTo(x, y + size/12);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'trampler':
        // Beast-like entity with tusks
        ctx.beginPath();
        ctx.moveTo(x, y - size/3);
        ctx.lineTo(x + size/3, y + size/6);
        ctx.lineTo(x, y + size/3);
        ctx.lineTo(x - size/3, y + size/6);
        ctx.closePath();
        ctx.fill();
        
        // Tusks
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = size/12;
        ctx.beginPath();
        ctx.moveTo(x - size/5, y + size/6);
        ctx.lineTo(x - size/2.5, y + size/3);
        ctx.moveTo(x + size/5, y + size/6);
        ctx.lineTo(x + size/2.5, y + size/3);
        ctx.stroke();
        break;
        
      case 'juggernaut':
        // Heavy hexagonal armor
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const px = x + Math.cos(angle) * size/3;
          const py = y + Math.sin(angle) * size/3;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        
        // Central reinforcement
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, size/8, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'colossus':
        // Large stone entity
        ctx.fillRect(x - size/3, y - size/3, 2*size/3, 2*size/3);
        
        // Stone cracks/details
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - size/3, y - size/6);
        ctx.lineTo(x + size/6, y - size/6);
        ctx.moveTo(x, y);
        ctx.lineTo(x + size/3, y + size/6);
        ctx.moveTo(x - size/6, y + size/3);
        ctx.lineTo(x - size/6, y - size/12);
        ctx.stroke();
        break;
        
      case 'permafrostDrake':
        // Ice drake (diamond shape with wings)
        ctx.beginPath();
        ctx.moveTo(x, y - size/3);
        ctx.lineTo(x + size/5, y);
        ctx.lineTo(x, y + size/3);
        ctx.lineTo(x - size/5, y);
        ctx.closePath();
        ctx.fill();
        
        // Wings
        ctx.beginPath();
        ctx.moveTo(x, y - size/6);
        ctx.lineTo(x + size/2, y - size/6);
        ctx.lineTo(x + size/3, y + size/12);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x, y - size/6);
        ctx.lineTo(x - size/2, y - size/6);
        ctx.lineTo(x - size/3, y + size/12);
        ctx.closePath();
        ctx.fill();
        break;
        
      default:
        // Fallback for any unknown types
        ctx.fillRect(x - size/4, y - size/4, size/2, size/2);
    }
  }
  
  renderEntities() {
    // Render all units
    this.engine.entities.getUnits().forEach(unit => {
      // Pass the rendering context and the drawUnitIcon method as parameters
      unit.render(this.ctx, (ctx, x, y, size, color) => {
        this.drawUnitIcon(ctx, unit.type, x, y, size, color);
      });
    });
    
    // Render all projectiles
    this.engine.entities.getProjectiles().forEach(projectile => {
      projectile.render(this.ctx);
    });
  }
  
  renderEffects() {
    // Get the visual effect system
    const visualSystem = this.engine.systems.get('visual');
    if (visualSystem) {
      visualSystem.render(this.ctx);
    }
  }
  
  renderUI() {
    // Render UI through UI manager
    this.engine.uiManager.render(this.ctx);
    
    // Draw move unit indicators if in move mode
    if (this.engine.uiManager.moveUnitState && this.engine.uiManager.moveUnitState.active) {
      this.engine.uiManager.renderUnitMovementHighlight(this.ctx);
    }
  }
}