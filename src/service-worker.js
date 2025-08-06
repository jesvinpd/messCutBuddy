const CACHE_NAME = 'messcut-cache-v2'; // Changed to v2
const urlsToCache = [
  '/',
  './index.html',
  './scripts/index.js',
  './styles/variables.css',
  './styles/global.css',
  './styles/components/calendar/calendar.css', // Fixed: removed .module
  './styles/components/modal/modal.css',       // Fixed: removed .module  
  './styles/layouts/footer/footer.css',        // Fixed: removed .module
  './assets/icon.png',
  './manifest.json'
];

// Install event: cache files
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching files...');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activated');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    )
  );
  self.clients.claim();
});

// Fetch event: serve cached files if available, else fetch from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request);
      })
  );
});
