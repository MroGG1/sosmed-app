const CACHE_NAME_APP_SHELL = "sosmed-appshell-v5";
const CACHE_NAME_DYNAMIC_CONTENT = "sosmed-dynamic-v4";
const DICODING_API_ORIGIN = "https://story-api.dicoding.dev";

const APP_SHELL_URLS = [
  "/index.html",
  "/favicon.png",
  "/manifest.json",
  "/images/icons/icon-72x72.png",
  "/images/icons/icon-144x144.png",
  "/images/icons/icon-192x192.png",
  "/images/icons/icon-512x512.png",
];

const OFFLINE_FALLBACK_PAGE = "/offline.html";

self.addEventListener("install", (event) => {
  console.log(
    `[SW] Install Event - Caching App Shell: ${CACHE_NAME_APP_SHELL}`
  );
  event.waitUntil(
    caches
      .open(CACHE_NAME_APP_SHELL)
      .then((cache) => {
        console.log("[SW] Opened App Shell cache:", CACHE_NAME_APP_SHELL);
        const requestsToCache = APP_SHELL_URLS.map(
          (url) => new Request(url, { cache: "reload" })
        );
        if (
          !APP_SHELL_URLS.includes("/") &&
          APP_SHELL_URLS.includes("/index.html")
        ) {
          requestsToCache.push(new Request("/", { cache: "reload" }));
        }

        return cache
          .addAll(requestsToCache)
          .then(() => console.log("[SW] App Shell assets cached successfully."))
          .catch((error) => {
            console.error(
              "[SW] Failed to cache some App Shell assets. Ensure all paths in APP_SHELL_URLS are correct and accessible relative to the root of your deployment (dist/).",
              error
            );
          });
      })
      .catch((error) => {
        console.error(
          "[SW] Failed to open App Shell cache during install:",
          error
        );
      })
  );
});

self.addEventListener("activate", (event) => {
  console.log(
    `[SW] Activate Event - Current Cache: AppShell=${CACHE_NAME_APP_SHELL}, Dynamic=${CACHE_NAME_DYNAMIC_CONTENT}`
  );
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME_APP_SHELL &&
              cacheName.startsWith("sosmed-appshell-")
            ) {
              console.log("[SW] Removing old App Shell cache:", cacheName);
              return caches.delete(cacheName);
            }
            if (
              cacheName !== CACHE_NAME_DYNAMIC_CONTENT &&
              cacheName.startsWith("sosmed-dynamic-")
            ) {
              console.log(
                "[SW] Removing old Dynamic Content cache:",
                cacheName
              );
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[SW] Clients claimed.");
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.ok &&
            requestUrl.pathname !== "/"
          ) {
            const responseToCache = networkResponse.clone();
            caches
              .open(CACHE_NAME_DYNAMIC_CONTENT)
              .then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          console.log(
            `[SW] Navigate failed for ${request.url}, serving /index.html from App Shell cache.`
          );
          return caches
            .match("/index.html", { cacheName: CACHE_NAME_APP_SHELL })
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }

              console.error(
                "[SW] CRITICAL: /index.html not found in App Shell cache for navigation fallback."
              );
              return new Response(
                "<h1>Aplikasi tidak dapat dimuat saat offline.</h1><p>Silakan periksa koneksi internet Anda.</p>",
                {
                  headers: { "Content-Type": "text/html" },
                }
              );
            });
        })
    );
    return;
  }

  if (APP_SHELL_URLS.includes(requestUrl.pathname)) {
    event.respondWith(
      caches
        .match(request, { cacheName: CACHE_NAME_APP_SHELL })
        .then((cachedResponse) => {
          return (
            cachedResponse ||
            fetch(request).then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                const responseToCache = networkResponse.clone();
                caches
                  .open(CACHE_NAME_APP_SHELL)
                  .then((cache) => cache.put(request, responseToCache));
              }
              return networkResponse;
            })
          );
        })
    );
    return;
  }

  if (requestUrl.origin === DICODING_API_ORIGIN) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME_DYNAMIC_CONTENT).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches
            .match(request, { cacheName: CACHE_NAME_DYNAMIC_CONTENT })
            .then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;

              return new Response(
                JSON.stringify({
                  error: true,
                  message:
                    "Anda sedang offline dan data ini tidak tersedia di cache.",
                }),
                {
                  headers: { "Content-Type": "application/json" },
                  status: 503,
                  statusText: "Service Unavailable",
                }
              );
            });
        })
    );
    return;
  }

  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      caches
        .match(request, { cacheName: CACHE_NAME_DYNAMIC_CONTENT })
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME_DYNAMIC_CONTENT).then((cache) => {
                  cache.put(request, responseToCache);
                });
              }
              return networkResponse;
            })
            .catch((error) => {
              console.warn(
                "[SW] Failed to fetch static asset from network and not in cache:",
                request.url,
                error
              );
            });
        })
    );
    return;
  }
});

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received.");
  let pushData;
  try {
    pushData = event.data.json();
  } catch (e) {
    pushData = {
      title: "Sosmed Notification",
      options: { body: event.data.text() },
    };
  }
  const title = pushData.title || "Sosmed App";
  const options = {
    body: pushData.options.body || "Anda memiliki pesan baru.",
    icon: "images/icons/icon-192x192.png",
    badge: "images/icons/icon-72x72.png",
    data: pushData.options.data || { url: "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click Received.");
  event.notification.close();
  const targetUrl =
    event.notification.data && event.notification.data.url
      ? self.location.origin + event.notification.data.url
      : self.location.origin + "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          const clientPath =
            new URL(client.url).pathname +
            new URL(client.url).search +
            new URL(client.url).hash;
          const targetPath =
            new URL(targetUrl).pathname +
            new URL(targetUrl).search +
            new URL(targetUrl).hash;

          if (clientPath === targetPath && "focus" in client) {
            return client.focus();
          }
          if (
            targetPath === self.location.origin + "/" &&
            client.url.startsWith(self.location.origin) &&
            "focus" in client
          ) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
