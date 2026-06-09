/**
 * sw.js — Service Worker для Baden Reports PWA.
 *
 * Что делает:
 *  - Кэширует базовые статические файлы (логотипы, шрифты, manifest) — cache-first
 *  - HTML и JSON всегда сначала через сеть, потом fallback на кэш — для свежести данных
 *  - Обрабатывает push-уведомления и клики по ним
 *
 * Инвалидация: при изменении CACHE_VERSION старый кэш чистится при активации SW.
 */

const CACHE_VERSION = 'baden-v1-2026-06-08';
const STATIC_CACHE = 'baden-static-' + CACHE_VERSION;
const RUNTIME_CACHE = 'baden-runtime-' + CACHE_VERSION;

// Статика, которую кэшируем при установке (cache-first, редко меняется)
const STATIC_ASSETS = [
  '/DaniilK-baden-uktus/manifest.json',
  '/DaniilK-baden-uktus/apple-touch-icon.png',
  '/DaniilK-baden-uktus/icon-192.png',
  '/DaniilK-baden-uktus/icon-512.png',
  '/DaniilK-baden-uktus/logo.png',
  '/DaniilK-baden-uktus/logo-dark.png',
];

// ─── Install: предзагружаем статику ────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())  // активируемся сразу
      .catch((e) => console.warn('[sw] install cache failed:', e))
  );
});

// ─── Activate: чистим старые кэши ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(k => k.startsWith('baden-') && !k.endsWith(CACHE_VERSION))
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch стратегия ───────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Только GET и только наш origin
  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Не вмешиваемся в:
  //  - api_url.json (всегда свежий, без кэша — там URL бэкенда)
  //  - запросы к chat_server (через cloudflared) — но они и так на другом origin, отсекаются выше
  if (url.pathname.endsWith('/api_url.json')) {
    event.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(req)));
    return;
  }

  // HTML и JSON: network-first, fallback to cache
  if (req.headers.get('accept')?.includes('text/html') ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Иконки, шрифты, изображения, скрипты, стили: cache-first, fallback to network
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|svg|woff2?|ttf|css|js)$/)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Остальное — просто network
});

async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch (e) {
    const cached = await caches.match(req);
    if (cached) return cached;
    // Оффлайн и нет в кэше — отдаём простую заглушку
    return new Response(
      '<!doctype html><html lang="ru"><meta charset="utf-8"><title>Offline</title>' +
      '<style>body{background:#0a0a0a;color:#f4ebdc;font-family:system-ui;text-align:center;padding:80px 24px;}' +
      'h1{font-weight:300;}a{color:#d4b893;}</style>' +
      '<h1>📡 Нет связи</h1><p>Данные обновятся, как только появится сеть.</p>' +
      '<p><a href="/DaniilK-baden-uktus/reports.html">← На главную</a></p>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 }
    );
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch (e) {
    // нет ни кэша ни сети — отдаём 503
    return new Response('Offline', { status: 503 });
  }
}

// ─── Push notifications ───────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Baden Uktus', body: event.data ? event.data.text() : 'Новое уведомление' };
  }

  const title = data.title || 'Baden Uktus';
  const options = {
    body:    data.body  || '',
    icon:    data.icon  || '/DaniilK-baden-uktus/icon-192.png',
    badge:   data.badge || '/DaniilK-baden-uktus/icon-192.png',
    tag:     data.tag   || 'baden-default',  // одинаковый tag = заменяет старое уведомление
    data:    { url: data.url || '/DaniilK-baden-uktus/reports.html' },
    requireInteraction: data.critical === true,  // critical alerts остаются висеть
    silent:  data.silent === true,
    timestamp: Date.now(),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Клик по уведомлению ──────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ||
                    '/DaniilK-baden-uktus/reports.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Если уже открыто окно с приложением — фокусируем + навигируем
      for (const c of clients) {
        if (c.url.includes('/DaniilK-baden-uktus/') && 'focus' in c) {
          c.navigate(targetUrl);
          return c.focus();
        }
      }
      // Иначе открываем новое
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
