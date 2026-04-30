const CACHE_VERSION = 'bolao-copa-v3';
const FLAGS_CACHE = 'bolao-flags-v1';
const STATIC_CACHE = 'bolao-static-v1';

self.addEventListener('install', (event) => {
  // Activate immediately, replacing any older SW
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![CACHE_VERSION, FLAGS_CACHE, STATIC_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - /flags/*  → cache-first (imutáveis, raramente mudam)
// - /icon-*, /placeholder.svg, /manifest → cache-first
// - flagcdn.com → cache-first (fallback caso ainda existam refs antigas)
// - navegação → network-first com fallback offline
// - resto → passa direto (network)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // 1) Bandeiras locais — cache-first, longa duração
  if (sameOrigin && url.pathname.startsWith('/flags/')) {
    event.respondWith(cacheFirst(req, FLAGS_CACHE));
    return;
  }

  // 2) flagcdn (fallback para caches antigos / refs externas)
  if (url.hostname === 'flagcdn.com') {
    event.respondWith(cacheFirst(req, FLAGS_CACHE));
    return;
  }

  // 3) Ícones/manifest/placeholders estáticos
  if (
    sameOrigin &&
    (url.pathname.startsWith('/icon-') ||
     url.pathname === '/placeholder.svg' ||
     url.pathname === '/manifest.json' ||
     url.pathname === '/favicon.ico')
  ) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // 4) Navegação HTML — network-first
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    // Só cacheia respostas válidas (200 OK, opaque ok p/ CDN)
    if (response && (response.status === 200 || response.type === 'opaque')) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    // Fallback: tenta qualquer cache (ex: bandeira já vista antes)
    const fallback = await caches.match(request);
    if (fallback) return fallback;
    throw err;
  }
}

// Listen for update message from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  let data = { title: '⚽ Bolão Copa 2026', body: 'Você tem palpites pendentes!' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // Use default data
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'match-reminder',
    data: {
      url: data.url || '/',
    },
    vibrate: [200, 100, 200],
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});