// Boss Stage — ECHO HEIST Boss Fight Mode

import { FireEchoBoss, BOSS_SPRITE, SKILL_SPRITES } from './boss.js';

const ARENA_W = 600;
const ARENA_H = 500;
const PLAYER_HP = 100;
const PLAYER_RADIUS = 16;
const PLAYER_SPEED = 200; // pixels per second
const PLAYER_ATTACK_DAMAGE = 10;
const PLAYER_ATTACK_RANGE = 60;
const PLAYER_ATTACK_COOLDOWN = 0.4;

export class BossStage {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = canvas.width;
    this.h = canvas.height;

    // Scale to fit arena in canvas
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    // Boss sprite images
    this.bossImg = new Image();
    this.bossImg.src = 'assets/bosses.png';
    this.skillsImg = new Image();
    this.skillsImg.src = 'assets/bosses-skills.png';

    // Player state (pixel-based, not grid-based like puzzle mode)
    this.player = {
      x: ARENA_W / 2,
      y: ARENA_H - 80,
      radius: PLAYER_RADIUS,
      hp: PLAYER_HP,
      maxHp: PLAYER_HP,
      speed: PLAYER_SPEED,
      alive: true,
      attackCooldown: 0,
      invulnTimer: 0, // brief invulnerability after hit
    };

    // Boss
    this.boss = new FireEchoBoss(ARENA_W / 2, 100);

