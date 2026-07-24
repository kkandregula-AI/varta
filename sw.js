// VĀRTA service worker — real Web Push + offline shell.
// Must be served from origin root (not a blob URL) for push to work, esp. on iOS.
const CACHE = 'varta-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Never cache API calls; cache-first for the shell so it opens offline.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) return; // always hit network
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});

// The actual push: server sends {title, body, url}
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  const title = d.title || 'New AI recap';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || 'A fresh AINews recap just published.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'varta-recap',
    data: { url: d.url || 'https://news.smol.ai' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
    for (const w of wins) { if ('focus' in w) return w.focus(); }
    return clients.openWindow(target);
  }));
});
