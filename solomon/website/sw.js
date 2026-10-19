const CACHE_NAME = 'solomon-v4-cache';
const ASSETS = ['/', '/index.html', '/admin.html', '/pricing.html', '/features.html', '/pitch-deck.html'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
