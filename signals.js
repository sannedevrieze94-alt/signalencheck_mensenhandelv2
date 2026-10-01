/* Signalencheck 4.0 — één gecombineerde observatielijst met voorlopige domeingewichten. */
(function (root) {
  "use strict";

  const catalog = {
    version: "4.0.0-prototype",
    domains: [
      {id: "arbeid", title: "Arbeidsuitbuiting", short: "Arbeid"},
      {id: "seksueel", title: "Seksuele uitbuiting", short: "Seksueel"},
      {id: "crimineel", title: "Criminele uitbuiting", short: "Crimineel"}
    ],
    sections: [
      {
        id: "observations",
        title: "Mogelijke waarnemingen",
        description: "Beoordeel iedere waarneming met Ja of Nee. Dezelfde waarneming kan voor meerdere vormen van uitbuiting relevant zijn.",
        items: [
          {id:"obs-control-third-party", text:"De persoon lijkt onder controle of sturing van een derde te staan.", weights:{arbeid:1,seksueel:3,crimineel:3}, sourceIds:["seksueel-specific-1","crimineel-specific-2"]},
          {id:"obs-no-access-resources", text:"De persoon kan niet vrij beschikken over eigen identiteitsbewijs, telefoon, geld of andere persoonlijke middelen.", weights:{arbeid:2,seksueel:2,crimineel:1}, sourceIds:["arbeid-specific-5","seksueel-specific-2"]},
          {id:"obs-no-work-autonomy", text:"De persoon heeft weinig of geen zeggenschap over werktijden, inkomsten of wanneer het werk stopt.", weights:{arbeid:3,seksueel:2,crimineel:1}, sourceIds:["arbeid-specific-10","seksueel-specific-3"]},
          {id:"obs-dangerous-work", text:"De persoon moet gevaarlijk, ongezond of lichamelijk zeer belastend werk verrichten.", weights:{arbeid:3,seksueel:0,crimineel:0}, sourceIds:["arbeid-specific-1"]},
          {id:"obs-extreme-hours", text:"De persoon maakt structureel extreem lange werkdagen of werkt zonder normale rustmomenten.", weights:{arbeid:3,seksueel:0,crimineel:0}, sourceIds:["arbeid-specific-2"]},
          {id:"obs-underpaid", text:"De persoon krijgt niet, nauwelijks of duidelijk te weinig betaald voor verrichte arbeid.", weights:{arbeid:4,seksueel:0,crimineel:0}, sourceIds:["arbeid-specific-3"]},
          {id:"obs-delayed-pay", text:"Betaling wordt structureel uitgesteld of loon wordt achtergehouden.", weights:{arbeid:2,seksueel:0,crimineel:0}, sourceIds:["arbeid-specific-4"]},
          {id:"obs-false-promises", text:"De persoon is met misleidende of valse beloften over werk, inkomen of omstandigheden geworven of verplaatst.", weights:{arbeid:2,seksueel:1,crimineel:0}, sourceIds:["arbeid-specific-6"]},
          {id:"obs-threat-violence", text:"Er zijn aanwijzingen voor bedreiging, intimidatie, chantage, mishandeling of andere dwang.", weights:{arbeid:3,seksueel:3,crimineel:3}, sourceIds:["arbeid-specific-7","seksueel-specific-6","crimineel-specific-5"]},
          {id:"obs-debt-position", text:"De persoon heeft een schuldpositie of wordt onder druk gezet vanwege een schuld of vermeende verplichting.", weights:{arbeid:2,seksueel:1,crimineel:2}, sourceIds:["arbeid-specific-8","crimineel-specific-5"]},
          {id:"obs-dependent-basic-needs", text:"De persoon is voor huisvesting, vervoer, eten of andere basisvoorzieningen sterk afhankelijk van een derde.", weights:{arbeid:3,seksueel:2,crimineel:2}, sourceIds:["arbeid-specific-9","seksueel-specific-8","crimineel-specific-4"]},
          {id:"obs-coerced-sex", text:"De persoon lijkt gedwongen of onder druk gezet tot seksuele handelingen of prostitutie.", weights:{arbeid:0,seksueel:4,crimineel:0}, sourceIds:["seksueel-specific-4"]},
          {id:"obs-minor-vulnerable", text:"De persoon is minderjarig of bevindt zich in een duidelijk kwetsbare positie die door een ander kan worden benut.", weights:{arbeid:1,seksueel:2,crimineel:4}, sourceIds:["seksueel-specific-5","crimineel-specific-2"]},
          {id:"obs-surrender-money-goods", text:"De persoon moet verdiend geld, opbrengsten of goederen aan een ander afstaan.", weights:{arbeid:1,seksueel:4,crimineel:3}, sourceIds:["seksueel-specific-7","crimineel-specific-6"]},
          {id:"obs-restricted-transport-stay", text:"De persoon kan niet vrij beschikken over vervoer, verblijfplaats of verplaatsingen.", weights:{arbeid:1,seksueel:2,crimineel:2}, sourceIds:["seksueel-specific-8","crimineel-specific-4"]},
          {id:"obs-fear-exploiter", text:"De persoon toont angst voor een begeleider, partner, werkgever, opdrachtgever of exploitant.", weights:{arbeid:1,seksueel:2,crimineel:2}, sourceIds:["seksueel-specific-9"]},
          {id:"obs-cannot-speak-alone", text:"De persoon krijgt geen of weinig ruimte om zelfstandig te spreken of wordt tijdens gesprekken gecontroleerd.", weights:{arbeid:1,seksueel:1,crimineel:1}, sourceIds:["seksueel-specific-10"]},
          {id:"obs-criminal-tasks", text:"De persoon voert risicovolle of strafbare taken uit voor een ander.", weights:{arbeid:0,seksueel:0,crimineel:4}, sourceIds:["crimineel-specific-1"]},
          {id:"obs-young-directed-older", text:"Een jonge of kwetsbare persoon lijkt opdrachten of aanwijzingen te krijgen van een oudere of dominante derde.", weights:{arbeid:0,seksueel:1,crimineel:4}, sourceIds:["crimineel-specific-2"]},
          {id:"obs-risk-location", text:"De persoon is zonder duidelijke zelfstandige reden aanwezig op een risicolocatie of in een risicovolle context.", weights:{arbeid:0,seksueel:0,crimineel:2}, sourceIds:["crimineel-specific-3"]},
          {id:"obs-multiple-phones-hidden-tasks", text:"Er is sprake van meerdere telefoons, koeriersbewegingen, afgeschermde opdrachten of verborgen taken.", weights:{arbeid:0,seksueel:0,crimineel:2}, sourceIds:["crimineel-specific-7"]},
          {id:"obs-unclear-role", text:"De persoon kan geen duidelijke of consistente uitleg geven over de eigen rol, opdracht of aanwezigheid.", weights:{arbeid:0,seksueel:0,crimineel:1}, sourceIds:["crimineel-specific-8"]},
          {id:"obs-cannot-stop-leave", text:"De persoon lijkt niet vrij te zijn om te stoppen, weg te gaan of zich aan de situatie te onttrekken.", weights:{arbeid:3,seksueel:3,crimineel:3}, sourceIds:["arbeid-specific-10","crimineel-specific-9"]},
          {id:"obs-drugs-theft-mule", text:"De persoon is betrokken bij drugs, diefstal, fraude, geldezelconstructies, explosieven of andere strafbare uitvoer voor derden.", weights:{arbeid:0,seksueel:0,crimineel:4}, sourceIds:["crimineel-specific-10"]},
          {id:"obs-sex-work-managed", text:"Een derde regelt of bepaalt advertenties, klanten, afspraken, prijzen, locaties of werktijden binnen sekswerk.", weights:{arbeid:0,seksueel:3,crimineel:0}, sourceIds:["seksueel-specific-1","seksueel-specific-3"]}
        ]
      },
      {
        id: "environment",
        title: "Omgevings- en dossierinformatie",
        description: "Deze informatie telt bewust lichter mee dan directe waarnemingen.",
        items: [
          {id:"env-multiple-reports", text:"Er zijn meerdere meldingen over dezelfde locatie, persoon, onderneming of situatie.", weights:{arbeid:1,seksueel:1,crimineel:1}, sourceIds:["arbeid-environment-1","seksueel-environment-1","crimineel-environment-1"]},
          {id:"env-enforcement-history", text:"Er is relevante bestuurlijke, strafrechtelijke of handhavingsgeschiedenis.", weights:{arbeid:1,seksueel:1,crimineel:1}, sourceIds:["arbeid-environment-2","seksueel-environment-2","crimineel-environment-2"]},
          {id:"env-dossier-control-combination", text:"Dossierinformatie en actuele controlebevindingen versterken elkaar of laten een terugkerend patroon zien.", weights:{arbeid:1,seksueel:1,crimineel:1}, sourceIds:["arbeid-environment-3","seksueel-environment-3","crimineel-environment-3"]},
          {id:"env-labour-risk-location", text:"De locatie of onderneming past binnen een bekend lokaal of regionaal risicobeeld voor arbeidsuitbuiting.", weights:{arbeid:2,seksueel:0,crimineel:0}, sourceIds:["arbeid-environment-4"]},
          {id:"env-sex-risk-location", text:"De locatie past binnen een relevante prostitutie-, zorg- of overlastcontext.", weights:{arbeid:0,seksueel:2,crimineel:0}, sourceIds:["seksueel-environment-4"]},
          {id:"env-youth-undermining-location", text:"De locatie of situatie is bekend in relatie tot ondermijning, jeugdcriminaliteit of jonge aanwas.", weights:{arbeid:0,seksueel:0,crimineel:2}, sourceIds:["crimineel-environment-4"]},
          {id:"env-address-work-living", text:"Er is een onduidelijke woon-werkconstructie, veel adreswisselingen of een sterke koppeling tussen werk en huisvesting.", weights:{arbeid:2,seksueel:1,crimineel:0}, sourceIds:["arbeid-environment-5"]},
          {id:"env-changing-persons", text:"Er is een onverklaarbaar patroon van wisselende personen, bezoekers of begeleiders op de locatie.", weights:{arbeid:0,seksueel:1,crimineel:1}, sourceIds:["seksueel-environment-5"]},
          {id:"env-partner-pattern", text:"Eerdere constateringen of informatie van ketenpartners wijzen op een terugkerend patroon.", weights:{arbeid:1,seksueel:1,crimineel:1}, sourceIds:["crimineel-environment-5"]}
        ]
      }
    ]
  };

  if (typeof module !== "undefined" && module.exports) module.exports = catalog;
  else root.APP_SIGNALS = catalog;
})(typeof globalThis !== "undefined" ? globalThis : this);
