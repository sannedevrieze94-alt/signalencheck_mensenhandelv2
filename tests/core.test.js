"use strict";
const M = require("../model.js");
const catalog = require("../signals.js");
let passed = 0;
function assert(value, message) { if (!value) throw new Error(message); }
function test(name, fn) { fn(); passed++; console.log("OK " + name); }

function answerAll(state, status="no") {
  for (const item of M.flatten(catalog)) M.setAnswer(state, item.id, status, "");
}

test("Versie 4 gebruikt één gecombineerde observatielijst zonder algemene signalen", () => {
  assert(M.VERSION === "4.0.0-prototype", "Onjuiste versie");
  assert(Array.isArray(catalog.sections) && catalog.sections.length === 2, "Verkeerde catalogusstructuur");
  assert(catalog.sections.some(section => section.id === "environment"), "Omgevingssignalen ontbreken");
  const ids = M.flatten(catalog).map(item => item.id);
  assert(!ids.some(id => id.includes("general")), "Algemene signalen zijn niet verwijderd");
  assert(ids.length >= 30, "Gecombineerde lijst is onverwacht klein");
});

test("Eén waarneming kan meerdere domeinscores tegelijk verhogen", () => {
  const state = M.createState(catalog);
  M.setAnswer(state, "obs-threat-violence", "yes", "Feitelijk waargenomen");
  const risk = M.likelihood(state, catalog);
  assert(risk.domains.find(d => d.id === "arbeid").score > 0, "Arbeid reageert niet");
  assert(risk.domains.find(d => d.id === "seksueel").score > 0, "Seksueel reageert niet");
  assert(risk.domains.find(d => d.id === "crimineel").score > 0, "Crimineel reageert niet");
});

test("Domeinspecifieke waarneming verhoogt alleen relevante domeinscore", () => {
  const state = M.createState(catalog);
  M.setAnswer(state, "obs-coerced-sex", "yes", "Waarneming");
  const risk = M.likelihood(state, catalog);
  assert(risk.domains.find(d => d.id === "seksueel").score > 0, "Seksuele score blijft nul");
  assert(risk.domains.find(d => d.id === "arbeid").score === 0, "Arbeid stijgt onterecht");
  assert(risk.domains.find(d => d.id === "crimineel").score === 0, "Crimineel stijgt onterecht");
});

test("Omgevingsinformatie telt lichter dan direct kernsignaal", () => {
  const direct = M.createState(catalog);
  M.setAnswer(direct, "obs-underpaid", "yes", "Direct");
  const env = M.createState(catalog);
  M.setAnswer(env, "env-multiple-reports", "yes", "Dossier");
  const directScore = M.likelihood(direct, catalog).domains.find(d => d.id === "arbeid").score;
  const envScore = M.likelihood(env, catalog).domains.find(d => d.id === "arbeid").score;
  assert(directScore > envScore, "Omgevingssignaal weegt niet lichter");
});

test("Completeness wordt pas 100 procent wanneer alle waarnemingen Ja of Nee hebben", () => {
  const state = M.createState(catalog);
  let risk = M.likelihood(state, catalog);
  assert(!risk.complete && risk.completeness === 0, "Nieuwe check onterecht compleet");
  answerAll(state, "no");
  risk = M.likelihood(state, catalog);
  assert(risk.complete && risk.completeness === 100, "Volledig beoordeelde check niet compleet");
  assert(risk.domains.every(d => d.score === 0), "Alle Nee-antwoorden moeten nul geven");
});

test("Rapport noemt alleen Ja-waarnemingen en geen Nee-waarnemingen", () => {
  const state = M.createState(catalog);
  M.setContext(state, "caseCode", "OOV-001");
  M.setContext(state, "observedAt", "2026-10-01T10:15");
  M.setContext(state, "observer", "Testtoezichthouder");
  M.setContext(state, "location", "Locatie A");
  M.setAnswer(state, "obs-threat-violence", "yes", "Bedreiging letterlijk gehoord");
  M.setAnswer(state, "obs-underpaid", "no", "Loonstrook gezien");
  const report = M.reportText(M.createSnapshot(state, catalog, "2026-10-01T10:30:00.000Z"));
  assert(report.includes("zoals bedoeld in artikel 5:11 van de Algemene wet bestuursrecht"), "Formele aanhef toezichthouder ontbreekt");
  assert(report.includes("Bedreiging letterlijk gehoord"), "Ja-waarneming ontbreekt");
  assert(!report.includes("Loonstrook gezien"), "Nee-waarneming wordt uitgeschreven");
  assert(report.includes("SIGNALEN EN BIJZONDERHEDEN"), "Signaalsectie ontbreekt");
  assert(report.includes("SIGNAALBEELD – INTERNE SIGNAALDUIDING"), "Signaalbeeldsectie ontbreekt");
  assert(report.includes("matchscore"), "Matchscore ontbreekt");
  assert(report.includes("geen gevalideerde kansberekening"), "Methodische waarschuwing ontbreekt");
});

test("Heimelijke waarneming neemt alleen positieve of ingevulde observaties op", () => {
  const state = M.createState(catalog);
  M.setContext(state, "covertObservationEnabled", true);
  M.setContext(state, "covertFootfall", "yes");
  M.setContext(state, "covertWebsiteMatch", "no");
  M.setContext(state, "covertPlateNumbers", "AB-12-CD");
  M.setContext(state, "covertThirdPartyControl", "yes");
  const report = M.reportText(M.createSnapshot(state, catalog));
  assert(report.includes("HEIMELIJKE WAARNEMING"), "Observatiesectie ontbreekt");
  assert(report.includes("AB-12-CD"), "Kenteken ontbreekt");
  assert(report.includes("sturing of controle door een derde"), "Derdecontrole ontbreekt");
  assert(!report.includes("advertentiebron vastgesteld"), "Negatieve advertentiebevinding onterecht opgenomen");
});

test("Sterkste signalen worden per domein op gewicht gerangschikt", () => {
  const state = M.createState(catalog);
  M.setAnswer(state, "obs-coerced-sex", "yes", "A");
  M.setAnswer(state, "env-sex-risk-location", "yes", "B");
  const sexual = M.likelihood(state, catalog).domains.find(d => d.id === "seksueel");
  assert(sexual.strongest[0].id === "obs-coerced-sex", "Kernsignaal staat niet boven omgevingssignaal");
});

console.log(passed + " modelcontroles geslaagd.");
