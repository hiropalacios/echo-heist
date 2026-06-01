// Level data for ECHO HEIST — multi-level support
// All coordinates in game units. Design space: 20 x 15 units.

export const LEVEL_WIDTH = 20;
export const LEVEL_HEIGHT = 15;

// ─── LEVEL 1: Ghost in the Machine ──────────────────────────────────
const LEVEL_1 = {
  name: 'Ghost in the Machine',
  subtitle: 'Level 1 — Central Bank',
  timerDuration: 90,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 2, y: 12.5 },
  walls: [
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: 12, y: 0.5, w: 0.5, h: 5 },
    { x: 12, y: 7.5, w: 0.5, h: 7 },
    { x: 5, y: 5.5, w: 0.5, h: 4 },
  ],
  buttons: [
    { id: 'btnA', x: 2.5, y: 7, w: 1.5, h: 1.5, linkedDoors: ['doorA'] },
  ],
  doors: [
    { id: 'doorA', x: 12, y: 5.5, w: 0.5, h: 2 },
  ],
  cameras: [
    {
      x: 5.5, y: 5.5,
      sweepCenter: Math.PI * 0.15,
      sweepRange: Math.PI * 0.4,
      sweepSpeed: 0.8,
      coneLength: 5.5,
      coneAngle: Math.PI / 6,
    },
  ],
  guards: [],
  loot: { x: 16, y: 7, r: 0.5 },
  exit: { x: 17, y: 1.5, w: 2, h: 2 },
  floorZones: [
    { x: 12.5, y: 0.5, w: 7, h: LEVEL_HEIGHT - 1, color: '#0C1222' },
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 2, maxEchoes: 1, maxTime: 30 },
    { stars: 4, maxAttempts: 2, maxEchoes: 1, maxTime: 50 },
    { stars: 3, maxAttempts: 3, maxEchoes: 2, maxTime: 70 },
    { stars: 2, maxAttempts: 5, maxEchoes: 4, maxTime: 90 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// ─── LEVEL 2: Double Trouble ────────────────────────────────────────
//
// Layout concept:
//
//   Player spawns bottom-center.
//   A horizontal vault wall at y=6 splits the room in two halves.
//   The vault (loot) is in the TOP half, behind TWO doors.
//   Door A is on the left side of the vault wall.
//   Door B is on the right side of the vault wall.
//   Button A is bottom-left corner.
//   Button B is bottom-right corner.
//   A guard patrols the top half near the loot.
//   A camera watches the corridor between the buttons.
//   Exit is bottom-center (same area as spawn, so player returns after grabbing loot).
//
//   Solution:
//     Attempt 1: Walk to Button A, hold it.
//     Attempt 2: Walk to Button B, hold it.
//     Attempt 3: Echo 1 holds A, Echo 2 holds B, both doors open.
//                Player runs through either door, dodges guard, grabs loot, returns to exit.
//
const LEVEL_2 = {
  name: 'Double Trouble',
  subtitle: 'Level 2 — Central Bank',
  timerDuration: 90,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 10, y: 12.5 },
  walls: [
    // Outer walls
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },

    // === Vault wall — horizontal wall at y=6, full width with 2 door gaps ===
    // Left section: x 0.5 to 6 (door A gap at x: 6 to 8)
    { x: 0.5, y: 6, w: 5.5, h: 0.5 },
    // Center section: x 8 to 12 (solid, no passage)
    { x: 8, y: 6, w: 4, h: 0.5 },
    // Right section: x 14 to 19.5 (door B gap at x: 12 to 14)
    { x: 14, y: 6, w: 5.5, h: 0.5 },

    // Small walls flanking the buttons to create alcoves
    { x: 4, y: 10, w: 0.5, h: 4.5 },   // wall beside button A alcove
    { x: 15.5, y: 10, w: 0.5, h: 4.5 }, // wall beside button B alcove
  ],
  buttons: [
    { id: 'btnA', x: 1.5, y: 12, w: 1.5, h: 1.5, linkedDoors: ['doorA'], label: 'A' },
    { id: 'btnB', x: 17, y: 12, w: 1.5, h: 1.5, linkedDoors: ['doorB'], label: 'B' },
  ],
  doors: [
    { id: 'doorA', x: 6, y: 6, w: 2, h: 0.5 },   // horizontal door on left
    { id: 'doorB', x: 12, y: 6, w: 2, h: 0.5 },   // horizontal door on right
  ],
  cameras: [
    {
      x: 10, y: 6.2,                      // mounted on center vault wall, pointing down
      sweepCenter: Math.PI * 0.5,          // pointing straight down
      sweepRange: Math.PI * 0.6,           // wide sweep
      sweepSpeed: 0.6,
      coneLength: 4.5,
      coneAngle: Math.PI / 7,
    },
  ],
  guards: [
    {
      waypoints: [
        { x: 4, y: 3 },
        { x: 16, y: 3 },
        { x: 16, y: 5 },
        { x: 4, y: 5 },
      ],
      speed: 2.0,
      coneLength: 2.8,
      coneAngle: Math.PI / 5,
      radius: 0.4,
    },
  ],
  loot: { x: 10, y: 3, r: 0.5 },        // top center, behind the vault wall
  exit: { x: 9, y: 13, w: 2, h: 1.2 },  // bottom center, near spawn
  floorZones: [
    // Top vault area — darker tint
    { x: 0.5, y: 0.5, w: LEVEL_WIDTH - 1, h: 5.5, color: '#0C1222' },
    // Button alcoves
    { x: 0.5, y: 10, w: 3.5, h: 4.5, color: '#0C1018' },
    { x: 16, y: 10, w: 3.5, h: 4.5, color: '#0C1018' },
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 3, maxEchoes: 2, maxTime: 40 },
    { stars: 4, maxAttempts: 3, maxEchoes: 2, maxTime: 55 },
    { stars: 3, maxAttempts: 4, maxEchoes: 3, maxTime: 70 },
    { stars: 2, maxAttempts: 6, maxEchoes: 5, maxTime: 90 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// ─── LEVEL 3: Blind Corridor ────────────────────────────────────────
//
//   A narrow vertical corridor with 2 cameras sweeping across it.
//   Button at the top opens the door at the bottom.
//   Player spawns left, exit right.
//   Loot is behind the door at the bottom-right.
//
//   Solution:
//     Attempt 1: Navigate past cameras, reach button at top, hold it.
//     Attempt 2: Echo holds button (door open). Player goes through
//                corridor timing cameras, through door, grabs loot, exits.
//
const LEVEL_3 = {
  name: 'Blind Corridor',
  subtitle: 'Level 3 — Central Bank',
  timerDuration: 75,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 2, y: 7.5 },
  walls: [
    // Outer
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },

    // Corridor walls — vertical passage from x:7 to x:9
    { x: 7, y: 2, w: 0.5, h: 11 },     // left corridor wall (gap top & bottom)
    { x: 9, y: 2, w: 0.5, h: 11 },     // right corridor wall (gap top & bottom)

    // Vault room wall on the right side
    { x: 9.5, y: 5, w: 10, h: 0.5 },     // horizontal wall
    // Door gap at x: 13 to 15
    { x: 9.5, y: 10, w: 3.5, h: 0.5 },
    // door gap x:13 to 15
    { x: 15, y: 10, w: 4.5, h: 0.5 },
  ],
  buttons: [
    { id: 'btnA', x: 1.5, y: 1.5, w: 1.5, h: 1.5, linkedDoors: ['doorA'], label: 'BTN' },
  ],
  doors: [
    { id: 'doorA', x: 13, y: 10, w: 2, h: 0.5 },
  ],
  cameras: [
    {
      x: 7.2, y: 4,
      sweepCenter: 0,             // pointing right into corridor
      sweepRange: Math.PI * 0.3,
      sweepSpeed: 1.2,            // fast sweep
      coneLength: 2.5,
      coneAngle: Math.PI / 7,
    },
    {
      x: 9.3, y: 11,
      sweepCenter: Math.PI,       // pointing left into corridor
      sweepRange: Math.PI * 0.3,
      sweepSpeed: 0.9,
      coneLength: 2.5,
      coneAngle: Math.PI / 7,
    },
  ],
  guards: [],
  loot: { x: 16, y: 7.5, r: 0.5 },
  exit: { x: 14, y: 1.5, w: 2, h: 1.5 },
  floorZones: [
    { x: 7.5, y: 0.5, w: 1.5, h: 14, color: '#0E1520' },  // corridor
    { x: 9.5, y: 5.5, w: 10, h: 4.5, color: '#0C1222' },   // vault area
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 2, maxEchoes: 1, maxTime: 35 },
    { stars: 4, maxAttempts: 3, maxEchoes: 2, maxTime: 50 },
    { stars: 3, maxAttempts: 4, maxEchoes: 3, maxTime: 65 },
    { stars: 2, maxAttempts: 6, maxEchoes: 5, maxTime: 75 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// ─── LEVEL 4: The Gauntlet ──────────────────────────────────────────
//
//   Long horizontal room. Player spawns left.
//   A guard patrols a vertical path in the middle.
//   A camera watches the top corridor.
//   Button on the far right opens the vault door near center.
//   Loot is in a small vault room center-top.
//   Exit is bottom-left.
//
//   Solution:
//     Attempt 1: Sprint right, past guard timing, stand on button.
//     Attempt 2: Echo holds button. Player times guard, enters vault,
//                grabs loot, avoids camera, returns to exit.
//
const LEVEL_4 = {
  name: 'The Gauntlet',
  subtitle: 'Level 4 — Central Bank',
  timerDuration: 70,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 2, y: 12 },
  walls: [
    // Outer
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },

    // Vault room — small box center-top
    { x: 8, y: 0.5, w: 0.5, h: 4 },      // left wall
    { x: 8, y: 5.5, w: 0.5, h: 2 },      // left wall below door
    { x: 12, y: 0.5, w: 0.5, h: 6.5 },   // right wall (solid)
    { x: 8.5, y: 7, w: 3.5, h: 0.5 },    // bottom wall

    // Horizontal divider creating top/bottom paths
    { x: 0.5, y: 9, w: 7.5, h: 0.5 },
    { x: 12.5, y: 9, w: 7, h: 0.5 },
  ],
  buttons: [
    { id: 'btnA', x: 17, y: 10, w: 1.5, h: 1.5, linkedDoors: ['doorA'], label: 'BTN' },
  ],
  doors: [
    { id: 'doorA', x: 8, y: 4.5, w: 0.5, h: 1 },  // vault entrance on left wall
  ],
  cameras: [
    {
      x: 12.3, y: 0.8,
      sweepCenter: Math.PI,        // pointing left along top corridor
      sweepRange: Math.PI * 0.3,
      sweepSpeed: 0.7,
      coneLength: 5,
      coneAngle: Math.PI / 7,
    },
  ],
  guards: [
    {
      waypoints: [
        { x: 10, y: 10 },
        { x: 10, y: 13 },
      ],
      speed: 2.2,
      coneLength: 3,
      coneAngle: Math.PI / 5,
      radius: 0.4,
    },
  ],
  loot: { x: 10, y: 3.5, r: 0.5 },
  exit: { x: 1, y: 13, w: 2, h: 1.2 },
  floorZones: [
    { x: 8.5, y: 0.5, w: 3.5, h: 6.5, color: '#0C1222' },
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 2, maxEchoes: 1, maxTime: 30 },
    { stars: 4, maxAttempts: 3, maxEchoes: 1, maxTime: 45 },
    { stars: 3, maxAttempts: 4, maxEchoes: 2, maxTime: 60 },
    { stars: 2, maxAttempts: 6, maxEchoes: 4, maxTime: 70 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// ─── LEVEL 5: Triple Threat ─────────────────────────────────────────
//
//   Three locked doors in sequence forming a zigzag path to the vault.
//   Each door has its own button in a different corner.
//   2 cameras guard the path.
//   Needs 3 echoes minimum.
//
//   Layout: three horizontal walls creating 4 horizontal lanes.
//   Doors alternate sides.
//
const LEVEL_5 = {
  name: 'Triple Threat',
  subtitle: 'Level 5 — Central Bank',
  timerDuration: 90,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 2, y: 13 },
  walls: [
    // Outer
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },

    // Wall 1 — y=11, door on the RIGHT side
    { x: 0.5, y: 11, w: 14, h: 0.5 },
    // door C gap: x 14.5 to 16.5
    { x: 16.5, y: 11, w: 3, h: 0.5 },

    // Wall 2 — y=7.5, door on the LEFT side
    { x: 0.5, y: 7.5, w: 2, h: 0.5 },
    // door B gap: x 2.5 to 4.5
    { x: 4.5, y: 7.5, w: 15, h: 0.5 },

    // Wall 3 — y=4, door on the RIGHT side
    { x: 0.5, y: 4, w: 13, h: 0.5 },
    // door A gap: x 13.5 to 15.5
    { x: 15.5, y: 4, w: 4, h: 0.5 },
  ],
  buttons: [
    { id: 'btnC', x: 1.5, y: 12.5, w: 1.3, h: 1.3, linkedDoors: ['doorC'], label: 'C' },
    { id: 'btnB', x: 17.5, y: 9, w: 1.3, h: 1.3, linkedDoors: ['doorB'], label: 'B' },
    { id: 'btnA', x: 1.5, y: 5.5, w: 1.3, h: 1.3, linkedDoors: ['doorA'], label: 'A' },
  ],
  doors: [
    { id: 'doorC', x: 14.5, y: 11, w: 2, h: 0.5 },
    { id: 'doorB', x: 2.5, y: 7.5, w: 2, h: 0.5 },
    { id: 'doorA', x: 13.5, y: 4, w: 2, h: 0.5 },
  ],
  cameras: [
    {
      x: 19, y: 9,
      sweepCenter: Math.PI,
      sweepRange: Math.PI * 0.4,
      sweepSpeed: 0.8,
      coneLength: 5,
      coneAngle: Math.PI / 7,
    },
    {
      x: 0.8, y: 6,
      sweepCenter: 0,
      sweepRange: Math.PI * 0.4,
      sweepSpeed: 1.0,
      coneLength: 5,
      coneAngle: Math.PI / 7,
    },
  ],
  guards: [],
  loot: { x: 17, y: 2, r: 0.5 },
  exit: { x: 8.5, y: 1, w: 3, h: 1.5 },
  floorZones: [
    { x: 0.5, y: 0.5, w: LEVEL_WIDTH - 1, h: 3.5, color: '#0C1222' },
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 4, maxEchoes: 3, maxTime: 50 },
    { stars: 4, maxAttempts: 5, maxEchoes: 3, maxTime: 65 },
    { stars: 3, maxAttempts: 6, maxEchoes: 4, maxTime: 80 },
    { stars: 2, maxAttempts: 8, maxEchoes: 6, maxTime: 90 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// ─── LEVEL 6: The Perfect Heist ─────────────────────────────────────
//
//   Final level. Combines everything.
//   Central vault room sealed by 2 doors (left and top).
//   Button A bottom-left, Button B top-right.
//   2 cameras, 2 guards, tight timer.
//   Player must coordinate 2 echoes on buttons while dodging
//   2 guards and 2 cameras to steal and escape.
//
const LEVEL_6 = {
  name: 'The Perfect Heist',
  subtitle: 'Level 6 — Central Bank',
  timerDuration: 75,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 2, y: 13 },
  walls: [
    // Outer
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },

    // Vault room — center of map, sealed box
    // Left wall: above door (y=3.5-6.5), below door (y=8.5 to bottom wall)
    { x: 7, y: 3.5, w: 0.5, h: 3 },
    { x: 7, y: 8.5, w: 0.5, h: 3.5 },
    // Right wall (solid, full height to match bottom wall)
    { x: 13, y: 3.5, w: 0.5, h: 8.5 },
    // Top wall (door B gap x: 9 to 11)
    { x: 7.5, y: 3.5, w: 1.5, h: 0.5 },
    { x: 11, y: 3.5, w: 2, h: 0.5 },
    // Bottom wall (solid, connects left wall to right wall)
    { x: 7.5, y: 11.5, w: 5.5, h: 0.5 },

    // Top corridor divider
    { x: 0.5, y: 2, w: 6.5, h: 0.5 },
    { x: 13.5, y: 2, w: 6, h: 0.5 },
  ],
  buttons: [
    { id: 'btnA', x: 1.5, y: 10, w: 1.5, h: 1.5, linkedDoors: ['doorA'], label: 'A' },
    { id: 'btnB', x: 17, y: 1, w: 1.5, h: 1.3, linkedDoors: ['doorB'], label: 'B' },
  ],
  doors: [
    { id: 'doorA', x: 7, y: 6.5, w: 0.5, h: 2 },    // left vault door
    { id: 'doorB', x: 9, y: 3.5, w: 2, h: 0.5 },     // top vault door
  ],
  cameras: [
    {
      x: 0.8, y: 6,
      sweepCenter: 0,
      sweepRange: Math.PI * 0.5,
      sweepSpeed: 0.7,
      coneLength: 5.5,
      coneAngle: Math.PI / 7,
    },
    {
      x: 19, y: 8,
      sweepCenter: Math.PI,
      sweepRange: Math.PI * 0.4,
      sweepSpeed: 0.9,
      coneLength: 5,
      coneAngle: Math.PI / 7,
    },
  ],
  guards: [
    {
      waypoints: [
        { x: 5, y: 7 },
        { x: 5, y: 13 },
        { x: 2, y: 13 },
        { x: 2, y: 7 },
      ],
      speed: 2.0,
      coneLength: 2.5,
      coneAngle: Math.PI / 5,
      radius: 0.4,
    },
    {
      waypoints: [
        { x: 15, y: 5 },
        { x: 15, y: 12 },
        { x: 18, y: 12 },
        { x: 18, y: 5 },
      ],
      speed: 1.8,
      coneLength: 2.5,
      coneAngle: Math.PI / 5,
      radius: 0.4,
    },
  ],
  loot: { x: 10, y: 7.5, r: 0.6 },
  exit: { x: 16, y: 13, w: 2.5, h: 1.2 },
  floorZones: [
    { x: 7.5, y: 4, w: 5.5, h: 7.5, color: '#100E1E' },  // vault interior (purple tint)
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 3, maxEchoes: 2, maxTime: 35 },
    { stars: 4, maxAttempts: 4, maxEchoes: 2, maxTime: 50 },
    { stars: 3, maxAttempts: 5, maxEchoes: 3, maxTime: 65 },
    { stars: 2, maxAttempts: 7, maxEchoes: 5, maxTime: 75 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// ─── LEVEL 7: Split Decision ────────────────────────────────────────
const LEVEL_7 = {
  name: 'Split Decision',
  subtitle: 'Level 7 — Central Bank',
  timerDuration: 75,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 10, y: 13 },
  walls: [
    // Outer
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },

    // Vertical divider at x=10 with door gap at y=6-8
    { x: 9.75, y: 0.5, w: 0.5, h: 5.5 },
    { x: 9.75, y: 8, w: 0.5, h: 6.5 },
  ],
  buttons: [
    { id: 'btnA', x: 2.25, y: 6.25, w: 1.5, h: 1.5, linkedDoors: ['doorA'], label: 'A' },
  ],
  doors: [
    { id: 'doorA', x: 9.75, y: 6, w: 0.5, h: 2 },
  ],
  cameras: [
    {
      x: 14, y: 2,
      sweepCenter: Math.PI * 0.5,
      sweepRange: Math.PI * 0.4,
      sweepSpeed: 0.8,
      coneLength: 5,
      coneAngle: Math.PI / 6,
    },
  ],
  guards: [
    {
      waypoints: [
        { x: 15, y: 3 },
        { x: 15, y: 12 },
      ],
      speed: 2.0,
      coneLength: 2.5,
      coneAngle: Math.PI / 5,
      radius: 0.4,
    },
  ],
  loot: { x: 15, y: 4, r: 0.5 },
  exit: { x: 1, y: 12, w: 2, h: 2 },
  floorZones: [
    { x: 10.25, y: 0.5, w: 9.25, h: 14, color: '#0C1222' },
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 2, maxEchoes: 1, maxTime: 30 },
    { stars: 4, maxAttempts: 3, maxEchoes: 1, maxTime: 45 },
    { stars: 3, maxAttempts: 4, maxEchoes: 2, maxTime: 60 },
    { stars: 2, maxAttempts: 6, maxEchoes: 4, maxTime: 75 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// ─── LEVEL 8: Watchful Eyes ─────────────────────────────────────────
// Watchful Eyes — 3 cameras, timing-heavy
//
//   ┌────────────────────────────────────┐
//   │                                   │
//   │  EXIT     ◆ LOOT        CAM3↓     │
//   │         CAM2↓                     │
//   │  CAM1↓                            │
//   │                                   │
//   ├─────────┤ DoorA ├─────────────────┤  y=6
//   │                                   │
//   │  BTN                              │
//   │                                   │
//   │  SPAWN                            │
//   └────────────────────────────────────┘
//
//   Player spawns below the wall. Button is also below (reachable).
//   Echo holds button, door opens, player goes through door into
//   the top area with 3 cameras, grabs loot, reaches exit.
//
const LEVEL_8 = {
  name: 'Watchful Eyes',
  subtitle: 'Level 8 — Central Bank',
  timerDuration: 80,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 2, y: 13 },
  walls: [
    // Outer
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },

    // Horizontal wall at y=6 with door gap at x=9-11
    { x: 0.5, y: 6, w: 8.5, h: 0.5 },
    { x: 11, y: 6, w: 8.5, h: 0.5 },
  ],
  buttons: [
    { id: 'btnA', x: 2, y: 8, w: 1.5, h: 1.5, linkedDoors: ['doorA'], label: 'BTN' },
  ],
  doors: [
    { id: 'doorA', x: 9, y: 6, w: 2, h: 0.5 },
  ],
  cameras: [
    {
      x: 5, y: 1,
      sweepCenter: Math.PI * 0.5,
      sweepRange: Math.PI * 0.4,
      sweepSpeed: 0.7,
      coneLength: 4.5,
      coneAngle: Math.PI / 6,
    },
    {
      x: 10, y: 0.8,
      sweepCenter: Math.PI * 0.5,
      sweepRange: Math.PI * 0.35,
      sweepSpeed: 0.9,
      coneLength: 4.5,
      coneAngle: Math.PI / 6,
    },
    {
      x: 15, y: 1,
      sweepCenter: Math.PI * 0.5,
      sweepRange: Math.PI * 0.4,
      sweepSpeed: 0.8,
      coneLength: 4.5,
      coneAngle: Math.PI / 6,
    },
  ],
  guards: [],
  loot: { x: 10, y: 3.5, r: 0.5 },
  exit: { x: 2, y: 1.5, w: 2, h: 2 },
  empPickups: [
    { x: 15, y: 8, r: 0.4 },
  ],
  floorZones: [
    { x: 0.5, y: 0.5, w: 19, h: 5.5, color: '#0C1222' },
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 2, maxEchoes: 1, maxTime: 35 },
    { stars: 4, maxAttempts: 3, maxEchoes: 1, maxTime: 50 },
    { stars: 3, maxAttempts: 4, maxEchoes: 2, maxTime: 65 },
    { stars: 2, maxAttempts: 6, maxEchoes: 4, maxTime: 80 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// ─── LEVEL 9: Relay ─────────────────────────────────────────────────
const LEVEL_9 = {
  name: 'Relay',
  subtitle: 'Level 9 — Central Bank',
  timerDuration: 90,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 2, y: 7.5 },
  walls: [
    // Outer
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },

    // Vertical wall at x=7 with door A gap at y=6-8
    { x: 6.75, y: 0.5, w: 0.5, h: 5.5 },
    { x: 6.75, y: 8, w: 0.5, h: 6.5 },

    // Vertical wall at x=13 with door B gap at y=6-8
    { x: 12.75, y: 0.5, w: 0.5, h: 5.5 },
    { x: 12.75, y: 8, w: 0.5, h: 6.5 },
  ],
  buttons: [
    { id: 'btnA', x: 2.25, y: 2.25, w: 1.5, h: 1.5, linkedDoors: ['doorA'], label: 'A' },
    { id: 'btnB', x: 9.25, y: 10.25, w: 1.5, h: 1.5, linkedDoors: ['doorB'], label: 'B' },
  ],
  doors: [
    { id: 'doorA', x: 6.75, y: 6, w: 0.5, h: 2 },
    { id: 'doorB', x: 12.75, y: 6, w: 0.5, h: 2 },
  ],
  cameras: [
    {
      x: 10, y: 3,
      sweepCenter: Math.PI * 0.5,
      sweepRange: Math.PI * 0.5,
      sweepSpeed: 0.8,
      coneLength: 4,
      coneAngle: Math.PI / 6,
    },
  ],
  guards: [],
  loot: { x: 17, y: 7.5, r: 0.5 },
  exit: { x: 1, y: 11, w: 2, h: 2 },
  floorZones: [
    { x: 13.25, y: 0.5, w: 6.25, h: 14, color: '#0C1222' },
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 3, maxEchoes: 2, maxTime: 40 },
    { stars: 4, maxAttempts: 4, maxEchoes: 2, maxTime: 55 },
    { stars: 3, maxAttempts: 5, maxEchoes: 3, maxTime: 70 },
    { stars: 2, maxAttempts: 7, maxEchoes: 5, maxTime: 90 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// ─── LEVEL 10: Red Line ─────────────────────────────────────────────
// Red Line — narrow corridor with camera + guard
//
//   Layout:
//   ┌────────────────────────────────────┐
//   │  TOP AREA                         │
//   │  ◆ LOOT (3,3)                     │
//   │                                   │
//   ├──DoorA──┤─────────────────────────┤ y=6
//   │  CAM→    corridor   GRD ↔   BTN  │
//   ├─────┤ gap ├───────────────────────┤ y=8.5
//   │                                   │
//   │  SPAWN (2,11)          EXIT       │
//   └────────────────────────────────────┘
//
//   Bottom wall has gap at left (x=2-4) so player can enter corridor.
//   Top wall has door gap at left (x=4-6) leading to vault/loot area.
//   Button is at right end of corridor.
//
//   Solution:
//     Attempt 1: Enter corridor from bottom-left gap, time camera+guard,
//                run right to button, hold it.
//     Attempt 2: Echo holds button (top door opens). Player enters corridor
//                from bottom-left, goes through open door into top area,
//                grabs loot, comes back down, exits bottom-right.
//
const LEVEL_10 = {
  name: 'Red Line',
  subtitle: 'Level 10 — Central Bank',
  timerDuration: 75,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 2, y: 11 },
  walls: [
    // Outer
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },

    // Top wall of corridor at y=6 — door gap at x=4-6
    { x: 0.5, y: 6, w: 3.5, h: 0.5 },
    { x: 6, y: 6, w: 13.5, h: 0.5 },

    // Bottom wall of corridor at y=8.5 — entrance gap at x=2-4
    { x: 0.5, y: 8.5, w: 1.5, h: 0.5 },    // left of gap
    { x: 4, y: 8.5, w: 15.5, h: 0.5 },      // right of gap
  ],
  buttons: [
    { id: 'btnA', x: 16.5, y: 7, w: 1.5, h: 1.2, linkedDoors: ['doorA'], label: 'BTN' },
  ],
  doors: [
    { id: 'doorA', x: 4, y: 6, w: 2, h: 0.5 },
  ],
  cameras: [
    {
      x: 1, y: 7.25,
      sweepCenter: 0,
      sweepRange: Math.PI * 0.2,
      sweepSpeed: 0.6,
      coneLength: 5,
      coneAngle: Math.PI / 8,
    },
  ],
  guards: [
    {
      waypoints: [
        { x: 6, y: 7.25 },
        { x: 14, y: 7.25 },
      ],
      speed: 2.2,
      coneLength: 2.5,
      coneAngle: Math.PI / 5,
      radius: 0.4,
    },
  ],
  loot: { x: 3, y: 3, r: 0.5 },
  exit: { x: 16, y: 11, w: 2, h: 2 },
  floorZones: [
    { x: 0.5, y: 6.5, w: 19, h: 2, color: '#1A0A0A' },
    { x: 0.5, y: 0.5, w: 19, h: 5.5, color: '#0C1222' },
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 2, maxEchoes: 1, maxTime: 30 },
    { stars: 4, maxAttempts: 3, maxEchoes: 1, maxTime: 45 },
    { stars: 3, maxAttempts: 4, maxEchoes: 2, maxTime: 60 },
    { stars: 2, maxAttempts: 6, maxEchoes: 4, maxTime: 75 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// Two-Man Job — left/right vault coordination
//
//   ┌────────────────────────────────────┐
//   │  CAM↓       VAULT        GRD↕     │
//   │           ◆ LOOT (10,3)           │
//   │                                   │
//   │         ┌────────────┐            │
//   │   DoorA─┤            ├─DoorB      │
//   │         └────────────┘            │
//   │                                   │
//   │                                   │
//   │  BTN A                    BTN B   │
//   │                                   │
//   │         SPAWN    EXIT             │
//   └────────────────────────────────────┘
//
//   Spawn is bottom-center. Player can freely walk left to BTN A
//   or right to BTN B (no walls blocking bottom half).
//   Vault is a box in the upper-center with doors on left and right.
//   Both doors must be open to enter vault and grab loot.
//
const LEVEL_11 = {
  name: 'Two-Man Job',
  subtitle: 'Level 11 — Central Bank',
  timerDuration: 90,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 10, y: 13 },
  walls: [
    // Outer
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },

    // Vault box — top of room, sealed except for left and right doors
    // Top wall
    { x: 7, y: 2, w: 6, h: 0.5 },
    // Bottom wall
    { x: 7, y: 6, w: 6, h: 0.5 },
    // Left wall: y=2.5 to 4 (above door), y=5.5 to 6 (below door)
    { x: 7, y: 2.5, w: 0.5, h: 1.5 },
    { x: 7, y: 5.5, w: 0.5, h: 0.5 },
    // Right wall: y=2.5 to 4 (above door), y=5.5 to 6 (below door)
    { x: 12.5, y: 2.5, w: 0.5, h: 1.5 },
    { x: 12.5, y: 5.5, w: 0.5, h: 0.5 },
  ],
  buttons: [
    { id: 'btnA', x: 2, y: 9.5, w: 1.5, h: 1.5, linkedDoors: ['doorA'], label: 'A' },
    { id: 'btnB', x: 16.5, y: 9.5, w: 1.5, h: 1.5, linkedDoors: ['doorB'], label: 'B' },
  ],
  doors: [
    { id: 'doorA', x: 7, y: 4, w: 0.5, h: 1.5 },    // left vault door
    { id: 'doorB', x: 12.5, y: 4, w: 0.5, h: 1.5 },  // right vault door
  ],
  cameras: [
    {
      x: 3, y: 0.8,
      sweepCenter: Math.PI * 0.5,
      sweepRange: Math.PI * 0.4,
      sweepSpeed: 0.8,
      coneLength: 5,
      coneAngle: Math.PI / 6,
    },
  ],
  guards: [
    {
      waypoints: [
        { x: 16, y: 3 },
        { x: 16, y: 8 },
      ],
      speed: 2.0,
      coneLength: 2.5,
      coneAngle: Math.PI / 5,
      radius: 0.4,
    },
  ],
  loot: { x: 10, y: 4, r: 0.5 },
  exit: { x: 9, y: 12.5, w: 2, h: 1.5 },
  floorZones: [
    { x: 7.5, y: 2.5, w: 5, h: 3.5, color: '#100E1E' },
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 3, maxEchoes: 2, maxTime: 40 },
    { stars: 4, maxAttempts: 4, maxEchoes: 2, maxTime: 55 },
    { stars: 3, maxAttempts: 5, maxEchoes: 3, maxTime: 70 },
    { stars: 2, maxAttempts: 7, maxEchoes: 5, maxTime: 90 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// Lockstep — two corridors, two buttons, two doors, timing precision
//
//   ┌────────────────────────────────────┐
//   │  ┌───┐    VAULT (loot)    ┌───┐   │
//   │  │ A │  ┌─DoorA─DoorB─┐  │ B │   │
//   │  │btn│  │              │  │btn│   │
//   │  └───┘  └──────────────┘  └───┘   │
//   │  CAM↓                      CAM↓   │
//   │  │   │                    │   │   │
//   │  │ L │    open center     │ R │   │
//   │  │cor│                    │cor│   │
//   │  │   │                    │   │   │
//   │  └───┘                    └───┘   │
//   │            SPAWN  EXIT            │
//   └────────────────────────────────────┘
//
//   Buttons at TOP of corridors, cameras watch MID corridor.
//   Two separate doors — both must be open.
//
const LEVEL_12 = {
  name: 'Lockstep',
  subtitle: 'Level 12 — Central Bank',
  timerDuration: 85,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 10, y: 13 },
  walls: [
    // Outer
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },

    // Left corridor walls (x=2-5)
    { x: 5, y: 3, w: 0.5, h: 9 },    // right wall
    { x: 1.5, y: 3, w: 0.5, h: 9 },  // left wall

    // Right corridor walls (x=15-18)
    { x: 14.5, y: 3, w: 0.5, h: 9 },  // left wall
    { x: 18, y: 3, w: 0.5, h: 9 },    // right wall

    // Vault box top-center: sealed with 2 door gaps
    // Top wall
    { x: 7, y: 2, w: 6, h: 0.5 },
    // Bottom wall — door A gap (x=8-9.5), door B gap (x=10.5-12)
    { x: 7, y: 5.5, w: 1, h: 0.5 },
    { x: 9.5, y: 5.5, w: 1, h: 0.5 },
    { x: 12, y: 5.5, w: 1, h: 0.5 },
    // Side walls
    { x: 7, y: 2.5, w: 0.5, h: 3 },
    { x: 12.5, y: 2.5, w: 0.5, h: 3 },
  ],
  buttons: [
    { id: 'btnA', x: 2.5, y: 3.5, w: 1.5, h: 1.5, linkedDoors: ['doorA'], label: 'A' },
    { id: 'btnB', x: 16, y: 3.5, w: 1.5, h: 1.5, linkedDoors: ['doorB'], label: 'B' },
  ],
  doors: [
    { id: 'doorA', x: 8, y: 5.5, w: 1.5, h: 0.5 },
    { id: 'doorB', x: 10.5, y: 5.5, w: 1.5, h: 0.5 },
  ],
  cameras: [
    {
      x: 3.25, y: 6,
      sweepCenter: Math.PI * 0.5,
      sweepRange: Math.PI * 0.3,
      sweepSpeed: 0.9,
      coneLength: 4.5,
      coneAngle: Math.PI / 7,
    },
    {
      x: 16.25, y: 6,
      sweepCenter: Math.PI * 0.5,
      sweepRange: Math.PI * 0.3,
      sweepSpeed: 0.7,
      coneLength: 4.5,
      coneAngle: Math.PI / 7,
    },
  ],
  guards: [],
  loot: { x: 10, y: 3.5, r: 0.5 },
  exit: { x: 9, y: 11, w: 2, h: 2 },
  floorZones: [
    { x: 7.5, y: 0.5, w: 5, h: 5.5, color: '#100E1E' },
    { x: 2, y: 2.5, w: 3, h: 9.5, color: '#0E1520' },
    { x: 15, y: 2.5, w: 3, h: 9.5, color: '#0E1520' },
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 3, maxEchoes: 2, maxTime: 40 },
    { stars: 4, maxAttempts: 4, maxEchoes: 2, maxTime: 55 },
    { stars: 3, maxAttempts: 5, maxEchoes: 3, maxTime: 70 },
    { stars: 2, maxAttempts: 7, maxEchoes: 5, maxTime: 85 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// ─── LEVEL 13: Crossfire ────────────────────────────────────────────
const LEVEL_13 = {
  name: 'Crossfire',
  subtitle: 'Level 13 — Central Bank',
  timerDuration: 75,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 2, y: 13 },
  walls: [
    // Outer
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },

    // Vault wall at y=4 with door gap x=9-11
    { x: 0.5, y: 4, w: 8.5, h: 0.5 },
    { x: 11, y: 4, w: 8.5, h: 0.5 },
  ],
  buttons: [
    { id: 'btnA', x: 16.25, y: 11.25, w: 1.5, h: 1.5, linkedDoors: ['doorA'], label: 'BTN' },
  ],
  doors: [
    { id: 'doorA', x: 9, y: 4, w: 2, h: 0.5 },
  ],
  cameras: [
    {
      x: 0.8, y: 7.5,
      sweepCenter: 0,
      sweepRange: Math.PI * 0.4,
      sweepSpeed: 0.7,
      coneLength: 6,
      coneAngle: Math.PI / 6,
    },
    {
      x: 19.2, y: 7.5,
      sweepCenter: Math.PI,
      sweepRange: Math.PI * 0.4,
      sweepSpeed: 0.8,
      coneLength: 6,
      coneAngle: Math.PI / 6,
    },
  ],
  guards: [
    {
      waypoints: [
        { x: 4, y: 8 },
        { x: 16, y: 8 },
      ],
      speed: 2.0,
      coneLength: 2.5,
      coneAngle: Math.PI / 5,
      radius: 0.4,
    },
  ],
  loot: { x: 10, y: 2, r: 0.5 },
  exit: { x: 1, y: 11, w: 2, h: 2 },
  floorZones: [
    { x: 0.5, y: 0.5, w: 19, h: 3.5, color: '#0C1222' },
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 2, maxEchoes: 1, maxTime: 30 },
    { stars: 4, maxAttempts: 3, maxEchoes: 1, maxTime: 45 },
    { stars: 3, maxAttempts: 4, maxEchoes: 2, maxTime: 60 },
    { stars: 2, maxAttempts: 6, maxEchoes: 4, maxTime: 75 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// ─── LEVEL 14: Echo Chamber ─────────────────────────────────────────
const LEVEL_14 = {
  name: 'Echo Chamber',
  subtitle: 'Level 14 — Central Bank',
  timerDuration: 100,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 10, y: 13 },
  walls: [
    // Outer
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },

    // Central vault room walls (x=7-13, y=5-10)
    // Left wall at x=7, door gap at y=7-9
    { x: 7, y: 5, w: 0.5, h: 2 },
    { x: 7, y: 9, w: 0.5, h: 1.5 },
    // Right wall at x=13, door gap at y=7-9
    { x: 12.5, y: 5, w: 0.5, h: 2 },
    { x: 12.5, y: 9, w: 0.5, h: 1.5 },
    // Top wall at y=5, door gap at x=9.5-11.5
    { x: 7.5, y: 5, w: 2, h: 0.5 },
    { x: 11.5, y: 5, w: 1, h: 0.5 },
    // Bottom wall solid
    { x: 7.5, y: 10, w: 5, h: 0.5 },
  ],
  buttons: [
    { id: 'btnA', x: 1.25, y: 1.25, w: 1.5, h: 1.5, linkedDoors: ['doorLeft'], label: 'A' },
    { id: 'btnB', x: 17.25, y: 1.25, w: 1.5, h: 1.5, linkedDoors: ['doorRight'], label: 'B' },
    { id: 'btnC', x: 1.25, y: 11.25, w: 1.5, h: 1.5, linkedDoors: ['doorTop'], label: 'C' },
  ],
  doors: [
    { id: 'doorLeft', x: 7, y: 7, w: 0.5, h: 2 },
    { id: 'doorRight', x: 12.5, y: 7, w: 0.5, h: 2 },
    { id: 'doorTop', x: 9.5, y: 5, w: 2, h: 0.5 },
  ],
  cameras: [
    {
      x: 5, y: 7.5,
      sweepCenter: 0,
      sweepRange: Math.PI * 0.4,
      sweepSpeed: 0.8,
      coneLength: 4,
      coneAngle: Math.PI / 6,
    },
    {
      x: 15, y: 7.5,
      sweepCenter: Math.PI,
      sweepRange: Math.PI * 0.4,
      sweepSpeed: 0.7,
      coneLength: 4,
      coneAngle: Math.PI / 6,
    },
  ],
  guards: [
    {
      waypoints: [
        { x: 16, y: 3 },
        { x: 16, y: 11 },
        { x: 14, y: 11 },
        { x: 14, y: 3 },
      ],
      speed: 1.8,
      coneLength: 2.5,
      coneAngle: Math.PI / 5,
      radius: 0.4,
    },
  ],
  loot: { x: 10, y: 7.5, r: 0.5 },
  exit: { x: 17, y: 12.5, w: 2, h: 1.5 },
  floorZones: [
    { x: 7.5, y: 5.5, w: 5, h: 4.5, color: '#100E1E' },
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 4, maxEchoes: 3, maxTime: 50 },
    { stars: 4, maxAttempts: 5, maxEchoes: 3, maxTime: 65 },
    { stars: 3, maxAttempts: 6, maxEchoes: 4, maxTime: 80 },
    { stars: 2, maxAttempts: 8, maxEchoes: 6, maxTime: 100 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// ─── LEVEL 15: Central Bank Finale ──────────────────────────────────
// Central Bank Finale — final level, everything combined
//
//   ┌────────────────────────────────────┐
//   │  BTN A         VAULT       CAM←   │
//   │              ◆ LOOT               │
//   │         ┌──DoorA──────┐           │
//   │  CAM↓   │             │           │
//   │         │             ├─DoorB     │
//   │         └─────────────┘           │
//   │                                   │
//   │    GRD1 ↔              GRD2 ↕     │
//   │                          BTN B    │
//   │                        CAM↑       │
//   │  SPAWN                    EXIT    │
//   └────────────────────────────────────┘
//
//   Open floor plan — NO internal dividing walls that trap the player.
//   Vault is a box at top-center, sealed by 2 doors.
//   Guards and cameras patrol the open space.
//   Player must navigate through danger to reach both buttons.
//
const LEVEL_15 = {
  name: 'Central Bank Finale',
  subtitle: 'Level 15 — Central Bank',
  timerDuration: 80,
  objectiveSequence: ['REACH THE VAULT', 'STEAL THE LOOT', 'ESCAPE!'],
  spawn: { x: 2, y: 13 },
  walls: [
    // Outer
    { x: 0, y: 0, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: LEVEL_HEIGHT - 0.5, w: LEVEL_WIDTH, h: 0.5 },
    { x: 0, y: 0, w: 0.5, h: LEVEL_HEIGHT },
    { x: LEVEL_WIDTH - 0.5, y: 0, w: 0.5, h: LEVEL_HEIGHT },

    // Vault box (x=7-14, y=1.5-6) — sealed except for 2 doors
    // Top wall
    { x: 7, y: 1.5, w: 7, h: 0.5 },
    // Bottom wall — door A gap at x=9-11
    { x: 7, y: 6, w: 2, h: 0.5 },
    { x: 11, y: 6, w: 3, h: 0.5 },
    // Left wall (solid)
    { x: 7, y: 2, w: 0.5, h: 4 },
    // Right wall — door B gap at y=3.5-5
    { x: 13.5, y: 2, w: 0.5, h: 1.5 },
    { x: 13.5, y: 5, w: 0.5, h: 1 },
  ],
  buttons: [
    { id: 'btnA', x: 2, y: 2, w: 1.5, h: 1.5, linkedDoors: ['doorA'], label: 'A' },
    { id: 'btnB', x: 16.5, y: 9, w: 1.5, h: 1.5, linkedDoors: ['doorB'], label: 'B' },
  ],
  doors: [
    { id: 'doorA', x: 9, y: 6, w: 2, h: 0.5 },      // bottom vault door
    { id: 'doorB', x: 13.5, y: 3.5, w: 0.5, h: 1.5 }, // right vault door
  ],
  cameras: [
    {
      x: 5, y: 5,
      sweepCenter: Math.PI * 0.5,
      sweepRange: Math.PI * 0.4,
      sweepSpeed: 0.8,
      coneLength: 4.5,
      coneAngle: Math.PI / 7,
    },
    {
      x: 19, y: 3,
      sweepCenter: Math.PI,
      sweepRange: Math.PI * 0.3,
      sweepSpeed: 0.7,
      coneLength: 5,
      coneAngle: Math.PI / 7,
    },
    {
      x: 14, y: 13,
      sweepCenter: Math.PI * 1.5,
      sweepRange: Math.PI * 0.35,
      sweepSpeed: 0.9,
      coneLength: 4,
      coneAngle: Math.PI / 7,
    },
  ],
  guards: [
    {
      waypoints: [
        { x: 4, y: 9 },
        { x: 12, y: 9 },
      ],
      speed: 2.0,
      coneLength: 2.5,
      coneAngle: Math.PI / 5,
      radius: 0.4,
    },
    {
      waypoints: [
        { x: 17, y: 5 },
        { x: 17, y: 12 },
      ],
      speed: 1.8,
      coneLength: 2.5,
      coneAngle: Math.PI / 5,
      radius: 0.4,
    },
  ],
  loot: { x: 10, y: 3.5, r: 0.5 },
  exit: { x: 17, y: 12.5, w: 2, h: 1.5 },
  floorZones: [
    { x: 7.5, y: 2, w: 6, h: 4, color: '#100E1E' },
  ],
  starThresholds: [
    { stars: 5, maxAttempts: 3, maxEchoes: 2, maxTime: 35 },
    { stars: 4, maxAttempts: 4, maxEchoes: 2, maxTime: 50 },
    { stars: 3, maxAttempts: 5, maxEchoes: 3, maxTime: 65 },
    { stars: 2, maxAttempts: 7, maxEchoes: 5, maxTime: 80 },
    { stars: 1, maxAttempts: Infinity, maxEchoes: Infinity, maxTime: Infinity },
  ],
};

// ─── Level registry ─────────────────────────────────────────────────
export const LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, LEVEL_6, LEVEL_7, LEVEL_8, LEVEL_9, LEVEL_10, LEVEL_11, LEVEL_12, LEVEL_13, LEVEL_14, LEVEL_15];

