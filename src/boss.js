// FireEchoBoss — Boss-1 for ECHO HEIST
// boss-final.png: 1254x1254, 3x3 grid (418px cells) — body poses
// skills-final.png: 1254x1254, 4x4 grid (~313px cells) — FX

const BC = 418; // boss cell size (4x3 grid in 1672x1254)
const SC = 313; // skill cell size (4x4 grid in 1254x1254)

export const BOSS1_FRAMES = {
  idle:        { x: 0,      y: 0,    w: BC, h: BC },
  idleAlt:     { x: BC,     y: 0,    w: BC, h: BC },
  moveLeft:    { x: BC*2,   y: 0,    w: BC, h: BC },
  moveRight:   { x: BC*3,   y: 0,    w: BC, h: BC },
  moveUp:      { x: 0,      y: BC,   w: BC, h: BC },
  moveDown:    { x: BC,     y: BC,   w: BC, h: BC },
  castCharge:  { x: BC*2,   y: BC,   w: BC, h: BC },
  castRelease: { x: BC*3,   y: BC,   w: BC, h: BC },
  hurt:        { x: 0,      y: BC*2, w: BC, h: BC },
  enrage:      { x: BC,     y: BC*2, w: BC, h: BC },
  dead:        { x: BC*2,   y: BC*2, w: BC, h: BC },
  spawnIntro:  { x: BC*3,   y: BC*2, w: BC, h: BC },
};

export const BOSS1_SKILLS = {
  fireball:       { x: 0,    y: 0,    w: SC, h: SC },
  meteor:         { x: SC,   y: 0,    w: SC, h: SC },
  meteorImpact:   { x: SC*2, y: 0,    w: SC, h: SC },
  flameRing:      { x: SC*3, y: 0,    w: SC, h: SC },
  flamePillar:    { x: 0,    y: SC,   w: SC, h: SC },
  xMarker:        { x: SC,   y: SC,   w: SC, h: SC },
  targetRing:     { x: SC*2, y: SC,   w: SC, h: SC },
  castSigil:      { x: SC*3, y: SC,   w: SC, h: SC },
  hitSpark:       { x: 0,    y: SC*2, w: SC, h: SC },
  emberBurst:     { x: SC,   y: SC*2, w: SC, h: SC },
  fireWave:       { x: SC*2, y: SC*2, w: SC, h: SC },
  groundBurn:     { x: SC*3, y: SC*2, w: SC, h: SC },
  chargeAura:     { x: 0,    y: SC*3, w: SC, h: SC },
  shieldBarrier:  { x: SC,   y: SC*3, w: SC, h: SC },
  smokePuff:      { x: SC*2, y: SC*3, w: SC, h: SC },
  deathExplosion: { x: SC*3, y: SC*3, w: SC, h: SC },
};

// ─── FireEchoBoss ──────────────────────────────────────────────

