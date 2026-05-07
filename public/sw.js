const CACHE_NAME = 'biblia-online-v3';

// ── Curated verses (same as dailyVerse.ts) ──
const VERSES = [
  { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", ref: "João 3:16" },
  { text: "O Senhor é o meu pastor; nada me faltará.", ref: "Salmos 23:1" },
  { text: "Posso todas as coisas naquele que me fortalece.", ref: "Filipenses 4:13" },
  { text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.", ref: "Jeremias 29:11" },
  { text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.", ref: "Romanos 8:28" },
  { text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus.", ref: "Isaías 41:10" },
  { text: "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento.", ref: "Provérbios 3:5" },
  { text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", ref: "Mateus 11:28" },
  { text: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.", ref: "Salmos 46:1" },
  { text: "Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus.", ref: "Efésios 2:8" },
  { text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.", ref: "Salmos 119:105" },
  { text: "Mas os que esperam no Senhor renovarão as forças, subirão com asas como águias.", ref: "Isaías 40:31" },
  { text: "Deleita-te também no Senhor, e te concederá os desejos do teu coração.", ref: "Salmos 37:4" },
  { text: "Porque Deus não nos deu o espírito de temor, mas de fortaleza, e de amor, e de moderação.", ref: "2 Timóteo 1:7" },
  { text: "Buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.", ref: "Mateus 6:33" },
  { text: "Deixo-vos a paz, a minha paz vos dou; não se turbe o vosso coração, nem se atemorize.", ref: "João 14:27" },
  { text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.", ref: "Salmos 91:1" },
  { text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", ref: "1 Pedro 5:7" },
  { text: "Torre forte é o nome do Senhor; a ela correrá o justo, e estará em alto refúgio.", ref: "Provérbios 18:10" },
  { text: "Tenho-vos dito isto, para que em mim tenhais paz; no mundo tereis aflições, mas tende bom ânimo, eu venci o mundo.", ref: "João 16:33" },
  { text: "Provai, e vede que o Senhor é bom; bem-aventurado o homem que nele confia.", ref: "Salmos 34:8" },
];

function getVerseForSlot(slotIndex) {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = (dayOfYear * 2 + slotIndex) % VERSES.length;
  return VERSES[index];
}

// ── Notification scheduling: 8h, 20h (As requested) ──
const SLOT_TITLES = [
  '📖 Biblia Online — Bom Dia!',
  '📖 Biblia Online — Versículo Destaque',
];

// Tracking Last Visit via IndexedDB
const DB_NAME = 'biblia-usage-db';
const STORE_NAME = 'usage';
const LAST_VISIT_KEY = 'last-visit';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function updateVisitInDB() {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(Date.now(), LAST_VISIT_KEY);
  } catch (e) {
    console.error("SW: DB Update failed", e);
  }
}

async function getLastVisitFromDB() {
  return new Promise(async (resolve) => {
    try {
      const db = await getDB();
      const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(LAST_VISIT_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

function msUntilNext(hour) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

let notificationTimers = [];

function clearTimers() {
  notificationTimers.forEach(t => clearTimeout(t));
  notificationTimers = [];
}

function scheduleDailyNotifications() {
  clearTimers();
  
  // Morning (8 AM)
  const msMorning = msUntilNext(8);
  notificationTimers.push(setTimeout(() => {
    showNotification(0);
    scheduleDailyNotifications();
  }, msMorning));

  // Evening (8 PM / 20:00)
  const msEvening = msUntilNext(20);
  notificationTimers.push(setTimeout(() => {
    showNotification(1);
    scheduleDailyNotifications();
  }, msEvening));
}

async function checkInactivityAlert() {
  const lastVisit = await getLastVisitFromDB();
  if (lastVisit) {
    const diff = Date.now() - lastVisit;
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    if (diff > oneDayInMs) {
      try {
        await self.registration.showNotification('📖 Biblia Online', {
          body: 'Você esqueceu de ler! Faz mais de um dia. Que tal ler um versículo agora? 🙏',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'inactivity-alert',
          renotify: true,
          data: { url: '/' },
        });
      } catch (e) {}
    }
  }
  
  // Re-check in 6 hours
  setTimeout(checkInactivityAlert, 6 * 60 * 60 * 1000);
}

async function showNotification(slotIndex) {
  const verse = getVerseForSlot(slotIndex);
  try {
    await self.registration.showNotification(SLOT_TITLES[slotIndex], {
      body: `"${verse.text}" — ${verse.ref}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'daily-verse-' + slotIndex,
      renotify: true,
      data: { url: '/' },
    });
  } catch (e) {}
}

// ── Service Worker lifecycle ──
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== 'biblia-offline-data').map(k => caches.delete(k))
      );
    }).then(() => clients.claim())
  );
  scheduleDailyNotifications();
  checkInactivityAlert();
});

// ── Listen for messages from the app ──
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ENABLE_NOTIFICATIONS') {
    scheduleDailyNotifications();
  }
  if (event.data && event.data.type === 'APP_OPENED') {
    updateVisitInDB();
  }
  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    showNotification(0);
  }
  if (event.data && event.data.type === 'CACHE_OFFLINE') {
    // Force cache all assets currently in view
    clients.matchAll().then(clients => {
      clients.forEach(client => {
        const urlSplit = client.url.split('/');
        const path = '/' + urlSplit.slice(3).join('/');
        caches.open(CACHE_NAME).then(cache => cache.add(path));
      });
    });
  }
});

// ── Click handler ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(event.notification.data?.url || '/');
    })
  );
});

// ── Fetch handler (Basic caching) ──
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.ok && (
          event.request.url.endsWith('.js') ||
          event.request.url.endsWith('.css') ||
          event.request.url.endsWith('.png') ||
          event.request.url.endsWith('.ico') ||
          event.request.url.includes('googleusercontent')
        )) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback for offline data if it was explicitly cached in biblia-offline-data
        return caches.match(event.request, { cacheName: 'biblia-offline-data' }).then(offlineData => {
          return offlineData || new Response('Offline', { status: 408 });
        });
      });
    })
  );
});
