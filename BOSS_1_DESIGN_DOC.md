# BOSS-1: FIRE ECHO - Design Document

## Overview

Fire Echo is the first boss of Echo Heist. A red-themed fire elemental that guards the final stage. The fight takes place in a dedicated arena (600x500 units) separate from the main game levels.

**Access:** `?stage=boss-1` URL parameter or completing level 10.

---

## Boss Stats

| Stat | Value |
|------|-------|
| HP | 300 |
| Collision radius | 55px |
| Contact damage | 25/s |
| Enrage threshold | 30% HP (90 HP) |
| Invulnerable during | Armageddon (10.5s) |

---

## Boss States (State Machine)

```
idle (0.8s) -> tracking -> casting (0.5s) -> cooldown (1.0s) -> tracking
```

| State | Duration | Behavior |
|-------|----------|----------|
| `idle` | 0.8s | Alternates idle/idleAlt poses. Enrage pose if HP <= 30% |
| `tracking` | until attack ready | Faces player directionally (moveLeft/Right/Up/Down). Selects next attack |
| `casting` | 0.5s | Alternates castCharge/castRelease poses. Screen shake. Executes attack at end |
| `cooldown` | 1.0s | Returns to idle pose, waits before re-entering tracking |

---

## Boss Sprites

### Body Spritesheet: `boss-final.png` (1672x1254, 4x3 grid, 418px cells)

| Cell | Pose | Usage |
|------|------|-------|
| (0,0) | idle | Default standing pose |
| (1,0) | idleAlt | Breathing variation |
| (2,0) | moveLeft | Tracking player to the left |
| (3,0) | moveRight | Tracking player to the right |
| (0,1) | moveUp | Tracking player upward |
| (1,1) | moveDown | Tracking player downward |
| (2,1) | castCharge | Arms raised, charging attack |
| (3,1) | castRelease | Arms thrust, releasing attack |
| (0,2) | hurt | Recoiling from damage |
| (1,2) | enrage | Fury mode at 30% HP |
| (2,2) | dead | Defeated, X eyes |
| (3,2) | spawnIntro | Materializing entrance |

### Skills Spritesheet: `skills-final.png` (1254x1254, 4x4 grid, 313px cells)

| # | Cell | Name | Usage |
|---|------|------|-------|
| 1 | (0,0) | fireball | Projectile sprite |
| 2 | (1,0) | meteor | Falling meteor during descent |
| 3 | (2,0) | meteorImpact | Clone explosion effect |
| 4 | (3,0) | flameRing | (unused - replaced by code-driven ring) |
| 5 | (0,1) | flamePillar | Fire pillar effect |
| 6 | (1,1) | xMarker | Meteor telegraph ground mark |
| 7 | (2,1) | targetRing | Warning circle |
| 8 | (3,1) | castSigil | Magic symbol during casting |
| 9 | (0,2) | hitSpark | Damage flash |
| 10 | (1,2) | emberBurst | Scattered embers |
| 11 | (2,2) | fireWave | Horizontal fire wave |
| 12 | (3,2) | groundBurn | Scorched ground |
| 13 | (0,3) | chargeAura | Energy gathering overlay (used during cast for meteor/fireball/pillars) |
| 14 | (1,3) | shieldBarrier | Barrier overlay (used during flame ring cast) |
| 15 | (2,3) | smokePuff | Normal meteor impact explosion |
| 16 | (3,3) | deathExplosion | Ultra meteor / armageddon impact explosion |

### Platform: `boss1-platform.png` (418x200, single image)

Red glowing tech-circle rendered under the boss.

---

## Attack Table

| # | Attack | Damage | Cooldown | Probability | Description |
|---|--------|--------|----------|-------------|-------------|
| 0 | **Meteor** | 70 | 2.2s | base 1, far x2 | Marks ground with xMarker at player position. After 0.9s telegraph, meteor falls angularly from boss position. Explodes with smokePuff |
| 1 | **Fireball** | 15 | 1.4s | base 1, far x2 | Direct projectile toward player. Sprite rotates to face travel direction. Speed: 280 |
| 2 | **Flame Ring** | 18 | 3.5s | base 1, close x3 | Boss disappears behind shieldBarrier. Expanding fire ring (radius 30->220). Code-driven ring with ember particles |
| 3 | **Fire Pillars** | 12 x5 | 4.2s | base 1 | 5 sequential flamePillar sprites near player position (350ms between each). targetRing telegraph for 0.5s |
| 4 | **Ultra Meteor** | 35 x15 | 5.0s | 1/3 chance | 15 random meteors across arena, 200ms interval. Screen flickers red. Impacts use deathExplosion sprite |
| - | **Contact** | 25/s | - | - | Touching the boss directly |
| ☠ | **Armageddon** | 30 x50 | one-time | auto at 30% HP | 50 random meteors across arena, 200ms interval (10s total). Meteors avoid clustering (80px min from last 3). Boss invulnerable for 10.5s. Full screen fire effect + "ARMAGEDDON" text + screen shake |

