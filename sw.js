const CACHE = 'trip-2026-v1';
const LOCAL_ASSETS = [
  '/trip.html',
  '/manifest.json',
  '/tripfavicon.png',
  '/icon-192.png',
  '/sw.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(LOCAL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // let external requests (fonts, cdn) go straight to network
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(e.request));
    return;
  }
  // local: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
