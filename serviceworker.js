// ────────────────────────────────────────────────────────────────────
// File: /service-worker.js
// ────────────────────────────────────────────────────────────────────

const CACHE_NAME = 'oosgames';

// On install, skip waiting so it activates immediately
self.addEventListener('install', (evt) => {
  self.skipWaiting();
});

// On activate, take control of uncontrolled clients immediately
self.addEventListener('activate', (evt) => {
  evt.waitUntil(self.clients.claim());
});

// Utility: Given a Response object for HTML, return a new Response
// with all <input value="…"> and <textarea>…</textarea> stripped.
// If you don’t need to strip defaults, just return the original response.
async function stripFormDefaultsIfHTML(response) {
  // Clone the response so we can read+modify it without consuming the original
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/html')) {
    // Not HTML, just return original
    return response;
  }

  // Read the HTML as text
  const text = await response.text();

  // Remove value="…" from <input> and clear out <textarea>…</textarea>
  const stripped = text
    // 1) <input ... value="something" ...> → <input ... >
    .replace(/<input\b([^>]*?)\svalue=['"][^'"]*['"]([^>]*?)>/gi, '<input$1$2>')
    // 2) <textarea ...>some default</textarea> → <textarea ...></textarea>
    .replace(/<textarea\b([^>]*)>[\s\S]*?<\/textarea>/gi, '<textarea$1></textarea>');

  // Return a new Response with exactly the same headers/status, but with stripped HTML
  return new Response(stripped, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}

self.addEventListener('fetch', (evt) => {
  const req = evt.request;

  // If this is a navigation (i.e. HTML page), we fetch from network and strip form values
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    evt.respondWith(
      fetch(req)
        .then((networkResponse) => stripFormDefaultsIfHTML(networkResponse))
        .catch(() => {
          // If offline and the page was previously cached, serve that:
          return caches.match(req).then((cached) => {
            if (cached) return cached;
            // Otherwise, a generic fallback:
            return new Response('Offline and no cached page.', {
              status: 503,
              statusText: 'Offline',
            });
          });
        })
    );
    return;
  }

  // For all other requests (CSS, JS, images, audio, fonts, etc.), serve from cache first, then network
  evt.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        return cached;
      }
      // Not in cache: fetch, put into cache, then return
      return fetch(req).then((networkResponse) => {
        // Only cache GET requests with status 200
        if (req.method === 'GET' && networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, copy);
          });
        }
        return networkResponse;
      }).catch(() => {
        // No network, no cache → fallback
        return new Response('Offline: resource not cached.', {
          status: 503,
          statusText: 'Offline',
        });
      });
    })
  );
});
