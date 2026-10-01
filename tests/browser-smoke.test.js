"use strict";
const fs = require("node:fs");
const path = require("node:path");
const {JSDOM} = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dom = new JSDOM(html, {url:"https://example.test/signalencheck/", runScripts:"outside-only", pretendToBeVisual:true});
const {window} = dom;
const {document} = window;
window.scrollTo = () => {};
window.confirm = () => true;
window.print = () => {};
window.URL.createObjectURL = () => "blob:test";
window.URL.revokeObjectURL = () => {};
Object.defineProperty(window, "isSecureContext", {value:false, configurable:true});

for (const file of ["signals.js", "model.js", "script.js"]) window.eval(fs.readFileSync(path.join(root, file), "utf8"));
document.dispatchEvent(new window.Event("DOMContentLoaded", {bubbles:true}));

function assert(condition, message) { if (!condition) throw new Error(message); }
function click(id) { const el=document.getElementById(id); assert(el,`Element ontbreekt: ${id}`); el.click(); }
function change(id, value) { const el=document.getElementById(id); assert(el,`Veld ontbreekt: ${id}`); el.value=value; el.dispatchEvent(new window.Event("change",{bubbles:true})); }

// 1. Homepage bevat de vier nieuwe tegels en opent één check.
assert(!document.getElementById("homeView").hidden, "Homepage opent niet als eerste scherm");
for (const id of ["openCheckBtn","openCovertBtn","openOverviewBtn","openSettingsBtn"]) assert(document.getElementById(id), "Homepage-tegel ontbreekt: " + id);
click("openCheckBtn");
assert(!document.getElementById("checkView").hidden, "Nieuwe check opent niet");
assert(document.querySelectorAll(".observation-card").length >= 30, "Gecombineerde observatielijst is niet gerenderd");
assert(document.querySelectorAll(".likelihood-card").length === 3, "Drie likelihoodkaarten ontbreken");

// 2. Eén gedeelde waarneming laat meerdere scores stijgen.
const threatCard = document.getElementById("card-obs-threat-violence");
assert(threatCard, "Gedeelde dreiging/dwang-waarneming ontbreekt");
threatCard.querySelector('button[data-status="yes"]').click();
const scoresAfterThreat = [...document.querySelectorAll(".likelihood-card-top strong")].map(el => Number(el.textContent.replace("%","")));
assert(scoresAfterThreat.every(score => score > 0), "Gedeelde waarneming verhoogt niet alle drie likelihoods");

// 3. Beoordeel resterende waarnemingen met Nee en rond check af.
for (const card of document.querySelectorAll(".observation-card")) {
  if (card.dataset.status === "unknown") card.querySelector('button[data-status="no"]').click();
}
assert(document.getElementById("completionProgress").value === 100, "Check is na alle Ja/Nee-antwoorden niet compleet");
change("caseCode", "OOV-TEST-001");
change("location", "Testlocatie");
click("saveCheckBtn");
assert(JSON.parse(window.localStorage.getItem("signalencheck:history:v4") || "[]").length === 1, "Afgeronde check niet lokaal opgeslagen");
click("openOverviewBtn");
assert(!document.getElementById("overviewView").hidden, "Overzicht opent niet");
assert(document.querySelectorAll(".history-card").length === 1, "Opgeslagen check niet zichtbaar in overzicht");

// 4. Instellingen wijzigen thema en in-appmelding.
click("openSettingsBtn");
change("themeSetting", "dark");
assert(document.documentElement.dataset.theme === "dark", "Donker thema wordt niet toegepast");
const inApp = document.getElementById("inAppSetting");
inApp.checked = false;
inApp.dispatchEvent(new window.Event("change",{bubbles:true}));
const savedSettings = JSON.parse(window.localStorage.getItem("signalencheck:settings:v4") || "{}");
assert(savedSettings.theme === "dark" && savedSettings.inApp === false, "Instellingen worden niet bewaard");

// 5. Heimelijke waarneming heeft nieuwe velden en verschijnt in rapport.
click("openCovertBtn");
assert(!document.getElementById("covertView").hidden, "Heimelijke waarneming opent niet");
change("covertFootfall", "yes");
change("covertThirdPartyControl", "yes");
change("covertExchange", "yes");
change("covertPlateNumbers", "AB-12-CD");
change("covertArrivals", "20:14 aankomst; 20:39 vertrek");
click("covertToCheckBtn");
click("checkReportBtn");
const report = document.getElementById("reportPreview").textContent;
assert(report.includes("HEIMELIJKE WAARNEMING"), "Heimelijke waarneming ontbreekt in rapport");
assert(report.includes("AB-12-CD"), "Kenteken ontbreekt in rapport");
assert(report.includes("INDICATIEVE LIKELIHOOD"), "Likelihood ontbreekt in rapport");
assert(!report.includes("Loonstrook gezien"), "Nee-waarneming wordt onterecht gerapporteerd");

// 6. Nieuwe check reset invoer maar niet geschiedenis/instellingen.
click("newCheckBtn");
assert(document.getElementById("summaryYes").textContent === "0", "Nieuwe check wist Ja-antwoorden niet");
assert(JSON.parse(window.localStorage.getItem("signalencheck:history:v4") || "[]").length === 1, "Nieuwe check wist geschiedenis");
assert(document.documentElement.dataset.theme === "dark", "Nieuwe check wist thema-instelling");

console.log("Browser-smoketest geslaagd: één checklist, multi-domain likelihood, overzicht, instellingen, heimelijke waarneming, rapportage en reset.");
