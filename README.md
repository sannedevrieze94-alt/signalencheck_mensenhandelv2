# Signalencheck Mensenhandel

**Versie 3.5.0-prototype — uitsluitend fictieve oefencasuïstiek.**

Onderzoeksprototype van Sanne de Vrieze voor het afstudeeronderzoek Integrale Veiligheidskunde. De app ondersteunt het oefenen met signalenherkenning, feitelijke verslaglegging en professionele duiding rond arbeidsuitbuiting, seksuele uitbuiting en criminele uitbuiting.

Dit is geen officieel gemeentelijk registratiesysteem. De inhoud, scoremethodiek en lokale werkafspraken moeten vóór praktijkgebruik inhoudelijk, juridisch, privacy-technisch en organisatorisch worden vastgesteld.

## Nieuw in 3.5

- De drie uitbuitingsvormen worden **los van elkaar beoordeeld en gerapporteerd**.
- Alleen de vorm(en) waarin daadwerkelijk signalen zijn beoordeeld komen inhoudelijk in het rapport terug.
- Pas wanneer alle drie de vormen zijn beoordeeld verschijnt daarnaast een integrale samenvatting.
- De rapportage is omgebouwd van een technisch overzicht naar een **toezichthoudersrapportage in lopende tekst**.
- De rapportage opent met de hoedanigheid van toezichthouder als bedoeld in artikel 5:11 Awb en beschrijft vervolgens tijdstip, locatie, type controle, waarnemingen, verklaringen, context, signalen, score, duiding en opvolging.
- De indicatieve score is progressief in plaats van lineair.
- Losse module **Heimelijke waarneming** toegevoegd.
- Heimelijke waarneming kan onder meer vastleggen: observatieperiode, aanloop/bezoekbewegingen, aantal waargenomen personen, koppeling met een publieke advertentiebron zoals Kinky.nl, aantal en duur van bezoeken, patronen, kentekens, feitelijk waarneembare persoonskenmerken en aanvullende observatienotities.
- De heimelijke module wordt alleen in de rapportage opgenomen wanneer deze daadwerkelijk is geactiveerd.
- PWA-cache en appversie zijn bijgewerkt naar `3.5.0-prototype`.

## Indicatieve score

De score wordt **per uitbuitingsvorm** berekend met:

`score = 0,5 × n^1,45`

waarbij `n` het aantal waargenomen signalen binnen die uitbuitingsvorm is. De uitkomst wordt afgerond op 0,25 punt.

Voorbeelden:

| Waargenomen signalen | Score |
|---:|---:|
| 0 | 0 |
| 1 | 0,5 |
| 2 | 1,25 |
| 3 | 2,5 |
| 4 | 3,75 |
| 5 | 5,25 |
| 10 | 14 |
| 20 | 38,5 |

Iedere uitbuitingsvorm bevat 20 signaalregels en heeft daarmee in deze prototypeformule een theoretisch maximum van 38,5. Alleen wanneer alle drie de vormen zijn beoordeeld wordt daarnaast een integrale somscore weergegeven.

De formule is een **onderzoeksindex**, geen gevalideerd kanspercentage op mensenhandel. De formule weegt nog niet afzonderlijk voor overlap, ernst, afhankelijkheid tussen signalen of alternatieve verklaringen. Een afzonderlijk ernstig signaal kan dus professionele opvolging vereisen ongeacht de totaalscore.

## Rapportagelogica

- Alleen arbeidsuitbuiting beoordeeld → alleen arbeidsuitbuiting inhoudelijk in rapport.
- Alleen seksuele uitbuiting beoordeeld → alleen seksuele uitbuiting inhoudelijk in rapport.
- Twee vormen beoordeeld → beide vormen afzonderlijk in rapport, zonder integrale totaalscore.
- Alle drie beoordeeld → drie afzonderlijke vormparagrafen plus integrale samenvatting.

De rapportage bevat per beoordeelde vorm:

- aantal beoordeelde signalen;
- aantal waargenomen, niet-waargenomen en onbekende signalen;
- vormspecifieke indicatieve score;
- lijst van waargenomen signalen met bron/toelichting;
- professionele duiding en voorgestelde opvolging.

## Heimelijke waarneming

De module is een losse optie en staat standaard uit. Wanneer geactiveerd kunnen in de oefencasus worden vastgelegd:

