/* Cache uitsluitend deze vaste appbestanden, nooit ingevoerde gegevens of rapporten.
 * Verhoog VERSION bij elke release met gewijzigde appbestanden.
 * Geen skipWaiting: een actieve oefensessie wordt niet automatisch vervangen.
 */
"use strict";
const VERSION = "3.4.0-prototype";
const PREFIX = "signalencheck:" + self.registration.scope + ":";
const CACHE = PREFIX + VERSION;
const FILES = ["./", "./index.html", "./styles.css", "./effects.css", "./signals.js", "./model.js", "./script.js", "./manifest.webmanifest", "./icons/icon.svg", "./icons/gemeente-emmen.svg", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];
const URLS = FILES.map(path => new URL(path, self.registration.scope).href);
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(URLS.map(url => new Request(url, {cache: "reload"})))));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || !URLS.includes(event.request.url)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request);
    return cached || fetch(event.request);
  }));
});
