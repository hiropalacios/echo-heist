// FireEchoBoss — Boss-1 for ECHO HEIST

// Sprite crop constants (adjust if needed)
const BOSS_SPRITE = { sx: 0, sy: 0, sw: 224, sh: 700 };
const SKILL_SPRITES = {
  projectile: { sx: 0, sy: 200, sw: 112, sh: 140 },
  target:     { sx: 0, sy: 400, sw: 112, sh: 140 },
  aura:       { sx: 0, sy: 560, sw: 112, sh: 140 },
  ring:       { sx: 0, sy: 750, sw: 112, sh: 140 },
  burst:      { sx: 0, sy: 940, sw: 112, sh: 140 },
};

export class FireEchoBoss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 300;
    this.maxHp = 300;
    this.radius = 40;
    this.alive = true;

    // State machine
    this.state = 'idle'; // idle, tracking, casting, attacking, cooldown, stunned, dead
    this.stateTimer = 0;

    // Attack system
    this.currentAttack = null;
    this.attackCooldown = 0;
    this.lastAttack = -1;
    this.repeatCount = 0;

    // Projectiles and effects active in the world
    this.projectiles = [];
    this.effects = []; // ground marks, rings, pillars

    // Animation
    this.floatOffset = 0;
    this.auraAlpha = 0.5;
    this.castShake = 0;

    // Attack definitions
    this.attacks = [
      { name: 'meteor', cooldown: 2.2, fn: () => this.castMeteorMark() },
      { name: 'fireball', cooldown: 1.4, fn: () => this.castFireball() },
      { name: 'ring', cooldown: 3.5, fn: () => this.castFlameRing() },
      { name: 'pillars', cooldown: 4.2, fn: () => this.castFirePillars() },
    ];
    this.attackCooldowns = [0, 0, 0, 0];

    // Player reference (set externally)
    this.targetX = 0;
    this.targetY = 0;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    this.castShake = 0.2;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.state = 'dead';
    }
  }

  update(dt, playerX, playerY) {
    if (!this.alive) return;

    this.targetX = playerX;
    this.targetY = playerY;
    this.floatOffset = Math.sin(Date.now() * 0.003) * 4;
    this.auraAlpha = 0.4 + Math.sin(Date.now() * 0.005) * 0.2;
    if (this.castShake > 0) this.castShake -= dt;

    // Update cooldowns
    for (let i = 0; i < this.attackCooldowns.length; i++) {
      if (this.attackCooldowns[i] > 0) this.attackCooldowns[i] -= dt;
    }
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // State machine
    switch (this.state) {
      case 'idle':
        this.stateTimer += dt;
        if (this.stateTimer > 0.8) {
          this.state = 'tracking';
          this.stateTimer = 0;
        }
        break;

      case 'tracking':
        // Choose attack
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
        this.stateTimer += dt;
        if (this.stateTimer > 0.5) {
          // Execute attack
          this.attacks[this.currentAttack].fn();
          this.attackCooldowns[this.currentAttack] = this.attacks[this.currentAttack].cooldown;
          this.attackCooldown = 0.8; // global cooldown between any attacks
          this.state = 'cooldown';
          this.stateTimer = 0;
          // Track repeats
          if (this.currentAttack === this.lastAttack) this.repeatCount++;
          else this.repeatCount = 0;
          this.lastAttack = this.currentAttack;
        }
        break;

      case 'cooldown':
        this.stateTimer += dt;
        if (this.stateTimer > 1.0) {
          this.state = 'tracking';
          this.stateTimer = 0;
        }
        break;
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.lifetime -= dt;
      p.rotation = (p.rotation || 0) + dt * 5;
      if (p.lifetime <= 0 || p.x < -50 || p.x > 2000 || p.y < -50 || p.y > 2000) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update effects (marks, rings, pillars)
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.timer += dt;

      if (e.type === 'meteor_mark') {
        if (e.timer >= e.telegraph) {
          e.type = 'meteor_explode';
          e.timer = 0;
          e.duration = 0.4;
        }
      } else if (e.type === 'meteor_explode') {
        if (e.timer >= e.duration) {
          this.effects.splice(i, 1);
        }
      } else if (e.type === 'ring') {
        e.currentRadius = e.startRadius + (e.endRadius - e.startRadius) * (e.timer / e.duration);
        if (e.timer >= e.duration) {
          this.effects.splice(i, 1);
        }
      } else if (e.type === 'pillar_mark') {
        if (e.timer >= e.telegraph) {
          e.type = 'pillar_fire';
          e.timer = 0;
          e.duration = 0.5;
        }
      } else if (e.type === 'pillar_fire') {
        if (e.timer >= e.duration) {
          this.effects.splice(i, 1);
        }
      }
    }
  }

  chooseAttack(px, py) {
    const dist = Math.sqrt((px - this.x) ** 2 + (py - this.y) ** 2);
    const available = [];

    for (let i = 0; i < this.attacks.length; i++) {
      if (this.attackCooldowns[i] <= 0) {
        // Don't repeat more than twice
        if (i === this.lastAttack && this.repeatCount >= 2) continue;

        let weight = 1;
        if (dist < 120) {
          // Close: prefer ring
          if (i === 2) weight = 3; // ring
        } else if (dist > 260) {
          // Far: prefer fireball or meteor
          if (i === 0) weight = 2; // meteor
          if (i === 1) weight = 2; // fireball
        }
        for (let w = 0; w < weight; w++) available.push(i);
      }
    }

    if (available.length === 0) return -1;
    return available[Math.floor(Math.random() * available.length)];
  }

  // ─── ATTACK IMPLEMENTATIONS ─────────────────────

  castMeteorMark() {
    this.effects.push({
      type: 'meteor_mark',
      x: this.targetX,
      y: this.targetY,
      radius: 48,
      damage: 20,
      telegraph: 0.9,
      timer: 0,
    });
  }

  castFireball() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 280;
    this.projectiles.push({
      x: this.x,
      y: this.y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      radius: 18,
      damage: 15,
      lifetime: 2.5,
      rotation: 0,
    });
  }

  castFlameRing() {
    this.effects.push({
      type: 'ring',
      x: this.x,
      y: this.y,
      startRadius: 30,
      endRadius: 220,
      currentRadius: 30,
      ringThickness: 22,
      damage: 18,
      duration: 1.0,
      timer: 0,
    });
  }

  castFirePillars() {
    // Spawn 5 pillars sequentially at player positions
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (!this.alive) return;
        this.effects.push({
          type: 'pillar_mark',
          x: this.targetX + (Math.random() - 0.5) * 20,
          y: this.targetY + (Math.random() - 0.5) * 20,
          radius: 36,
          damage: 12,
          telegraph: 0.5,
          timer: 0,
        });
      }, i * 350);
    }
  }

  // ─── COLLISION CHECK ─────────────────────────────

  checkPlayerHit(px, py, pr) {
    let totalDamage = 0;

    // Projectile hits
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const dist = Math.sqrt((px - p.x) ** 2 + (py - p.y) ** 2);
      if (dist < pr + p.radius) {
        totalDamage += p.damage;
        this.projectiles.splice(i, 1);
      }
    }

    // Effect hits
    for (const e of this.effects) {
      if (e.type === 'meteor_explode') {
        const dist = Math.sqrt((px - e.x) ** 2 + (py - e.y) ** 2);
        if (dist < pr + e.radius && e.timer < 0.1) { // only first frame
          totalDamage += e.damage;
        }
      } else if (e.type === 'ring') {
        const dist = Math.sqrt((px - e.x) ** 2 + (py - e.y) ** 2);
        if (Math.abs(dist - e.currentRadius) < e.ringThickness / 2 + pr) {
          if (!e._hit) { totalDamage += e.damage; e._hit = true; }
        }
      } else if (e.type === 'pillar_fire') {
        const dist = Math.sqrt((px - e.x) ** 2 + (py - e.y) ** 2);
        if (dist < pr + e.radius && e.timer < 0.1) {
          totalDamage += e.damage;
        }
      }
    }

    return totalDamage;
  }
}

// Sprite constants for external renderers
export { BOSS_SPRITE, SKILL_SPRITES };
