(function () {
  "use strict";

  const CATEGORY_CONFIG = [
    {
      id: "control-dependency",
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

  function groupObservationCards() {
    if (grouping) return;
    const host = document.getElementById("observationsMount");
    if (!host || !host.children.length) return;

    const mainSection = directChildren(host, "observation-section")
      .find(section => section.querySelector("#card-obs-control-third-party"));
    if (!mainSection || mainSection.dataset.categorized === "true") return;

    grouping = true;
    const mainHead = directChildren(mainSection, "observation-section-head")[0] || null;
    const cards = new Map(
      directChildren(mainSection, "observation-card").map(card => [card.dataset.itemId, card])
    );

    if (mainHead) {
      const title = mainHead.querySelector("h3");
      const description = mainHead.querySelector("p");
      if (title) title.textContent = "Mogelijke waarnemingen";
      if (description) description.textContent = "Beoordeel de waarnemingen per thema. De categorie is alleen bedoeld voor overzicht; iedere waarneming kan achter de schermen voor meerdere vormen van uitbuiting meewegen.";
    }

    for (const category of CATEGORY_CONFIG) {
      const group = document.createElement("section");
      group.className = "observation-category";
      group.dataset.category = category.id;
      group.appendChild(makeHeader(category));
      for (const id of category.items) {
        const card = cards.get(id);
        if (card) group.appendChild(card);
      }
      mainSection.appendChild(group);
    }

    const remaining = [...cards.values()].filter(card => card.parentElement === mainSection);
    if (remaining.length) {
      const group = document.createElement("section");
      group.className = "observation-category";
      group.dataset.category = "other";
      group.appendChild(makeHeader({title:"Overige waarnemingen", description:"Aanvullende waarnemingen die nog niet in een thematische categorie zijn ondergebracht."}));
      remaining.forEach(card => group.appendChild(card));
      mainSection.appendChild(group);
    }

    mainSection.dataset.categorized = "true";
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