// 안정성을 위해 캐시를 사용하지 않습니다.
// 매 요청마다 브라우저 기본 네트워크 흐름을 사용해서
// Apps Script 응답이나 GitHub Pages 업데이트가 즉시 반영됩니다.

const CACHE_NAME = 'interior-app-v2.1.0';

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
  // intentionally not intercepting - let the browser handle everything
  return;
});
