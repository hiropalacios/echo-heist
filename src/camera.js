// Security camera logic for ECHO HEIST

/**
 * Update camera sweep + random cone surge
 */
export function updateCamera(cam, dt) {
  // Sweep back and forth
  cam.direction += cam.sweepSpeed * cam._sweepDir * dt;

  const halfSweep = cam.sweepRange / 2;
  if (cam.direction > cam.sweepCenter + halfSweep) {
    cam.direction = cam.sweepCenter + halfSweep;
    cam._sweepDir = -1;
  } else if (cam.direction < cam.sweepCenter - halfSweep) {
    cam.direction = cam.sweepCenter - halfSweep;
    cam._sweepDir = 1;
  }

  // Random cone surge — expands cone briefly at random intervals
  cam._surgeTimer -= dt;
  if (cam._surgeTimer <= 0) {
    // Start a new surge
    cam._surging = true;
    cam._surgeDuration = 0.8 + Math.random() * 0.6; // 0.8–1.4s burst
    cam._surgeElapsed = 0;
    cam._surgeTimer = 4 + Math.random() * 6; // next surge in 4–10s
  }

  if (cam._surging) {
    cam._surgeElapsed += dt;
    // Ease in/out: sine curve for smooth expand/contract
    const t = cam._surgeElapsed / cam._surgeDuration;
    if (t >= 1) {
      cam._surging = false;
      cam._activeConeAngle = cam._baseConeAngle;
      cam._activeConeLength = cam._baseConeLength;
    } else {
      const intensity = Math.sin(t * Math.PI); // 0 → 1 → 0
      cam._activeConeAngle = cam._baseConeAngle + cam._baseConeAngle * 0.6 * intensity;
      cam._activeConeLength = cam._baseConeLength + cam._baseConeLength * 0.6 * intensity;
    }
  }
}

/**
 * Initialize camera sweep direction + surge state
 */
export function initCamera(cam) {
  cam._sweepDir = 1;
  cam.direction = cam.sweepCenter;
  cam._baseConeAngle = cam.coneAngle;
  cam._baseConeLength = cam.coneLength;
  cam._activeConeAngle = cam.coneAngle;
  cam._activeConeLength = cam.coneLength;
  cam._surgeTimer = 3 + Math.random() * 4; // first surge in 3–7s
  cam._surging = false;
  cam._surgeDuration = 0;
  cam._surgeElapsed = 0;
}

/**
 * Get the three points of the camera cone triangle.
 * Used for BOTH rendering AND detection — must be identical.
 */
export function getConePoints(cam) {
  const len = cam._activeConeLength || cam.coneLength;
  const angle = cam.direction;
  const halfAngle = cam._activeConeAngle || cam.coneAngle;

  return {
    tip: { x: cam.x, y: cam.y },
    left: {
      x: cam.x + Math.cos(angle - halfAngle) * len,
      y: cam.y + Math.sin(angle - halfAngle) * len,
    },
    right: {
      x: cam.x + Math.cos(angle + halfAngle) * len,
      y: cam.y + Math.sin(angle + halfAngle) * len,
    },
  };
}

/**
 * Check if the player circle touches the camera cone triangle.
 * Tests center + 8 perimeter points so touching the edge = detected.
 */
export function isInCameraCone(cam, px, py, radius) {
  const cone = getConePoints(cam);
  const x1 = cone.tip.x, y1 = cone.tip.y;
  const x2 = cone.left.x, y2 = cone.left.y;
  const x3 = cone.right.x, y3 = cone.right.y;

  // Check center
  if (pointInTriangle(px, py, x1, y1, x2, y2, x3, y3)) return true;

  // Check 8 points around the player's edge
  const r = radius || 0.45;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    if (pointInTriangle(px + Math.cos(a) * r, py + Math.sin(a) * r, x1, y1, x2, y2, x3, y3)) {
      return true;
    }
  }
  return false;
}

// Inline triangle test — avoids import dependency on collision.js
function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
  const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
  const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}
