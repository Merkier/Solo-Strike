// main.js - Game entry point
import GameEngine from './GameEngine.js';

// Import unit data (this would be moved to a data-driven approach)
import { unitTypes, unitUpgrades } from './data/unitTypes.js';

// Make unit data globally available
window.unitTypes = unitTypes;
window.unitUpgrades = unitUpgrades;

// Initialize the game when window loads
window.addEventListener('load', () => {
  console.log("Starting SoloStrike v0.9.5...");
  
  // Get the canvas
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }
  
  try {
    // Create and initialize game engine
    const game = new GameEngine(canvas);
    
    // Initialize systems and start the game loop
    // This will now start with the start screen showing
    game.init().start();
    
    // Log success
    console.log("Game initialized with start screen");
    
    // Add a global test function for debugging
    window.testGame = function() {
      // Trigger a test wave
      game.waveManager.spawnWave();
      return "Test wave spawned";
    };
  } catch (error) {
    console.error("Error starting game:", error);
  }
});