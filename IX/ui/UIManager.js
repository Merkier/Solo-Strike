// ui/UIManager.js - Manages all UI components and interactions
export class UIManager {
  constructor(engine) {
    this.engine = engine;
    
    // UI state
    this.tooltips = [];
    this.selectedUnit = null;
    this.hoverPosition = { x: 0, y: 0 };
    this.abilityTargeting = {
      active: false,
      unit: null,
      ability: null
    };
    
    // UI components
    this.unitSelectionMenu = {
      isOpen: false,
      player: null,
      row: -1,
      col: -1,
      x: 0,
      y: 0,
      buttons: {}
    };
    
    this.unitActionMenu = {
      isOpen: false,
      player: null,
      row: -1,
      col: -1,
      x: 0,
      y: 0,
      unitType: null,
      buttons: {}
    };
    
    this.modal = {
      isOpen: false,
      type: null, // 'upgrade', 'abilities', 'gameOver', etc.
      data: null,
      buttons: {}
    };
    
    // Menu style constants
    this.menuStyle = {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      buttonSize: 45,
      spacing: 5,
      padding: 10,
      borderColor: {
        player1: '#4f8fba',
        player2: '#da863e'
      }
    };
  }
  
  init() {
    // Initialize UI state
    return this;
  }
  
  update(delta) {
    // Update tooltips
    this.updateTooltips(delta);
    
    // Update any animations
    this.updateAnimations(delta);
  }
  
  render(ctx) {
    // Render all active UI elements
    
    // Draw active tooltips
    this.renderTooltips(ctx);
    
    // Draw unit selection menu
    if (this.unitSelectionMenu.isOpen) {
      this.renderUnitSelectionMenu(ctx);
    }
    
    // Draw unit action menu
    if (this.unitActionMenu.isOpen) {
      this.renderUnitActionMenu(ctx);
    }
    
    // Draw modal dialog
    if (this.modal.isOpen) {
      this.renderModal(ctx);
    }
    
    // Draw ability targeting UI if active
    if (this.abilityTargeting.active) {
      this.renderAbilityTargeting(ctx);
    }
    
    // Draw selected unit UI
    if (this.selectedUnit) {
      this.renderSelectedUnitUI(ctx);
    }
    
    // Draw game info (gold, timer, etc.)
    this.renderGameInfo(ctx);
  }
  
  // UI interaction handlers
  handleClick(x, y) {
    // Check modals first (highest priority)
    if (this.modal.isOpen) {
      return this.handleModalClick(x, y);
    }
    
    // Check unit action menu
    if (this.unitActionMenu.isOpen) {
      return this.handleUnitActionMenuClick(x, y);
    }
    
    // Check unit selection menu
    if (this.unitSelectionMenu.isOpen) {
      return this.handleUnitSelectionMenuClick(x, y);
    }
    
    // Check ability targeting
    if (this.abilityTargeting.active) {
      return this.handleAbilityTargetingClick(x, y);
    }
    
    // Check upgrade buttons, etc.
    if (this.handleUpgradeButtonClick(x, y)) {
      return true;
    }
    
    // Check unit selection
    const unit = this.findUnitAtPosition(x, y);
    if (unit) {
      this.selectUnit(unit);
      return true;
    }
    
    // No UI element clicked
    return false;
  }
  
  handleMouseMove(x, y) {
    // Update hover position
    this.hoverPosition.x = x;
    this.hoverPosition.y = y;
    
    // Check for tooltips
    this.checkTooltips(x, y);
  }
  
  // Helper to check if any modal is open
  isModalOpen() {
    return this.modal.isOpen || this.unitSelectionMenu.isOpen || this.unitActionMenu.isOpen;
  }
  
  // Unit selection menu
  showUnitSelectionMenu(playerId, row, col, x, y) {
    // Only allow active player to place units
    if (playerId !== this.engine.activePlayer) return;
    
    // Setup menu
    this.unitSelectionMenu.isOpen = true;
    this.unitSelectionMenu.player = playerId;
    this.unitSelectionMenu.row = row;
    this.unitSelectionMenu.col = col;
    
    // Position menu - adjust if too close to edge
    this.unitSelectionMenu.x = x;
    this.unitSelectionMenu.y = y;
    
    // Generate buttons for available units
    this.generateUnitSelectionButtons(playerId);
  }
  
  generateUnitSelectionButtons(playerId) {
    const player = this.engine.players[playerId];
    this.unitSelectionMenu.buttons = {};
    
    // Get available unit types based on fortress level
    const availableUnits = [];
    for (const unitType in window.unitTypes) {
      const unitData = window.unitTypes[unitType];
      if (player.fortressLevel >= unitData.requiredFortressLevel) {
        availableUnits.push(unitType);
      }
    }
    
    // Create buttons (layout will be handled in render)
    availableUnits.forEach((unitType) => {
      this.unitSelectionMenu.buttons[unitType] = {
        unitType,
        canAfford: player.gold >= window.unitTypes[unitType].cost
      };
    });
  }
  
