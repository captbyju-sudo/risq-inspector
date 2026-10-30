// RISQ 3.2 Inspector - offline support. Change VERSION after updating files so devices pick up the new copy.
const VERSION = "risq-10.0.0";
const FILES = ["./", "index.html", "config.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;   // Google Drive, sign-in and AI go straight to the internet
  // the app itself: use the saved copy at once (works offline), refresh it in the background
  e.respondWith(caches.open(VERSION).then(async cache => {
    const key = req.mode === "navigate" ? "index.html" : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    const fresh = fetch(req).then(res => { if (res && res.ok && res.type === "basic") cache.put(key, res.clone()); return res; }).catch(() => null);
    return cached || (await fresh) || new Response("Offline", { status: 503 });
  }));
});
