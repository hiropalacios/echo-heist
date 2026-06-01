// Collision utilities for ECHO HEIST

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * Check if two rectangles overlap
 */
export function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/**
 * Check if a circle overlaps a rectangle
 */
export function circleRectOverlap(cx, cy, cr, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < (cr * cr);
}

/**
 * Check if a point is inside a triangle (for camera cone detection)
 */
export function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const d1 = sign(px, py, x1, y1, x2, y2);
  const d2 = sign(px, py, x2, y2, x3, y3);
  const d3 = sign(px, py, x3, y3, x1, y1);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

function sign(px, py, x1, y1, x2, y2) {
  return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
}

/**
 * Resolve circle vs axis-aligned rect collision (push circle out of rect).
 * Returns new {x, y} for circle center, or null if no collision.
 */
export function resolveCircleRect(cx, cy, cr, rx, ry, rw, rh) {
  if (!circleRectOverlap(cx, cy, cr, rx, ry, rw, rh)) return null;

  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  let dx = cx - closestX;
  let dy = cy - closestY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) {
    // Center is inside rect, push out the shortest axis
    const overlapLeft = cx - rx;
    const overlapRight = (rx + rw) - cx;
    const overlapTop = cy - ry;
    const overlapBottom = (ry + rh) - cy;
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
    if (minOverlap === overlapLeft) return { x: rx - cr, y: cy };
    if (minOverlap === overlapRight) return { x: rx + rw + cr, y: cy };
    if (minOverlap === overlapTop) return { x: cx, y: ry - cr };
    return { x: cx, y: ry + rh + cr };
  }

  const overlap = cr - dist;
  const nx = dx / dist;
  const ny = dy / dist;
  return { x: cx + nx * overlap, y: cy + ny * overlap };
}
