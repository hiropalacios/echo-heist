// UI controller for ECHO HEIST HUD and overlays

import * as Save from './save.js';
import { getLevelData, LEVELS } from './level.js';

const timerEl = document.getElementById('timer-display');
const objectiveEl = document.getElementById('objective-text');
const attemptEl = document.getElementById('attempt-display');
const echoEl = document.getElementById('echo-display');
const alarmEl = document.getElementById('alarm-state');
const overlayEl = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayBody = document.getElementById('overlay-body');
const overlayHint = document.getElementById('overlay-hint');
const levelNameEl = document.getElementById('level-name');

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

export function updateTimer(seconds) {
  timerEl.textContent = formatTime(seconds);
  if (seconds <= 5) {
    timerEl.style.color = '#FF335C';
    timerEl.style.textShadow = '0 0 8px rgba(255,51,92,0.6)';
  } else if (seconds <= 10) {
    timerEl.style.color = '#FFB020';
    timerEl.style.textShadow = '0 0 8px rgba(255,176,32,0.4)';
  } else {
    timerEl.style.color = '#F5F7FA';
    timerEl.style.textShadow = 'none';
  }
}

export function updateObjective(text) { objectiveEl.textContent = text; }
export function updateAttempt(num) { attemptEl.textContent = `ATTEMPT: ${num}`; }
export function updateEchoCount(num) { echoEl.textContent = `ECHOES: ${num}`; }
export function updateLevelName(name) { if (levelNameEl) levelNameEl.textContent = name; }

export function setAlarmState(detected) {
  if (detected) {
    alarmEl.textContent = 'DETECTED'; alarmEl.className = 'detected';
  } else {
    alarmEl.textContent = 'SAFE'; alarmEl.className = 'safe';
  }
}

export function showOverlay(title, body, hint, titleColor = '#00E5FF') {
  overlayEl.classList.remove('hidden');
  overlayTitle.textContent = title;
  overlayTitle.style.color = titleColor;
  overlayBody.innerHTML = body;
  overlayHint.textContent = hint;
}

export function hideOverlay() { overlayEl.classList.add('hidden'); }

export function showDetectedOverlay(message) {
  showOverlay(
    'DETECTED',
    (message || 'You were spotted.') + '<br>Your attempt has been recorded as an echo.',
    'Tap ECHO to retry with echo  |  Tap RESET to restart level',
    '#FF335C'
  );
}

export function showTimerOverlay() {
  showOverlay(
    'TIME\'S UP',
    'You ran out of time.<br>Your attempt has been recorded as an echo.',
    'Tap ECHO to retry with echo  |  Tap RESET to restart level',
    '#FFB020'
  );
}

export function showSuccessOverlay(time, attempts, echoes, stars, hasNextLevel) {
  const filled = '&#9733;'.repeat(stars);
  const empty = '&#9734;'.repeat(5 - stars);

  let ratingLabel = '';
  if (stars === 5) ratingLabel = '<span style="color:#A855F7;">PERFECT HEIST</span>';
  else if (stars === 4) ratingLabel = '<span style="color:#00E5FF;">MASTER THIEF</span>';
  else if (stars === 3) ratingLabel = '<span style="color:#00D084;">SKILLED</span>';
  else if (stars === 2) ratingLabel = '<span style="color:#FFB020;">ROOKIE</span>';
  else ratingLabel = '<span style="color:#91A4B7;">AMATEUR</span>';

  const nextHint = hasNextLevel
    ? 'Tap to continue  |  Tap RESET for mission select'
    : 'Tap RESET for mission select';

  showOverlay(
    'HEIST COMPLETE',
    `<span style="color:#FFD166;font-size:28px;letter-spacing:0.08em;">${filled}</span>` +
    `<span style="color:#2A2A3A;font-size:28px;letter-spacing:0.08em;">${empty}</span><br>` +
    `${ratingLabel}<br><br>` +
    `<span style="color:#91A4B7;font-size:13px;">` +
    `TIME &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span style="color:#F5F7FA;">${formatTime(time)}</span><br>` +
    `ATTEMPTS &nbsp;&nbsp; <span style="color:#F5F7FA;">${attempts}</span><br>` +
    `ECHOES &nbsp;&nbsp;&nbsp;&nbsp; <span style="color:#F5F7FA;">${echoes}</span></span>`,
    nextHint,
    '#FFD166'
  );
}

