/* Signalencheck 4.0 — één checklist, likelihood, historie, instellingen en heimelijke waarneming. */
(function () {
  "use strict";

  const M = window.SignalenModel;
  const catalog = window.APP_SIGNALS;
  const SETTINGS_KEY = "signalencheck:settings:v4";
  const HISTORY_KEY = "signalencheck:history:v4";
  const DEFAULT_SETTINGS = Object.freeze({theme:"light", push:false, inApp:true});

  let state = M.createState(catalog);
  let installPrompt = null;
  let currentView = "home";
  let settings = loadSettings();

  const $ = id => document.getElementById(id);
  const all = selector => [...document.querySelectorAll(selector)];

  function element(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }

  function loadSettings() {
    try {
      return {...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")};
    } catch (_) { return {...DEFAULT_SETTINGS}; }
  }

  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (_) {}
  }

  function loadHistory() {
    try {
      const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (_) { return []; }
  }

  function saveHistory(history) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100))); } catch (_) {}
  }

  function toast(message, kind = "info") {
    if (!settings.inApp) return;
    const host = $("toastRegion");
    if (!host) return;
    const item = element("div", message, "toast toast-" + kind);
    host.appendChild(item);
    requestAnimationFrame(() => item.classList.add("show"));
    window.setTimeout(() => {
      item.classList.remove("show");
      window.setTimeout(() => item.remove(), 220);
    }, 3200);
  }

  function applyTheme() {
    document.documentElement.dataset.theme = settings.theme === "dark" ? "dark" : "light";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = settings.theme === "dark" ? "#15171b" : "#e30613";
    if ($("themeSetting")) $("themeSetting").value = settings.theme;
  }

  function showView(viewId, navKey) {
    for (const view of all(".app-view")) view.hidden = view.id !== viewId;
    currentView = navKey || currentView;
    for (const btn of all("[data-mobile-view]")) btn.classList.toggle("active", btn.dataset.mobileView === currentView);
    window.scrollTo({top:0, behavior:"smooth"});
  }

  function goHome() {
    showView("homeView", "home");
    updateHomeSummary();
  }

  function openCheck() {
    showView("checkView", "check");
    renderObservations();
    updateLikelihood();
  }

  function openCovert() {
    M.setContext(state, "covertObservationEnabled", true);
    if (!state.context.controlType || state.context.controlType === "Integrale controle") M.setContext(state, "controlType", "Heimelijke waarneming");
    showView("covertView", "covert");
  }

  function openOverview() {
    showView("overviewView", "overview");
    renderHistory();
  }

  function openSettings() {
    showView("settingsView", "settings");
    syncSettingsUi();
  }

  function openReport() {
    showView("reportView", "report");
    renderReport();
  }

  function bindContextFields() {
    for (const input of all("[data-context]")) {
      const key = input.dataset.context;
      if (!Object.hasOwn(state.context, key)) continue;
      input.value = state.context[key];
      const handler = () => {
        M.setContext(state, key, input.value);
        onChange();
      };
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);
    }
  }

  function syncContextFields() {
    for (const input of all("[data-context]")) {
      const key = input.dataset.context;
      if (Object.hasOwn(state.context, key)) input.value = state.context[key];
    }
  }

  function renderObservations() {
    const host = $("observationsMount");
    if (!host) return;
    host.replaceChildren();

    for (const section of catalog.sections) {
      const sectionEl = element("section", undefined, "observation-section");
      const head = element("div", undefined, "observation-section-head");
      head.append(element("h3", section.title), element("p", section.description));
      sectionEl.appendChild(head);

      for (const item of section.items) {
        const answer = state.answers[item.id];
        const card = element("article", undefined, "observation-card");
        card.id = "card-" + item.id;
        card.dataset.status = answer.status;
        card.dataset.itemId = item.id;

        const copy = element("div", undefined, "observation-copy");
        copy.appendChild(element("p", item.text, "observation-text"));
        if (section.id === "environment") copy.appendChild(element("span", "Omgeving / dossier", "observation-kind"));

        const choices = element("div", undefined, "yes-no-choice");
        choices.setAttribute("role", "group");
        choices.setAttribute("aria-label", item.text);
        for (const [status, label] of [["yes","Ja"],["no","Nee"]]) {
          const button = element("button", label, answer.status === status ? "selected " + status : status);
          button.type = "button";
          button.dataset.status = status;
          button.setAttribute("aria-pressed", String(answer.status === status));
          button.addEventListener("click", () => {
            M.setAnswer(state, item.id, status, state.answers[item.id].note);
            card.dataset.status = status;
            for (const sibling of choices.children) {
              const active = sibling.dataset.status === status;
              sibling.classList.toggle("selected", active);
              sibling.setAttribute("aria-pressed", String(active));
            }
            updateLikelihood();
            updateHomeSummary();
            onChange(false);
          });
          choices.appendChild(button);
        }

        const details = element("details", undefined, "observation-note");
        const summary = element("summary", answer.note ? "Toelichting / bron ingevuld" : "Toelichting / bron toevoegen");
        const note = element("textarea");
        note.rows = 2;
        note.maxLength = 2000;
        note.placeholder = "Beschrijf feitelijk waarop Ja of Nee is gebaseerd.";
        note.value = answer.note;
        details.open = Boolean(answer.note);
        note.addEventListener("input", () => {
          M.setAnswer(state, item.id, state.answers[item.id].status, note.value);
          summary.textContent = note.value.trim() ? "Toelichting / bron ingevuld" : "Toelichting / bron toevoegen";
          onChange(false);
        });
        details.append(summary, note);

        card.append(copy, choices, details);
        sectionEl.appendChild(card);
      }
      host.appendChild(sectionEl);
    }
  }

  function updateLikelihood() {
    const result = M.likelihood(state, catalog);
    const host = $("likelihoodCards");
    if (host) {
      host.replaceChildren();
      for (const domain of result.domains) {
        const card = element("article", undefined, "likelihood-card likelihood-" + domain.id);
        const top = element("div", undefined, "likelihood-card-top");
        top.append(element("span", domain.title), element("strong", domain.score + "%"));
        const bar = element("div", undefined, "likelihood-bar");
        const fill = element("span");
        fill.style.width = domain.score + "%";
        bar.appendChild(fill);
        card.append(top, bar, element("small", domain.band + " · " + domain.completeness + "% relevant beoordeeld"));
        host.appendChild(card);
      }
    }
    if ($("completionProgress")) $("completionProgress").value = result.completeness;
    if ($("completionText")) $("completionText").textContent = result.answered + " van " + result.total + " beoordeeld · " + result.completeness + "%";
    if ($("unansweredCount")) $("unansweredCount").textContent = (result.total - result.answered) + " onbeantwoord";
    return result;
  }

  function updateHomeSummary() {
    const counts = M.answerCounts(state, catalog);
    const history = loadHistory();
    if ($("summaryAnswered")) $("summaryAnswered").textContent = (counts.yes + counts.no) + " / " + (counts.yes + counts.no + counts.unknown);
    if ($("summaryYes")) $("summaryYes").textContent = counts.yes;
    if ($("summaryLocation")) $("summaryLocation").textContent = state.context.location.trim() || "Niet ingevuld";
    if ($("homeCheckCount")) $("homeCheckCount").textContent = history.length;
    if ($("summaryLastCheck")) $("summaryLastCheck").textContent = history.length ? new Date(history[0].savedAt).toLocaleDateString("nl-NL") : "Nog geen";
    if ($("sessionStatus")) $("sessionStatus").textContent = state.dirty ? "Sessie in bewerking" : "Nieuwe sessie";
    if ($("resumeBtn")) $("resumeBtn").hidden = !state.dirty;
  }

  function onChange(showToast = false) {
    if ($("acuteNotice")) $("acuteNotice").hidden = state.context.acuteConcern !== "yes";
    updateHomeSummary();
    if (showToast) toast("Wijziging opgeslagen in de huidige sessie.");
    if ($("reportView") && !$("reportView").hidden) {
      $("reportState").textContent = "Invoer gewijzigd";
      $("actionMessage").textContent = "Stel de rapportage opnieuw op om wijzigingen te verwerken.";
    }
  }

  function firstUnknown() {
    return catalog.sections.flatMap(section => section.items).find(item => state.answers[item.id].status === "unknown");
  }

  function jumpToUnanswered() {
    const item = firstUnknown();
    if (!item) return toast("Alle waarnemingen zijn beoordeeld.", "success");
    const card = $("card-" + item.id);
    if (card) {
      card.scrollIntoView({behavior:"smooth", block:"center"});
      card.classList.add("attention-pulse");
      window.setTimeout(() => card.classList.remove("attention-pulse"), 1400);
    }
  }

  function historySummary() {
    const likelihood = M.likelihood(state, catalog);
    return {
      id: "check-" + Date.now(),
      savedAt: new Date().toISOString(),
      caseCode: state.context.caseCode.trim(),
      observedAt: state.context.observedAt,
      location: state.context.location.trim(),
      controlType: state.context.controlType,
      scores: Object.fromEntries(likelihood.domains.map(d => [d.id, d.score])),
      yesCount: M.answerCounts(state, catalog).yes,
      complete: likelihood.complete
    };
  }

  async function completeCheck() {
    const likelihood = M.likelihood(state, catalog);
    if (!likelihood.complete) {
      toast("Beoordeel eerst alle waarnemingen met Ja of Nee.", "warning");
      jumpToUnanswered();
      return false;
    }
    const history = loadHistory();
    history.unshift(historySummary());
    saveHistory(history);
    updateHomeSummary();
    renderHistory();
    toast("Check afgerond en lokaal aan het overzicht toegevoegd.", "success");
    await sendCompletionNotification(likelihood);
    return true;
  }

  function renderHistory() {
    const history = loadHistory();
    if ($("overviewCount")) $("overviewCount").textContent = history.length + (history.length === 1 ? " check" : " checks");
    if ($("emptyHistory")) $("emptyHistory").hidden = history.length > 0;
    const host = $("historyMount");
    if (!host) return;
    host.replaceChildren();
    for (const item of history) {
      const card = element("article", undefined, "history-card");
      const head = element("div", undefined, "history-card-head");
      head.append(element("strong", item.caseCode || "Check zonder zaakcode"), element("time", new Date(item.savedAt).toLocaleString("nl-NL")));
      const meta = element("p", [item.controlType || "Controle", item.location || "Locatie niet opgeslagen"].join(" · "));
      const scores = element("div", undefined, "history-scores");
      for (const [id,label] of [["arbeid","Arbeid"],["seksueel","Seksueel"],["crimineel","Crimineel"]]) {
        const badge = element("span", label + " " + Number(item.scores?.[id] || 0) + "%", "history-score score-" + id);
        scores.appendChild(badge);
      }
      card.append(head, meta, scores, element("small", item.yesCount + " waarneming(en) met Ja"));
      host.appendChild(card);
    }
  }

  function clearHistory() {
    if (!loadHistory().length) return;
    if (!window.confirm("Alle lokaal opgeslagen check-samenvattingen wissen?")) return;
    saveHistory([]);
    renderHistory();
    updateHomeSummary();
    toast("Checkgeschiedenis gewist.");
  }

  function renderReport() {
    try {
      const snapshot = M.createSnapshot(state, catalog);
      $("reportPreview").textContent = M.reportText(snapshot);
      $("reportState").textContent = "Actueel · versie " + M.VERSION;
      $("actionMessage").textContent = "Controleer feitelijke juistheid vóór gebruik. Likelihood is indicatief en niet gevalideerd.";
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
    const blob = new Blob(["\uFEFF" + M.reportText(snapshot)], {type:"text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = element("a");
    link.href = url;
    link.download = "signalencheck-rapport-" + snapshot.generatedAt.replace(/[:.]/g,"-") + ".txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function resetSession() {
    if (state.dirty && !window.confirm("Huidige invoer wissen en een nieuwe check starten?")) return;
    state = M.createState(catalog);
    syncContextFields();
    renderObservations();
    updateLikelihood();
    updateHomeSummary();
    if ($("reportPreview")) $("reportPreview").textContent = "Nog geen rapportage opgesteld.";
    if ($("reportState")) $("reportState").textContent = "Nog niet opgebouwd";
    openCheck();
    toast("Nieuwe check gestart.");
  }

  function syncSettingsUi() {
    applyTheme();
    if ($("pushSetting")) $("pushSetting").checked = Boolean(settings.push);
    if ($("inAppSetting")) $("inAppSetting").checked = Boolean(settings.inApp);
    const supported = "Notification" in window;
    if ($("pushStatus")) {
      $("pushStatus").textContent = supported ? "Browserstatus: " + Notification.permission + "." : "Meldingen worden door deze browser niet ondersteund.";
    }
  }

  async function changePushSetting(enabled) {
    if (!enabled) {
      settings.push = false;
      saveSettings();
      syncSettingsUi();
      return;
    }
    if (!("Notification" in window)) {
      settings.push = false;
      saveSettings();
      syncSettingsUi();
      return toast("Browsermeldingen worden op dit apparaat niet ondersteund.", "warning");
    }
    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    settings.push = permission === "granted";
    saveSettings();
    syncSettingsUi();
    toast(settings.push ? "Browsermeldingen ingeschakeld." : "Meldingstoestemming is niet verleend.", settings.push ? "success" : "warning");
  }

  async function sendCompletionNotification(likelihood) {
    if (!settings.push || !("Notification" in window) || Notification.permission !== "granted") return;
    const top = [...likelihood.domains].sort((a,b) => b.score-a.score)[0];
    const options = {body:"Check afgerond. Hoogste indicatie: " + top.title + " " + top.score + "%.", icon:"./icons/icon-192.png", badge:"./icons/icon-192.png"};
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification("Signalencheck afgerond", options);
      } else new Notification("Signalencheck afgerond", options);
    } catch (_) {}
  }

  async function setupPwa() {
    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      installPrompt = event;
      if ($("installBtn")) $("installBtn").hidden = false;
    });
    if ($("installBtn")) $("installBtn").addEventListener("click", async () => {
      if (!installPrompt) return;
      const prompt = installPrompt;
      installPrompt = null;
      $("installBtn").hidden = true;
      try { await prompt.prompt(); await prompt.userChoice; } catch (_) {}
    });
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      if ($("offlineStatus")) $("offlineStatus").textContent = "Offlinegebruik is alleen beschikbaar via HTTPS of localhost.";
      return;
    }
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", {scope:"./", updateViaCache:"none"});
      const ready = await navigator.serviceWorker.ready;
      if (ready.active && $("offlineStatus")) $("offlineStatus").textContent = "Appbestanden zijn voorbereid voor offlinegebruik.";
      if (registration.waiting && $("updateStatus")) $("updateStatus").textContent = "Nieuwe appversie beschikbaar.";
    } catch (_) {
      if ($("offlineStatus")) $("offlineStatus").textContent = "Offlinevoorbereiding is niet gelukt.";
    }
  }

  function setupButtons() {
    $("homeBtn").addEventListener("click", goHome);
    $("topHomeBtn").addEventListener("click", goHome);
    $("topOverviewBtn").addEventListener("click", openOverview);
    $("topSettingsBtn").addEventListener("click", openSettings);
    $("newCheckBtn").addEventListener("click", resetSession);
    $("openCheckBtn").addEventListener("click", openCheck);
    $("openCovertBtn").addEventListener("click", openCovert);
    $("openOverviewBtn").addEventListener("click", openOverview);
    $("openSettingsBtn").addEventListener("click", openSettings);
    $("resumeBtn").addEventListener("click", () => state.context.covertObservationEnabled && currentView === "covert" ? openCovert() : openCheck());
    $("checkReportBtn").addEventListener("click", openReport);
    $("checkHomeBtn").addEventListener("click", goHome);
    $("buildFromCheckBtn").addEventListener("click", openReport);
    $("saveCheckBtn").addEventListener("click", completeCheck);
    $("jumpUnansweredBtn").addEventListener("click", jumpToUnanswered);
    $("covertToCheckBtn").addEventListener("click", openCheck);
    $("clearHistoryBtn").addEventListener("click", clearHistory);
    $("buildReportBtn").addEventListener("click", renderReport);
    $("downloadTextBtn").addEventListener("click", downloadText);
    const printButton = $("printBtn") || $("printReportBtn");
    if (printButton) printButton.addEventListener("click", () => {
      const snapshot = renderReport();
      if (!snapshot) return;
      const ua = String(navigator.userAgent || "");
      const appleTouchDevice = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (appleTouchDevice && typeof document.execCommand === "function") {
        try { if (document.execCommand("print")) return; } catch (_) {}
      }
      if (typeof window.print === "function") window.print();
      else toast("Afdrukken wordt op dit apparaat niet ondersteund. Open de rapportage in Safari of Chrome en kies daar Druk af.", "warning");
    });
    for (const btn of all("[data-go-home]")) btn.addEventListener("click", goHome);
    for (const btn of all("[data-mobile-view]")) btn.addEventListener("click", () => {
      const target = btn.dataset.mobileView;
      if (target === "home") goHome();
      else if (target === "check") openCheck();
      else if (target === "covert") openCovert();
      else if (target === "overview") openOverview();
      else if (target === "settings") openSettings();
    });

    $("themeSetting").addEventListener("change", event => {
      settings.theme = event.target.value === "dark" ? "dark" : "light";
      saveSettings();
      applyTheme();
      toast("Thema aangepast.");
    });
    $("pushSetting").addEventListener("change", event => changePushSetting(event.target.checked));
    $("inAppSetting").addEventListener("change", event => {
      settings.inApp = event.target.checked;
      saveSettings();
      syncSettingsUi();
      if (settings.inApp) toast("In-appmeldingen ingeschakeld.", "success");
    });
  }

  function init() {
    applyTheme();
    bindContextFields();
    setupButtons();
    renderObservations();
    updateLikelihood();
    updateHomeSummary();
    renderHistory();
    syncSettingsUi();
    $("versionLabel").textContent = M.VERSION;
    $("acuteNotice").hidden = true;
    showView("homeView", "home");
    setupPwa();
    window.addEventListener("beforeprint", renderReport);
    window.addEventListener("beforeunload", event => {
      if (state.dirty) { event.preventDefault(); event.returnValue = ""; }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
