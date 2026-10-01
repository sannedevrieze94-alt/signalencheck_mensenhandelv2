(function () {
  "use strict";

  const MAX_PHOTOS = 6;
  const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
  let observationPhotos = [];

  function prepareDomCompatibility() {
    const reportOutput = document.getElementById("reportOutput");
    if (reportOutput && !document.getElementById("reportPreview")) reportOutput.id = "reportPreview";
    const download = document.getElementById("downloadReportBtn");
    if (download && !document.getElementById("downloadTextBtn")) download.id = "downloadTextBtn";
    const print = document.getElementById("printReportBtn");
    if (print && !document.getElementById("printBtn")) print.id = "printBtn";

    for (const id of ["checkHomeBtn","buildFromCheckBtn","clearHistoryBtn","buildReportBtn"]) {
      if (document.getElementById(id)) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.id = id;
      button.hidden = true;
      document.body.appendChild(button);
    }
    for (const id of ["reportState","actionMessage","versionLabel"]) {
      if (document.getElementById(id)) continue;
      const span = document.createElement("span");
      span.id = id;
      span.hidden = true;
      document.body.appendChild(span);
    }

    const contextMap = {
      covertCaseCode:"caseCode",
      covertObservedAt:"covertStart",
      covertLocation:"location",
      covertThirdPartyControl:"covertThirdPartyControl",
      covertExchange:"covertExchange",
      covertArrivals:"covertArrivals",
      covertVehicles:"covertVehicles",
      covertPattern:"covertVisitPattern",
      covertAds:"covertWebsiteReference",
      covertNotes:"covertNotes"
    };
    for (const [id,key] of Object.entries(contextMap)) {
      const field = document.getElementById(id);
      if (field) field.dataset.context = key;
    }
    for (const [id,key] of [["covertFootfall","covertFootfall"],["covertPlateNumbers","covertPlateNumbers"]]) {
      if (document.getElementById(id)) continue;
      const input = document.createElement("input");
      input.id = id;
      input.dataset.context = key;
      input.hidden = true;
      input.value = id === "covertFootfall" ? "unknown" : "";
      document.body.appendChild(input);
    }
  }

  prepareDomCompatibility();

  const CATEGORY_CONFIG = [
    {id:"control-dependency",tab:"Controle",title:"Controle & afhankelijkheid",description:"Waarnemingen over zeggenschap, bewegingsvrijheid, persoonlijke middelen en afhankelijkheid van derden.",items:["obs-control-third-party","obs-no-access-resources","obs-dependent-basic-needs","obs-restricted-transport-stay","obs-cannot-speak-alone","obs-cannot-stop-leave"]},
    {id:"coercion-vulnerability",tab:"Dwang",title:"Dwang, kwetsbaarheid & misleiding",description:"Waarnemingen over druk, geweld, dreiging, schuld, misleiding en het benutten van een kwetsbare positie.",items:["obs-false-promises","obs-threat-violence","obs-debt-position","obs-minor-vulnerable","obs-fear-exploiter"]},
    {id:"labour",tab:"Arbeid",title:"Arbeid & arbeidsvoorwaarden",description:"Waarnemingen over werktijden, arbeidsomstandigheden, beloning en zeggenschap over het werk.",items:["obs-no-work-autonomy","obs-dangerous-work","obs-extreme-hours","obs-underpaid","obs-delayed-pay"]},
    {id:"sexual-exploitation",tab:"Sekswerk",title:"Sekswerk, inkomsten & seksuele uitbuiting",description:"Waarnemingen over seksuele dienstverlening, aansturing van sekswerk en het afstaan van opbrengsten.",items:["obs-coerced-sex","obs-surrender-money-goods","obs-sex-work-managed"]},
    {id:"criminal-exploitation",tab:"Criminele inzet",title:"Criminele inzet & jonge aanwas",description:"Waarnemingen over strafbare opdrachten, ronseling, koeriersbewegingen en inzet van jongeren of kwetsbare personen.",items:["obs-criminal-tasks","obs-young-directed-older","obs-risk-location","obs-multiple-phones-hidden-tasks","obs-unclear-role","obs-drugs-theft-mule"]}
  ];

  const TILE_ICONS = {
    openCheckBtn:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4 4L19 7"/><path d="M4 4h16v16H4z"/></svg>',
    openCovertBtn:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.8"/></svg>',
    openOverviewBtn:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    openSettingsBtn:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/></svg>'
  };

  let grouping = false;
  let activeCategory = "control-dependency";

  function ensureStylesheet() {
    if (document.querySelector('link[data-category-style="v41"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./categories-v41.css";
    link.dataset.categoryStyle = "v41";
    document.head.appendChild(link);
  }

  function makeHeader(category) {
    const header = document.createElement("div");
    header.className = "observation-category-head";
    header.innerHTML = "<span class=\"category-marker\" aria-hidden=\"true\"></span><div><h4></h4><p></p></div>";
    header.querySelector("h4").textContent = category.title;
    header.querySelector("p").textContent = category.description;
    return header;
  }

  function directChildren(parent, className) {
    return [...parent.children].filter(child => child.classList && child.classList.contains(className));
  }

  function activateTab(host, categoryId, focusTab = false) {
    const tabs = [...host.querySelectorAll('[role="tab"]')];
    const panels = [...host.querySelectorAll('[role="tabpanel"]')];
    const available = panels.map(panel => panel.dataset.category);
    const target = available.includes(categoryId) ? categoryId : available[0];
    if (!target) return;
    activeCategory = target;
    for (const tab of tabs) {
      const selected = tab.dataset.category === target;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      tab.classList.toggle("active", selected);
      if (selected && focusTab) tab.focus({preventScroll:true});
    }
    for (const panel of panels) panel.hidden = panel.dataset.category !== target;
  }

  function makeTabList(host, panelData) {
    const tabList = document.createElement("div");
    tabList.className = "observation-tabs";
    tabList.setAttribute("role", "tablist");
    tabList.setAttribute("aria-label", "Categorieën waarnemingen");
    panelData.forEach(data => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "observation-tab";
      button.id = "observation-tab-" + data.id;
      button.dataset.category = data.id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", "observation-panel-" + data.id);
      button.setAttribute("aria-selected", "false");
      button.tabIndex = -1;
      button.innerHTML = "<span class=\"tab-label\"></span><small></small>";
      button.querySelector(".tab-label").textContent = data.tab;
      button.querySelector("small").textContent = String(data.count);
      button.addEventListener("click", () => activateTab(host, data.id));
      button.addEventListener("keydown", event => {
        const tabs = [...tabList.querySelectorAll('[role="tab"]')];
        const current = tabs.indexOf(button);
        let next = current;
        if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
        else if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        activateTab(host, tabs[next].dataset.category, true);
      });
      tabList.appendChild(button);
    });
    return tabList;
  }

  function groupObservationCards() {
    if (grouping) return;
    const host = document.getElementById("observationsMount");
    if (!host || !host.children.length || host.querySelector(".observation-tabs")) return;
    const sections = directChildren(host, "observation-section");
    const mainSection = sections.find(section => section.querySelector("#card-obs-control-third-party"));
    const environmentSection = sections.find(section => section.querySelector("#card-env-multiple-reports"));
    if (!mainSection) return;
    grouping = true;
    const cards = new Map(directChildren(mainSection, "observation-card").map(card => [card.dataset.itemId, card]));
    const panels = [];
    const panelData = [];

    for (const category of CATEGORY_CONFIG) {
      const panel = document.createElement("section");
      panel.className = "observation-category";
      panel.dataset.category = category.id;
      panel.id = "observation-panel-" + category.id;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", "observation-tab-" + category.id);
      panel.appendChild(makeHeader(category));
      let count = 0;
      for (const id of category.items) {
        const card = cards.get(id);
        if (card) { panel.appendChild(card); count += 1; }
      }
      panels.push(panel);
      panelData.push({...category, count});
    }

    const remaining = [...cards.values()].filter(card => card.parentElement === mainSection);
    if (remaining.length) {
      const category = {id:"other",tab:"Overig",title:"Overige waarnemingen",description:"Aanvullende waarnemingen die nog niet in een thematische categorie zijn ondergebracht."};
      const panel = document.createElement("section");
      panel.className = "observation-category";
      panel.dataset.category = category.id;
      panel.id = "observation-panel-" + category.id;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", "observation-tab-" + category.id);
      panel.appendChild(makeHeader(category));
      remaining.forEach(card => panel.appendChild(card));
      panels.push(panel);
      panelData.push({...category,count:remaining.length});
    }

    if (environmentSection) {
      environmentSection.classList.add("observation-category", "observation-environment-panel");
      environmentSection.dataset.category = "environment";
      environmentSection.id = "observation-panel-environment";
      environmentSection.setAttribute("role", "tabpanel");
      environmentSection.setAttribute("aria-labelledby", "observation-tab-environment");
      const envHead = environmentSection.querySelector(".observation-section-head");
      if (envHead) {
        envHead.classList.add("observation-category-head");
        const h3 = envHead.querySelector("h3");
        if (h3) { const h4 = document.createElement("h4"); h4.textContent = "Omgeving & dossier"; h3.replaceWith(h4); }
      }
      const count = environmentSection.querySelectorAll(".observation-card").length;
      panels.push(environmentSection);
      panelData.push({id:"environment",tab:"Omgeving",title:"Omgeving & dossier",count});
    }

    host.replaceChildren(makeTabList(host, panelData), ...panels);
    activateTab(host, activeCategory);
    grouping = false;
  }

  function moveLikelihoodToBottom() {
    const checkView = document.getElementById("checkView");
    const observationsMount = document.getElementById("observationsMount");
    const observationPanel = observationsMount ? observationsMount.closest(".app-section") : null;
    const likelihoodPanel = document.querySelector(".likelihood-panel");
    const actions = checkView ? checkView.querySelector(".sticky-workflow-actions") : null;
    if (!checkView || !observationPanel || !likelihoodPanel || !actions) return;
    const observationNumber = observationPanel.querySelector(".section-number");
    const likelihoodNumber = likelihoodPanel.querySelector(".section-number");
    const likelihoodKicker = likelihoodPanel.querySelector(".section-kicker");
    if (observationNumber) observationNumber.textContent = "02";
    if (likelihoodNumber) likelihoodNumber.textContent = "03";
    if (likelihoodKicker) likelihoodKicker.textContent = "Resultaat";
    if (likelihoodPanel.nextElementSibling !== actions) checkView.insertBefore(likelihoodPanel, actions);
  }

  function revealAttentionCard() {
    const host = document.getElementById("observationsMount");
    if (!host) return;
    const card = host.querySelector(".observation-card.attention-pulse") || host.querySelector('.observation-card[data-status="unknown"]');
    const panel = card ? card.closest('[role="tabpanel"]') : null;
    if (panel && panel.dataset.category) {
      activateTab(host, panel.dataset.category);
      card.scrollIntoView({behavior:"smooth", block:"center"});
    }
  }

  function polishObservationLabels() {
    const tile = document.getElementById("openCovertBtn");
    if (tile) tile.setAttribute("aria-label", "Observatie openen");
    const kicker = document.querySelector("#covertView .section-kicker");
    if (kicker) kicker.textContent = "Observatie";
    const title = document.getElementById("covertTitle");
    if (title) title.textContent = "Gerichte waarneming";
    const option = [...document.querySelectorAll("#controlType option")].find(item => item.textContent.trim() === "Heimelijke waarneming");
    if (option) option.textContent = "Observatie";
  }

  function simplifyHomeDashboard() {
    const labels = {openCheckBtn:"Nieuwe check",openCovertBtn:"Observatie",openOverviewBtn:"Overzicht",openSettingsBtn:"Instellingen"};
    for (const [id,label] of Object.entries(labels)) {
      const button = document.getElementById(id);
      const title = button?.querySelector(".tile-copy strong");
      const icon = button?.querySelector(".tile-icon");
      if (title) title.textContent = label;
      if (icon && TILE_ICONS[id]) icon.innerHTML = TILE_ICONS[id];
    }
  }

  function revokePhoto(photo) {
    if (photo?.url) URL.revokeObjectURL(photo.url);
  }

  function clearObservationPhotos() {
    observationPhotos.forEach(revokePhoto);
    observationPhotos = [];
    const input = document.getElementById("observationPhotoInput");
    if (input) input.value = "";
    renderPhotoPreviews();
  }

  function photoSize(bytes) {
    if (bytes < 1024 * 1024) return Math.max(1,Math.round(bytes / 1024)) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function renderPhotoPreviews(message) {
    const grid = document.getElementById("observationPhotoGrid");
    const status = document.getElementById("observationPhotoStatus");
    if (!grid || !status) return;
    grid.replaceChildren();
    observationPhotos.forEach((photo,index) => {
      const card = document.createElement("figure");
      card.className = "observation-photo-card";
      const img = document.createElement("img");
      img.src = photo.url;
      img.alt = "Preview van fotobijlage " + (index + 1);
      const caption = document.createElement("figcaption");
      const name = document.createElement("span");
      name.textContent = photo.file.name || "Foto " + (index + 1);
      const meta = document.createElement("small");
      meta.textContent = photoSize(photo.file.size);
      caption.append(name,meta);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "photo-remove-button";
      remove.setAttribute("aria-label", "Verwijder " + (photo.file.name || "foto"));
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        revokePhoto(photo);
        observationPhotos.splice(index,1);
        renderPhotoPreviews("Foto verwijderd.");
      });
      card.append(img,caption,remove);
      grid.appendChild(card);
    });
    status.textContent = message || (observationPhotos.length ? observationPhotos.length + " van maximaal " + MAX_PHOTOS + " foto's lokaal toegevoegd." : "Nog geen foto's toegevoegd.");
  }

  function addObservationPhotos(fileList) {
    let rejected = 0;
    for (const file of [...fileList]) {
      if (observationPhotos.length >= MAX_PHOTOS) { rejected += 1; continue; }
      if (!file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES) { rejected += 1; continue; }
      observationPhotos.push({file,url:URL.createObjectURL(file)});
    }
    renderPhotoPreviews(rejected ? "Sommige bestanden zijn niet toegevoegd. Maximaal 6 afbeeldingen van maximaal 10 MB per foto." : undefined);
  }

  function installPhotoUpload() {
    const covertView = document.getElementById("covertView");
    if (!covertView || document.getElementById("observationPhotoPanel")) return;
    const section = covertView.querySelector(".app-section");
    const actions = section?.querySelector(".view-actions");
    if (!section || !actions) return;

    const panel = document.createElement("section");
    panel.id = "observationPhotoPanel";
    panel.className = "observation-photo-panel";
    panel.setAttribute("aria-labelledby", "observationPhotoTitle");
    panel.innerHTML = '<div class="photo-panel-heading"><div><span class="section-kicker">Bijlagen</span><h2 id="observationPhotoTitle">Foto\'s</h2></div><span class="photo-local-badge">Alleen lokaal</span></div><p class="photo-help">Voeg alleen beeld toe wanneer dit noodzakelijk en toegestaan is voor de waarneming. Foto\'s blijven in deze sessie op het apparaat en worden niet automatisch verzonden.</p><div class="photo-upload-row"><label class="photo-upload-button" for="observationPhotoInput"><span aria-hidden="true">＋</span> Foto\'s toevoegen</label><input id="observationPhotoInput" class="photo-file-input" type="file" accept="image/*" multiple><button type="button" id="clearObservationPhotos" class="photo-clear-button">Alles verwijderen</button></div><p id="observationPhotoStatus" class="photo-status" role="status">Nog geen foto\'s toegevoegd.</p><div id="observationPhotoGrid" class="observation-photo-grid" aria-live="polite"></div><p class="photo-export-note">PGA-x demo-export bevat alleen metadata van deze bijlagen; de afbeeldingsbestanden zelf worden niet meegestuurd.</p>';
    section.insertBefore(panel,actions);

    document.getElementById("observationPhotoInput")?.addEventListener("change", event => addObservationPhotos(event.target.files || []));
    document.getElementById("clearObservationPhotos")?.addEventListener("click", clearObservationPhotos);
  }

  function fieldValue(id) { return document.getElementById(id)?.value || ""; }

  function buildPgaXPayload() {
    const observations = [...document.querySelectorAll(".observation-card")].map(card => ({id:card.dataset.itemId||"",status:card.dataset.status||"unknown",observation:card.querySelector(".observation-text")?.textContent||"",note:card.querySelector("textarea")?.value||""}));
    const likelihood = [...document.querySelectorAll(".likelihood-card")].map(card => ({domain:card.querySelector(".likelihood-card-top span")?.textContent||"",indication:card.querySelector(".likelihood-card-top strong")?.textContent||""}));
    const covertFields = ["covertCaseCode","covertObservedAt","covertLocation","covertDuration","covertThirdPartyControl","covertExchange","covertArrivals","covertVehicles","covertPattern","covertAds","covertNotes"];
    const photoAttachments = observationPhotos.map((photo,index) => ({index:index+1,name:photo.file.name||("foto-"+(index+1)),type:photo.file.type,sizeBytes:photo.file.size,includedInExport:false}));
    return {
      exportType:"PGA-x prototype export",prototype:true,transmitted:false,generatedAt:new Date().toISOString(),source:"Signalencheck Mensenhandel – Gemeente Emmen onderzoeksprototype",
      warning:"Demo-export. Dit bestand is niet naar PGA-x verzonden en vormt geen operationele koppeling. Fotobijlagen worden niet meegestuurd.",
      controlContext:{caseCode:fieldValue("caseCode"),observedAt:fieldValue("observedAt"),observer:fieldValue("observer"),location:fieldValue("location"),controlType:fieldValue("controlType"),locationType:fieldValue("locationType"),acuteConcern:fieldValue("acuteConcern")},
      observations,likelihood,covertObservation:Object.fromEntries(covertFields.map(id => [id,fieldValue(id)])),photoAttachments
    };
  }

  function downloadPgaXDemo() {
    const payload = buildPgaXPayload();
    const blob = new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const caseCode = payload.controlContext.caseCode.trim().replace(/[^a-z0-9_-]+/gi,"-") || "check";
    link.download = "pga-x-demo-export-" + caseCode + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url),60000);
    const status = document.getElementById("pgaXExportStatus");
    if (status) status.textContent = "Demo-export aangemaakt. Er is niets naar PGA-x verzonden.";
  }

  function installPgaXDemo() {
    const toolbar = document.querySelector("#reportView .report-toolbar .actions");
    if (!toolbar || document.getElementById("pgaXExportBtn")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.id = "pgaXExportBtn";
    button.className = "pga-x-export-button";
    button.textContent = "Exporteren naar PGA-x";
    button.addEventListener("click",downloadPgaXDemo);
    toolbar.appendChild(button);
    const status = document.createElement("p");
    status.id = "pgaXExportStatus";
    status.className = "pga-x-export-status";
    status.setAttribute("role","status");
    status.textContent = "Prototypekoppeling: export wordt als bestand aangemaakt en niet extern verzonden.";
    toolbar.parentElement?.appendChild(status);
  }

  function applyEnhancements() {
    ensureStylesheet();
    moveLikelihoodToBottom();
    groupObservationCards();
    simplifyHomeDashboard();
    polishObservationLabels();
    installPhotoUpload();
    installPgaXDemo();
  }

  function bindPostRenderHooks() {
    for (const id of ["openCheckBtn","newCheckBtn","resumeBtn","covertToCheckBtn"]) document.getElementById(id)?.addEventListener("click",applyEnhancements);
    for (const button of document.querySelectorAll('[data-mobile-view="check"]')) button.addEventListener("click",applyEnhancements);
    document.getElementById("jumpUnansweredBtn")?.addEventListener("click",revealAttentionCard);
    document.getElementById("newCheckBtn")?.addEventListener("click",clearObservationPhotos);
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyEnhancements();
    bindPostRenderHooks();
    const host = document.getElementById("observationsMount");
    if (!host) return;
    const observer = new MutationObserver(applyEnhancements);
    observer.observe(host,{childList:true,subtree:false});
  });

  window.addEventListener("pagehide", () => observationPhotos.forEach(revokePhoto));
})();