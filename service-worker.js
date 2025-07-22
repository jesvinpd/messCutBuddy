const CACHE_NAME = 'messcut-cache-v1';
const urlsToCache = [
  '/',
  '/src/',
  '/src/index.html',
  '/src/styles/variables.css',
  '/src/styles/global.css',
  '/src/styles/components/calendar/calendar.module.css',
  '/src/styles/components/modal/modal.module.css',
  '/src/styles/layouts/footer/footer.module.css',
  '/src/scripts/index.js',
  '/src/assets/logo.png',
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
