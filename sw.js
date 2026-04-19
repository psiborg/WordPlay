/* ============================================================
   WordPlay Service Worker  |  sw.js
   ============================================================

   Strategy
   --------
   • App shell (HTML / CSS / JS / fonts)  →  Cache-first
     Served instantly from cache; updated in the background on
     next visit (stale-while-revalidate pattern).

   • dawg.json + words.txt  →  Cache-first with network fallback
     Large files fetched once and served from cache thereafter.

   • Everything else  →  Network-first with cache fallback
     Any request not in the pre-cache list falls through to the
     network; if offline the cached version (if any) is returned.

   Cache versioning
   ----------------
   Bump CACHE_VERSION whenever you deploy a new build.
   The old cache is deleted during the 'activate' phase so stale
   assets never serve after an update.
   ============================================================ */

const CACHE_VERSION  = 'wordplay-v1.51';
const STATIC_CACHE   = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE  = `${CACHE_VERSION}-dynamic`;

/* -- Files to pre-cache on install -------------------------
   Every asset the app needs to function fully offline.        */
const PRECACHE_URLS = [
  /* App shell */
  './index.html',
  './app.css',
  './app.js',
  './fonts.css',
  './manifest.json',

  /* Dictionary files */
  './dawg.json',
  // './words.txt',

  /* Fonts — all 64 woff2 files */
  './fonts/atkinson-hyperlegible/atkinson-hyperlegible-latin-400-normal.woff2',
  './fonts/atkinson-hyperlegible/atkinson-hyperlegible-latin-700-normal.woff2',
  './fonts/courier-prime/courier-prime-latin-400-normal.woff2',
  './fonts/courier-prime/courier-prime-latin-700-normal.woff2',
  './fonts/crimson-pro/crimson-pro-latin-400-normal.woff2',
  './fonts/crimson-pro/crimson-pro-latin-500-normal.woff2',
  './fonts/crimson-pro/crimson-pro-latin-600-normal.woff2',
  './fonts/dm-mono/dm-mono-latin-400-normal.woff2',
  './fonts/dm-mono/dm-mono-latin-500-normal.woff2',
  './fonts/dm-sans/dm-sans-latin-400-normal.woff2',
  './fonts/dm-sans/dm-sans-latin-500-normal.woff2',
  './fonts/dm-sans/dm-sans-latin-600-normal.woff2',
  './fonts/exo-2/exo-2-latin-400-normal.woff2',
  './fonts/exo-2/exo-2-latin-600-normal.woff2',
  './fonts/exo-2/exo-2-latin-700-normal.woff2',
  './fonts/exo-2/exo-2-latin-900-normal.woff2',
  './fonts/fira-code/fira-code-latin-400-normal.woff2',
  './fonts/fira-code/fira-code-latin-500-normal.woff2',
  './fonts/fira-sans/fira-sans-latin-400-normal.woff2',
  './fonts/fira-sans/fira-sans-latin-500-normal.woff2',
  './fonts/fira-sans/fira-sans-latin-600-normal.woff2',
  './fonts/fredoka-one/fredoka-one-latin-400-normal.woff2',
  './fonts/ibm-plex-mono/ibm-plex-mono-latin-400-normal.woff2',
  './fonts/ibm-plex-mono/ibm-plex-mono-latin-500-normal.woff2',
  './fonts/ibm-plex-sans/ibm-plex-sans-latin-400-normal.woff2',
  './fonts/ibm-plex-sans/ibm-plex-sans-latin-500-normal.woff2',
  './fonts/ibm-plex-sans/ibm-plex-sans-latin-600-normal.woff2',
  './fonts/inconsolata/inconsolata-latin-400-normal.woff2',
  './fonts/inconsolata/inconsolata-latin-500-normal.woff2',
  './fonts/inter/inter-latin-400-normal.woff2',
  './fonts/inter/inter-latin-500-normal.woff2',
  './fonts/inter/inter-latin-600-normal.woff2',
  './fonts/inter/inter-latin-700-normal.woff2',
  './fonts/jetbrains-mono/jetbrains-mono-latin-400-normal.woff2',
  './fonts/jetbrains-mono/jetbrains-mono-latin-500-normal.woff2',
  './fonts/libre-baskerville/libre-baskerville-latin-400-normal.woff2',
  './fonts/libre-baskerville/libre-baskerville-latin-700-normal.woff2',
  './fonts/lora/lora-latin-400-normal.woff2',
  './fonts/lora/lora-latin-600-normal.woff2',
  './fonts/lora/lora-latin-700-normal.woff2',
  './fonts/nunito/nunito-latin-400-normal.woff2',
  './fonts/nunito/nunito-latin-500-normal.woff2',
  './fonts/nunito/nunito-latin-600-normal.woff2',
  './fonts/nunito/nunito-latin-700-normal.woff2',
  './fonts/orbitron/orbitron-latin-600-normal.woff2',
  './fonts/orbitron/orbitron-latin-700-normal.woff2',
  './fonts/orbitron/orbitron-latin-900-normal.woff2',
  './fonts/overpass-mono/overpass-mono-latin-400-normal.woff2',
  './fonts/overpass-mono/overpass-mono-latin-600-normal.woff2',
  './fonts/playfair-display/playfair-display-latin-700-normal.woff2',
  './fonts/playfair-display/playfair-display-latin-900-normal.woff2',
  './fonts/rajdhani/rajdhani-latin-400-normal.woff2',
  './fonts/rajdhani/rajdhani-latin-500-normal.woff2',
  './fonts/rajdhani/rajdhani-latin-600-normal.woff2',
  './fonts/roboto-mono/roboto-mono-latin-400-normal.woff2',
  './fonts/roboto-mono/roboto-mono-latin-500-normal.woff2',
  './fonts/share-tech-mono/share-tech-mono-latin-400-normal.woff2',
  './fonts/source-code-pro/source-code-pro-latin-400-normal.woff2',
  './fonts/source-code-pro/source-code-pro-latin-500-normal.woff2',
  './fonts/source-sans-3/source-sans-3-latin-400-normal.woff2',
  './fonts/source-sans-3/source-sans-3-latin-500-normal.woff2',
  './fonts/source-sans-3/source-sans-3-latin-600-normal.woff2',
  './fonts/space-mono/space-mono-latin-400-normal.woff2',
  './fonts/space-mono/space-mono-latin-700-normal.woff2',
];