  renderUnitSelectionMenu(ctx) {
    const menu = this.unitSelectionMenu;
    const player = this.engine.players[menu.player];
    const buttons = Object.values(menu.buttons);
    
    // Calculate menu dimensions
    const columns = Math.min(3, buttons.length);
    const rows = Math.ceil(buttons.length / columns);
    const menuWidth = (columns * this.menuStyle.buttonSize) + 
                    ((columns - 1) * this.menuStyle.spacing) + 
                    (this.menuStyle.padding * 2);
    const menuHeight = (rows * this.menuStyle.buttonSize) + 
                     ((rows - 1) * this.menuStyle.spacing) + 
                     (this.menuStyle.padding * 2);
    
    // Adjust menu position to fit on screen
    let menuX = menu.x;
    let menuY = menu.y;
    
    if (menuX + menuWidth > this.engine.canvas.width) {
      menuX = this.engine.canvas.width - menuWidth;
    }
    
    if (menuY + menuHeight > this.engine.canvas.height) {
      menuY = this.engine.canvas.height - menuHeight;
    }
    
    // Draw menu background
    ctx.fillStyle = this.menuStyle.backgroundColor;
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    
    // Draw menu border
    ctx.strokeStyle = this.menuStyle.borderColor[player.id];
    ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
    
    // Draw buttons
    buttons.forEach((button, index) => {
      const unitData = window.unitTypes[button.unitType];
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      const buttonX = menuX + this.menuStyle.padding + (col * (this.menuStyle.buttonSize + this.menuStyle.spacing));
      const buttonY = menuY + this.menuStyle.padding + (row * (this.menuStyle.buttonSize + this.menuStyle.spacing));
      
      // Store button position for click detection
      button.x = buttonX;
      button.y = buttonY;
      button.width = this.menuStyle.buttonSize;
      button.height = this.menuStyle.buttonSize;
      
      // Draw button background
      ctx.fillStyle = button.canAfford ? '#333333' : '#555555';
      ctx.fillRect(buttonX, buttonY, this.menuStyle.buttonSize, this.menuStyle.buttonSize);
      
      // Draw unit icon
      this.drawUnitIcon(ctx, button.unitType, 
        buttonX + this.menuStyle.buttonSize/2, 
        buttonY + this.menuStyle.buttonSize/2 - 5, 
        this.menuStyle.buttonSize * 0.6, 
        button.canAfford ? (unitData.stats.color || '#ffffff') : '#aaaaaa'
      );
      
      // Draw unit cost
      ctx.fillStyle = button.canAfford ? '#ffffff' : '#aaaaaa';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${unitData.cost}g`,
        buttonX + this.menuStyle.buttonSize / 2,
        buttonY + this.menuStyle.buttonSize - 5
      );
    });
  }
  
  handleUnitSelectionMenuClick(x, y) {
    const menu = this.unitSelectionMenu;
    
    // Check if clicked outside menu (close it)
    let clickedOnButton = false;
    
    // Check each button
    for (const unitType in menu.buttons) {
      const button = menu.buttons[unitType];
      
      if (this.isPointInRect(x, y, button.x, button.y, button.width, button.height)) {
        clickedOnButton = true;
        
        // Handle unit selection if affordable
        if (button.canAfford) {
          const player = this.engine.players[menu.player];
          
          // Purchase the unit
          player.purchaseUnit(unitType, menu.row, menu.col);
          
          // Close the menu
          menu.isOpen = false;
        }
        
        break;
      }
    }
    
    // If clicked outside, close menu
    if (!clickedOnButton) {
      menu.isOpen = false;
    }
    
    return true; // Handled
  }
  
  // Unit action menu
  showUnitActionMenu(playerId, row, col, unitType, x, y) {
    // Only allow active player to place units
    if (playerId !== this.engine.activePlayer) return;
    
    // Setup menu
    this.unitActionMenu.isOpen = true;
    this.unitActionMenu.player = playerId;
    this.unitActionMenu.row = row;
    this.unitActionMenu.col = col;
    this.unitActionMenu.unitType = unitType;
    
    // Position menu - adjust if too close to edge
    this.unitActionMenu.x = x;
    this.unitActionMenu.y = y;
    
    // Generate buttons
    this.generateUnitActionButtons();
  }
  
  generateUnitActionButtons() {
    this.unitActionMenu.buttons = {
      sell: { action: 'sell' },
      move: { action: 'move' }
    };
    
    // If unit has abilities, add ability button
    const unitType = this.unitActionMenu.unitType;
    const unitData = window.unitTypes[unitType];
    
    if (unitData.stats.abilities && unitData.stats.abilities.length > 0) {
      this.unitActionMenu.buttons.abilities = { action: 'abilities' };
    }
  }
  
  renderUnitActionMenu(ctx) {
    const menu = this.unitActionMenu;
    const player = this.engine.players[menu.player];
    const buttons = Object.values(menu.buttons);
    
    // Calculate menu dimensions
    const columns = Math.min(3, buttons.length);
    const rows = Math.ceil(buttons.length / columns);
    const menuWidth = (columns * this.menuStyle.buttonSize) + 
                    ((columns - 1) * this.menuStyle.spacing) + 
                    (this.menuStyle.padding * 2);
    const menuHeight = (rows * this.menuStyle.buttonSize) + 
                     ((rows - 1) * this.menuStyle.spacing) + 
                     (this.menuStyle.padding * 2) + 30; // Extra for title
    
    // Adjust menu position to fit on screen
    let menuX = menu.x;
    let menuY = menu.y;
    
    if (menuX + menuWidth > this.engine.canvas.width) {
      menuX = this.engine.canvas.width - menuWidth;
    }
    
    if (menuY + menuHeight > this.engine.canvas.height) {
      menuY = this.engine.canvas.height - menuHeight;
    }
    
    // Draw menu background
    ctx.fillStyle = this.menuStyle.backgroundColor;
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    
    // Draw menu border
    ctx.strokeStyle = this.menuStyle.borderColor[player.id];
    ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
    
    // Draw unit name as title
    const unitData = window.unitTypes[menu.unitType];
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(unitData.name, menuX + menuWidth/2, menuY + 20);
    
    // Draw buttons
    buttons.forEach((button, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      
      const buttonX = menuX + this.menuStyle.padding + (col * (this.menuStyle.buttonSize + this.menuStyle.spacing));
      const buttonY = menuY + this.menuStyle.padding + 30 + (row * (this.menuStyle.buttonSize + this.menuStyle.spacing));
      
      // Store button position for click detection
      button.x = buttonX;
      button.y = buttonY;
      button.width = this.menuStyle.buttonSize;
      button.height = this.menuStyle.buttonSize;
      
      // Draw button background
      ctx.fillStyle = '#333333';
      ctx.fillRect(buttonX, buttonY, this.menuStyle.buttonSize, this.menuStyle.buttonSize);
      
      // Draw different icons based on action
      switch (button.action) {
        case 'sell':
          // Draw sell icon (dollar sign)
          ctx.fillStyle = '#e74c3c'; // Red for sell
          ctx.font = 'bold 18px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('$', buttonX + this.menuStyle.buttonSize/2, buttonY + this.menuStyle.buttonSize/2);
          
          // Calculate and show refund amount
          const unitData = window.unitTypes[menu.unitType];
          const refund = Math.floor(unitData.cost * 0.75);
          
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            `${refund}g`,
            buttonX + this.menuStyle.buttonSize / 2,
            buttonY + this.menuStyle.buttonSize - 5
          );
          break;
          
        case 'move':
          // Draw move icon (arrow)
          ctx.fillStyle = '#3498db'; // Blue for move
          
          // Draw arrow
          const arrowSize = this.menuStyle.buttonSize * 0.4;
          const centerX = buttonX + this.menuStyle.buttonSize / 2;
          const centerY = buttonY + this.menuStyle.buttonSize / 2 - 5;
          
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - arrowSize/2);
          ctx.lineTo(centerX + arrowSize/2, centerY + arrowSize/2);
          ctx.lineTo(centerX - arrowSize/2, centerY + arrowSize/2);
          ctx.closePath();
          ctx.fill();
          
          // Text
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            'Move',
            buttonX + this.menuStyle.buttonSize / 2,
            buttonY + this.menuStyle.buttonSize - 5
          );
          break;
          
        case 'abilities':
          // Draw abilities icon (sparkle or star)
          ctx.fillStyle = '#f1c40f'; // Yellow for abilities
          
          // Draw star
          const starSize = this.menuStyle.buttonSize * 0.4;
          this.drawStar(ctx, 
            buttonX + this.menuStyle.buttonSize / 2, 
            buttonY + this.menuStyle.buttonSize / 2 - 5,
            5, starSize, starSize/2);
          
          // Text
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            'Ability',
            buttonX + this.menuStyle.buttonSize / 2,
            buttonY + this.menuStyle.buttonSize - 5
          );
          break;
      }
    });
  }
  
  handleUnitActionMenuClick(x, y) {
    const menu = this.unitActionMenu;
    
    // Check if clicked outside menu (close it)
    let clickedOnButton = false;
    
    // Check each button
    for (const key in menu.buttons) {
      const button = menu.buttons[key];
      
      if (this.isPointInRect(x, y, button.x, button.y, button.width, button.height)) {
        clickedOnButton = true;
        
        // Handle the action
        const player = this.engine.players[menu.player];
        
        switch (button.action) {
          case 'sell':
            // Sell the unit
            player.sellUnit(menu.row, menu.col);
            menu.isOpen = false;
            break;
            
          case 'move':
            // Start move unit mode
            this.startMoveUnit(player, menu.row, menu.col);
            menu.isOpen = false;
            break;
            
          case 'abilities':
            // Show abilities modal
            this.showAbilitiesModal(player.id, menu.unitType);
            menu.isOpen = false;
            break;
        }
        
        break;
      }
    }
    
    // If clicked outside, close menu
    if (!clickedOnButton) {
      menu.isOpen = false;
    }
    
    return true; // Handled
  }
  
  // Modal dialogs
  showModal(type, data = {}) {
    this.modal.isOpen = true;
    this.modal.type = type;
    this.modal.data = data;
    this.modal.buttons = {};
    this.modal.scrollOffset = 0; // Reset scroll position
    
    // Generate buttons based on modal type
    switch (type) {
      case 'upgrade':
        this.generateUpgradeButtons(data.playerId);
        break;
        
      case 'abilities':
        this.generateAbilityButtons(data.playerId, data.unitType);
        break;
        
      case 'gameOver':
        this.modal.buttons.restart = {
          text: 'Restart Game',
          action: 'restart'
        };
        break;
    }
  }
  
  showUpgradeModal(playerId) {
    this.showModal('upgrade', { playerId });
  }
  
  showAbilitiesModal(playerId, unitType) {
    this.showModal('abilities', { playerId, unitType });
  }
  
  showGameOver(winner) {
    this.showModal('gameOver', { winner });
  }
  
  // Render modal based on type
  renderModal(ctx) {
    switch (this.modal.type) {
      case 'upgrade':
        this.renderUpgradeModal(ctx);
        break;
        
      case 'abilities':
        this.renderAbilitiesModal(ctx);
        break;
        
      case 'gameOver':
        this.renderGameOverModal(ctx);
        break;
    }
  }
  
  // Upgrade modal - now only shows unit upgrades
  generateUpgradeButtons(playerId) {
    const player = this.engine.players[playerId];
    
    // Gold income button
    this.modal.buttons.goldUpgrade = {
      text: '💰 Upgrade Income',
      cost: 150 + (player.goldIncomeLevel * 50),
      disabled: player.goldIncomeLevel >= 4 || 
                this.engine.playerManager.goldUpgradeCooldowns[playerId] > 0 ||
                player.gold < (150 + (player.goldIncomeLevel * 50))
    };
    
    // Fortress upgrade button
    this.modal.buttons.fortressUpgrade = {
      text: '🏰 Upgrade Fortress',
      cost: 250 + ((player.fortressLevel - 1) * 50),
      disabled: player.fortressLevel >= 3 || 
                player.gold < (250 + ((player.fortressLevel - 1) * 50))
    };
  }
  
  renderUpgradeModal(ctx) {
    const playerId = this.modal.data.playerId;
    const player = this.engine.players[playerId];
    
    // Modal dimensions - adjust width for smaller screens
    const modalWidth = Math.min(320, this.engine.canvas.width - 20);
    const buttonHeight = 50;
    const buttonSpacing = 10;
    const headerHeight = 60; // Height of title area
    
    // Get all non-close buttons
    const actionButtons = Object.entries(this.modal.buttons)
      .filter(([key]) => key !== 'close');
    
    // Calculate content height based on button count
    const contentHeight = actionButtons.length * (buttonHeight + buttonSpacing);
    
    // Max height to ensure modal fits on screen (80% of canvas height)
    const maxModalHeight = Math.floor(this.engine.canvas.height * 0.8);
    
    // Determine actual modal height (with constraint)
    let modalHeight = headerHeight + contentHeight;
    
    // If there are too many buttons, limit the height and remember we need scrolling
    const needsScrolling = modalHeight > maxModalHeight;
    if (needsScrolling) {
      modalHeight = maxModalHeight;
      
      // Initialize scroll position if not set
      if (this.modal.scrollOffset === undefined) {
        this.modal.scrollOffset = 0;
      }
    }
    
    // Center on screen with constraints to keep it fully visible
    const modalX = Math.max(10, Math.floor((this.engine.canvas.width - modalWidth) / 2));
    const modalY = Math.max(10, Math.floor((this.engine.canvas.height - modalHeight) / 2));
    
    // Draw semi-transparent background overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
    
    // Draw modal background
    ctx.fillStyle = '#222';
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
    
    // Modal border
    ctx.strokeStyle = this.menuStyle.borderColor[playerId];
    ctx.lineWidth = 3;
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);
    
    // Title
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${playerId === 'player1' ? 'Player 1' : 'Player 2'} Upgrades`, 
      modalX + modalWidth / 2, modalY + 30);
    
    // Close button - always visible at the top right
    const closeBtnSize = 30;
    const closeBtnX = modalX + modalWidth - closeBtnSize - 5;
    const closeBtnY = modalY + 5;
    
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(closeBtnX, closeBtnY, closeBtnSize, closeBtnSize);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✕', closeBtnX + closeBtnSize / 2, closeBtnY + closeBtnSize / 2 + 6);
    
    // Store close button position
    this.modal.buttons.close = {
      x: closeBtnX,
      y: closeBtnY,
      width: closeBtnSize,
      height: closeBtnSize,
      action: 'close'
    };
    
    // Set up clipping region for buttons if scrolling is needed
    if (needsScrolling) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(modalX, modalY + headerHeight, modalWidth, modalHeight - headerHeight);
      ctx.clip();
    }
    
    // Draw buttons
    let buttonY = modalY + headerHeight;
    if (needsScrolling) {
      buttonY -= this.modal.scrollOffset;
    }
    
    actionButtons.forEach(([key, button]) => {
      // Store button position for click detection
      button.x = modalX + 10;
      button.y = buttonY;
      button.width = modalWidth - 20;
      button.height = buttonHeight;
      
      // Only draw buttons that are visible
      if (buttonY + buttonHeight >= modalY + headerHeight && 
          buttonY < modalY + modalHeight) {
        // Draw button
        ctx.fillStyle = button.disabled ? '#555' : key.startsWith('upgrade_') ? '#2980b9' : '#27ae60';
        ctx.fillRect(button.x, button.y, button.width, button.height);
        
        // Button text
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(button.text, button.x + 10, button.y + buttonHeight/2 + 5);
        
        // Cost on right side
        if (button.cost) {
          ctx.textAlign = 'right';
          ctx.fillText(`${button.cost}g`, button.x + button.width - 10, button.y + buttonHeight/2 + 5);
        }
      }
      
      buttonY += buttonHeight + buttonSpacing;
    });
    
    // Restore context if we clipped
    if (needsScrolling) {
      ctx.restore();
      
      // Draw scroll indicators
      if (this.modal.scrollOffset > 0) {
        // Up arrow (can scroll up)
        this.drawScrollArrow(ctx, modalX + modalWidth / 2, modalY + headerHeight + 10, 'up');
      }
      
      const maxScroll = contentHeight - (modalHeight - headerHeight) + 10;
      if (this.modal.scrollOffset < maxScroll) {
        // Down arrow (can scroll down)
        this.drawScrollArrow(ctx, modalX + modalWidth / 2, modalY + modalHeight - 10, 'down');
      }
      
      // Store some key values for click handling
      this.modal.visibleArea = {
        x: modalX,
        y: modalY + headerHeight,
        width: modalWidth,
        height: modalHeight - headerHeight,
        contentHeight: contentHeight,
        maxScroll: maxScroll
      };
    }
  }
  
