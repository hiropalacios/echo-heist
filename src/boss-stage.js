// Boss Stage — ECHO HEIST Boss Fight Mode
// Layered rendering: baseBody from boss1.png, all FX from boss1-skills.png

import { FireEchoBoss, BOSS_POSES, SKILL_FX, getBossSrcRect, getSkillSrcRect } from './boss.js';

const ARENA_W = 600;
const ARENA_H = 500;
const PLAYER_SPEED = 200;
const PLAYER_RADIUS = 16;
const PLAYER_ATTACK_DMG = 10;
const PLAYER_ATTACK_RANGE = 60;
const PLAYER_ATTACK_CD = 0.4;

export class BossStage {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = canvas.width;
    this.h = canvas.height;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    // Load NEW clean sprite sheets
    this.bossImg = new Image();
    this.bossImg.src = 'assets/boss1.png';
    this.skillsImg = new Image();
    this.skillsImg.src = 'assets/boss1-skills.png';

    this.player = {
      x: ARENA_W / 2, y: ARENA_H - 80,
      radius: PLAYER_RADIUS, hp: 100, maxHp: 100,
      speed: PLAYER_SPEED, alive: true,
      attackCooldown: 0, invulnTimer: 0,
    };

    this.boss = new FireEchoBoss(ARENA_W / 2, 100);
    this.state = 'fighting';
    this.time = 0;
    this.damageFlash = 0;
    this.victoryTimer = 0;
  }

  onResize(w, h) {
    this.w = w; this.h = h;
    const sx = (w * 0.9) / ARENA_W;
    const sy = (h * 0.85) / ARENA_H;
    this.scale = Math.min(sx, sy);
    this.offsetX = (w - ARENA_W * this.scale) / 2;
    this.offsetY = (h - ARENA_H * this.scale) / 2;
  }

  sx(x) { return this.offsetX + x * this.scale; }
  sy(y) { return this.offsetY + y * this.scale; }
  ss(s) { return s * this.scale; }

  // ─── Draw helpers for spritesheets ──────────────────────────
  drawBossPose(ctx, pose, cx, cy, size) {
    if (!this.bossImg.complete) {
      ctx.fillStyle = '#FF3020';
      ctx.beginPath(); ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2); ctx.fill();
      return;
    }
    const r = getBossSrcRect(pose);
    ctx.drawImage(this.bossImg, r.sx, r.sy, r.sw, r.sh, cx - size / 2, cy - size * 0.7, size, size * 1.4);
  }

  drawSkillFx(ctx, fx, cx, cy, size, alpha) {
    if (!this.skillsImg.complete) return;
    const r = getSkillSrcRect(fx);
    const prev = ctx.globalAlpha;
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.drawImage(this.skillsImg, r.sx, r.sy, r.sw, r.sh, cx - size / 2, cy - size / 2, size, size);
    ctx.globalAlpha = prev;
  }

  drawSkillFxRotated(ctx, fx, cx, cy, size, angle, alpha) {
    if (!this.skillsImg.complete) return;
    const r = getSkillSrcRect(fx);
    const prev = ctx.globalAlpha;
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.drawImage(this.skillsImg, r.sx, r.sy, r.sw, r.sh, -size / 2, -size / 2, size, size);
    ctx.restore();
    ctx.globalAlpha = prev;
  }

  // ─── UPDATE ─────────────────────────────────────────────────
  update(dt, keys) {
    if (this.state !== 'fighting') { this.victoryTimer += dt; return; }
    this.time += dt;
    if (this.damageFlash > 0) this.damageFlash -= dt * 3;

    const p = this.player;
    if (p.alive) {
      let dx = 0, dy = 0;
      if (keys['w'] || keys['arrowup']) dy -= 1;
      if (keys['s'] || keys['arrowdown']) dy += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) { p.x += (dx / len) * p.speed * dt; p.y += (dy / len) * p.speed * dt; }
      p.x = Math.max(p.radius, Math.min(ARENA_W - p.radius, p.x));
      p.y = Math.max(p.radius, Math.min(ARENA_H - p.radius, p.y));
      if (p.attackCooldown > 0) p.attackCooldown -= dt;
      if (p.invulnTimer > 0) p.invulnTimer -= dt;
    }

    this.boss.update(dt, p.x, p.y);

    // Damage from boss attacks
    if (p.alive && p.invulnTimer <= 0) {
      const dmg = this.boss.checkPlayerHit(p.x, p.y, p.radius);
      if (dmg > 0) {
        p.hp -= dmg; p.invulnTimer = 0.5; this.damageFlash = 1;
        if (p.hp <= 0) { p.hp = 0; p.alive = false; this.state = 'defeat'; }
      }
      // Contact damage
      const bd = Math.sqrt((p.x - this.boss.x) ** 2 + (p.y - this.boss.y) ** 2);
      if (bd < p.radius + this.boss.radius) { p.hp -= 10 * dt; this.damageFlash = 0.3; }
    }

    // Player attacks boss (E / Space)
    if (p.alive && p.attackCooldown <= 0 && (keys['e'] || keys[' '])) {
      const d = Math.sqrt((p.x - this.boss.x) ** 2 + (p.y - this.boss.y) ** 2);
      if (d < PLAYER_ATTACK_RANGE + this.boss.radius) {
        this.boss.takeDamage(PLAYER_ATTACK_DMG);
        p.attackCooldown = PLAYER_ATTACK_CD;
      }
      keys['e'] = false; keys[' '] = false;
    }

    if (!this.boss.alive) { this.state = 'victory'; this.victoryTimer = 0; }
  }

  // ─── RENDER ─────────────────────────────────────────────────
  render() {
    const ctx = this.ctx;
    const w = this.w, h = this.h;

    // Background
    ctx.fillStyle = '#050911';
    ctx.fillRect(0, 0, w, h);

    // Arena floor
    const ax = this.sx(0), ay = this.sy(0), aw = this.ss(ARENA_W), ah = this.ss(ARENA_H);
    ctx.fillStyle = '#0A0E14';
    ctx.fillRect(ax, ay, aw, ah);

    // Fire-tinted grid
    ctx.strokeStyle = 'rgba(255, 50, 20, 0.05)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= ARENA_W; gx += 40) { ctx.beginPath(); ctx.moveTo(this.sx(gx), ay); ctx.lineTo(this.sx(gx), ay + ah); ctx.stroke(); }
    for (let gy = 0; gy <= ARENA_H; gy += 40) { ctx.beginPath(); ctx.moveTo(ax, this.sy(gy)); ctx.lineTo(ax + aw, this.sy(gy)); ctx.stroke(); }

    // Arena border
    ctx.strokeStyle = 'rgba(255, 60, 20, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ax, ay, aw, ah);

    // Ground effects (below characters)
    this.renderGroundEffects(ctx);

    // Boss — layered: aura → body → cast FX
    this.renderBoss(ctx);

    // Projectiles
    this.renderProjectiles(ctx);

    // Player
    this.renderPlayer(ctx);

    // Damage flash
    if (this.damageFlash > 0) {
      ctx.fillStyle = `rgba(255, 40, 20, ${this.damageFlash * 0.25})`;
      ctx.fillRect(0, 0, w, h);
    }

    // HUD
    this.renderHUD(ctx, w, h);

    // Victory/Defeat
    if (this.state === 'victory') this.renderOverlay(ctx, w, h, 'BOSS DEFEATED', '#FFD166', `Time: ${this.time.toFixed(1)}s`);
    if (this.state === 'defeat') this.renderOverlay(ctx, w, h, 'DEFEATED', '#FF335C', 'Press R to retry');
  }

  renderBoss(ctx) {
    const b = this.boss;
    if (!b.alive && this.victoryTimer > 1.5) return;

    const bx = this.sx(b.x);
    const by = this.sy(b.y + b.floatOffset);
    const bodySize = this.ss(100);
    const shakeX = b.castShake > 0 ? (Math.random() - 0.5) * 6 : 0;
    const shakeY = b.castShake > 0 ? (Math.random() - 0.5) * 6 : 0;

    // Layer 1: Aura (from skills sheet — fire aura behind body)
    const auraSize = bodySize * 1.4;
    this.drawSkillFx(ctx, SKILL_FX.fireBurst, bx, by + bodySize * 0.1, auraSize, b.auraAlpha * 0.5);

    // Layer 2: Base body (from boss1.png — clean, no fire baked in)
    this.drawBossPose(ctx, b.currentPose, bx + shakeX, by + shakeY, bodySize);

    // Layer 3: Cast overlay (fire particles around body when casting)
    if (b.state === 'casting') {
      const castSize = bodySize * 0.6;
      const castAlpha = Math.sin(b.stateTimer * 20) * 0.3 + 0.5;
      this.drawSkillFx(ctx, SKILL_FX.particles, bx + shakeX, by - bodySize * 0.2 + shakeY, castSize, castAlpha);
    }

    // Debug: state label
    ctx.fillStyle = '#FF8040';
    ctx.font = `bold ${this.ss(10)}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(b.state.toUpperCase(), bx, by - bodySize * 0.85);
  }

  renderGroundEffects(ctx) {
    for (const e of this.boss.effects) {
      const ex = this.sx(e.x), ey = this.sy(e.y);

      if (e.type === 'meteor_mark') {
        const r = this.ss(e.radius);
        const pulse = Math.sin(e.timer * 15) * 0.3 + 0.7;
        // Ground target X from skills sheet
        this.drawSkillFx(ctx, SKILL_FX.targetX, ex, ey, r * 2.5, pulse * 0.7);
        // X lines on top
        const s = r * 0.6;
        ctx.strokeStyle = `rgba(255, 80, 30, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ex - s, ey - s); ctx.lineTo(ex + s, ey + s);
        ctx.moveTo(ex + s, ey - s); ctx.lineTo(ex - s, ey + s);
        ctx.stroke();

      } else if (e.type === 'meteor_explode') {
        const r = this.ss(e.radius * (1 + e.timer * 2));
        const alpha = 1 - e.timer / e.duration;
        // Fire burst from skills sheet
        this.drawSkillFx(ctx, SKILL_FX.meteorFall, ex, ey, r * 2.5, alpha);
        this.drawSkillFx(ctx, SKILL_FX.darkExplosion, ex, ey, r * 2, alpha * 0.6);

      } else if (e.type === 'ring') {
        const r = this.ss(e.currentRadius);
        const alpha = 1 - e.timer / e.duration;
        // Fire ring from skills sheet — scale to current radius
        this.drawSkillFx(ctx, SKILL_FX.fireRing, ex, ey, r * 2.2, alpha * 0.7);
        this.drawSkillFx(ctx, SKILL_FX.ringGlow, ex, ey, r * 2, alpha * 0.4);
        // Ring stroke on top
        ctx.strokeStyle = `rgba(255, 80, 20, ${alpha * 0.6})`;
        ctx.lineWidth = this.ss(e.ringThickness * 0.5);
        ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.stroke();

      } else if (e.type === 'pillar_mark') {
        const r = this.ss(e.radius);
        const pulse = Math.sin(e.timer * 20) * 0.3 + 0.7;
        this.drawSkillFx(ctx, SKILL_FX.groundMark, ex, ey, r * 2, pulse * 0.6);

      } else if (e.type === 'pillar_fire') {
        const r = this.ss(e.radius);
        const alpha = 1 - e.timer / e.duration;
        // Fire pillar eruption
        this.drawSkillFx(ctx, SKILL_FX.firePillar, ex, ey - this.ss(20), r * 2.5, alpha);
        this.drawSkillFx(ctx, SKILL_FX.burstSpark, ex, ey, r * 1.5, alpha * 0.5);
      }
    }
  }

  renderProjectiles(ctx) {
    for (const p of this.boss.projectiles) {
      const px = this.sx(p.x), py = this.sy(p.y);
      const size = this.ss(p.radius * 3);
      const angle = (p.age || 0) * 5;
      // Fireball sprite from skills sheet
      this.drawSkillFxRotated(ctx, SKILL_FX.fireball, px, py, size, angle, 0.9);
      // Glow
      ctx.shadowColor = '#FF4010';
      ctx.shadowBlur = this.ss(10);
      ctx.fillStyle = 'rgba(255, 80, 20, 0.3)';
      ctx.beginPath(); ctx.arc(px, py, this.ss(p.radius * 0.5), 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  renderPlayer(ctx) {
    const p = this.player;
    if (!p.alive) return;
    if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 10) % 2) return;

    const px = this.sx(p.x), py = this.sy(p.y), pr = this.ss(p.radius);

    ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = this.ss(12);
    ctx.fillStyle = '#0A1628';
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#00E5FF'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;

    // Eyes
    ctx.fillStyle = '#FFF';
    ctx.beginPath(); ctx.arc(px - pr * 0.3, py - pr * 0.2, pr * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + pr * 0.3, py - pr * 0.2, pr * 0.15, 0, Math.PI * 2); ctx.fill();

    // Attack range when close
    const bd = Math.sqrt((p.x - this.boss.x) ** 2 + (p.y - this.boss.y) ** 2);
    if (bd < PLAYER_ATTACK_RANGE + this.boss.radius + 40) {
      ctx.strokeStyle = p.attackCooldown <= 0 ? 'rgba(0, 229, 255, 0.3)' : 'rgba(80, 80, 80, 0.15)';
      ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(px, py, this.ss(PLAYER_ATTACK_RANGE), 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  renderHUD(ctx, w, h) {
    const dpr = window.devicePixelRatio || 1;
    const m = 12 * dpr, barW = 200 * dpr, barH = 14 * dpr, fs = 12 * dpr;

    // Boss HP (top center)
    const bx = (w - barW) / 2, by = m;
    ctx.fillStyle = 'rgba(11, 18, 32, 0.92)';
    ctx.fillRect(bx - 10 * dpr, by - 4 * dpr, barW + 20 * dpr, barH + 28 * dpr);
    ctx.strokeStyle = 'rgba(255, 60, 20, 0.5)'; ctx.lineWidth = 1;
    ctx.strokeRect(bx - 10 * dpr, by - 4 * dpr, barW + 20 * dpr, barH + 28 * dpr);

    ctx.fillStyle = '#FF6030'; ctx.font = `bold ${fs}px Rajdhani, sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('BOSS-1: FIRE ECHO', w / 2, by + fs);

    const hpR = this.boss.hp / this.boss.maxHp;
    ctx.fillStyle = '#1A0A0A'; ctx.fillRect(bx, by + fs + 4 * dpr, barW, barH);
    ctx.fillStyle = hpR > 0.3 ? '#FF4020' : '#FF1010'; ctx.fillRect(bx, by + fs + 4 * dpr, barW * hpR, barH);
    ctx.strokeStyle = 'rgba(255, 60, 20, 0.6)'; ctx.strokeRect(bx, by + fs + 4 * dpr, barW, barH);

    ctx.fillStyle = '#FFF'; ctx.font = `bold ${fs * 0.8}px JetBrains Mono, monospace`;
    ctx.fillText(`${Math.ceil(this.boss.hp)} / ${this.boss.maxHp}`, w / 2, by + fs + barH + 1 * dpr);

    // Player HP (bottom left)
    const px = m, py = h - m - barH - fs - 6 * dpr, pW = 130 * dpr;
    ctx.fillStyle = 'rgba(11, 18, 32, 0.92)';
    ctx.fillRect(px - 4 * dpr, py - 4 * dpr, pW + 8 * dpr, barH + fs + 14 * dpr);

    ctx.fillStyle = '#00E5FF'; ctx.font = `bold ${fs}px Rajdhani, sans-serif`; ctx.textAlign = 'left';
    ctx.fillText('PLAYER', px, py + fs);

    const phpR = this.player.hp / this.player.maxHp;
    ctx.fillStyle = '#0A1A1A'; ctx.fillRect(px, py + fs + 2 * dpr, pW, barH);
    ctx.fillStyle = phpR > 0.3 ? '#00E5FF' : '#FF335C'; ctx.fillRect(px, py + fs + 2 * dpr, pW * phpR, barH);

    // Debug info
    ctx.fillStyle = '#A855F7'; ctx.font = `bold ${fs * 0.75}px JetBrains Mono, monospace`; ctx.textAlign = 'right';
    ctx.fillText(`E=attack | ${this.boss.state} | ${this.time.toFixed(1)}s`, w - m, h - m);
  }

  renderOverlay(ctx, w, h, title, color, sub) {
    ctx.fillStyle = `rgba(5, 9, 17, ${Math.min(this.victoryTimer * 0.5, 0.85)})`;
    ctx.fillRect(0, 0, w, h);
    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = color;
    ctx.font = `bold ${28 * dpr}px Rajdhani, sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, h / 2 - 16 * dpr);
    ctx.fillStyle = '#91A4B7'; ctx.font = `${13 * dpr}px Rajdhani, sans-serif`;
    ctx.fillText(sub, w / 2, h / 2 + 16 * dpr);
  }
}
