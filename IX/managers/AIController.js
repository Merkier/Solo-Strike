// managers/AIController.js - AI player controller
export class AIController {
  constructor(engine) {
    this.engine = engine;
    this.decisionInterval = 1.5; // Make decisions every 1.5 seconds
    this.lastDecisionTime = 0;
    this.unitProductionCooldown = 0;
    
    // Strategic state tracking
    this.gamePhase = 'early'; // 'early', 'mid', 'late'
    this.consecutiveUnitPlacements = 0;
    this.lastHealthCheck = 4000; // Initial fortress health
    
    // Gold reserves to maintain based on game phase
    this.goldReserves = {
      early: 100,   // Save 100 gold in early game
      mid: 200,     // Save 200 gold in mid game
      late: 300     // Save 300 gold in late game
    };
    
    // Unit composition targets based on game phase
    this.desiredComposition = {
      early: {
        tank: 0.3,     // guardian, juggernaut, colossus
        ranged: 0.4,   // archer, leviathan
        support: 0.2,  // weaver, oracle, astralNomad
        special: 0.1   // all others
      },
      mid: {
        tank: 0.25,
        ranged: 0.35,
        support: 0.3,
        special: 0.1
      },
      late: {
        tank: 0.2,
        ranged: 0.3,
        support: 0.3,
        special: 0.2
      }
    };
    
    // Prioritized upgrades
    this.criticalUpgrades = [
      'phalanxStance',      // Guardian defensive upgrade
      'stormAegis',         // Weaver offensive upgrade
      'infernoPayload',     // Leviathan AoE damage
      'glacialTempest'      // Permafrost Drake fortress disabler
    ];
  }
  
  init() {
    // Initialize AI state
    return this;
  }
  
  update(delta) {
    // Only control player2 (AI player)
    if (this.engine.activePlayer !== 'player2') {
      this.lastDecisionTime += delta;
      
      if (this.unitProductionCooldown > 0) {
        this.unitProductionCooldown -= delta;
      }
      
      // Make decisions periodically
      if (this.lastDecisionTime >= this.decisionInterval) {
        this.updateGamePhase();
        this.makeDecision();
        this.lastDecisionTime = 0;
      }
    }
  }
  
  updateGamePhase() {
    const player = this.engine.players.player2;
    const elapsedTime = this.engine.state.gameTime || 0;
    
    // Update game phase based on time and fortress level
    if (player.fortressLevel >= 3 || elapsedTime > 300) { // 5 minutes
      this.gamePhase = 'late';
    } else if (player.fortressLevel >= 2 || elapsedTime > 150) { // 2.5 minutes
      this.gamePhase = 'mid'; 
    } else {
      this.gamePhase = 'early';
    }
  }
  
