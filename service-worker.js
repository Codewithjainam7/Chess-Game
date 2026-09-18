const CACHE_NAME = 'chess-game-v5';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/css/styles.css',
  './src/css/responsive.css',
  './src/js/board.js',
  './src/js/pieces.js',
  './src/js/moveGenerator.js',
  './src/js/gameState.js',
  './src/js/notation.js',
  './src/js/zobrist.js',
  './src/js/ai.js',
  './src/js/confetti.js',
  './src/js/ui.js',
  './src/js/main.js',
  './src/assets/icons/icon-192.png',
  './src/assets/icons/icon-512.png',
  './src/assets/icons/icon-maskable.png',
  './src/assets/icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Network-first strategy for live updates with seamless offline fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
