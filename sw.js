// Ruach Billard — Service Worker
// Version: incrémente ce numéro à chaque déploiement pour forcer le rafraîchissement
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'ruach-billard-' + CACHE_VERSION;

// Fichiers à mettre en cache immédiatement à l'installation
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ===== INSTALLATION =====
self.addEventListener('install', function(event) {
  console.log('[SW] Installation cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ===== ACTIVATION =====
self.addEventListener('activate', function(event) {
  console.log('[SW] Activation, suppression anciens caches');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name.startsWith('ruach-billard-') && name !== CACHE_NAME;
        }).map(function(name) {
          console.log('[SW] Suppression cache obsolète:', name);
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ===== STRATÉGIE DE CACHE =====
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Ignore les requêtes non-GET
  if (event.request.method !== 'GET') return;

  // Domaines autorisés à être mis en cache
  var isSameOrigin = url.origin === location.origin;
  var isFonts = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');
  var isIbb = url.hostname.includes('i.ibb.co');
  // ✅ Cloudflare Images (imagedelivery.net)
  var isCfImages = url.hostname.includes('imagedelivery.net');

  if (!isSameOrigin && !isFonts && !isIbb && !isCfImages) return;

  // --- Cloudflare Images : cache-first, longue durée ---
  // Cloudflare sert déjà les images via son CDN, mais on les met aussi en cache
  // local pour le mode offline et la vitesse maximale.
  if (isCfImages) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            var toCache = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, toCache);
            });
          }
          return response;
        }).catch(function() {
          return new Response('', { status: 503 });
        });
      })
    );
    return;
  }

  // --- Images ibb.co : cache-first ---
  if (isIbb) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            var toCache = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, toCache);
            });
          }
          return response;
        }).catch(function() {
          return new Response('', { status: 503 });
        });
      })
    );
    return;
  }

  // --- Polices Google : cache-first (changent rarement) ---
  if (isFonts) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            var toCache = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, toCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // --- index.html : Network-first (version fraîche toujours prioritaire) ---
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var toCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, toCache);
          });
        }
        return response;
      }).catch(function() {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // --- Tous les autres fichiers locaux : cache-first ---
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var toCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, toCache);
          });
        }
        return response;
      }).catch(function() {
        return caches.match('/index.html');
      });
    })
  );
});

// ===== MESSAGE DE MISE À JOUR =====
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
