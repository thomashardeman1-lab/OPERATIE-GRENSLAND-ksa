// Service worker: houdt de app beschikbaar bij zwak bereik en bewaart bekeken kaartstukjes.
const VERSIE = 'grensland-v1';
const APP = ['./', './index.html', './style.css', './app.js', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSIE).then(c => c.addAll(APP)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSIE && k !== 'tegels').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    // Kaarttegels: eerst uit de cache, anders van het net (en bewaren).
    e.respondWith(caches.open('tegels').then(c => c.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok || res.type === 'opaque') c.put(e.request, res.clone()); return res; }))));
    return;
  }
  // App-bestanden: meteen uit de cache tonen, ondertussen een nieuwe versie ophalen.
  e.respondWith(caches.open(VERSIE).then(c => c.match(e.request).then(r => {
    const net = fetch(e.request).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; }).catch(() => r);
    return r || net;
  })));
});
