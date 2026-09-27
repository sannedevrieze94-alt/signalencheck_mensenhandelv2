/* Pure gegevenslogica: geen risicoscore, opslag of netwerkverkeer. */
(function (root) {
  "use strict";
  const VERSION = "3.0.0-prototype";
  const STATUSES = Object.freeze({unknown: "Onbekend / niet onderzocht", seen: "Waargenomen", notSeen: "Niet waargenomen"});
  const WARNING = "Onderzoeksprototype — uitsluitend fictieve oefencasuïstiek. Geen gevalideerde risicobeoordeling, vaststelling van mensenhandel of vervanging van professioneel oordeel. Geen of weinig waargenomen signalen sluit mensenhandel niet uit.";
  const SAFETY = "Bij direct gevaar: volg de lokale noodprocedure en bel zo nodig 112. Wacht niet op dit overzicht of op een minimumaantal signalen. Stem overige zorgen af met de bevoegde professional volgens vastgestelde lokale werkafspraken.";
  function flatten(catalog) {
    return catalog.flatMap(form => form.groups.flatMap(group => group.items.map(item => ({
      ...item, formId: form.id, form: form.title, group: group.title
    }))));
  }
  function createState(catalog) {
    return {
      active: catalog[0].id, revision: 0, snapshot: null, dirty: false,
      context: {caseCode: "", observedAt: "", observer: "", location: "", controlType: "", locationType: "", findings: "", observations: "", acuteConcern: "unknown", professionalReview: "", followUp: "", trainingConfirmed: false},
      answers: Object.fromEntries(flatten(catalog).map(item => [item.id, {status: "unknown", note: ""}]))
    };
  }
  function invalidate(state) {
    state.revision++;
    state.snapshot = null;
    state.dirty = true;
  }
  function setAnswer(state, id, status, note) {
    if (!Object.hasOwn(state.answers, id) || !Object.hasOwn(STATUSES, status)) throw new Error("Onbekend signaal of antwoord.");
    const nextNote = String(note ?? "").slice(0, 2000);
    if (state.answers[id].status !== status || state.answers[id].note !== nextNote) {
      state.answers[id] = {status, note: nextNote};
      invalidate(state);
    }
  }
  function setContext(state, key, value) {
    if (!Object.hasOwn(state.context, key)) throw new Error("Onbekend invoerveld.");
    const next = key === "trainingConfirmed" ? Boolean(value) : String(value).slice(0, 20000);
    if (state.context[key] !== next) { state.context[key] = next; invalidate(state); }
  }
  function counts(state) {
    return Object.values(state.answers).reduce((out, a) => { out[a.status]++; return out; }, {seen: 0, notSeen: 0, unknown: 0});
  }
  function createSnapshot(state, catalog, now = new Date().toISOString()) {
    if (!state.context.trainingConfirmed) throw new Error("Bevestig eerst dat uitsluitend fictieve oefengegevens zijn ingevuld.");
    if (state.snapshot) return state.snapshot;
    const entries = flatten(catalog).map(item => ({...item, ...state.answers[item.id]}));
    state.snapshot = {
      version: VERSION, revision: state.revision, generatedAt: now,
      context: {...state.context}, entries, counts: counts(state),
      warning: WARNING, safety: SAFETY
    };
    return state.snapshot;
  }
  const FIELDS = [
    ["caseCode", "Fictieve oefencode"], ["observedAt", "Waarnemingstijd (lokale tijd invuller)"],
    ["observer", "Fictieve beoordelaarscode"], ["location", "Fictieve locatie"],
    ["controlType", "Type controle"], ["locationType", "Type locatie"],
    ["findings", "Feitelijke bevindingen"], ["observations", "Context en interpretaties"],
    ["professionalReview", "Professionele duiding (door invuller)"], ["followUp", "Voorgestelde opvolging (door invuller)"]
  ];
  function reportText(snapshot) {
    const c = snapshot.counts;
    const acute = {unknown: "Onbekend / niet beoordeeld", no: "Geen acute zorg aangegeven; dit is geen veiligheidsverklaring", yes: "Acute zorg aangegeven — volg direct de noodprocedure"}[snapshot.context.acuteConcern] || "Onbekend";
    const lines = [
      "Signalencheck Mensenhandel — oefenrapport",
      "Versie: " + snapshot.version, "Invoerrevisie: " + snapshot.revision,
      "Rapport opgesteld (UTC): " + snapshot.generatedAt, "", snapshot.warning, "", snapshot.safety, "",
      "ACUTE VEILIGHEID", acute, "", "CONTROLECONTEXT",
      ...FIELDS.map(([key, label]) => label + ": " + (snapshot.context[key].trim() || "Niet ingevuld")),
      "", "SIGNAALOVERZICHT — ALLE DRIE VORMEN",
      "Waargenomen: " + c.seen + "; niet waargenomen: " + c.notSeen + "; onbekend / niet onderzocht: " + c.unknown + ".",
      "Dit zijn aantallen invoerregels, geen risicoscore of onafhankelijke bewijzen. Signalen kunnen overlappen.",
      "Geen automatische melding, dossieropslag of overdracht uitgevoerd."
    ];
    for (const status of ["seen", "notSeen", "unknown"]) {
      lines.push("", STATUSES[status].toUpperCase());
      const entries = snapshot.entries.filter(e => e.status === status);
      if (!entries.length) lines.push("Geen invoerregels met deze status.");
      for (const e of entries) {
        lines.push("[" + e.id + "] " + e.form + " / " + e.group + ": " + e.text);
        lines.push("Bron / waarneming / toelichting: " + (e.note.trim() || "Niet vastgelegd"));
      }
    }
    lines.push("", "BEPERKINGEN", "Signaalteksten en werkafspraken moeten inhoudelijk worden gevalideerd. Bronverwijzingen bij dit prototype onderbouwen geen score of grenswaarde. De invuller blijft verantwoordelijk voor controle van de verslaglegging.");
    return lines.join("\n");
  }
  const api = {VERSION, STATUSES, WARNING, SAFETY, FIELDS, flatten, createState, invalidate, setAnswer, setContext, counts, createSnapshot, reportText};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SignalenModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
