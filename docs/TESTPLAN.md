# Teststatus en acceptatieplan — 3.1.0-prototype

## Uitgevoerd bij deze wijziging

De volgende JavaScript-controles zijn uitgevoerd in een geïsoleerde JavaScript-runtime. CommonJS-bestanden zijn geladen met een testadapter; er is geen Node-proces of echte browser gestart.

- Veertien modelcontroles (inclusief onbevestigde meldroute, bronnotities en scheiding van waarneming/verklaring/interpretatie): beginstatus, fictieve-invoerbevestiging, ernstig signaal zonder risicoklasse, behoud bij vormwissel, actuele momentopname, stabiele rapporttijd, acute zorg onafhankelijk van telling, onbekend versus niet waargenomen, volledige reset, ongeldige invoer en lange tekst.
- UI-gebeurtenissen met minimale DOM-double: wisselen/actieve vorm opnieuw kiezen, beide vormen in één rapport, wijzigen na rapportage en downloaden, actuele afdrukinhoud, tekst als tekst, acute waarschuwing, reset annuleren/bevestigen en export blokkeren zonder bevestiging. Ook de nieuwe opvolgvelden, routewaarschuwing en reset daarvan zijn gecontroleerd.
- Service-workerlogica met cache-double: vaste bestandslijst, scope-isolatie, alleen eigen oude caches verwijderen, geen onderschepping van rapporten/POST/externe of query-verzoeken, ophalen appbestand uit cache.
- Syntaxis van browsercode en service worker; manifest en interne bestandsverwijzingen.

Deze tests zijn reproduceerbaar met de opdrachten in README.md. Ze zijn geen fysieke toesteltests.

## Nog uit te voeren vóór publicatie

| Test | Werkwijze | Verwacht resultaat | Status |
|---|---|---|---|
| Android-installatie | Open HTTPS-versie in Chrome, installeer, start vanaf beginscherm | Eigen icoon en zelfstandig venster; invoer en export bruikbaar | Niet uitgevoerd |
| iPhone-installatie | Safari, Delen, Zet op beginscherm, start icoon | Zelfstandig venster; bediening en tekstexport bruikbaar | Niet uitgevoerd |
| Mobiele afdruk/PDF | Exporteer korte en zeer lange fictieve rapporten op beide platforms | Alle tekst leesbaar, geen afkapping; tekstexport beschikbaar wanneer afdruk ontbreekt | Niet uitgevoerd |
| Mobiele layout | 320/375 px, staand/liggend, groter systeemlettertype en zoom | Geen onbereikbare bediening of horizontale tekstafkapping | Niet uitgevoerd |
| Toegankelijkheid | Toetsenbord, VoiceOver en TalkBack | Labels, keuzestatussen en meldingen begrijpelijk, focus zichtbaar | Niet uitgevoerd |
| Offline eerste gebruik | Laad online, wacht op offlinebevestiging, sluit, open in vliegtuigstand | Appbestanden openen; onbekende antwoorden bij nieuwe sessie | Niet uitgevoerd |
| Cache ontbreekt | Wis browserdata en start offline | Geen belofte dat eerste offline start werkt; documentatie klopt | Niet uitgevoerd |
| Update | Publiceer gewijzigde cacheversie terwijl fictieve check openstaat | Geen geforceerde herstart; waarschuwing, update na sluiten alle vensters | Niet uitgevoerd |
| Herladen/achtergrond | Vul fictief in, herlaad of laat OS app beëindigen | Geen herstel beloofd; mogelijkheid tot verlies vooraf duidelijk | Niet uitgevoerd |
| Reset en exports | Download, nieuwe check | Alle appinvoer leeg, export blijft extern bestaan | Niet uitgevoerd |
| Netwerkinspectie | Voer fictieve teksten in en exporteer | Geen invoer/rapport naar een server; alleen vaste appbestanden | Niet uitgevoerd |
| Inhoudelijke toets | Laat deskundigen scenario's en signalen beoordelen | Vastgelegde feedback en openstaande punten | Niet uitgevoerd |

Geen publicatie, App Store-/Play Store-build, juridische vrijgave of operationele geschiktheid afleiden uit de geslaagde codecontroles.

Aanvullend handmatig te controleren: vierstappennavigatie bij mobiel gebruik en zoom, leesbaarheid van de samenvatting, en het verschil tussen een voorstel en een gemaakte afspraak.
