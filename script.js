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
    const riskScore = M.prototypeRiskScore ? M.prototypeRiskScore(state, catalog) : {score: c.seen, max: total, assessed: answered};

    $("ringAnswered").textContent = answered;
    $("ringSeen").textContent = c.seen;
    $("ringNotSeen").textContent = c.notSeen;
    $("ringUnknown").textContent = c.unknown;
    $("pillarArbeid").textContent = seenForForm("arbeid");
    $("pillarSeksueel").textContent = seenForForm("seksueel");
    $("pillarCrimineel").textContent = seenForForm("crimineel");

    const riskEl = $("riskScore");
    const riskFill = $("riskFill");
    const riskText = $("riskText");
    const riskCompleteness = $("riskCompleteness");
    if (riskEl) riskEl.textContent = riskScore.score + "/" + riskScore.max;
    if (riskFill) riskFill.style.width = ((riskScore.score / riskScore.max) * 100).toFixed(2) + "%";
    if (riskText) riskText.textContent = riskScore.score + " waargenomen signaal" + (riskScore.score === 1 ? "regel." : "regels.");
    if (riskCompleteness) riskCompleteness.textContent = answered === total
      ? "Volledig beoordeeld · " + answered + "/" + total
      : "Beeld onvolledig · " + answered + "/" + total + " onderzocht";

    const ring = $("signalRing");
    if (ring && ring.style && typeof ring.style.setProperty === "function") {
      ring.style.setProperty("--seen-pct", ((c.seen / total) * 100).toFixed(2) + "%");
      ring.style.setProperty("--answered-pct", ((answered / total) * 100).toFixed(2) + "%");
    }
    if (ring && typeof ring.setAttribute === "function") {
      ring.setAttribute("aria-label", answered + " van " + total + " signalen onderzocht; " + c.seen + " waargenomen, " + c.notSeen + " niet waargenomen en " + c.unknown + " onbekend.");
    }
    if (riskEl && typeof riskEl.setAttribute === "function") {
      riskEl.setAttribute("aria-label", "Indicatieve prototype-risicoscore " + riskScore.score + " van " + riskScore.max + ". Eén punt per waargenomen signaalregel; geen kanspercentage.");
    }
  }

  function updateSummary() {
    const c = M.counts(state);
    $("kpiSeen").textContent = c.seen;
    $("kpiNotSeen").textContent = c.notSeen;
    $("kpiUnknown").textContent = c.unknown;
    $("kpiStatus").textContent = state.snapshot ? "Rapport actueel" : state.dirty ? "Invoer gewijzigd" : "Nieuw";
    $("acuteNotice").hidden = state.context.acuteConcern !== "yes";
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
    const host = $("formButtons");
    host.replaceChildren();
    for (const form of catalog) {
      const btn = element("button", form.title + " · " + seenForForm(form.id), state.active === form.id ? "active" : "");
      btn.type = "button";
      btn.dataset.formId = form.id;
      btn.setAttribute("aria-pressed", String(state.active === form.id));
      btn.addEventListener("click", () => {
        if (state.active === form.id) return;
        state.active = form.id;
        for (const b of host.children) {
          const active = b === btn;
          b.setAttribute("aria-pressed", String(active));
          b.classList.toggle("active", active);
        }
        renderSignals();
      });
      host.appendChild(btn);
    }
  }

  function renderSignals() {
    const host = $("signalsMount");
    host.replaceChildren();
    const form = catalog.find(f => f.id === state.active);
    host.appendChild(element("h3", form.title));
    for (const group of form.groups) {
      const section = element("section");
      section.appendChild(element("h4", group.title));
      for (const item of group.items) {
        const card = element("div", undefined, "signal-item");
        const label = element("label", item.text);
        label.htmlFor = item.id;
        const select = element("select");
        select.id = item.id;
        for (const [value, text] of Object.entries(M.STATUSES)) {
          const option = element("option", text);
          option.value = value;
          select.appendChild(option);
        }
        select.value = state.answers[item.id].status;
        card.dataset.status = select.value;
        const details = element("details");
        const summary = element("summary", "Bron, waarneming en toelichting");
        const noteLabel = element("label", "Toelichting bij: " + item.text);
        noteLabel.htmlFor = item.id + "-note";
        const note = element("textarea");
        note.id = item.id + "-note";
        note.maxLength = 2000;
        note.rows = 2;
        note.placeholder = "Alleen fictieve gegevens. Benoem eigen waarneming of informatie uit een andere bron.";
        note.value = state.answers[item.id].note;
        details.open = Boolean(note.value);
        details.append(summary, noteLabel, note);
        function change() {
          card.dataset.status = select.value;
          M.setAnswer(state, item.id, select.value, note.value);
          onChange();
        }
        select.addEventListener("change", change);
        note.addEventListener("input", change);
        card.append(label, select, details);
        section.appendChild(card);
      }
      host.appendChild(section);
    }
  }

  function collectContext() {
    document.querySelectorAll("[data-context]").forEach(el => {
      M.setContext(state, el.dataset.context, el.type === "checkbox" ? el.checked : el.value);
    });
  }

  function renderReport() {
    collectContext();
    try {
      const snapshot = M.createSnapshot(state, catalog);
      $("reportPreview").textContent = M.reportText(snapshot);
      $("actionMessage").textContent = "Rapport opgebouwd uit de actuele invoer. Controleer het vóór gebruik.";
      updateSummary();
      return snapshot;
    } catch (error) {
      $("reportPreview").textContent = "Geen rapport opgesteld. Bevestig eerst het gebruik van fictieve oefengegevens.";
      $("actionMessage").textContent = error.message;
      $("trainingConfirmed").focus();
      updateSummary();
      return null;
    }
  }

  function resetCheck() {
    if (state.dirty && !window.confirm("Alle invoer van deze check wissen? Eerder gedownloade of gedeelde rapporten blijven op je toestel staan.")) return;
    state = M.createState(catalog);
    document.querySelectorAll("[data-context]").forEach(el => {
      if (el.type === "checkbox") el.checked = state.context[el.dataset.context];
      else el.value = state.context[el.dataset.context];
    });
    renderButtons();
    renderSignals();
    $("reportPreview").textContent = "Nog geen rapport opgesteld.";
    $("actionMessage").textContent = "Nieuwe check gestart. Alle invoer van deze sessie is gewist.";
    updateSummary();
    $("caseCode").focus();
  }

  function downloadText() {
    const snapshot = renderReport();
    if (!snapshot) return;
    const blob = new Blob(["\uFEFF" + M.reportText(snapshot)], {type: "text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = element("a");
    link.href = url;
    link.download = "oefenrapport-signalencheck-" + snapshot.generatedAt.replace(/[:.]/g, "-") + ".txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function printReport() {
    if (renderReport()) window.print();
  }

  function networkStatus() {
    $("appStatus").textContent = navigator.onLine
      ? "Online · antwoorden worden niet door deze tool verzonden of opgeslagen."
      : "Offline · bewaar je fictieve oefenrapport voordat je de app sluit.";
  }

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
    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      installPrompt = event;
      $("installBtn").hidden = false;
    });
    $("installBtn").addEventListener("click", async () => {
      if (!installPrompt) return;
      const prompt = installPrompt;
      installPrompt = null;
      $("installBtn").hidden = true;
      try { await prompt.prompt(); await prompt.userChoice; }
      catch (_) { $("updateStatus").textContent = "Installatie niet gestart. Gebruik het browsermenu of de installatie-uitleg."; }
    });
    window.addEventListener("appinstalled", () => {
      installPrompt = null;
      $("installBtn").hidden = true;
    });
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      $("offlineStatus").textContent = "Offlinegebruik niet beschikbaar. Gebruik HTTPS of localhost voor installatie.";
      return;
    }
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", {scope: "./", updateViaCache: "none"});
      const ready = await navigator.serviceWorker.ready;
      if (ready.active) $("offlineStatus").textContent = "Appbestanden zijn voorbereid voor offlinegebruik. Invoer wordt niet bewaard.";
      const showUpdate = () => {
        if (registration.waiting) $("updateStatus").textContent = "Nieuwe appversie beschikbaar. Bewaar eerst je oefenrapport en sluit daarna alle vensters van deze app.";
      };
      showUpdate();
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (worker) worker.addEventListener("statechange", showUpdate);
      });
    } catch (_) {
      $("offlineStatus").textContent = "Offlinevoorbereiding is niet gelukt. De app blijft bruikbaar zolang de bestanden geladen zijn.";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-context]").forEach(el => {
      if (el.type === "checkbox") el.checked = false;
      else el.value = state.context[el.dataset.context];
      const handler = () => {
        M.setContext(state, el.dataset.context, el.type === "checkbox" ? el.checked : el.value);
        onChange();
      };
      el.addEventListener("input", handler);
      el.addEventListener("change", handler);
    });
    renderButtons();
    renderSignals();
    updateSummary();
    $("versionLabel").textContent = M.VERSION;
    $("resetBtn").addEventListener("click", resetCheck);
    $("buildReportBtn").addEventListener("click", renderReport);
    $("downloadTextBtn").addEventListener("click", downloadText);
    $("printBtn").addEventListener("click", printReport);
    window.addEventListener("beforeprint", renderReport);
    window.addEventListener("beforeunload", event => {
      if (state.dirty) { event.preventDefault(); event.returnValue = ""; }
    });
    window.addEventListener("online", networkStatus);
    window.addEventListener("offline", networkStatus);
    networkStatus();
    setupSectionNavigation();
    setupPwa();
  });
})();