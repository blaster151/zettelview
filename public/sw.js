const CACHE_NAME = 'zettelview-v1.0.0';
const STATIC_CACHE = 'zettelview-static-v1.0.0';
const DYNAMIC_CACHE = 'zettelview-dynamic-v1.0.0';
const API_CACHE = 'zettelview-api-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/notes',
  '/api/search',
  '/api/templates',
  '/api/export'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname === '/' || url.pathname === '/index.html') {
    // Handle main page
    event.respondWith(handleMainPage(request));
  } else if (url.pathname.startsWith('/static/') || url.pathname.startsWith('/assets/')) {
    // Handle static assets
    event.respondWith(handleStaticAssets(request));
  } else if (url.pathname.startsWith('/api/')) {
    // Handle API requests
    event.respondWith(handleAPIRequest(request));
  } else {
    // Handle other requests
    event.respondWith(handleOtherRequests(request));
  }
});

// Handle main page requests
async function handleMainPage(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for main page, trying cache');
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fallback to offline page
  return caches.match('/offline.html');
}

// Handle static assets
async function handleStaticAssets(request) {
  try {
    // Try cache first for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache for future use
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
  }

  // Return a default response for missing assets
  return new Response('Asset not found', { status: 404 });
}

// Handle API requests
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first for API requests
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache');
  }

  // Fallback to cache for API requests
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return offline data for API requests
  return getOfflineData(url.pathname);
}

// Handle other requests
async function handleOtherRequests(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed, trying cache');
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return 404 for uncached requests
  return new Response('Not found', { status: 404 });
}

// Get offline data for API endpoints
function getOfflineData(pathname) {
  const offlineData = {
    '/api/notes': {
      notes: [],
      message: 'Offline mode - showing cached notes'
    },
    '/api/search': {
      results: [],
      message: 'Offline mode - search not available'
    },
    '/api/templates': {
      templates: [
        {
          id: 'offline-template',
          name: 'Offline Template',
          description: 'Basic template available offline',
          content: '# Offline Note\n\nThis note was created while offline.\n\n## Content\n\n[Your content here]',
          category: 'basic'
        }
      ],
      message: 'Offline mode - limited templates available'
    },
    '/api/export': {
      success: false,
      message: 'Export not available offline'
    }
  };

  const data = offlineData[pathname] || { message: 'Offline mode' };
  
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Offline': 'true'
    }
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-notes') {
    event.waitUntil(syncNotes());
  } else if (event.tag === 'background-sync-export') {
    event.waitUntil(syncExports());
  }
});

// Sync notes when back online
async function syncNotes() {
  try {
    // Get pending notes from IndexedDB
    const pendingNotes = await getPendingNotes();
    
    for (const note of pendingNotes) {
      try {
        // Sync to server
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(note)
        });

        if (response.ok) {
          // Remove from pending
          await removePendingNote(note.id);
          console.log('[SW] Synced note:', note.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync note:', note.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync exports when back online
async function syncExports() {
  try {
    // Get pending exports from IndexedDB
    const pendingExports = await getPendingExports();
    
    for (const exportData of pendingExports) {
      try {
        // Process export
        const response = await fetch('/api/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(exportData)
        });

        if (response.ok) {
          // Remove from pending
          await removePendingExport(exportData.id);
          console.log('[SW] Synced export:', exportData.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync export:', exportData.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Export sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from ZettelView',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ZettelView', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// IndexedDB helpers for offline data
async function getPendingNotes() {
  // This would interact with IndexedDB
  // For now, return empty array
  return [];
}

async function removePendingNote(id) {
  // This would remove from IndexedDB
  console.log('[SW] Removed pending note:', id);
}

async function getPendingExports() {
  // This would interact with IndexedDB
  // For now, return empty array
  return [];
}

async function removePendingExport(id) {
  // This would remove from IndexedDB
  console.log('[SW] Removed pending export:', id);
}

// Message handling for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
}); 