### Attack Selection Logic

- Each attack has an independent cooldown timer
- No attack repeats more than 2 times consecutively
- Distance-based weighting:
  - **Close (<120px):** Flame Ring weight x3 (punishes melee)
  - **Far (>260px):** Meteor and Fireball weight x2 (ranged pressure)
  - **Ultra Meteor:** 33% chance to be available per selection cycle
- Armageddon bypasses selection — triggers automatically once at 30% HP

---

## Visual Effects (Code-Driven)

| Effect | Trigger | Description |
|--------|---------|-------------|
| Fire aura | Always | Subtle red/orange radial glow around boss |
| Fire particles | Always | Ember dots floating around boss |
| Cast sigil | Casting (non-ring) | Rotating magic symbol below boss |
| Charge aura | Casting (non-ring) | Energy gathering sprite overlay |
| Shield barrier | Casting (ring) | Boss hidden behind barrier, all other layers hidden |
| Platform glow | Always | Tech-circle rendered under boss feet |
| Damage flash | Player hit | Red screen overlay |
| Ultra flash | Ultra meteor cast | Red screen flicker |
| Armageddon fire | Armageddon trigger | Full screen fire gradient from bottom, rising particles, screen shake, "ARMAGEDDON" text |
| Hurt flash | Boss takes damage | Orange glow on boss body |
| Death smoke | Boss dies | Dark smoke + ember scatter, boss fades out |

---

## Player Stats (Boss Arena)

| Stat | Value |
|------|-------|
| HP | 100 |
| Speed | 200 |
| Collision radius | 16px |
| Invulnerability on hit | 0.5s |

### Player Abilities

| Key | Ability | Damage | Range | Cooldown | Description |
|-----|---------|--------|-------|----------|-------------|
| E / Space | Melee attack | 10 | 60px | 0.4s | Direct hit on boss |
| R | Explosive clone | 40 | 60px | none | Drops clone at position. Explodes after 2.5s. Shows countdown ring. Explosion uses meteorImpact sprite |

### Player Rendering

- Uses game sprites: `player_thief_idle.png` (4 frames) and `player_thief_walk.png` (6 frames)
- Animated at 8 FPS
- Blinks during invulnerability frames

---

## Boss Phases

### Phase 1: Normal (100% - 30% HP)
- Cycles through all 5 attacks based on cooldowns and probability
- Alternates idle poses, tracks player directionally

### Phase 2: Enrage + Armageddon (30% HP trigger)
1. Boss enters enrage pose
2. Armageddon fires automatically (50 meteors, boss invulnerable)
3. Screen fire effect + "ARMAGEDDON" text
4. After 10.5s, boss resumes fighting with enrage pose
5. All 5 attacks available again

### Defeat
- Boss plays dead animation, dark smoke + ember scatter
- Fades out over 2 seconds
- "BOSS DEFEATED" screen with time display

---

## Audio

| Track | File | BPM | Style |
|-------|------|-----|-------|
| Boss music | `assets/track-boss.mp3` | 178 | DnB |

- Music preloads before fight starts
- Requires user tap to play (browser audio policy)
- Stops on victory or defeat

---

## Technical Notes

### File Structure
```
src/boss.js        — FireEchoBoss class (AI, attacks, damage, state machine)
src/boss-stage.js  — BossStage class (rendering, player input, HUD, effects)
assets/boss-final.png      — 12 body poses (4x3, 418px cells)
assets/skills-final.png    — 16 skill effects (4x4, 313px cells)
assets/boss1-platform.png  — Platform circle (418x200)
assets/track-boss.mp3      — Boss battle music
```

### URL Access
- Direct: `?stage=boss-1`
- Debug: `?stage=boss-1&debug=true`

### Arena Dimensions
- Width: 600 units
- Height: 500 units
- Player spawn: (300, 420) — bottom center
- Boss position: (300, 100) — top center
