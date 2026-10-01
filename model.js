/* Pure gegevenslogica: modulaire selectie, vormscores en rapportage. */
(function (root) {
  "use strict";

  const VERSION = "3.6.0-prototype";
  const STATUSES = Object.freeze({unknown: "Onbekend / niet onderzocht", seen: "Waargenomen", notSeen: "Niet waargenomen"});
  const SAFETY = "Bij direct gevaar: volg de lokale noodprocedure en bel zo nodig 112.";

  const FORM_CONTEXT_KEYS = Object.freeze({
    arbeid: "includeArbeid",
    seksueel: "includeSeksueel",
    crimineel: "includeCrimineel"
  });

  function flatten(catalog) {
    return catalog.flatMap(form => form.groups.flatMap(group => group.items.map(item => ({...item, formId: form.id, form: form.title, group: group.title}))));
  }

  function createState(catalog) {
    return {
      active: catalog[0].id,
      revision: 0,
      snapshot: null,
      dirty: false,
      context: {
        includeGeneral: false,
        includeArbeid: false,
        includeSeksueel: false,
        includeCrimineel: false,
        caseCode: "",
        observedAt: "",
        observer: "",
        location: "",
        controlType: "",
        locationType: "",
        findings: "",
        statements: "",
        observations: "",
        covertObservationEnabled: false,
        covertStart: "",
        covertEnd: "",
        covertFootfall: "unknown",
        covertWomenSeen: "",
        covertWebsiteMatch: "unknown",
        covertWebsiteName: "",
        covertWebsiteReference: "",
        covertVisitCount: "",
        covertVisitDurations: "",
        covertPattern: "",
        covertPlateNumbers: "",
        covertPersonCharacteristics: "",
        covertNotes: "",
        acuteConcern: "unknown",
        professionalReview: "",
        followUp: "",
        reviewRole: "",
        followUpBy: "",
        routeQuestions: ""
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
    if (!Object.hasOwn(state.answers, id) || !Object.hasOwn(STATUSES, status)) throw new Error("Onbekend signaal of antwoord.");
    const nextNote = String(note ?? "").slice(0, 2000);
    if (state.answers[id].status !== status || state.answers[id].note !== nextNote) {
      state.answers[id] = {status, note: nextNote};
      invalidate(state);
    }
  }

  function setContext(state, key, value) {
    if (!Object.hasOwn(state.context, key)) throw new Error("Onbekend invoerveld.");
    const boolKeys = new Set(["includeGeneral", "includeArbeid", "includeSeksueel", "includeCrimineel", "covertObservationEnabled"]);
    const next = boolKeys.has(key) ? Boolean(value) : String(value).slice(0, 20000);
    if (state.context[key] !== next) {
      state.context[key] = next;
      invalidate(state);
    }
  }

  function selectedFormIds(context) {
    return Object.entries(FORM_CONTEXT_KEYS).filter(([, key]) => Boolean(context[key])).map(([id]) => id);
  }

  function counts(state, catalog, selectedOnly = false) {
    const selected = new Set(selectedFormIds(state.context));
    const items = flatten(catalog).filter(item => !selectedOnly || selected.has(item.formId));
    return items.reduce((out, item) => {
      out[state.answers[item.id].status] += 1;
      return out;
    }, {seen: 0, notSeen: 0, unknown: 0});
  }

  function scoreFromSeen(seen) {
    if (!seen) return 0;
    return Math.round((0.5 * Math.pow(seen, 1.45)) * 4) / 4;
  }

  function formAssessments(state, catalog) {
    const selected = new Set(selectedFormIds(state.context));
    return catalog.map(form => {
      const items = form.groups.flatMap(group => group.items);
      const entries = items.map(item => ({...item, formId: form.id, form: form.title, status: state.answers[item.id].status, note: state.answers[item.id].note}));
      const seenEntries = entries.filter(item => item.status === "seen");
      const notSeen = entries.filter(item => item.status === "notSeen").length;
      const unknown = entries.filter(item => item.status === "unknown").length;
      const assessed = seenEntries.length + notSeen;
      return Object.freeze({
        id: form.id,
        title: form.title,
        selected: selected.has(form.id),
        seen: seenEntries.length,
        notSeen,
        unknown,
        assessed,
        total: entries.length,
        score: scoreFromSeen(seenEntries.length),
        maxScore: scoreFromSeen(entries.length),
        entries,
        seenEntries
      });
    });
  }

  function prototypeRiskScore(state, catalog) {
    const forms = formAssessments(state, catalog);
    const selectedForms = forms.filter(form => form.selected);
    const allThreeSelected = selectedForms.length === 3;
    const allThreeAssessed = allThreeSelected && selectedForms.every(form => form.assessed > 0);
    const integratedScore = allThreeAssessed ? Math.round(selectedForms.reduce((sum, form) => sum + form.score, 0) * 4) / 4 : null;
    const integratedMax = allThreeAssessed ? Math.round(selectedForms.reduce((sum, form) => sum + form.maxScore, 0) * 4) / 4 : null;
    return Object.freeze({forms, selectedForms, allThreeSelected, allThreeAssessed, integratedScore, integratedMax, validated: false});
  }

  function reviewPoints(state, catalog) {
    const points = [];
    const selectedForms = selectedFormIds(state.context);
    if (!state.context.observedAt.trim()) points.push("Datum en tijdstip ontbreken.");
    if (!state.context.location.trim()) points.push("Locatie ontbreekt.");
    if (!state.context.controlType.trim()) points.push("Type controle ontbreekt.");
    if (state.context.includeGeneral && !state.context.findings.trim()) points.push("Algemeen is geselecteerd, maar feitelijke waarnemingen ontbreken.");
    if (state.context.covertObservationEnabled && !state.context.covertNotes.trim() && !state.context.covertVisitCount.trim() && !state.context.covertPlateNumbers.trim()) points.push("Heimelijke waarneming is geselecteerd, maar er zijn nog geen observaties ingevuld.");
    if (selectedForms.length) {
      const noSource = flatten(catalog).filter(item => selectedForms.includes(item.formId) && state.answers[item.id].status === "seen" && !state.answers[item.id].note.trim()).length;
      if (noSource) points.push(noSource + " waargenomen signaal/signalen hebben nog geen toelichting of bron.");
    }
    return points;
  }

  function createSnapshot(state, catalog, now = new Date().toISOString()) {
    if (state.snapshot) return state.snapshot;
    const entries = flatten(catalog).map(item => ({...item, ...state.answers[item.id]}));
    state.snapshot = {
      version: VERSION,
      revision: state.revision,
      generatedAt: now,
      context: {...state.context},
      entries,
      counts: counts(state, catalog, true),
      prototypeRisk: prototypeRiskScore(state, catalog),
      reviewPoints: reviewPoints(state, catalog)
    };
    return state.snapshot;
  }

  function value(value) {
    return String(value || "").trim();
  }

  function scoreLabel(score) {
    return String(score).replace(".", ",");
  }

  function formatMoment(raw) {
    const v = value(raw);
    if (!v) return "het genoemde tijdstip";
    const match = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    return match ? match[3] + "-" + match[2] + "-" + match[1] + " om " + match[4] + ":" + match[5] + " uur" : v;
  }

  function scopeLabels(context) {
    const labels = [];
    if (context.includeGeneral) labels.push("algemene controlebevindingen");
    if (context.includeArbeid) labels.push("arbeidsuitbuiting");
    if (context.includeSeksueel) labels.push("seksuele uitbuiting");
    if (context.includeCrimineel) labels.push("criminele uitbuiting");
    if (context.covertObservationEnabled) labels.push("heimelijke waarneming");
    return labels;
  }

  function covertReportLines(context) {
    if (!context.covertObservationEnabled) return [];
    const body = [];
    const start = value(context.covertStart);
    const end = value(context.covertEnd);
    if (start || end) body.push("De heimelijke waarneming vond plaats" + (start ? " vanaf " + formatMoment(start) : "") + (end ? " tot " + formatMoment(end) : "") + ".");
    if (context.covertFootfall === "yes") body.push("Tijdens de observatie werd aanloop naar en/of bezoekbeweging bij de locatie waargenomen.");
    if (value(context.covertWomenSeen)) body.push("Tijdens de observatie werden " + value(context.covertWomenSeen) + " personen waargenomen binnen de onderzochte context.");
    if (context.covertWebsiteMatch === "yes") {
      let sentence = "De waargenomen situatie kon worden gerelateerd aan een openbaar toegankelijke advertentiebron";
      if (value(context.covertWebsiteName)) sentence += ", te weten " + value(context.covertWebsiteName);
      if (value(context.covertWebsiteReference)) sentence += " (" + value(context.covertWebsiteReference) + ")";
      body.push(sentence + ".");
    }
    if (value(context.covertVisitCount)) body.push("Er werden " + value(context.covertVisitCount) + " bezoeken geregistreerd.");
    if (value(context.covertVisitDurations)) body.push("Ten aanzien van de duur van de bezoeken werd het volgende waargenomen: " + value(context.covertVisitDurations));
    if (value(context.covertPattern)) body.push("Het volgende terugkerende patroon werd waargenomen: " + value(context.covertPattern));
    if (value(context.covertPlateNumbers)) body.push("De volgende kentekens werden waargenomen: " + value(context.covertPlateNumbers));
    if (value(context.covertPersonCharacteristics)) body.push("Van de waargenomen personen werden de volgende feitelijke kenmerken vastgelegd: " + value(context.covertPersonCharacteristics));
    if (value(context.covertNotes)) body.push(value(context.covertNotes));
    return body.length ? ["", "HEIMELIJKE WAARNEMING", ...body] : [];
  }

  function formReportLines(form) {
    if (!form.selected || !form.seenEntries.length) return [];
    const lines = ["", form.title.toUpperCase(), "Tijdens de controle werden de volgende signalen waargenomen:"];
    for (const entry of form.seenEntries) {
      lines.push("- " + entry.text + (value(entry.note) ? " — " + value(entry.note) : ""));
    }
    lines.push("Indicatieve score " + form.title.toLowerCase() + ": " + scoreLabel(form.score) + " van maximaal " + scoreLabel(form.maxScore) + ".");
    return lines;
  }

  function reportText(snapshot) {
    const c = snapshot.context;
    const risk = snapshot.prototypeRisk;
    const location = value(c.location) || "de genoemde locatie";
    const controlType = value(c.controlType) || "controle";
    const locationType = value(c.locationType);
    const scope = scopeLabels(c);
    const lines = [
      "RAPPORT VAN BEVINDINGEN – TOEZICHT MENSENHANDEL",
      "",
      "Rapport-/zaakcode: " + (value(c.caseCode) || "niet ingevuld"),
      "Toezichthouder: " + (value(c.observer) || "niet ingevuld"),
      "Datum en tijdstip: " + formatMoment(c.observedAt),
      "Locatie: " + location,
      "Type controle: " + controlType,
      "",
      "AANLEIDING EN CONTROLE",
      "Ik, toezichthouder in dienst van de gemeente Emmen, handelend in mijn hoedanigheid van toezichthouder als bedoeld in artikel 5:11 van de Algemene wet bestuursrecht (Awb), bevond mij op " + formatMoment(c.observedAt) + " op " + location + ". Op deze locatie voerde ik een " + controlType.toLowerCase() + (locationType ? " uit ter plaatse van een " + locationType.toLowerCase() : " uit") + "."
    ];

    if (scope.length) lines.push("De controle richtte zich op: " + scope.join(", ") + ".");

    if (c.includeGeneral && value(c.findings)) {
      lines.push("", "FEITELIJKE WAARNEMINGEN", value(c.findings));
    }

    lines.push(...covertReportLines(c));

    const formSections = risk.forms.flatMap(formReportLines);
    if (formSections.length) lines.push("", "WAARGENOMEN SIGNALEN", ...formSections);

    if (risk.allThreeAssessed) {
      lines.push("", "INTEGRALE SCORE");
      lines.push("Alle drie de uitbuitingsvormen zijn beoordeeld. De integrale indicatieve score bedraagt " + scoreLabel(risk.integratedScore) + " van maximaal " + scoreLabel(risk.integratedMax) + ".");
    }

    if (value(c.professionalReview)) lines.push("", "PROFESSIONELE DUIDING", value(c.professionalReview));
    if (value(c.followUp)) lines.push("", "VOORGESTELDE OPVOLGING", value(c.followUp));
    if (value(c.reviewRole)) lines.push("Beoordelaarsrol: " + value(c.reviewRole));
    if (value(c.followUpBy)) lines.push("Terugkoppelmoment: " + formatMoment(c.followUpBy));
    if (value(c.routeQuestions)) lines.push("Registratie / overdracht: " + value(c.routeQuestions));

    lines.push("", "Opgemaakt op " + new Date(snapshot.generatedAt).toLocaleString("nl-NL") + ".");
    return lines.join("\n");
  }

  const api = {
    VERSION,
    STATUSES,
    SAFETY,
    FORM_CONTEXT_KEYS,
    flatten,
    createState,
    invalidate,
    setAnswer,
    setContext,
    selectedFormIds,
    counts,
    scoreFromSeen,
    formAssessments,
    prototypeRiskScore,
    reviewPoints,
    createSnapshot,
    reportText
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SignalenModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this);