"use strict";
const fs = require("node:fs");
const path = require("node:path");
const {JSDOM} = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dom = new JSDOM(html, {
  url: "https://example.test/signalencheck/",
  runScripts: "outside-only",
  pretendToBeVisual: true
});
const {window} = dom;
const {document} = window;

window.scrollTo = () => {};
window.confirm = () => true;
window.print = () => {};
window.URL.createObjectURL = () => "blob:test";
window.URL.revokeObjectURL = () => {};
Object.defineProperty(window, "isSecureContext", {value: false, configurable: true});

for (const file of ["signals.js", "model.js", "script.js"]) {
  window.eval(fs.readFileSync(path.join(root, file), "utf8"));
}
document.dispatchEvent(new window.Event("DOMContentLoaded", {bubbles: true}));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function click(id) {
  const el = document.getElementById(id);
  assert(el, `Element ontbreekt: ${id}`);
  el.click();
}
function change(id, value, checked) {
  const el = document.getElementById(id);
  assert(el, `Veld ontbreekt: ${id}`);
  if (typeof checked === "boolean") el.checked = checked;
  else el.value = value;
  el.dispatchEvent(new window.Event("change", {bubbles: true}));
}

// 1. Homepage en integrale controle
assert(!document.getElementById("homeView").hidden, "Homepage opent niet als eerste scherm");
click("openIntegralBtn");
assert(!document.getElementById("setupView").hidden, "Tegel Integrale controle opent selectiescherm niet");
change("includeGeneral", null, true);
change("includeArbeid", null, true);
click("startIntegralBtn");
assert(!document.getElementById("workflowView").hidden, "Geselecteerde controle opent workflow niet");
assert(!document.getElementById("generalCard").hidden, "Algemeen geselecteerd maar niet zichtbaar");
assert(!document.getElementById("signalsCard").hidden, "Arbeidsuitbuiting geselecteerd maar signalen niet zichtbaar");
assert(document.getElementById("covertCard").hidden, "Heimelijke module verschijnt ten onrechte in integrale controle");
assert(document.getElementById("formButtons").children.length === 1, "Niet-geselecteerde uitbuitingsvormen krijgen toch tabs");

const firstSelect = document.querySelector("#signalsMount select");
assert(firstSelect, "Geen signalen gerenderd voor geselecteerde vorm");
firstSelect.value = "seen";
firstSelect.dispatchEvent(new window.Event("change", {bubbles: true}));
const firstNote = document.querySelector("#signalsMount textarea");
firstNote.value = "Feitelijk waargenomen tijdens controle";
firstNote.dispatchEvent(new window.Event("input", {bubbles: true}));

click("workflowReportBtn");
assert(!document.getElementById("reportView").hidden, "Rapportknop opent rapportage niet");
let report = document.getElementById("reportPreview").textContent;
assert(report.includes("ARBEIDSUITBUITING"), "Geselecteerde vorm ontbreekt in rapportage");
assert(!report.includes("SEKSUELE UITBUITING"), "Niet-geselecteerde seksuele uitbuiting staat in rapportage");
assert(!report.includes("CRIMINELE UITBUITING"), "Niet-geselecteerde criminele uitbuiting staat in rapportage");
assert(report.includes("Feitelijk waargenomen tijdens controle"), "Toelichting bij waargenomen signaal ontbreekt");
assert(!/niet waargenomen/i.test(report), "Rapportage schrijft niet-waargenomen signalen uit");

// 2. Heimelijke waarneming als losse flow
click("homeBtn");
click("openCovertBtn");
assert(!document.getElementById("workflowView").hidden, "Heimelijke tegel opent workflow niet");
assert(!document.getElementById("covertCard").hidden, "Heimelijke waarnemingsvelden zijn niet zichtbaar");
assert(document.getElementById("generalCard").hidden, "Algemene controlevelden blijven zichtbaar in heimelijke flow");
assert(document.getElementById("signalsCard").hidden, "Signalenkaart blijft zichtbaar in heimelijke flow");

change("covertFootfall", "yes");
change("covertPlateNumbers", "AB-12-CD");
change("covertPersonCharacteristics", "Donkere jas, circa 1,80 m");
change("covertNotes", "20:14 uur persoon betreedt locatie; 20:39 uur persoon verlaat locatie.");
click("workflowReportBtn");
report = document.getElementById("reportPreview").textContent;
assert(report.includes("HEIMELIJKE WAARNEMING"), "Heimelijke waarneming ontbreekt in rapportage");
assert(report.includes("AB-12-CD"), "Kenteken ontbreekt in rapportage");
assert(report.includes("Donkere jas"), "Persoonskenmerken ontbreken in rapportage");
assert(!report.includes("onbekend / niet vastgesteld"), "Niet-waargenomen/onbekende heimelijke velden worden uitgeschreven");

// 3. Mobiele/home navigatie en reset
click("homeBtn");
assert(!document.getElementById("homeView").hidden, "Homeknop werkt niet");
click("resetBtn");
assert(document.getElementById("summarySeen").textContent === "0", "Reset wist signalen niet");

console.log("Browser-smoketest geslaagd: homepage, moduleselectie, signalen, heimelijke waarneming, rapportage, navigatie en reset.");
