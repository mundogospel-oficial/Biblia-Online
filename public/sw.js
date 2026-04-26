const CACHE_NAME = 'biblia-online-v2';

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
  const index = (dayOfYear * 3 + slotIndex) % VERSES.length;
  return VERSES[index];
}

// ── Notification scheduling: 8h, 12h, 20h ──
const NOTIFICATION_HOURS = [8, 12, 20];

const SLOT_TITLES = [
  '📖 Bíblia Online — Bom Dia!',
  '📖 Bíblia Online — Meio-Dia',
  '📖 Bíblia Online — Boa Noite!',
];

// Track if user opened the app today
const LAST_VISIT_KEY = 'bible-last-visit-day';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function msUntilNext() {
  const now = new Date();
  let nearest = Infinity;
  let nearestSlot = 0;

  for (let i = 0; i < NOTIFICATION_HOURS.length; i++) {
    const next = new Date(now);
    next.setHours(NOTIFICATION_HOURS[i], 0, 0, 0);
    if (now >= next) next.setDate(next.getDate() + 1);
    const diff = next.getTime() - now.getTime();
    if (diff < nearest) {
      nearest = diff;
      nearestSlot = i;
    }
  }

  return { ms: nearest, slot: nearestSlot };
}

let scheduledTimer = null;

function scheduleNotification() {
  if (scheduledTimer) clearTimeout(scheduledTimer);
  const { ms, slot } = msUntilNext();
  scheduledTimer = setTimeout(async () => {
    await showNotification(slot);
    scheduleNotification();
  }, ms);

  // Also schedule the "forgot to read" reminder at 21:00
  scheduleReminder();
}

function scheduleReminder() {
  const now = new Date();
  const reminder = new Date(now);
  reminder.setHours(21, 0, 0, 0);
  if (now >= reminder) reminder.setDate(reminder.getDate() + 1);
  const ms = reminder.getTime() - now.getTime();

  setTimeout(async () => {
    // Check if user visited today
    try {
      const allClients = await self.clients.matchAll({ type: 'window' });
      // If no clients are open and we haven't seen user today, send reminder
      if (allClients.length === 0) {
        await self.registration.showNotification('📖 Bíblia Online', {
          body: 'Você esqueceu de ler a Bíblia hoje! Que tal dedicar alguns minutos agora? 🙏',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: 'daily-reminder',
          renotify: true,
          data: { url: '/' },
        });
      }
    } catch (e) {}
    scheduleReminder();
  }, ms);
}

async function showNotification(slotIndex) {
  const verse = getVerseForSlot(slotIndex);
  try {
    await self.registration.showNotification(SLOT_TITLES[slotIndex], {
      body: `"${verse.text}" — ${verse.ref}`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
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
  scheduleNotification();
});

// ── Listen for messages from the app ──
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ENABLE_NOTIFICATIONS') {
    scheduleNotification();
  }
  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    showNotification(0);
  }
  if (event.data && event.data.type === 'APP_OPENED') {
    // User opened the app - tracked for reminder
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

// ── Fetch handler (caching) ──
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/~oauth')) return;
  if (!event.request.url.startsWith('http')) return;

  // Serve offline Bible data from dedicated cache
  if (event.request.url.includes('/data/biblia-livre.json')) {
    event.respondWith(
      caches.open('biblia-offline-data').then((cache) => {
        return cache.match(event.request, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          return fetch(event.request);
        });
      }).catch(() => fetch(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && (
          event.request.url.endsWith('.js') ||
          event.request.url.endsWith('.css') ||
          event.request.url.endsWith('.png') ||
          event.request.url.endsWith('.ico')
        )) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return new Response(
            `<!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
              <title>Sem Conexão</title>
              <style>
                body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; background-color: #121b27; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #3b82f6; }
                p { color: #94a3b8; margin-bottom: 2rem; line-height: 1.5; }
                button { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; }
                button:active { background: #2563eb; }
              </style>
            </head>
            <body>
              <h1>Você está offline 📡</h1>
              <p>Parece que você perdeu a conexão com a internet.<br>Verifique sua rede e tente novamente.</p>
              <button onclick="window.location.reload()">Tentar novamente</button>
            </body>
            </html>`,
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
        return new Response('', { status: 408, statusText: 'Request Timeout' });
      });
    })
  );
});