/* -- INSTALL — pre-cache all static assets ---------------- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())   // activate immediately, don't wait for tabs to close
  );
});

/* -- ACTIVATE — delete outdated caches -------------------- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())  // take control of all open tabs immediately
  );
});

/* -- FETCH — serve from cache, update in background ------- */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const path = url.pathname;

  // -- Large dictionary files: cache-first, no background update --
  // These are deterministic — if the file is cached it's correct.
  if (path.endsWith('dawg.json') || path.endsWith('words.txt')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // -- Font files: cache-first (they never change) --------------
  if (path.includes('/fonts/') && path.endsWith('.woff2')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // -- App shell: stale-while-revalidate ------------------------
  // Serve instantly from cache; fetch a fresh copy in the background
  // so the next visit gets the update.
  if (PRECACHE_URLS.some(u => path === u || path === '/' && u === '/index.html')) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // -- Everything else: network-first with cache fallback -------
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

/* -- STRATEGIES ------------------------------------------- */

/**
 * Cache-first: return cached response immediately if available,
 * otherwise fetch from network and store in cache.
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — resource not cached.', { status: 503 });
  }
}

/**
 * Stale-while-revalidate: serve from cache immediately, then fetch
 * a fresh copy in the background and update the cache for next time.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Always kick off a background refresh
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || fetchPromise;
}

/**
 * Network-first: try the network, fall back to cache if offline.
 * Successful network responses are stored for offline fallback.
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline — resource not cached.', { status: 503 });
  }
}
