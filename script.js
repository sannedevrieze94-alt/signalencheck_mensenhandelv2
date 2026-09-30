/* UI: alle uitvoer gebruikt één actuele momentopname uit model.js. */
(function () {
  "use strict";
  const M = window.SignalenModel;
  const catalog = window.APP_SIGNALS;
  let state = M.createState(catalog);
  let installPrompt = null;
  const $ = id => document.getElementById(id);

  function element(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }

  function makeInputField(labelText, id, type, placeholder) {
    const label = element("label", labelText);
    const input = element("input");
    input.id = id; input.dataset.context = id; input.type = type || "text";
    if (placeholder) input.placeholder = placeholder;
    input.autocomplete = "off";
    label.appendChild(input);
    return label;
  }

  function makeTextareaField(labelText, id, placeholder) {
    const label = element("label", labelText);
    const area = element("textarea");
    area.id = id; area.dataset.context = id; area.maxLength = 20000; area.rows = 3;
    if (placeholder) area.placeholder = placeholder;
    label.appendChild(area);
    return label;
  }

  function makeYesNoField(labelText, id) {
    const label = element("label", labelText);
    const select = element("select");
    select.id = id; select.dataset.context = id;
    for (const [value, text] of [["unknown", "Onbekend / niet vastgesteld"], ["yes", "Ja"], ["no", "Nee"]]) {
      const option = element("option", text); option.value = value; select.appendChild(option);
    }
    label.appendChild(select);
    return label;
  }

  function renderCovertObservationSection() {
    if ($("covert-observation")) return;
    const section = element("section", undefined, "card app-section");
    section.id = "covert-observation";
    section.setAttribute("aria-labelledby", "covertTitle");

    const heading = element("div", undefined, "section-heading");
    heading.appendChild(element("span", "H", "section-number"));
    const headingCopy = element("div");
    headingCopy.appendChild(element("p", "Losse observatiemodule", "section-kicker"));
    const h2 = element("h2", "Heimelijke waarneming"); h2.id = "covertTitle"; headingCopy.appendChild(h2);
    heading.appendChild(headingCopy); section.appendChild(heading);

    section.appendChild(element("p", "Gebruik dit onderdeel alleen wanneer binnen de oefencasus een afzonderlijke observatie wordt vastgelegd. Beschrijf wat feitelijk is gezien en scheid observatie van interpretatie."));
    const notice = element("div", "Onderzoeksprototype: vul uitsluitend fictieve gegevens in. Kentekens en persoonskenmerken kunnen in echte situaties herleidbare persoonsgegevens zijn en vragen vóór praktijkgebruik om vastgestelde grondslag, toegang, bewaartermijn en beveiliging.", "score-explainer");
    section.appendChild(notice);

    const toggleLabel = element("label", undefined, "check-label");
    const toggle = element("input"); toggle.type = "checkbox"; toggle.id = "covertObservationEnabled"; toggle.dataset.context = "covertObservationEnabled";
    toggleLabel.append(toggle, document.createTextNode ? document.createTextNode(" Heimelijke waarneming opnemen in deze rapportage") : element("span", "Heimelijke waarneming opnemen in deze rapportage"));
    section.appendChild(toggleLabel);

    const fields = element("div", undefined, "covert-fields"); fields.id = "covertFields"; fields.hidden = true;
    const timing = element("div", undefined, "field-grid");
    timing.append(makeInputField("Start observatie", "covertStart", "datetime-local"), makeInputField("Einde observatie", "covertEnd", "datetime-local"), makeYesNoField("Aanloop / bezoekbewegingen waargenomen?", "covertFootfall"), makeInputField("Aantal waargenomen vrouwen/personen", "covertWomenSeen", "number", "Bijvoorbeeld 2"));
    fields.appendChild(timing);

    const web = element("div", undefined, "field-grid");
    web.append(makeYesNoField("Herleidbaar naar publieke advertentiebron?", "covertWebsiteMatch"), makeInputField("Publieke advertentiebron", "covertWebsiteName", "text", "Bijvoorbeeld Kinky.nl"), makeInputField("Advertentie / profielverwijzing", "covertWebsiteReference", "text", "Fictieve URL, alias of advertentie-ID"), makeInputField("Aantal geregistreerde bezoeken", "covertVisitCount", "number", "Bijvoorbeeld 4"));
    fields.appendChild(web);

    fields.appendChild(makeTextareaField("Duur van bezoeken / tijdspatroon", "covertVisitDurations", "Bijvoorbeeld: drie bezoeken van circa 20–30 minuten en één bezoek van circa 55 minuten."));
    fields.appendChild(makeTextareaField("Terugkerend patroon / overige observatiekenmerken", "covertPattern", "Beschrijf uitsluitend feitelijke patronen in aankomst, vertrek, begeleiding of bewegingen."));
    fields.appendChild(makeTextareaField("Waargenomen kenteken(s)", "covertPlateNumbers", "Fictieve kentekens, eventueel met tijdstip en voertuigomschrijving."));
    fields.appendChild(makeTextareaField("Feitelijk waarneembare persoonskenmerken", "covertPersonCharacteristics", "Bijvoorbeeld geschatte leeftijdscategorie, lengte, kleding, haarkleur en opvallende uiterlijke kenmerken. Vermijd aannames."));
    fields.appendChild(makeTextareaField("Aanvullende feitelijke observatienotities", "covertNotes", "Chronologische, feitelijke beschrijving van de waarneming."));
    section.appendChild(fields);

    const check = $("check");
    if (check && typeof check.after === "function") check.after(section);
    else document.body.appendChild(section);
  }

  function updateCovertFieldsVisibility() {
    const fields = $("covertFields");
    if (fields) fields.hidden = !state.context.covertObservationEnabled;
  }

  function seenForForm(formId) {
    const form = catalog.find(item => item.id === formId);
    if (!form) return 0;
    return form.groups.flatMap(group => group.items).filter(item => state.answers[item.id].status === "seen").length;
  }

  function refreshTabCounts() {
    const host = $("formButtons");
    if (!host) return;
    for (const btn of host.children) {
      const form = catalog.find(item => item.id === btn.dataset.formId);
      if (form) btn.textContent = form.title + " · " + seenForForm(form.id);
    }
  }

  function updateSignalVisual(c) {
    const total = c.seen + c.notSeen + c.unknown || 60;
    const answered = c.seen + c.notSeen;
    const risk = M.prototypeRiskScore(state, catalog);
    const active = risk.forms.find(form => form.id === state.active) || risk.forms[0];
    const dashboardScore = risk.allThreeAssessed
      ? {title: "Integrale indicatieve score", score: risk.integratedScore, max: risk.integratedMax, detail: "Alle drie de uitbuitingsvormen beoordeeld."}
      : {title: "Score " + active.title, score: active.score, max: active.maxScore, detail: active.assessed + "/" + active.total + " signalen binnen deze vorm beoordeeld."};

    $("ringAnswered").textContent = answered;
    $("ringSeen").textContent = c.seen;
    $("ringNotSeen").textContent = c.notSeen;
    $("ringUnknown").textContent = c.unknown;
    $("pillarArbeid").textContent = seenForForm("arbeid");
    $("pillarSeksueel").textContent = seenForForm("seksueel");
    $("pillarCrimineel").textContent = seenForForm("crimineel");

    const riskTitle = $("riskTitle");
    const riskEl = $("riskScore");
    const riskFill = $("riskFill");
    const riskText = $("riskText");
    const riskCompleteness = $("riskCompleteness");
    if (riskTitle) riskTitle.textContent = dashboardScore.title;
    if (riskEl) riskEl.textContent = String(dashboardScore.score).replace(".", ",") + "/" + String(dashboardScore.max).replace(".", ",");
    if (riskFill && riskFill.style) riskFill.style.width = dashboardScore.max ? ((dashboardScore.score / dashboardScore.max) * 100).toFixed(2) + "%" : "0%";
    if (riskText) riskText.textContent = dashboardScore.detail;
    if (riskCompleteness) riskCompleteness.textContent = risk.allThreeAssessed ? "Integraal beeld · alle drie vormen beoordeeld" : "Vormspecifieke score · geen totaalscore";

    const ring = $("signalRing");
    if (ring && ring.style && typeof ring.style.setProperty === "function") {
      ring.style.setProperty("--seen-pct", ((c.seen / total) * 100).toFixed(2) + "%");
      ring.style.setProperty("--answered-pct", ((answered / total) * 100).toFixed(2) + "%");
    }
    if (ring && typeof ring.setAttribute === "function") ring.setAttribute("aria-label", answered + " van " + total + " signalen onderzocht; " + c.seen + " waargenomen, " + c.notSeen + " niet waargenomen en " + c.unknown + " onbekend.");
    if (riskEl && typeof riskEl.setAttribute === "function") riskEl.setAttribute("aria-label", dashboardScore.title + " " + dashboardScore.score + " van " + dashboardScore.max + ". Prototype-score, geen kanspercentage.");
  }

  function updateSummary() {
    const c = M.counts(state);
    $("kpiSeen").textContent = c.seen;
    $("kpiNotSeen").textContent = c.notSeen;
    $("kpiUnknown").textContent = c.unknown;
    $("kpiStatus").textContent = state.snapshot ? "Rapport actueel" : state.dirty ? "Invoer gewijzigd" : "Nieuw";
    $("acuteNotice").hidden = state.context.acuteConcern !== "yes";
    updateCovertFieldsVisibility();
    updateSignalVisual(c);
    refreshTabCounts();
    const reviewList = $("reviewPoints");
    reviewList.replaceChildren();
    for (const point of M.reviewPoints(state)) reviewList.appendChild(element("li", point));
  }

  function onChange() {
    $("reportPreview").textContent = "Invoer gewijzigd. Stel het rapport opnieuw op; export gebruikt automatisch de actuele invoer.";
    $("actionMessage").textContent = "";
    updateSummary();
  }

  function renderButtons() {
    const host = $("formButtons"); host.replaceChildren();
    for (const form of catalog) {
      const btn = element("button", form.title + " · " + seenForForm(form.id), state.active === form.id ? "active" : "");
      btn.type = "button"; btn.dataset.formId = form.id; btn.setAttribute("aria-pressed", String(state.active === form.id));
      btn.addEventListener("click", () => {
        if (state.active === form.id) return;
        state.active = form.id;
        for (const b of host.children) { const active = b === btn; b.setAttribute("aria-pressed", String(active)); b.classList.toggle("active", active); }
        renderSignals(); updateSummary();
      });
      host.appendChild(btn);
    }
  }

  function renderSignals() {
    const host = $("signalsMount"); host.replaceChildren();
    const form = catalog.find(f => f.id === state.active); host.appendChild(element("h3", form.title));
    for (const group of form.groups) {
      const section = element("section"); section.appendChild(element("h4", group.title));
      for (const item of group.items) {
        const card = element("div", undefined, "signal-item");
        const label = element("label", item.text); label.htmlFor = item.id;
        const select = element("select"); select.id = item.id;
        for (const [value, text] of Object.entries(M.STATUSES)) { const option = element("option", text); option.value = value; select.appendChild(option); }
        select.value = state.answers[item.id].status; card.dataset.status = select.value;
        const details = element("details"); const summary = element("summary", "Bron, waarneming en toelichting");
        const noteLabel = element("label", "Toelichting bij: " + item.text); noteLabel.htmlFor = item.id + "-note";
        const note = element("textarea"); note.id = item.id + "-note"; note.maxLength = 2000; note.rows = 2; note.placeholder = "Alleen fictieve gegevens. Benoem eigen waarneming of informatie uit een andere bron."; note.value = state.answers[item.id].note; details.open = Boolean(note.value);
        details.append(summary, noteLabel, note);
        function change() { card.dataset.status = select.value; M.setAnswer(state, item.id, select.value, note.value); onChange(); }
        select.addEventListener("change", change); note.addEventListener("input", change); card.append(label, select, details); section.appendChild(card);
      }
      host.appendChild(section);
    }
  }

  function collectContext() {
    document.querySelectorAll("[data-context]").forEach(el => M.setContext(state, el.dataset.context, el.type === "checkbox" ? el.checked : el.value));
  }

  function renderReport() {
    collectContext();
    try {
      const snapshot = M.createSnapshot(state, catalog);
      $("reportPreview").textContent = M.reportText(snapshot);
      $("actionMessage").textContent = "Rapportage opgebouwd uit de actuele invoer. Controleer de feitelijke juistheid vóór gebruik.";
      updateSummary(); return snapshot;
    } catch (error) {
      $("reportPreview").textContent = "Geen rapport opgesteld. Bevestig eerst het gebruik van fictieve oefengegevens.";
      $("actionMessage").textContent = error.message; $("trainingConfirmed").focus(); updateSummary(); return null;
    }
  }

  function resetCheck() {
    if (state.dirty && !window.confirm("Alle invoer van deze check wissen? Eerder gedownloade of gedeelde rapporten blijven op je toestel staan.")) return;
    state = M.createState(catalog);
    document.querySelectorAll("[data-context]").forEach(el => { if (el.type === "checkbox") el.checked = state.context[el.dataset.context]; else el.value = state.context[el.dataset.context]; });
    renderButtons(); renderSignals(); $("reportPreview").textContent = "Nog geen rapport opgesteld."; $("actionMessage").textContent = "Nieuwe check gestart. Alle invoer van deze sessie is gewist."; updateSummary(); $("caseCode").focus();
  }

  function downloadText() {
    const snapshot = renderReport(); if (!snapshot) return;
    const blob = new Blob(["\uFEFF" + M.reportText(snapshot)], {type: "text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob); const link = element("a"); link.href = url; link.download = "rapportage-signalencheck-" + snapshot.generatedAt.replace(/[:.]/g, "-") + ".txt"; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function printReport() { if (renderReport()) window.print(); }
  function networkStatus() { $("appStatus").textContent = navigator.onLine ? "Online · antwoorden worden niet door deze tool verzonden of opgeslagen." : "Offline · bewaar je fictieve oefenrapport voordat je de app sluit."; }

  function setupSectionNavigation() {
    const links = [...document.querySelectorAll(".mobile-tabbar a")];
    if (!links.length || !("IntersectionObserver" in window)) return;
    const sections = ["check", "signalen", "opvolging", "rapportage"].map(id => $(id)).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      for (const link of links) link.classList.toggle("active", link.getAttribute("href") === "#" + visible.target.id);
    }, {rootMargin: "-20% 0px -62% 0px", threshold: [0.05, 0.2, 0.5]});
    sections.forEach(section => observer.observe(section));
  }

  async function setupPwa() {
    window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); installPrompt = event; $("installBtn").hidden = false; });
    $("installBtn").addEventListener("click", async () => { if (!installPrompt) return; const prompt = installPrompt; installPrompt = null; $("installBtn").hidden = true; try { await prompt.prompt(); await prompt.userChoice; } catch (_) { $("updateStatus").textContent = "Installatie niet gestart. Gebruik het browsermenu of de installatie-uitleg."; } });
    window.addEventListener("appinstalled", () => { installPrompt = null; $("installBtn").hidden = true; });
    if (!("serviceWorker" in navigator) || !window.isSecureContext) { $("offlineStatus").textContent = "Offlinegebruik niet beschikbaar. Gebruik HTTPS of localhost voor installatie."; return; }
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", {scope: "./", updateViaCache: "none"}); const ready = await navigator.serviceWorker.ready;
      if (ready.active) $("offlineStatus").textContent = "Appbestanden zijn voorbereid voor offlinegebruik. Invoer wordt niet bewaard.";
      const showUpdate = () => { if (registration.waiting) $("updateStatus").textContent = "Nieuwe appversie beschikbaar. Bewaar eerst je oefenrapport en sluit daarna alle vensters van deze app."; };
      showUpdate(); registration.addEventListener("updatefound", () => { const worker = registration.installing; if (worker) worker.addEventListener("statechange", showUpdate); });
    } catch (_) { $("offlineStatus").textContent = "Offlinevoorbereiding is niet gelukt. De app blijft bruikbaar zolang de bestanden geladen zijn."; }
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderCovertObservationSection();
    document.querySelectorAll("[data-context]").forEach(el => {
      if (el.type === "checkbox") el.checked = Boolean(state.context[el.dataset.context]); else el.value = state.context[el.dataset.context];
      const handler = () => { M.setContext(state, el.dataset.context, el.type === "checkbox" ? el.checked : el.value); onChange(); };
      el.addEventListener("input", handler); el.addEventListener("change", handler);
    });
    renderButtons(); renderSignals(); updateSummary(); $("versionLabel").textContent = M.VERSION;
    $("resetBtn").addEventListener("click", resetCheck); $("buildReportBtn").addEventListener("click", renderReport); $("downloadTextBtn").addEventListener("click", downloadText); $("printBtn").addEventListener("click", printReport);
    window.addEventListener("beforeprint", renderReport); window.addEventListener("beforeunload", event => { if (state.dirty) { event.preventDefault(); event.returnValue = ""; } }); window.addEventListener("online", networkStatus); window.addEventListener("offline", networkStatus);
    networkStatus(); setupSectionNavigation(); setupPwa();
  });
})();