/* Regressiecontrole met een minimale DOM-double; geen echte browser-/toesteltest. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const M = require("../model.js");
const catalog = require("../signals.js");
const assert = (value, message) => { if (!value) throw new Error(message); };
const nodes = new Map();
class Element {
  constructor(tag = "div") {
    this.tagName = tag; this.children = []; this.events = {}; this.dataset = {};
    this.value = ""; this.checked = false; this.type = ""; this.textContent = ""; this.hidden = false;
    this.classList = {toggle() {}};
  }
  set id(value) { this._id = value; nodes.set(value, this); }
  get id() { return this._id; }
  appendChild(el) { this.children.push(el); return el; }
  append(...els) { this.children.push(...els); }
  replaceChildren(...els) { this.children = els; }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, fn) { (this.events[name] ||= []).push(fn); }
  dispatch(name) { for (const fn of this.events[name] || []) fn({preventDefault() {}}); }
  focus() { this.focused = true; }
  click() { this.dispatch("click"); }
  remove() {}
}
const context = Object.keys(M.createState(catalog).context).map(key => {
  const el = new Element("input"); el.id = key; el.dataset.context = key;
  if (key === "trainingConfirmed") el.type = "checkbox";
  return el;
});
const listeners = {};
const document = {
  body: new Element("body"),
  getElementById(id) {
    if (!nodes.has(id)) { const el = new Element(); el.id = id; }
    return nodes.get(id);
  },
  createElement(tag) { return new Element(tag); },
  querySelectorAll(selector) { return selector === "[data-context]" ? context : []; },
  addEventListener(name, fn) { listeners[name] = fn; }
};
const winEvents = {};
const downloads = [];
const window = {
  SignalenModel: M, APP_SIGNALS: catalog, isSecureContext: false,
  addEventListener(name, fn) { winEvents[name] = fn; },
  confirm() { return true; }, setTimeout(fn) { fn(); },
  print() { if (winEvents.beforeprint) winEvents.beforeprint(); this.printed = true; }
};
const navigator = {onLine: true};
class BlobDouble { constructor(parts) { this.text = parts.join(""); } }
const URLDouble = {createObjectURL(blob) { downloads.push(blob.text); return "blob:test"; }, revokeObjectURL() {}};
const code = fs.readFileSync(path.join(__dirname, "../script.js"), "utf8");
new Function("window", "document", "navigator", "Blob", "URL", code)(window, document, navigator, BlobDouble, URLDouble);
listeners.DOMContentLoaded();
const $ = id => document.getElementById(id);
function answer(id, value) { $(id).value = value; $(id).dispatch("change"); }
$("trainingConfirmed").checked = true; $("trainingConfirmed").dispatch("change");
answer("arbeid-specific-5", "seen");
$("arbeid-specific-5-note").value = "Fictieve bron A"; $("arbeid-specific-5-note").dispatch("input");
$("formButtons").children[1].click();
answer("seksueel-specific-4", "seen");
$("formButtons").children[0].click();
assert($("arbeid-specific-5").value === "seen" && $("arbeid-specific-5-note").value === "Fictieve bron A", "Wisselen verliest invoer");
$("formButtons").children[0].click();
assert($("arbeid-specific-5").value === "seen", "Actieve vorm opnieuw kiezen wist invoer");
$("buildReportBtn").click();
assert($("reportPreview").textContent.includes("Waargenomen: 2"), "Vormen niet samengevoegd");
answer("arbeid-specific-5", "notSeen");
assert($("reportPreview").textContent.includes("Invoer gewijzigd"), "Oud rapport blijft zichtbaar");
$("downloadTextBtn").click();
assert(downloads.length === 1 && downloads[0].includes("Waargenomen: 1; niet waargenomen: 1"), "Export gebruikt oud resultaat");
$("findings").value = "<img src=x onerror=alert(1)>"; $("findings").dispatch("input");
$("printBtn").click();
assert(window.printed && $("reportPreview").textContent.includes("<img src=x onerror=alert(1)>"), "Print gebruikt geen actuele tekstinhoud");
assert(!$("reportPreview").innerHTML, "Rapport gebruikt HTML-injectie");
$("acuteConcern").value = "yes"; $("acuteConcern").dispatch("change");
assert(!$("acuteNotice").hidden, "Acute waarschuwing ontbreekt");
$("controlType").value = "Bedrijfscontrole"; $("controlType").dispatch("change");
$("locationType").value = "Horeca"; $("locationType").dispatch("change");
window.confirm = () => false; $("resetBtn").click();
assert($("controlType").value === "Bedrijfscontrole", "Annuleren reset werkt niet");
window.confirm = () => true; $("resetBtn").click();
assert($("controlType").value === "" && $("locationType").value === "" && !$("trainingConfirmed").checked, "Reset onvolledig");
assert($("arbeid-specific-5").value === "unknown" && $("arbeid-specific-5-note").value === "", "Reset laat signaalgegevens staan");
$("downloadTextBtn").click();
assert(downloads.length === 1, "Export zonder bevestiging");
console.log("UI-regressies geslaagd: wisselen, meerdere vormen, actuele export/print, tekstveiligheid, acute waarschuwing, annuleren en volledige reset.");

$("reviewRole").value = "Fictieve beoordelaarsrol"; $("reviewRole").dispatch("input");
$("followUpBy").value = "2026-10-01T10:00"; $("followUpBy").dispatch("input");
$("statements").value = "Fictieve verklaring"; $("statements").dispatch("input");
$("routeQuestions").value = "Registratielocatie afstemmen"; $("routeQuestions").dispatch("input");
$("trainingConfirmed").checked = true; $("trainingConfirmed").dispatch("change");
$("downloadTextBtn").click();
assert(downloads[1].includes("Fictieve verklaring") && downloads[1].includes("Fictieve beoordelaarsrol"), "Nieuwe velden niet geëxporteerd");
assert(downloads[1].includes("nog niet bevestigd") && downloads[1].includes("geen melding, taaktoewijzing"), "Onterechte bevestiging meldroute");
assert($("reviewPoints").children.some(el => el.textContent.includes("lokale registratie- en meldroute")), "Route ontbreekt op scherm");
$("resetBtn").click();
assert($("reviewRole").value === "" && $("followUpBy").value === "" && $("statements").value === "" && $("routeQuestions").value === "", "Nieuwe velden niet gereset");
console.log("Vervolgcontroles geslaagd: ontbrekende route, gescheiden verklaring, voorgestelde opvolging, export en reset.");