  makeDecision() {
    // Get current state information
    const player = this.engine.players.player2;
    const emptySlots = this.getEmptyGridSlots(player);
    const advantageState = this.isAhead();
    
    // Get current gold reserve requirement based on game phase
    const requiredReserve = this.goldReserves[this.gamePhase];
    const hasEnoughReserve = player.gold >= requiredReserve;
    
    // Base weights for different actions
    let weights = {
      placeUnit: 0,
      upgradeGold: 0,
      upgradeFortress: 0,
      purchaseUpgrade: 0,
      repositionUnit: 0
    };
    
    // Calculate weights based on game state
    if (player.fortressLevel < 3) {
      // Fortress upgrades are high priority until max level
      weights.upgradeFortress = 0.7;
    }
    
    // Adjust weights based on advantage state
    switch(advantageState) {
      case 'far_ahead':
        // When far ahead, focus on upgrades and economy
        weights.upgradeGold = 0.4;
        weights.purchaseUpgrade = 0.4;
        weights.placeUnit = 0.1;
        weights.repositionUnit = 0.1;
        break;
        
      case 'ahead':
        // When ahead, balanced approach with upgrade focus
        weights.upgradeGold = 0.3;
        weights.purchaseUpgrade = 0.3;
        weights.placeUnit = 0.3;
        weights.repositionUnit = 0.1;
        break;
        
      case 'even':
        // When even, balance units and upgrades
        weights.upgradeGold = 0.2;
        weights.purchaseUpgrade = 0.2;
        weights.placeUnit = 0.5;
        weights.repositionUnit = 0.1;
        break;
        
      case 'behind':
        // When behind, focus on units
        weights.upgradeGold = 0.1;
        weights.purchaseUpgrade = 0.2;
        weights.placeUnit = 0.6;
        weights.repositionUnit = 0.1;
        break;
        
      case 'far_behind':
        // When far behind, focus heavily on units
        weights.upgradeGold = 0.05;
        weights.purchaseUpgrade = 0.15;
        weights.placeUnit = 0.7;
        weights.repositionUnit = 0.1;
        break;
    }
    
    // Adjust based on game phase
    if (this.gamePhase === 'early') {
      // In early game, prioritize gold income and basic units
      weights.upgradeGold += 0.2;
      weights.purchaseUpgrade -= 0.1;
    } else if (this.gamePhase === 'late') {
      // In late game, increase upgrade priority
      weights.purchaseUpgrade += 0.1;
    }
    
    // Special cases to rebalance weights
    
    // If fortress level upgrade is available and affordable, prioritize it
    if (player.fortressLevel < 3) {
      const fortressUpgradeCost = 250 + ((player.fortressLevel - 1) * 50);
      if (player.gold >= fortressUpgradeCost) {
        weights.upgradeFortress = Math.max(weights.upgradeFortress, 0.6);
      }
    }
    
    // CHANGE 3: Reduce unit placement probability if we haven't met gold reserves
    // This helps save gold for more expensive units later
    if (!hasEnoughReserve) {
      weights.placeUnit *= 0.4; // Significant reduction to save gold
      
      // In mid and late game, prioritize saving over small improvements
      if (this.gamePhase !== 'early') {
        weights.upgradeGold *= 0.7;
        weights.purchaseUpgrade *= 0.5;
      }
    }
    
    // If no empty slots, can't place units
    if (emptySlots.length === 0) {
      weights.placeUnit = 0;
      // Redistribute to other options
      const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
      if (totalWeight > 0) {
        for (const key in weights) {
          if (key !== 'placeUnit') {
            weights[key] = weights[key] / totalWeight;
          }
        }
      }
    }
    
    // Check if grid is nearly full - if so, increase repositioning priority
    const gridFullnessRatio = 1 - (emptySlots.length / (player.gridWidth * player.gridHeight));
    if (gridFullnessRatio > 0.7) {
      // Grid is getting full, consider repositioning more
      weights.repositionUnit += 0.2 * gridFullnessRatio;
    }
    
    // Check available critical upgrades
    const upgradeSystem = this.engine.systems.get('upgrade');
    const availableUpgrades = upgradeSystem.getAvailableUpgrades(player.id);
    const hasCriticalUpgrades = availableUpgrades.some(upgrade => 
      this.criticalUpgrades.includes(upgrade.id) && upgrade.canAfford
    );
    
    if (hasCriticalUpgrades) {
      // Prioritize critical upgrades when available
      weights.purchaseUpgrade += 0.3;
    }
    
    // Check if gold income is maxed
    if (player.goldIncomeLevel >= 4) {
      weights.upgradeGold = 0;
    }
    
    // Choose action based on weights
    const selectedAction = this.selectWeightedAction(weights);
    
    // Execute selected action
    switch(selectedAction) {
      case 'placeUnit':
        if (emptySlots.length > 0 && this.unitProductionCooldown <= 0) {
          const success = this.placeStrategicUnit(player);
          if (success) {
            // Add small cooldown to prevent spamming units
            this.unitProductionCooldown = 0.2;
          }
        }
        break;
        
      case 'upgradeGold':
        player.upgradeGoldIncome();
        break;
        
      case 'upgradeFortress':
        player.upgradeFortress();
        break;
        
      case 'purchaseUpgrade':
        this.purchaseStrategicUpgrade(player);
        break;
        
      case 'repositionUnit':
        this.repositionOrSellUnit(player);
        break;
    }
  }
  
  selectWeightedAction(weights) {
    // Normalize weights
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) return 'placeUnit'; // Default
    
    // Convert to probability distribution
    const normalized = {};
    for (const key in weights) {
      normalized[key] = weights[key] / totalWeight;
    }
    
    // Select based on weights
    const rand = Math.random();
    let cumulativeWeight = 0;
    
    for (const key in normalized) {
      cumulativeWeight += normalized[key];
      if (rand <= cumulativeWeight) {
        return key;
      }
    }
    
