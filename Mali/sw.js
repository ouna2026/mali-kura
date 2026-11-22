const CACHE_NAME = "mali-kura-v1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./mnfest.json",
    "./version.json",
    "./griot.jpg",
    "./logo.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => { return cache.addAll(FILES_TO_CACHE); })
            .then(() => { return self.skipWaiting(); })
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) { return caches.delete(key); }
                })
            );
        }).then(() => { return self.clients.claim(); })
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") { return; }
    if (event.request.url.includes("version.json")) {
        event.respondWith(fetch(event.request));
        return;
    }
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) { return cachedResponse; }
            return fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => { cache.put(event.request, responseToCache); });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    if (event.request.destination === "document") { return caches.match("./index.html"); }
                });
        })
    );
});