- start en einde observatie;
- aanloop/bezoekbewegingen;
- aantal waargenomen vrouwen/personen passend bij de onderzochte context;
- herleidbaarheid naar een publieke advertentiebron;
- naam van de publieke bron, bijvoorbeeld Kinky.nl;
- fictieve advertentie-/profielverwijzing;
- aantal geregistreerde bezoeken;
- duur van bezoeken en tijdspatroon;
- terugkerende patronen;
- fictieve kentekens;
- feitelijk waarneembare persoonskenmerken, bijvoorbeeld geschatte leeftijdscategorie, lengte, kleding, haarkleur en opvallende kenmerken;
- aanvullende feitelijke observatienotities.

Voor echte casussen kunnen kentekens, persoonskenmerken en advertentiegegevens herleidbare persoonsgegevens zijn. De productievariant mag deze daarom pas verwerken nadat doel, grondslag, toegang, bewaartermijnen, beveiliging en lokale werkafspraken zijn vastgesteld.

## Gebruik

1. Vul de fictieve controlecontext in.
2. Activeer zo nodig de losse module Heimelijke waarneming en leg feitelijke observaties vast.
3. Beoordeel één of meer uitbuitingsvormen.
4. Leg bij waargenomen signalen de feitelijke bron of waarneming vast.
5. Beschrijf professionele duiding en voorgestelde opvolging.
6. Bevestig dat uitsluitend fictieve oefengegevens zijn gebruikt.
7. Stel de rapportage op en controleer de tekst vóór export of afdruk.

Bij direct gevaar geldt de lokale noodprocedure, zo nodig 112. Wacht nooit op een score, minimumaantal signalen of rapport.

## Validatie

De 60 signaalregels staan in `signals.js`. De werkmatrix voor bron- en inhoudsvalidatie staat in `docs/VALIDATIEMATRIX.md`. De primaire bronkoppeling per afzonderlijk signaal is nog niet volledig vastgesteld. De validatiematrix doet daarom geen uitspraak over voorspellende waarde of slachtofferschap.

De scoreformule is bewust transparant maar nog niet empirisch gevalideerd. In het afstudeeronderzoek kan worden onderzocht of de score bruikbaar en begrijpelijk is, welke signalen overlappen en of verschillende signalen inhoudelijk verschillend zouden moeten wegen.

## Gegevens en beveiliging

Antwoorden staan uitsluitend in het JavaScript-geheugen van de actieve pagina. Er is geen `localStorage`, IndexedDB, invoer-API, serverdatabase of automatische overdracht. De service worker cachet alleen vaste appbestanden. Exports vallen daarna buiten de app en moeten afzonderlijk worden beheerd.

## Android en iOS

De app is technisch opgezet als Progressive Web App (PWA).

- Android: open de HTTPS-versie in Chrome en kies `App installeren` of `Toevoegen aan startscherm`.
- iPhone: open in Safari, kies `Delen` en `Zet op beginscherm`.

Een latere App Store- of Google Play-versie kan bijvoorbeeld via Capacitor worden verpakt, maar daarvoor zijn aanvullende native bouw-, ondertekenings-, test- en distributiestappen nodig.

## Belangrijkste bestanden

| Bestand | Functie |
|---|---|
| `index.html` | App-shell en vaste scherminhoud |
| `styles.css` | Basisopmaak en afdrukregels |
| `effects.css` | Appvormgeving, dashboard, branding en mobiele navigatie |
| `signals.js` | 60 signaalregels met stabiele ID's |
| `model.js` | Statussen, vormscores, snapshots en rapportagetekst |
| `script.js` | UI-logica, vormspecifiek dashboard, heimelijke module, export en PWA |
| `docs/VALIDATIEMATRIX.md` | Werkmatrix voor bron- en signaalvalidatie |
| `docs/ONDERZOEK.md` | Onderzoeksverantwoording en voorwaarden voor vervolg |
| `tests/` | Regressiecontroles |

## Controleren

Met Node.js 18 of nieuwer:

```sh
node tests/core.test.js
node tests/ui.test.js
node tests/pwa.test.js
```

Deze tests vervangen geen inhoudelijke validatie, juridische/privacybeoordeling, browser- en toesteltest of formele gemeentelijke vrijgave.
