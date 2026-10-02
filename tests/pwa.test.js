"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = (value, message) => { if (!value) throw new Error(message); };
const source = fs.readFileSync(path.join(__dirname, "../sw.js"), "utf8");

async function run() {
  const events = {}, stored = [], removed = [];
  const scope = "https://example.test/signalencheck/";
  let opened = "";
  let focused = false;
  let skipWaitingCalled = false;
  let claimCalled = false;
  const cache = {addAll: async requests => { stored.push(...requests.map(r => r.url)); }, match: async () => ({cached:true})};
  const cachesDouble = {
    open: async name => { opened = name; return cache; },
    keys: async () => ["signalencheck:" + scope + ":old", "signalencheck:https://example.test/other/:old", "other-app"],
    delete: async name => { removed.push(name); }
  };
  const selfDouble = {
    registration:{scope},
    skipWaiting: async () => { skipWaitingCalled = true; },
    addEventListener:(name,fn) => { events[name]=fn; }
  };
  const clientsDouble = {
    claim: async () => { claimCalled = true; },
    matchAll: async () => [{url:scope + "index.html", focus:async () => { focused=true; }}],
    openWindow: async () => { focused=true; }
  };
  const RequestDouble = function(url, options){ this.url=url; this.options=options; };
  new Function("self","caches","URL","Request","fetch","clients",source)(selfDouble,cachesDouble,URL,RequestDouble,async()=>({network:true}),clientsDouble);

  let waiting;
  events.install({waitUntil(promise){waiting=promise;}}); await waiting;
  assert(stored.length === 19 && stored.every(url => url.startsWith(scope)), "Cache bevat vreemde of ontbrekende appbestanden");
  assert(stored.some(url => url.endsWith("emmen-theme-v37.css")), "Thema ontbreekt in cache");
  assert(stored.some(url => url.endsWith("categories-v41.css")) && stored.some(url => url.endsWith("categories-v41.js")), "Tabinterface ontbreekt in offlinecache");
  assert(stored.some(url => url.endsWith("report-v45.css")), "Rapportagevelden ontbreken in offlinecache");
  assert(stored.some(url => url.endsWith("report-layout-v46.css")) && stored.some(url => url.endsWith("report-layout-v46.js")), "A4-rapportlayout ontbreekt in offlinecache");
  assert(stored.some(url => url.endsWith("signals.js")) && stored.some(url => url.endsWith("model.js")), "Checklogica ontbreekt in cache");
  assert(opened.includes("4.6.1-prototype"), "Cacheversie 4.6.1 ontbreekt");
  assert(skipWaitingCalled, "Nieuwe PWA-versie neemt niet direct de wachtstatus over");

  events.activate({waitUntil(promise){waiting=promise;}}); await waiting;
  assert(removed.length === 1 && removed[0] === "signalencheck:" + scope + ":old", "Caches andere app gewist");
  assert(claimCalled, "Nieuwe service worker claimt geopende app niet");

  for (const request of [
    {url:scope + "rapport.txt",method:"GET"},
    {url:scope + "index.html?casus=123",method:"GET"},
    {url:scope + "script.js",method:"POST"},
    {url:"https://other.test/script.js",method:"GET"}
  ]) {
    let intercepted=false;
    events.fetch({request,respondWith(){intercepted=true;}});
    assert(!intercepted,"Onbedoeld verzoek onderschept");
  }

  let response;
  events.fetch({request:{url:scope + "report-layout-v46.js",method:"GET"},respondWith(promise){response=promise;}});
  assert((await response).cached,"Rapportlayoutscript niet uit offlinecache");

  assert(typeof events.notificationclick === "function", "Meldingklik-handler ontbreekt");
  let notificationWait;
  events.notificationclick({notification:{close(){}},waitUntil(promise){notificationWait=promise;}});
  await notificationWait;
  assert(focused,"Meldingklik opent/focust app niet");

  console.log("PWA-logica geslaagd: versie 4.6.1-cache, directe update-activatie, tabs, rapportage, A4/PDF-layout, offlinebestanden en meldingklik.");
}
run();