    // State
    this.state = 'fighting'; // fighting, victory, defeat
    this.time = 0;
    this.damageFlash = 0;
    this.victoryTimer = 0;
  }

  onResize(w, h) {
    this.w = w;
    this.h = h;
    // Scale arena to fit screen
    const scaleX = (w * 0.85) / ARENA_W;
    const scaleY = (h * 0.85) / ARENA_H;
    this.scale = Math.min(scaleX, scaleY);
    this.offsetX = (w - ARENA_W * this.scale) / 2;
    this.offsetY = (h - ARENA_H * this.scale) / 2;
  }

  // Convert arena coords to screen coords
  sx(x) { return this.offsetX + x * this.scale; }
  sy(y) { return this.offsetY + y * this.scale; }
  ss(s) { return s * this.scale; }

  update(dt, keys) {
    if (this.state !== 'fighting') {
      this.victoryTimer += dt;
      return;
    }

    this.time += dt;
    if (this.damageFlash > 0) this.damageFlash -= dt * 3;

    // Player movement
    const p = this.player;
    if (p.alive) {
      let dx = 0, dy = 0;
      if (keys['w'] || keys['arrowup']) dy -= 1;
      if (keys['s'] || keys['arrowdown']) dy += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        p.x += (dx / len) * p.speed * dt;
        p.y += (dy / len) * p.speed * dt;
      }
      // Clamp to arena
      p.x = Math.max(p.radius, Math.min(ARENA_W - p.radius, p.x));
      p.y = Math.max(p.radius, Math.min(ARENA_H - p.radius, p.y));

      // Attack cooldown
      if (p.attackCooldown > 0) p.attackCooldown -= dt;
      if (p.invulnTimer > 0) p.invulnTimer -= dt;
    }

    // Boss update
    this.boss.update(dt, p.x, p.y);

    // Check boss damage to player
    if (p.alive && p.invulnTimer <= 0) {
      const dmg = this.boss.checkPlayerHit(p.x, p.y, p.radius);
      if (dmg > 0) {
        p.hp -= dmg;
        p.invulnTimer = 0.5;
        this.damageFlash = 1;
        if (p.hp <= 0) {
          p.hp = 0;
          p.alive = false;
          this.state = 'defeat';
        }
      }

      // Contact damage
      const bDist = Math.sqrt((p.x - this.boss.x) ** 2 + (p.y - this.boss.y) ** 2);
      if (bDist < p.radius + this.boss.radius) {
        p.hp -= 10 * dt; // contact damage per second
        this.damageFlash = 0.3;
      }
    }

    // Player attacks boss (E key or Space)
    if (p.alive && p.attackCooldown <= 0 && (keys['e'] || keys[' '])) {
      const dist = Math.sqrt((p.x - this.boss.x) ** 2 + (p.y - this.boss.y) ** 2);
      if (dist < PLAYER_ATTACK_RANGE + this.boss.radius) {
        this.boss.takeDamage(PLAYER_ATTACK_DAMAGE);
        p.attackCooldown = PLAYER_ATTACK_COOLDOWN;
      }
      // Reset key to prevent holding
      keys['e'] = false;
      keys[' '] = false;
    }

    // Check victory
    if (!this.boss.alive) {
      this.state = 'victory';
      this.victoryTimer = 0;
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.w, h = this.h;

    // Background
    ctx.fillStyle = '#050911';
    ctx.fillRect(0, 0, w, h);

    // Arena floor
    const ax = this.sx(0), ay = this.sy(0);
    const aw = this.ss(ARENA_W), ah = this.ss(ARENA_H);

    // Dark floor with grid
    ctx.fillStyle = '#0A0F1A';
    ctx.fillRect(ax, ay, aw, ah);

    // Subtle red grid for boss arena
    ctx.strokeStyle = 'rgba(255, 50, 50, 0.06)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= ARENA_W; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(this.sx(gx), ay);
      ctx.lineTo(this.sx(gx), ay + ah);
      ctx.stroke();
    }
    for (let gy = 0; gy <= ARENA_H; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(ax, this.sy(gy));
      ctx.lineTo(ax + aw, this.sy(gy));
      ctx.stroke();
    }

    // Arena border
    ctx.strokeStyle = 'rgba(255, 80, 30, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ax, ay, aw, ah);

    // Render effects (below characters)
    this.renderEffects(ctx);

    // Render boss
    this.renderBoss(ctx);

    // Render projectiles
    this.renderProjectiles(ctx);

    // Render player
    this.renderPlayer(ctx);

    // Damage flash
    if (this.damageFlash > 0) {
      ctx.fillStyle = `rgba(255, 50, 30, ${this.damageFlash * 0.2})`;
      ctx.fillRect(0, 0, w, h);
    }

    // HUD
    this.renderHUD(ctx, w, h);

    // Victory/Defeat overlay
    if (this.state === 'victory') this.renderVictory(ctx, w, h);
    if (this.state === 'defeat') this.renderDefeat(ctx, w, h);
  }

  renderBoss(ctx) {
    const b = this.boss;
    if (!b.alive && this.victoryTimer > 1) return;

    const bx = this.sx(b.x);
    const by = this.sy(b.y + b.floatOffset);
    const bSize = this.ss(90);

    // Aura glow
    const auraGrad = ctx.createRadialGradient(bx, by, 0, bx, by, bSize);
    auraGrad.addColorStop(0, `rgba(255, 80, 20, ${b.auraAlpha * 0.3})`);
    auraGrad.addColorStop(1, 'rgba(255, 80, 20, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath(); ctx.arc(bx, by, bSize, 0, Math.PI * 2); ctx.fill();

    // Cast shake
    const shakeX = b.castShake > 0 ? (Math.random() - 0.5) * 6 : 0;
    const shakeY = b.castShake > 0 ? (Math.random() - 0.5) * 6 : 0;

    // Boss sprite from spritesheet
    if (this.bossImg.complete) {
      const sp = BOSS_SPRITE;
      ctx.drawImage(this.bossImg,
        sp.sx, sp.sy, sp.sw, sp.sh,
        bx - bSize / 2 + shakeX, by - bSize * 0.8 + shakeY, bSize, bSize * 1.6
      );
    } else {
      // Fallback circle
      ctx.fillStyle = '#FF3020';
      ctx.beginPath(); ctx.arc(bx + shakeX, by + shakeY, this.ss(b.radius), 0, Math.PI * 2); ctx.fill();
    }

    // State indicator (debug)
    ctx.fillStyle = '#FF8040';
    ctx.font = `bold ${this.ss(10)}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(b.state.toUpperCase(), bx, by - bSize * 0.9);
  }

  renderPlayer(ctx) {
    const p = this.player;
    if (!p.alive) return;

    const px = this.sx(p.x);
    const py = this.sy(p.y);
    const pr = this.ss(p.radius);

    // Invulnerability blink
    if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 10) % 2) return;

    // Cyan glow
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = this.ss(12);
    ctx.fillStyle = '#0A1628';
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;

    // Eyes
    ctx.fillStyle = '#FFF';
    ctx.beginPath(); ctx.arc(px - 4, py - 3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 4, py - 3, 2, 0, Math.PI * 2); ctx.fill();

    // Attack range indicator when close to boss
    const distToBoss = Math.sqrt((p.x - this.boss.x) ** 2 + (p.y - this.boss.y) ** 2);
    if (distToBoss < PLAYER_ATTACK_RANGE + this.boss.radius + 30) {
      ctx.strokeStyle = p.attackCooldown <= 0 ? 'rgba(0, 229, 255, 0.3)' : 'rgba(100, 100, 100, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(px, py, this.ss(PLAYER_ATTACK_RANGE), 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  renderEffects(ctx) {
    for (const e of this.boss.effects) {
      const ex = this.sx(e.x);
      const ey = this.sy(e.y);

      if (e.type === 'meteor_mark') {
        // Pulsing X mark
        const pulse = Math.sin(e.timer * 15) * 0.3 + 0.7;
        const r = this.ss(e.radius);

        // Try skill sprite
        if (this.skillsImg.complete) {
          const sp = SKILL_SPRITES.target;
          ctx.globalAlpha = pulse * 0.7;
          ctx.drawImage(this.skillsImg, sp.sx, sp.sy, sp.sw, sp.sh, ex - r, ey - r, r * 2, r * 2);
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = `rgba(255, 50, 20, ${pulse * 0.3})`;
          ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill();
        }

        // X mark lines
        const s = r * 0.6;
        ctx.strokeStyle = `rgba(255, 80, 30, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ex - s, ey - s); ctx.lineTo(ex + s, ey + s);
        ctx.moveTo(ex + s, ey - s); ctx.lineTo(ex - s, ey + s);
        ctx.stroke();

      } else if (e.type === 'meteor_explode') {
        const r = this.ss(e.radius * (1 + e.timer));
        const alpha = 1 - e.timer / e.duration;

        if (this.skillsImg.complete) {
          const sp = SKILL_SPRITES.burst;
          ctx.globalAlpha = alpha;
          ctx.drawImage(this.skillsImg, sp.sx, sp.sy, sp.sw, sp.sh, ex - r, ey - r, r * 2, r * 2);
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = `rgba(255, 100, 20, ${alpha * 0.6})`;
          ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill();
        }

      } else if (e.type === 'ring') {
        const r = this.ss(e.currentRadius);
        const t = this.ss(e.ringThickness);
        const alpha = 1 - e.timer / e.duration;

        if (this.skillsImg.complete) {
          const sp = SKILL_SPRITES.ring;
          ctx.globalAlpha = alpha * 0.8;
          ctx.drawImage(this.skillsImg, sp.sx, sp.sy, sp.sw, sp.sh, ex - r, ey - r, r * 2, r * 2);
          ctx.globalAlpha = 1;
        }

        // Always draw ring outline
        ctx.strokeStyle = `rgba(255, 80, 20, ${alpha * 0.8})`;
        ctx.lineWidth = t;
        ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.stroke();

      } else if (e.type === 'pillar_mark') {
        const pulse = Math.sin(e.timer * 20) * 0.3 + 0.7;
        const r = this.ss(e.radius * 0.5);
        ctx.fillStyle = `rgba(255, 50, 20, ${pulse * 0.4})`;
        ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(255, 80, 30, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.stroke();

      } else if (e.type === 'pillar_fire') {
        const r = this.ss(e.radius);
        const alpha = 1 - e.timer / e.duration;
        const pillarH = this.ss(60) * alpha;

        if (this.skillsImg.complete) {
          const sp = SKILL_SPRITES.aura;
          ctx.globalAlpha = alpha;
          ctx.drawImage(this.skillsImg, sp.sx, sp.sy, sp.sw, sp.sh, ex - r, ey - pillarH, r * 2, pillarH + r);
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = `rgba(255, 120, 20, ${alpha * 0.7})`;
          ctx.fillRect(ex - r * 0.4, ey - pillarH, r * 0.8, pillarH);
        }
      }
    }
  }

  renderProjectiles(ctx) {
    for (const p of this.boss.projectiles) {
      const px = this.sx(p.x);
      const py = this.sy(p.y);
      const pr = this.ss(p.radius);

      if (this.skillsImg.complete) {
        const sp = SKILL_SPRITES.projectile;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.rotation || 0);
        ctx.drawImage(this.skillsImg, sp.sx, sp.sy, sp.sw, sp.sh, -pr * 1.5, -pr * 1.5, pr * 3, pr * 3);
        ctx.restore();
      } else {
        ctx.fillStyle = '#FF6020';
        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
      }

      // Glow
      ctx.shadowColor = '#FF4010';
      ctx.shadowBlur = this.ss(8);
      ctx.fillStyle = 'rgba(255, 80, 20, 0.4)';
      ctx.beginPath(); ctx.arc(px, py, pr * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  renderHUD(ctx, w, h) {
    const dpr = window.devicePixelRatio || 1;
    const margin = 12 * dpr;
    const barW = 180 * dpr;
    const barH = 14 * dpr;
    const fs = 11 * dpr;

    // Boss name + HP bar (top center)
    const bossBarX = (w - barW) / 2;
    const bossBarY = margin;

    ctx.fillStyle = 'rgba(11, 18, 32, 0.9)';
    ctx.fillRect(bossBarX - 10 * dpr, bossBarY - 4 * dpr, barW + 20 * dpr, barH + 24 * dpr);
    ctx.strokeStyle = 'rgba(255, 80, 30, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bossBarX - 10 * dpr, bossBarY - 4 * dpr, barW + 20 * dpr, barH + 24 * dpr);

    ctx.fillStyle = '#FF6030';
    ctx.font = `bold ${fs}px Rajdhani, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('BOSS-1: FIRE ECHO', w / 2, bossBarY + fs);

    // HP bar
    const hpRatio = this.boss.hp / this.boss.maxHp;
    ctx.fillStyle = '#1A0A0A';
    ctx.fillRect(bossBarX, bossBarY + fs + 4 * dpr, barW, barH);
    ctx.fillStyle = hpRatio > 0.3 ? '#FF4020' : '#FF1010';
    ctx.fillRect(bossBarX, bossBarY + fs + 4 * dpr, barW * hpRatio, barH);
    ctx.strokeStyle = 'rgba(255, 80, 30, 0.6)';
    ctx.strokeRect(bossBarX, bossBarY + fs + 4 * dpr, barW, barH);

    ctx.fillStyle = '#FFF';
    ctx.font = `bold ${fs * 0.85}px JetBrains Mono, monospace`;
    ctx.fillText(`${Math.ceil(this.boss.hp)} / ${this.boss.maxHp}`, w / 2, bossBarY + fs + barH);

    // Player HP (bottom left)
    const pBarX = margin;
    const pBarY = h - margin - barH - fs - 4 * dpr;
    const pBarW = 120 * dpr;

    ctx.fillStyle = 'rgba(11, 18, 32, 0.9)';
    ctx.fillRect(pBarX - 4 * dpr, pBarY - 4 * dpr, pBarW + 8 * dpr, barH + fs + 12 * dpr);

    ctx.fillStyle = '#00E5FF';
    ctx.font = `bold ${fs}px Rajdhani, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('PLAYER', pBarX, pBarY + fs);

    const phpRatio = this.player.hp / this.player.maxHp;
    ctx.fillStyle = '#0A1A1A';
    ctx.fillRect(pBarX, pBarY + fs + 2 * dpr, pBarW, barH);
    ctx.fillStyle = phpRatio > 0.3 ? '#00E5FF' : '#FF335C';
    ctx.fillRect(pBarX, pBarY + fs + 2 * dpr, pBarW * phpRatio, barH);

    // Debug info (bottom right)
    ctx.fillStyle = '#A855F7';
    ctx.font = `bold ${fs * 0.8}px JetBrains Mono, monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(`ATK: ${this.boss.state} | E=attack`, w - margin, h - margin);
    ctx.fillText(`TIME: ${this.time.toFixed(1)}s`, w - margin, h - margin - fs);
  }

  renderVictory(ctx, w, h) {
    ctx.fillStyle = `rgba(5, 9, 17, ${Math.min(this.victoryTimer * 0.5, 0.8)})`;
    ctx.fillRect(0, 0, w, h);
    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = '#FFD166';
    ctx.font = `bold ${32 * dpr}px Rajdhani, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('BOSS DEFEATED', w / 2, h / 2 - 20 * dpr);
    ctx.fillStyle = '#91A4B7';
    ctx.font = `${14 * dpr}px Rajdhani, sans-serif`;
    ctx.fillText(`Time: ${this.time.toFixed(1)}s`, w / 2, h / 2 + 20 * dpr);
  }

  renderDefeat(ctx, w, h) {
    ctx.fillStyle = `rgba(30, 5, 5, ${Math.min(this.victoryTimer * 0.5, 0.8)})`;
    ctx.fillRect(0, 0, w, h);
    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = '#FF335C';
    ctx.font = `bold ${32 * dpr}px Rajdhani, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('DEFEATED', w / 2, h / 2 - 20 * dpr);
    ctx.fillStyle = '#91A4B7';
    ctx.font = `${14 * dpr}px Rajdhani, sans-serif`;
    ctx.fillText('Press R or Space to retry', w / 2, h / 2 + 20 * dpr);
  }
}
