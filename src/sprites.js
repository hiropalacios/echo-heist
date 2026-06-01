// Sprite asset loader for ECHO HEIST

const ASSETS = {
  // Spritesheets: [path, frameWidth, frameHeight, frameCount]
  playerIdle:  ['assets/player_thief_idle.png', 256, 256, 4],
  playerWalk:  ['assets/player_thief_walk.png', 256, 256, 6],
  echoIdle:    ['assets/echo_clone_idle.png', 256, 256, 4],
  echoWalk:    ['assets/echo_clone_walk.png', 256, 256, 6],
  guardIdle:   ['assets/guard_idle.png', 256, 256, 4],
  guardWalk:   ['assets/guard_walk.png', 256, 256, 6],

  // Single images
  loot:           ['assets/loot_diamond.png'],
  camera:         ['assets/security_camera.png'],
  buttonOff:      ['assets/pressure_button_off.png'],
  buttonOn:       ['assets/pressure_button_on.png'],
  doorClosed:     ['assets/door_closed.png'],
  doorOpen:       ['assets/door_open.png'],
  escapeZone:     ['assets/escape_zone.png'],
  spawnPoint:     ['assets/spawn_point.png'],
  trailDot:       ['assets/echo_trail_dot.png'],
  floorTile:      ['assets/floor_tile_base.png'],
  logo:           ['assets/logo_echo_heist.png'],
};

const images = {};
let loadedCount = 0;
let totalCount = 0;
let allLoaded = false;

export function loadAllAssets() {
  const keys = Object.keys(ASSETS);
  totalCount = keys.length;

  return new Promise((resolve) => {
    if (totalCount === 0) { allLoaded = true; resolve(); return; }

    for (const key of keys) {
      const entry = ASSETS[key];
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= totalCount) {
          allLoaded = true;
          resolve();
        }
      };
      img.onerror = () => {
        console.warn(`Failed to load: ${entry[0]}`);
        loadedCount++;
        if (loadedCount >= totalCount) {
          allLoaded = true;
          resolve();
        }
      };
      img.src = entry[0];
      images[key] = {
        img,
        frameW: entry[1] || 0,
        frameH: entry[2] || 0,
        frameCount: entry[3] || 1,
      };
    }
  });
}

export function isLoaded() { return allLoaded; }

export function getSprite(name) {
  return images[name] || null;
}

/**
 * Draw a single-frame image centered at (cx, cy) with size (w, h)
 */
export function drawSprite(ctx, name, cx, cy, w, h) {
  const s = images[name];
  if (!s || !s.img.complete) return false;
  ctx.drawImage(s.img, cx - w / 2, cy - h / 2, w, h);
  return true;
}

/**
 * Draw a specific frame from a spritesheet, centered at (cx, cy)
 * frameIndex is auto-wrapped by frameCount
 */
export function drawFrame(ctx, name, frameIndex, cx, cy, w, h) {
  const s = images[name];
  if (!s || !s.img.complete || s.frameCount <= 0) return false;
  const fi = Math.floor(frameIndex) % s.frameCount;
  const sx = fi * s.frameW;
  ctx.drawImage(s.img, sx, 0, s.frameW, s.frameH, cx - w / 2, cy - h / 2, w, h);
  return true;
}

/**
 * Draw a sprite with opacity
 */
export function drawSpriteAlpha(ctx, name, cx, cy, w, h, alpha) {
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = alpha;
  const ok = drawSprite(ctx, name, cx, cy, w, h);
  ctx.globalAlpha = prev;
  return ok;
}

export function drawFrameAlpha(ctx, name, frameIndex, cx, cy, w, h, alpha) {
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = alpha;
  const ok = drawFrame(ctx, name, frameIndex, cx, cy, w, h);
  ctx.globalAlpha = prev;
  return ok;
}

/**
 * Draw a spritesheet frame with full directional transforms.
 * dirInfo: { flipX, tilt, squashY, backFacing } from getDirectionRenderInfo()
 */
export function drawFrameDir(ctx, name, frameIndex, cx, cy, w, h, dirInfo, alpha) {
  const s = images[name];
  if (!s || !s.img.complete || s.frameCount <= 0) return false;
  const fi = Math.floor(frameIndex) % s.frameCount;
  const sx = fi * s.frameW;

  // Support old call signature: (ctx, name, fi, cx, cy, w, h, flipX, backFacing, alpha)
  let flipX = false, tilt = 0, squashY = 1, backFacing = false;
  if (dirInfo && typeof dirInfo === 'object') {
    flipX = dirInfo.flipX || false;
    tilt = dirInfo.tilt || 0;
    squashY = dirInfo.squashY ?? 1;
    backFacing = dirInfo.backFacing || false;
  } else if (typeof dirInfo === 'boolean') {
    // Legacy: drawFrameDir(ctx,name,fi,cx,cy,w,h, flipX, backFacing, alpha)
    flipX = dirInfo;
    backFacing = alpha || false;
    alpha = arguments[10];
  }

  const prevAlpha = ctx.globalAlpha;
  if (alpha !== undefined && alpha !== null) ctx.globalAlpha = alpha;

  ctx.save();
  ctx.translate(cx, cy);

  // Apply tilt rotation for directional lean
  if (tilt) ctx.rotate(tilt);

  // Apply flip
  if (flipX) ctx.scale(-1, 1);

  // Apply vertical squash (for up-facing: compress to show foreshortening)
  const drawH = h * squashY;
  const yOff = (h - drawH) * 0.3; // shift down slightly when squashed

  // Back-facing: draw sprite darker by reducing opacity and tinting
  if (backFacing) {
    // Draw sprite at reduced brightness
    ctx.globalAlpha = (alpha !== undefined && alpha !== null ? alpha : prevAlpha) * 0.45;
    ctx.drawImage(s.img, sx, 0, s.frameW, s.frameH, -w / 2, -drawH / 2 + yOff, w, drawH);
    // Cyan rim glow on top to hint back-of-head
    ctx.globalAlpha = (alpha !== undefined && alpha !== null ? alpha : prevAlpha) * 0.2;
    ctx.drawImage(s.img, sx, 0, s.frameW, s.frameH, -w / 2 - 1, -drawH / 2 + yOff - 1, w + 2, drawH + 2);
  } else {
    ctx.drawImage(s.img, sx, 0, s.frameW, s.frameH, -w / 2, -drawH / 2 + yOff, w, drawH);
  }

  ctx.restore();
  ctx.globalAlpha = prevAlpha;
  return true;
}
