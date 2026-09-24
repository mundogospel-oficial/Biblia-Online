// OneSignal Service Worker SDK integration (v16)
try {
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
} catch (e) {
  console.warn('[SW] OneSignal SDK import skipped or offline:', e);
}

const CACHE_NAME = 'biblia-online-v2.6.0';
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
  '/favicon.png',
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
  '/icon-72.png',
  '/icon-96.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-192.png',
  '/icon-256.png',
  '/icon-384.png',
  '/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-192.png',
  '/icons/icon-256.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/logo2.png',
  '/icons/logo3.png',
  '/icons/logo4.png',
  '/placeholder.svg'
];

const BIBLE_DATA_URL = 'https://raw.githubusercontent.com/eversondeveloper/bibialivrejson/main/biblialivrecorrecao1.json';

// Curated verses for 100% offline background notifications when the app is closed
const OFFLINE_DAILY_VERSES = [
  { id: 1, text: "O SENHOR é o meu pastor; nada me faltará.", reference: "Salmos 23:1" },
  { id: 2, text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", reference: "João 3:16" },
  { id: 3, text: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13" },
  { id: 4, text: "Se Deus é por nós, quem será contra nós?", reference: "Romanos 8:31" },
  { id: 5, text: "Lancem sobre ele todas as suas ansiedades, porque ele cuida de vocês.", reference: "1 Pedro 5:7" },
  { id: 6, text: "Busquem em primeiro lugar o Reino de Deus e a sua justiça, e todas estas coisas lhes serão acrescentadas.", reference: "Mateus 6:33" },
  { id: 7, text: "Seja forte e corajoso! Não tenha medo, nem desanime, pois o SENHOR, seu Deus, estará com você por onde quer que você andar.", reference: "Josué 1:9" },
  { id: 8, text: "Confie no SENHOR de todo o seu coração, e não se apoie em seu próprio entendimento.", reference: "Provérbios 3:5" },
  { id: 9, text: "Mil poderão cair ao seu lado, e dez mil à sua direita, mas você não será atingido.", reference: "Salmos 91:7" },
  { id: 10, text: "E sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus.", reference: "Romanos 8:28" },
  { id: 11, text: "Não fiquem ansiosos por coisa alguma; antes, as suas petições sejam conhecidas diante de Deus em oração.", reference: "Filipenses 4:6" },
  { id: 12, text: "E a paz de Deus, que excede todo o entendimento, guardará os seus corações e as suas mentes em Cristo Jesus.", reference: "Filipenses 4:7" },
  { id: 13, text: "O SENHOR é a minha luz e a minha salvação; de quem terei medo? O SENHOR é a fortaleza da minha vida.", reference: "Salmos 27:1" },
  { id: 14, text: "Porque sou eu que conheço os planos que tenho para vocês, planos de paz e não de mal, para lhes dar um futuro e uma esperança.", reference: "Jeremias 29:11" },
  { id: 15, text: "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.", reference: "Salmos 119:105" },
  { id: 16, text: "Disse-lhe Jesus: Eu sou o caminho, e a verdade, e a vida; ninguém vem ao Pai, senão por mim.", reference: "João 14:6" },
  { id: 17, text: "Mas os que esperam no SENHOR renovarão as suas forças; subirão com asas como águias; correrão e não se cansarão.", reference: "Isaías 40:31" },
  { id: 18, text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", reference: "Mateus 11:28" },
  { id: 19, text: "Alegrem-se na esperança, sejam pacientes na tribulação, perseverem na oração.", reference: "Romanos 12:12" },
  { id: 20, text: "Deixo-vos a paz, a minha paz vos dou; não se turbe o vosso coração, nem se atemorize.", reference: "João 14:27" },
  { id: 21, text: "Deleite-se no SENHOR, e ele lhe concederá os desejos do seu coração.", reference: "Salmos 37:4" },
  { id: 22, text: "O coração do homem traça o seu caminho, mas o SENHOR estabelece os seus passos.", reference: "Provérbios 16:9" },
  { id: 23, text: "Porque para Deus nada será impossível.", reference: "Lucas 1:37" },
  { id: 24, text: "Em tudo deem graças, porque esta é a vontade de Deus em Cristo Jesus para com vocês.", reference: "1 Tessalonicenses 5:18" },
  { id: 25, text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.", reference: "Salmos 91:1" },
  { id: 26, text: "Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo.", reference: "Salmos 23:4" },
  { id: 27, text: "Em paz me deitarei e dormirei, porque só tu, SENHOR, me fazes habitar em segurança.", reference: "Salmos 4:8" },
  { id: 28, text: "Elevo os meus olhos para os montes; de onde me virá o socorro? O meu socorro vem do SENHOR.", reference: "Salmos 121:1-2" },
  { id: 29, text: "Peçam, e lhes será dado; busquem, e encontrarão; batam, e a porta se abrirá para vocês.", reference: "Mateus 7:7" },
  { id: 30, text: "Consagre ao SENHOR tudo o que você faz, e os seus planos serão bem-sucedidos.", reference: "Provérbios 16:3" },
  { id: 31, text: "O SENHOR é a minha força e o meu escudo; nele o meu coração confiou, e fui socorrido.", reference: "Salmos 28:7" },
  { id: 32, text: "O SENHOR guardará a tua saída e a tua entrada, desde agora e para sempre.", reference: "Salmos 121:8" },
  { id: 33, text: "No mundo tereis aflições, mas tende bom ânimo, eu venci o mundo.", reference: "João 16:33" }
];

const getOfflineVerseForCurrentTime = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const isEvening = now.getHours() >= 18;
  const index = ((dayOfYear * 2) + (isEvening ? 1 : 0)) % OFFLINE_DAILY_VERSES.length;
  const verse = OFFLINE_DAILY_VERSES[index];
  return { verse, isEvening };
};

// Message event registered at initial evaluation
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

  // Permite testar notificação em segundo plano com delay (mesmo que o usuário feche a aba logo em seguida)
  if (event.data.action === 'scheduleNotification') {
    const { delayMs, title, body, tag } = event.data;
    const timeout = Math.max(1000, delayMs || 5000);

    setTimeout(async () => {
      try {
        await self.registration.showNotification(title || 'Bíblia Online', {
          body: body || 'Notificação em segundo plano entregue com sucesso.',
          icon: '/icons/logo2.png',
          badge: '/apple-touch-icon.png',
          tag: tag || `biblia-scheduled-${Date.now()}`,
          renotify: true,
          vibrate: [200, 100, 200],
          data: {
            url: '/',
            scheduledAt: Date.now()
          }
        });
      } catch (err) {
        console.error('[SW] Erro ao disparar notificação agendada:', err);
      }
    }, timeout);
  }

  // Disparo manual imediato de versículo pelo Service Worker
  if (event.data.action === 'triggerDailyVerse') {
    const { verse, isEvening } = getOfflineVerseForCurrentTime();
    const title = isEvening 
      ? `Versículo da Noite - ${verse.reference}`
      : `Versículo do Dia - ${verse.reference}`;
    
    self.registration.showNotification(title, {
      body: verse.text,
      icon: '/icons/logo2.png',
      badge: '/apple-touch-icon.png',
      tag: `biblia-daily-${isEvening ? 'evening' : 'morning'}-${Date.now()}`,
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: '/', verse }
    }).catch((err) => console.warn('[SW] Erro ao disparar versículo:', err));
  }
});

