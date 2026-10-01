/* Cache uitsluitend vaste appbestanden, nooit ingevoerde gegevens, checkgeschiedenis of rapporten. */
"use strict";
const VERSION = "4.3.0-prototype";
const PREFIX = "signalencheck:" + self.registration.scope + ":";
const CACHE = PREFIX + VERSION;
const FILES = ["./", "./index.html", "./styles.css", "./effects.css", "./app-shell-v36.css", "./emmen-theme-v37.css", "./categories-v41.css", "./signals.js", "./model.js", "./script.js", "./categories-v41.js", "./manifest.webmanifest", "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];
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
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({type:"window", includeUncontrolled:true}).then(windows => {
    const scoped = windows.find(client => client.url.startsWith(self.registration.scope));
    return scoped ? scoped.focus() : clients.openWindow(self.registration.scope);
  }));
});