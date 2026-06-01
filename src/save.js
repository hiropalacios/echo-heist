// Save system for ECHO HEIST — localStorage persistence

const SAVE_KEY = 'echoheist_save_v1';

let saveData = null;

function getDefault() {
  return {
    unlockedLevel: 1,  // 1-indexed, player has beaten levels before this
    stars: {},         // { "1": 4, "2": 3, ... } best stars per level
    totalStars: 0,
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    saveData = raw ? JSON.parse(raw) : getDefault();
  } catch (e) {
    saveData = getDefault();
  }
  return saveData;
}

export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (e) { /* storage full or blocked */ }
}

export function getData() {
  if (!saveData) load();
  return saveData;
}

export function completeLevel(levelIndex, stars) {
  if (!saveData) load();
  const num = levelIndex + 1; // 1-indexed
  // Update best stars
  const prev = saveData.stars[num] || 0;
  if (stars > prev) {
    saveData.stars[num] = stars;
  }
  // Unlock next level
  if (num >= saveData.unlockedLevel) {
    saveData.unlockedLevel = num + 1;
  }
  // Recalc total
  saveData.totalStars = Object.values(saveData.stars).reduce((a, b) => a + b, 0);
  save();
}

export function isLevelUnlocked(levelIndex) {
  if (!saveData) load();
  return (levelIndex + 1) <= saveData.unlockedLevel;
}

export function getBestStars(levelIndex) {
  if (!saveData) load();
  return saveData.stars[levelIndex + 1] || 0;
}

export function getTotalStars() {
  if (!saveData) load();
  return saveData.totalStars;
}

export function resetProgress() {
  saveData = getDefault();
  save();
}