export function showStartOverlay(levelData) {
  const guards = (levelData.guards && levelData.guards.length > 0)
    ? '<br>Guards patrol the area.' : '';
  const cams = (levelData.cameras && levelData.cameras.length > 0)
    ? '<br>Cameras watch for intruders.' : '';

  showOverlay(
    'ECHO HEIST',
    `<span style="color:#91A4B7;font-size:13px;">${levelData.subtitle}</span><br><br>` +
    `<span style="color:#FFD166;font-size:18px;">${levelData.name}</span><br><br>` +
    `<span style="color:#91A4B7;font-size:13px;">` +
    `Steal the loot and escape.${guards}${cams}<br><br>` +
    `Tap <span style="color:#00E5FF;">ECHO</span> to retry and create an echo of yourself.</span>`,
    'Press any key to start',
    '#00E5FF'
  );
}

export function showTutorialOverlay(step, onContinue) {
  const tutorials = {
    '1_start': {
      title: 'MOVE',
      body: 'Use the <span style="color:#00E5FF">joystick</span> to move your thief.<br><br>Reach the <span style="color:#FFD166">LOOT</span> and escape through the <span style="color:#00D084">EXIT</span>.',
      hint: 'Tap to continue'
    },
    '1_button': {
      title: 'BUTTONS & DOORS',
      body: 'Stand on the <span style="color:#00E5FF">button</span> to open the <span style="color:#00D084">door</span>.<br><br>But the door closes when you leave the button...',
      hint: 'Tap to continue'
    },
    '1_echo': {
      title: 'CREATE AN ECHO',
      body: 'Tap <span style="color:#00E5FF">ECHO</span> to retry.<br><br>Your previous run becomes a <span style="color:#18C8FF">ghost echo</span> that repeats exactly what you did!<br><br>Let your echo hold the button while you go through the door.',
      hint: 'Tap to continue'
    },
    '2_multi': {
      title: 'MULTIPLE ECHOES',
      body: 'This vault needs <span style="color:#FFD166">2 buttons</span> held at once.<br><br>Create <span style="color:#18C8FF">2 echoes</span> — one for each button.',
      hint: 'Tap to continue'
    },
    '3_cameras': {
      title: 'CAMERAS',
      body: 'Avoid the <span style="color:#FF335C">red cone</span>!<br><br>Time your movement through gaps in the camera sweep.',
      hint: 'Tap to continue'
    }
  };

  const t = tutorials[step];
  if (!t) return;

  showOverlay(t.title, t.body, t.hint, '#00E5FF');

  // One-time click to dismiss
  const handler = () => {
    overlayEl.removeEventListener('click', handler);
    if (onContinue) onContinue();
  };
  overlayEl.addEventListener('click', handler);
}

export function showLevelSelectOverlay(game) {
  const totalLevels = LEVELS.length;

  let cards = '';
  for (let i = 0; i < totalLevels; i++) {
    const unlocked = Save.isLevelUnlocked(i) || game.debug;
    const stars = Save.getBestStars(i);
    const levelData = getLevelData(i);
    const name = levelData.name;
    const starDisplay = stars > 0
      ? '<span style="color:#FFD166">' + '\u2605'.repeat(stars) + '</span><span style="color:#2A2A3A">' + '\u2606'.repeat(5 - stars) + '</span>'
      : '<span style="color:#2A2A3A">\u2606\u2606\u2606\u2606\u2606</span>';

    if (unlocked) {
      cards += '<div class="level-card unlocked" onclick="window._selectLevel(' + i + ')" style="cursor:pointer;background:rgba(0,229,255,0.05);border:1px solid rgba(0,229,255,0.2);border-radius:8px;padding:8px 12px;margin:4px;display:inline-block;min-width:140px;text-align:center;">' +
        '<div style="color:#00E5FF;font-size:11px;font-weight:700;letter-spacing:0.08em;">' + (i + 1) + '</div>' +
        '<div style="color:#F5F7FA;font-size:12px;font-weight:600;">' + name + '</div>' +
        '<div style="font-size:11px;">' + starDisplay + '</div>' +
        '</div>';
    } else {
      cards += '<div class="level-card locked" style="background:rgba(30,30,40,0.5);border:1px solid rgba(100,100,120,0.15);border-radius:8px;padding:8px 12px;margin:4px;display:inline-block;min-width:140px;text-align:center;opacity:0.4;">' +
        '<div style="color:#91A4B7;font-size:11px;">&#x1F512; ' + (i + 1) + '</div>' +
        '<div style="color:#91A4B7;font-size:12px;">' + name + '</div>' +
        '</div>';
    }
  }

  // Set up the global click handler
  window._selectLevel = function(index) {
    game.onSelectLevel(index);
  };

  const totalStars = Save.getTotalStars();

  showOverlay(
    'ECHO HEIST',
    '<div style="color:#91A4B7;font-size:11px;margin-bottom:8px;">SELECT MISSION &nbsp; \u2605 ' + totalStars + '</div>' +
    '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:2px;max-height:50vh;overflow-y:auto;">' +
    cards +
    '</div>',
    'Tap a mission to start',
    '#00E5FF'
  );
}