export function getLevelData(index) {
  return LEVELS[index] || LEVELS[0];
}

export function calculateStars(levelData, attempts, echoes, time) {
  for (const t of levelData.starThresholds) {
    if (attempts <= t.maxAttempts && echoes <= t.maxEchoes && time <= t.maxTime) {
      return t.stars;
    }
  }
  return 1;
}

/**
 * Create mutable runtime level state from level data template
 */
export function createLevel(levelIndex) {
  const data = getLevelData(levelIndex);
  const level = {};
  resetLevel(level, levelIndex);
  return level;
}

export function resetLevel(level, levelIndex) {
  const data = getLevelData(levelIndex !== undefined ? levelIndex : level._index || 0);
  level._index = levelIndex !== undefined ? levelIndex : level._index || 0;
  level._data = data;
  level.walls = data.walls.map(w => ({ ...w }));
  level.buttons = data.buttons.map(b => ({ ...b, isPressed: false }));
  level.doors = data.doors.map(d => ({ ...d, isOpen: false }));
  level.cameras = data.cameras.map(c => ({ ...c, direction: c.sweepCenter }));
  level.guards = data.guards.map(g => ({
    ...g,
    waypoints: g.waypoints.map(wp => ({ ...wp })),
    x: g.waypoints[0].x,
    y: g.waypoints[0].y,
    waypointIndex: 0,
    facingAngle: Math.PI / 2, // facing down initially
    facingDirection: 'down',
    guardMoving: false,
  }));
  level.loot = { ...data.loot, collected: false };
  level.exit = { ...data.exit, active: false };
  level.floorZones = data.floorZones || [];
  level.empPickups = (data.empPickups || []).map(e => ({ ...e, collected: false }));
  level.empActive = false;
  level.empTimer = 0;
  level.timer = data.timerDuration;
  level.objectiveIndex = 0;
}
