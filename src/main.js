import { Game } from './game.js';

const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);

function resizeCanvas() {
  const container = document.getElementById('game-container');
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  game.onResize(canvas.width, canvas.height);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.key.toLowerCase() === 'r' && game.state !== 'boss') game.onRetry();
  if (e.key === ' ' && game.state !== 'boss') { e.preventDefault(); game.onReset(); }
  if (e.key === 'Escape') game.onPause();
});
window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Mobile controls
function setupMobileBtn(id, keyName, isAction) {
  const btn = document.getElementById(id);
  if (!btn) return;
  if (isAction) {
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); if (keyName === 'r') game.onRetry(); else if (keyName === 'reset') game.onReset(); });
    btn.addEventListener('click', () => { if (keyName === 'r') game.onRetry(); else if (keyName === 'reset') game.onReset(); });
  } else {
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyName] = true; });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[keyName] = false; });
    btn.addEventListener('touchcancel', (e) => { e.preventDefault(); keys[keyName] = false; });
  }
}

setupMobileBtn('btn-up', 'w');
setupMobileBtn('btn-down', 's');
setupMobileBtn('btn-left', 'a');
setupMobileBtn('btn-right', 'd');
setupMobileBtn('btn-retry', 'r', true);
setupMobileBtn('btn-reset', 'reset', true);

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap delta
  lastTime = timestamp;

  game.update(dt, keys);
  game.render();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame((ts) => {
  lastTime = ts;
  requestAnimationFrame(gameLoop);
});
