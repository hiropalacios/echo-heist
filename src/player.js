// Player controller for ECHO HEIST
import { resolveCircleRect, circleRectOverlap } from './collision.js';
import { Direction, getDirectionFromVector } from './direction.js';

export const PLAYER_RADIUS = 0.45;
const PLAYER_SPEED = 5.0; // units per second

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = PLAYER_RADIUS;
    this.speed = PLAYER_SPEED;
    this.hasLoot = false;
    this.isOnButton = false;
    this.alive = true;
    this.trail = [];
    this.trailTimer = 0;
    this.moving = false;
    this.facingDirection = Direction.DOWN;
    this.empCharges = 0;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.hasLoot = false;
    this.isOnButton = false;
    this.alive = true;
    this.trail = [];
    this.trailTimer = 0;
    this.moving = false;
    this.facingDirection = Direction.DOWN;
    this.empCharges = 0;
  }

  update(dt, keys, level) {
    if (!this.alive) return;

    // Input
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    // Normalize diagonal
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx = (dx / len) * this.speed * dt;
      dy = (dy / len) * this.speed * dt;
    }

    this.moving = len > 0;

    // Update facing direction from raw input (before normalization)
    if (this.moving) {
      const rawDx = dx; // already contains direction info
      const rawDy = dy;
      const dir = getDirectionFromVector(rawDx, rawDy);
      if (dir) this.facingDirection = dir;
    }

    // Move and collide
    this.x += dx;
    this.y += dy;

    // Wall collision
    this.collideWalls(level.walls);

    // Door collision (closed doors block movement)
    for (const d of level.doors) {
      if (!d.isOpen) {
        const resolved = resolveCircleRect(this.x, this.y, this.radius, d.x, d.y, d.w, d.h);
        if (resolved) {
          this.x = resolved.x;
          this.y = resolved.y;
        }
      }
    }

    // Button check (handled by game.js updateButtonsDoors, but keep flag)
    this.isOnButton = false;
    for (const btn of level.buttons) {
      if (circleRectOverlap(this.x, this.y, this.radius, btn.x, btn.y, btn.w, btn.h)) {
        this.isOnButton = true;
        break;
      }
    }

    // Loot check
    if (!level.loot.collected) {
      const loot = level.loot;
      const ldx = this.x - loot.x;
      const ldy = this.y - loot.y;
      if (Math.sqrt(ldx * ldx + ldy * ldy) < this.radius + loot.r) {
        level.loot.collected = true;
        this.hasLoot = true;
        level.exit.active = true;
        level.objectiveIndex = 2; // ESCAPE!
      }
    }

    // Trail recording
    this.trailTimer += dt;
    if (this.trailTimer >= 0.05 && len > 0) {
      this.trailTimer = 0;
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 80) this.trail.shift();
    }
  }

  collideWalls(walls) {
    for (const w of walls) {
      const resolved = resolveCircleRect(this.x, this.y, this.radius, w.x, w.y, w.w, w.h);
      if (resolved) {
        this.x = resolved.x;
        this.y = resolved.y;
      }
    }
  }

  /**
   * Check if player is in exit zone
   */
  checkExit(exit) {
    if (!exit.active || !this.hasLoot) return false;
    return circleRectOverlap(this.x, this.y, this.radius, exit.x, exit.y, exit.w, exit.h);
  }
}
