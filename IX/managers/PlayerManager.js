// managers/PlayerManager.js - Manages players and their resources
import { Player } from "./Player.js";

export class PlayerManager {
  constructor(engine) {
    this.engine = engine;
    this.goldUpdateInterval = 1; // Update gold every second
    this.lastGoldUpdateTime = 0;
    this.goldUpgradeCooldowns = {
      player1: 0,
      player2: 0
    };
    
    // Auto-cast settings
    this.autoCastSettings = {
      player1: {},
      player2: {}
    };
  }
  
  init() {
    // Initialize players
    this.engine.players.player1 = new Player('player1', this.engine);
    this.engine.players.player2 = new Player('player2', this.engine);
    
    // Initialize auto-cast settings
    this.initializeAutoCastSettings();
    
    return this;
  }
  
  update(delta) {
    // Update gold for both players
    this.updateGold(delta);
    
    // Update gold upgrade cooldowns
    this.updateGoldUpgradeCooldowns(delta);
  }
  
  updateGold(delta) {
    // Increment counter
    this.lastGoldUpdateTime += delta;
    
    // Update gold every interval
    if (this.lastGoldUpdateTime >= this.goldUpdateInterval) {
      Object.values(this.engine.players).forEach(player => {
        // Base income calculation
        let goldIncrease = player.goldIncomeRate * this.lastGoldUpdateTime;
        
        // Add midfield control bonus
        if (this.engine.state.midFieldControl === player.id) {
          goldIncrease += 0.5 * this.lastGoldUpdateTime; // 10g per 20 seconds
        }
        
        player.gold += goldIncrease;
      });
      
      // Reset counter
      this.lastGoldUpdateTime = 0;
    }
  }
  
  updateGoldUpgradeCooldowns(delta) {
    // Update cooldowns
    Object.keys(this.goldUpgradeCooldowns).forEach(playerId => {
      if (this.goldUpgradeCooldowns[playerId] > 0) {
        this.goldUpgradeCooldowns[playerId] -= delta;
        if (this.goldUpgradeCooldowns[playerId] < 0) {
          this.goldUpgradeCooldowns[playerId] = 0;
        }
      }
    });
  }
  
  initializeAutoCastSettings() {
    // Setup default auto-cast settings for all unit types
    const unitTypes = window.unitTypes || {};
    
    for (const unitTypeId in unitTypes) {
      const unitType = unitTypes[unitTypeId];
      this.autoCastSettings.player1[unitTypeId] = {};
      this.autoCastSettings.player2[unitTypeId] = {};
      
      if (unitType.stats && unitType.stats.abilities) {
        unitType.stats.abilities.forEach(ability => {
          if (!ability.passive) {
            // Enable auto-cast for all non-passive abilities by default
            this.autoCastSettings.player1[unitTypeId][ability.name] = true;
            this.autoCastSettings.player2[unitTypeId][ability.name] = true;
          }
        });
      }
    }
  }
  
  getAutoCastSettings(unitType, playerId = null) {
    // Get settings for the specified player, or active player if not specified
    const player = playerId || this.engine.activePlayer;
    
    // Safety check - if settings aren't initialized yet or unitType doesn't exist
    if (!this.autoCastSettings[player] || !this.autoCastSettings[player][unitType]) {
      return {}; // Return empty object as fallback
    }
    
    return this.autoCastSettings[player][unitType] || {};
  }
  toggleAutoCast(unitType, abilityName, playerId) {
    const settings = this.autoCastSettings[playerId];
    
    if (!settings[unitType]) {
      settings[unitType] = {};
    }
    
    // Toggle the setting
    settings[unitType][abilityName] = !settings[unitType][abilityName];
    
    return settings[unitType][abilityName];
  }
  
  reset() {
    // Reset players
    this.engine.players.player1 = new Player('player1', this.engine);
    this.engine.players.player2 = new Player('player2', this.engine);
    
    // Reset cooldowns
    this.goldUpgradeCooldowns = {
      player1: 0,
      player2: 0
    };
    
    // Reset gold update timing
    this.lastGoldUpdateTime = 0;
    
    // No need to reset auto-cast settings
  }
}

