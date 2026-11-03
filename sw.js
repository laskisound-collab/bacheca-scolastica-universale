 const CACHE_NAME = 'bacheca-store-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Fase di installazione: mette in cache i file locali essenziali
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache aperta');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Attivazione: pulisce le vecchie cache obsolete
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminazione vecchia cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Gestione delle richieste (Strategia Cache-First con fallback di rete)
self.addEventListener('fetch', (e) => {
  // Ignora le richieste non GET (es. Firebase Realtime Database o chiamate esterne complesse)
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Restituisce la risorsa dalla cache e in parallelo aggiorna dalla rete
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Se non è in cache, lo scarica dalla rete e lo serve
      return fetch(e.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
        // Fallback offline generico se necessario
      });
    })
  );
});
