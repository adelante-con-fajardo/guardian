const CACHE_NAME = 'cp-fajardo-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap'
];

// Instalar el Service Worker y almacenar recursos en caché
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activar el SW y limpiar cachés antiguas si existen
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Network First, falling back to Cache
// Intenta traer la última versión de internet (para actualizaciones rápidas), si falla, usa el caché.
self.addEventListener('fetch', (e) => {
  // Ignorar peticiones que no sean GET o que vayan a la API de Supabase de manera directa
  if (e.request.method !== 'GET' || e.request.url.includes('supabase.co')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Clonar la respuesta válida al caché
        if (response.status === 200) {
          const cacheCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, cacheCopy));
        }
        return response;
      })
      .catch(() => {
        // Si no hay red, buscar en el caché
        return caches.match(e.request);
      })
  );
});