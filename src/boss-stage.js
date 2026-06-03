// Boss Stage — ECHO HEIST Boss-1: Fire Echo
// Uses: boss-final.png (1254x1254 RGBA 3x3) + skills-final.png (1254x1254 RGBA 4x4)
// Elegant layered rendering with code-driven animation

import { FireEchoBoss, BOSS1_FRAMES, BOSS1_SKILLS } from './boss.js';

const AW = 600, AH = 500;
const PS = 200, PR = 16, PA = 10, PAR = 60, PAC = 0.4;

export class BossStage {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = canvas.width; this.h = canvas.height;
    this.scale = 1; this.ox = 0; this.oy = 0;

    this.bossImg = new Image(); this.bossImg.src = 'assets/boss-final.png';
    this.skillsImg = new Image(); this.skillsImg.src = 'assets/skills-final.png';

    this.player = { x: AW / 2, y: AH - 80, radius: PR, hp: 100, maxHp: 100, speed: PS, alive: true, acd: 0, inv: 0 };
    this.boss = new FireEchoBoss(AW / 2, 100);
    this.state = 'fighting'; this.time = 0; this.dmgFlash = 0; this.vt = 0;
  }

  onResize(w, h) { this.w = w; this.h = h; this.scale = Math.min((w * 0.9) / AW, (h * 0.85) / AH); this.ox = (w - AW * this.scale) / 2; this.oy = (h - AH * this.scale) / 2; }
  sx(x) { return this.ox + x * this.scale; }
  sy(y) { return this.oy + y * this.scale; }
  ss(s) { return s * this.scale; }

  // ─── Sprite helpers ─────────────────────────────────────────
  drawFrame(ctx, fr, cx, cy, sz, a) {
    if (!this.bossImg.complete) { ctx.fillStyle = '#FF3020'; ctx.beginPath(); ctx.arc(cx, cy, sz * 0.2, 0, Math.PI * 2); ctx.fill(); return; }
    const p = ctx.globalAlpha; if (a !== undefined) ctx.globalAlpha = a;
    ctx.drawImage(this.bossImg, fr.x, fr.y, fr.w, fr.h, cx - sz / 2, cy - sz / 2, sz, sz);
    ctx.globalAlpha = p;
  }

  drawFx(ctx, sk, cx, cy, sz, a) {
    if (!this.skillsImg.complete) return;
    const p = ctx.globalAlpha; if (a !== undefined) ctx.globalAlpha = a;
    ctx.drawImage(this.skillsImg, sk.x, sk.y, sk.w, sk.h, cx - sz / 2, cy - sz / 2, sz, sz);
    ctx.globalAlpha = p;
  }

  drawFxRot(ctx, sk, cx, cy, sz, ang, a) {
    if (!this.skillsImg.complete) return;
    const p = ctx.globalAlpha; if (a !== undefined) ctx.globalAlpha = a;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.drawImage(this.skillsImg, sk.x, sk.y, sk.w, sk.h, -sz / 2, -sz / 2, sz, sz);
    ctx.restore(); ctx.globalAlpha = p;
  }

  drawFxScaled(ctx, sk, cx, cy, sz, scl, a) {
    this.drawFx(ctx, sk, cx, cy, sz * scl, a);
  }

  // ─── UPDATE ─────────────────────────────────────────────────
  update(dt, keys) {
    if (this.state !== 'fighting') { this.vt += dt; return; }
    this.time += dt;
    if (this.dmgFlash > 0) this.dmgFlash -= dt * 3;

    const p = this.player;
    if (p.alive) {
      let dx = 0, dy = 0;
      if (keys['w'] || keys['arrowup']) dy -= 1;
      if (keys['s'] || keys['arrowdown']) dy += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) { p.x += (dx / len) * p.speed * dt; p.y += (dy / len) * p.speed * dt; }
      p.x = Math.max(PR, Math.min(AW - PR, p.x));
      p.y = Math.max(PR, Math.min(AH - PR, p.y));
      if (p.acd > 0) p.acd -= dt;
      if (p.inv > 0) p.inv -= dt;
    }

    this.boss.update(dt, p.x, p.y);

    if (p.alive && p.inv <= 0) {
      const dmg = this.boss.checkPlayerHit(p.x, p.y, PR);
      if (dmg > 0) { p.hp -= dmg; p.inv = 0.5; this.dmgFlash = 1; if (p.hp <= 0) { p.hp = 0; p.alive = false; this.state = 'defeat'; } }
      const bd = Math.sqrt((p.x - this.boss.x) ** 2 + (p.y - this.boss.y) ** 2);
      if (bd < PR + this.boss.radius) { p.hp -= 10 * dt; this.dmgFlash = 0.3; }
    }

    if (p.alive && p.acd <= 0 && (keys['e'] || keys[' '])) {
      const d = Math.sqrt((p.x - this.boss.x) ** 2 + (p.y - this.boss.y) ** 2);
      if (d < PAR + this.boss.radius) { this.boss.takeDamage(PA); p.acd = PAC; }
      keys['e'] = false; keys[' '] = false;
    }

    if (!this.boss.alive) { this.state = 'victory'; this.vt = 0; }
  }

  // ─── RENDER ─────────────────────────────────────────────────
  render() {
    const ctx = this.ctx, w = this.w, h = this.h;
    ctx.fillStyle = '#050911'; ctx.fillRect(0, 0, w, h);

    // Arena
    const ax = this.sx(0), ay = this.sy(0), aw = this.ss(AW), ah = this.ss(AH);
    ctx.fillStyle = '#0A0E14'; ctx.fillRect(ax, ay, aw, ah);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,30,10,0.03)'; ctx.lineWidth = 1;
    for (let gx = 0; gx <= AW; gx += 40) { ctx.beginPath(); ctx.moveTo(this.sx(gx), ay); ctx.lineTo(this.sx(gx), ay + ah); ctx.stroke(); }
    for (let gy = 0; gy <= AH; gy += 40) { ctx.beginPath(); ctx.moveTo(ax, this.sy(gy)); ctx.lineTo(ax + aw, this.sy(gy)); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,40,15,0.3)'; ctx.lineWidth = 2; ctx.strokeRect(ax, ay, aw, ah);

    this.renderGroundFx(ctx);
    this.renderBoss(ctx);
    this.renderProjectiles(ctx);
    this.renderPlayer(ctx);

    if (this.dmgFlash > 0) { ctx.fillStyle = `rgba(255,30,10,${this.dmgFlash * 0.2})`; ctx.fillRect(0, 0, w, h); }

    this.renderHUD(ctx, w, h);
    if (this.state === 'victory') this.renderEnd(ctx, w, h, 'BOSS DEFEATED', '#FFD166', `Time: ${this.time.toFixed(1)}s`);
    if (this.state === 'defeat') this.renderEnd(ctx, w, h, 'DEFEATED', '#FF335C', 'Press R to retry');
  }

  renderBoss(ctx) {
    const b = this.boss;
    if (!b.alive && this.vt > 2) return;
    const bx = this.sx(b.x), by = this.sy(b.y + b.floatOffset);
    const sz = this.ss(115);
    const shk = b.castShake > 0 ? (Math.random() - 0.5) * 4 * (b.castShake / 0.3) : 0;

    // Layer 1: Procedural glow
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, sz * 0.7);
    g.addColorStop(0, `rgba(255,50,15,${b.auraAlpha * 0.18})`);
    g.addColorStop(1, 'rgba(255,30,10,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, sz * 0.7, 0, Math.PI * 2); ctx.fill();

    // Layer 2: Idle aura (from skills sheet — pulsing behind body)
    this.drawFxScaled(ctx, BOSS1_SKILLS.smallAura, bx, by, sz * 1.15, b.auraScale, b.auraAlpha * 0.3);

    // Layer 3: Cast effects (only when casting)
    if (b.state === 'casting') {
      const cp = 0.4 + Math.sin(b.stateTimer * 16) * 0.25;
      this.drawFxScaled(ctx, BOSS1_SKILLS.largeAura, bx + shk, by + shk, sz * 1.4, 1 + b.stateTimer * 0.3, cp);
      this.drawFxRot(ctx, BOSS1_SKILLS.castSigil, bx, by + sz * 0.3, sz * 0.7, b.stateTimer * 3, cp * 0.6);
    }

    // Layer 4: Boss body (cropped frame — clean, no sheet visible)
    const da = b.alive ? 1 : Math.max(0, 1 - this.vt * 0.8);
    if (da > 0) {
      // Hurt flash: briefly white-ish
      if (b.hurtFlash > 0) {
        ctx.globalAlpha = da;
        this.drawFrame(ctx, b.currentFrame, bx + shk, by + shk, sz);
        ctx.fillStyle = `rgba(255,200,180,${b.hurtFlash * 2})`;
        ctx.beginPath(); ctx.arc(bx, by, sz * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        this.drawFrame(ctx, b.currentFrame, bx + shk, by + shk, sz, da);
      }
    }

    // Layer 5: Death smoke
    if (!b.alive && this.vt < 1.2) {
      this.drawFxScaled(ctx, BOSS1_SKILLS.smokePuff, bx, by, sz * 1.3, 1 + this.vt * 0.5, 1 - this.vt * 0.8);
      this.drawFx(ctx, BOSS1_SKILLS.emberBurst, bx, by - sz * 0.2, sz * 0.8, (1 - this.vt) * 0.5);
    }

    // Debug state
    ctx.fillStyle = '#FF8040'; ctx.font = `bold ${this.ss(9)}px JetBrains Mono, monospace`; ctx.textAlign = 'center';
    ctx.fillText(b.state.toUpperCase(), bx, by - sz * 0.52);
  }

  renderGroundFx(ctx) {
    for (const e of this.boss.effects) {
      const ex = this.sx(e.x), ey = this.sy(e.y);

      if (e.type === 'meteor_mark') {
        const r = this.ss(e.radius), pulse = Math.sin(e.timer * 14) * 0.3 + 0.7;
        const progress = e.timer / e.telegraph;
        // X marker — pulsing, growing slightly
        this.drawFxScaled(ctx, BOSS1_SKILLS.xMarker, ex, ey, r * 2.2, 0.8 + progress * 0.3, pulse * 0.75);
        // Warning ring — growing
        this.drawFxScaled(ctx, BOSS1_SKILLS.targetRing, ex, ey, r * 2.8, 0.6 + progress * 0.5, pulse * 0.3);

      } else if (e.type === 'meteor_explode') {
        const r = this.ss(e.radius), a = 1 - e.timer / e.duration;
        const expandT = 1 + e.timer * 3;
        // Meteor falling in
        if (e.timer < 0.15) this.drawFxScaled(ctx, BOSS1_SKILLS.meteor, ex, ey - r * (1 - e.timer * 6), r * 2, expandT, a);
        // Impact burst
        this.drawFxScaled(ctx, BOSS1_SKILLS.fireBurst, ex, ey, r * 2.5, expandT, a * 0.9);
        // Ground burn lingers
        this.drawFx(ctx, BOSS1_SKILLS.groundBurn, ex, ey, r * 2, a * 0.4);

      } else if (e.type === 'ring') {
        const r = this.ss(e.currentRadius), a = 1 - e.timer / e.duration;
        // Flame ring sprite — scales with expansion
        this.drawFxScaled(ctx, BOSS1_SKILLS.flameRing, ex, ey, r * 2.2, 1, a * 0.65);
        // Extra stroke for clarity
        ctx.strokeStyle = `rgba(255,60,15,${a * 0.35})`; ctx.lineWidth = this.ss(e.ringThickness * 0.3);
        ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.stroke();

      } else if (e.type === 'pillar_mark') {
        const r = this.ss(e.radius), pulse = Math.sin(e.timer * 18) * 0.3 + 0.7;
        this.drawFxScaled(ctx, BOSS1_SKILLS.targetRing, ex, ey, r * 1.8, 0.7 + pulse * 0.3, pulse * 0.55);

      } else if (e.type === 'pillar_fire') {
        const r = this.ss(e.radius), a = 1 - e.timer / e.duration;
        // Pillar erupts upward
        const pillarScale = 1 + (1 - a) * 0.3;
        this.drawFxScaled(ctx, BOSS1_SKILLS.flamePillar, ex, ey - this.ss(18), r * 2.5, pillarScale, a * 0.9);
        this.drawFx(ctx, BOSS1_SKILLS.emberBurst, ex, ey, r * 1.3, a * 0.4);
      }
    }
  }

  renderProjectiles(ctx) {
    for (const p of this.boss.projectiles) {
      const px = this.sx(p.x), py = this.sy(p.y), sz = this.ss(p.radius * 4);
      const angle = (p.age || 0) * 6;
      const pulse = 0.85 + Math.sin(p.age * 12) * 0.15;
      // Fireball — rotating with pulse
      this.drawFxRot(ctx, BOSS1_SKILLS.fireball, px, py, sz * pulse, angle, 0.9);
      // Glow trail
      ctx.shadowColor = '#FF4010'; ctx.shadowBlur = this.ss(8);
      ctx.fillStyle = 'rgba(255,70,20,0.2)';
      ctx.beginPath(); ctx.arc(px, py, this.ss(p.radius * 0.4), 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  renderPlayer(ctx) {
    const p = this.player;
    if (!p.alive) return;
    if (p.inv > 0 && Math.floor(p.inv * 10) % 2) return;
    const px = this.sx(p.x), py = this.sy(p.y), pr = this.ss(PR);
    ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = this.ss(10);
    ctx.fillStyle = '#0A1628'; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#00E5FF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFF';
    ctx.beginPath(); ctx.arc(px - pr * 0.3, py - pr * 0.2, pr * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + pr * 0.3, py - pr * 0.2, pr * 0.15, 0, Math.PI * 2); ctx.fill();
    // Attack range
    const bd = Math.sqrt((p.x - this.boss.x) ** 2 + (p.y - this.boss.y) ** 2);
    if (bd < PAR + this.boss.radius + 40) {
      ctx.strokeStyle = p.acd <= 0 ? 'rgba(0,229,255,0.25)' : 'rgba(60,60,60,0.12)';
      ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(px, py, this.ss(PAR), 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  renderHUD(ctx, w, h) {
    const d = window.devicePixelRatio || 1, m = 10 * d, bw = 180 * d, bh = 12 * d, f = 11 * d;
    // Boss HP
    const bx = (w - bw) / 2, by = m;
    ctx.fillStyle = 'rgba(8,12,24,0.9)'; ctx.fillRect(bx - 8 * d, by - 3 * d, bw + 16 * d, bh + 24 * d);
    ctx.strokeStyle = 'rgba(255,50,15,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(bx - 8 * d, by - 3 * d, bw + 16 * d, bh + 24 * d);
    ctx.fillStyle = '#FF5525'; ctx.font = `bold ${f}px Rajdhani,sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('BOSS-1: FIRE ECHO', w / 2, by + f);
    const hr = this.boss.hp / this.boss.maxHp;
    ctx.fillStyle = '#150808'; ctx.fillRect(bx, by + f + 3 * d, bw, bh);
    ctx.fillStyle = hr > 0.3 ? '#FF3518' : '#FF0808'; ctx.fillRect(bx, by + f + 3 * d, bw * hr, bh);
    ctx.fillStyle = '#FFF'; ctx.font = `bold ${f * 0.75}px JetBrains Mono,monospace`;
    ctx.fillText(`${Math.ceil(this.boss.hp)}/${this.boss.maxHp}`, w / 2, by + f + bh);
    // Player HP
    const px = m, py = h - m - bh - f - 4 * d, pw = 110 * d;
    ctx.fillStyle = 'rgba(8,12,24,0.9)'; ctx.fillRect(px - 3 * d, py - 3 * d, pw + 6 * d, bh + f + 10 * d);
    ctx.fillStyle = '#00E5FF'; ctx.font = `bold ${f}px Rajdhani,sans-serif`; ctx.textAlign = 'left'; ctx.fillText('PLAYER', px, py + f);
    const ph = this.player.hp / this.player.maxHp;
    ctx.fillStyle = '#081515'; ctx.fillRect(px, py + f + 2 * d, pw, bh);
    ctx.fillStyle = ph > 0.3 ? '#00E5FF' : '#FF335C'; ctx.fillRect(px, py + f + 2 * d, pw * ph, bh);
    // Debug
    ctx.fillStyle = '#A855F7'; ctx.font = `bold ${f * 0.7}px JetBrains Mono,monospace`; ctx.textAlign = 'right';
    ctx.fillText(`E=hit | ${this.boss.state} | ${this.time.toFixed(1)}s`, w - m, h - m);
  }

  renderEnd(ctx, w, h, t, c, s) {
    ctx.fillStyle = `rgba(5,9,17,${Math.min(this.vt * 0.5, 0.85)})`; ctx.fillRect(0, 0, w, h);
    const d = window.devicePixelRatio || 1;
    ctx.fillStyle = c; ctx.font = `bold ${26 * d}px Rajdhani,sans-serif`; ctx.textAlign = 'center'; ctx.fillText(t, w / 2, h / 2 - 14 * d);
    ctx.fillStyle = '#91A4B7'; ctx.font = `${12 * d}px Rajdhani,sans-serif`; ctx.fillText(s, w / 2, h / 2 + 14 * d);
  }
}