// Periodic Background Sync: acordado pelo navegador mesmo com app/aba fechados!
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'biblia-daily-verse' || event.tag === 'biblia-notifications') {
    console.log('[SW] Periodic Background Sync ativado:', event.tag);
    event.waitUntil(
      (async () => {
        try {
          const { verse, isEvening } = getOfflineVerseForCurrentTime();
          const title = isEvening 
            ? `Versículo da Noite - ${verse.reference}` 
            : `Versículo do Dia - ${verse.reference}`;

          await self.registration.showNotification(title, {
            body: verse.text,
            icon: '/icons/logo2.png',
            badge: '/apple-touch-icon.png',
            tag: `biblia-daily-${isEvening ? 'evening' : 'morning'}`,
            renotify: true,
            vibrate: [200, 100, 200],
            data: { url: '/', verse }
          });
        } catch (err) {
          console.warn('[SW] Erro no periodicSync:', err);
        }
      })()
    );
  }
});

// Push Event: Web Push remoto em segundo plano (OneSignal ou Servidor Push padrão)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  // Se o OneSignalSDK já estiver manipulando o evento, evita duplicação
  try {
    const rawData = event.data.text();
    // OneSignal pushes costumam conter objetos com `custom.i`
    if (rawData.includes('"custom"') && rawData.includes('"i"')) {
      return; // Deixa o SDK nativo do OneSignal gerenciar
    }

    let payload = null;
    try {
      payload = JSON.parse(rawData);
    } catch {
      payload = { title: 'Bíblia Online', body: rawData };
    }

    const title = payload.title || 'Bíblia Online';
    const body = payload.body || payload.text || 'Você tem uma nova mensagem bíblica.';

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: payload.icon || '/icons/logo2.png',
        badge: '/apple-touch-icon.png',
        tag: payload.tag || `biblia-push-${Date.now()}`,
        renotify: true,
        vibrate: [200, 100, 200],
        data: { url: payload.url || '/' }
      })
    );
  } catch (err) {
    console.warn('[SW] Erro no push handler:', err);
  }
});

