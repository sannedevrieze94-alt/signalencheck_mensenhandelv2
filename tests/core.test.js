"use strict";
const M = require("../model.js");
const catalog = require("../signals.js");
let passed = 0;
function assert(value, message) { if (!value) throw new Error(message); }
function test(name, fn) { fn(); passed++; console.log("OK " + name); }
test("Alle 60 signalen beginnen onbekend; geen risico-uitkomst", () => {
  const state = M.createState(catalog);
  const counts = M.counts(state);
  assert(counts.unknown === 60 && counts.seen === 0 && counts.notSeen === 0, "Onjuiste beginstatus");
  assert(M.flatten(catalog).length === new Set(M.flatten(catalog).map(e => e.id)).size, "Dubbele IDs");
  assert(!("score" in state) && !("risk" in state), "Onbedoelde risicoscore");
});
test("Rapport vereist bevestiging van fictieve gegevens", () => {
  let thrown = false;
  try { M.createSnapshot(M.createState(catalog), catalog); } catch (_) { thrown = true; }
  assert(thrown, "Rapport zonder bevestiging toegestaan");
});
test("Ernstig signaal wordt letterlijk vastgelegd zonder laag-risicolabel", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  M.setAnswer(state, "seksueel-specific-4", "seen", "Fictieve verklaring");
  const report = M.reportText(M.createSnapshot(state, catalog, "2026-09-27T12:00:00.000Z"));
  assert(report.includes("Gedwongen lijken tot seksuele handelingen"), "Signaal verloren");
  assert(!/laag risico|middel risico|hoog risico/i.test(report), "Risicolabel aanwezig");
  assert(report.includes("Wacht niet"), "Onafhankelijke veiligheidsinstructie ontbreekt");
});
test("Wisselen tussen vormen behoudt beide antwoorden en bronnotities", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  M.setAnswer(state, "arbeid-specific-5", "seen", "Bron A");
  state.active = "seksueel";
  M.setAnswer(state, "seksueel-specific-4", "seen", "Bron B");
  state.active = "arbeid";
  const snapshot = M.createSnapshot(state, catalog);
  assert(snapshot.counts.seen === 2, "Antwoord verloren");
  assert(snapshot.entries.find(e => e.id === "arbeid-specific-5").note === "Bron A", "Bron verloren");
});
test("Wijzigen na rapportage verwijdert oude momentopname en exporteert nieuwe antwoorden", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  M.setAnswer(state, "arbeid-specific-1", "seen", "Eerste observatie");
  const first = M.createSnapshot(state, catalog, "2026-09-27T12:00:00.000Z");
  M.setAnswer(state, "arbeid-specific-1", "notSeen", "Gecorrigeerd");
  assert(state.snapshot === null, "Verouderde momentopname behouden");
  M.setContext(state, "location", "Oefenlocatie B");
  const next = M.createSnapshot(state, catalog, "2026-09-27T12:01:00.000Z");
  assert(next.counts.seen === 0 && next.counts.notSeen === 1, "Oude antwoorden geëxporteerd");
  assert(next.context.location === "Oefenlocatie B", "Oude locatie");
  assert(first.entries.find(e => e.id === "arbeid-specific-1").note === "Eerste observatie", "Eerdere momentopname gemuteerd");
  assert(first.context.location === "", "Eerdere context gemuteerd");
  assert(next.revision > first.revision, "Revisie niet gewijzigd");
});
test("Herhaalde export houdt rapporttijd gelijk zolang invoer gelijk blijft", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  const first = M.createSnapshot(state, catalog, "2026-09-27T12:00:00.000Z");
  assert(first === M.createSnapshot(state, catalog, "2026-09-27T13:00:00.000Z"), "Rapporttijd versprongen");
});
test("Acute zorg onafhankelijk van het aantal waargenomen signalen", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  M.setContext(state, "acuteConcern", "yes");
  const report = M.reportText(M.createSnapshot(state, catalog));
  assert(report.includes("Acute zorg aangegeven") && report.includes("Waargenomen: 0"), "Veiligheidsinstructie hangt af van aantal");
});
test("Niet waargenomen en onbekend blijven onderscheiden in het rapport", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  M.setAnswer(state, "crimineel-general-1", "notSeen", "Onderzocht");
  const s = M.createSnapshot(state, catalog);
  assert(s.counts.notSeen === 1 && s.counts.unknown === 59, "Categorieën samengevoegd");
});
test("Nieuwe state wist typen, hoofdvorm, notities, bevestiging en momentopname", () => {
  let state = M.createState(catalog);
  M.setContext(state, "controlType", "Bedrijfscontrole");
  M.setContext(state, "locationType", "Horeca");
  M.setContext(state, "trainingConfirmed", true);
  M.setAnswer(state, "arbeid-specific-1", "seen", "Notitie");
  state.active = "seksueel";
  M.createSnapshot(state, catalog);
  state = M.createState(catalog);
  assert(state.context.controlType === "" && state.context.locationType === "", "Typen niet gewist");
  assert(!state.context.trainingConfirmed && state.snapshot === null && state.active === "arbeid", "Reset onvolledig");
  assert(M.counts(state).unknown === 60 && !state.answers["arbeid-specific-1"].note, "Antwoorden niet gewist");
});
test("Ongeldige IDs/statussen worden geweigerd", () => {
  const state = M.createState(catalog);
  let errors = 0;
  for (const [id, status] of [["verzonnen", "seen"], ["arbeid-specific-1", "laag"]]) {
    try { M.setAnswer(state, id, status, ""); } catch (_) { errors++; }
  }
  assert(errors === 2, "Onbekende waarde geaccepteerd");
});
test("Lange tekst en bijzondere tekens blijven in tekstrapport intact", () => {
  const state = M.createState(catalog);
  M.setContext(state, "trainingConfirmed", true);
  const long = "<script>niet uitvoeren</script> & é —\n" + "Fictieve bevinding. ".repeat(900);
  M.setContext(state, "findings", long);
  assert(M.reportText(M.createSnapshot(state, catalog)).includes(long.trim()), "Tekst afgekapt");
});

