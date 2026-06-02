// Main game controller for ECHO HEIST

import { Player } from './player.js';
import { EchoRecorder, EchoReplayAgent } from './echo.js';
import { createLevel, resetLevel, getLevelData, LEVELS, LEVEL_WIDTH, LEVEL_HEIGHT, calculateStars } from './level.js';
import { BossStage } from './boss-stage.js';
import { updateCamera, initCamera, isInCameraCone, getConePoints } from './camera.js';
import { circleRectOverlap } from './collision.js';
import * as UI from './ui.js';
import * as Sprites from './sprites.js';
import { getDirectionFromAngle, getDirectionRenderInfo, Direction } from './direction.js';
import * as Save from './save.js';
import * as SFX from './sfx.js';

const STATE_START = 'start';
const STATE_PLAYING = 'playing';
const STATE_DETECTED = 'detected';
const STATE_TIMEOUT = 'timeout';
const STATE_SUCCESS = 'success';
const STATE_LEVEL_SELECT = 'level_select';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this.currentLevelIndex = 0;
    this.level = createLevel(0);
    this.levelData = getLevelData(0);
    this.player = new Player(this.levelData.spawn.x, this.levelData.spawn.y);
    this.recorder = new EchoRecorder();
    this.echoes = [];
    this.recordings = [];
    this.attempt = 1;
    this.state = STATE_START;
    this.elapsedTime = 0;
    this.detectionFlash = 0;
    this.glitchTimer = 0;
    this.glitchActive = false;
    this.pulseTime = 0;
    this.animFrame = 0;
    this.empFlash = 0;
    const params = new URLSearchParams(window.location.search);
    this.debug = params.get('debug') === 'true';
    this.requestedStage = params.get('stage');
    this._lootSoundPlayed = false;
    this.tutorialShown = JSON.parse(localStorage.getItem('echoheist_tutorials') || '{}');

    // Music
    this.music = new Audio('assets/music.mp3');
    this.music.loop = true;
    this.music.volume = 0.35;
    this.musicStarted = false;

    Save.load();

    for (const cam of this.level.cameras) initCamera(cam);

    // Check for special stage URL: ?stage=boss-1
    if (this.requestedStage === 'boss-1') {
      this.bossStage = new BossStage(canvas);
      this.bossStage.onResize(this.width, this.height);
      this.state = 'boss';
      UI.hideOverlay();
    } else {
      this.showLevelSelect();
    }
  }

  onResize(w, h) {
    this.width = w;
    this.height = h;
    // Fit level inside screen — always 100% visible, never overflows
    // Use 95% of available space to leave margin for HUD
    const usableW = w * 1.15;
    const usableH = h * 0.92;
    this.scale = Math.min(usableW / LEVEL_WIDTH, usableH / LEVEL_HEIGHT);
    this.offsetX = (w - LEVEL_WIDTH * this.scale) / 2;
    this.offsetY = (h - LEVEL_HEIGHT * this.scale) / 2;
    if (this.bossStage) this.bossStage.onResize(w, h);
  }

  gx(x) { return this.offsetX + x * this.scale; }
  gy(y) { return this.offsetY + y * this.scale; }
  gs(s) { return s * this.scale; }

  cancelAutoAdvance() {
    if (this._autoAdvanceTimer) {
      clearTimeout(this._autoAdvanceTimer);
      this._autoAdvanceTimer = null;
    }
  }

  loadBossLevel(bossData) {
    this.cancelAutoAdvance();
    this.currentLevelIndex = -1; // special
    this.levelData = bossData;
    this.level = {};
    // Manual reset using boss data directly
    this.level._index = -1;
    this.level._data = bossData;
    this.level.walls = bossData.walls.map(w => ({ ...w }));
    this.level.buttons = bossData.buttons.map(b => ({ ...b, isPressed: false }));
    this.level.doors = bossData.doors.map(d => ({ ...d, isOpen: false }));
    this.level.cameras = bossData.cameras.map(c => ({ ...c, direction: c.sweepCenter }));
    this.level.guards = bossData.guards.map(g => ({
      ...g, waypoints: g.waypoints.map(wp => ({ ...wp })),
      x: g.waypoints[0].x, y: g.waypoints[0].y,
      waypointIndex: 0, facingAngle: Math.PI / 2, facingDirection: 'down', guardMoving: false,
    }));
    this.level.loot = { ...bossData.loot, collected: false };
    this.level.exit = { ...bossData.exit, active: false };
    this.level.floorZones = bossData.floorZones || [];
    this.level.empPickups = (bossData.empPickups || []).map(e => ({ ...e, collected: false }));
    this.level.empActive = false;
    this.level.empTimer = 0;
    this.level.timer = bossData.timerDuration;
    this.level.objectiveIndex = 0;
    for (const cam of this.level.cameras) initCamera(cam);
    this.player.reset(bossData.spawn.x, bossData.spawn.y);
    this.echoes = [];
    this.recordings = [];
    this.attempt = 1;
    this.elapsedTime = 0;
    this._lootSoundPlayed = false;
    this.state = STATE_START;
    UI.showStartOverlay(bossData);
    UI.updateAttempt(1);
    UI.updateEchoCount(0);
    UI.updateLevelName(bossData.name);
  }

  showLevelSelect() {
    this.cancelAutoAdvance();
    this.state = STATE_LEVEL_SELECT;
    UI.showLevelSelectOverlay(this);
  }

  onSelectLevel(index) {
    if (!Save.isLevelUnlocked(index) && !this.debug) return;
    this.loadLevel(index);
    this.startPlaying();
  }

  loadLevel(index) {
    if (!Save.isLevelUnlocked(index) && !this.debug) return;
    this.cancelAutoAdvance();
    this.currentLevelIndex = index;
    this.levelData = getLevelData(index);
    this.level = createLevel(index);
    for (const cam of this.level.cameras) initCamera(cam);
    this.player.reset(this.levelData.spawn.x, this.levelData.spawn.y);
    this.echoes = [];
    this.recordings = [];
    this.attempt = 1;
    this.elapsedTime = 0;
    this._lootSoundPlayed = false;
    this.state = STATE_START;
    UI.showStartOverlay(this.levelData);
    UI.updateAttempt(1);
    UI.updateEchoCount(0);
    UI.updateLevelName(this.levelData.name);
  }

  startPlaying() {
    // Check tutorials first
    const tKey = this.getTutorialKey();
    if (tKey && !this.tutorialShown[tKey]) {
      this.showTutorialSequence(tKey);
      return;
    }

    this.state = STATE_PLAYING;
    this.recorder.start();
    UI.hideOverlay();
    UI.setAlarmState(false);
    UI.updateObjective(this.levelData.objectiveSequence[this.level.objectiveIndex]);

    // Start music on first user interaction (browser policy)
    if (!this.musicStarted) {
      this.music.play().catch(() => {});
      this.musicStarted = true;
    }
  }

  getTutorialKey() {
    if (this.currentLevelIndex === 0) return '1';
    if (this.currentLevelIndex === 1) return '2';
    if (this.currentLevelIndex === 2) return '3';
    return null;
  }

  markTutorialShown(key) {
    this.tutorialShown[key] = true;
    try { localStorage.setItem('echoheist_tutorials', JSON.stringify(this.tutorialShown)); } catch(e) {}
  }

  showTutorialSequence(key) {
    const sequences = {
      '1': ['1_start', '1_button', '1_echo'],
      '2': ['2_multi'],
      '3': ['3_cameras'],
    };
    const steps = sequences[key] || [];
    let i = 0;
    const showNext = () => {
      if (i >= steps.length) {
        this.markTutorialShown(key);
        this.state = STATE_PLAYING;
        this.recorder.start();
        UI.hideOverlay();
        UI.setAlarmState(false);
        UI.updateObjective(this.levelData.objectiveSequence[this.level.objectiveIndex]);
        if (!this.musicStarted) { this.music.play().catch(() => {}); this.musicStarted = true; }
        return;
      }
      UI.showTutorialOverlay(steps[i], () => { i++; showNext(); });
    };
    showNext();
  }

  onRetry() {
    if (this.state === STATE_START) { this.startPlaying(); return; }
    if (this.state === STATE_SUCCESS) return;
    this.cancelAutoAdvance();

    if (this.state === STATE_PLAYING) {
      const frames = this.recorder.stop();
      if (frames.length > 2) this.recordings.push(frames);
      this.attempt++;
    }

    SFX.echoCreate();
    this.glitchActive = true;
    this.glitchTimer = 0.3;

    if (this.currentLevelIndex === -1) {
      this.loadBossLevel(this.levelData);
    } else {
      resetLevel(this.level, this.currentLevelIndex);
    }
    for (const cam of this.level.cameras) initCamera(cam);
    this.player.reset(this.levelData.spawn.x, this.levelData.spawn.y);
    this.elapsedTime = 0;
    this._lootSoundPlayed = false;

    this.echoes = this.recordings.map((rec, i) => new EchoReplayAgent(rec, i + 1));

    this.state = STATE_PLAYING;
    this.recorder.start();
    UI.hideOverlay();
    UI.setAlarmState(false);
    UI.updateAttempt(this.attempt);
    UI.updateEchoCount(this.echoes.length);
    UI.updateObjective(this.levelData.objectiveSequence[0]);
  }

  onReset() {
    if (this.state === STATE_LEVEL_SELECT) return;
    if (this.state === STATE_SUCCESS) {
      this.cancelAutoAdvance();
      this.showLevelSelect();
      return;
    }
    if (this.state === STATE_START) { this.startPlaying(); return; }
    this.cancelAutoAdvance();
    this.glitchActive = true;
    this.glitchTimer = 0.3;

    if (this.currentLevelIndex === -1) {
      this.loadBossLevel(this.levelData);
    } else {
      resetLevel(this.level, this.currentLevelIndex);
    }
    for (const cam of this.level.cameras) initCamera(cam);
    this.player.reset(this.levelData.spawn.x, this.levelData.spawn.y);
    this.echoes = [];
    this.recordings = [];
    this.attempt = 1;
    this.elapsedTime = 0;
    this._lootSoundPlayed = false;
    this.state = STATE_PLAYING;
    this.recorder.start();
    UI.hideOverlay();
    UI.setAlarmState(false);
    UI.updateAttempt(1);
    UI.updateEchoCount(0);
    UI.updateObjective(this.levelData.objectiveSequence[0]);
  }

  activateEmp() {
    if (this.state !== STATE_PLAYING) return;
    if (this.player.empCharges <= 0 && !this.debug) return;
    if (this.level.empActive) return;
    this.player.empCharges--;
    this.level.empActive = true;
    this.level.empTimer = 3.0; // 3 seconds — cameras and guards disabled
    this.empFlash = 1.0; // white flash
    SFX.empActivate();
  }

  onNextLevel() {
    if (this.currentLevelIndex < LEVELS.length - 1) {
      this.loadLevel(this.currentLevelIndex + 1);
    }
  }

  onSkipLevel() {
    if (!this.debug) return;
    if (this.currentLevelIndex < LEVELS.length - 1) {
      this.loadLevel(this.currentLevelIndex + 1);
    } else {
      this.loadLevel(0); // wrap to first
    }
  }

  // ─── UPDATE ─────────────────────────────────────────────────────────
  update(dt, keys) {
    if (this.state === 'boss' && this.bossStage) {
      this.bossStage.update(dt, keys);
      // Retry on defeat
      if (this.bossStage.state === 'defeat' && (keys['r'] || keys[' '])) {
        this.bossStage = new BossStage(this.canvas);
        this.bossStage.onResize(this.width, this.height);
        keys['r'] = false;
        keys[' '] = false;
      }
      return;
    }

    this.pulseTime += dt;
    this.animFrame += dt * 8;

    if (this.glitchActive) {
      this.glitchTimer -= dt;
      if (this.glitchTimer <= 0) this.glitchActive = false;
    }

    if (this.state === STATE_LEVEL_SELECT) return;

    if (this.state === STATE_START) {
      for (const k in keys) { if (keys[k]) { this.startPlaying(); break; } }
      for (const cam of this.level.cameras) updateCamera(cam, dt);
      this.updateGuards(dt);
      return;
    }

    if (this.state !== STATE_PLAYING) return;

    this.elapsedTime += dt;
    this.level.timer -= dt;
    if (this.level.timer <= 10 && this.level.timer > 9.9) SFX.timerWarning();
    if (this.level.timer <= 5 && this.level.timer > 4.9) SFX.timerWarning();
    if (this.level.timer <= 0) {
      this.level.timer = 0;
      this.state = STATE_TIMEOUT;
      const frames = this.recorder.stop();
      if (frames.length > 2) this.recordings.push(frames);
      this.attempt++;
      UI.showTimerOverlay();
      UI.updateEchoCount(this.recordings.length);
      return;
    }

    // Player
    this.player.update(dt, keys, this.level);
    this.recorder.update(dt, this.player);

    // Echoes
    for (const echo of this.echoes) echo.update(dt, this.level);

    // Buttons + doors logic
    this.updateButtonsDoors();

    // Objectives
    this.updateObjectives();

    // EMP pickups — collect by walking over
    for (const emp of this.level.empPickups) {
      if (emp.collected) continue;
      const edx = this.player.x - emp.x;
      const edy = this.player.y - emp.y;
      if (Math.sqrt(edx * edx + edy * edy) < this.player.radius + emp.r) {
        emp.collected = true;
        this.player.empCharges++;
        SFX.empPickup();
      }
    }

    // EMP active timer — disables cameras and guards completely
    if (this.level.empActive) {
      this.level.empTimer -= dt;
      if (this.level.empTimer <= 0) {
        this.level.empActive = false;
        this.level.empTimer = 0;
      }
    }

    // EMP flash fade
    if (this.empFlash > 0) {
      this.empFlash -= dt * 2.5; // fades over ~0.4s
      if (this.empFlash < 0) this.empFlash = 0;
    }

    // Cameras — disabled during EMP (no detection, no movement)
    if (!this.level.empActive) {
      for (const cam of this.level.cameras) {
        if (isInCameraCone(cam, this.player.x, this.player.y, this.player.radius)) {
          this.triggerDetection('The security camera spotted you.');
          return;
        }
        updateCamera(cam, dt);
      }
    }

    // Guards — disabled during EMP (no detection, no movement)
    if (!this.level.empActive) {
      for (const guard of this.level.guards) {
        if (this.isInGuardCone(guard, this.player.x, this.player.y, this.player.radius)) {
          this.triggerDetection('A guard spotted you.');
          return;
        }
      }
      this.updateGuards(dt);
    }

    // Exit
    if (this.player.checkExit(this.level.exit)) {
      this.state = STATE_SUCCESS;
      SFX.missionComplete();
      this.recorder.stop();
      const stars = calculateStars(this.levelData, this.attempt, this.echoes.length, this.elapsedTime);
      const hasNext = this.currentLevelIndex < LEVELS.length - 1;
      UI.showSuccessOverlay(this.elapsedTime, this.attempt, this.echoes.length, stars, hasNext);
      Save.completeLevel(this.currentLevelIndex, stars);

      // Auto-advance to next level after 3 seconds
      if (hasNext) {
        this._autoAdvanceTimer = setTimeout(() => {
          if (this.state === STATE_SUCCESS) {
            this.loadLevel(this.currentLevelIndex + 1);
          }
        }, 3000);
      }
      return;
    }

    UI.updateTimer(this.level.timer);
    UI.updateAttempt(this.attempt);
    UI.updateEchoCount(this.echoes.length);
  }

  updateButtonsDoors() {
    // Reset all doors
    for (const door of this.level.doors) door.isOpen = false;

    for (const btn of this.level.buttons) {
      // Check if player or any echo is on button
      let pressed = circleRectOverlap(this.player.x, this.player.y, this.player.radius, btn.x, btn.y, btn.w, btn.h);
      if (!pressed) {
        for (const echo of this.echoes) {
          if (circleRectOverlap(echo.x, echo.y, echo.radius, btn.x, btn.y, btn.w, btn.h)) {
            pressed = true;
            break;
          }
        }
      }
      btn.isPressed = pressed;

      if (pressed) {
        for (const doorId of btn.linkedDoors) {
          const door = this.level.doors.find(d => d.id === doorId);
          if (door) door.isOpen = true;
        }
      }
    }

    // Door open/close SFX
    for (const door of this.level.doors) {
      if (door.isOpen && !door._wasOpen) SFX.doorOpen();
      if (!door.isOpen && door._wasOpen) SFX.doorClose();
      door._wasOpen = door.isOpen;
    }

    // Update player isOnButton (for echo recording)
    this.player.isOnButton = this.level.buttons.some(btn =>
      circleRectOverlap(this.player.x, this.player.y, this.player.radius, btn.x, btn.y, btn.w, btn.h)
    );
  }

  updateObjectives() {
    if (!this.level.loot.collected) {
      const lx = this.level.loot.x, ly = this.level.loot.y;
      const dx = this.player.x - lx, dy = this.player.y - ly;
      if (Math.sqrt(dx * dx + dy * dy) < 3) {
        this.level.objectiveIndex = 1;
      } else {
        this.level.objectiveIndex = 0;
      }
    }
    if (this.level.loot.collected && !this._lootSoundPlayed) {
      SFX.lootCollect();
      this._lootSoundPlayed = true;
    }
    UI.updateObjective(this.levelData.objectiveSequence[this.level.objectiveIndex]);
  }

  updateGuards(dt) {
    for (const guard of this.level.guards) {
      const target = guard.waypoints[guard.waypointIndex];
      const gdx = target.x - guard.x;
      const gdy = target.y - guard.y;
      const dist = Math.sqrt(gdx * gdx + gdy * gdy);

      if (dist < 0.1) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        guard.guardMoving = false;
      } else {
        const nx = gdx / dist;
        const ny = gdy / dist;
        guard.x += nx * guard.speed * dt;
        guard.y += ny * guard.speed * dt;
        guard.facingAngle = Math.atan2(ny, nx);
        guard.facingDirection = getDirectionFromAngle(guard.facingAngle);
        guard.guardMoving = true;
      }
    }
  }

  isInGuardCone(guard, px, py, radius) {
    // Reuse the camera cone point-in-triangle logic
    const len = guard.coneLength;
    const angle = guard.facingAngle;
    const halfAngle = guard.coneAngle;

    const tip = { x: guard.x, y: guard.y };
    const left = {
      x: guard.x + Math.cos(angle - halfAngle) * len,
      y: guard.y + Math.sin(angle - halfAngle) * len,
    };
    const right = {
      x: guard.x + Math.cos(angle + halfAngle) * len,
      y: guard.y + Math.sin(angle + halfAngle) * len,
    };

    // Check center + 8 perimeter points
    const r = radius || 0.45;
    if (ptInTri(px, py, tip, left, right)) return true;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      if (ptInTri(px + Math.cos(a) * r, py + Math.sin(a) * r, tip, left, right)) return true;
    }
    return false;
  }

  triggerDetection(message) {
    SFX.alarm();
    this.state = STATE_DETECTED;
    this.player.alive = false;
    this.detectionFlash = 1.0;

    const frames = this.recorder.stop();
    if (frames.length > 2) this.recordings.push(frames);
    this.attempt++;

    UI.setAlarmState(true);
    UI.showDetectedOverlay(message);
    UI.updateEchoCount(this.recordings.length);
  }

  // ─── RENDER ─────────────────────────────────────────────────────────
  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.fillStyle = '#050911';
    ctx.fillRect(0, 0, w, h);

    if (this.state === 'boss' && this.bossStage) {
      this.bossStage.render();
      return;
    }

    if (this.glitchActive) { this.renderGlitch(ctx, w, h); return; }

    if (this.state === STATE_LEVEL_SELECT) {
      ctx.fillStyle = '#050911';
      ctx.fillRect(0, 0, w, h);
      return;
    }

    this.renderFloor(ctx);
    this.renderGrid(ctx);
    this.renderExit(ctx);

    // Camera cones
    for (const cam of this.level.cameras) this.renderCameraCone(ctx, cam);

    // Guard cones
    for (const guard of this.level.guards) this.renderGuardCone(ctx, guard);

    this.renderWalls(ctx);

    // Doors
    for (const door of this.level.doors) this.renderDoor(ctx, door);

    // Buttons
    for (const btn of this.level.buttons) this.renderButton(ctx, btn);

    this.renderLoot(ctx);

    // EMP pickups
    for (const emp of this.level.empPickups) this.renderEmpPickup(ctx, emp);

    // Camera mounts
    for (const cam of this.level.cameras) this.renderCameraMount(ctx, cam);

    // Guards
    for (const guard of this.level.guards) this.renderGuard(ctx, guard);

    // Trails
    for (const echo of this.echoes) this.renderTrail(ctx, echo.trail, 'rgba(24, 200, 255, 0.15)');
    this.renderTrail(ctx, this.player.trail, 'rgba(0, 229, 255, 0.2)');

    for (const echo of this.echoes) this.renderEcho(ctx, echo);
    if (this.player.alive) this.renderPlayer(ctx);

    if (this.detectionFlash > 0) {
      ctx.fillStyle = `rgba(255, 51, 92, ${this.detectionFlash * 0.3})`;
      ctx.fillRect(0, 0, w, h);
      this.detectionFlash -= 0.02;
    }

    this.renderVignette(ctx, w, h);

    // EMP flash — white burst that fades
    if (this.empFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.empFlash * 0.7})`;
      ctx.fillRect(0, 0, w, h);
    }

    // EMP active — subtle electric flicker on edges
    if (this.level.empActive) {
      const flicker = Math.random() * 0.03;
      ctx.fillStyle = `rgba(168, 85, 247, ${flicker})`;
      ctx.fillRect(0, 0, w, h);
    }

    // EMP HUD indicator
    if (this.player.empCharges > 0 || this.level.empActive || this.debug) {
      const dpr = window.devicePixelRatio || 1;
      const fs = 12 * dpr;
      const hx = w - 120 * dpr;
      const hy = h / 2;
      ctx.fillStyle = 'rgba(11, 18, 32, 0.85)';
      ctx.fillRect(hx, hy, 110 * dpr, 30 * dpr);
      ctx.strokeStyle = this.level.empActive ? 'rgba(168, 85, 247, 0.8)' : 'rgba(168, 85, 247, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(hx, hy, 110 * dpr, 30 * dpr);
      ctx.fillStyle = this.level.empActive ? '#A855F7' : '#91A4B7';
      ctx.font = `bold ${fs}px Rajdhani, sans-serif`;
      ctx.textAlign = 'left';
      if (this.level.empActive) {
        ctx.fillText(`EMP ⚡ ${this.level.empTimer.toFixed(1)}s`, hx + 8 * dpr, hy + 20 * dpr);
      } else {
        ctx.fillText(`EMP x${this.player.empCharges} [E]`, hx + 8 * dpr, hy + 20 * dpr);
      }
    }

    // Debug overlay
    if (this.debug) {
      const dpr = window.devicePixelRatio || 1;
      const fs = 16 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, h - 28 * dpr, w, 28 * dpr);
      ctx.fillStyle = '#A855F7';
      ctx.font = `bold ${fs}px JetBrains Mono, monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(`DEBUG  Stage ${this.currentLevelIndex + 1}/${LEVELS.length}  "${this.levelData.name}"  |  N = skip`, 8 * dpr, h - 9 * dpr);
    }
  }

  renderFloor(ctx) {
    const fx = this.gx(0.5), fy = this.gy(0.5);
    const fw = this.gs(LEVEL_WIDTH - 1), fh = this.gs(LEVEL_HEIGHT - 1);
    ctx.fillStyle = '#0A0F1A';
    ctx.fillRect(fx, fy, fw, fh);

    // Subtle center glow
    const centerGrad = ctx.createRadialGradient(fx + fw/2, fy + fh/2, 0, fx + fw/2, fy + fh/2, fw * 0.5);
    centerGrad.addColorStop(0, 'rgba(0, 229, 255, 0.03)');
    centerGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = centerGrad;
    ctx.fillRect(fx, fy, fw, fh);

    for (const zone of this.level.floorZones) {
      ctx.fillStyle = zone.color;
      ctx.fillRect(this.gx(zone.x), this.gy(zone.y), this.gs(zone.w), this.gs(zone.h));
      // Zone border glow
      ctx.shadowColor = 'rgba(0, 229, 255, 0.3)';
      ctx.shadowBlur = this.gs(0.15);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.gx(zone.x), this.gy(zone.y), this.gs(zone.w), this.gs(zone.h));
      ctx.shadowBlur = 0;
    }
  }

  renderGrid(ctx) {
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 1; x < LEVEL_WIDTH; x++) {
      ctx.beginPath(); ctx.moveTo(this.gx(x), this.gy(0.5)); ctx.lineTo(this.gx(x), this.gy(LEVEL_HEIGHT - 0.5)); ctx.stroke();
    }
    for (let y = 1; y < LEVEL_HEIGHT; y++) {
      ctx.beginPath(); ctx.moveTo(this.gx(0.5), this.gy(y)); ctx.lineTo(this.gx(LEVEL_WIDTH - 0.5), this.gy(y)); ctx.stroke();
    }
    // Brighter grid at intersections (node dots)
    ctx.fillStyle = 'rgba(0, 229, 255, 0.07)';
    for (let x = 1; x < LEVEL_WIDTH; x++) {
      for (let y = 1; y < LEVEL_HEIGHT; y++) {
        ctx.beginPath(); ctx.arc(this.gx(x), this.gy(y), 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  renderWalls(ctx) {
    for (const wall of this.level.walls) {
      const wx = this.gx(wall.x), wy = this.gy(wall.y);
      const ww = this.gs(wall.w), wh = this.gs(wall.h);

      // Main wall fill with vertical gradient (3D effect)
      const wallGrad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
      wallGrad.addColorStop(0, '#1E2A3C');
      wallGrad.addColorStop(1, '#0F1822');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(wx, wy, ww, wh);

      // Lighter top edge (architectural highlight)
      ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
      ctx.fillRect(wx, wy, ww, Math.max(2, this.gs(0.05)));

      // Inner shadow at bottom
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(wx, wy + wh - Math.max(2, this.gs(0.05)), ww, Math.max(2, this.gs(0.05)));

      // Cyan edge glow border
      ctx.shadowColor = 'rgba(0, 229, 255, 0.4)';
      ctx.shadowBlur = this.gs(0.12);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(wx, wy, ww, wh);
      ctx.shadowBlur = 0;
    }
  }

  renderDoor(ctx, d) {
    // Connection lines from linked buttons (animated glow pulse)
    for (const btn of this.level.buttons) {
      if (btn.isPressed && btn.linkedDoors.includes(d.id)) {
        const bx = this.gx(btn.x + btn.w / 2), by = this.gy(btn.y + btn.h / 2);
        const dx = this.gx(d.x + d.w / 2), dy = this.gy(d.y + d.h / 2);
        const dashOffset = this.pulseTime * 40;
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0, 229, 255, 0.6)';
        ctx.shadowBlur = 6;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -dashOffset;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(dx, dy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
        ctx.shadowBlur = 0;
      }
    }

    const dcx = this.gx(d.x + d.w / 2);
    const dcy = this.gy(d.y + d.h / 2);
    const dw = this.gs(d.w);
    const dh = this.gs(d.h);
    const spriteName = d.isOpen ? 'doorOpen' : 'doorClosed';

    if (!Sprites.drawSprite(ctx, spriteName, dcx, dcy, dw, dh)) {
      // Fallback: canvas primitives
      if (d.isOpen) {
        // Green shimmer effect
        const shimmer = Math.sin(this.pulseTime * 5) * 0.15 + 0.35;
        ctx.fillStyle = `rgba(0, 208, 132, ${shimmer})`;
        ctx.fillRect(this.gx(d.x), this.gy(d.y), dw, dh);
        ctx.shadowColor = 'rgba(0, 208, 132, 0.7)';
        ctx.shadowBlur = this.gs(0.3);
        ctx.strokeStyle = '#00D084';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(this.gx(d.x), this.gy(d.y), dw, dh);
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
      } else {
        // Red glow pulse on closed door
        const redPulse = Math.sin(this.pulseTime * 3) * 0.15 + 0.85;
        ctx.fillStyle = '#2A1520';
        ctx.fillRect(this.gx(d.x), this.gy(d.y), dw, dh);
        ctx.shadowColor = `rgba(255, 51, 92, ${redPulse * 0.6})`;
        ctx.shadowBlur = this.gs(0.4);
        ctx.strokeStyle = `rgba(255, 51, 92, ${redPulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.gx(d.x), this.gy(d.y), dw, dh);
        ctx.shadowBlur = 0;
        // Lock X symbol
        const s = this.gs(0.3);
        ctx.strokeStyle = `rgba(255, 51, 92, ${redPulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(dcx - s, dcy - s); ctx.lineTo(dcx + s, dcy + s);
        ctx.moveTo(dcx + s, dcy - s); ctx.lineTo(dcx - s, dcy + s);
        ctx.stroke();
      }
    }
  }

  renderButton(ctx, btn) {
    const pulse = Math.sin(this.pulseTime * 3) * 0.2 + 0.8;
    const label = btn.label || 'BTN';
    const cx = this.gx(btn.x + btn.w / 2);
    const cy = this.gy(btn.y + btn.h / 2);
    const sw = this.gs(btn.w);
    const sh = this.gs(btn.h);
    const spriteName = btn.isPressed ? 'buttonOn' : 'buttonOff';

    if (!Sprites.drawSprite(ctx, spriteName, cx, cy, sw, sh)) {
      // Fallback: canvas primitives
      if (btn.isPressed) {
        // Circular glow halo when pressed
        const haloR = Math.max(sw, sh) * 0.8;
        const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
        haloGrad.addColorStop(0, `rgba(0, 229, 255, ${0.25 * pulse})`);
        haloGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath(); ctx.arc(cx, cy, haloR, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = `rgba(0, 229, 255, ${0.4 * pulse})`;
        ctx.fillRect(this.gx(btn.x), this.gy(btn.y), sw, sh);
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = this.gs(0.6);
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.gx(btn.x), this.gy(btn.y), sw, sh);
        ctx.shadowBlur = 0;
      } else {
        // Pulsing ring invitation
        const ringPulse = Math.sin(this.pulseTime * 2.5) * 0.15 + 0.2;
        const ringR = Math.max(sw, sh) * 0.6;
        ctx.strokeStyle = `rgba(0, 229, 255, ${ringPulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
        ctx.fillRect(this.gx(btn.x), this.gy(btn.y), sw, sh);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.gx(btn.x), this.gy(btn.y), sw, sh);
      }
    }

    ctx.fillStyle = btn.isPressed ? '#00E5FF' : 'rgba(0, 229, 255, 0.6)';
    ctx.font = `bold ${this.gs(0.45)}px Rajdhani, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, this.gy(btn.y + btn.h / 2 + 0.12));
  }

  renderLoot(ctx) {
    const loot = this.level.loot;
    if (loot.collected) return;
    const pulse = Math.sin(this.pulseTime * 4) * 0.15 + 0.85;
    const cx = this.gx(loot.x), cy = this.gy(loot.y), r = this.gs(loot.r);
    const size = this.gs(1.3);

    // Rotating glow ring
    const glowR = r * 2.2;
    const rotAngle = this.pulseTime * 1.5;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotAngle);
    const glowGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, glowR);
    glowGrad.addColorStop(0, 'rgba(255, 209, 102, 0.25)');
    glowGrad.addColorStop(0.7, 'rgba(255, 209, 102, 0.05)');
    glowGrad.addColorStop(1, 'rgba(255, 209, 102, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Orbiting sparkle particles
    for (let i = 0; i < 5; i++) {
      const angle = rotAngle * 2 + (i * Math.PI * 2 / 5);
      const dist = r * 1.8;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      const sparkAlpha = Math.sin(this.pulseTime * 6 + i) * 0.3 + 0.5;
      ctx.fillStyle = `rgba(255, 230, 150, ${sparkAlpha})`;
      ctx.beginPath(); ctx.arc(sx, sy, this.gs(0.06), 0, Math.PI * 2); ctx.fill();
    }

    // Gold glow effect
    ctx.shadowColor = '#FFD166'; ctx.shadowBlur = this.gs(1.2);

    if (!Sprites.drawSpriteAlpha(ctx, 'loot', cx, cy, size, size, pulse)) {
      // Fallback: canvas diamond
      ctx.fillStyle = `rgba(255, 209, 102, ${pulse})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 1.3); ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r * 1.3); ctx.lineTo(cx - r, cy);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#FFD166'; ctx.lineWidth = 2; ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFD166'; ctx.font = `bold ${this.gs(0.3)}px Rajdhani, sans-serif`;
    ctx.textAlign = 'center'; ctx.fillText('LOOT', cx, cy + this.gs(1));
  }

  renderEmpPickup(ctx, emp) {
    if (emp.collected) return;
    const cx = this.gx(emp.x), cy = this.gy(emp.y);
    const r = this.gs(emp.r);
    const pulse = Math.sin(this.pulseTime * 5) * 0.2 + 0.8;

    // Purple glow
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
    glowGrad.addColorStop(0, `rgba(168, 85, 247, ${0.2 * pulse})`);
    glowGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath(); ctx.arc(cx, cy, r * 3, 0, Math.PI * 2); ctx.fill();

    // Lightning bolt shape
    ctx.shadowColor = '#A855F7'; ctx.shadowBlur = this.gs(0.5);
    ctx.fillStyle = `rgba(168, 85, 247, ${pulse})`;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy - r * 1.2);
    ctx.lineTo(cx + r * 0.6, cy - r * 0.2);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + r * 0.3, cy + r * 1.2);
    ctx.lineTo(cx - r * 0.6, cy + r * 0.2);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label
    ctx.fillStyle = '#A855F7';
    ctx.font = `bold ${this.gs(0.25)}px Rajdhani, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('EMP', cx, cy + this.gs(0.8));
  }

  renderExit(ctx) {
    const exit = this.level.exit;
    const pulse = Math.sin(this.pulseTime * 2.5) * 0.15 + 0.5;
    const cx = this.gx(exit.x + exit.w / 2);
    const cy = this.gy(exit.y + exit.h / 2);
    const ew = this.gs(exit.w);
    const eh = this.gs(exit.h);

    if (exit.active) {
      const alpha = 0.6 + pulse * 0.3;
      if (!Sprites.drawSpriteAlpha(ctx, 'escapeZone', cx, cy, ew, eh, alpha)) {
        // Fallback: canvas primitives
        ctx.fillStyle = `rgba(0, 208, 132, ${0.15 + pulse * 0.1})`;
        ctx.fillRect(this.gx(exit.x), this.gy(exit.y), ew, eh);

        // Pulsing border rings
        for (let i = 0; i < 3; i++) {
          const ringPulse = Math.sin(this.pulseTime * 3 + i * 0.8) * 0.2 + 0.5;
          const inset = this.gs(0.08) * i;
          ctx.strokeStyle = `rgba(0, 208, 132, ${ringPulse * (1 - i * 0.25)})`;
          ctx.lineWidth = 2 - i * 0.5;
          ctx.strokeRect(this.gx(exit.x) - inset, this.gy(exit.y) - inset, ew + inset * 2, eh + inset * 2);
        }
      }

      // Upward floating particles
      for (let i = 0; i < 6; i++) {
        const pTime = (this.pulseTime + i * 0.4) % 2;
        const py = cy - (pTime / 2) * eh * 0.6;
        const px = cx + Math.sin(i * 1.7 + this.pulseTime) * ew * 0.3;
        const pAlpha = 1 - pTime / 2;
        ctx.fillStyle = `rgba(0, 208, 132, ${pAlpha * 0.5})`;
        ctx.beginPath(); ctx.arc(px, py, this.gs(0.05), 0, Math.PI * 2); ctx.fill();
      }

      ctx.shadowColor = 'rgba(0, 208, 132, 0.8)';
      ctx.shadowBlur = this.gs(0.4);
      ctx.fillStyle = '#00D084'; ctx.font = `bold ${this.gs(0.4)}px Rajdhani, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', cx, this.gy(exit.y + exit.h / 2 + 0.15));
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = 'rgba(0, 208, 132, 0.04)';
      ctx.fillRect(this.gx(exit.x), this.gy(exit.y), ew, eh);
      ctx.strokeStyle = 'rgba(0, 208, 132, 0.15)'; ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(this.gx(exit.x), this.gy(exit.y), ew, eh);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(0, 208, 132, 0.3)'; ctx.font = `${this.gs(0.3)}px Rajdhani, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', cx, this.gy(exit.y + exit.h / 2 + 0.1));
    }
  }

  renderCameraCone(ctx, cam) {
    // EMP active: cone disabled — draw dim grey
    if (this.level.empActive) {
      const cone = getConePoints(cam);
      ctx.fillStyle = 'rgba(80, 80, 100, 0.04)';
      ctx.beginPath();
      ctx.moveTo(this.gx(cone.tip.x), this.gy(cone.tip.y));
      ctx.lineTo(this.gx(cone.left.x), this.gy(cone.left.y));
      ctx.lineTo(this.gx(cone.right.x), this.gy(cone.right.y));
      ctx.closePath(); ctx.fill();
      return;
    }
    const VISUAL_SCALE = 1.15;
    const cone = getConePoints(cam);
    const detected = this.state === STATE_DETECTED;
    // Scale the left/right points outward from tip by 15%
    const tipX = this.gx(cone.tip.x), tipY = this.gy(cone.tip.y);
    const rawLX = this.gx(cone.left.x), rawLY = this.gy(cone.left.y);
    const rawRX = this.gx(cone.right.x), rawRY = this.gy(cone.right.y);
    const leftX = tipX + (rawLX - tipX) * VISUAL_SCALE;
    const leftY = tipY + (rawLY - tipY) * VISUAL_SCALE;
    const rightX = tipX + (rawRX - tipX) * VISUAL_SCALE;
    const rightY = tipY + (rawRY - tipY) * VISUAL_SCALE;

    // Gradient fill from tip (opaque) to edges (transparent)
    const midX = (leftX + rightX) / 2, midY = (leftY + rightY) / 2;
    const dist = Math.hypot(midX - tipX, midY - tipY);
    const grad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, dist);
    if (detected) {
      grad.addColorStop(0, 'rgba(255, 23, 68, 0.35)');
      grad.addColorStop(1, 'rgba(255, 23, 68, 0.02)');
    } else {
      grad.addColorStop(0, 'rgba(255, 23, 68, 0.15)');
      grad.addColorStop(1, 'rgba(255, 23, 68, 0.01)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath(); ctx.fill();

    // Animated scan line
    const scanT = (this.pulseTime * 0.8) % 1;
    const scanX = tipX + (midX - tipX) * scanT;
    const scanY = tipY + (midY - tipY) * scanT;
    const scanAlpha = (1 - scanT) * 0.4;
    ctx.strokeStyle = `rgba(255, 23, 68, ${scanAlpha})`;
    ctx.lineWidth = 1.5;
    const perpX = (rightX - leftX) * scanT * 0.5;
    const perpY = (rightY - leftY) * scanT * 0.5;
    ctx.beginPath();
    ctx.moveTo(scanX - perpX, scanY - perpY);
    ctx.lineTo(scanX + perpX, scanY + perpY);
    ctx.stroke();

    ctx.strokeStyle = detected ? 'rgba(255, 23, 68, 0.5)' : 'rgba(255, 23, 68, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY); ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY); ctx.closePath(); ctx.stroke();
  }

  renderCameraMount(ctx, cam) {
    const cx = this.gx(cam.x), cy = this.gy(cam.y), r = this.gs(0.35);
    const size = this.gs(1.0);

    if (!Sprites.drawSprite(ctx, 'camera', cx, cy, size, size)) {
      // Fallback: canvas primitives
      ctx.fillStyle = '#1A2332';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FF1744';
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.fill();
    }

    // Pulsing red indicator (always drawn on top)
    const pulse = Math.sin(this.pulseTime * 5) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 23, 68, ${pulse * 0.5})`;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2); ctx.fill();
  }

  renderGuardCone(ctx, guard) {
    // EMP active: cone disabled
    if (this.level.empActive) return;
    const VISUAL_SCALE = 1.15;
    const len = guard.coneLength;
    const angle = guard.facingAngle;
    const halfAngle = guard.coneAngle;
    const detected = this.state === STATE_DETECTED;

    const tip = { x: guard.x, y: guard.y };
    const left = { x: guard.x + Math.cos(angle - halfAngle) * len, y: guard.y + Math.sin(angle - halfAngle) * len };
    const right = { x: guard.x + Math.cos(angle + halfAngle) * len, y: guard.y + Math.sin(angle + halfAngle) * len };

    const tipX = this.gx(tip.x), tipY = this.gy(tip.y);
    const rawLX = this.gx(left.x), rawLY = this.gy(left.y);
    const rawRX = this.gx(right.x), rawRY = this.gy(right.y);
    const leftX = tipX + (rawLX - tipX) * VISUAL_SCALE;
    const leftY = tipY + (rawLY - tipY) * VISUAL_SCALE;
    const rightX = tipX + (rawRX - tipX) * VISUAL_SCALE;
    const rightY = tipY + (rawRY - tipY) * VISUAL_SCALE;
    const midX = (leftX + rightX) / 2, midY = (leftY + rightY) / 2;
    const dist = Math.hypot(midX - tipX, midY - tipY);

    // Gradient fill
    const grad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, dist);
    if (detected) {
      grad.addColorStop(0, 'rgba(255, 23, 68, 0.3)');
      grad.addColorStop(1, 'rgba(255, 23, 68, 0.01)');
    } else {
      grad.addColorStop(0, 'rgba(255, 140, 0, 0.12)');
      grad.addColorStop(1, 'rgba(255, 140, 0, 0.01)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath(); ctx.fill();

    ctx.strokeStyle = detected ? 'rgba(255, 23, 68, 0.4)' : 'rgba(255, 140, 0, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY); ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY); ctx.closePath(); ctx.stroke();
  }

  renderGuard(ctx, guard) {
    const gx = this.gx(guard.x), gy = this.gy(guard.y);
    const r = this.gs(guard.radius);
    const size = this.gs(1.6);
    const isMoving = guard.guardMoving || false;
    const spriteName = isMoving ? 'guardWalk' : 'guardIdle';
    const guardDir = guard.facingDirection || Direction.DOWN;
    const dirInfo = getDirectionRenderInfo(guardDir);

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(gx, gy + size*0.35, size*0.3, size*0.12, 0, 0, Math.PI*2);
    ctx.fill();

    if (!Sprites.drawFrameDir(ctx, spriteName, this.animFrame, gx, gy, size, size, dirInfo)) {
      // Fallback: canvas primitives
      ctx.fillStyle = '#1A1015';
      ctx.beginPath(); ctx.arc(gx, gy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#FF335C';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(gx, gy, r, 0, Math.PI * 2); ctx.stroke();
    }

    // Red visor dot — follows facing angle
    const visorAngle = guard.facingAngle;
    const vx = Math.cos(visorAngle) * r * 0.5;
    const vy = Math.sin(visorAngle) * r * 0.5;
    ctx.fillStyle = '#FF335C';
    ctx.beginPath(); ctx.arc(gx + vx, gy + vy, r * 0.25, 0, Math.PI * 2); ctx.fill();

    // Direction indicator
    this.drawDirectionIndicator(ctx, gx, gy, r, dirInfo, '#FF335C', 0.6);

    // Label
    ctx.fillStyle = 'rgba(255, 51, 92, 0.7)';
    ctx.font = `bold ${this.gs(0.22)}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('GRD', gx, gy - r - this.gs(0.15));
  }

  renderTrail(ctx, trail, color) {
    if (trail.length < 2) return;
    for (let i = 0; i < trail.length; i += 3) {
      const alpha = (i / trail.length) * 0.6;
      const dotSize = this.gs(0.15 + (i / trail.length) * 0.15);
      const tx = this.gx(trail[i].x);
      const ty = this.gy(trail[i].y);

      if (!Sprites.drawSpriteAlpha(ctx, 'trailDot', tx, ty, dotSize, dotSize, alpha)) {
        // Fallback: canvas dot
        ctx.fillStyle = color; ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(tx, ty, dotSize * 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Draw a small directional arrow/chevron under the character
   * showing which way they face. This is the primary visual cue.
   */
  drawDirectionIndicator(ctx, cx, cy, r, dirInfo, color, alphaVal) {
    const angle = dirInfo.arrowAngle;
    if (angle === undefined) return;
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = alphaVal || 0.8;

    const dist = r + this.gs(0.15); // distance from center
    const ax = cx + Math.cos(angle) * dist;
    const ay = cy + Math.sin(angle) * dist;
    const arrowSize = this.gs(0.25);

    // Draw chevron pointing in direction
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(arrowSize, 0);
    ctx.lineTo(-arrowSize * 0.6, -arrowSize * 0.7);
    ctx.lineTo(-arrowSize * 0.2, 0);
    ctx.lineTo(-arrowSize * 0.6, arrowSize * 0.7);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();

    ctx.globalAlpha = prevAlpha;
  }

  renderPlayer(ctx) {
    const px = this.gx(this.player.x), py = this.gy(this.player.y), r = this.gs(this.player.radius);
    const size = this.gs(1.6);
    const isMoving = this.player.moving;
    const spriteName = isMoving ? 'playerWalk' : 'playerIdle';
    const dirInfo = getDirectionRenderInfo(this.player.facingDirection);

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px, py + size*0.35, size*0.3, size*0.12, 0, 0, Math.PI*2);
    ctx.fill();

    // Soft glow disc under player
    const glowPulse = Math.sin(this.pulseTime * 2) * 0.1 + 0.2;
    const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, r * 2);
    glowGrad.addColorStop(0, `rgba(0, 229, 255, ${glowPulse})`);
    glowGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath(); ctx.arc(px, py, r * 2, 0, Math.PI * 2); ctx.fill();

    if (!Sprites.drawFrameDir(ctx, spriteName, this.animFrame, px, py, size, size, dirInfo)) {
      // Fallback: canvas primitives with directional eyes
      const rimPulse = Math.sin(this.pulseTime * 3) * 0.3 + 0.7;
      ctx.shadowColor = `rgba(0, 229, 255, ${rimPulse})`; ctx.shadowBlur = this.gs(0.6);
      ctx.fillStyle = '#0A1628';
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(0, 229, 255, ${rimPulse})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;

      // Directional eyes
      if (!dirInfo.backFacing) {
        const es = this.gs(0.08), eo = this.gs(0.12);
        const oX = this.gs(dirInfo.eyeOffX);
        const oY = this.gs(dirInfo.eyeOffY);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(px - eo + oX, py - eo * 0.3 + oY, es, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + eo + oX, py - eo * 0.3 + oY, es, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Direction indicator arrow
    this.drawDirectionIndicator(ctx, px, py, r, dirInfo, '#00E5FF', 0.7);

    if (this.player.hasLoot) {
      ctx.shadowColor = '#FFD166'; ctx.shadowBlur = this.gs(0.3);
      ctx.fillStyle = '#FFD166'; ctx.font = `bold ${this.gs(0.3)}px Rajdhani, sans-serif`;
      ctx.textAlign = 'center'; ctx.fillText('LOOT', px, py - r - this.gs(0.3));
      ctx.shadowBlur = 0;
    }
  }

  renderEcho(ctx, echo) {
    const ex = this.gx(echo.x), ey = this.gy(echo.y), r = this.gs(echo.radius);
    const size = this.gs(1.6);
    const pulse = Math.sin(this.pulseTime * 3 + echo.echoNumber) * 0.1 + 0.5;
    const alpha = 0.4 + pulse * 0.2;
    const dirInfo = getDirectionRenderInfo(echo.facingDirection || Direction.DOWN);
    const echoSprite = echo.moving ? 'echoWalk' : 'echoIdle';

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(ex, ey + size*0.35, size*0.3, size*0.12, 0, 0, Math.PI*2);
    ctx.fill();

    // Soft cyan glow halo beneath
    const haloGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, r * 1.8);
    haloGrad.addColorStop(0, `rgba(24, 200, 255, ${0.12 * alpha})`);
    haloGrad.addColorStop(1, 'rgba(24, 200, 255, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath(); ctx.arc(ex, ey, r * 1.8, 0, Math.PI * 2); ctx.fill();

    if (!Sprites.drawFrameDir(ctx, echoSprite, this.animFrame + echo.echoNumber, ex, ey, size, size, dirInfo, alpha)) {
      // Fallback: canvas primitives
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(24, 200, 255, 0.15)';
      ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(24, 200, 255, ${0.5 + pulse * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.stroke();
      // Vertical scanlines
      ctx.strokeStyle = 'rgba(24, 200, 255, 0.12)'; ctx.lineWidth = 1;
      for (let lx = -r; lx < r; lx += this.gs(0.1)) {
        const hh = Math.sqrt(r * r - lx * lx) * 0.9;
        if (hh > 0) { ctx.beginPath(); ctx.moveTo(ex + lx, ey - hh); ctx.lineTo(ex + lx, ey + hh); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
    }

    // Direction indicator
    this.drawDirectionIndicator(ctx, ex, ey, r, dirInfo, 'rgba(24, 200, 255, 0.6)', alpha * 0.7);

    // Echo label (always drawn)
    ctx.fillStyle = 'rgba(24, 200, 255, 0.7)';
    ctx.font = `bold ${this.gs(0.25)}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`E${echo.echoNumber}`, ex, ey - r - this.gs(0.15));
  }

  renderGlitch(ctx, w, h) {
    const progress = this.glitchTimer / 0.3;
    ctx.fillStyle = '#050911'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 12; i++) {
      const y = (i / 12) * h, sliceH = h / 12;
      const offset = (Math.random() - 0.5) * this.gs(2) * progress;
      ctx.fillStyle = i % 2 === 0 ? `rgba(0, 229, 255, ${0.15 * progress})` : `rgba(168, 85, 247, ${0.1 * progress})`;
      ctx.fillRect(offset, y, w, sliceH);
    }
    ctx.fillStyle = `rgba(0, 229, 255, ${progress * 0.4})`; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#00E5FF'; ctx.font = `bold ${this.gs(0.8)}px Rajdhani, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('CREATING ECHO...', w / 2, h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  renderVignette(ctx, w, h) {
    // Stronger cinematic vignette
    const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7);
    gradient.addColorStop(0, 'rgba(5, 9, 17, 0)');
    gradient.addColorStop(0.7, 'rgba(5, 9, 17, 0.25)');
    gradient.addColorStop(1, 'rgba(5, 9, 17, 0.6)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);

    // Subtle horizontal scan lines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }

    if (this.state === STATE_DETECTED) {
      const rg = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.6);
      rg.addColorStop(0, 'rgba(255, 51, 92, 0)');
      rg.addColorStop(1, 'rgba(255, 51, 92, 0.2)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    }
  }
}

function ptInTri(px, py, tip, left, right) {
  const d1 = (px - left.x) * (tip.y - left.y) - (tip.x - left.x) * (py - left.y);
  const d2 = (px - right.x) * (left.y - right.y) - (left.x - right.x) * (py - right.y);
  const d3 = (px - tip.x) * (right.y - tip.y) - (right.x - tip.x) * (py - tip.y);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}
