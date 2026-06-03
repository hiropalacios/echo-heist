// Boss Stage — ECHO HEIST Boss Fight Mode
// Uses CLEAN PNGs with real alpha: boss1.clean.png + boss1-skills.clean.png
// Same original design, background removed via flood-fill

import { FireEchoBoss, BOSS_POSES, SKILL_FX, getBossSrcRect, getSkillSrcRect } from './boss.js';

const ARENA_W = 600;
const ARENA_H = 500;
const PLAYER_SPEED = 200;
const PLAYER_RADIUS = 16;
const PLAYER_ATTACK_DMG = 10;
const PLAYER_ATTACK_RANGE = 60;
const PLAYER_ATTACK_CD = 0.4;

function loadImg(src) { const img = new Image(); img.src = src; return img; }

export class BossStage {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = canvas.width;
    this.h = canvas.height;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    // Clean PNGs with real transparency
    this.bossImg = loadImg('assets/boss1.clean.png');
    this.skillsImg = loadImg('assets/boss1-skills.clean.png');

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

  // Draw a cropped region from boss spritesheet centered at (cx,cy)
  drawBossPose(ctx, pose, cx, cy, size) {
    if (!this.bossImg.complete) {
      ctx.fillStyle = '#FF3020';
      ctx.beginPath(); ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2); ctx.fill();
      return;
    }
    const r = getBossSrcRect(pose);
    ctx.drawImage(this.bossImg, r.sx, r.sy, r.sw, r.sh, cx - size / 2, cy - size * 0.7, size, size * 1.4);
  }

  // Draw a cropped region from skills spritesheet
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

    if (p.alive && p.invulnTimer <= 0) {
      const dmg = this.boss.checkPlayerHit(p.x, p.y, p.radius);
      if (dmg > 0) {
        p.hp -= dmg; p.invulnTimer = 0.5; this.damageFlash = 1;
        if (p.hp <= 0) { p.hp = 0; p.alive = false; this.state = 'defeat'; }
      }
      const bd = Math.sqrt((p.x - this.boss.x) ** 2 + (p.y - this.boss.y) ** 2);
      if (bd < p.radius + this.boss.radius) { p.hp -= 10 * dt; this.damageFlash = 0.3; }
    }

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

    ctx.fillStyle = '#050911';
    ctx.fillRect(0, 0, w, h);

    const ax = this.sx(0), ay = this.sy(0), aw = this.ss(ARENA_W), ah = this.ss(ARENA_H);
    ctx.fillStyle = '#0A0E14';
    ctx.fillRect(ax, ay, aw, ah);

    ctx.strokeStyle = 'rgba(255, 40, 15, 0.04)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= ARENA_W; gx += 40) { ctx.beginPath(); ctx.moveTo(this.sx(gx), ay); ctx.lineTo(this.sx(gx), ay + ah); ctx.stroke(); }
    for (let gy = 0; gy <= ARENA_H; gy += 40) { ctx.beginPath(); ctx.moveTo(ax, this.sy(gy)); ctx.lineTo(ax + aw, this.sy(gy)); ctx.stroke(); }

    ctx.strokeStyle = 'rgba(255, 50, 20, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ax, ay, aw, ah);

    this.renderGroundFx(ctx);
    this.renderBoss(ctx);
    this.renderProjectiles(ctx);
    this.renderPlayer(ctx);

    if (this.damageFlash > 0) {
      ctx.fillStyle = `rgba(255, 40, 20, ${this.damageFlash * 0.25})`;
      ctx.fillRect(0, 0, w, h);
    }

    this.renderHUD(ctx, w, h);

    if (this.state === 'victory') this.renderOverlay(ctx, w, h, 'BOSS DEFEATED', '#FFD166', `Time: ${this.time.toFixed(1)}s`);
    if (this.state === 'defeat') this.renderOverlay(ctx, w, h, 'DEFEATED', '#FF335C', 'Press R to retry');
  }

  renderBoss(ctx) {
    const b = this.boss;
    if (!b.alive && this.victoryTimer > 1.5) return;

    const bx = this.sx(b.x);
    const by = this.sy(b.y + b.floatOffset);
    const bodySize = this.ss(110);
    const shakeX = b.castShake > 0 ? (Math.random() - 0.5) * 6 : 0;
    const shakeY = b.castShake > 0 ? (Math.random() - 0.5) * 6 : 0;

    // Layer 1: Aura glow (procedural)
    const auraGrad = ctx.createRadialGradient(bx, by, 0, bx, by, bodySize * 0.8);
    auraGrad.addColorStop(0, `rgba(255, 60, 20, ${b.auraAlpha * 0.25})`);
    auraGrad.addColorStop(1, 'rgba(255, 40, 10, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath(); ctx.arc(bx, by, bodySize * 0.8, 0, Math.PI * 2); ctx.fill();

    // Layer 2: Fire aura from skills sheet (behind body)
    this.drawSkillFx(ctx, SKILL_FX.fireBurst, bx, by + bodySize * 0.05, bodySize * 1.2, b.auraAlpha * 0.4);

    // Layer 3: Cast charge (only when casting)
    if (b.state === 'casting') {
      const castPulse = Math.sin(b.stateTimer * 18) * 0.3 + 0.6;
      this.drawSkillFx(ctx, SKILL_FX.particles, bx + shakeX, by - bodySize * 0.2 + shakeY, bodySize * 0.7, castPulse);
    }

    // Layer 4: Boss body from clean spritesheet (original design preserved)
    const deathAlpha = b.alive ? 1 : Math.max(0, 1 - this.victoryTimer);
    if (deathAlpha > 0) {
      const prev = ctx.globalAlpha;
      ctx.globalAlpha = deathAlpha;
      this.drawBossPose(ctx, b.currentPose, bx + shakeX, by + shakeY, bodySize);
      ctx.globalAlpha = prev;
    }

    // Debug state label
    ctx.fillStyle = '#FF8040';
    ctx.font = `bold ${this.ss(10)}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(b.state.toUpperCase(), bx, by - bodySize * 0.85);
  }

  renderGroundFx(ctx) {
    for (const e of this.boss.effects) {
      const ex = this.sx(e.x), ey = this.sy(e.y);

      if (e.type === 'meteor_mark') {
        const r = this.ss(e.radius);
        const pulse = Math.sin(e.timer * 15) * 0.3 + 0.7;
        this.drawSkillFx(ctx, SKILL_FX.targetX, ex, ey, r * 2.5, pulse * 0.7);
        // X lines
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
        this.drawSkillFx(ctx, SKILL_FX.meteorFall, ex, ey, r * 2.5, alpha);
        this.drawSkillFx(ctx, SKILL_FX.darkExplosion, ex, ey, r * 2, alpha * 0.6);

      } else if (e.type === 'ring') {
        const r = this.ss(e.currentRadius);
        const alpha = 1 - e.timer / e.duration;
        this.drawSkillFx(ctx, SKILL_FX.fireRing, ex, ey, r * 2.2, alpha * 0.7);
        this.drawSkillFx(ctx, SKILL_FX.ringGlow, ex, ey, r * 2, alpha * 0.4);
        ctx.strokeStyle = `rgba(255, 70, 20, ${alpha * 0.5})`;
        ctx.lineWidth = this.ss(e.ringThickness * 0.4);
        ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.stroke();

      } else if (e.type === 'pillar_mark') {
        const r = this.ss(e.radius);
        const pulse = Math.sin(e.timer * 20) * 0.3 + 0.7;
        this.drawSkillFx(ctx, SKILL_FX.groundMark, ex, ey, r * 2, pulse * 0.6);

      } else if (e.type === 'pillar_fire') {
        const r = this.ss(e.radius);
        const alpha = 1 - e.timer / e.duration;
        this.drawSkillFx(ctx, SKILL_FX.firePillar, ex, ey - this.ss(20), r * 2.5, alpha);
        this.drawSkillFx(ctx, SKILL_FX.burstSpark, ex, ey, r * 1.5, alpha * 0.5);
      }
    }
  }

  renderProjectiles(ctx) {
    for (const p of this.boss.projectiles) {
      const px = this.sx(p.x), py = this.sy(p.y);
      const size = this.ss(p.radius * 3.5);
      const angle = (p.age || 0) * 5;
      this.drawSkillFxRotated(ctx, SKILL_FX.fireball, px, py, size, angle, 0.9);
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
    ctx.fillStyle = '#FFF';
    ctx.beginPath(); ctx.arc(px - pr * 0.3, py - pr * 0.2, pr * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + pr * 0.3, py - pr * 0.2, pr * 0.15, 0, Math.PI * 2); ctx.fill();

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

    ctx.fillStyle = '#FFF'; ctx.font = `bold ${fs * 0.8}px JetBrains Mono, monospace`;
    ctx.fillText(`${Math.ceil(this.boss.hp)} / ${this.boss.maxHp}`, w / 2, by + fs + barH + 1 * dpr);

    const px = m, py = h - m - barH - fs - 6 * dpr, pW = 130 * dpr;
    ctx.fillStyle = 'rgba(11, 18, 32, 0.92)';
    ctx.fillRect(px - 4 * dpr, py - 4 * dpr, pW + 8 * dpr, barH + fs + 14 * dpr);
    ctx.fillStyle = '#00E5FF'; ctx.font = `bold ${fs}px Rajdhani, sans-serif`; ctx.textAlign = 'left';
    ctx.fillText('PLAYER', px, py + fs);
    const phpR = this.player.hp / this.player.maxHp;
    ctx.fillStyle = '#0A1A1A'; ctx.fillRect(px, py + fs + 2 * dpr, pW, barH);
    ctx.fillStyle = phpR > 0.3 ? '#00E5FF' : '#FF335C'; ctx.fillRect(px, py + fs + 2 * dpr, pW * phpR, barH);

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
