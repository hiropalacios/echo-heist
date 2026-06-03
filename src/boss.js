// FireEchoBoss — Boss-1 for ECHO HEIST
// Uses: assets/boss1.png (3x3 body poses) + assets/boss1-skills.png (4x4 fire FX)

// ─── Sprite crop constants ─────────────────────────────────────
// boss1.png: 1122x1402, 3 columns x 3 rows
const BOSS_FRAME_W = 374;
const BOSS_FRAME_H = 467;

export const BOSS_POSES = {
  idle:     { col: 0, row: 0 },
  idle2:    { col: 1, row: 0 },
  idle3:    { col: 2, row: 0 },
  castL:    { col: 0, row: 1 },
  castR:    { col: 1, row: 1 },
  castBoth: { col: 2, row: 1 },
  hit:      { col: 0, row: 2 },
  special:  { col: 1, row: 2 },
  down:     { col: 2, row: 2 },
};

// boss1-skills.png: 1122x1402, 4 columns x 4 rows
const SKILL_FRAME_W = 280;
const SKILL_FRAME_H = 350;

export const SKILL_FX = {
  meteorFall:    { col: 0, row: 0 },
  fireBurst:     { col: 1, row: 0 },
  fireball:      { col: 2, row: 0 },
  targetX:       { col: 3, row: 0 },
  fireRing:      { col: 0, row: 1 },
  firePillar:    { col: 1, row: 1 },
  darkExplosion: { col: 2, row: 1 },
  burstSpark:    { col: 3, row: 1 },
  ringSigil:     { col: 0, row: 2 },
  fireColumn:    { col: 1, row: 2 },
  groundMark:    { col: 2, row: 2 },
  particles:     { col: 3, row: 2 },
  starBurst:     { col: 0, row: 3 },
  ringGlow:      { col: 1, row: 3 },
  ringTarget:    { col: 2, row: 3 },
  fireWave:      { col: 3, row: 3 },
};

export function getBossSrcRect(pose) {
  return { sx: pose.col * BOSS_FRAME_W, sy: pose.row * BOSS_FRAME_H, sw: BOSS_FRAME_W, sh: BOSS_FRAME_H };
}

export function getSkillSrcRect(fx) {
  return { sx: fx.col * SKILL_FRAME_W, sy: fx.row * SKILL_FRAME_H, sw: SKILL_FRAME_W, sh: SKILL_FRAME_H };
}

// ─── FireEchoBoss ──────────────────────────────────────────────

export class FireEchoBoss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 300;
    this.maxHp = 300;
    this.radius = 40;
    this.alive = true;
    this.state = 'idle';
    this.stateTimer = 0;
    this.currentPose = BOSS_POSES.idle;
    this.currentAttack = null;
    this.attackCooldown = 0;
    this.lastAttack = -1;
    this.repeatCount = 0;
    this.projectiles = [];
    this.effects = [];
    this.floatOffset = 0;
    this.auraAlpha = 0.5;
    this.castShake = 0;
    this.idleFrame = 0;
    this.attacks = [
      { name: 'meteor',  cooldown: 2.2 },
      { name: 'fireball', cooldown: 1.4 },
      { name: 'ring',    cooldown: 3.5 },
      { name: 'pillars', cooldown: 4.2 },
    ];
    this.attackCooldowns = [0, 0, 0, 0];
    this.targetX = 0;
    this.targetY = 0;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    this.castShake = 0.25;
    this.currentPose = BOSS_POSES.hit;
    if (this.hp <= 0) { this.hp = 0; this.alive = false; this.state = 'dead'; this.currentPose = BOSS_POSES.down; }
  }

  update(dt, playerX, playerY) {
    if (!this.alive) return;
    this.targetX = playerX;
    this.targetY = playerY;
    this.floatOffset = Math.sin(Date.now() * 0.003) * 5;
    this.auraAlpha = 0.35 + Math.sin(Date.now() * 0.005) * 0.15;
    this.idleFrame += dt;
    if (this.castShake > 0) this.castShake -= dt;

    for (let i = 0; i < 4; i++) if (this.attackCooldowns[i] > 0) this.attackCooldowns[i] -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    switch (this.state) {
      case 'idle':
        this.currentPose = this.idleFrame % 2 < 1 ? BOSS_POSES.idle : BOSS_POSES.idle2;
        this.stateTimer += dt;
        if (this.stateTimer > 0.8) { this.state = 'tracking'; this.stateTimer = 0; }
        break;
      case 'tracking':
        this.currentPose = BOSS_POSES.idle3;
        if (this.attackCooldown <= 0) {
          const idx = this.chooseAttack(playerX, playerY);
          if (idx >= 0) {
            this.currentAttack = idx;
            this.state = 'casting';
            this.stateTimer = 0;
            this.castShake = 0.4;
            this.currentPose = idx <= 1 ? BOSS_POSES.castR : BOSS_POSES.castBoth;
          }
        }
        break;
      case 'casting':
        this.stateTimer += dt;
        if (this.stateTimer > 0.5) {
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
        this.currentPose = BOSS_POSES.idle;
        this.stateTimer += dt;
        if (this.stateTimer > 1.0) { this.state = 'tracking'; this.stateTimer = 0; }
        break;
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.lifetime -= dt; p.age = (p.age || 0) + dt;
      if (p.lifetime <= 0 || p.x < -100 || p.x > 2000 || p.y < -100 || p.y > 2000) this.projectiles.splice(i, 1);
    }

    // Update effects
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.timer += dt;
      if (e.type === 'meteor_mark' && e.timer >= e.telegraph) { e.type = 'meteor_explode'; e.timer = 0; e.duration = 0.5; }
      else if (e.type === 'meteor_explode' && e.timer >= e.duration) { this.effects.splice(i, 1); }
      else if (e.type === 'ring') { e.currentRadius = e.startRadius + (e.endRadius - e.startRadius) * (e.timer / e.duration); if (e.timer >= e.duration) this.effects.splice(i, 1); }
      else if (e.type === 'pillar_mark' && e.timer >= e.telegraph) { e.type = 'pillar_fire'; e.timer = 0; e.duration = 0.6; }
      else if (e.type === 'pillar_fire' && e.timer >= e.duration) { this.effects.splice(i, 1); }
    }
  }

  chooseAttack(px, py) {
    const dist = Math.sqrt((px - this.x) ** 2 + (py - this.y) ** 2);
    const avail = [];
    for (let i = 0; i < 4; i++) {
      if (this.attackCooldowns[i] > 0) continue;
      if (i === this.lastAttack && this.repeatCount >= 2) continue;
      let w = 1;
      if (dist < 120 && i === 2) w = 3;
      else if (dist > 260 && i <= 1) w = 2;
      for (let j = 0; j < w; j++) avail.push(i);
    }
    return avail.length === 0 ? -1 : avail[Math.floor(Math.random() * avail.length)];
  }

  executeAttack(idx) {
    if (idx === 0) this.castMeteorMark();
    else if (idx === 1) this.castFireball();
    else if (idx === 2) this.castFlameRing();
    else if (idx === 3) this.castFirePillars();
  }

  castMeteorMark() {
    this.effects.push({ type: 'meteor_mark', x: this.targetX, y: this.targetY, radius: 48, damage: 20, telegraph: 0.9, timer: 0 });
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
