// ui/InputManager.js - Handles all user input
export class InputManager {
  constructor(engine) {
    this.engine = engine;
    this.canvas = engine.canvas;
    this.mousePosition = { x: 0, y: 0 };
    this.isDragging = false;
    this.dragStartPosition = { x: 0, y: 0 };
    this.draggedUnit = null;
    
    // Bind event handlers to maintain 'this' context
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }
  
  init() {
    // Attach event listeners
    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart);
    this.canvas.addEventListener('touchmove', this.handleTouchMove);
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
    
    // Prevent default touch actions to avoid scrolling
    this.canvas.addEventListener('touchstart', this.preventDefault);
    this.canvas.addEventListener('touchmove', this.preventDefault);
    this.canvas.addEventListener('touchend', this.preventDefault);
    
    console.log('Input manager initialized');
    return this;
  }
  
  preventDefault(e) {
    e.preventDefault();
  }
  
  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if we're in the start screen
    if (this.engine.inStartScreen) {
      // Handle start button click
      this.engine.handleStartButtonClick(x, y);
      return;
    }
    
    // Process input through UI Manager first
    if (this.engine.uiManager.handleClick(x, y)) {
      return; // Input handled by UI
    }
    
    // If game is over or in menu, don't process gameplay clicks
    if (this.engine.state.gameOver || this.engine.uiManager.isModalOpen()) {
      return;
    }
    
    // Process grid clicks for unit placement
    this.handleGridClick(x, y);
  }
  
  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePosition.x = event.clientX - rect.left;
    this.mousePosition.y = event.clientY - rect.top;
    
    // Don't handle hover effects if we're in the start screen
    if (this.engine.inStartScreen) {
      return;
    }
    
    // Update UI for hover effects
    this.engine.uiManager.handleMouseMove(this.mousePosition.x, this.mousePosition.y);
    
    // Handle dragging
    if (this.isDragging && this.draggedUnit) {
      // Update dragged unit's visual position
    }
  }
  
  handleTouchStart(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      
      this.mousePosition.x = touch.clientX - rect.left;
      this.mousePosition.y = touch.clientY - rect.top;
      
      // Store for potential drag operation
      this.dragStartPosition.x = this.mousePosition.x;
      this.dragStartPosition.y = this.mousePosition.y;
    }
  }
  
  handleTouchMove(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      
      this.mousePosition.x = touch.clientX - rect.left;
      this.mousePosition.y = touch.clientY - rect.top;
      
      // Don't handle hover effects if we're in the start screen
      if (this.engine.inStartScreen) {
        return;
      }
      
      // Update UI for touch movement
      this.engine.uiManager.handleMouseMove(this.mousePosition.x, this.mousePosition.y);
      
      // Handle dragging
      if (this.isDragging && this.draggedUnit) {
        // Update dragged unit's visual position
      }
    }
  }
  
  handleTouchEnd(event) {
    // Check if we're in the start screen
    if (this.engine.inStartScreen) {
      // Handle start button click
      this.engine.handleStartButtonClick(this.mousePosition.x, this.mousePosition.y);
      return;
    }
    
    // Use the last known position from touchmove
    if (this.engine.uiManager.handleClick(this.mousePosition.x, this.mousePosition.y)) {
      return; // Input handled by UI
    }
    
    // If game is over or in menu, don't process gameplay clicks
    if (this.engine.state.gameOver || this.engine.uiManager.isModalOpen()) {
      return;
    }
    
    // Process grid clicks for unit placement
    this.handleGridClick(this.mousePosition.x, this.mousePosition.y);
    
    // End any drag operation
    this.isDragging = false;
    this.draggedUnit = null;
  }
  
  handleGridClick(x, y) {
    // Check if click is on a player's grid
    const gridResult = this.engine.gridManager.handleGridClick(x, y, this.engine.activePlayer);
    
    if (!gridResult) return;
    
    const { row, col, player } = gridResult;
    
    // Check if we're in move unit mode
    if (this.engine.uiManager.moveUnitState && this.engine.uiManager.moveUnitState.active) {
      // We're in move unit mode, handle the destination selection
      const fromRow = this.engine.uiManager.moveUnitState.fromRow;
      const fromCol = this.engine.uiManager.moveUnitState.fromCol;
      const playerId = this.engine.uiManager.moveUnitState.playerId;
      
      // Only proceed if we're moving for the right player and the destination cell is empty
      if (playerId === player.id && !player.getUnitAt(row, col)) {
        // Move the unit
        player.moveUnit(fromRow, fromCol, row, col);
        
        // Exit move unit mode
        this.engine.uiManager.moveUnitState.active = false;
      }
      
      return; // Don't proceed to normal grid click handling
    }
    
    // Normal grid click handling (not in move unit mode)
    const unitType = player.getUnitAt(row, col);
    
    if (unitType) {
      // Clicked on a unit - show unit action menu
      this.engine.uiManager.showUnitActionMenu(player.id, row, col, unitType, x, y);
    } else {
      // Empty cell - show unit selection menu
      this.engine.uiManager.showUnitSelectionMenu(player.id, row, col, x, y);
    }
  }
  
  // Add methods for handling unit ability targeting, etc.
  startAbilityTargeting(unit, abilityName) {
    this.targetingMode = true;
    this.targetingUnit = unit;
    this.targetingAbility = abilityName;
  }
  
  cancelAbilityTargeting() {
    this.targetingMode = false;
    this.targetingUnit = null;
    this.targetingAbility = null;
  }
  
  getInputPosition() {
    return { ...this.mousePosition };
  }
}