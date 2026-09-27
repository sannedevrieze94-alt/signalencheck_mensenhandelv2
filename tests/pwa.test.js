"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = (value, message) => { if (!value) throw new Error(message); };
const source = fs.readFileSync(path.join(__dirname, "../sw.js"), "utf8");
async function run() {
  const events = {}, stored = [], removed = [];
  const scope = "https://example.test/signalencheck/";
  let opened = "";
  const cache = {addAll: async requests => { stored.push(...requests.map(r => r.url)); }, match: async () => ({cached: true})};
  const cachesDouble = {
    open: async name => { opened = name; return cache; },
    keys: async () => ["signalencheck:" + scope + ":old", "signalencheck:https://example.test/other/:old", "other-app"],
    delete: async name => { removed.push(name); }
  };
  const selfDouble = {registration: {scope}, addEventListener: (name, fn) => { events[name] = fn; }};
  const RequestDouble = function (url, options) { this.url = url; this.options = options; };
  new Function("self", "caches", "URL", "Request", "fetch", source)(selfDouble, cachesDouble, URL, RequestDouble, async () => ({network: true}));
  let waiting;
  events.install({waitUntil(promise) { waiting = promise; }}); await waiting;
  assert(stored.length === 11 && stored.every(url => url.startsWith(scope)), "Cache bevat vreemde bronnen");
  assert(opened.includes(scope), "Cache niet geïsoleerd per app");
  events.activate({waitUntil(promise) { waiting = promise; }}); await waiting;
  assert(removed.length === 1 && removed[0] === "signalencheck:" + scope + ":old", "Caches andere app gewist");
  for (const request of [
    {url: scope + "rapport.txt", method: "GET"},
    {url: scope + "index.html?casus=123", method: "GET"},
    {url: scope + "script.js", method: "POST"},
    {url: "https://other.test/script.js", method: "GET"}
  ]) {
    let intercepted = false;
    events.fetch({request, respondWith() { intercepted = true; }});
    assert(!intercepted, "Onbedoeld verzoek onderschept");
  }
  let response;
  events.fetch({request: {url: scope + "script.js", method: "GET"}, respondWith(promise) { response = promise; }});
  assert((await response).cached, "Appbestand niet uit offlinecache");
  console.log("PWA-logica geslaagd: vaste cachelijst, scope-isolatie, beperkte cacheverwijdering en geen rapport-/POST-/externe cache.");
}
module.exports = run();
