// public/sw.js
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Bíblia Online';
    const options = {
      body: data.body,
      icon: '/icons/icon-any-192.png',
      badge: '/icons/apple-touch-icon.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('Erro ao processar notificação push:', err);
  }
});

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'TEST_NOTIFICATION') {
    const options = {
      body: 'Sua notificação de teste da Bíblia Online foi enviada com sucesso! 🔔',
      icon: '/icons/icon-any-192.png',
      badge: '/icons/apple-touch-icon.png',
      vibrate: [200, 100, 200],
      data: {
        url: '/'
      }
    };
    self.registration.showNotification('Teste de Notificação 🔔', options);
  } else if (event.data.type === 'APP_OPENED') {
    console.log('App opened event received by Service Worker');
  } else if (event.data.type === 'CACHE_OFFLINE') {
    console.log('Cache offline event received by Service Worker');
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

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