    return Object.keys(weights)[0]; // Fallback
  }
  
  placeStrategicUnit(player) {
    // Find available unit types based on fortress level
    const availableTypes = this.getAvailableUnitTypes(player);
    if (availableTypes.length === 0) return false;
    
    // Choose unit type strategically based on game state
    const unitType = this.chooseStrategicUnitType(player, availableTypes);
    if (!unitType) return false;
    
    // Find empty grid slots
    const emptySlots = this.getEmptyGridSlots(player);
    if (emptySlots.length === 0) return false;
    
    // Choose strategic position
    const { row, col } = this.chooseStrategicPosition(player, emptySlots, unitType);
    
    // Purchase the unit
    return player.purchaseUnit(unitType, row, col);
  }
  
  chooseStrategicUnitType(player, availableTypes) {
    // CHANGE 1: Avoid basic unit type entirely - filter it out of the available types
    availableTypes = availableTypes.filter(type => type !== 'basic');
    
    // Current composition analysis
    const composition = this.analyzeUnitComposition(player);
    const targetComposition = this.desiredComposition[this.gamePhase];
    
    // Get gold reserve for current phase
    const goldReserve = this.goldReserves[this.gamePhase];
    
    // Categorize available units
    const availableByCategory = {
      tank: [],
      ranged: [],
      support: [],
      special: []
    };
    
    // First pass: categorize and filter by affordability
    availableTypes.forEach(type => {
      const unitData = window.unitTypes[type];
      const cost = unitData.cost;
      
      // Check if we can afford it while maintaining our strategic reserve
      // CHANGE 3: Consider the gold reserve when determining affordability
      const availableGold = player.gold - goldReserve;
      
      // Only consider units we can afford with our excess gold
      // Exception: if we have significantly more gold than needed, we can use some reserve
      let canAfford = false;
      if (availableGold >= cost) {
        canAfford = true;
      } else if (player.gold >= cost && player.gold > goldReserve * 1.5) {
        // We can dip into reserves if we have significantly more than needed
        canAfford = true;
      }
      
      if (!canAfford) return;
      
      // Categorize unit
      if (this.isTankUnit(type)) {
        availableByCategory.tank.push(type);
      } else if (this.isRangedUnit(type)) {
        availableByCategory.ranged.push(type);
      } else if (this.isSupportUnit(type)) {
        availableByCategory.support.push(type);
      } else {
        availableByCategory.special.push(type);
      }
    });
    
    // Find the category we need most based on target composition
    let largestDeficit = -1;
    let deficitCategory = null;
    
    for (const category in targetComposition) {
      const target = targetComposition[category];
      const current = composition[category] || 0;
      const deficit = target - current;
      
      if (deficit > largestDeficit && availableByCategory[category].length > 0) {
        largestDeficit = deficit;
        deficitCategory = category;
      }
    }
    
    // If we have a deficit category with available units, prioritize it
    let preferredTypes = [];
    if (deficitCategory && largestDeficit > 0) {
      preferredTypes = availableByCategory[deficitCategory];
    } else {
      // Otherwise build from most expensive tier we can afford
      if (this.gamePhase === 'late' && availableByCategory.special.length > 0) {
        preferredTypes = availableByCategory.special;
      } else if ((this.gamePhase === 'mid' || this.gamePhase === 'late') && 
                (availableByCategory.support.length > 0 || availableByCategory.tank.length > 0)) {
        // Combine support and tank in mid-late game
        preferredTypes = [...availableByCategory.support, ...availableByCategory.tank];
      } else if (availableByCategory.ranged.length > 0) {
        preferredTypes = availableByCategory.ranged;
      } else {
        // Use any available type as fallback
        preferredTypes = availableTypes.filter(type => {
          // CHANGE 3: Factor in gold reserve when determining affordability
          const unitCost = window.unitTypes[type].cost;
          return player.gold - goldReserve >= unitCost || 
                 (player.gold >= unitCost && player.gold > goldReserve * 1.5);
        });
      }
    }
    
    // If no preferred types available, use all available types as fallback
    // But still consider the gold reserve
    if (preferredTypes.length === 0) {
      preferredTypes = availableTypes.filter(type => {
        const unitCost = window.unitTypes[type].cost;
        return player.gold - goldReserve >= unitCost || 
               (player.gold >= unitCost && player.gold > goldReserve * 1.5);
      });
    }
    
    // In late game or when far behind, prioritize top-tier units
    if (this.gamePhase === 'late' || this.isAhead() === 'far_behind') {
      // Sort by cost (descending) to get the most powerful units first
      preferredTypes.sort((a, b) => window.unitTypes[b].cost - window.unitTypes[a].cost);
      
      // Pick from the top half of units if we have enough options
      if (preferredTypes.length > 1) {
        const halfLength = Math.max(1, Math.floor(preferredTypes.length / 2));
        preferredTypes = preferredTypes.slice(0, halfLength);
      }
    }
    
    // Select randomly from the preferred types
    return preferredTypes.length > 0 ? 
      preferredTypes[Math.floor(Math.random() * preferredTypes.length)] : 
      null;
  }
  
  chooseStrategicPosition(player, emptySlots, unitType) {
    // Different positioning strategies based on unit type
    // For Player 2, row 0 is furthest from battlefield (back row) 
    // and row (height-1) is closest to battlefield (front row)
    
    // For a more sophisticated approach, consider nearby units as well
    const myUnits = this.engine.entities.getUnits(player.id);
    
    // Check if we want to create a cohesive formation
    if (this.isTankUnit(unitType)) {
      // Tanks in front rows (highest row values)
      const frontRowSlots = emptySlots.filter(slot => slot.row >= 2);
      if (frontRowSlots.length > 0) {
        return frontRowSlots[Math.floor(Math.random() * frontRowSlots.length)];
      }
    } else if (this.isRangedUnit(unitType)) {
      // Ranged units in back rows
      const backRowSlots = emptySlots.filter(slot => slot.row <= 1);
      if (backRowSlots.length > 0) {
        return backRowSlots[Math.floor(Math.random() * backRowSlots.length)];
      }
    } else if (this.isSupportUnit(unitType)) {
      // Support units in middle rows or near other units
      const middleRowSlots = emptySlots.filter(slot => slot.row === 1 || slot.row === 2);
      if (middleRowSlots.length > 0) {
        return middleRowSlots[Math.floor(Math.random() * middleRowSlots.length)];
      }
    }
    
    // Default: random empty slot
    return emptySlots[Math.floor(Math.random() * emptySlots.length)];
  }
  
  analyzeUnitComposition(player) {
    const units = this.engine.entities.getUnits(player.id);
    
    if (units.length === 0) {
      return { tank: 0, ranged: 0, support: 0, special: 0 };
    }
    
    const counts = {
      tank: 0,
      ranged: 0,
      support: 0,
      special: 0
    };
    
    // Count units by category
    units.forEach(unit => {
      if (this.isTankUnit(unit.type)) {
        counts.tank++;
      } else if (this.isRangedUnit(unit.type)) {
        counts.ranged++;
      } else if (this.isSupportUnit(unit.type)) {
        counts.support++;
      } else {
        counts.special++;
      }
    });
    
    // Calculate percentages
    const total = units.length;
    const composition = {};
    
    for (const category in counts) {
      composition[category] = counts[category] / total;
    }
    
    return composition;
  }
  
  // Helper functions to categorize units
  isTankUnit(type) {
    return ['guardian', 'juggernaut', 'colossus'].includes(type);
  }
  
  isRangedUnit(type) {
    return ['stalker', 'leviathan', 'permafrostDrake'].includes(type);
  }
  
  isSupportUnit(type) {
    return ['weaver', 'oracle', 'astralNomad'].includes(type);
  }
  
  getAvailableUnitTypes(player) {
    const availableTypes = [];
    const fortressLevel = player.fortressLevel;
    
    // Loop through all unit types and check if they're available
    for (const unitType in window.unitTypes) {
      const unitData = window.unitTypes[unitType];
      
      // Check fortress level requirement
      if (fortressLevel >= unitData.requiredFortressLevel) {
        availableTypes.push(unitType);
      }
    }
    
    return availableTypes;
  }
  
  getEmptyGridSlots(player) {
    const emptySlots = [];
    
    for (let row = 0; row < player.gridHeight; row++) {
      for (let col = 0; col < player.gridWidth; col++) {
        if (player.grid[row][col] === null) {
          emptySlots.push({ row, col });
        }
      }
    }
    
    return emptySlots;
  }
  
  isAhead() {
    const player1Health = this.engine.players.player1.fortress.health;
    const player2Health = this.engine.players.player2.fortress.health;
    
    const healthDiff = player2Health - player1Health;
    
    // Check if there's been a significant change in relative health
    const healthChanged = Math.abs(player2Health - this.lastHealthCheck) > 200;
    if (healthChanged) {
      this.lastHealthCheck = player2Health;
    }
    
    if (healthDiff > 500) return 'far_ahead';
    if (healthDiff > 200) return 'ahead';
    if (healthDiff < -500) return 'far_behind';
    if (healthDiff < -200) return 'behind';
    return 'even';
  }
  
  purchaseStrategicUpgrade(player) {
    // Get available upgrades for this player
    const upgradeSystem = this.engine.systems.get('upgrade');
    const availableUpgrades = upgradeSystem.getAvailableUpgrades(player.id);
    
    if (availableUpgrades.length === 0 || player.gold < 50) {
      return false;
    }
    
    // CHANGE 4: Check which unit types the AI currently has on the grid
    const unitsOnGrid = new Set();
    for (let row = 0; row < player.gridHeight; row++) {
      for (let col = 0; col < player.gridWidth; col++) {
        const unitType = player.grid[row][col];
        if (unitType) {
          unitsOnGrid.add(unitType);
        }
      }
    }
    
    // Filter upgrades to only those for unit types we have on the grid
    const relevantUpgrades = availableUpgrades.filter(upgrade => {
      const upgradeId = upgrade.id;
      
      // Check each unit type to see if this upgrade applies to it
      for (const unitType of unitsOnGrid) {
        const unitData = window.unitTypes[unitType];
        if (unitData && unitData.stats && unitData.stats.possibleUpgrades &&
            unitData.stats.possibleUpgrades.includes(upgradeId)) {
          return true;
        }
      }
      
      return false;
    });
    
    // First check for critical upgrades among our relevant upgrades
    const criticalUpgrades = relevantUpgrades.filter(upgrade => 
      this.criticalUpgrades.includes(upgrade.id) &&
      upgrade.canAfford
    );
    
    if (criticalUpgrades.length > 0) {
      // Sort critical upgrades by cost (lower first to get more upgrades)
      criticalUpgrades.sort((a, b) => a.cost - b.cost);
      
      // Buy the critical upgrade
      const upgrade = criticalUpgrades[0];
      return upgradeSystem.purchaseUpgrade(player.id, upgrade.id);
    }
    
    // If no critical upgrades, then buy affordable relevant upgrades
    const affordableUpgrades = relevantUpgrades.filter(upgrade => upgrade.canAfford);
    
    if (affordableUpgrades.length > 0) {
      // For general upgrades, sort by cost (highest first in late game to get powerful upgrades)
      if (this.gamePhase === 'late') {
        affordableUpgrades.sort((a, b) => b.cost - a.cost);
      } else {
        // Otherwise get cheaper upgrades first
        affordableUpgrades.sort((a, b) => a.cost - b.cost);
      }
      
      // Pick the first affordable upgrade
      const upgrade = affordableUpgrades[0];
      return upgradeSystem.purchaseUpgrade(player.id, upgrade.id);
    }
    
    return false;
  }
  
  repositionOrSellUnit(player) {
    // Get all grid positions with units
    const occupiedSlots = [];
    for (let row = 0; row < player.gridHeight; row++) {
      for (let col = 0; col < player.gridWidth; col++) {
        const unitType = player.grid[row][col];
        if (unitType) {
          occupiedSlots.push({ row, col, unitType });
        }
      }
    }
    
    if (occupiedSlots.length === 0) return false;
    
    // Get empty slots
    const emptySlots = this.getEmptyGridSlots(player);
    
    // CHANGE 2: Only sell units if the grid is full or almost full
    // Define "almost full" as having 2 or fewer empty slots
    if (emptySlots.length <= 2) {
      return this.sellStrategicUnit(player, occupiedSlots);
    }
    
    // If we have empty slots, prioritize repositioning over selling
    return this.repositionUnit(player, occupiedSlots, emptySlots);
  }
  
  repositionUnit(player, occupiedSlots, emptySlots) {
    // Find units in suboptimal positions
    let unitToMove = null;
    
    // Find ranged units in front rows
    const rangedInFrontRow = occupiedSlots.filter(slot => {
      return this.isRangedUnit(slot.unitType) && slot.row >= 2;
    });
    
    // Find tank units in back rows
    const tanksInBackRow = occupiedSlots.filter(slot => {
      return this.isTankUnit(slot.unitType) && slot.row <= 1;
    });
    
    if (rangedInFrontRow.length > 0) {
      unitToMove = rangedInFrontRow[Math.floor(Math.random() * rangedInFrontRow.length)];
    } else if (tanksInBackRow.length > 0) {
      unitToMove = tanksInBackRow[Math.floor(Math.random() * tanksInBackRow.length)];
    } else {
      // Random unit if no suboptimal placements
      unitToMove = occupiedSlots[Math.floor(Math.random() * occupiedSlots.length)];
    }
    
    // Choose strategic new position
    let targetSlot = null;
    
    if (this.isRangedUnit(unitToMove.unitType)) {
      // Ranged unit - move to back rows
      const backRowSlots = emptySlots.filter(slot => slot.row <= 1);
      if (backRowSlots.length > 0) {
        targetSlot = backRowSlots[Math.floor(Math.random() * backRowSlots.length)];
      }
    } else if (this.isTankUnit(unitToMove.unitType)) {
      // Tank unit - move to front rows
      const frontRowSlots = emptySlots.filter(slot => slot.row >= 2);
      if (frontRowSlots.length > 0) {
        targetSlot = frontRowSlots[Math.floor(Math.random() * frontRowSlots.length)];
      }
    }
    
    // If no specific slot found, pick random
    if (!targetSlot && emptySlots.length > 0) {
      targetSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
    }
    
    if (unitToMove && targetSlot) {
      // Move the unit
      return player.moveUnit(unitToMove.row, unitToMove.col, targetSlot.row, targetSlot.col);
    }
    
    return false;
  }
  
  sellStrategicUnit(player, occupiedSlots) {
    // CHANGE 2: Only sell if absolutely necessary (grid is full or almost full)
    const emptySlots = this.getEmptyGridSlots(player);
    if (emptySlots.length > 2) {
      return false; // Don't sell units if we have enough empty slots
    }
    
    if (occupiedSlots.length === 0) return false;
    
    // Analyze current unit composition
    const myUnits = this.engine.entities.getUnits(player.id);
    const unitCounts = {};
    
    myUnits.forEach(unit => {
      unitCounts[unit.type] = (unitCounts[unit.type] || 0) + 1;
    });
    
    let unitToSell = null;
    
    // Look for cheaper/lower tier units first
    if (this.gamePhase === 'late') {
      // In late game, consider selling lower tier units
      const tier1Slots = occupiedSlots.filter(slot => 
        ['guardian', 'stalker', 'weaver'].includes(slot.unitType)
      );
      
      if (tier1Slots.length > 0) {
        // Sort by sub-optimal positioning
        const badlyPositioned = tier1Slots.filter(slot => 
          (this.isRangedUnit(slot.unitType) && slot.row >= 2) || 
          (this.isTankUnit(slot.unitType) && slot.row <= 1)
        );
        
        if (badlyPositioned.length > 0) {
          unitToSell = badlyPositioned[Math.floor(Math.random() * badlyPositioned.length)];
        } else {
          unitToSell = tier1Slots[Math.floor(Math.random() * tier1Slots.length)];
        }
      }
    }
    
    // If still no unit to sell, find unit types we have more than 2 of
    if (!unitToSell) {
      const excessUnitTypes = Object.keys(unitCounts).filter(type => unitCounts[type] > 2);
      
      if (excessUnitTypes.length > 0) {
        // Find one of these excess units on the grid
        const typeToSell = excessUnitTypes[Math.floor(Math.random() * excessUnitTypes.length)];
        const matchingSlots = occupiedSlots.filter(slot => slot.unitType === typeToSell);
        
        if (matchingSlots.length > 0) {
          unitToSell = matchingSlots[Math.floor(Math.random() * matchingSlots.length)];
        }
      }
    }
    
    // If no unit to sell yet, pick a random one
    if (!unitToSell) {
      unitToSell = occupiedSlots[Math.floor(Math.random() * occupiedSlots.length)];
    }
    
    // Sell the unit
    player.sellUnit(unitToSell.row, unitToSell.col);
    
    return true;
  }
  
  reset() {
    this.gamePhase = 'early';
    this.lastHealthCheck = 4000;
    this.lastDecisionTime = 0;
    this.unitProductionCooldown = 0;
    this.consecutiveUnitPlacements = 0;
  }
}