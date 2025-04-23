// systems/SystemManager.js - Manages all game systems
export class SystemManager {
  constructor() {
    this.systems = new Map();
  }
  
  add(name, system) {
    this.systems.set(name, system);
    return system;
  }
  
  get(name) {
    return this.systems.get(name);
  }
  
  update(delta) {
    // Update all systems
    for (const system of this.systems.values()) {
      system.update(delta);
    }
  }
  
  reset() {
    // Reset all systems
    for (const system of this.systems.values()) {
      if (typeof system.reset === 'function') {
        system.reset();
      }
    }
  }
}

