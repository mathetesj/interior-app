const CACHE_NAME = 'interior-app-v2.0.6';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // 안정성을 위해 캐시하지 않습니다. 모든 요청은 브라우저 기본 네트워크 흐름을 사용합니다.
  return;
});
