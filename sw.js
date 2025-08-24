const CACHE_NAME = 'scoreleague-v1.0.1';
const urlsToCache = [
  '/multiuser_client.html',
  '/styles.css',
  '/auth-styles.css',
  '/enhanced-betting-styles.css',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
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
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          console.log('ScoreLeague: Serving from cache:', event.request.url);
          return response;
        }
        
        // Try to fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Cache successful responses
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(error => {
            console.log('ScoreLeague: Network fetch failed:', error);
            // If both cache and network fail, return offline page for documents
            if (event.request.destination === 'document') {
              return caches.match('/multiuser_client.html');
            }
            // For other resources, return a simple error response
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
    })
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
