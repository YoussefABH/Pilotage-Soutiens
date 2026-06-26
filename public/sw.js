self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Direct network requests for live updates
  e.respondWith(fetch(e.request).catch(() => {
    return caches.match(e.request);
  }));
});
