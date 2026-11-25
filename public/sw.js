/* Invidora service worker — studio shell + offline guest invite pages. */
const SHELL_CACHE = 'invidora-shell-v3';
const INVITE_CACHE = 'invidora-invites-v3';
const SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

function isInviteNavigation(url) {
  if (url.origin !== self.location.origin) {
    return false;
  }
  const path = url.pathname;
  return (
    path.startsWith('/invite/') ||
    path.startsWith('/i/') ||
    /^\/[a-z0-9][a-z0-9-]{1,60}\/?$/i.test(path)
  );
}

function isStaticAsset(url) {
  if (url.origin !== self.location.origin) {
    return false;
  }
  return (
    url.pathname.startsWith('/build/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/storage/') ||
    /\.(?:css|js|woff2?|png|jpe?g|webp|svg|ico)$/i.test(url.pathname)
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== INVITE_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  // Guest invite pages: network-first, keep last successful HTML for offline reopen.
  if (request.mode === 'navigate' && isInviteNavigation(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(INVITE_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/')),
        ),
    );
    return;
  }

  // Studio navigations: network-first with shell fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match('/dashboard') || caches.match('/')),
        ),
    );
    return;
  }

  // Built assets / images: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
