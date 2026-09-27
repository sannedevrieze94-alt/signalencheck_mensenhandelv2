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
  function updateSummary() {
    const c = M.counts(state);
    $("kpiSeen").textContent = c.seen;
    $("kpiNotSeen").textContent = c.notSeen;
    $("kpiUnknown").textContent = c.unknown;
    $("kpiStatus").textContent = state.snapshot ? "Rapport actueel" : state.dirty ? "Invoer gewijzigd" : "Nieuw";
    $("acuteNotice").hidden = state.context.acuteConcern !== "yes";
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
      const btn = element("button", form.title, state.active === form.id ? "active" : "");
      btn.type = "button";
      btn.setAttribute("aria-pressed", String(state.active === form.id));
      btn.addEventListener("click", () => {
        if (state.active === form.id) return;
        state.active = form.id;
        // Alleen de weergave verandert; antwoorden en de rapportmomentopname blijven geldig.
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
    // Safari kan de download asynchroon openen.
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function printReport() {
    if (renderReport()) window.print();
  }
  function networkStatus() {
    $("appStatus").textContent = navigator.onLine
      ? "Browser meldt online. Antwoorden worden niet door deze tool verzonden of opgeslagen."
      : "Browser meldt offline. Bewaar je fictieve oefenrapport voordat je de app sluit.";
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
      if (ready.active) $("offlineStatus").textContent = "Appbestanden zijn voorbereid voor offlinegebruik. De browser kan deze cache later verwijderen. Invoer wordt niet bewaard.";
      const showUpdate = () => {
        if (registration.waiting) $("updateStatus").textContent = "Nieuwe appversie beschikbaar. Bewaar eerst je oefenrapport en sluit daarna alle vensters van deze app. De update wordt bij een volgende start actief.";
      };
      showUpdate();
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (worker) worker.addEventListener("statechange", showUpdate);
      });
    } catch (_) {
      $("offlineStatus").textContent = "Offlinevoorbereiding is niet gelukt. De app blijft bruikbaar zolang de bestanden geladen zijn; sluit niet vóór je het oefenrapport hebt bewaard.";
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    // Wis eventuele browser-herstelwaarden: er is bewust geen sessieherstel.
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
    // Ook de browser-sneltoets/menukeuze voor afdrukken mag geen oude rapportage afdrukken.
    window.addEventListener("beforeprint", renderReport);
    window.addEventListener("beforeunload", event => {
      if (state.dirty) { event.preventDefault(); event.returnValue = ""; }
    });
    window.addEventListener("online", networkStatus);
    window.addEventListener("offline", networkStatus);
    networkStatus();
    setupPwa();
  });
})();
