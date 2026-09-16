// Hamroh Telegram Mini App — Service Worker (Offline Caching)
const CACHE_NAME = 'hamroh-tma-v1.1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/app.html',
  '/risk.html',
  '/faq.html',
  '/glossariy.html',
  '/offline.html',
  '/manifest.json',
  '/tma.js',
  '/og-image.png'
];

// Install: Precache all essential medical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline pages');
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate for local pages & Cache-First for static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET or chrome-extension requests
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Handle same-origin requests
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Fetch from network in background to revalidate cache
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch((err) => {
          console.log('[ServiceWorker] Network fetch failed, falling back to cache');
          // If offline and request is navigation, show offline fallback if not in cache
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });

        // Return cached response immediately if present, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // For external resources (Google Fonts, etc.)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return null or placeholder if external resource fails offline
        return null;
      });
    })
  );
});