  // Helper method to draw scroll arrows
/*   drawScrollArrow(ctx, x, y, direction) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    
    if (direction === 'up') {
      ctx.moveTo(x, y - 5);
      ctx.lineTo(x - 8, y + 5);
      ctx.lineTo(x + 8, y + 5);
    } else { // down
      ctx.moveTo(x, y + 5);
      ctx.lineTo(x - 8, y - 5);
      ctx.lineTo(x + 8, y - 5);
    }
    
    ctx.closePath();
    ctx.fill();
  }
   */
 
 
  // Generate buttons for abilities modal
  generateAbilityButtons(playerId, unitType) {
    const unitData = window.unitTypes[unitType];
    
    if (!unitData.stats.abilities || unitData.stats.abilities.length === 0) {
      return;
    }
    
    // Get player for checking upgrades
    const player = this.engine.players[playerId];
    
    // Generate buttons for each ability
    unitData.stats.abilities.forEach(ability => {
      // Check if ability is enabled or needs upgrade
      const isEnabled = ability.enabled !== false;
      const needsUpgrade = !isEnabled && ability.requiredUpgrade;
      
      this.modal.buttons[`ability_${ability.name}`] = {
        text: ability.name,
        description: ability.description,
        autocast: isEnabled ? this.engine.playerManager.getAutoCastSettings(unitType, playerId)[ability.name] !== false : false,
        isPassive: ability.passive,
        ability: ability,
        isEnabled: isEnabled,
        needsUpgrade: needsUpgrade,
        upgradeId: needsUpgrade ? ability.requiredUpgrade : null
      };
    });
  }
  
