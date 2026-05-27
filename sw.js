const CACHE_NAME = 'cpv-cache-v1';

// Archivos que la app necesita para funcionar sin internet
const urlsToCache = [
  './index.html', // Asegúrate de que el nombre coincida
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://www.sergiofajardo.com/logos/fajardo-logo.png'
];

// 1. INSTALACIÓN: Guardar los archivos estáticos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Archivos cacheados exitosamente');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 2. ACTIVACIÓN: Limpiar cachés viejas si actualizas la app
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: Interceptar peticiones. Si hay internet, actualiza caché. Si no, usa caché.
self.addEventListener('fetch', event => {
  // Ignorar peticiones a Supabase (API) para que no se cacheen y rompan la autenticación/sincronización
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve el archivo desde la caché si existe
        if (response) {
          return response;
        }
        // Si no está en caché, lo busca en la red
        return fetch(event.request).then(
          function(networkResponse) {
            // No cachear recursos de otros dominios o respuestas erróneas
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            // Clona la respuesta y la guarda en caché para la próxima vez
            var responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        );
      }).catch(() => {
        // Si falla la red y no está en caché (ej. una ruta que no pre-cacheamos)
        console.log('Modo offline total, recurso no encontrado en caché.');
      })
  );
});