# Signalencheck Mensenhandel

**Versie 3.0.0-prototype — uitsluitend fictieve oefencasuïstiek.**

Onderzoeksprototype van Sanne de Vrieze, voortbouwend op het eerdere derdejaarsproduct. Ondersteunt oefenen met signalenherkenning, het onderscheiden van waarneming en interpretatie en gestructureerde verslaglegging. Geen officieel gemeentelijk registratiesysteem, gevalideerde risicobeoordeling of bewijs van mensenhandel.

## Wat is aangepast?

- De niet-gevalideerde gewichten, kansformule, trefwoorddetectie, risicoklassen en risicometers zijn verwijderd. Er worden aantallen invoerregels getoond; die zijn geen risicoscore.
- Elk signaal heeft drie antwoordmogelijkheden: waargenomen, niet waargenomen en onbekend/niet onderzocht. Standaard is onbekend.
- Antwoorden en bronnotities blijven behouden bij wisselen van vorm. Rapportage bevat alle drie vormen samen en vermeldt overlap als beperking.
- Elke wijziging maakt de rapportmomentopname ongeldig. Opstellen, downloaden en afdrukken gebruiken actuele invoer; de generatietijd blijft gelijk zolang de invoer niet wijzigt.
- Acute veiligheid staat los van het aantal signalen. Een lege check geeft geen laag-risico-oordeel.
- De demo-login, fictieve contactpersonen en het gemeentelogo zijn verwijderd om schijnbeveiliging en onbedoelde officiële status te voorkomen.
- Nieuwe check wist alle sessiegegevens na bevestiging. Eerdere exports worden niet verwijderd.
- Alle actieve opmaak staat in het gekoppelde styles.css.
- De externe jsPDF-afhankelijkheid is verwijderd. Afdrukken/PDF gebruikt browserpaginering; een volledig UTF-8-tekstrapport is apart downloadbaar.
- De app is voorbereid als PWA met manifest, iconen en een service worker voor uitsluitend vaste appbestanden.

## Starten

Geen buildstap of externe JavaScript-pakketten nodig. Serveer de repository als statische website. Voor lokale ontwikkeling bijvoorbeeld:

~~~sh
python3 -m http.server 8000
~~~

Open http://localhost:8000. Voor installatie op een telefoon is een HTTPS-adres nodig; een lokaal IP-adres via gewoon HTTP biedt niet dezelfde PWA-mogelijkheden. Direct openen via file:// is geen ondersteunde installatie-/offlinewerkwijze.

Publiceer pas een beoordeelde versie. Deze wijziging configureert of publiceert zelf geen hosting. Bij bestaande GitHub Pages kan na beoordeling de gewenste branch worden gepubliceerd via de repository-instellingen; controleer eerst de bestaande publicatieroute.

## Gebruikersstappen

1. Gebruik uitsluitend een fictieve oefencasus; vul context en waarnemingstijd in. Er zijn geen echte casusgegevens nodig.
2. Beoordeel relevante signalen. Niet onderzocht blijft onbekend; niet waargenomen betekent dat het signaal wel is onderzocht.
3. Leg per signaal vast waarop het antwoord is gebaseerd. Noteer geen echte namen of andere herleidbare gegevens.
4. Bekijk zo nodig meerdere vormen; de invoer blijft behouden. Overlappende signalen zijn geen onafhankelijke bewijzen.
5. Beschrijf professionele duiding en voorgestelde opvolging. De app voert deze opvolging niet uit.
6. Bevestig fictieve invoer en stel het rapport op. Controleer alle inhoud.
7. Download een tekstrapport of druk af/bewaar als PDF via de browser. Mobiele afdrukmogelijkheden verschillen.
8. Start een nieuwe check om sessiegegevens te wissen.

Bij direct gevaar geldt de lokale noodprocedure, zo nodig 112. Wacht nooit op een minimumaantal signalen of een rapport. In deze oefentool zijn geen geverifieerde lokale contactroutes opgenomen.

## Android en iOS

Deze versie bevat de technische basis voor een **installeerbare webapp (PWA)**. Dat is nog geen gepubliceerde of op fysieke toestellen geteste app.

