# Signalencheck Mensenhandel

**Versie 3.4.0-prototype — uitsluitend fictieve oefencasuïstiek.**

Onderzoeksprototype van Sanne de Vrieze, voortbouwend op het eerdere derdejaarsproduct. De app ondersteunt oefenen met signalenherkenning, het onderscheiden van waarneming en interpretatie en gestructureerde verslaglegging. Dit is geen officieel gemeentelijk registratiesysteem en de score is niet gevalideerd als kansberekening of bewijs van mensenhandel.

## Nieuw in 3.4

- Correcter herkenbaar Gemeente Emmen-beeldmerk in de header, gebaseerd op het publiek gebruikte rode pijlenbeeld en woordmerk.
- Een verder uitgewerkte app-shell met compacter dashboard, sterkere hiërarchie, mobiele bottom-navigation, appknoppen en verfijnde responsive weergave.
- Een **indicatieve risicoscore van 0–60**: iedere waargenomen signaalregel telt als 1 punt.
- De risicoscore loopt live mee met de invoer en wordt opgenomen in het oefenrapport.
- De score toont ook hoeveel van de 60 signalen daadwerkelijk zijn onderzocht, zodat een onvolledig beeld zichtbaar blijft.
- Geen laag/middel/hoog-labels en geen kanspercentage: daarvoor ontbreken gevalideerde gewichten en grenswaarden.
- Acute veiligheid blijft volledig losstaan van de totaalscore.
- Versie en PWA-cache zijn bijgewerkt naar `3.4.0-prototype`.

## Betekenis van de indicatieve risicoscore

De score is een transparante onderzoeksprototype-index:

`score = aantal waargenomen signaalregels`

De maximale score is 60. Niet waargenomen en onbekend/niet onderzocht leveren geen punten op.

Een hogere score betekent dus alleen dat **meer signaalregels zijn waargenomen**. De score is nog niet gevalideerd als maat voor de kans op uitbuiting. Signalen kunnen overlappen, verschillen in betekenis en ernst en alternatieve verklaringen hebben. Een score van bijvoorbeeld 20/60 betekent nadrukkelijk niet “33% kans op mensenhandel”.

De score is bedoeld om in het afstudeeronderzoek te kunnen toetsen of een eenvoudige oplopende totaalindicator gebruikers helpt samenhang te herkennen zonder professioneel oordeel te vervangen.

## Vervolg naar gebruik tijdens controles

De lokale registratie- en meldroute is nog niet bevestigd. Deze versie ondersteunt het ontwerpen en testen van de werkwijze, maar is niet vrijgegeven voor echte casusgegevens.

Voor praktijkgebruik zijn minimaal nodig:
- inhoudelijke validatie van de 60 signalen en hun bronnen;
- beoordeling van overlap en de betekenis van de prototype-score;
- vastgestelde gemeentelijke werkafspraken voor duiding, registratie en opvolging;
- privacy- en beveiligingsbeoordeling;
- browser-, toestel- en toegankelijkheidstesten;
- besluit over beheer en formele vrijgave.

## Gebruik

1. Gebruik uitsluitend een fictieve oefencasus en vul de controlecontext in.
2. Beoordeel relevante signalen. Niet onderzocht blijft `Onbekend`; `Niet waargenomen` betekent dat het signaal wel is onderzocht.
3. Leg per waargenomen signaal de bron of feitelijke waarneming vast.
4. Bekijk de indicatieve risicoscore en het signaalbeeld als samenvatting van de invoer, niet als automatisch oordeel.
5. Beschrijf professionele duiding, alternatieve verklaringen en voorgestelde opvolging.
6. Bevestig dat uitsluitend fictieve gegevens zijn gebruikt en stel het rapport op.
7. Controleer het rapport vóór downloaden of afdrukken.
8. Start een nieuwe check om sessiegegevens te wissen.

Bij direct gevaar geldt de lokale noodprocedure, zo nodig 112. Wacht nooit op een score, minimumaantal signalen of rapport.

## Validatiematrix 60 signalen

De werkmatrix staat in `docs/VALIDATIEMATRIX.md`. De repository bevat nog geen geverifieerde één-op-één-koppeling tussen ieder signaal en een primaire bron. Daarom staan de 60 regels inhoudelijk op **OPEN — niet geverifieerd** totdat daadwerkelijke inhoudelijke beoordeling heeft plaatsgevonden.

`Overlaprisico` in deze matrix betekent risico op inhoudelijke dubbeling/dubbel tellen. Het is geen risico op mensenhandel.

Voor criminele uitbuiting geldt bovendien dat de repository nog niet voor alle 20 regels bevestigt dat het signaal uitsluitend op jongeren ziet. Dat moet per signaal nog worden beoordeeld.

## Android en iOS

De repository bevat de technische basis voor een installeerbare **Progressive Web App (PWA)**.

- Android: open de HTTPS-versie in Chrome en kies `App installeren` of `Toevoegen aan startscherm`.
- iPhone: open in Safari, kies `Delen` en `Zet op beginscherm`.
- Antwoorden worden niet lokaal opgeslagen; een toestel kan een achtergrondvenster beëindigen.
- De service worker cachet uitsluitend vaste appbestanden, geen invoer of rapporten.
- Een latere App Store/Google Play-versie kan bijvoorbeeld via Capacitor worden verpakt, maar daarvoor zijn aparte native bouw-, ondertekenings- en distributiestappen nodig.

## Gegevens en beveiliging

Antwoorden staan uitsluitend in het JavaScript-geheugen van de actieve pagina. Er is geen `localStorage`, IndexedDB, antwoordcookie, analytics, invoer-API, serverdatabase of automatische overdracht. Exports staan daarna buiten de app en moeten afzonderlijk worden beheerd.

Het Gemeente Emmen-beeldmerk wordt gebruikt als herkenbare prototypecontext. Dat maakt deze versie niet automatisch tot een formeel gemeentelijk product of goedgekeurd registratiesysteem. Controleer interne huisstijl- en publicatieafspraken vóór formele ingebruikname.

## Belangrijkste bestanden

| Bestand | Functie |
|---|---|
| `index.html` | App-shell, invoer, dashboard, score, uitleg en rapportage |
| `styles.css` | Basisopmaak en afdrukregels |
| `effects.css` | Appvormgeving, mobiele navigatie, branding, dashboard en animaties |
| `signals.js` | 60 stabiele signaal-ID's; inhoud nog te valideren |
| `model.js` | Statussen, prototype-risicoscore, snapshots en rapporttekst |
| `script.js` | UI-logica, live score, tabs, export en PWA-registratie |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installatiemetadata, branding en offline appbestanden |
| `docs/VALIDATIEMATRIX.md` | Werkmatrix voor bron- en signaalvalidatie |
| `docs/ONDERZOEK.md` | Onderzoeksverantwoording, beperkingen en evaluatievoorstel |
| `tests/` | Regressiecontroles |

## Controleren

Met Node.js 18 of nieuwer:

```sh
node tests/core.test.js
node tests/ui.test.js
node tests/pwa.test.js
```

De tests bewijzen geen fysieke toestelcompatibiliteit, toegankelijkheid, formele inhoudelijke validatie of correct praktijkgebruik. Voer daarnaast de controles uit `docs/TESTPLAN.md` uit.
