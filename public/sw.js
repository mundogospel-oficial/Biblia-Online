const CACHE_NAME = 'biblia-online-v2.5.3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.v2.json',
  '/manifest.webmanifest',
  '/browserconfig.xml',
  '/safari-pinned-tab.svg',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-48x48.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-180x180.png',
  '/apple-touch-icon-167x167.png',
  '/apple-touch-icon-152x152.png',
  '/apple-touch-icon-120x120.png',
  '/apple-touch-icon-precomposed.png',
  '/mstile-70x70.png',
  '/mstile-144x144.png',
  '/mstile-150x150.png',
  '/mstile-310x150.png',
  '/mstile-310x310.png',
  '/icon-144.png',
  '/icon-192.png',
  '/icon-256.png',
  '/icon-384.png',
  '/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/logo2.png',
  '/icons/logo3.png',
  '/icons/logo4.png',
  '/placeholder.svg',
  '/data/biblia-livre.json'
];

const BIBLE_LOCAL_URL = '/data/biblia-livre.json';
const BIBLE_DATA_URL = 'https://raw.githubusercontent.com/eversondeveloper/bibialivrejson/main/biblialivrecorrecao1.json';

// 1x1 transparent PNG to return on image errors (NEVER display app logos on failed tiles or broken images)
const TRANSPARENT_1PX_PNG = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
  0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5,
  0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
]);

// Install Event - Pre-cache essential static assets and the offline Bible database
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Pre-caching static assets and offline Bible database...');
      
      // Cache assets individually to prevent one fail from blocking the entire cache
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`[SW] Static asset failed to cache: ${asset}`, err);
        }
      }

      // Pre-cache Bible database (Local first, then remote fallback)
      try {
        await cache.add(BIBLE_LOCAL_URL);
        console.log('[SW] Local Bible database pre-cached successfully!');
      } catch (err) {
        console.warn('[SW] Local Bible pre-cache notice, trying remote fallback:', err);
        try {
          await cache.add(new Request(BIBLE_DATA_URL, { mode: 'cors' }));
          console.log('[SW] Remote Bible database pre-cached successfully!');
        } catch (rErr) {
          console.warn('[SW] Remote Bible database pre-cache failed:', rErr);
        }
      }

      return self.skipWaiting();
    })
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Cleaning up old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Intercept requests for offline loading
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Intercept and cache Map tile servers (ArcGIS, OSM, NatGeo) for full offline map support
  if (
    url.host.includes('arcgisonline.com') ||
    url.host.includes('cartocdn.com') ||
    url.host.includes('openstreetmap.org') ||
    url.host.includes('tile.osm.org') ||
    url.host.includes('os-content.com')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            }).catch(() => {});
          }
          return networkResponse;
        }).catch(() => {
          // Fallback para tiles offline: Pergaminho Cartográfico Bíblico
          const OFFLINE_TILE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
            <rect width="256" height="256" fill="#f5eee1"/>
            <rect width="256" height="256" fill="rgba(220, 231, 235, 0.4)"/>
            <path d="M0,128 Q64,120 128,128 T256,128" fill="none" stroke="rgba(162, 137, 110, 0.25)" stroke-dasharray="4,4"/>
            <circle cx="128" cy="128" r="60" fill="none" stroke="rgba(162, 137, 110, 0.15)"/>
            <text x="128" y="132" font-family="serif" font-size="10" fill="rgba(110, 90, 70, 0.5)" text-anchor="middle">Terra Santa &bull; Offline</text>
          </svg>`;
          return new Response(OFFLINE_TILE_SVG, {
            status: 200,
            headers: { 'Content-Type': 'image/svg+xml' }
          });
        });
      })
    );
    return;
  }

  // Bypass Service Worker for PWA icons and apple-touch-icons
  if (
    url.pathname.includes('/icons/') || 
    url.pathname.includes('/icon-') || 
    url.pathname.includes('apple-touch-icon') ||
    url.pathname.endsWith('.png') || 
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Skip OneSignal, AI endpoints, external APIs, supabase database, and development websockets
  if (
    url.host.includes('onesignal') ||
    url.host.includes('googleapis.com') ||
    url.host.includes('gstatic.com') ||
    url.host.includes('openrouter.ai') ||
    url.pathname.startsWith('/api/ai') ||
    url.pathname.startsWith('/api/generate-image') ||
    url.pathname.startsWith('/socket.io') ||
    url.pathname.includes('hot-update') ||
    (url.host.includes('localhost') && url.port === '3000' && url.pathname.startsWith('/@')) ||
    url.host.includes('supabase.co')
  ) {
    return;
  }

  // If navigation request (e.g., page routes like /reader, /account), serve the cached index.html SPA shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Cache-First with Network fallback for static files, fonts, images and Bible data
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return from cache immediately, but trigger background fetch for files that can change to revalidate cache
        if (
          url.pathname.endsWith('.css') || 
          url.pathname.endsWith('.js') || 
          url.pathname.includes('biblia-livre.json') ||
          event.request.url === BIBLE_DATA_URL
        ) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {}); // silent catch on network fail during revalidation
        }
        return cachedResponse;
      }

      // Fetch from network and dynamically cache
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Fallback for offline images: Return transparent 1px PNG instead of logos
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('image')) {
          return new Response(TRANSPARENT_1PX_PNG, {
            status: 200,
            headers: { 'Content-Type': 'image/png' }
          });
        }
        return new Response('Offline / Erro de Rede', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

// Message event handler registered at initial evaluation
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'cleanCache') {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
});
