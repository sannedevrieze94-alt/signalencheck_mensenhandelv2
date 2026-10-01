/* Signalencheck 4.0 — pure gegevenslogica voor één observatielijst en drie likelihood-indicaties. */
(function (root) {
  "use strict";

  const VERSION = "4.0.0-prototype";
  const STATUSES = Object.freeze({unknown: "Nog niet beoordeeld", yes: "Ja", no: "Nee"});
  const SAFETY = "Bij direct gevaar: volg de lokale noodprocedure en bel zo nodig 112.";
  const LIKELIHOOD_NOTICE = "Likelihood-indicatie op basis van voorlopige onderzoeksgewichten. Dit is geen gevalideerde kansberekening of juridische vaststelling van mensenhandel.";

  function flatten(catalog) {
    return catalog.sections.flatMap(section => section.items.map(item => ({...item, sectionId: section.id, section: section.title})));
  }

  function createState(catalog) {
    return {
      revision: 0,
      snapshot: null,
      dirty: false,
      context: {
        caseCode: "",
        observedAt: "",
        observer: "",
        location: "",
        controlType: "Integrale controle",
        locationType: "",
        acuteConcern: "unknown",
        covertObservationEnabled: false,
        covertStart: "",
        covertEnd: "",
        covertPosition: "",
        covertFootfall: "unknown",
        covertPersonsCount: "",
        covertArrivals: "",
        covertVehicles: "",
        covertPlateNumbers: "",
        covertWebsiteMatch: "unknown",
        covertWebsiteName: "",
        covertWebsiteReference: "",
        covertThirdPartyControl: "unknown",
        covertExchange: "unknown",
        covertVisitPattern: "",
        covertPersonCharacteristics: "",
        covertNotes: ""
      },
      answers: Object.fromEntries(flatten(catalog).map(item => [item.id, {status: "unknown", note: ""}]))
    };
  }

  function invalidate(state) {
    state.revision += 1;
    state.snapshot = null;
    state.dirty = true;
  }

  function setAnswer(state, id, status, note) {
    if (!Object.hasOwn(state.answers, id) || !Object.hasOwn(STATUSES, status)) throw new Error("Onbekende waarneming of antwoord.");
    const nextNote = String(note ?? "").slice(0, 2000);
    if (state.answers[id].status !== status || state.answers[id].note !== nextNote) {
      state.answers[id] = {status, note: nextNote};
      invalidate(state);
    }
  }

  function setContext(state, key, value) {
    if (!Object.hasOwn(state.context, key)) throw new Error("Onbekend invoerveld.");
    const boolKeys = new Set(["covertObservationEnabled"]);
    const next = boolKeys.has(key) ? Boolean(value) : String(value ?? "").slice(0, 20000);
    if (state.context[key] !== next) {
      state.context[key] = next;
      invalidate(state);
    }
  }

  function answerCounts(state, catalog) {
    return flatten(catalog).reduce((out, item) => {
      out[state.answers[item.id].status] += 1;
      return out;
    }, {yes: 0, no: 0, unknown: 0});
  }

  function band(score) {
    if (score >= 80) return "zeer sterk signaalbeeld";
    if (score >= 60) return "sterk signaalbeeld";
    if (score >= 40) return "verhoogd signaalbeeld";
    if (score >= 20) return "beperkt signaalbeeld";
    return "laag signaalbeeld";
  }

  function likelihood(state, catalog) {
    const items = flatten(catalog);
    const results = catalog.domains.map(domain => {
      const relevant = items.filter(item => Number(item.weights?.[domain.id] || 0) > 0);
      const maxWeight = relevant.reduce((sum, item) => sum + Number(item.weights[domain.id] || 0), 0);
      const yesItems = relevant.filter(item => state.answers[item.id].status === "yes");
      const assessedItems = relevant.filter(item => state.answers[item.id].status !== "unknown");
      const yesWeight = yesItems.reduce((sum, item) => sum + Number(item.weights[domain.id] || 0), 0);
      const score = maxWeight ? Math.round((yesWeight / maxWeight) * 100) : 0;
      const completeness = relevant.length ? Math.round((assessedItems.length / relevant.length) * 100) : 100;
      const strongest = yesItems
        .map(item => ({id:item.id, text:item.text, weight:Number(item.weights[domain.id] || 0)}))
        .sort((a,b) => b.weight - a.weight || a.text.localeCompare(b.text, "nl"))
        .slice(0, 5);
      return Object.freeze({
        id: domain.id,
        title: domain.title,
        short: domain.short,
        score,
        band: band(score),
        yesWeight,
        maxWeight,
        completeness,
        assessed: assessedItems.length,
        total: relevant.length,
        yesCount: yesItems.length,
        strongest
      });
    });
    const all = answerCounts(state, catalog);
    return Object.freeze({
      domains: results,
      completeness: items.length ? Math.round(((items.length - all.unknown) / items.length) * 100) : 100,
      answered: items.length - all.unknown,
      total: items.length,
      complete: all.unknown === 0,
      validated: false,
      notice: LIKELIHOOD_NOTICE
    });
  }

  function value(v) { return String(v || "").trim(); }

  function formatMoment(raw) {
    const v = value(raw);
    if (!v) return "niet ingevuld";
    const match = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    return match ? match[3] + "-" + match[2] + "-" + match[1] + " om " + match[4] + ":" + match[5] + " uur" : v;
  }

  function covertReportLines(context) {
    if (!context.covertObservationEnabled) return [];
    const body = [];
    if (value(context.covertStart) || value(context.covertEnd)) body.push("Observatieperiode: " + (value(context.covertStart) ? formatMoment(context.covertStart) : "onbekend") + " tot " + (value(context.covertEnd) ? formatMoment(context.covertEnd) : "onbekend") + ".");
    if (value(context.covertPosition)) body.push("Observatiepositie/werkwijze: " + value(context.covertPosition));
    if (context.covertFootfall === "yes") body.push("Aanloop en/of bezoekbewegingen werden waargenomen.");
    if (value(context.covertPersonsCount)) body.push("Aantal waargenomen personen: " + value(context.covertPersonsCount) + ".");
    if (value(context.covertArrivals)) body.push("Aankomst- en vertrekbewegingen: " + value(context.covertArrivals));
    if (value(context.covertVehicles)) body.push("Voertuigen/vervoersbewegingen: " + value(context.covertVehicles));
    if (value(context.covertPlateNumbers)) body.push("Waargenomen kentekens: " + value(context.covertPlateNumbers));
    if (context.covertWebsiteMatch === "yes") {
      let line = "Relatie met een openbare advertentiebron vastgesteld";
      if (value(context.covertWebsiteName)) line += ": " + value(context.covertWebsiteName);
      if (value(context.covertWebsiteReference)) line += " (" + value(context.covertWebsiteReference) + ")";
      body.push(line + ".");
    }
    if (context.covertThirdPartyControl === "yes") body.push("Tijdens de waarneming werden aanwijzingen gezien dat een derde de situatie, persoon of bewegingen stuurde of controleerde.");
    if (context.covertExchange === "yes") body.push("Tijdens de waarneming werd overdracht van geld, goederen of andere objecten gezien.");
    if (value(context.covertVisitPattern)) body.push("Bezoek-/tijdspatroon: " + value(context.covertVisitPattern));
    if (value(context.covertPersonCharacteristics)) body.push("Feitelijk waarneembare persoonskenmerken: " + value(context.covertPersonCharacteristics));
    if (value(context.covertNotes)) body.push("Aanvullende chronologische waarnemingen: " + value(context.covertNotes));
    return body.length ? ["", "HEIMELIJKE WAARNEMING", ...body] : [];
  }

  function reviewPoints(state, catalog) {
    const points = [];
    const counts = answerCounts(state, catalog);
    if (!value(state.context.observedAt)) points.push("Datum en tijdstip ontbreken.");
    if (!value(state.context.location)) points.push("Locatie ontbreekt.");
    if (counts.unknown) points.push(counts.unknown + " waarneming(en) zijn nog niet met Ja of Nee beoordeeld.");
    const noNote = flatten(catalog).filter(item => state.answers[item.id].status === "yes" && !value(state.answers[item.id].note)).length;
    if (noNote) points.push(noNote + " positieve waarneming(en) hebben nog geen toelichting of bronnotitie.");
    return points;
  }

  function createSnapshot(state, catalog, now = new Date().toISOString()) {
    if (state.snapshot) return state.snapshot;
    state.snapshot = Object.freeze({
      version: VERSION,
      revision: state.revision,
      generatedAt: now,
      context: {...state.context},
      entries: flatten(catalog).map(item => ({...item, ...state.answers[item.id]})),
      likelihood: likelihood(state, catalog),
      reviewPoints: reviewPoints(state, catalog)
    });
    return state.snapshot;
  }

  function reportText(snapshot) {
    const c = snapshot.context;
    const yesEntries = snapshot.entries.filter(item => item.status === "yes");
    const lines = [
      "RAPPORT VAN BEVINDINGEN – SIGNALENCHECK MENSENHANDEL",
      "",
      "Rapport-/zaakcode: " + (value(c.caseCode) || "niet ingevuld"),
      "Toezichthouder: " + (value(c.observer) || "niet ingevuld"),
      "Datum en tijdstip: " + formatMoment(c.observedAt),
      "Locatie: " + (value(c.location) || "niet ingevuld"),
      "Type controle: " + (value(c.controlType) || "controle"),
      "Type locatie: " + (value(c.locationType) || "niet ingevuld"),
      "",
      "WAARGENOMEN BEVINDINGEN"
    ];
    if (!yesEntries.length) lines.push("Er zijn geen waarnemingen met Ja geregistreerd.");
    for (const entry of yesEntries) lines.push("- " + entry.text + (value(entry.note) ? " — " + value(entry.note) : ""));
    lines.push(...covertReportLines(c));
    lines.push("", "INDICATIEVE LIKELIHOOD");
    for (const domain of snapshot.likelihood.domains) {
      lines.push(domain.title + ": " + domain.score + "% — " + domain.band + " (" + domain.completeness + "% van relevante waarnemingen beoordeeld).");
    }
    lines.push("", LIKELIHOOD_NOTICE);
    if (snapshot.reviewPoints.length) lines.push("", "CONTROLEPUNTEN", ...snapshot.reviewPoints.map(point => "- " + point));
    lines.push("", "Opgemaakt op " + new Date(snapshot.generatedAt).toLocaleString("nl-NL") + ".");
    return lines.join("\n");
  }

  const api = {VERSION, STATUSES, SAFETY, LIKELIHOOD_NOTICE, flatten, createState, invalidate, setAnswer, setContext, answerCounts, likelihood, reviewPoints, createSnapshot, reportText};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SignalenModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
