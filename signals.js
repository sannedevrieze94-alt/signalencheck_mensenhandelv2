/* Signalencheck v4 — één gecombineerde lijst van mogelijke waarnemingen.
   Algemene gedragsindicatoren zijn verwijderd; specifieke en omgevings-/dossiersignalen blijven.
   weights = relatieve bijdrage aan het niet-gevalideerde signaalprofiel, géén kansgewicht. */
(function (root) {
  "use strict";
  const observations = [
    {id:"obs-dangerous-work", type:"observation", text:"Persoon moet gevaarlijk of ongezond werk uitvoeren", weights:{arbeid:3}},
    {id:"obs-long-hours", type:"observation", text:"Persoon maakt structureel extreem lange werkdagen", weights:{arbeid:3}},
    {id:"obs-underpaid", type:"observation", text:"Persoon wordt niet of duidelijk te weinig betaald", weights:{arbeid:4}},
    {id:"obs-payment-delay", type:"observation", text:"Persoon moet lang wachten op betaling", weights:{arbeid:2}},
    {id:"obs-documents-control", type:"observation", text:"Persoon kan niet vrij beschikken over paspoort of identiteitsbewijs", weights:{arbeid:3,seksueel:2,crimineel:1}},
    {id:"obs-false-promises", type:"observation", text:"Persoon is met aantoonbaar valse beloften over werk, inkomsten of verblijf geworven of verplaatst", weights:{arbeid:3,seksueel:1}},
    {id:"obs-threat-violence", type:"observation", text:"Er zijn aanwijzingen van bedreiging, chantage, mishandeling of andere dwang door een werkgever of derde", weights:{arbeid:4,seksueel:4,crimineel:4}},
    {id:"obs-debt", type:"observation", text:"Persoon heeft een schuldpositie bij werkgever, bemiddelaar, exploitant of andere derde", weights:{arbeid:3,seksueel:1,crimineel:2}},
    {id:"obs-dependent-basics", type:"observation", text:"Persoon is sterk afhankelijk van een derde voor huisvesting, vervoer, eten of andere basisvoorzieningen", weights:{arbeid:3,seksueel:2,crimineel:3}},
    {id:"obs-cannot-stop", type:"observation", text:"Persoon lijkt niet vrij om te stoppen, te vertrekken of zich aan de situatie te onttrekken", weights:{arbeid:4,seksueel:4,crimineel:4}},
    {id:"obs-third-control", type:"observation", text:"Een derde bepaalt aantoonbaar belangrijke keuzes, contacten, werkzaamheden of bewegingen van de persoon", weights:{arbeid:2,seksueel:4,crimineel:4}},
    {id:"obs-access-money-phone", type:"observation", text:"Persoon heeft geen vrije toegang tot eigen geld, telefoon of belangrijke persoonlijke middelen", weights:{arbeid:2,seksueel:3,crimineel:2}},
    {id:"obs-work-income-control", type:"observation", text:"Persoon heeft geen reële zeggenschap over werktijden, werkzaamheden of eigen inkomsten", weights:{arbeid:3,seksueel:4}},
    {id:"obs-forced-sex", type:"observation", text:"Er zijn aanwijzingen dat persoon wordt gedwongen tot seksuele handelingen of prostitutie", weights:{seksueel:5}},
    {id:"obs-minor-vulnerable", type:"observation", text:"Betrokkene is minderjarig of aantoonbaar in een kwetsbare positie die door een derde kan worden benut", weights:{arbeid:1,seksueel:3,crimineel:4}},
    {id:"obs-hand-over-proceeds", type:"observation", text:"Persoon moet inkomsten, opbrengsten of goederen afgeven aan een ander", weights:{arbeid:2,seksueel:4,crimineel:4}},
    {id:"obs-transport-residence-control", type:"observation", text:"Persoon kan niet vrij beschikken over vervoer of verblijfplaats", weights:{arbeid:2,seksueel:3,crimineel:3}},
    {id:"obs-fear-third", type:"observation", text:"Persoon toont concrete angst voor een begeleider, partner, werkgever, exploitant of andere derde", weights:{arbeid:2,seksueel:3,crimineel:3}},
    {id:"obs-cannot-speak-alone", type:"observation", text:"Persoon krijgt geen reële ruimte om zelfstandig of buiten aanwezigheid van een derde te spreken", weights:{arbeid:2,seksueel:3,crimineel:3}},
    {id:"obs-criminal-task", type:"observation", text:"Persoon voert risicovolle of strafbare taken uit ten behoeve van anderen", weights:{crimineel:5}},
    {id:"obs-young-directed", type:"observation", text:"Jonge of kwetsbare persoon wordt zichtbaar gestuurd, opgehaald, gebracht of geïnstrueerd door een oudere of machtigere derde", weights:{crimineel:5}},
    {id:"obs-risk-location", type:"observation", text:"Persoon is zonder duidelijke eigen reden aanwezig op een locatie die direct samenhangt met strafbare activiteiten", weights:{crimineel:2}},
    {id:"obs-multiple-phones-courier", type:"observation", text:"Er zijn aanwijzingen van koeriersbewegingen, verborgen opdrachten of gebruik van meerdere telefoons ten behoeve van anderen", weights:{crimineel:3}},
    {id:"obs-criminal-role", type:"observation", text:"Persoon is betrokken bij drugs-, diefstal-, fraude-, explosieven-, geldezel- of vergelijkbare constructies voor anderen", weights:{crimineel:5}},

    {id:"env-multiple-reports", type:"environment", text:"Er zijn meerdere relevante meldingen over de locatie, persoon, onderneming of betrokkenen", weights:{arbeid:1,seksueel:1,crimineel:1}},
    {id:"env-enforcement-history", type:"environment", text:"Er is relevante bestuurlijke, toezicht- of handhavingsgeschiedenis", weights:{arbeid:1,seksueel:1,crimineel:1}},
    {id:"env-dossier-control-combo", type:"environment", text:"Dossierinformatie sluit aan op meerdere actuele waarnemingen uit deze controle", weights:{arbeid:1,seksueel:1,crimineel:1}},
    {id:"env-labor-risk", type:"environment", text:"De locatie of constructie is bekend in relatie tot arbeidsrisico's, afhankelijk wonen/werken of veel adreswisselingen", weights:{arbeid:2}},
    {id:"env-sex-risk", type:"environment", text:"De locatie of situatie is bekend binnen prostitutie-, zorg- of overlastcontext of kent onverklaarbaar wisselende personen", weights:{seksueel:2}},
    {id:"env-youth-undermining", type:"environment", text:"De locatie, groep of persoon is bekend in relatie tot ondermijning, jeugdcriminaliteit of jonge aanwas", weights:{crimineel:2}},
    {id:"env-partner-pattern", type:"environment", text:"Partnerinformatie of eerdere constateringen laten een terugkerend relevant patroon zien", weights:{arbeid:1,seksueel:1,crimineel:2}}
  ];
  if (typeof module !== "undefined" && module.exports) module.exports = observations;
  else root.APP_OBSERVATIONS = observations;
})(typeof globalThis !== "undefined" ? globalThis : this);
