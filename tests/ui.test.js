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
    this.style = {width: "", setProperty(name, value) { this[name] = value; }};
  }
  set id(value) { this._id = value; nodes.set(value, this); }
  get id() { return this._id; }
  appendChild(el) { this.children.push(el); return el; }
  append(...els) { this.children.push(...els); }
  after(el) { document.body.appendChild(el); }
  replaceChildren(...els) { this.children = els; }
  setAttribute(name, value) { this[name] = value; }
  getAttribute(name) { return this[name]; }
  addEventListener(name, fn) { (this.events[name] ||= []).push(fn); }
  dispatch(name) { for (const fn of this.events[name] || []) fn({preventDefault() {}}); }
  focus() { this.focused = true; }
  click() { this.dispatch("click"); }
  remove() {}
}
for (const key of Object.keys(M.createState(catalog).context)) {
  const el = new Element("input"); el.id = key; el.dataset.context = key;
  if (["trainingConfirmed", "covertObservationEnabled"].includes(key)) el.type = "checkbox";
}
const listeners = {};
const document = {
  body: new Element("body"),
  getElementById(id) { if (!nodes.has(id)) { const el = new Element(); el.id = id; } return nodes.get(id); },
  createElement(tag) { return new Element(tag); },
  createTextNode(text) { return {textContent: text}; },
  querySelectorAll(selector) {
    if (selector === "[data-context]") return [...nodes.values()].filter(el => el.dataset && el.dataset.context);
    return [];
  },
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
assert($("riskScore").textContent === "0,5/38,5" && $("riskFill").style.width !== "0%", "Vormspecifieke score niet bijgewerkt");
$("arbeid-specific-5-note").value = "Fictieve bron A"; $("arbeid-specific-5-note").dispatch("input");

$("formButtons").children[1].click();
assert($("riskScore").textContent === "0/38,5", "Dashboard toont niet de actieve vorm");
answer("seksueel-specific-4", "seen");
assert($("riskScore").textContent === "0,5/38,5", "Seksuele vormscore niet bijgewerkt");

$("formButtons").children[0].click();
assert($("arbeid-specific-5").value === "seen" && $("arbeid-specific-5-note").value === "Fictieve bron A", "Wisselen verliest invoer");
$("buildReportBtn").click();
assert($("reportPreview").textContent.includes("ARBEIDSUITBUITING") && $("reportPreview").textContent.includes("SEKSUELE UITBUITING"), "Beoordeelde vormen ontbreken in rapport");
assert(!$("reportPreview").textContent.includes("INTEGRALE SAMENVATTING"), "Totaalscore verschijnt zonder drie beoordeelde vormen");
assert($("reportPreview").textContent.includes("Ik, toezichthouder in dienst van de gemeente Emmen"), "Ambtelijke openingszin ontbreekt");

$("formButtons").children[2].click();
answer("crimineel-specific-1", "notSeen");
$("buildReportBtn").click();
assert($("reportPreview").textContent.includes("INTEGRALE SAMENVATTING"), "Integrale samenvatting ontbreekt bij drie vormen");

$("covertObservationEnabled").checked = true; $("covertObservationEnabled").dispatch("change");
assert(!$("covertFields").hidden, "Heimelijke observatievelden blijven verborgen");
$("covertWebsiteName").value = "Kinky.nl"; $("covertWebsiteName").dispatch("input");
$("covertPlateNumbers").value = "AA-11-BB"; $("covertPlateNumbers").dispatch("input");
$("covertPersonCharacteristics").value = "donkere jas, lang haar"; $("covertPersonCharacteristics").dispatch("input");
$("covertNotes").value = "Fictieve observatie"; $("covertNotes").dispatch("input");
$("buildReportBtn").click();
assert($("reportPreview").textContent.includes("HEIMELIJKE WAARNEMING") && $("reportPreview").textContent.includes("AA-11-BB") && $("reportPreview").textContent.includes("donkere jas"), "Heimelijke waarneming niet volledig gerapporteerd");

answer("arbeid-specific-5", "notSeen");
assert($("reportPreview").textContent.includes("Invoer gewijzigd"), "Oud rapport blijft zichtbaar");
$("downloadTextBtn").click();
assert(downloads.length === 1 && downloads[0].includes("RAPPORTAGE TOEZICHT"), "Export gebruikt geen actuele rapportage");

$("findings").value = "<img src=x onerror=alert(1)>"; $("findings").dispatch("input");
$("printBtn").click();
assert(window.printed && $("reportPreview").textContent.includes("<img src=x onerror=alert(1)>"), "Print gebruikt geen actuele tekstinhoud");
assert(!$("reportPreview").innerHTML, "Rapport gebruikt HTML-injectie");

$("acuteConcern").value = "yes"; $("acuteConcern").dispatch("change");
assert(!$("acuteNotice").hidden, "Acute waarschuwing ontbreekt");
$("controlType").value = "Bedrijfscontrole"; $("controlType").dispatch("change");
window.confirm = () => false; $("resetBtn").click();
assert($("controlType").value === "Bedrijfscontrole", "Annuleren reset werkt niet");
window.confirm = () => true; $("resetBtn").click();
assert($("controlType").value === "" && !$("trainingConfirmed").checked && !$("covertObservationEnabled").checked, "Reset onvolledig");
assert($("arbeid-specific-5").value === "unknown" && $("covertPlateNumbers").value === "", "Reset laat signaal- of observatiegegevens staan");

$("downloadTextBtn").click();
assert(downloads.length === 1, "Export zonder bevestiging");
console.log("UI-regressies geslaagd: vormscores, integrale score bij drie vormen, rapportage, heimelijke waarneming, export/print, veiligheid en reset.");
