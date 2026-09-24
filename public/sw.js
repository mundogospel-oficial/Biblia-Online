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

// Activate Event - Clean up stale caches while preserving offline user downloads
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Never delete user offline downloaded content
          if (
            cacheName !== CACHE_NAME && 
            cacheName !== 'biblia-offline-data' && 
            cacheName !== 'biblia-offline-v1' &&
            !cacheName.includes('offline')
          ) {
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

  // 1. Skip external origins & APIs that should be handled by browser natively
  // (Supabase storage, Google avatars, OneSignal, AI endpoints, external CDNs)
  if (
    url.origin !== self.location.origin ||
    url.host.includes('supabase.co') ||
    url.host.includes('googleusercontent.com') ||
    url.host.includes('googleapis.com') ||
    url.host.includes('gstatic.com') ||
    url.host.includes('onesignal') ||
    url.host.includes('openrouter.ai') ||
    url.pathname.startsWith('/api/ai') ||
    url.pathname.startsWith('/api/generate-image') ||
    url.pathname.startsWith('/socket.io') ||
    url.pathname.includes('hot-update') ||
    (url.host.includes('localhost') && url.port === '3000' && url.pathname.startsWith('/@'))
  ) {
    return;
  }

  // 2. Local PWA app icons and logos - Cache first, network fallback with logo2.png safety fallback
  if (
    url.pathname.includes('/icons/') || 
    url.pathname.includes('/icon-') || 
    url.pathname.includes('apple-touch-icon') ||
    url.pathname.endsWith('.png') || 
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        }).catch(async () => {
          return (await caches.match('/icons/logo2.png')) || (await caches.match('/favicon.ico'));
        });
      })
    );
    return;
  }

  // 3. If navigation request (e.g., page routes like /reader, /account, /conta), serve the cached index.html SPA shell
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
