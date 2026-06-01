// Direction system for ECHO HEIST
// 8-direction facing with helpers for sprites that only have front-facing art.

export const Direction = {
  DOWN:       'down',
  DOWN_RIGHT: 'down_right',
  RIGHT:      'right',
  UP_RIGHT:   'up_right',
  UP:         'up',
  UP_LEFT:    'up_left',
  LEFT:       'left',
  DOWN_LEFT:  'down_left',
};

const ALL_DIRS = [
  Direction.RIGHT, Direction.DOWN_RIGHT, Direction.DOWN, Direction.DOWN_LEFT,
  Direction.LEFT, Direction.UP_LEFT, Direction.UP, Direction.UP_RIGHT,
];

// Angles in radians for each direction (0 = right, clockwise)
const DIR_ANGLES = {
  [Direction.RIGHT]:      0,
  [Direction.DOWN_RIGHT]: Math.PI * 0.25,
  [Direction.DOWN]:       Math.PI * 0.5,
  [Direction.DOWN_LEFT]:  Math.PI * 0.75,
  [Direction.LEFT]:       Math.PI,
  [Direction.UP_LEFT]:    Math.PI * 1.25,
  [Direction.UP]:         Math.PI * 1.5,
  [Direction.UP_RIGHT]:   Math.PI * 1.75,
};

/**
 * Get 8-direction enum from a movement vector.
 */
export function getDirectionFromVector(dx, dy, epsilon = 0.001) {
  if (Math.abs(dx) < epsilon && Math.abs(dy) < epsilon) return null;
  const angle = Math.atan2(dy, dx);
  const a = angle < 0 ? angle + Math.PI * 2 : angle;
  const sector = Math.round(a / (Math.PI * 0.25)) % 8;
  return ALL_DIRS[sector];
}

export function getDirectionFromVelocity(vx, vy) {
  return getDirectionFromVector(vx, vy);
}

export function directionToAngle(direction) {
  return DIR_ANGLES[direction] ?? Math.PI * 0.5;
}

/**
 * Render transform for a front-facing-only sprite to show direction.
 *
 * Strategy: the sprite is drawn with visible transformations:
 *  - flipX: mirror for left-facing directions
 *  - tilt: slight canvas rotation to lean toward movement
 *  - verticalSquash: compress vertically for up (back view)
 *  - backFacing: true = character faces away, hide eyes, darken heavily
 *  - eyeOffX/Y: shift eyes toward direction (for canvas fallback)
 *  - arrowAngle: angle in radians for a directional indicator arrow
 */
export function getDirectionRenderInfo(dir) {
  switch (dir) {
    case Direction.DOWN:
      return { flipX: false, tilt: 0, squashY: 1, backFacing: false, eyeOffX: 0, eyeOffY: 0.05, arrowAngle: Math.PI/2 };
    case Direction.DOWN_LEFT:
      return { flipX: true, tilt: 0.15, squashY: 1, backFacing: false, eyeOffX: -0.15, eyeOffY: 0.03, arrowAngle: Math.PI*0.75 };
    case Direction.DOWN_RIGHT:
      return { flipX: false, tilt: -0.15, squashY: 1, backFacing: false, eyeOffX: 0.15, eyeOffY: 0.03, arrowAngle: Math.PI*0.25 };
    case Direction.LEFT:
      return { flipX: true, tilt: 0.25, squashY: 0.95, backFacing: false, eyeOffX: -0.2, eyeOffY: -0.03, arrowAngle: Math.PI };
    case Direction.RIGHT:
      return { flipX: false, tilt: -0.25, squashY: 0.95, backFacing: false, eyeOffX: 0.2, eyeOffY: -0.03, arrowAngle: 0 };
    case Direction.UP_LEFT:
      return { flipX: true, tilt: 0.15, squashY: 0.88, backFacing: true, eyeOffX: -0.1, eyeOffY: -0.1, arrowAngle: Math.PI*1.25 };
    case Direction.UP_RIGHT:
      return { flipX: false, tilt: -0.15, squashY: 0.88, backFacing: true, eyeOffX: 0.1, eyeOffY: -0.1, arrowAngle: Math.PI*1.75 };
    case Direction.UP:
      return { flipX: false, tilt: 0, squashY: 0.85, backFacing: true, eyeOffX: 0, eyeOffY: -0.1, arrowAngle: Math.PI*1.5 };
    default:
      return { flipX: false, tilt: 0, squashY: 1, backFacing: false, eyeOffX: 0, eyeOffY: 0, arrowAngle: Math.PI/2 };
  }
}

export function getDirectionFromAngle(angle) {
  let a = angle % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  const sector = Math.round(a / (Math.PI * 0.25)) % 8;
  return ALL_DIRS[sector];
}
