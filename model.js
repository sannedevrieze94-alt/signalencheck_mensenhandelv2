/* Pure gegevenslogica: transparante prototype-score, geen opslag of netwerkverkeer. */
(function (root) {
  "use strict";
  const VERSION = "3.5.0-prototype";
  const STATUSES = Object.freeze({unknown: "Onbekend / niet onderzocht", seen: "Waargenomen", notSeen: "Niet waargenomen"});
  const WARNING = "Onderzoeksprototype — uitsluitend fictieve oefencasuïstiek. De indicatieve score is een onderzoeksindex en geen gevalideerde kansberekening, vaststelling van mensenhandel of vervanging van professioneel oordeel. Geen of weinig waargenomen signalen sluit mensenhandel niet uit.";
  const SAFETY = "Bij direct gevaar: volg de lokale noodprocedure en bel zo nodig 112. Wacht niet op een score, minimumaantal signalen of rapport. Stem overige zorgen af met de bevoegde professional volgens vastgestelde lokale werkafspraken.";
  const WORKFLOW_NOTICE = "Lokale registratie- en meldroute zijn nog niet bevestigd. Dit rapport bevat een voorstel voor afstemming; er is geen melding, taaktoewijzing of overdracht uitgevoerd.";

  function reviewPoints(state) {
    const points = [];
    if (!state.context.observedAt.trim()) points.push("Waarnemingstijd ontbreekt.");
    if (!state.context.findings.trim()) points.push("Feitelijke bevindingen zijn nog niet beschreven.");
    if (state.context.acuteConcern === "unknown") points.push("Acute veiligheid is nog niet beoordeeld.");
    const noSource = Object.values(state.answers).filter(a => a.status === "seen" && !a.note.trim()).length;
    if (noSource) points.push(noSource + " waargenomen signaal/signalen zonder bron of toelichting.");
    if (!state.context.professionalReview.trim()) points.push("Professionele duiding ontbreekt.");
    if (!state.context.followUp.trim()) points.push("Voorgestelde vervolgstap ontbreekt.");
    if (!state.context.reviewRole.trim()) points.push("Een rol voor beoordeling/afstemming is nog niet voorgesteld.");
    if (!state.context.followUpBy.trim()) points.push("Gewenst terugkoppelmoment is nog niet voorgesteld.");
    points.push("Bevestig de lokale registratie- en meldroute buiten deze app.");
    return points;
  }

  function flatten(catalog) {
    return catalog.flatMap(form => form.groups.flatMap(group => group.items.map(item => ({...item, formId: form.id, form: form.title, group: group.title}))));
  }

  function createState(catalog) {
    return {
      active: catalog[0].id, revision: 0, snapshot: null, dirty: false,
      context: {caseCode: "", observedAt: "", observer: "", location: "", controlType: "", locationType: "", findings: "", statements: "", observations: "", reviewRole: "", followUpBy: "", routeQuestions: "", acuteConcern: "unknown", professionalReview: "", followUp: "", trainingConfirmed: false},
      answers: Object.fromEntries(flatten(catalog).map(item => [item.id, {status: "unknown", note: ""}]))
    };
  }

  function invalidate(state) { state.revision++; state.snapshot = null; state.dirty = true; }

  function setAnswer(state, id, status, note) {
    if (!Object.hasOwn(state.answers, id) || !Object.hasOwn(STATUSES, status)) throw new Error("Onbekend signaal of antwoord.");
    const nextNote = String(note ?? "").slice(0, 2000);
    if (state.answers[id].status !== status || state.answers[id].note !== nextNote) { state.answers[id] = {status, note: nextNote}; invalidate(state); }
  }

  function setContext(state, key, value) {
    if (!Object.hasOwn(state.context, key)) throw new Error("Onbekend invoerveld.");
    const next = key === "trainingConfirmed" ? Boolean(value) : String(value).slice(0, 20000);
    if (state.context[key] !== next) { state.context[key] = next; invalidate(state); }
  }

  function counts(state) { return Object.values(state.answers).reduce((out, a) => { out[a.status]++; return out; }, {seen: 0, notSeen: 0, unknown: 0}); }

  function scoreFromSeen(seen) {
    if (!seen) return 0;
    return Math.round((0.5 * Math.pow(seen, 1.45)) * 4) / 4;
  }

  function formAssessments(state, catalog) {
    return catalog.map(form => {
      const items = form.groups.flatMap(group => group.items);
      const answers = items.map(item => ({...item, formId: form.id, form: form.title, status: state.answers[item.id].status, note: state.answers[item.id].note}));
      const seen = answers.filter(item => item.status === "seen").length;
      const notSeen = answers.filter(item => item.status === "notSeen").length;
      const unknown = answers.filter(item => item.status === "unknown").length;
      const assessed = seen + notSeen;
      return Object.freeze({id: form.id, title: form.title, seen, notSeen, unknown, assessed, total: answers.length, score: scoreFromSeen(seen), isAssessed: assessed > 0, entries: answers});
    });
  }

  function prototypeRiskScore(state, catalog) {
    const forms = formAssessments(state, catalog);
    const assessedForms = forms.filter(form => form.isAssessed);
    const allThreeAssessed = assessedForms.length === catalog.length && catalog.length === 3;
    const integratedScore = allThreeAssessed ? Math.round(assessedForms.reduce((sum, form) => sum + form.score, 0) * 4) / 4 : null;
    return Object.freeze({
      forms,
      assessedForms: assessedForms.map(form => form.id),
      allThreeAssessed,
      integratedScore,
      method: "0,5 × n^1,45, afgerond op 0,25; n = aantal waargenomen signalen per uitbuitingsvorm",
      validated: false
    });
  }

  function createSnapshot(state, catalog, now = new Date().toISOString()) {
    if (!state.context.trainingConfirmed) throw new Error("Bevestig eerst dat uitsluitend fictieve oefengegevens zijn ingevuld.");
    if (state.snapshot) return state.snapshot;
    const entries = flatten(catalog).map(item => ({...item, ...state.answers[item.id]}));
    state.snapshot = {version: VERSION, revision: state.revision, generatedAt: now, context: {...state.context}, entries, counts: counts(state), prototypeRisk: prototypeRiskScore(state, catalog), warning: WARNING, safety: SAFETY, workflowNotice: WORKFLOW_NOTICE, reviewPoints: reviewPoints(state)};
    return state.snapshot;
  }

  function valueOr(value, fallback) {
    const text = String(value || "").trim();
    return text || fallback;
  }

  function formatMoment(value) {
    if (!value) return "het genoemde tijdstip";
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) return value;
    return match[3] + "-" + match[2] + "-" + match[1] + " om " + match[4] + ":" + match[5] + " uur";
  }

  function scoreLabel(score) {
    return String(score).replace(".", ",");
  }

  function formReportLines(form) {
    const lines = [];
    lines.push("", form.title.toUpperCase());
    lines.push("Binnen deze uitbuitingsvorm zijn " + form.assessed + " van de " + form.total + " signalen beoordeeld. Daarvan zijn " + form.seen + " signalen als waargenomen geregistreerd en " + form.notSeen + " als niet waargenomen. " + form.unknown + " signalen zijn niet beoordeeld of onbekend gebleven.");
    lines.push("De indicatieve score voor " + form.title.toLowerCase() + " bedraagt " + scoreLabel(form.score) + ". De score is berekend met de onderzoeksformule 0,5 × n^1,45, afgerond op kwartpunten, waarbij n het aantal waargenomen signalen binnen deze uitbuitingsvorm is.");
    const seenEntries = form.entries.filter(entry => entry.status === "seen");
    if (seenEntries.length) {
      lines.push("", "Waargenomen signalen:");
      for (const entry of seenEntries) {
        lines.push("- " + entry.text + (entry.note.trim() ? " Toelichting/bron: " + entry.note.trim() : ""));
      }
    } else {
      lines.push("Er zijn binnen deze uitbuitingsvorm geen signalen als waargenomen geregistreerd. Dit sluit uitbuiting niet uit.");
    }
    return lines;
  }

  function reportText(snapshot) {
    const context = snapshot.context;
    const risk = snapshot.prototypeRisk;
    const assessedForms = risk.forms.filter(form => form.isAssessed);
    const acute = {unknown: "Acute veiligheid is niet beoordeeld.", no: "Er is geen acute zorg aangegeven; dit is geen veiligheidsverklaring.", yes: "Er is acute zorg aangegeven. De lokale noodprocedure dient direct te worden gevolgd; bij direct gevaar wordt 112 gebeld."}[context.acuteConcern] || "Acute veiligheid is niet beoordeeld.";
    const location = valueOr(context.location, "de genoemde locatie");
    const controlType = valueOr(context.controlType, "controle");
    const locationType = valueOr(context.locationType, "locatie");
    const moment = formatMoment(context.observedAt);

    const lines = [
      "RAPPORTAGE TOEZICHT — SIGNALENCHECK MENSENHANDEL",
      "Oefencode: " + valueOr(context.caseCode, "niet ingevuld"),
      "Versie: " + snapshot.version,
      "Rapport opgesteld (UTC): " + snapshot.generatedAt,
      "",
      "AANLEIDING EN CONTROLE",
      "Ik, toezichthouder in dienst van de gemeente Emmen, handelend in mijn hoedanigheid van toezichthouder als bedoeld in artikel 5:11 van de Algemene wet bestuursrecht (Awb), bevond mij op " + moment + " op " + location + ". Op deze locatie voerde ik een " + controlType.toLowerCase() + " uit bij/ter plaatse van een " + locationType.toLowerCase() + ".",
      "",
      "WAARNEMINGEN",
      valueOr(context.findings, "Er zijn geen afzonderlijke feitelijke waarnemingen beschreven."),
      "",
      "VERKLARINGEN VAN ANDEREN",
      valueOr(context.statements, "Er zijn geen verklaringen van anderen vastgelegd."),
      "",
      "CONTEXT EN ALTERNATIEVE VERKLARINGEN",
      valueOr(context.observations, "Er is geen aanvullende context of alternatieve verklaring vastgelegd."),
      "",
      "BEOORDELING SIGNALEN"
    ];

    if (!assessedForms.length) {
      lines.push("Geen van de drie uitbuitingsvormen is inhoudelijk beoordeeld. Daarom wordt geen indicatieve score gerapporteerd.");
    } else {
      for (const form of assessedForms) lines.push(...formReportLines(form));
    }

    if (risk.allThreeAssessed) {
      lines.push("", "INTEGRALE SAMENVATTING");
      lines.push("Alle drie de uitbuitingsvormen zijn beoordeeld. De afzonderlijke scores bedragen: " + risk.forms.map(form => form.title + " " + scoreLabel(form.score)).join("; ") + ".");
      lines.push("De integrale prototype-score bedraagt " + scoreLabel(risk.integratedScore) + ". Deze integrale score is uitsluitend de som van de drie afzonderlijke vormscores en is geen kanspercentage of gevalideerde grenswaarde.");
    } else if (assessedForms.length) {
      lines.push("", "AFBAKENING RAPPORTAGE");
      lines.push("Deze rapportage bevat uitsluitend de uitbuitingsvorm" + (assessedForms.length === 1 ? "" : "en") + " die daadwerkelijk is/zijn beoordeeld: " + assessedForms.map(form => form.title).join(", ") + ". Niet beoordeelde uitbuitingsvormen zijn niet in de inhoudelijke beoordeling of score meegenomen.");
    }

    lines.push(
      "", "PROFESSIONELE DUIDING",
      valueOr(context.professionalReview, "Nog niet ingevuld."),
      "", "VOORGESTELDE OPVOLGING",
      valueOr(context.followUp, "Nog niet ingevuld."),
      "Voorgestelde beoordelaarsrol: " + valueOr(context.reviewRole, "nog niet voorgesteld"),
      "Gewenst terugkoppelmoment: " + valueOr(context.followUpBy, "nog niet voorgesteld"),
      "Nog af te stemmen over registratie/overdracht: " + valueOr(context.routeQuestions, "niet ingevuld"),
      "", "ACUTE VEILIGHEID",
      acute,
      "", "METHODISCHE BEPERKING",
      "De indicatieve score is een onderzoeksprototype. Zij neemt uitsluitend het aantal waargenomen signalen per uitbuitingsvorm als invoer en laat de score progressief oplopen. De formule is niet empirisch gevalideerd voor de kans op mensenhandel, weegt overlap en ernst niet afzonderlijk en vervangt geen professionele duiding of opvolgingsbesluit.",
      "", "REGISTRATIE EN OVERDRACHT",
      snapshot.workflowNotice,
      "", snapshot.warning,
      snapshot.safety
    );

    return lines.join("\n");
  }

  const api = {VERSION, STATUSES, WARNING, SAFETY, WORKFLOW_NOTICE, reviewPoints, flatten, createState, invalidate, setAnswer, setContext, counts, scoreFromSeen, formAssessments, prototypeRiskScore, createSnapshot, reportText};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SignalenModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this);