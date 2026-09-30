"use strict";
const M = require("../model.js");
const catalog = require("../signals.js");
let passed = 0;
function assert(value, message) { if (!value) throw new Error(message); }
function test(name, fn) { fn(); passed++; console.log("OK " + name); }
function form(score, id) { return score.forms.find(f => f.id === id); }

test("Alle 60 signalen beginnen onbekend en geen vorm is beoordeeld", () => {
  const state = M.createState(catalog);
  const counts = M.counts(state);
  const risk = M.prototypeRiskScore(state, catalog);
  assert(counts.unknown === 60 && counts.seen === 0 && counts.notSeen === 0, "Onjuiste beginstatus");
  assert(M.flatten(catalog).length === new Set(M.flatten(catalog).map(e => e.id)).size, "Dubbele IDs");
  assert(risk.assessedForms.length === 0 && risk.integratedScore === null && risk.validated === false, "Onjuiste begin-score");
});

test("Progressieve score volgt 0,5 / 1,25 / 2,5 binnen één vorm", () => {
  const state = M.createState(catalog);
  M.setAnswer(state, "arbeid-specific-1", "seen", "A");
  assert(form(M.prototypeRiskScore(state, catalog), "arbeid").score === 0.5, "Score 1 signaal onjuist");
  M.setAnswer(state, "arbeid-specific-2", "seen", "B");
  assert(form(M.prototypeRiskScore(state, catalog), "arbeid").score === 1.25, "Score 2 signalen onjuist");
  M.setAnswer(state, "arbeid-specific-3", "seen", "C");
  assert(form(M.prototypeRiskScore(state, catalog), "arbeid").score === 2.5, "Score 3 signalen onjuist");
});

test("Niet-waargenomen verhoogt de score niet maar markeert vorm als beoordeeld", () => {
  const state = M.createState(catalog);
  M.setAnswer(state, "seksueel-specific-1", "notSeen", "Onderzocht");
  const sexual = form(M.prototypeRiskScore(state, catalog), "seksueel");
  assert(sexual.score === 0 && sexual.assessed === 1 && sexual.isAssessed, "Niet-waargenomen verkeerd verwerkt");
});

test("Integrale score verschijnt alleen wanneer alle drie vormen zijn beoordeeld", () => {
  const state = M.createState(catalog);
  M.setAnswer(state, "arbeid-specific-1", "seen", "A");
  M.setAnswer(state, "seksueel-specific-1", "seen", "B");
  let risk = M.prototypeRiskScore(state, catalog);
  assert(!risk.allThreeAssessed && risk.integratedScore === null, "Te vroeg totaalscore");
  M.setAnswer(state, "crimineel-specific-1", "notSeen", "C");
  risk = M.prototypeRiskScore(state, catalog);
  assert(risk.allThreeAssessed && risk.integratedScore === 1, "Integrale score ontbreekt of is onjuist");
});

test("Rapport vereist bevestiging van fictieve gegevens", () => {
  let thrown = false;
  try { M.createSnapshot(M.createState(catalog), catalog); } catch (_) { thrown = true; }
  assert(thrown, "Rapport zonder bevestiging toegestaan");
});

test("Rapport opent als toezichthoudersrapportage met artikel 5:11 Awb", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  M.setContext(state, "observedAt", "2026-09-29T20:15");
  M.setContext(state, "location", "Oefenlocatie A");
  M.setContext(state, "controlType", "Bedrijfscontrole");
  M.setContext(state, "locationType", "Bedrijfspand");
  const report = M.reportText(M.createSnapshot(state, catalog));
  assert(report.includes("Ik, toezichthouder in dienst van de gemeente Emmen"), "Openingszin ontbreekt");
  assert(report.includes("artikel 5:11 van de Algemene wet bestuursrecht (Awb)"), "Awb-verwijzing ontbreekt");
  assert(report.includes("29-09-2026 om 20:15 uur"), "Tijd niet leesbaar weergegeven");
});

test("Rapport bevat alleen daadwerkelijk beoordeelde uitbuitingsvormen", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  M.setAnswer(state, "seksueel-specific-4", "seen", "Fictieve verklaring");
  const report = M.reportText(M.createSnapshot(state, catalog));
  assert(report.includes("SEKSUELE UITBUITING"), "Beoordeelde vorm ontbreekt");
  assert(!report.includes("ARBEIDSUITBUITING\nBinnen deze uitbuitingsvorm"), "Niet-beoordeelde arbeidsvorm toch inhoudelijk opgenomen");
  assert(!report.includes("CRIMINELE UITBUITING\nBinnen deze uitbuitingsvorm"), "Niet-beoordeelde criminele vorm toch inhoudelijk opgenomen");
  assert(report.includes("0,5 van maximaal 38,5"), "Vormspecifieke score ontbreekt");
});

