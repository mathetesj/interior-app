const CACHE = 'interior-app-v2.3.0';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never touch Apps Script, Google Drive, GitHub raw, or any cross-origin request.
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  // HTML and app shell must always come from the network first.
  // This prevents old index.html versions from being locked inside the PWA.
  if (event.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request)));
    return;
  }

  // For local static assets, prefer network. Cache only as a very last fallback.
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request, { cache: 'no-store' });
      return response;
    } catch (err) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      throw err;
    }
  })());
});
