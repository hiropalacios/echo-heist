// Echo recording and replay for ECHO HEIST

import { circleRectOverlap } from './collision.js';
import { PLAYER_RADIUS } from './player.js';
import { Direction, getDirectionFromVector } from './direction.js';

const RECORD_INTERVAL = 1 / 15; // 15 fps recording

/**
 * Records player frames during an attempt
 */
export class EchoRecorder {
  constructor() {
    this.frames = [];
    this.timer = 0;
    this.elapsed = 0;
    this.recording = false;
  }

  start() {
    this.frames = [];
    this.timer = 0;
    this.elapsed = 0;
    this.recording = true;
  }

  stop() {
    this.recording = false;
    return this.frames.slice(); // return copy
  }

  update(dt, player) {
    if (!this.recording) return;
    this.elapsed += dt;
    this.timer += dt;

    if (this.timer >= RECORD_INTERVAL) {
      this.timer -= RECORD_INTERVAL;
      this.frames.push({
        t: this.elapsed,
        x: player.x,
        y: player.y,
        onButton: player.isOnButton,
        dir: player.facingDirection || Direction.DOWN,
        moving: player.moving || false,
      });
    }
  }
}

/**
 * Replays a recorded echo
 */
export class EchoReplayAgent {
  constructor(frames, echoNumber) {
    this.frames = frames;
    this.echoNumber = echoNumber;
    this.elapsed = 0;
    this.frameIndex = 0;
    this.x = frames.length > 0 ? frames[0].x : 0;
    this.y = frames.length > 0 ? frames[0].y : 0;
    this.isOnButton = false;
    this.playing = true;
    this.radius = PLAYER_RADIUS;
    this.trail = [];
    this.trailTimer = 0;
    this.facingDirection = (frames.length > 0 && frames[0].dir) ? frames[0].dir : Direction.DOWN;
    this.moving = false;
  }

  update(dt, level) {
    if (!this.playing || this.frames.length === 0) return;

    this.elapsed += dt;

    // Find the right frame
    while (this.frameIndex < this.frames.length - 1 &&
           this.frames[this.frameIndex + 1].t <= this.elapsed) {
      this.frameIndex++;
    }

    // End of recording
    if (this.frameIndex >= this.frames.length - 1) {
      const last = this.frames[this.frames.length - 1];
      this.x = last.x;
      this.y = last.y;
      this.isOnButton = last.onButton;
      this.moving = false;
      if (last.dir) this.facingDirection = last.dir;
      return;
    }

    // Lerp between current and next frame
    const cur = this.frames[this.frameIndex];
    const next = this.frames[this.frameIndex + 1];
    const frameDur = next.t - cur.t;
    const t = frameDur > 0 ? (this.elapsed - cur.t) / frameDur : 1;

    this.x = cur.x + (next.x - cur.x) * t;
    this.y = cur.y + (next.y - cur.y) * t;
    this.isOnButton = cur.onButton;

    // Replay recorded direction, or derive from position delta
    if (cur.dir) {
      this.facingDirection = cur.dir;
      this.moving = cur.moving || false;
    } else {
      const ddx = next.x - cur.x;
      const ddy = next.y - cur.y;
      const derived = getDirectionFromVector(ddx, ddy);
      if (derived) {
        this.facingDirection = derived;
        this.moving = true;
      } else {
        this.moving = false;
      }
    }

    // Trail
    this.trailTimer += dt;
    if (this.trailTimer >= 0.08) {
      this.trailTimer = 0;
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 50) this.trail.shift();
    }
  }

  /**
   * Check if this echo is currently on the pressure button
   */
  checkButton(button) {
    return circleRectOverlap(this.x, this.y, this.radius, button.x, button.y, button.w, button.h);
  }
}
