/* Signalencheck 3.6 — app-router, modulaire controleflow en rapportagebediening. */
(function () {
  "use strict";

  const M = window.SignalenModel;
  const catalog = window.APP_SIGNALS;
  let state = M.createState(catalog);
  let installPrompt = null;
  let currentMode = "home";
  let lastWorkflowMode = "integral";

  const $ = id => document.getElementById(id);
  const all = selector => [...document.querySelectorAll(selector)];

  function element(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }

  function selectedFormIds() {
    return M.selectedFormIds(state.context);
  }

  function selectedForms() {
    const ids = new Set(selectedFormIds());
    return catalog.filter(form => ids.has(form.id));
  }

  function moduleLabels() {
    const labels = [];
    if (state.context.includeGeneral) labels.push("Algemeen");
    for (const form of selectedForms()) labels.push(form.title);
    if (state.context.covertObservationEnabled) labels.push("Heimelijke waarneming");
    return labels;
  }

  function showView(viewId, navKey) {
    for (const view of all(".app-view")) view.hidden = view.id !== viewId;
    currentMode = navKey || currentMode;
    for (const btn of all("[data-mobile-view]")) btn.classList.toggle("active", btn.dataset.mobileView === currentMode);
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  function goHome() {
    currentMode = "home";
    showView("homeView", "home");
    updateHomeSummary();
  }

  function openSetup() {
    currentMode = "integral";
    showView("setupView", "integral");
    $("selectionMessage").textContent = "";
  }

  function openCovert() {
    lastWorkflowMode = "covert";
    M.setContext(state, "covertObservationEnabled", true);
    if (!state.context.controlType) M.setContext(state, "controlType", "Heimelijke waarneming");
    currentMode = "covert";
    configureWorkflow("covert");
    showView("workflowView", "covert");
  }

  function openReport() {
    showView("reportView", "report");
    renderReport();
  }

  function configureWorkflow(mode) {
    lastWorkflowMode = mode;
    const integral = mode === "integral";
    $("workflowKicker").textContent = integral ? "Integrale controle" : "Heimelijke waarneming";
    $("workflowTitle").textContent = integral ? "Integrale controle" : "Heimelijke waarneming";
    $("workflowSubtitle").textContent = integral
      ? "Alleen de geselecteerde onderdelen worden hieronder getoond."
      : "Leg de observatie chronologisch en feitelijk vast.";

    $("generalCard").hidden = !integral || !state.context.includeGeneral;
    $("covertCard").hidden = integral;
    const formIds = selectedFormIds();
    $("signalsCard").hidden = !integral || !formIds.length;

    if (integral && formIds.length) {
      if (!formIds.includes(state.active)) state.active = formIds[0];
      renderButtons();
      renderSignals();
    }
    updateScoreStrip();
  }

  function startIntegral() {
    const hasSelection = state.context.includeGeneral || selectedFormIds().length > 0;
    if (!hasSelection) {
      $("selectionMessage").textContent = "Selecteer minimaal één onderdeel om de controle te starten.";
      return;
    }
    lastWorkflowMode = "integral";
    currentMode = "integral";
    configureWorkflow("integral");
    showView("workflowView", "integral");
  }

  function resumeWorkflow() {
    if (lastWorkflowMode === "covert" && state.context.covertObservationEnabled) openCovert();
    else if (state.context.includeGeneral || selectedFormIds().length) {
      configureWorkflow("integral");
      showView("workflowView", "integral");
    } else openSetup();
  }

  function bindContextFields() {
    for (const el of all("[data-context]")) {
      const key = el.dataset.context;
      if (!Object.hasOwn(state.context, key)) continue;
      if (el.type === "checkbox") el.checked = Boolean(state.context[key]);
      else el.value = state.context[key];
      const handler = () => {
        M.setContext(state, key, el.type === "checkbox" ? el.checked : el.value);
        onChange();
      };
      el.addEventListener("input", handler);
      el.addEventListener("change", handler);
    }
  }

  function syncContextFields() {
    for (const el of all("[data-context]")) {
      const key = el.dataset.context;
      if (!Object.hasOwn(state.context, key)) continue;
      if (el.type === "checkbox") el.checked = Boolean(state.context[key]);
      else el.value = state.context[key];
    }
  }

  function seenForForm(formId) {
    const form = catalog.find(item => item.id === formId);
    if (!form) return 0;
    return form.groups.flatMap(group => group.items).filter(item => state.answers[item.id].status === "seen").length;
  }

  function updateHomeSummary() {
    const labels = moduleLabels();
    const selectedCounts = M.counts(state, catalog, true);
    $("summaryModules").textContent = labels.length ? labels.join(" · ") : "Geen onderdelen";
    $("summarySeen").textContent = selectedCounts.seen;
    $("summaryLocation").textContent = state.context.location.trim() || "Niet ingevuld";
    $("sessionStatus").textContent = state.dirty ? "Sessie in bewerking" : "Nieuwe sessie";
    $("resumeBtn").hidden = !(labels.length || state.dirty);
  }

  function updateScoreStrip() {
    const host = $("scoreStrip");
    if (!host) return;
    host.replaceChildren();
    const risk = M.prototypeRiskScore(state, catalog);
    for (const form of risk.forms.filter(item => item.selected)) {
      const badge = element("div", undefined, "score-badge");
      badge.append(element("span", form.title), element("strong", String(form.score).replace(".", ",") + "/" + String(form.maxScore).replace(".", ",")));
      host.appendChild(badge);
    }
    if (risk.allThreeAssessed) {
      const badge = element("div", undefined, "score-badge integrated");
      badge.append(element("span", "Integraal"), element("strong", String(risk.integratedScore).replace(".", ",") + "/" + String(risk.integratedMax).replace(".", ",")));
      host.appendChild(badge);
    }
  }

  function renderButtons() {
    const host = $("formButtons");
    host.replaceChildren();
    const forms = selectedForms();
    if (!forms.length) return;
    if (!forms.some(form => form.id === state.active)) state.active = forms[0].id;

    for (const form of forms) {
      const btn = element("button", form.title + " · " + seenForForm(form.id), state.active === form.id ? "active" : "");
      btn.type = "button";
      btn.dataset.formId = form.id;
      btn.setAttribute("aria-pressed", String(state.active === form.id));
      btn.addEventListener("click", () => {
        state.active = form.id;
        for (const other of host.children) {
          const active = other === btn;
          other.classList.toggle("active", active);
          other.setAttribute("aria-pressed", String(active));
        }
        renderSignals();
        updateScoreStrip();
      });
      host.appendChild(btn);
    }
  }

  function renderSignals() {
    const host = $("signalsMount");
    host.replaceChildren();
    const form = catalog.find(item => item.id === state.active && selectedFormIds().includes(item.id));
    if (!form) return;

    const header = element("div", undefined, "signal-form-header");
    header.appendChild(element("h3", form.title));
    header.appendChild(element("p", "Markeer alleen wat daadwerkelijk is beoordeeld. Alleen ‘Waargenomen’ komt later in de rapportage."));
    host.appendChild(header);

    for (const group of form.groups) {
      const section = element("section", undefined, "signal-group");
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
        const summary = element("summary", "Toelichting / bron");
        const note = element("textarea");
        note.id = item.id + "-note";
        note.rows = 2;
        note.maxLength = 2000;
        note.placeholder = "Beschrijf waarop deze waarneming is gebaseerd.";
        note.value = state.answers[item.id].note;
        details.open = Boolean(note.value);
        details.append(summary, note);

        const change = () => {
          card.dataset.status = select.value;
          M.setAnswer(state, item.id, select.value, note.value);
          onChange();
        };
        select.addEventListener("change", change);
        note.addEventListener("input", change);
        card.append(label, select, details);
        section.appendChild(card);
      }
      host.appendChild(section);
    }
  }

  function refreshTabs() {
    const host = $("formButtons");
    if (!host) return;
    for (const btn of host.children) {
      const formId = btn.dataset.formId;
      const form = catalog.find(item => item.id === formId);
      if (form) btn.textContent = form.title + " · " + seenForForm(formId);
    }
  }

  function onChange() {
    $("acuteNotice").hidden = state.context.acuteConcern !== "yes";
    updateHomeSummary();
    updateScoreStrip();
    refreshTabs();
    if (!$("reportView").hidden) {
      $("reportState").textContent = "Invoer gewijzigd";
      $("actionMessage").textContent = "Stel de rapportage opnieuw op om de wijzigingen te verwerken.";
    }
  }

  function renderReport() {
    try {
      const snapshot = M.createSnapshot(state, catalog);
      $("reportPreview").textContent = M.reportText(snapshot);
      $("reportState").textContent = "Actueel · versie " + M.VERSION;
      $("actionMessage").textContent = "Rapportage opgebouwd uit de actuele invoer. Controleer de feitelijke juistheid vóór gebruik.";
      return snapshot;
    } catch (error) {
      $("reportPreview").textContent = "Rapportage kon niet worden opgebouwd.";
      $("reportState").textContent = "Controle nodig";
      $("actionMessage").textContent = error.message;
      return null;
    }
  }

  function downloadText() {
    const snapshot = renderReport();
    if (!snapshot) return;
    const blob = new Blob(["\uFEFF" + M.reportText(snapshot)], {type: "text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = element("a");
    link.href = url;
    link.download = "rapport-van-bevindingen-" + snapshot.generatedAt.replace(/[:.]/g, "-") + ".txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function printReport() {
    if (renderReport()) window.print();
  }

  function resetSession() {
    if (state.dirty && !window.confirm("Alle invoer van deze sessie wissen? Eerder opgeslagen exports blijven op je toestel staan.")) return;
    state = M.createState(catalog);
    lastWorkflowMode = "integral";
    syncContextFields();
    $("reportPreview").textContent = "Nog geen rapportage opgesteld.";
    $("reportState").textContent = "Nog niet opgebouwd";
    $("actionMessage").textContent = "";
    $("formButtons").replaceChildren();
    $("signalsMount").replaceChildren();
    updateHomeSummary();
    updateScoreStrip();
    goHome();
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
      catch (_) { $("updateStatus").textContent = "Installatie niet gestart. Gebruik het browsermenu."; }
    });
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      $("offlineStatus").textContent = "Offlinegebruik is alleen beschikbaar via HTTPS of localhost.";
      return;
    }
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", {scope: "./", updateViaCache: "none"});
      const ready = await navigator.serviceWorker.ready;
      if (ready.active) $("offlineStatus").textContent = "Appbestanden zijn voorbereid voor offlinegebruik. Invoer wordt niet opgeslagen.";
      if (registration.waiting) $("updateStatus").textContent = "Nieuwe appversie beschikbaar. Sluit de app na het opslaan van je rapportage.";
    } catch (_) {
      $("offlineStatus").textContent = "Offlinevoorbereiding is niet gelukt.";
    }
  }

  function setupButtons() {
    $("homeBtn").addEventListener("click", goHome);
    $("topHomeBtn").addEventListener("click", goHome);
    $("topReportBtn").addEventListener("click", openReport);
    $("resetBtn").addEventListener("click", resetSession);
    $("openIntegralBtn").addEventListener("click", openSetup);
    $("openCovertBtn").addEventListener("click", openCovert);
    $("openReportBtn").addEventListener("click", openReport);
    $("resumeBtn").addEventListener("click", resumeWorkflow);
    $("startIntegralBtn").addEventListener("click", startIntegral);
    $("workflowReportBtn").addEventListener("click", openReport);
    $("workflowHomeBtn").addEventListener("click", goHome);
    $("buildFromWorkflowBtn").addEventListener("click", openReport);
    $("buildReportBtn").addEventListener("click", renderReport);
    $("downloadTextBtn").addEventListener("click", downloadText);
    $("printBtn").addEventListener("click", printReport);
    for (const btn of all("[data-go-home]")) btn.addEventListener("click", goHome);
    for (const btn of all("[data-mobile-view]")) {
      btn.addEventListener("click", () => {
        const target = btn.dataset.mobileView;
        if (target === "home") goHome();
        else if (target === "integral") openSetup();
        else if (target === "covert") openCovert();
        else if (target === "report") openReport();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindContextFields();
    setupButtons();
    $("versionLabel").textContent = M.VERSION;
    $("acuteNotice").hidden = true;
    updateHomeSummary();
    updateScoreStrip();
    showView("homeView", "home");
    setupPwa();

    window.addEventListener("beforeprint", renderReport);
    window.addEventListener("beforeunload", event => {
      if (state.dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
  });
})();