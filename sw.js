const CACHE_NAME = 'echo-heist-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/src/game.js',
  '/src/player.js',
  '/src/echo.js',
  '/src/level.js',
  '/src/camera.js',
  '/src/collision.js',
  '/src/direction.js',
  '/src/sprites.js',
  '/src/ui.js',
  '/assets/music.mp3',
  '/assets/alarm_pulse_vfx.png',
  '/assets/app_icon.png',
  '/assets/btn_next_heist.png',
  '/assets/btn_play.png',
  '/assets/btn_retry.png',
  '/assets/camera_cone.png',
  '/assets/door_closed.png',
  '/assets/door_open.png',
  '/assets/echo_clone_idle.png',
  '/assets/echo_clone_interact.png',
  '/assets/echo_clone_walk.png',
  '/assets/echo_pulse_vfx.png',
  '/assets/echo_trail_dot.png',
  '/assets/escape_zone.png',
  '/assets/floor_tile_base.png',
  '/assets/floor_tile_highlight.png',
  '/assets/gold_burst_vfx.png',
  '/assets/guard_idle.png',
  '/assets/guard_walk.png',
  '/assets/hud_alarm_detected.png',
  '/assets/hud_alarm_safe.png',
  '/assets/hud_echo_count.png',
  '/assets/hud_timer_panel.png',
  '/assets/laser_beam.png',
  '/assets/laser_gate_post.png',
  '/assets/logo_echo_heist.png',
  '/assets/loot_diamond.png',
  '/assets/player_thief_idle.png',
  '/assets/player_thief_interact.png',
  '/assets/player_thief_walk.png',
  '/assets/pressure_button_off.png',
  '/assets/pressure_button_on.png',
  '/assets/security_camera.png',
  '/assets/spawn_point.png',
  '/assets/vault_door_closed.png',
  '/assets/vault_door_open.png',
  '/assets/wall_corner.png',
  '/assets/wall_east.png',
  '/assets/wall_north.png',
  '/assets/wall_south_low.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
