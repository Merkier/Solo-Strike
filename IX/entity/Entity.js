// entity/Entity.js - Base entity class
export class Entity {
  constructor(id, x, y) {
    this.id = id || crypto.randomUUID();
    this.x = x;
    this.y = y;
    this.active = true;
  }
  
  update(delta) {
    // Base update logic
  }
  
  render(ctx) {
    // Base render logic
  }
}

