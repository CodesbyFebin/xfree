/* XFree Home — service worker
 * Cache-first strategy for the static shell.
 * Bounded cache, versioned, fails silently on quota errors.
 */

const CACHE = "xfree-home-v1";
const PRECACHE = [
  "/home/",
  "/home/index.html",
  "/home/styles.css",
  "/home/app.js",
  "/home/manifest.json",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE).catch(function () {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request)
        .then(function (response) {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(request, copy).catch(function () {});
          });
          return response;
        })
        .catch(function () {
          if (request.mode === "navigate") {
            return caches.match("/home/index.html");
          }
          return new Response("", { status: 504, statusText: "Offline" });
        });
    })
  );
});
