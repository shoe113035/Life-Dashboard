const CACHE = 'life-dash-v23';
const ASSETS = [
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './logo.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];
self.addEventListener('install', e => {
  // cache each asset individually so one missing file doesn't break install
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.all(ASSETS.map(a => c.add(a).catch(() => null)))
  ).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Never cache calendar (Apps Script) or Supabase API requests
  if (url.hostname.includes('script.google')) return;
  if (url.hostname.includes('supabase.co')) return;
  // NETWORK-FIRST for the app shell: always fetch the newest index.html when online,
  // fall back to the cached copy only when offline.
  const isShell = e.request.mode === 'navigate' || url.pathname.endsWith('index.html');
  if (isShell) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
        }
        return resp;
      }).catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }
  // cache-first for everything else (icons, logo, chart.js)
  e.respondWith(
    caches.match(e.request, { ignoreSearch: false }).then(hit =>
      hit || fetch(e.request).then(resp => {
        if (e.request.method === 'GET' && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
