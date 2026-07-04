importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
const CACHE_NAME = 'biblia-online-v9';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icons/logo2.png',
  '/icons/logo3.png',
  '/icons/icon-any-192.png',
  '/icons/icon-any-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/placeholder.svg'
];

const BIBLE_DATA_URL = 'https://raw.githubusercontent.com/eversondeveloper/bibialivrejson/main/biblialivrecorrecao1.json';

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

      // Pre-cache Bible database
      try {
        await cache.add(new Request(BIBLE_DATA_URL, { mode: 'cors' }));
        console.log('[SW] Bible database pre-cached successfully!');
      } catch (err) {
        console.warn('[SW] Bible database pre-cache failed, will cache on next fetch:', err);
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
        // Fallback for offline images
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('image')) {
          return caches.match('/icons/logo2.png').then((imgRes) => {
            if (imgRes) return imgRes;
            return caches.match('/placeholder.svg').then((plRes) => {
              if (plRes) return plRes;
              return new Response('', { status: 404 });
            });
          });
        }
        return new Response('Offline / Erro de Rede', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

// --- PUSH NOTIFICATIONS ---
// Note: We do not intercept 'push' events anymore. OneSignal's SDK handles all push notifications.

self.addEventListener('message', (event) => {
  if (!event.data) return;

  // ONLY handle our specific custom messages; skip OneSignal's internal messages
  if (event.data.type === 'TEST_NOTIFICATION') {
    const options = {
      body: 'Sua notificação de teste da Biblia Online foi enviada com sucesso! 🔔',
      icon: '/icons/icon-any-192.png',
      badge: '/icons/apple-touch-icon.png',
      vibrate: [200, 100, 200],
      data: {
        isLocalTest: true,
        url: '/'
      }
    };
    self.registration.showNotification('Teste de Notificação 🔔', options);
  } else if (event.data.type === 'APP_OPENED') {
    console.log('[SW] App opened event received');
  } else if (event.data.type === 'CACHE_OFFLINE') {
    console.log('[SW] Cache offline event received');
  }
});

self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data;

  // Guard clause: Only handle our own local test notifications
  if (!data || !data.isLocalTest) {
    // Let OneSignal's SDK handle its own notifications (clicks, close, etc.)
    return;
  }

  event.notification.close();
  const urlToOpen = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
