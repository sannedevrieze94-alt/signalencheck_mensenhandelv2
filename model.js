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
        controlReason: "Reguliere controle",
        controlReasonOther: "",
        presentPersons: "",
        contactPerson: "",
        contactRole: "",
        identificationShown: "yes",
        arrivalObservation: "",
        interiorObservation: "",
        statements: "",
        documentsViewed: "",
        documentsFindings: "",
        additionalFindings: "",
        followUpAction: "Geen verdere actie ondernomen",
        followUpDescription: "",
        followUpOwner: "",
        endedAt: "",
        reportPlace: "Emmen",
        observerFunction: "Toezichthouder",
        observerTeam: "",
        photoCount: "0",
        photoNames: "",
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
  function required(v, label) { return value(v) || "[nog invullen: " + label + "]"; }
  function finish(text) {
    const v = value(text);
    if (!v) return "";
    return /[.!?]$/.test(v) ? v : v + ".";
  }
  function lowerFirst(text) {
    const v = value(text);
    return v ? v.charAt(0).toLowerCase() + v.slice(1) : v;
  }

  function momentParts(raw) {
    const v = value(raw);
    const match = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    return match ? {date: match[3] + "-" + match[2] + "-" + match[1], time: match[4] + ":" + match[5]} : {date:v, time:""};
  }

  function formatMoment(raw) {
    const p = momentParts(raw);
    if (!p.date) return "niet ingevuld";
    return p.time ? p.date + " om " + p.time + " uur" : p.date;
  }

  function formatGeneratedDate(raw) {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return value(raw) || "[datum]";
    return date.toLocaleDateString("nl-NL", {day:"2-digit", month:"2-digit", year:"numeric"});
  }

  function covertReportLines(context) {
    if (!context.covertObservationEnabled) return [];
    const body = [];
    if (value(context.covertStart) || value(context.covertEnd)) body.push("Observatieperiode: " + (value(context.covertStart) ? formatMoment(context.covertStart) : "onbekend") + " tot " + (value(context.covertEnd) ? formatMoment(context.covertEnd) : "onbekend") + ".");
    if (value(context.covertPosition)) body.push("Observatiepositie/werkwijze: " + finish(context.covertPosition));
    if (context.covertFootfall === "yes") body.push("Aanloop en/of bezoekbewegingen werden waargenomen.");
    if (value(context.covertPersonsCount)) body.push("Aantal waargenomen personen: " + value(context.covertPersonsCount) + ".");
    if (value(context.covertArrivals)) body.push("Aankomst- en vertrekbewegingen: " + finish(context.covertArrivals));
    if (value(context.covertVehicles)) body.push("Voertuigen/vervoersbewegingen: " + finish(context.covertVehicles));
    if (value(context.covertPlateNumbers)) body.push("Waargenomen kentekens: " + finish(context.covertPlateNumbers));
    if (context.covertWebsiteMatch === "yes") {
      let line = "Relatie met een openbare advertentiebron vastgesteld";
      if (value(context.covertWebsiteName)) line += ": " + value(context.covertWebsiteName);
      if (value(context.covertWebsiteReference)) line += " (" + value(context.covertWebsiteReference) + ")";
      body.push(line + ".");
    }
    if (context.covertThirdPartyControl === "yes" || (value(context.covertThirdPartyControl) && !["unknown","no"].includes(value(context.covertThirdPartyControl)))) body.push("Tijdens de waarneming werden aanwijzingen vastgelegd over sturing of controle door een derde" + (value(context.covertThirdPartyControl) && !["yes","unknown","no"].includes(value(context.covertThirdPartyControl)) ? ": " + finish(context.covertThirdPartyControl) : "."));
    if (context.covertExchange === "yes" || (value(context.covertExchange) && !["unknown","no"].includes(value(context.covertExchange)))) body.push("Tijdens de waarneming werd informatie vastgelegd over overdracht van geld, goederen of andere objecten" + (value(context.covertExchange) && !["yes","unknown","no"].includes(value(context.covertExchange)) ? ": " + finish(context.covertExchange) : "."));
    if (value(context.covertVisitPattern)) body.push("Bezoek-/tijdspatroon: " + finish(context.covertVisitPattern));
    if (value(context.covertPersonCharacteristics)) body.push("Feitelijk waarneembare persoonskenmerken: " + finish(context.covertPersonCharacteristics));
    if (value(context.covertNotes)) body.push("Aanvullende chronologische waarnemingen: " + finish(context.covertNotes));
    return body.length ? ["", "HEIMELIJKE WAARNEMING / OBSERVATIE", ...body] : [];
  }

  function reviewPoints(state, catalog) {
    const points = [];
    const counts = answerCounts(state, catalog);
    if (!value(state.context.observedAt)) points.push("Datum en tijdstip ontbreken.");
    if (!value(state.context.location)) points.push("Locatie ontbreekt.");
    if (!value(state.context.observer)) points.push("Naam/code toezichthouder ontbreekt.");
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
    const directEntries = yesEntries.filter(item => item.sectionId !== "environment");
    const environmentEntries = yesEntries.filter(item => item.sectionId === "environment");
    const observed = momentParts(c.observedAt);
    const ended = momentParts(c.endedAt);
    const reason = value(c.controlReason) === "Anders" ? required(c.controlReasonOther,"aanleiding controle") : required(c.controlReason,"aanleiding controle");
    const role = value(c.contactRole) ? ", zijnde " + value(c.contactRole) : "";
    const photoCount = Number.parseInt(value(c.photoCount) || "0", 10) || 0;
    const lines = [
      "RAPPORT VAN BEVINDINGEN – INTEGRALE CONTROLE",
      "",
      "Rapport-/zaakcode: " + (value(c.caseCode) || "[nog invullen]"),
      "",
      "Ik, " + required(c.observer,"naam toezichthouder") + ", toezichthouder van de gemeente Emmen, zoals bedoeld in artikel 5:11 van de Algemene wet bestuursrecht, bevond mij op " + required(observed.date,"datum") + " omstreeks " + required(observed.time,"tijdstip") + " uur aan/in " + required(c.location,"adres en plaats") + ", hierna te noemen: de locatie.",
      "",
      "Ik bevond mij daar in het kader van " + lowerFirst(required(c.controlType,"type controle")) + " naar aanleiding van " + lowerFirst(reason) + "."
    ];

    if (value(c.presentPersons)) {
      lines.push("", "Tijdens deze controle waren tevens aanwezig: " + finish(c.presentPersons));
    }

    if (c.identificationShown !== "not-applicable") {
      const identification = c.identificationShown === "no" ? "Bij aanvang van de controle is in de app vastgelegd dat legitimatie als toezichthouder niet heeft plaatsgevonden." : "Bij aankomst op de locatie heb ik mij gelegitimeerd als toezichthouder en het doel van de controle kenbaar gemaakt";
      if (c.identificationShown === "no") lines.push("", identification);
      else lines.push("", identification + " aan " + required(c.contactPerson,"naam of hoedanigheid betrokkene") + role + ".");
    }

    lines.push("", "Aldaar heb ik het volgende geconstateerd.", "", "BEVINDINGEN");

    if (value(c.arrivalObservation)) lines.push("", "Bij aankomst zag ik dat:", finish(c.arrivalObservation));
    if (value(c.interiorObservation)) lines.push("", "Vervolgens heb ik de locatie betreden en zag ik:", finish(c.interiorObservation));
    if (value(c.additionalFindings)) lines.push("", "Tijdens de controle heb ik voorts geconstateerd dat:", finish(c.additionalFindings));
    if (value(c.statements)) lines.push("", "Tijdens de controle zijn verklaringen vastgelegd. Zakelijk weergegeven is verklaard:", finish(c.statements));
    if (value(c.documentsViewed)) {
      lines.push("", "Tijdens de controle heb ik de volgende documenten of bescheiden ingezien: " + finish(c.documentsViewed));
      if (value(c.documentsFindings)) lines.push("Hieruit bleek dat: " + finish(c.documentsFindings));
    }
    if (photoCount > 0) {
      lines.push("", "Van de aangetroffen situatie zijn " + photoCount + (photoCount === 1 ? " foto" : " foto's") + " als bijlage aan deze rapportage gekoppeld." + (value(c.photoNames) ? " Gekoppelde bestanden: " + finish(c.photoNames) : ""));
    }

    lines.push(...covertReportLines(c));

    lines.push("", "SIGNALEN EN BIJZONDERHEDEN");
    if (!directEntries.length && !environmentEntries.length) {
      lines.push("Tijdens de controle zijn in de Signalencheck geen omstandigheden met ‘Ja’ vastgelegd.");
    } else {
      lines.push("Tijdens de controle heb ik omstandigheden waargenomen en/of vastgelegd die voor nadere beoordeling relevant kunnen zijn.");
      for (const entry of directEntries) {
        lines.push("", "Ik zag, hoorde of constateerde dat " + finish(lowerFirst(entry.text)));
        if (value(entry.note)) lines.push("Hierbij heb ik als feitelijke toelichting vastgelegd: " + finish(entry.note));
      }
      if (environmentEntries.length) {
        lines.push("", "Daarnaast is de volgende relevante omgevings- of dossierinformatie vastgelegd:");
        for (const entry of environmentEntries) {
          lines.push("- " + finish(entry.text) + (value(entry.note) ? " Toelichting: " + finish(entry.note) : ""));
        }
      }
    }

    lines.push("", "Deze bevindingen zijn door mij vastgelegd ten behoeve van verdere beoordeling en eventuele opvolging. Met deze rapportage wordt door mij uitsluitend vastgelegd wat ik zelf heb waargenomen, geconstateerd en gehoord, dan wel welke als zodanig herkenbare dossier- of omgevingsinformatie in de app is geregistreerd. Voor zover signalen buiten mijn eigen toezichtsdomein vallen, worden deze door mij in deze rapportage niet gekwalificeerd als overtreding of strafbaar feit.");

    lines.push("", "VERVOLG");
    lines.push("Naar aanleiding van de controle heb ik: " + finish(required(c.followUpAction,"vervolgactie")));
    if (value(c.followUpDescription)) lines.push("De volgende vervolgactie is afgesproken: " + finish(c.followUpDescription));
    if (value(c.followUpOwner)) lines.push("De verdere opvolging ligt bij: " + finish(c.followUpOwner));

    lines.push("", "AFSLUITING");
    if (ended.date || ended.time) lines.push("Op " + required(ended.date, observed.date || "datum") + " omstreeks " + required(ended.time,"tijdstip") + " uur heb ik de controle beëindigd.");
    else lines.push("Op [nog invullen: datum en tijdstip einde controle] heb ik de controle beëindigd.");
    lines.push("", "Van mijn bevindingen heb ik deze rapportage opgemaakt.", "", "Aldus naar waarheid opgemaakt,", "", required(c.reportPlace,"plaats") + ", " + formatGeneratedDate(snapshot.generatedAt), "", required(c.observer,"naam toezichthouder"), value(c.observerFunction) || "Toezichthouder gemeente Emmen");
    if (value(c.observerFunction) && !/gemeente emmen/i.test(c.observerFunction)) lines.push("Toezichthouder gemeente Emmen");
    if (value(c.observerTeam)) lines.push(value(c.observerTeam));
    lines.push("", "[handtekening of digitale vaststelling]");

    lines.push("", "----------------------------------------", "INDICATIEVE LIKELIHOOD – INTERNE SIGNAALDUIDING (ONDERZOEKSPROTOTYPE)");
    for (const domain of snapshot.likelihood.domains) {
      lines.push(domain.title + ": " + domain.score + "% — " + domain.band + " (" + domain.completeness + "% van relevante waarnemingen beoordeeld).");
    }
    lines.push("", LIKELIHOOD_NOTICE, "Deze interne signaalduiding is geen feitelijke constatering en geen juridische kwalificatie. Controleer vóór formeel gebruik of dit blok in de definitieve rapportage thuishoort.");
    if (snapshot.reviewPoints.length) lines.push("", "CONTROLEPUNTEN VÓÓR VASTSTELLING", ...snapshot.reviewPoints.map(point => "- " + point));
    return lines.join("\n");
  }

  function installReportUi() {
    if (typeof document === "undefined") return;
    const checkView = document.getElementById("checkView");
    const contextSection = document.getElementById("contextTitle")?.closest(".app-section");
    if (!checkView || !contextSection || document.getElementById("reportDetailsPanel")) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./report-v45.css";
    link.dataset.reportStyle = "v45";
    document.head.appendChild(link);

    const details = document.createElement("details");
    details.id = "reportDetailsPanel";
    details.className = "card app-section report-details-panel";
    details.innerHTML = `
      <summary><span><small>Rapportage</small><strong>Aanvullende rapportagegegevens</strong></span><span class="report-details-hint">Open om het formele rapport aan te vullen</span></summary>
      <div class="report-details-body">
        <p class="muted">Deze velden worden gebruikt om automatisch een concept-rapport van bevindingen in verhaalvorm op te stellen. Vul alleen feitelijke, noodzakelijke informatie in.</p>
        <div class="field-grid">
          <label>Aanleiding controle<select data-context="controlReason"><option>Reguliere controle</option><option>Melding</option><option>Signaal</option><option>Hercontrole</option><option>Projectmatige controle</option><option>Anders</option></select></label>
          <label>Anders, namelijk<input data-context="controlReasonOther" maxlength="250" placeholder="Alleen invullen bij Anders"></label>
          <label>Aangesproken persoon / hoedanigheid<input data-context="contactPerson" maxlength="250" placeholder="Bijv. exploitant, bewoner of werknemer"></label>
          <label>Rol betrokkene<input data-context="contactRole" maxlength="150" placeholder="Bijv. eigenaar, exploitant, werknemer"></label>
          <label>Legitimatie getoond<select data-context="identificationShown"><option value="yes">Ja</option><option value="no">Nee</option><option value="not-applicable">Niet van toepassing</option></select></label>
          <label>Eindtijd controle<input data-context="endedAt" type="datetime-local"></label>
          <label>Plaats opmaken rapport<input data-context="reportPlace" maxlength="100" value="Emmen"></label>
          <label>Functie toezichthouder<input data-context="observerFunction" maxlength="150" value="Toezichthouder"></label>
          <label>Team / afdeling<input data-context="observerTeam" maxlength="150" placeholder="Bijv. OOV of BWT"></label>
        </div>
        <label>Overige aanwezige toezichthouders / ketenpartners<textarea data-context="presentPersons" rows="2" maxlength="2000" placeholder="Naam en functie/organisatie, voor zover noodzakelijk"></textarea></label>
        <label>Feitelijke waarneming bij aankomst<textarea data-context="arrivalObservation" rows="3" maxlength="3000" placeholder="Wat zag je bij aankomst?"></textarea></label>
        <label>Feitelijke waarnemingen in pand / terrein / ruimtes<textarea data-context="interiorObservation" rows="4" maxlength="4000" placeholder="Beschrijf ruimtes, werkzaamheden, goederen en andere relevante omstandigheden"></textarea></label>
        <label>Verklaringen van betrokkenen<textarea data-context="statements" rows="4" maxlength="4000" placeholder="Zakelijk weergegeven; gebruik alleen een letterlijk citaat als dit letterlijk is vastgelegd"></textarea></label>
        <div class="field-grid">
          <label>Ingeziene documenten / bescheiden<textarea data-context="documentsViewed" rows="3" maxlength="2500"></textarea></label>
          <label>Feitelijke bevindingen uit documenten<textarea data-context="documentsFindings" rows="3" maxlength="2500"></textarea></label>
        </div>
        <label>Overige feitelijke bevindingen<textarea data-context="additionalFindings" rows="4" maxlength="4000"></textarea></label>
        <div class="field-grid">
          <label>Vervolgactie<select data-context="followUpAction"><option>Geen verdere actie ondernomen</option><option>Afspraken gemaakt</option><option>Informatie intern doorgezet</option><option>Ketenpartner geïnformeerd</option><option>Hercontrole aangekondigd</option><option>Herstelactie uitgezet</option><option>Anders</option></select></label>
          <label>Verdere opvolging ligt bij<input data-context="followUpOwner" maxlength="250" placeholder="Afdeling, toezichthouder of organisatie"></label>
        </div>
        <label>Omschrijving vervolgactie<textarea data-context="followUpDescription" rows="3" maxlength="3000"></textarea></label>
        <input type="hidden" id="reportPhotoCount" data-context="photoCount" value="0">
        <input type="hidden" id="reportPhotoNames" data-context="photoNames" value="">
      </div>`;
    contextSection.insertAdjacentElement("afterend", details);

    const footer = document.querySelector(".app-footer");
    if (footer) footer.innerHTML = "<span>Gemeente Emmen · onderzoeksprototype</span><span class=\"footer-copyright\">© Sanne de Vrieze 2026</span>";

    const syncPhotos = () => {
      const cards = [...document.querySelectorAll("#observationPhotoGrid .observation-photo-card")];
      const names = cards.map(card => card.querySelector("figcaption span")?.textContent || "").filter(Boolean);
      const countInput = document.getElementById("reportPhotoCount");
      const namesInput = document.getElementById("reportPhotoNames");
      if (countInput && countInput.value !== String(cards.length)) {
        countInput.value = String(cards.length);
        countInput.dispatchEvent(new Event("input", {bubbles:true}));
      }
      const joined = names.join(", ");
      if (namesInput && namesInput.value !== joined) {
        namesInput.value = joined;
        namesInput.dispatchEvent(new Event("input", {bubbles:true}));
      }
    };
    const observer = new MutationObserver(syncPhotos);
    observer.observe(document.body, {childList:true, subtree:true});
    document.addEventListener("change", event => { if (event.target?.id === "observationPhotoInput") window.setTimeout(syncPhotos, 0); });
  }

  const api = {VERSION, STATUSES, SAFETY, LIKELIHOOD_NOTICE, flatten, createState, invalidate, setAnswer, setContext, answerCounts, likelihood, reviewPoints, createSnapshot, reportText};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SignalenModel = api;

  if (typeof document !== "undefined") installReportUi();
})(typeof globalThis !== "undefined" ? globalThis : this);