  // Render abilities modal with upgrade buttons
  renderAbilitiesModal(ctx) {
    const playerId = this.modal.data.playerId;
    const unitType = this.modal.data.unitType;
    const unitData = window.unitTypes[unitType];
    const player = this.engine.players[playerId]; // Get player for checking gold
    
    // Modal dimensions
    const modalWidth = 320;
    const headerHeight = 60;
    const abilityHeight = 80;
    const abilitySpacing = 10;
    const abilityCount = Object.keys(this.modal.buttons).filter(k => k.startsWith('ability_')).length;
    
    // Calculate height
    const modalHeight = headerHeight + (abilityHeight + abilitySpacing) * abilityCount + 20;
    
    // Center on screen
    const modalX = (this.engine.canvas.width - modalWidth) / 2;
    const modalY = (this.engine.canvas.height - modalHeight) / 2;
    
    // Draw semi-transparent background overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
    
    // Draw modal background
    ctx.fillStyle = '#222';
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
    
    // Modal border
    ctx.strokeStyle = this.menuStyle.borderColor[playerId];
    ctx.lineWidth = 3;
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);
    
    // Title with unit name
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${unitData.name} Abilities`, modalX + modalWidth / 2, modalY + 30);
    
    // Draw abilities
    let abilityY = modalY + headerHeight;
    
    Object.entries(this.modal.buttons).forEach(([key, button]) => {
      if (!key.startsWith('ability_')) return;
      
      // Store button position for click detection
      button.x = modalX + 10;
      button.y = abilityY;
      button.width = modalWidth - 20;
      button.height = abilityHeight;
      
      // Draw ability panel with different style based on enabled state
      const bgColor = button.isEnabled ? '#333' : '#555'; // Lighter for disabled abilities
      ctx.fillStyle = bgColor;
      ctx.fillRect(button.x, button.y, button.width, button.height);
      
      // Ability name
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(button.text, button.x + 10, button.y + 20);
      
      // Ability description - wrapped in multiple lines
      ctx.font = '12px Arial';
      this.wrapText(ctx, button.description || "No description available.", 
                  button.x + 10, button.y + 40, button.width - 20, 16);
      
      // For enabled abilities: show toggle if not passive
      if (button.isEnabled && !button.isPassive) {
        const toggleX = button.x + button.width - 50; // Make clickable area wider
        const toggleY = button.y + 15; // Position slightly higher
        const toggleWidth = 35; // Wider toggle
        const toggleHeight = 20; // Taller toggle
        
        // Store toggle position
        button.toggleX = toggleX;
        button.toggleY = toggleY;
        button.toggleWidth = toggleWidth;
        button.toggleHeight = toggleHeight;
        
        // Draw toggle background
        ctx.fillStyle = button.autocast ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(toggleX, toggleY, toggleWidth, toggleHeight);
        
        // Draw toggle slider
        ctx.fillStyle = '#fff';
        ctx.fillRect(
          button.autocast ? toggleX + toggleWidth - 15 : toggleX + 4, 
          toggleY + 4, 
          toggleHeight - 8, 
          toggleHeight - 8
        );
        
        // Draw "Auto" text
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Auto', toggleX - 5, toggleY + 14);
      }
      
      // For disabled abilities that need upgrades: show upgrade button
      if (button.needsUpgrade) {
        const upgrade = window.unitUpgrades[button.upgradeId];
        if (upgrade) {
          const canAfford = player.gold >= upgrade.cost;
          
          // Draw upgrade button - make it bigger and easier to click
          const upgradeX = button.x + button.width - 85;
          const upgradeY = button.y + 15;
          const upgradeWidth = 75;
          const upgradeHeight = 30;
          
          // Store upgrade button position
          button.upgradeX = upgradeX;
          button.upgradeY = upgradeY;
          button.upgradeWidth = upgradeWidth;
          button.upgradeHeight = upgradeHeight;
          
          // Draw button
          ctx.fillStyle = canAfford ? '#27ae60' : '#7f8c8d'; // Green if can afford, gray if not
          ctx.fillRect(upgradeX, upgradeY, upgradeWidth, upgradeHeight);
          
          // Draw button text
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            `(${upgrade.cost}g)`,
            upgradeX + upgradeWidth / 2,
            upgradeY + upgradeHeight / 2 + 4
          );
          
          // Draw upgrade name
          ctx.fillStyle = '#aaaaaa';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            `Requires: ${upgrade.name}`,
            upgradeX + upgradeWidth / 2,
            upgradeY + upgradeHeight + 15
          );
        }
      }
      
      abilityY += abilityHeight + abilitySpacing;
    });
    
    // Close button
    const closeBtnSize = 30;
    const closeBtnX = modalX + modalWidth - closeBtnSize - 5;
    const closeBtnY = modalY + 5;
    
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(closeBtnX, closeBtnY, closeBtnSize, closeBtnSize);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✕', closeBtnX + closeBtnSize / 2, closeBtnY + closeBtnSize / 2 + 6);
    
    // Store close button position
    this.modal.buttons.close = {
      x: closeBtnX,
      y: closeBtnY,
      width: closeBtnSize,
      height: closeBtnSize,
      action: 'close'
    };
  }
  
  renderGameOverModal(ctx) {
    const winner = this.modal.data.winner;
    
    // Modal dimensions
    const modalWidth = 300;
    const modalHeight = 200;
    
    // Center on screen
    const modalX = (this.engine.canvas.width - modalWidth) / 2;
    const modalY = (this.engine.canvas.height - modalHeight) / 2;
    
    // Draw semi-transparent background overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
    
    // Draw modal background
    ctx.fillStyle = '#222';
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
    
    // Modal border
    ctx.strokeStyle = this.menuStyle.borderColor[winner];
    ctx.lineWidth = 3;
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);
    
    // Draw "Game Over" text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', modalX + modalWidth / 2, modalY + 60);
    
    // Draw winner text
    ctx.font = '18px Arial';
    ctx.fillText(
      `${winner === 'player1' ? 'Player 1' : 'Player 2'} Wins!`,
      modalX + modalWidth / 2,
      modalY + 100
    );
    
    // Draw restart button
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonX = modalX + (modalWidth - buttonWidth) / 2;
    const buttonY = modalY + 130;
    
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Restart Game',
      buttonX + buttonWidth / 2,
      buttonY + buttonHeight / 2 + 5
    );
    
    // Store button position
    this.modal.buttons.restart = {
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      action: 'restart'
    };
  }
  
  // Handle modal clicks including ability upgrades and toggles
  handleModalClick(x, y) {
    // Check close button first
    if (this.modal.buttons.close && 
        this.isPointInRect(x, y, this.modal.buttons.close.x, this.modal.buttons.close.y, 
                       this.modal.buttons.close.width, this.modal.buttons.close.height)) {
      this.modal.isOpen = false;
      return true;
    }
    
    // Check for scroll indicator clicks
    if (this.modal.visibleArea) {
      const area = this.modal.visibleArea;
      
      // Check top scroll area (up arrow)
      if (this.isPointInRect(x, y, area.x, area.y, area.width, 20) && this.modal.scrollOffset > 0) {
        // Scroll up by one button height
        this.modal.scrollOffset = Math.max(0, this.modal.scrollOffset - 60);
        return true;
      }
      
      // Check bottom scroll area (down arrow)
      if (this.isPointInRect(x, y, area.x, area.y + area.height - 20, area.width, 20) && 
          this.modal.scrollOffset < area.maxScroll) {
        // Scroll down by one button height
        this.modal.scrollOffset = Math.min(area.maxScroll, this.modal.scrollOffset + 60);
        return true;
      }
    }
    
    // Check other buttons based on modal type
    for (const key in this.modal.buttons) {
      const button = this.modal.buttons[key];
      
      // Skip if no position data or close button (already checked)
      if (!button.x || key === 'close') continue;
      
      // Check if any toggle areas clicked for ability modal
      if (this.modal.type === 'abilities' && key.startsWith('ability_')) {
        // Check toggle button for enabled non-passive abilities
        if (button.isEnabled && !button.isPassive && button.toggleX) {
          if (this.isPointInRect(x, y, button.toggleX, button.toggleY, 
                             button.toggleWidth, button.toggleHeight)) {
            // Toggle auto-cast for this ability
            const playerId = this.modal.data.playerId;
            const unitType = this.modal.data.unitType;
            const abilityName = button.text;
            
            const newValue = this.engine.playerManager.toggleAutoCast(
              unitType, abilityName, playerId
            );
            
            // Update button state
            button.autocast = newValue;
            return true;
          }
        }
        
        // Check upgrade button for abilities that need upgrades
        if (button.needsUpgrade && button.upgradeX) {
          if (this.isPointInRect(x, y, button.upgradeX, button.upgradeY, 
                            button.upgradeWidth, button.upgradeHeight)) {
            // Purchase the upgrade
            const playerId = this.modal.data.playerId;
            const upgradeId = button.upgradeId;
            
            if (upgradeId) {
              const upgradeSystem = this.engine.systems.get('upgrade');
              const success = upgradeSystem.purchaseUpgrade(playerId, upgradeId);
              
              if (success) {
                // Update the ability's status in the original source data
                const unitData = window.unitTypes[this.modal.data.unitType];
                if (unitData && unitData.stats && unitData.stats.abilities) {
                  const ability = unitData.stats.abilities.find(a => a.name === button.text);
                  if (ability) {
                    ability.enabled = true;
                  }
                }
                
                // Re-generate ability buttons to reflect new state
                this.generateAbilityButtons(playerId, this.modal.data.unitType);
              }
            }
            
            return true;
          }
        }
      }
      
      // Handle main button area
      if (this.isPointInRect(x, y, button.x, button.y, button.width, button.height)) {
        // Don't process if button is disabled
        if (button.disabled) return true;
        
        // Handle button based on type
        if (key === 'goldUpgrade') {
          const player = this.engine.players[this.modal.data.playerId];
          player.upgradeGoldIncome();
        } else if (key === 'fortressUpgrade') {
          const player = this.engine.players[this.modal.data.playerId];
          player.upgradeFortress();
        } else if (key.startsWith('upgrade_')) {
          const upgradeId = button.id;
          const playerId = this.modal.data.playerId;
          const upgradeSystem = this.engine.systems.get('upgrade');
          upgradeSystem.purchaseUpgrade(playerId, upgradeId);
        } else if (key === 'restart') {
          this.engine.restart();
        }
        
        // Regenerate buttons to update enabled state
        if (this.modal.type === 'upgrade') {
          this.generateUpgradeButtons(this.modal.data.playerId);
        } else if (key === 'restart') {
          this.modal.isOpen = false;
        }
        
        return true;
      }
    }
    
    return true; // Modal click always handled
  }
  
  // Ability targeting mode
  startAbilityTargeting(unit, abilityName) {
    this.abilityTargeting.active = true;
    this.abilityTargeting.unit = unit;
    this.abilityTargeting.ability = abilityName;
  }
  
  renderAbilityTargeting(ctx) {
    const x = this.hoverPosition.x;
    const y = this.hoverPosition.y;
    
    // Draw targeting indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw targeting circles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw line from caster to target
    if (this.abilityTargeting.unit) {
      const unit = this.abilityTargeting.unit;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(unit.x, unit.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    // Draw targeting instruction
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Click to cast ${this.abilityTargeting.ability}`,
      this.engine.canvas.width / 2,
      30
    );
  }
  
  handleAbilityTargetingClick(x, y) {
    if (!this.abilityTargeting.active || !this.abilityTargeting.unit) {
      return false;
    }
    
    const unit = this.abilityTargeting.unit;
    const ability = this.abilityTargeting.ability;
    
    // Find if we clicked on a unit
    const targetUnit = this.findUnitAtPosition(x, y);
    
    // Use the ability
    const success = unit.useAbility(ability, x, y, targetUnit);
    
    // End targeting mode
    this.abilityTargeting.active = false;
    this.abilityTargeting.unit = null;
    this.abilityTargeting.ability = null;
    
    return true;
  }
  
  // Unit movement
  startMoveUnit(player, fromRow, fromCol) {
    this.moveUnitState = {
      active: true,
      playerId: player.id,
      fromRow,
      fromCol,
      unitType: player.getUnitAt(fromRow, fromCol)
    };
  }
  
  renderUnitMovementHighlight(ctx) {
    if (!this.moveUnitState || !this.moveUnitState.active) return;
    
    const player = this.engine.players[this.moveUnitState.playerId];
    const gridPos = player.gridPosition;
    
    // Highlight source cell
    const sourceRow = this.moveUnitState.fromRow;
    const sourceCol = this.moveUnitState.fromCol;
    
    const cellX = gridPos.x + sourceCol * gridPos.cellSize;
    const cellY = gridPos.y + sourceRow * gridPos.cellSize;
    
    // Draw highlight
    ctx.strokeStyle = '#2ecc71'; // Green
    ctx.lineWidth = 3;
    ctx.strokeRect(
      cellX, cellY,
      gridPos.cellSize, gridPos.cellSize
    );
    
    // Highlight empty cells as potential destinations
    for (let row = 0; row < player.gridHeight; row++) {
      for (let col = 0; col < player.gridWidth; col++) {
        // Only highlight empty cells
        if (!player.getUnitAt(row, col)) {
          const emptyCellX = gridPos.x + col * gridPos.cellSize;
          const emptyCellY = gridPos.y + row * gridPos.cellSize;
          
          // Draw dashed highlight
          ctx.strokeStyle = '#3498db'; // Blue
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(
            emptyCellX, emptyCellY,
            gridPos.cellSize, gridPos.cellSize
          );
          ctx.setLineDash([]);
        }
      }
    }
  }
  
  // Game info rendering
  renderGameInfo(ctx) {
    // Draw player gold, fortress level, etc.
    this.drawPlayerInfo(ctx, 'player1');
    
    // Draw time to next wave
    this.drawWaveTimer(ctx);
  }
  
  drawPlayerInfo(ctx, playerId) {
    const player = this.engine.players[playerId];

    // Position based on player
    const x = 5;
    const y = playerId === 'player1' ? this.engine.canvas.height - 160 : 10;
    
    // Draw info background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x, y, 110, 70);
    
    // Draw player indicator
    ctx.fillStyle = this.menuStyle.borderColor[playerId];
    ctx.fillRect(x, y, 5, 70);
    
    // Draw player info
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    
    // Gold
    ctx.fillText(`Gold: ${Math.floor(player.gold)}`, x + 10, y + 20);
    // gold income level
    ctx.fillText(
      `Income: ${player.goldIncomeLevel + 1}/5`,
      x + 10, y + 40
    );
    // Fortress level 
    ctx.fillText(
      `Fortress: ${player.fortressLevel}/3`,
      x + 10, y + 60
    );
    
    // Draw upgrade button
    const buttonSize = 30;
    const buttonX = x + this.engine.canvas.width - buttonSize * 2;
    const buttonY = y + 10;
    
    ctx.fillStyle = this.menuStyle.borderColor[playerId];
    ctx.fillRect(buttonX, buttonY, buttonSize, buttonSize);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('↑', buttonX + buttonSize/2, buttonY + buttonSize/2 + 7);
    
    // Store button position
    if (!this.upgradeButtons) {
      this.upgradeButtons = {};
    }
    
    this.upgradeButtons[playerId] = {
      x: buttonX,
      y: buttonY,
      width: buttonSize,
      height: buttonSize,
      action: 'upgrade'
    };
  }
  
  drawWaveTimer(ctx) {
    // Calculate time to next wave
    const timeRemaining = Math.ceil(this.engine.state.timeToNextWave);
    const controllingPlayer = this.engine.state.midFieldControl;
    // Position at the top center
    const x = 50;
    const y = this.engine.canvas.height / 2 - 8;

    let color = 'rgba(255, 255, 255, 0.3)';
    if (controllingPlayer == 'player1'){
        color = '#4f8fba';
    } else if (controllingPlayer == 'player2'){
        color = '#da863e';
    }
 
    // Draw timer
    ctx.fillStyle = color;
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Wave in: ${timeRemaining}s`, x, y);
  }
  
  // Handle upgrade button click
  handleUpgradeButtonClick(x, y) {
    if (!this.upgradeButtons) return false;
    
    // Check each upgrade button
    for (const playerId in this.upgradeButtons) {
      const button = this.upgradeButtons[playerId];
      
      if (this.isPointInRect(x, y, button.x, button.y, button.width, button.height)) {
        // Only allow active player to upgrade
        if (playerId === this.engine.activePlayer) {
          this.showUpgradeModal(playerId);
          return true;
        }
      }
    }
    
    return false;
  }
  
  // Find unit at a specific position
  findUnitAtPosition(x, y) {
    const units = this.engine.entities.getUnits();
    const clickRadius = 20; // Radius to consider a hit
    
    // Find the closest unit within click radius
    let closestUnit = null;
    let closestDistance = clickRadius;
    
    for (const unit of units) {
      const distance = Math.sqrt(
        Math.pow(x - unit.x, 2) + 
        Math.pow(y - unit.y, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestUnit = unit;
      }
    }
    
    return closestUnit;
  }
  
  // Unit selection
  selectUnit(unit) {
    // Toggle selection
    if (this.selectedUnit === unit) {
      this.selectedUnit = null;
    } else {
      this.selectedUnit = unit;
    }
    
    return true;
  }
  
  renderSelectedUnitUI(ctx) {
    if (!this.selectedUnit) return;
    
    const unit = this.selectedUnit;
    
    // Draw selection circle
    ctx.strokeStyle = this.menuStyle.borderColor[unit.playerId];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, unit.width * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw unit info panel
    this.drawUnitInfoPanel(ctx, unit);
    
    // Draw ability buttons if unit has abilities
    if (unit.abilities && unit.abilities.length > 0) {
      this.drawAbilityButtons(ctx, unit);
    }
  }
  
  drawUnitInfoPanel(ctx, unit) {
    // Panel dimensions
    const panelWidth = 200;
    const panelHeight = 70;
    
    // Position panel above unit but ensure it stays on screen
    let panelX = unit.x - panelWidth / 2;
    let panelY = unit.y - unit.height - panelHeight - 10;
    
    // Adjust if off screen
    if (panelX < 10) panelX = 10;
    if (panelX + panelWidth > this.engine.canvas.width - 10) {
      panelX = this.engine.canvas.width - 10 - panelWidth;
    }
    
    if (panelY < 10) {
      // Show below unit instead
      panelY = unit.y + unit.height + 10;
    }
    
    // Draw panel background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    // Draw panel border
    ctx.strokeStyle = this.menuStyle.borderColor[unit.playerId];
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Draw unit info
    const unitData = window.unitTypes[unit.type];
    
    // Unit name and type
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(unitData.name, panelX + 10, panelY + 20);
    
    // Stats
    ctx.font = '12px Arial';
    
    // Health
    ctx.fillText(
      `Health: ${Math.floor(unit.health)}/${unit.maxHealth}`,
      panelX + 10, panelY + 40
    );
    
    // Attack
    let attackText;
    if (typeof unit.attackPower === 'object') {
      attackText = `Attack: ${unit.attackPower.min}-${unit.attackPower.max}`;
    } else {
      attackText = `Attack: ${unit.attackPower}`;
    }
    
    ctx.fillText(attackText, panelX + 10, panelY + 60);
    
    // Mana if unit has it
    if (unit.maxMana) {
      ctx.fillText(
        `Mana: ${Math.floor(unit.mana)}/${unit.maxMana}`,
        panelX + 110, panelY + 40
      );
    }
    
    // Armor
    ctx.fillText(
      `Armor: ${unit.armorValue} (${unit.armorType})`,
      panelX + 110, panelY + 60
    );
  }
  
  drawAbilityButtons(ctx, unit) {
    // Only draw for non-passive abilities
    const activeAbilities = unit.abilities.filter(a => !a.passive && a.enabled !== false);
    if (activeAbilities.length === 0) return;
    
    // Button dimensions
    const buttonSize = 40;
    const spacing = 5;
    const totalWidth = activeAbilities.length * (buttonSize + spacing) - spacing;
    
    // Position buttons below unit
    let startX = unit.x - totalWidth / 2;
    const startY = unit.y + unit.height + 10;
    
    // Clear previous ability buttons
    this.abilityButtons = [];
    
    // Draw each ability button
    activeAbilities.forEach((ability, index) => {
      const buttonX = startX + index * (buttonSize + spacing);
      const buttonY = startY;
      
      // Determine button state
      let buttonColor;
      let textColor = '#ffffff';
      
      if (ability.cooldownRemaining && ability.cooldownRemaining > 0) {
        // On cooldown
        buttonColor = '#555555';
      } else if (ability.manaCost && unit.mana < ability.manaCost) {
        // Not enough mana
        buttonColor = '#1a5278';
      } else {
        // Ready to use
        buttonColor = '#2980b9';
      }
      
      // Draw button
      ctx.fillStyle = buttonColor;
      ctx.fillRect(buttonX, buttonY, buttonSize, buttonSize);
      
      // Draw ability icon/letter
      ctx.fillStyle = textColor;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        ability.name.charAt(0),
        buttonX + buttonSize / 2,
        buttonY + buttonSize / 2 + 6
      );
      
      // Draw cooldown overlay if on cooldown
      if (ability.cooldownRemaining && ability.cooldownRemaining > 0) {
        // Display cooldown timer
        const cooldownPercent = ability.cooldownRemaining / ability.cooldown;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.moveTo(buttonX + buttonSize/2, buttonY + buttonSize/2);
        ctx.arc(
          buttonX + buttonSize/2, 
          buttonY + buttonSize/2,
          buttonSize/2,
          -Math.PI/2,
          -Math.PI/2 + (2 * Math.PI * cooldownPercent),
          false
        );
        ctx.closePath();
        ctx.fill();
        
        // Show cooldown timer
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(
          Math.ceil(ability.cooldownRemaining),
          buttonX + buttonSize / 2,
          buttonY + buttonSize / 2 + 5
        );
      }
      
      // Store button for click handling
      this.abilityButtons.push({
        x: buttonX,
        y: buttonY,
        width: buttonSize,
        height: buttonSize,
        unit,
        ability
      });
    });
  }
  
  // Tooltip system
  checkTooltips(x, y) {
    // Clear existing tooltips
    this.tooltips = this.tooltips.filter(tooltip => tooltip.isPermanent);
    
    // Check ability buttons
    if (this.abilityButtons) {
      this.abilityButtons.forEach(button => {
        if (this.isPointInRect(x, y, button.x, button.y, button.width, button.height)) {
          // Show ability tooltip
          this.tooltips.push({
            text: button.ability.name,
            description: button.ability.description,
            x: button.x + button.width / 2,
            y: button.y - 10,
            startTime: Date.now(),
            duration: 100, // Will stay visible as long as mouse is over button
            isPermanent: false
          });
        }
      });
    }
  }
  
  updateTooltips(delta) {
    const currentTime = Date.now();
    
    // Filter out expired tooltips
    this.tooltips = this.tooltips.filter(tooltip => {
      if (tooltip.isPermanent) return true;
      
      const elapsedTime = (currentTime - tooltip.startTime) / 1000;
      return elapsedTime < tooltip.duration;
    });
  }
  
  renderTooltips(ctx) {
    if (this.tooltips.length === 0) return;
    
    // Draw each tooltip
    this.tooltips.forEach(tooltip => {
      // Calculate alpha based on age for fade effects
      let alpha = 1.0;
      if (!tooltip.isPermanent) {
        const elapsedTime = (Date.now() - tooltip.startTime) / 1000;
        
        // Fade in first 0.2s, fade out last 0.5s
        if (elapsedTime < 0.2) {
          alpha = elapsedTime / 0.2;
        } else if (elapsedTime > tooltip.duration - 0.5) {
          alpha = (tooltip.duration - elapsedTime) / 0.5;
        }
      }
      
      // Measure text
      ctx.font = '14px Arial';
      const textWidth = ctx.measureText(tooltip.text).width;
      const padding = 5;
      
      // Draw tooltip background
      const tooltipX = tooltip.x - textWidth / 2 - padding;
      const tooltipY = tooltip.y - 20;
      const tooltipWidth = textWidth + padding * 2;
      const tooltipHeight = tooltip.description ? 40 : 20;
      
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
      this.roundRect(ctx, tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5, true);
      
      // Draw tooltip text
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.textAlign = 'center';
      ctx.fillText(tooltip.text, tooltip.x, tooltipY + 15);
      
      // Draw description if present
      if (tooltip.description) {
        ctx.font = '12px Arial';
        ctx.fillText(tooltip.description, tooltip.x, tooltipY + 30);
      }
    });
  }
  
  // Helper methods
  addTooltip(text, x, y, description = null, duration = 2, isPermanent = false) {
    this.tooltips.push({
      text,
      description,
      x,
      y,
      startTime: Date.now(),
      duration,
      isPermanent
    });
  }
  
  isPointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
    return x >= rectX && x <= rectX + rectWidth && 
           y >= rectY && y <= rectY + rectHeight;
  }
  
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineCount = 0;
    
    for (let n = 0; n < words.length; n++) {
      testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
        lineCount++;
      } else {
        line = testLine;
      }
    }
    
    ctx.fillText(line, x, y);
    return lineCount + 1;
  }
  
  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'number') {
      radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
      const defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
      for (let side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    
    if (fill) {
      ctx.fill();
    }
    
    if (stroke) {
      ctx.stroke();
    }
  }
  
  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
  
// Add this method to the UIManager class
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
  
  updateAnimations(delta) {
    // Update any UI animations
  }
  
  reset() {
    // Reset UI state
    this.tooltips = [];
    this.selectedUnit = null;
    this.abilityTargeting.active = false;
    this.abilityTargeting.unit = null;
    this.abilityTargeting.ability = null;
    this.unitSelectionMenu.isOpen = false;
    this.unitActionMenu.isOpen = false;
    this.modal.isOpen = false;
    this.abilityButtons = [];
  }
}