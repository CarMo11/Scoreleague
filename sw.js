/* sw.js – ScoreLeague */

const CACHE_NAME   = 'scoreleague-v1.0.3';
const OFFLINE_SHELL = '/multiuser_client.html';
const ICON_192     = '/icons/icon-192x192.png';
const ICON_72      = '/icons/icon-72x72.png';

const urlsToCache = [
  '/styles.css',
  '/auth-styles.css',
  '/enhanced-betting-styles.css',
  '/manifest.json',
  OFFLINE_SHELL,
  ICON_192,
  ICON_72
];

/* ---------- Install: pre-cache & take control fast ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((err) => console.log('ScoreLeague: Cache install failed', err))
  );
  self.skipWaiting();
});

/* ---------- Activate: cleanup & claim ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : undefined)))
    )
  );
  self.clients.claim();
});

/* ---------- Fetch: API bypass, non-GET passthrough, then strategies ---------- */
self.addEventListener('fetch', (event) => {
  // 1) Skip cross-origin
  if (!event.request.url.startsWith(self.location.origin)) return;

  // 2a) Same-origin API → always fresh (no cache)
  const urlObj = new URL(event.request.url);
  if (urlObj.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  // 2b) Never cache or handle non-GET requests
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // 3) HTML/documents → Network-First (with Offline Shell fallback)
  const isDocument =
    event.request.mode === 'navigate' || event.request.destination === 'document';

  if (isDocument) {
    event.respondWith(
      fetch(event.request)
        .then((netRes) => {
          if (netRes && netRes.status === 200) {
            const clone = netRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return netRes;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_SHELL))
        )
    );
    return;
  }

  // 4) Assets (CSS/JS/Images/Fonts) → Cache-First
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((netRes) => {
          if (netRes && netRes.status === 200) {
            const clone = netRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return netRes;
        })
        .catch((err) => {
          console.log('ScoreLeague: Network fetch failed:', err);
          return new Response('Offline - resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
    })
  );
});

/* ---------- Background Sync: pending bets via IndexedDB ---------- */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-bets') {
    event.waitUntil(syncBets());
  }
});

// Minimal IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const req = self.indexedDB.open('sl-store', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('pendingBets')) {
        db.createObjectStore('pendingBets', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGetAll(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const st = tx.objectStore(store);
    const req = st.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function idbClear(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const st = tx.objectStore(store);
    const req = st.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function syncBets() {
  try {
    const pendingBets = await idbGetAll('pendingBets');
    if (!pendingBets.length) return;

    // Example: send to backend when online
    // await fetch('/api/bets/bulk', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(pendingBets),
    // });

    await idbClear('pendingBets');

    if (self.registration?.showNotification) {
      await self.registration.showNotification('ScoreLeague', {
        body: `${pendingBets.length} bet(s) placed successfully!`,
        icon: ICON_192,
        badge: ICON_72,
      });
    }
  } catch (err) {
    console.error('ScoreLeague: Sync failed', err);
  }
}

/* ---------- Push (optional) ---------- */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: ICON_192,
    badge: ICON_72,
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now(), primaryKey: data.primaryKey },
    actions: [
      { action: 'explore', title: 'View Bet', icon: ICON_72 },
      { action: 'close', title: 'Close', icon: ICON_72 },
    ],
  };
  event.waitUntil(self.registration.showNotification('ScoreLeague', options));
});

/* ---------- Notification clicks ---------- */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = '/index_simple.html#mybets'; // adjust if needed

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
        for (const client of clientsArr) {
          if ('focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
    );
  }
});
