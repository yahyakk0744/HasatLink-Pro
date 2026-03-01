const CACHE_NAME = 'hasatlink-v3';

// Install — minimal, just activate immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate — clean all old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — always network-first, show offline message if no network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests — let them fail naturally so the app can show errors
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests — network only, offline fallback page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HasatLink - Çevrimdışı</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #FAFAF8; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .container { text-align: center; max-width: 400px; }
    .icon { width: 80px; height: 80px; margin: 0 auto 24px; background: #2D6A4F; border-radius: 20px; display: flex; align-items: center; justify-content: center; }
    .icon svg { width: 40px; height: 40px; color: white; }
    h1 { font-size: 24px; font-weight: 700; color: #1A1A1A; margin-bottom: 8px; }
    p { font-size: 14px; color: #6B6560; line-height: 1.6; margin-bottom: 24px; }
    button { padding: 14px 32px; background: #2D6A4F; color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
    button:active { transform: scale(0.98); }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/>
        <path d="M5 12.55a10.94 10.94 0 015.17-2.39"/>
        <path d="M10.71 5.05A16 16 0 0122.56 9"/>
        <path d="M1.42 9a15.91 15.91 0 014.7-2.88"/>
        <path d="M8.53 16.11a6 6 0 016.95 0"/>
        <line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
    </div>
    <h1>İnternet Bağlantınız Yok</h1>
    <p>HasatLink'e erişmek için aktif bir internet bağlantısı gereklidir. Lütfen bağlantınızı kontrol edip tekrar deneyin.</p>
    <button onclick="location.reload()">Tekrar Dene</button>
  </div>
</body>
</html>`,
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })
    );
    return;
  }

  // All other requests (JS, CSS, images) — network-first, no cache fallback
  event.respondWith(
    fetch(request).catch(() => {
      return new Response('', { status: 503 });
    })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'HasatLink', body: 'Yeni bildiriminiz var!', icon: '/icons/icon.svg', url: '/' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon.svg',
      badge: '/icons/icon.svg',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'Aç' },
        { action: 'dismiss', title: 'Kapat' },
      ],
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
