"use strict";
const M = require("../model.js");
const catalog = require("../signals.js");
let passed = 0;
function assert(value, message) { if (!value) throw new Error(message); }
function test(name, fn) { fn(); passed++; console.log("OK " + name); }

test("Nieuwe sessie selecteert geen modules", () => {
  const state = M.createState(catalog);
  assert(M.VERSION === "3.6.0-prototype", "Onjuiste versie");
  assert(M.selectedFormIds(state.context).length === 0, "Vorm vooraf geselecteerd");
  assert(!state.context.includeGeneral && !state.context.covertObservationEnabled, "Module vooraf geselecteerd");
});

test("Alleen geselecteerde vormen tellen voor de controle", () => {
  const state = M.createState(catalog);
  M.setContext(state, "includeArbeid", true);
  M.setAnswer(state, "arbeid-specific-1", "seen", "Feitelijke waarneming");
  M.setAnswer(state, "seksueel-specific-1", "seen", "Niet geselecteerde vorm");
  const counts = M.counts(state, catalog, true);
  assert(counts.seen === 1, "Niet-geselecteerde vorm meegeteld");
  assert(M.selectedFormIds(state.context).join(",") === "arbeid", "Verkeerde selectie");
});

test("Progressieve score volgt afgesproken voorbeelden", () => {
  assert(M.scoreFromSeen(1) === 0.5, "1 signaal moet 0,5 zijn");
  assert(M.scoreFromSeen(2) === 1.25, "2 signalen moeten 1,25 zijn");
  assert(M.scoreFromSeen(3) === 2.5, "3 signalen moeten 2,5 zijn");
  assert(M.scoreFromSeen(4) === 3.75, "4 signalen moeten 3,75 zijn");
  assert(M.scoreFromSeen(5) === 5.25, "5 signalen moeten 5,25 zijn");
});

test("Rapport noemt alleen waargenomen signalen", () => {
  const state = M.createState(catalog);
  M.setContext(state, "includeArbeid", true);
  M.setContext(state, "caseCode", "OOV-001");
  M.setContext(state, "observedAt", "2026-10-01T10:15");
  M.setContext(state, "location", "Locatie A");
  M.setContext(state, "controlType", "Integrale controle");
  M.setAnswer(state, "arbeid-specific-1", "seen", "Waargenomen op locatie");
  M.setAnswer(state, "arbeid-specific-2", "notSeen", "Onderzocht maar niet gezien");
  const report = M.reportText(M.createSnapshot(state, catalog, "2026-10-01T10:30:00.000Z"));
  const seenText = M.flatten(catalog).find(x => x.id === "arbeid-specific-1").text;
  const notSeenText = M.flatten(catalog).find(x => x.id === "arbeid-specific-2").text;
  assert(report.includes(seenText), "Waargenomen signaal ontbreekt");
  assert(!report.includes(notSeenText), "Niet-waargenomen signaal staat in rapport");
  assert(!report.includes("Onbekend / niet onderzocht"), "Onbekende statussen staan in rapport");
});

test("Niet-geselecteerde vorm komt niet in rapport", () => {
  const state = M.createState(catalog);
  M.setContext(state, "includeArbeid", true);
  M.setContext(state, "observedAt", "2026-10-01T10:15");
  M.setContext(state, "location", "Locatie A");
  M.setContext(state, "controlType", "Integrale controle");
  M.setAnswer(state, "seksueel-specific-1", "seen", "Wel ingevuld maar niet geselecteerd");
  const report = M.reportText(M.createSnapshot(state, catalog));
  const text = M.flatten(catalog).find(x => x.id === "seksueel-specific-1").text;
  assert(!report.includes(text), "Niet-geselecteerde vorm opgenomen");
});

test("Heimelijke waarneming neemt alleen ingevulde of positieve bevindingen op", () => {
  const state = M.createState(catalog);
  M.setContext(state, "covertObservationEnabled", true);
  M.setContext(state, "observedAt", "2026-10-01T20:00");
  M.setContext(state, "location", "Locatie B");
  M.setContext(state, "controlType", "Heimelijke waarneming");
  M.setContext(state, "covertFootfall", "yes");
  M.setContext(state, "covertWebsiteMatch", "no");
  M.setContext(state, "covertPlateNumbers", "AB-12-CD");
  const report = M.reportText(M.createSnapshot(state, catalog));
  assert(report.includes("aanloop") && report.includes("AB-12-CD"), "Waarnemingen ontbreken");
  assert(!report.includes("openbaar toegankelijke advertentiebron"), "Negatieve websitebevinding onterecht opgenomen");
});

test("Integrale score verschijnt alleen als alle drie geselecteerde vormen zijn beoordeeld", () => {
  const state = M.createState(catalog);
  for (const key of ["includeArbeid", "includeSeksueel", "includeCrimineel"]) M.setContext(state, key, true);
  M.setAnswer(state, "arbeid-specific-1", "seen", "A");
  M.setAnswer(state, "seksueel-specific-1", "notSeen", "B");
  let risk = M.prototypeRiskScore(state, catalog);
  assert(risk.integratedScore === null, "Integrale score te vroeg zichtbaar");
  M.setAnswer(state, "crimineel-specific-1", "seen", "C");
  risk = M.prototypeRiskScore(state, catalog);
  assert(risk.allThreeAssessed && risk.integratedScore !== null, "Integrale score ontbreekt");
});

test("Rapport opent in toezichthoudersstijl", () => {
  const state = M.createState(catalog);
  M.setContext(state, "includeGeneral", true);
  M.setContext(state, "observedAt", "2026-10-01T09:00");
  M.setContext(state, "location", "Locatie C");
  M.setContext(state, "controlType", "Woningcontrole");
  M.setContext(state, "findings", "Ik zag dat de voordeur werd geopend.");
  const report = M.reportText(M.createSnapshot(state, catalog));
  assert(report.startsWith("RAPPORT VAN BEVINDINGEN"), "Geen rapportstijl");
  assert(report.includes("artikel 5:11 van de Algemene wet bestuursrecht"), "Awb-formulering ontbreekt");
  assert(report.includes("Ik zag dat de voordeur werd geopend."), "Feitelijke bevinding ontbreekt");
});

console.log(passed + " modelcontroles geslaagd.");