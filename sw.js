/* Cache uitsluitend vaste appbestanden, nooit ingevoerde gegevens, checkgeschiedenis of rapporten. */
"use strict";
const VERSION = "4.6.6-prototype";
const PREFIX = "signalencheck:" + self.registration.scope + ":";
const CACHE = PREFIX + VERSION;
const FILES = ["./", "./index.html", "./styles.css", "./effects.css", "./app-shell-v36.css", "./emmen-theme-v37.css", "./categories-v41.css", "./report-v45.css", "./report-layout-v46.css", "./signals.js", "./model.js", "./script.js", "./categories-v41.js", "./report-layout-v46.js", "./manifest.webmanifest", "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];
const URLS = FILES.map(path => new URL(path, self.registration.scope).href);
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(URLS.map(url => new Request(url, {cache: "reload"})));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || !URLS.includes(event.request.url)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request);
    return cached || fetch(event.request);
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({type:"window", includeUncontrolled:true}).then(windows => {
    const scoped = windows.find(client => client.url.startsWith(self.registration.scope));
    return scoped ? scoped.focus() : clients.openWindow(self.registration.scope);
  }));
});