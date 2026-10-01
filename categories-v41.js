(function () {
  "use strict";

  const CATEGORY_CONFIG = [
    {
      id: "control-dependency",
      tab: "Controle",
      title: "Controle & afhankelijkheid",
      description: "Waarnemingen over zeggenschap, bewegingsvrijheid, persoonlijke middelen en afhankelijkheid van derden.",
      items: [
        "obs-control-third-party",
        "obs-no-access-resources",
        "obs-dependent-basic-needs",
        "obs-restricted-transport-stay",
        "obs-cannot-speak-alone",
        "obs-cannot-stop-leave"
      ]
    },
    {
      id: "coercion-vulnerability",
      tab: "Dwang",
      title: "Dwang, kwetsbaarheid & misleiding",
      description: "Waarnemingen over druk, geweld, dreiging, schuld, misleiding en het benutten van een kwetsbare positie.",
      items: [
        "obs-false-promises",
        "obs-threat-violence",
        "obs-debt-position",
        "obs-minor-vulnerable",
        "obs-fear-exploiter"
      ]
    },
    {
      id: "labour",
      tab: "Arbeid",
      title: "Arbeid & arbeidsvoorwaarden",
      description: "Waarnemingen over werktijden, arbeidsomstandigheden, beloning en zeggenschap over het werk.",
      items: [
        "obs-no-work-autonomy",
        "obs-dangerous-work",
        "obs-extreme-hours",
        "obs-underpaid",
        "obs-delayed-pay"
      ]
    },
    {
      id: "sexual-exploitation",
      tab: "Sekswerk",
      title: "Sekswerk, inkomsten & seksuele uitbuiting",
      description: "Waarnemingen over seksuele dienstverlening, aansturing van sekswerk en het afstaan van opbrengsten.",
      items: [
        "obs-coerced-sex",
        "obs-surrender-money-goods",
        "obs-sex-work-managed"
      ]
    },
    {
      id: "criminal-exploitation",
      tab: "Criminele inzet",
      title: "Criminele inzet & jonge aanwas",
      description: "Waarnemingen over strafbare opdrachten, ronseling, koeriersbewegingen en inzet van jongeren of kwetsbare personen.",
      items: [
        "obs-criminal-tasks",
        "obs-young-directed-older",
        "obs-risk-location",
        "obs-multiple-phones-hidden-tasks",
        "obs-unclear-role",
        "obs-drugs-theft-mule"
      ]
    }
  ];

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

    panelData.forEach((data, index) => {
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
    const cards = new Map(
      directChildren(mainSection, "observation-card").map(card => [card.dataset.itemId, card])
    );
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
        if (card) {
          panel.appendChild(card);
          count += 1;
        }
      }
      panels.push(panel);
      panelData.push({...category, count});
    }

    const remaining = [...cards.values()].filter(card => card.parentElement === mainSection);
    if (remaining.length) {
      const category = {
        id: "other",
        tab: "Overig",
        title: "Overige waarnemingen",
        description: "Aanvullende waarnemingen die nog niet in een thematische categorie zijn ondergebracht."
      };
      const panel = document.createElement("section");
      panel.className = "observation-category";
      panel.dataset.category = category.id;
      panel.id = "observation-panel-" + category.id;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", "observation-tab-" + category.id);
      panel.appendChild(makeHeader(category));
      remaining.forEach(card => panel.appendChild(card));
      panels.push(panel);
      panelData.push({...category, count:remaining.length});
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
        if (h3) {
          const h4 = document.createElement("h4");
          h4.textContent = "Omgeving & dossier";
          h3.replaceWith(h4);
        }
      }
      const count = environmentSection.querySelectorAll(".observation-card").length;
      panels.push(environmentSection);
      panelData.push({id:"environment", tab:"Omgeving", title:"Omgeving & dossier", count});
    }

    const tabList = makeTabList(host, panelData);
    host.replaceChildren(tabList, ...panels);
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

  function applyEnhancements() {
    ensureStylesheet();
    moveLikelihoodToBottom();
    groupObservationCards();
  }

  function bindPostRenderHooks() {
    const ids = ["openCheckBtn", "newCheckBtn", "resumeBtn", "covertToCheckBtn"];
    for (const id of ids) {
      const button = document.getElementById(id);
      if (button) button.addEventListener("click", applyEnhancements);
    }
    for (const button of document.querySelectorAll('[data-mobile-view="check"]')) {
      button.addEventListener("click", applyEnhancements);
    }
    const jump = document.getElementById("jumpUnansweredBtn");
    if (jump) jump.addEventListener("click", revealAttentionCard);
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyEnhancements();
    bindPostRenderHooks();
    const host = document.getElementById("observationsMount");
    if (!host) return;
    const observer = new MutationObserver(applyEnhancements);
    observer.observe(host, {childList:true, subtree:false});
  });
})();