test("Alle drie beoordeeld geeft afzonderlijke én integrale samenvatting", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  M.setAnswer(state, "arbeid-specific-1", "seen", "A");
  M.setAnswer(state, "seksueel-specific-1", "seen", "B");
  M.setAnswer(state, "crimineel-specific-1", "seen", "C");
  const report = M.reportText(M.createSnapshot(state, catalog));
  assert(report.includes("INTEGRALE SAMENVATTING"), "Integrale samenvatting ontbreekt");
  assert(report.includes("De integrale prototype-score bedraagt 1,5"), "Integrale score onjuist");
});

test("Heimelijke waarneming neemt kentekens en persoonskenmerken alleen op wanneer geactiveerd", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  let report = M.reportText(M.createSnapshot(state, catalog));
  assert(!report.includes("HEIMELIJKE WAARNEMING"), "Lege heimelijke module onterecht opgenomen");

  const next = M.createState(catalog);
  M.setContext(next, "trainingConfirmed", true);
  M.setContext(next, "covertObservationEnabled", true);
  M.setContext(next, "covertFootfall", "yes");
  M.setContext(next, "covertWebsiteMatch", "yes");
  M.setContext(next, "covertWebsiteName", "Kinky.nl");
  M.setContext(next, "covertPlateNumbers", "AA-11-BB");
  M.setContext(next, "covertPersonCharacteristics", "donkere jas, circa 30-40 jaar, lang haar");
  M.setContext(next, "covertNotes", "Fictieve observatie");
  report = M.reportText(M.createSnapshot(next, catalog));
  assert(report.includes("HEIMELIJKE WAARNEMING"), "Heimelijke waarneming ontbreekt");
  assert(report.includes("AA-11-BB") && report.includes("donkere jas"), "Kenteken of persoonskenmerken ontbreken");
  assert(report.includes("Kinky.nl"), "Advertentiebron ontbreekt");
});

test("Heimelijke module zonder observatienotitie geeft controlepunt", () => {
  const state = M.createState(catalog);
  M.setContext(state, "covertObservationEnabled", true);
  assert(M.reviewPoints(state).some(p => p.includes("Heimelijke waarneming")), "Controlepunt ontbreekt");
});

test("Wijzigen na rapportage maakt momentopname ongeldig", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  M.setAnswer(state, "arbeid-specific-1", "seen", "Eerste observatie");
  const first = M.createSnapshot(state, catalog, "2026-09-27T12:00:00.000Z");
  M.setAnswer(state, "arbeid-specific-1", "notSeen", "Gecorrigeerd");
  assert(state.snapshot === null, "Verouderde momentopname behouden");
  const next = M.createSnapshot(state, catalog, "2026-09-27T12:01:00.000Z");
  assert(form(next.prototypeRisk, "arbeid").score === 0 && next.revision > first.revision, "Nieuwe score of revisie onjuist");
});

test("Herhaalde export houdt rapporttijd gelijk zolang invoer gelijk blijft", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  const first = M.createSnapshot(state, catalog, "2026-09-27T12:00:00.000Z");
  assert(first === M.createSnapshot(state, catalog, "2026-09-27T13:00:00.000Z"), "Rapporttijd versprongen");
});

test("Acute zorg blijft onafhankelijk van score", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  M.setContext(state, "acuteConcern", "yes");
  const report = M.reportText(M.createSnapshot(state, catalog));
  assert(report.includes("Er is acute zorg aangegeven") && report.includes("geen indicatieve score gerapporteerd"), "Veiligheidsinstructie hangt af van score");
});

test("Ongeldige IDs/statussen worden geweigerd", () => {
  const state = M.createState(catalog);
  let errors = 0;
  for (const [id, status] of [["verzonnen", "seen"], ["arbeid-specific-1", "laag"]]) {
    try { M.setAnswer(state, id, status, ""); } catch (_) { errors++; }
  }
  assert(errors === 2, "Onbekende waarde geaccepteerd");
});

test("Lange tekst en bijzondere tekens blijven in rapport intact", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  const long = "<script>niet uitvoeren</script> & é —\n" + "Fictieve bevinding. ".repeat(900);
  M.setContext(state, "findings", long);
  assert(M.reportText(M.createSnapshot(state, catalog)).includes(long.trim()), "Tekst afgekapt");
});

console.log(passed + " modelcontroles geslaagd.");