export class FireEchoBoss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 300;
    this.maxHp = 300;
    this.radius = 55;
    this.alive = true;
    this.state = 'idle';
    this.stateTimer = 0;
    this.currentFrame = BOSS1_FRAMES.idle;
    this.currentAttack = null;
    this.attackCooldown = 0;
    this.lastAttack = -1;
    this.repeatCount = 0;
    this.enraged = false;
    this.projectiles = [];
    this.effects = [];
    this.floatPhase = 0;
    this.floatOffset = 0;
    this.auraAlpha = 0.5;
    this.auraScale = 1;
    this.castShake = 0;
    this.hurtFlash = 0;
    this.idleTimer = 0;
    this.attacks = [
      { name: 'meteor', cooldown: 2.2 },
      { name: 'fireball', cooldown: 1.4 },
      { name: 'ring', cooldown: 3.5 },
      { name: 'pillars', cooldown: 4.2 },
      { name: 'ultra_meteor', cooldown: 5.0 },
    ];
    this.attackCooldowns = [0, 0, 0, 0, 0];
    this.targetX = 0;
    this.targetY = 0;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    this.castShake = 0.15;
    this.hurtFlash = 0.2;
    this.currentFrame = BOSS1_FRAMES.hurt;
    if (!this.enraged && this.hp <= this.maxHp * 0.3) {
      this.enraged = true;
      this.currentFrame = BOSS1_FRAMES.enrage;
    }
    if (this.hp <= 0) { this.hp = 0; this.alive = false; this.state = 'dead'; this.currentFrame = BOSS1_FRAMES.dead; }
  }

  update(dt, playerX, playerY) {
    if (!this.alive) return;
    this.targetX = playerX;
    this.targetY = playerY;

    // Smooth animations
    this.floatPhase += dt * 2.5;
    this.floatOffset = Math.sin(this.floatPhase) * 4;
    this.auraAlpha = 0.3 + Math.sin(this.floatPhase * 0.8) * 0.12;
    this.auraScale = 1 + Math.sin(this.floatPhase * 1.2) * 0.04;
    this.idleTimer += dt;
    if (this.castShake > 0) this.castShake = Math.max(0, this.castShake - dt);
    if (this.hurtFlash > 0) this.hurtFlash = Math.max(0, this.hurtFlash - dt);

    for (let i = 0; i < 4; i++) if (this.attackCooldowns[i] > 0) this.attackCooldowns[i] -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Directional frame helper
    const dx = playerX - this.x;
    const dy = playerY - this.y;

    switch (this.state) {
      case 'idle':
        // Alternate idle poses smoothly
        this.currentFrame = this.idleTimer % 1.4 < 0.7 ? BOSS1_FRAMES.idle : BOSS1_FRAMES.idleAlt;
        if (this.enraged) this.currentFrame = BOSS1_FRAMES.enrage;
        this.stateTimer += dt;
        if (this.stateTimer > 0.8) { this.state = 'tracking'; this.stateTimer = 0; }
        break;

      case 'tracking':
        // Use directional frames based on player position
        if (Math.abs(dx) > Math.abs(dy)) {
          this.currentFrame = dx < 0 ? BOSS1_FRAMES.moveLeft : BOSS1_FRAMES.moveRight;
        } else {
          this.currentFrame = dy < 0 ? BOSS1_FRAMES.moveUp : BOSS1_FRAMES.moveDown;
        }
        if (this.enraged) this.currentFrame = BOSS1_FRAMES.enrage;
        if (this.attackCooldown <= 0) {
          const idx = this.chooseAttack(playerX, playerY);
          if (idx >= 0) {
            this.currentAttack = idx;
            this.state = 'casting';
            this.stateTimer = 0;
            this.castShake = 0.3;
          }
        }
        break;

      case 'casting':
        this.currentFrame = this.stateTimer % 0.3 < 0.15 ? BOSS1_FRAMES.castCharge : BOSS1_FRAMES.castRelease;
        this.stateTimer += dt;
        if (this.stateTimer > 0.5) {
          this.currentFrame = BOSS1_FRAMES.castRelease;
          this.executeAttack(this.currentAttack);
          this.attackCooldowns[this.currentAttack] = this.attacks[this.currentAttack].cooldown;
          this.attackCooldown = 0.8;
          this.state = 'cooldown';
          this.stateTimer = 0;
          if (this.currentAttack === this.lastAttack) this.repeatCount++; else this.repeatCount = 0;
          this.lastAttack = this.currentAttack;
        }
        break;

      case 'cooldown':
        this.currentFrame = this.enraged ? BOSS1_FRAMES.enrage : BOSS1_FRAMES.idle;
        this.stateTimer += dt;
        if (this.stateTimer > 1.0) { this.state = 'tracking'; this.stateTimer = 0; }
        break;
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.lifetime -= dt; p.age = (p.age || 0) + dt;
      if (p.lifetime <= 0 || p.x < -100 || p.x > 2000 || p.y < -100 || p.y > 2000) this.projectiles.splice(i, 1);
    }

    // Update effects
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.timer += dt;
      if (e.type === 'meteor_mark' && e.timer >= e.telegraph) { e.type = 'meteor_explode'; e.timer = 0; e.duration = 0.5; }
      else if (e.type === 'meteor_explode' && e.timer >= e.duration) this.effects.splice(i, 1);
      else if (e.type === 'ring') { e.currentRadius = e.startRadius + (e.endRadius - e.startRadius) * Math.pow(e.timer / e.duration, 0.7); if (e.timer >= e.duration) this.effects.splice(i, 1); }
      else if (e.type === 'pillar_mark' && e.timer >= e.telegraph) { e.type = 'pillar_fire'; e.timer = 0; e.duration = 0.6; }
      else if (e.type === 'pillar_fire' && e.timer >= e.duration) this.effects.splice(i, 1);
    }
  }

  chooseAttack(px, py) {
    const dist = Math.sqrt((px - this.x) ** 2 + (py - this.y) ** 2);
    const avail = [];
    for (let i = 0; i < 5; i++) {
      if (this.attackCooldowns[i] > 0) continue;
      if (i === this.lastAttack && this.repeatCount >= 2) continue;
      let w = 1;
      if (dist < 120 && i === 2) w = 3;
      else if (dist > 260 && i <= 1) w = 2;
      if (i === 4 && Math.random() > 0.333) continue; // ultra meteor — 1/3 chance
      for (let j = 0; j < w; j++) avail.push(i);
    }
    return avail.length === 0 ? -1 : avail[Math.floor(Math.random() * avail.length)];
  }

  executeAttack(idx) {
    [() => this.castMeteorMark(), () => this.castFireball(), () => this.castFlameRing(), () => this.castFirePillars(), () => this.castUltraMeteor()][idx]();
  }

  castMeteorMark() {
    this.effects.push({ type: 'meteor_mark', x: this.targetX, y: this.targetY, radius: 48, damage: 70, telegraph: 0.9, timer: 0, bossX: this.x, bossY: this.y });
  }

  castFireball() {
    const dx = this.targetX - this.x, dy = this.targetY - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    this.projectiles.push({ x: this.x, y: this.y, vx: (dx / d) * 280, vy: (dy / d) * 280, radius: 18, damage: 15, lifetime: 2.5, age: 0 });
  }

  castFlameRing() {
    this.effects.push({ type: 'ring', x: this.x, y: this.y, startRadius: 30, endRadius: 220, currentRadius: 30, ringThickness: 22, damage: 18, duration: 1.0, timer: 0, _hit: false });
  }

  castFirePillars() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (!this.alive) return;
        this.effects.push({ type: 'pillar_mark', x: this.targetX + (Math.random() - 0.5) * 20, y: this.targetY + (Math.random() - 0.5) * 20, radius: 36, damage: 12, telegraph: 0.5, timer: 0 });
      }, i * 350);
    }
  }

  castUltraMeteor() {
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        if (!this.alive) return;
        const rx = 40 + Math.random() * 520; // random across arena (600 wide)
        const ry = 40 + Math.random() * 420; // random across arena (500 tall)
        this.effects.push({ type: 'meteor_mark', x: rx, y: ry, radius: 52, damage: 35, telegraph: 0.4, timer: 0, bossX: this.x, bossY: this.y, ultra: true });
      }, i * 200);
    }
  }

  checkPlayerHit(px, py, pr) {
    let dmg = 0;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (Math.sqrt((px - p.x) ** 2 + (py - p.y) ** 2) < pr + p.radius) { dmg += p.damage; this.projectiles.splice(i, 1); }
    }
    for (const e of this.effects) {
      const dist = Math.sqrt((px - e.x) ** 2 + (py - e.y) ** 2);
      if (e.type === 'meteor_explode' && dist < pr + e.radius && e.timer < 0.1) dmg += e.damage;
      else if (e.type === 'ring' && Math.abs(dist - e.currentRadius) < e.ringThickness / 2 + pr && !e._hit) { dmg += e.damage; e._hit = true; }
      else if (e.type === 'pillar_fire' && dist < pr + e.radius && e.timer < 0.1) dmg += e.damage;
    }
    return dmg;
  }
}
