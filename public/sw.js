const STATIC_CACHE = 'nadya-static-v2';
const DYNAMIC_CACHE = 'nadya-dynamic-v2';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install event - cache static assets only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up ALL old caches (forces fresh start)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - routing strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http requests
  if (!url.protocol.startsWith('http')) return;

  // IMPORTANT: NEVER cache API calls - always go to network
  if (url.pathname.startsWith('/api/')) {
    // For non-GET (POST, PUT, DELETE) - let browser handle normally
    if (request.method !== 'GET') return;

    // For GET API calls - network only, no caching
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ success: false, error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Cache-first strategy for static assets only (images, fonts, etc)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // For HTML pages - ALWAYS network first (never serve cached HTML)
  event.respondWith(networkFirstNoCache(request));
});

// Cache-first for static assets (images, fonts, icons)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network-first for HTML pages - NEVER cache them
async function networkFirstNoCache(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    // Offline fallback - serve cached version or offline page
    const cached = await caches.match(request);
    if (cached) return cached;

    // For navigation requests, serve the cached homepage
    if (request.mode === 'navigate') {
      const cachedHome = await caches.match('/');
      if (cachedHome) return cachedHome;
    }

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Check if URL is a static asset
function isStaticAsset(url) {
  const staticExtensions = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
  ];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}
