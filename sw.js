const CACHE_NAME = 'scoreleague-v1.0.5';
const urlsToCache = [
  '/styles.css',
  '/auth-styles.css',
  '/enhanced-betting-styles.css',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  // Activate updated SW immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('ScoreLeague: Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.log('ScoreLeague: Cache install failed', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Passthrough all non-GET requests directly to the network
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Bypass caching for API requests to avoid stale data
  const urlObj = new URL(event.request.url);
  if (urlObj.origin === self.location.origin && urlObj.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  // Never cache env.js (runtime configuration like window.API_BASE must always be fresh)
  if (urlObj.pathname.endsWith('/env.js')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  // For navigations/HTML documents, use Network-First to avoid stale shells
  const isDocument = event.request.mode === 'navigate' || event.request.destination === 'document';
  if (isDocument) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Cache successful responses for offline fallback
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Fall back to cached version (if any), or a basic offline shell
          return caches.match(event.request).then(cached => cached || caches.match('/multiuser_client.html'));
        })
    );
    return;
  }

  // For other assets (CSS/JS/Images), use Cache-First
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        console.log('ScoreLeague: Serving from cache:', event.request.url);
        return response;
      }
      return fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(error => {
          console.log('ScoreLeague: Network fetch failed:', error);
          return new Response('Offline - resource not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('ScoreLeague: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Background sync for bet placement when back online
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-bets') {
    event.waitUntil(syncBets());
  }
});

async function syncBets() {
  try {
    // Get pending bets from IndexedDB or localStorage
    const pendingBets = JSON.parse(localStorage.getItem('pendingBets') || '[]');
    
    if (pendingBets.length > 0) {
      // Process pending bets when back online
      console.log('ScoreLeague: Syncing pending bets', pendingBets);
      
      // Clear pending bets after successful sync
      localStorage.removeItem('pendingBets');
      
      // Show notification
      self.registration.showNotification('ScoreLeague', {
        body: `${pendingBets.length} bet(s) placed successfully!`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
      });
    }
  } catch (error) {
    console.error('ScoreLeague: Sync failed', error);
  }
}

// Push notifications (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'View Bet',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/icon-72x72.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification('ScoreLeague', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/index_simple.html#mybets')
    );
  }
});
