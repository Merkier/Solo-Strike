// GameEngine.js - Core game loop and state management
import { EntityManager } from './entity/EntityManager.js';
import { SystemManager } from './systems/SystemManager.js';
import { PlayerManager } from './managers/PlayerManager.js';
import { GridManager } from './managers/GridManager.js';
import { WaveManager } from './managers/WaveManager.js';
import { InputManager } from './ui/InputManager.js';
import { UIManager } from './ui/UIManager.js';
import { Renderer } from './rendering/Renderer.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { AbilitySystem } from './systems/AbilitySystem.js';
import { UpgradeSystem } from './systems/UpgradeSystem.js';
import { VisualEffectSystem } from './systems/VisualEffectSystem.js';
import { MovementSystem } from './systems/MovementSystem.js';
import { AIController } from './managers/AIController.js';


class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lastTimestamp = 0;
    this.isRunning = false;
    this.inStartScreen = true; // Start in the start screen state
    this.entities = new EntityManager();
    this.systems = new SystemManager();
    this.players = {
      player1: null,
      player2: null
    };
    this.activePlayer = 'player1';
    // Game state
    this.state = {
      timeToNextWave: 35,
      midFieldControl: null,
      gameOver: false,
      winner: null
    };
    
    // Core managers
    this.playerManager = new PlayerManager(this);
    this.gridManager = new GridManager(this);
    this.waveManager = new WaveManager(this);
    this.inputManager = new InputManager(this);
    this.uiManager = new UIManager(this);
    this.renderer = new Renderer(this);
    
    // Make the engine instance globally accessible if needed
    window.gameEngine = this;
  }
  
  init() {
    // Set up canvas
    this.resizeCanvas();
    
    // Initialize all systems
    this.systems.add('combat', new CombatSystem(this));
    this.systems.add('ability', new AbilitySystem(this));
    this.systems.add('upgrade', new UpgradeSystem(this));
    this.systems.add('visual', new VisualEffectSystem(this));
    this.systems.add('movement', new MovementSystem(this));
    
    // Initialize players
    this.playerManager.init();
    
    // Initialize AI controller for player 2
    this.systems.add('ai', new AIController(this));

    // Set up input handlers
    this.inputManager.init();
    
    // Initialize UI
    this.uiManager.init();
    
    console.log('Game engine initialized with rule-based AI');
    return this;
  }
  
  start() {
    this.isRunning = true;
    requestAnimationFrame(this.gameLoop.bind(this));
    console.log('Game started');
    return this;
  }

  startGame() {
    this.inStartScreen = false;
    
    // Reset game state to ensure a fresh start
    this.state.timeToNextWave = 35;
    this.state.midFieldControl = null;
    
    // Reset players if needed
    this.playerManager.reset();
    
    // Clear all entities
    this.entities.clear();
    
    // Reset all systems to ensure AI and other systems are properly initialized
    this.systems.reset();
    
    // Additionally, initialize the AI controller explicitly
    if (this.systems.get('ai')) {
      this.systems.get('ai').init();
    }
    
    console.log('Starting actual gameplay with AI initialized');
  }
  
  gameLoop(timestamp) {
    // Calculate time delta
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const delta = (timestamp - this.lastTimestamp) / 1000; // Convert to seconds
    this.lastTimestamp = timestamp;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.inStartScreen) {
      // Render start screen
      this.renderStartScreen();
    } else {
      // Update game state
      this.update(delta);
      
      // Render everything
      this.render();
    }
    
    // Continue loop if game is running
    if (this.isRunning) {
      requestAnimationFrame(this.gameLoop.bind(this));
    }
  }
  
  update(delta) {
    // Skip updates if game is over
    if (this.state.gameOver) return;
    
    // Update wave timer
    this.state.timeToNextWave -= delta;
    if (this.state.timeToNextWave <= 0) {
      this.waveManager.spawnWave();
      this.state.timeToNextWave = 35; // Reset timer
    }
    
    // Update all entities
    this.entities.update(delta);
    
    // Update all systems
    this.systems.update(delta);
    
    if (this.state.timeToNextWave > 34.5) {  // Only log right after a wave spawn
      const player1Units = this.entities.getUnits('player1').length;
      const player2Units = this.entities.getUnits('player2').length;
      console.log(`Units after movement: player1=${player1Units}, player2=${player2Units}`);
    }
    
    // Update managers
    // Check midfield control
    this.checkMidfieldControl();
    this.playerManager.update(delta);
    this.uiManager.update(delta);
    
    // Check for game over conditions
    this.checkGameOverConditions();
  }
  
  render() {
    // If in start screen, the start screen will be rendered by gameLoop
    if (this.inStartScreen) return;
    
    // Render everything
    this.renderer.render();
  }

  renderStartScreen() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    
    // Draw background - dark blue gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f1624');
    gradient.addColorStop(1, '#1f2533');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SoloStrike', canvas.width / 2, canvas.height / 3);
    
    // Draw fantasy-style subtitle
    ctx.fillStyle = '#a0a0a0';
    ctx.font = 'italic 18px Arial';
    ctx.fillText('v 0.9.3', canvas.width / 2, canvas.height / 3 + 40);
    
   // Draw footer
   ctx.fillStyle = '#ffffff';
   ctx.font = '12px Arial';
   ctx.textAlign = 'center';
   ctx.fillText('© 669-Studio', canvas.width / 2, canvas.height - 12);
   

    // Draw start button
    const buttonWidth = 160;
    const buttonHeight = 50;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = canvas.height / 2 + 40;
    
    // Button background with gradient
    const buttonGradient = ctx.createLinearGradient(0, buttonY, 0, buttonY + buttonHeight);
    buttonGradient.addColorStop(0, '#4f8fba');
    buttonGradient.addColorStop(1, '#3a6a8a');
    ctx.fillStyle = buttonGradient;
    this.roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 10, true);
    
    // Button border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    this.roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 10, false, true);
    
    // Button text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('START', canvas.width / 2, buttonY + buttonHeight / 2 + 8);
    
    // Store button position for click detection
    this.startButton = {
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight
    };
  }
  
  handleStartButtonClick(x, y) {
    if (!this.startButton) return false;
    
    // Check if the click is within the start button boundaries
    if (x >= this.startButton.x && 
        x <= this.startButton.x + this.startButton.width && 
        y >= this.startButton.y && 
        y <= this.startButton.y + this.startButton.height) {
      
      // Start the game
      this.startGame();
      return true;
    }
    
    return false;
  }
  
  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (fill) {
      ctx.fill();
    }
    
    if (stroke) {
      ctx.stroke();
    }
  }
  
  resizeCanvas() {
    // Set canvas size with appropriate aspect ratio
    this.canvas.width = 360; // Fixed width for mobile portrait
    this.canvas.height = 640; // 16:9 aspect ratio
  }
  
  checkMidfieldControl() {
    // Get all active units
    const units = this.entities.getUnits();
    const midline = this.canvas.height / 2;
    
    let player1UnitsInEnemyTerritory = 0;
    let player2UnitsInEnemyTerritory = 0;
    
    // Count units in enemy territory
    units.forEach(unit => {
      if (unit.playerId === 'player1' && unit.y < midline) {
        player1UnitsInEnemyTerritory++;
      } else if (unit.playerId === 'player2' && unit.y > midline) {
        player2UnitsInEnemyTerritory++;
      }
    });
    
    // Determine midfield control
    let previousControl = this.state.midFieldControl;
    
    if (player1UnitsInEnemyTerritory > player2UnitsInEnemyTerritory) {
      this.state.midFieldControl = 'player1';
    } else if (player2UnitsInEnemyTerritory > player1UnitsInEnemyTerritory) {
      this.state.midFieldControl = 'player2';
    }
    
    // Log control change for debugging
    if (previousControl !== this.state.midFieldControl) {
      if (this.state.midFieldControl) {
        console.log(`Midfield control changed to ${this.state.midFieldControl}`);
      } else {
        console.log('Midfield control lost - now neutral');
      }
    }
  }

  checkGameOverConditions() {
    // Check if either fortress is destroyed
    const player1 = this.players.player1;
    const player2 = this.players.player2;
    
    if (player1.fortress.health <= 0) {
      this.gameOver('player2');
    } else if (player2.fortress.health <= 0) {
      this.gameOver('player1');
    }
  }
  
  gameOver(winner) {
    this.state.gameOver = true;
    this.state.winner = winner;
    console.log(`Game Over! ${winner} has won!`);
    
    // Show game over UI
    this.uiManager.showGameOver(winner);
  }
  
  restart() {
    // Reset game state
    this.state.gameOver = false;
    this.state.winner = null;
    this.state.timeToNextWave = 35;
    this.state.midFieldControl = null;
  
    // Reset players
    this.playerManager.reset();
  
    // Clear all entities
    this.entities.clear();
  
    // Reset all systems
    this.systems.reset();
  
    // Reset UI
    this.uiManager.reset();
      
    console.log('Game restarted');
  }
}

// Export the GameEngine class
export default GameEngine;