const CACHE_NAME = 'messcut-cache-v1';
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/scripts/index.js",
  "/styles/global.css",
  "/styles/variables.css",
  "/styles/components/calendar/calendar.module.css",
  "/styles/components/modal/modal.module.css",
  "/styles/layouts/footer/footer.module.css",
  "/assets/icon.png",
  // Add icons and other assets as needed
];

// Install event: cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch event: serve cached files if available, else fetch from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