test("Ontbrekende meldroute blijft zichtbaar bij volledig ingevulde context", () => {
  const s = M.createState(catalog);
  for (const k of ["observedAt", "findings", "professionalReview", "followUp", "reviewRole", "followUpBy"]) M.setContext(s, k, "Fictief ingevuld");
  M.setContext(s, "acuteConcern", "no");
  assert(M.reviewPoints(s).length === 1 && M.reviewPoints(s)[0].includes("lokale registratie- en meldroute"), "Route onterecht bevestigd");
  M.setContext(s, "trainingConfirmed", true);
  const report = M.reportText(M.createSnapshot(s, catalog));
  assert(report.includes("nog niet bevestigd") && report.includes("geen melding, taaktoewijzing of overdracht uitgevoerd"), "Voorstel lijkt uitgevoerd");
});
test("Ontbrekende bron bij waargenomen signaal wordt getoond en bijgewerkt", () => {
  const s = M.createState(catalog);
  M.setAnswer(s, "arbeid-specific-1", "seen", "");
  assert(M.reviewPoints(s).some(p => p.includes("zonder bron")), "Bronwaarschuwing ontbreekt");
  M.setAnswer(s, "arbeid-specific-1", "seen", "Fictieve eigen waarneming");
  assert(!M.reviewPoints(s).some(p => p.includes("zonder bron")), "Bronwaarschuwing niet bijgewerkt");
});
test("Feiten, verklaringen en interpretaties blijven apart; opvolging vernieuwt rapport", () => {
  const s = M.createState(catalog);
  M.setContext(s, "trainingConfirmed", true);
  M.setContext(s, "findings", "FEIT-A"); M.setContext(s, "statements", "VERKLARING-B"); M.setContext(s, "observations", "INTERPRETATIE-C");
  const first = M.createSnapshot(s, catalog);
  M.setContext(s, "reviewRole", "Voorgestelde rol"); M.setContext(s, "routeQuestions", "Waar registreren?");
  assert(s.snapshot === null, "Oude opvolging behouden");
  const report = M.reportText(M.createSnapshot(s, catalog));
  assert(report.includes("Eigen feitelijke waarnemingen: FEIT-A") && report.includes("Verklaringen van anderen (met fictieve bron): VERKLARING-B") && report.includes("Context, interpretaties en alternatieve verklaringen: INTERPRETATIE-C"), "Categorieën vermengd");
  assert(report.includes("Voorgestelde rol") && report.includes("Waar registreren?"), "Opvolging ontbreekt");
  assert(first.context.reviewRole === "", "Historische momentopname gewijzigd");
});

console.log(passed + " modelcontroles geslaagd.");