// Notification Click Event: Abre ou foca a janela da Bíblia Online quando o usuário clica
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Pre-caching static assets and offline Bible database...');
      
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`[SW] Static asset failed to cache: ${asset}`, err);
        }
      }

      // Pre-cache local Bible database first, remote as fallback
      try {
        await cache.add('/data/biblia-livre.json');
      } catch (e) {
        try {
          await cache.add(new Request(BIBLE_DATA_URL, { mode: 'cors' }));
        } catch (err) {
          console.warn('[SW] Remote Bible cache failed:', err);
        }
      }

      return self.skipWaiting();
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== 'biblia-offline-data' && !cacheName.includes('offline-data')) {
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
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Critical: All cross-origin requests (Google user avatars, Supabase APIs, external CDNs, etc.)
  // must bypass the Service Worker completely so they are handled natively by the browser without CSP connect-src issues.
  if (url.origin !== self.location.origin && event.request.url !== BIBLE_DATA_URL) {
    return;
  }

  // Intercept Bible database request and return cached version
  if (url.pathname.includes('biblia-livre.json') || event.request.url === BIBLE_DATA_URL) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(async () => {
          const fallback = await caches.match('/data/biblia-livre.json');
          if (fallback) return fallback;
          return new Response(JSON.stringify({ error: "Offline - Dados bíblicos indisponíveis" }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
    );
    return;
  }

  // Skip AI endpoints, socket, and dev server internal requests
  if (
    url.pathname.startsWith('/api/ai') ||
    url.pathname.startsWith('/api/generate-image') ||
    url.pathname.startsWith('/socket.io') ||
    (url.host.includes('localhost') && url.port === '3000' && url.pathname.startsWith('/@'))
  ) {
    return;
  }

  // Cache-First with Network Background Revalidation for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
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
          }).catch(() => {});
        }
        return cachedResponse;
      }

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
        // Return 404 for failed image requests so the browser and React <img onError> can trigger fallbacks properly
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('image')) {
          return new Response('Imagem não encontrada', {
            status: 404,
            statusText: 'Not Found',
            headers: { 'Content-Type': 'text/plain' }
          });
        }
        return new Response('Offline / Erro de Rede', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});
