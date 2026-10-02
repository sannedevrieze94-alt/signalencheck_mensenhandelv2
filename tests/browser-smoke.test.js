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
let printCalls = 0;
window.print = () => { printCalls += 1; };
window.URL.createObjectURL = () => "blob:test";
window.URL.revokeObjectURL = () => {};
Object.defineProperty(window, "isSecureContext", {value:false, configurable:true});

for (const file of ["signals.js", "model.js", "script.js", "categories-v41.js", "report-layout-v46.js"]) window.eval(fs.readFileSync(path.join(root, file), "utf8"));
document.dispatchEvent(new window.Event("DOMContentLoaded", {bubbles:true}));

function assert(condition, message) { if (!condition) throw new Error(message); }
function click(id) { const el=document.getElementById(id); assert(el,`Element ontbreekt: ${id}`); el.click(); }
function change(id, value) { const el=document.getElementById(id); assert(el,`Veld ontbreekt: ${id}`); el.value=value; el.dispatchEvent(new window.Event("change",{bubbles:true})); }

// 1. Homepage en gecombineerde check.
assert(!document.getElementById("homeView").hidden, "Homepage opent niet als eerste scherm");
for (const id of ["openCheckBtn","openCovertBtn","openOverviewBtn","openSettingsBtn"]) assert(document.getElementById(id), "Homepage-tegel ontbreekt: " + id);
click("openCheckBtn");
assert(!document.getElementById("checkView").hidden, "Nieuwe check opent niet");
assert(document.querySelectorAll(".observation-card").length >= 30, "Gecombineerde observatielijst is niet gerenderd");
assert(document.querySelectorAll(".likelihood-card").length === 3, "Drie likelihoodkaarten ontbreken");

// 2. Waarnemingen zijn thematisch gecategoriseerd en likelihood staat onderaan.
const categories = [...document.querySelectorAll(".observation-category")];
assert(categories.length >= 5, "Thematische categorisering ontbreekt");
const categoryTitles = categories.map(group => group.querySelector("h4")?.textContent || "");
for (const title of ["Controle & afhankelijkheid","Dwang, kwetsbaarheid & misleiding","Arbeid & arbeidsvoorwaarden","Sekswerk, inkomsten & seksuele uitbuiting","Criminele inzet & jonge aanwas"]) {
  assert(categoryTitles.includes(title), "Categorie niet gerenderd: " + title);
}
const checkView = document.getElementById("checkView");
const likelihoodPanel = checkView.querySelector(".likelihood-panel");
const actions = checkView.querySelector(".sticky-workflow-actions");
assert(likelihoodPanel.nextElementSibling === actions, "Likelihood-overzicht staat niet onderaan na de waarnemingen");
assert(likelihoodPanel.querySelector(".section-number").textContent === "03", "Likelihood is niet stap 03");

// 3. Eén gedeelde waarneming laat meerdere scores stijgen.
const threatCard = document.getElementById("card-obs-threat-violence");
assert(threatCard, "Gedeelde dreiging/dwang-waarneming ontbreekt");
threatCard.querySelector('button[data-status="yes"]').click();
const scoresAfterThreat = [...document.querySelectorAll(".likelihood-card-top strong")].map(el => Number(el.textContent.replace("%","")));
assert(scoresAfterThreat.every(score => score > 0), "Gedeelde waarneming verhoogt niet alle drie likelihoods");

// 4. Beoordeel resterende waarnemingen met Nee en rond check af.
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

// 5. Instellingen wijzigen thema en in-appmelding.
click("openSettingsBtn");
change("themeSetting", "dark");
assert(document.documentElement.dataset.theme === "dark", "Donker thema wordt niet toegepast");
const inApp = document.getElementById("inAppSetting");
inApp.checked = false;
inApp.dispatchEvent(new window.Event("change",{bubbles:true}));
const savedSettings = JSON.parse(window.localStorage.getItem("signalencheck:settings:v4") || "{}");
assert(savedSettings.theme === "dark" && savedSettings.inApp === false, "Instellingen worden niet bewaard");

// 6. Observatie heeft nieuwe velden en verschijnt in formeel rapport.
click("openCovertBtn");
assert(!document.getElementById("covertView").hidden, "Observatie opent niet");
change("covertFootfall", "yes");
change("covertThirdPartyControl", "yes");
change("covertExchange", "yes");
change("covertPlateNumbers", "AB-12-CD");
change("covertArrivals", "20:14 aankomst; 20:39 vertrek");
click("covertToCheckBtn");
click("checkReportBtn");
const report = document.getElementById("reportPreview").textContent;
assert(report.includes("HEIMELIJKE WAARNEMING"), "Observatie ontbreekt in rapportbron");
assert(report.includes("AB-12-CD"), "Kenteken ontbreekt in rapport");
assert(report.includes("INDICATIEVE LIKELIHOOD"), "Likelihood ontbreekt in rapport");
assert(!report.includes("Loonstrook gezien"), "Nee-waarneming wordt onterecht gerapporteerd");
const formatted = document.getElementById("formattedReport");
assert(formatted, "Dossierwaardige rapportweergave ontbreekt");
assert(formatted.textContent.includes("Rapport van bevindingen"), "Formele rapporttitel ontbreekt");
assert(formatted.textContent.includes("OOV-TEST-001"), "Rapportcode ontbreekt in documentkop");
assert(formatted.querySelector(".report-meta-grid"), "Rapportmetadata ontbreken");
assert(formatted.querySelector(".report-municipality-logo")?.src.includes("Emmen-gemeente-logo.png"), "Echt Gemeente Emmen-logo ontbreekt in rapport");
assert(formatted.querySelector(".report-attachments"), "Bijlagenoverzicht ontbreekt");
assert(formatted.querySelector(".report-print-footer"), "Printfooter/paginanummering ontbreekt");
click("printBtn");
assert(printCalls === 1, "Print/PDF-knop roept printdialoog niet exact één keer aan");

// 7. Nieuwe check reset invoer maar niet geschiedenis/instellingen.
click("newCheckBtn");
assert(document.getElementById("summaryYes").textContent === "0", "Nieuwe check wist Ja-antwoorden niet");
assert(JSON.parse(window.localStorage.getItem("signalencheck:history:v4") || "[]").length === 1, "Nieuwe check wist geschiedenis");
assert(document.documentElement.dataset.theme === "dark", "Nieuwe check wist thema-instelling");

console.log("Browser-smoketest geslaagd: tabs, donker thema, likelihood, observatie, echt Emmen-logo, A4-rapportweergave, Print/PDF en reset.");