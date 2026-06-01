// Synthetic sound effects for ECHO HEIST using Web Audio API

let ctx = null;
let enabled = true;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(freq, duration, type = 'sine', volume = 0.15, fadeOut = true) {
  if (!enabled) return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    if (fadeOut) gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch (e) {}
}

function playNoise(duration, volume = 0.1) {
  if (!enabled) return;
  try {
    const c = getCtx();
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const source = c.createBufferSource();
    source.buffer = buffer;
    const gain = c.createGain();
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    source.connect(gain);
    gain.connect(c.destination);
    source.start();
  } catch (e) {}
}

// ─── Public API ───

export function footstep() {
  playTone(200 + Math.random() * 80, 0.05, 'triangle', 0.04);
}

export function buttonPress() {
  playTone(600, 0.08, 'square', 0.12);
  setTimeout(() => playTone(800, 0.1, 'sine', 0.1), 50);
}

export function doorOpen() {
  playTone(300, 0.15, 'sawtooth', 0.08);
  setTimeout(() => playTone(400, 0.2, 'sine', 0.06), 80);
}

export function doorClose() {
  playTone(250, 0.12, 'sawtooth', 0.08);
  setTimeout(() => playTone(150, 0.15, 'triangle', 0.06), 60);
}

export function lootCollect() {
  playTone(800, 0.1, 'sine', 0.15);
  setTimeout(() => playTone(1000, 0.1, 'sine', 0.12), 80);
  setTimeout(() => playTone(1200, 0.15, 'sine', 0.1), 160);
}

export function alarm() {
  playTone(440, 0.15, 'square', 0.2);
  setTimeout(() => playTone(520, 0.15, 'square', 0.18), 150);
  setTimeout(() => playTone(440, 0.15, 'square', 0.15), 300);
}

export function echoCreate() {
  playNoise(0.15, 0.08);
  playTone(1200, 0.08, 'sine', 0.1);
  setTimeout(() => playTone(600, 0.2, 'sine', 0.08), 100);
  setTimeout(() => playTone(300, 0.3, 'triangle', 0.06), 200);
}

export function missionComplete() {
  playTone(523, 0.15, 'sine', 0.15);  // C5
  setTimeout(() => playTone(659, 0.15, 'sine', 0.15), 120);  // E5
  setTimeout(() => playTone(784, 0.15, 'sine', 0.15), 240);  // G5
  setTimeout(() => playTone(1047, 0.3, 'sine', 0.18), 360);  // C6
}

export function empActivate() {
  playNoise(0.3, 0.12);
  playTone(150, 0.3, 'sawtooth', 0.1);
  setTimeout(() => playTone(100, 0.4, 'square', 0.08), 150);
}

export function empPickup() {
  playTone(500, 0.08, 'sine', 0.1);
  setTimeout(() => playTone(700, 0.1, 'sine', 0.08), 60);
}

export function timerWarning() {
  playTone(880, 0.08, 'square', 0.1);
}

export function setEnabled(val) { enabled = val; }
export function isEnabled() { return enabled; }
