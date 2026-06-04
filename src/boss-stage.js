// Boss Stage — ECHO HEIST Boss-1: Fire Echo
// Clean FX pipeline: uses ONLY clean sprite cells + code-driven fire for everything else

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
    this.state = 'loading'; this.time = 0; this.dmgFlash = 0; this.vt = 0;

    // Boss music — preload before starting
    this.music = new Audio('assets/track-boss.mp3');
    this.music.loop = true;
    this.music.volume = 0.5;
    this.musicReady = false;
    this.musicStarted = false;
    this.loadDots = 0;

    this.music.addEventListener('canplaythrough', () => { this.musicReady = true; }, { once: true });
    this.music.load();

    // Timeout fallback — start anyway after 8s
    setTimeout(() => { this.musicReady = true; }, 8000);
  }

  startMusic() {
    if (this.musicStarted) return;
    this.music.play().catch(() => {});
    this.musicStarted = true;
  }

  stopMusic() {
    this.music.pause();
    this.music.currentTime = 0;
    this.musicStarted = false;
  }

  onResize(w, h) { this.w = w; this.h = h; this.scale = Math.min((w * 0.9) / AW, (h * 0.85) / AH); this.ox = (w - AW * this.scale) / 2; this.oy = (h - AH * this.scale) / 2; }
  sx(x) { return this.ox + x * this.scale; }
  sy(y) { return this.oy + y * this.scale; }
  ss(s) { return s * this.scale; }

  drawFrame(ctx, fr, cx, cy, sz, a) {
    if (!this.bossImg.complete) { ctx.fillStyle = '#FF3020'; ctx.beginPath(); ctx.arc(cx, cy, sz * 0.2, 0, Math.PI * 2); ctx.fill(); return; }
    const p = ctx.globalAlpha; if (a !== undefined) ctx.globalAlpha = a;
    ctx.drawImage(this.bossImg, fr.x, fr.y, fr.w, fr.h, cx - sz / 2, cy - sz / 2, sz, sz);
    ctx.globalAlpha = p;
  }

  // Only draw CLEAN skill cells — no dirty aura/smoke cells
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

  // ─── CODE-DRIVEN FIRE FX (replaces dirty sprite cells) ─────
  // These replace smallAura, largeAura, fireBurst, smokePuff, emberBurst, groundBurn

  drawFireAura(ctx, cx, cy, radius, alpha) {
    // Subtle red/orange radial glow — NO white fog
    const g = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
    g.addColorStop(0, `rgba(255,60,15,${alpha * 0.25})`);
    g.addColorStop(0.5, `rgba(200,30,10,${alpha * 0.1})`);
    g.addColorStop(1, 'rgba(150,20,5,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
  }

  drawFireParticles(ctx, cx, cy, radius, count, time, alpha) {
    // Small ember particles floating up — red/orange dots
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + time * 0.8;
      const dist = radius * (0.3 + Math.sin(time * 2 + i * 1.7) * 0.4);
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist - Math.sin(time * 3 + i) * radius * 0.15;
      const size = this.ss(1.5 + Math.sin(time * 5 + i * 2) * 0.8);
      const pa = alpha * (0.4 + Math.sin(time * 4 + i * 3) * 0.3);
      ctx.fillStyle = `rgba(255,${80 + i * 15},${10 + i * 5},${pa})`;
      ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawFireBurst(ctx, cx, cy, radius, alpha) {
    // Code-driven explosion — radial red/orange burst, NO white
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, `rgba(255,180,60,${alpha * 0.6})`);
    g.addColorStop(0.3, `rgba(255,80,20,${alpha * 0.4})`);
    g.addColorStop(0.7, `rgba(200,30,10,${alpha * 0.15})`);
    g.addColorStop(1, 'rgba(150,15,5,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
  }

  drawEmberScatter(ctx, cx, cy, radius, count, time, alpha) {
    // Small ember dots scattering outward
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const d = radius * (0.5 + time * 0.8);
      const px = cx + Math.cos(a) * d;
      const py = cy + Math.sin(a) * d - time * radius * 0.3;
      const sz = this.ss(1 + (1 - time) * 1.5);
      const ea = alpha * Math.max(0, 1 - time * 1.5);
      ctx.fillStyle = `rgba(255,${100 + i * 10},20,${ea})`;
      ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawDarkSmoke(ctx, cx, cy, radius, alpha) {
    // Dark smoke puff — dark grey/red, NOT white
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, `rgba(40,15,10,${alpha * 0.5})`);
    g.addColorStop(0.6, `rgba(25,10,8,${alpha * 0.25})`);
    g.addColorStop(1, 'rgba(15,5,5,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
  }

  drawFlamePillarCode(ctx, cx, cy, radius, height, alpha) {
    // Vertical flame pillar — bottom anchored, red/orange gradient
    const g = ctx.createLinearGradient(cx, cy, cx, cy - height);
    g.addColorStop(0, `rgba(200,30,10,${alpha * 0.6})`);
    g.addColorStop(0.4, `rgba(255,80,20,${alpha * 0.5})`);
    g.addColorStop(0.7, `rgba(255,150,40,${alpha * 0.3})`);
    g.addColorStop(1, `rgba(255,200,60,0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.6, cy);
    ctx.quadraticCurveTo(cx - radius * 0.3, cy - height * 0.5, cx, cy - height);
    ctx.quadraticCurveTo(cx + radius * 0.3, cy - height * 0.5, cx + radius * 0.6, cy);
    ctx.closePath();
    ctx.fill();
  }

  // ─── UPDATE ─────────────────────────────────────────────────
  update(dt, keys) {
    // Loading: wait for music + assets
    if (this.state === 'loading') {
      this.loadDots += dt;
      if (this.musicReady && this.bossImg.complete && this.skillsImg.complete) {
        this.state = 'waitTap'; // wait for user gesture to play music
      }
      return;
    }

    if (this.state === 'waitTap') {
      // Any key/touch = user gesture → can play audio
      for (const k in keys) {
        if (keys[k]) {
          this.startMusic();
          this.state = 'fighting';
          break;
        }
      }
      return;
    }

    if (this.state !== 'fighting') { this.vt += dt; if (this.vt > 0.1 && this.musicStarted) this.stopMusic(); return; }
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

    // Loading / wait screens
    if (this.state === 'loading' || this.state === 'waitTap') {
      const dpr = window.devicePixelRatio || 1;
      ctx.fillStyle = '#FF5525';
      ctx.font = `bold ${20 * dpr}px Rajdhani, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('BOSS-1: FIRE ECHO', w / 2, h / 2 - 24 * dpr);

      if (this.state === 'loading') {
        const dots = '.'.repeat(Math.floor(this.loadDots * 2) % 4);
        ctx.fillStyle = '#91A4B7';
        ctx.font = `${14 * dpr}px Rajdhani, sans-serif`;
        ctx.fillText(`Loading${dots}`, w / 2, h / 2 + 8 * dpr);
        const barW = 150 * dpr, barH = 6 * dpr;
        const bx = (w - barW) / 2, by = h / 2 + 28 * dpr;
        ctx.fillStyle = '#1A0808'; ctx.fillRect(bx, by, barW, barH);
        let progress = 0;
        if (this.bossImg.complete) progress += 0.33;
        if (this.skillsImg.complete) progress += 0.33;
        if (this.musicReady) progress += 0.34;
        ctx.fillStyle = '#FF4020'; ctx.fillRect(bx, by, barW * progress, barH);
      } else {
        // waitTap — ready, waiting for user gesture
        const pulse = 0.5 + Math.sin(this.loadDots * 4) * 0.3;
        ctx.fillStyle = `rgba(255,85,37,${pulse})`;
        ctx.font = `bold ${16 * dpr}px Rajdhani, sans-serif`;
        ctx.fillText('TAP TO FIGHT', w / 2, h / 2 + 12 * dpr);
      }
      return;
    }

    const ax = this.sx(0), ay = this.sy(0), aw = this.ss(AW), ah = this.ss(AH);
    ctx.fillStyle = '#0A0E14'; ctx.fillRect(ax, ay, aw, ah);
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
    const shk = b.castShake > 0 ? (Math.random() - 0.5) * 3 * (b.castShake / 0.3) : 0;

    // Layer 1: Code-driven fire aura (NO sprite aura — those have boss body baked in)
    this.drawFireAura(ctx, bx, by, sz * 0.6, b.auraAlpha);

    // Layer 2: Subtle ember particles around boss
    this.drawFireParticles(ctx, bx, by, sz * 0.5, 6, this.time, b.auraAlpha * 0.7);

    // Layer 3: Cast effects — castSigil + castCharge are clean, use those
    if (b.state === 'casting') {
      const cp = 0.4 + Math.sin(b.stateTimer * 16) * 0.25;
      this.drawFireAura(ctx, bx + shk, by + shk, sz * 0.9, cp * 0.6);
      this.drawFxRot(ctx, BOSS1_SKILLS.castSigil, bx, by + sz * 0.25, sz * 0.6, b.stateTimer * 3, cp * 0.5);
      this.drawFx(ctx, BOSS1_SKILLS.castCharge, bx + shk, by + shk, sz * 0.5, cp * 0.4);
      this.drawFireParticles(ctx, bx, by, sz * 0.7, 10, this.time * 2, cp);
    }

    // Layer 4: Boss body
    const da = b.alive ? 1 : Math.max(0, 1 - this.vt * 0.8);
    if (da > 0) {
      if (b.hurtFlash > 0) {
        this.drawFrame(ctx, b.currentFrame, bx + shk, by + shk, sz, da);
        ctx.fillStyle = `rgba(255,100,60,${b.hurtFlash * 1.5})`;
        ctx.beginPath(); ctx.arc(bx, by, sz * 0.3, 0, Math.PI * 2); ctx.fill();
      } else {
        this.drawFrame(ctx, b.currentFrame, bx + shk, by + shk, sz, da);
      }
    }

    // Layer 5: Death — dark smoke + ember scatter (NO white smokePuff)
    if (!b.alive && this.vt < 1.5) {
      this.drawDarkSmoke(ctx, bx, by, sz * (0.5 + this.vt * 0.3), 1 - this.vt * 0.7);
      this.drawEmberScatter(ctx, bx, by, sz * 0.4, 8, this.vt, 0.6);
    }

    ctx.fillStyle = '#FF8040'; ctx.font = `bold ${this.ss(9)}px JetBrains Mono, monospace`; ctx.textAlign = 'center';
    ctx.fillText(b.state.toUpperCase(), bx, by - sz * 0.52);
  }

  renderGroundFx(ctx) {
    for (const e of this.boss.effects) {
      const ex = this.sx(e.x), ey = this.sy(e.y);

      if (e.type === 'meteor_mark') {
        const r = this.ss(e.radius), pulse = Math.sin(e.timer * 14) * 0.3 + 0.7;
        const progress = e.timer / e.telegraph;
        // CLEAN: xMarker and targetRing are good cells
        this.drawFx(ctx, BOSS1_SKILLS.xMarker, ex, ey, r * (1.8 + progress * 0.4), pulse * 0.7);
        this.drawFx(ctx, BOSS1_SKILLS.targetRing, ex, ey, r * (2 + progress * 0.6), pulse * 0.25);

      } else if (e.type === 'meteor_explode') {
        const r = this.ss(e.radius), a = 1 - e.timer / e.duration;
        // Meteor descending — CLEAN cell
        if (e.timer < 0.15) {
          const meteorSize = r * 1.5;
          this.drawFx(ctx, BOSS1_SKILLS.meteor, ex, ey - r * (1 - e.timer * 6), meteorSize, a);
        }
        // Impact — CODE-DRIVEN fire burst (replaces dirty fireBurst cell)
        this.drawFireBurst(ctx, ex, ey, r * (1 + e.timer * 2.5), a * 0.8);
        this.drawEmberScatter(ctx, ex, ey, r, 6, e.timer * 2, a * 0.5);
        // Faint ground mark using code
        this.drawFireAura(ctx, ex, ey, r * 0.8, a * 0.2);

      } else if (e.type === 'ring') {
        const r = this.ss(e.currentRadius), a = 1 - e.timer / e.duration;
        // CLEAN: flameRing cell is good
        this.drawFx(ctx, BOSS1_SKILLS.flameRing, ex, ey, r * 2.2, a * 0.55);
        // Crisp ring stroke
        ctx.strokeStyle = `rgba(255,55,12,${a * 0.4})`; ctx.lineWidth = this.ss(e.ringThickness * 0.25);
        ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.stroke();

      } else if (e.type === 'pillar_mark') {
        const r = this.ss(e.radius), pulse = Math.sin(e.timer * 18) * 0.3 + 0.7;
        // CLEAN: targetRing is good for warning
        this.drawFx(ctx, BOSS1_SKILLS.targetRing, ex, ey, r * 1.6, pulse * 0.5);
        // Code-driven pulsing red circle
        ctx.strokeStyle = `rgba(255,50,15,${pulse * 0.5})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ex, ey, this.ss(e.radius * 0.6), 0, Math.PI * 2); ctx.stroke();

      } else if (e.type === 'pillar_fire') {
        const r = this.ss(e.radius), a = 1 - e.timer / e.duration;
        // CODE-DRIVEN flame pillar (replaces dirty flamePillar cell with baked base)
        this.drawFlamePillarCode(ctx, ex, ey, r * 0.8, this.ss(50) * a, a * 0.9);
        this.drawEmberScatter(ctx, ex, ey - this.ss(15), r * 0.4, 4, e.timer, a * 0.4);
      }
    }
  }

  renderProjectiles(ctx) {
    for (const p of this.boss.projectiles) {
      const px = this.sx(p.x), py = this.sy(p.y), sz = this.ss(p.radius * 3);
      const angle = (p.age || 0) * 6;
      const pulse = 0.85 + Math.sin((p.age || 0) * 12) * 0.15;
      // CLEAN: fireball cell is a clean projectile
      this.drawFxRot(ctx, BOSS1_SKILLS.fireball, px, py, sz * pulse, angle, 0.85);
      // Code-driven glow trail
      ctx.fillStyle = `rgba(255,60,15,0.15)`;
      ctx.beginPath(); ctx.arc(px, py, this.ss(p.radius * 0.6), 0, Math.PI * 2); ctx.fill();
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
    const px = m, py = h - m - bh - f - 4 * d, pw = 110 * d;
    ctx.fillStyle = 'rgba(8,12,24,0.9)'; ctx.fillRect(px - 3 * d, py - 3 * d, pw + 6 * d, bh + f + 10 * d);
    ctx.fillStyle = '#00E5FF'; ctx.font = `bold ${f}px Rajdhani,sans-serif`; ctx.textAlign = 'left'; ctx.fillText('PLAYER', px, py + f);
    const ph = this.player.hp / this.player.maxHp;
    ctx.fillStyle = '#081515'; ctx.fillRect(px, py + f + 2 * d, pw, bh);
    ctx.fillStyle = ph > 0.3 ? '#00E5FF' : '#FF335C'; ctx.fillRect(px, py + f + 2 * d, pw * ph, bh);
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