- Android: open de HTTPS-versie in Chrome en kies App installeren/Toevoegen aan startscherm. Waar ondersteund verschijnt een installatieknop in de uitleg.
- iPhone: open in Safari, kies Delen en Zet op beginscherm. Zet Open als webapp aan wanneer beschikbaar.
- Controleer na eerste online gebruik de melding over offlinevoorbereiding en test daarna een nieuwe start in vliegtuigstand.
- Geen achtergrondmeldingen, camera, accountbeheer of native koppelingen geïmplementeerd.
- Een PWA-installatie bewaart **geen** antwoorden. Een mobiel besturingssysteem kan een achtergrondvenster beëindigen zonder waarschuwing.
- Een nieuwe service-worker-versie wordt niet geforceerd in een actieve sessie. Bewaar het oefenrapport en sluit alle appvensters voordat een update actief wordt.
- Verhoog VERSION in model.js en sw.js bij elke release die appbestanden wijzigt.
- De browser kan offlinebestanden verwijderen. Offlinegebruik is dus geen gegarandeerde archivering.

Een latere App Store/Google Play-versie kan bijvoorbeeld met Capacitor worden verpakt. Daarvoor zijn aparte native projecten, bouwomgevingen, ondertekening, distributieaccounts, fysieke toesteltests en winkelbeoordeling nodig. Die zijn hier niet aangemaakt.

Technische documentatie:
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios
- https://capacitorjs.com/docs/ios
- https://capacitorjs.com/docs/android

## Gegevens en beveiliging

Antwoorden staan uitsluitend in JavaScript-geheugen van de actieve pagina. Geen localStorage, IndexedDB, cookies voor antwoorden, analytics, invoer-API, serverdatabase of automatische overdracht. De service worker cachet alleen een vaste lijst appbestanden, geen gegenereerde rapporten of ingevoerde gegevens. Er worden geen externe JavaScript-bibliotheken geladen.

Dit is geen verklaring dat het gehele toestel of de hostingomgeving niets verwerkt: hosting ontvangt bestandsverzoeken; browsers, downloads, printerwachtrijen en cloudback-ups vallen buiten deze code. Er is geen toegangsbeveiliging. Een bevestigingsvakje maakt echte gegevens niet anoniem en vervangt geen beveiliging.

Voor echte casussen zijn eerst gemeentelijke werkafspraken, inhoudelijke validatie en een privacy- en beveiligingsbeoordeling nodig. Het onderzoek moet doel, verantwoordelijken, toegang, bewaartermijnen en overdracht vastleggen. Zie docs/ONDERZOEK.md.

## Bestanden

| Bestand | Functie |
|---|---|
| index.html | Semantische invoer, uitleg, bronnen en rapportage |
| styles.css | Actieve responsieve opmaak en afdrukregels |
| signals.js | Bestaande signaalteksten met stabiele IDs; nog te valideren |
| model.js | Antwoorden, revisies en consistente rapportmomentopnamen |
| script.js | Browserbediening, veilige tekstweergave, export en PWA-registratie |
| manifest.webmanifest, sw.js, icons/ | Installatiemetadata en offline appbestanden |
| tests/ | Regressiecontroles zonder aanvullende npm-pakketten |
| docs/ | Onderzoeksverantwoording en handmatige acceptatiecriteria |

## Controleren

Met Node.js 18 of nieuwer, vanuit de repository:

~~~sh
node tests/core.test.js
node tests/ui.test.js
node tests/pwa.test.js
~~~

De UI-test gebruikt een minimale DOM-double en de PWA-test een gesimuleerde cache. Zij bewijzen geen browsercompatibiliteit, toegankelijkheid, correct afdrukgedrag of fysieke installatie. Voer de openstaande controles in docs/TESTPLAN.md uit vóór publicatie.

## Status inhoudelijke onderbouwing

De 60 signaalregels zijn overgenomen uit de eerdere versie. De oorspronkelijke bronnenlijst blijft zichtbaar, met expliciete vermelding dat de inhoud en koppeling per signaal in deze wijziging niet zijn geverifieerd. Geen nieuwe criminologische, juridische of empirische geldigheid wordt geclaimd. De bronnenlijst verwijst naar PGAx; er is geen koppeling met PGAx.
