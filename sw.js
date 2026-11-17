const SCOPE = new URL(self.registration.scope);

// A teljes scope kódolása elkülöníti az ugyanazon domainen
// található különböző alkalmazások gyorsítótárait.
const PREFIX = 'vilagora-cache:' + encodeURIComponent(SCOPE.href) + ':';
const CACHE = PREFIX + '2.0.1';

const FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './core.js',
  './cities.json',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable.png',
  './icons/apple.png'
];

const URLS = FILES.map(path => new URL(path, SCOPE).href);
const ALLOWED = new Set(URLS);
const INDEX_URL = new URL('./index.html', SCOPE).href;

// Csak az előző, ismert verzió saját cache-ét töröljük.
const LEGACY_CACHE = 'vilagora-' + SCOPE.pathname + '-2.0.0';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const requests = URLS.map(url => new Request(url, {
      cache: 'reload',
      credentials: 'same-origin'
    }));

    // Ha egy szükséges fájl hiányzik, az új verzió nem aktiválódik.
    await cache.addAll(requests);
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          (key.startsWith(PREFIX) && key !== CACHE) ||
          key === LEGACY_CACHE
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'ACTIVATE') {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.origin !== SCOPE.origin ||
    !url.pathname.startsWith(SCOPE.pathname)
  ) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(INDEX_URL);

      if (cached) return cached;

      // A cache hiányakor online még megnyitható az alkalmazás.
      try {
        return await fetch(request);
      } catch {
        return new Response(
          '<!doctype html><html lang="hu"><meta charset="utf-8">' +
          '<title>Világóra – offline</title>' +
          '<h1>Az offline példány nem érhető el</h1>' +
          '<p>Csatlakozz az internethez, majd töltsd újra az oldalt.</p>' +
          '</html>',
          {
            status: 503,
            headers: {'Content-Type': 'text/html; charset=utf-8'}
          }
        );
      }
    })());
    return;
  }

  if (!ALLOWED.has(url.href)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    // Hiányzó erőforrásnál hálózati tartalékág.
    // Nem írjuk felül a verzióhoz tartozó cache-t vegyes fájlokkal.
    return fetch(request);
  })());
});