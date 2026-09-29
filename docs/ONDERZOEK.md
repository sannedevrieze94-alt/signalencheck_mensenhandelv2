# Onderzoeksverantwoording en voorwaarden voor vervolg

## Positie van het prototype

Versie 3.5.0-prototype is een ontwerpinterventie voor fictieve oefencasuïstiek. De tool ondersteunt het oefenen met signalenherkenning, feitelijke vastlegging, vormspecifieke beoordeling en professionele duiding rondom arbeidsuitbuiting, seksuele uitbuiting en criminele uitbuiting.

Te onderzoeken effecten zijn onder meer:
- onderscheiden gebruikers `Onbekend` en `Niet waargenomen` correct;
- leggen toezichthouders de bron van een waarneming voldoende feitelijk vast;
- helpt afzonderlijke beoordeling per uitbuitingsvorm om samenhang en verschillen beter te zien;
- is de progressieve prototype-score begrijpelijk zonder te worden gelezen als kanspercentage;
- ondersteunt de gegenereerde rapportage een bruikbare en controleerbare verslaglegging;
- is de losse module Heimelijke waarneming bruikbaar zonder observatie en interpretatie te vermengen.

Dit zijn onderzoeksvragen, geen behaalde resultaten. Er is geen bewijs dat de tool mensenhandel voorspelt of dat de oorspronkelijke signaalverzameling volledig is.

## Vormspecifieke rapportage

Vanaf versie 3.5 worden de drie uitbuitingsvormen afzonderlijk beoordeeld. Een vorm wordt als beoordeeld beschouwd zodra minimaal één signaal binnen die vorm de status `Waargenomen` of `Niet waargenomen` heeft gekregen.

De rapportgenerator neemt uitsluitend daadwerkelijk beoordeelde vormen inhoudelijk op. Worden één of twee vormen beoordeeld, dan wordt geen integrale totaalscore weergegeven. Alleen wanneer alle drie de vormen zijn beoordeeld verschijnt naast de drie afzonderlijke vormscores een integrale samenvatting.

De rapportage is ingericht als toezichthoudersrapportage in lopende tekst. De openingspassage benoemt de hoedanigheid van toezichthouder als bedoeld in artikel 5:11 Awb en verwerkt vervolgens de ingevulde controlecontext. De daadwerkelijke wettelijke of gemeentelijke aanwijzingsgrondslag moet buiten deze prototypecode worden vastgesteld.

## Progressieve prototype-score

De oude formule `R = K × G × B`, de gewichten 4/2/2, drempels 50/180 en trefwoordregels zijn verwijderd wegens het ontbreken van een onderbouwing in de repository.

Versie 3.5 gebruikt per uitbuitingsvorm een transparante progressieve onderzoeksindex:

`score = 0,5 × n^1,45`

waarbij `n` het aantal als `Waargenomen` geregistreerde signalen binnen die uitbuitingsvorm is. De uitkomst wordt afgerond op 0,25 punt.

Voorbeelden:
- 1 waargenomen signaal → 0,5;
- 2 → 1,25;
- 3 → 2,5;
- 4 → 3,75;
- 5 → 5,25;
- 20 → 38,5.

De formule operationaliseert uitsluitend het ontwerpidee dat cumulatie van meerdere signalen progressief zwaarder zichtbaar mag worden. Zij is **niet empirisch gekalibreerd** voor de kans op mensenhandel, slachtofferschap, ernst of noodzakelijke interventie. De formule corrigeert niet afzonderlijk voor overlap, afhankelijkheid tussen signalen of alternatieve verklaringen. Een afzonderlijk ernstig signaal kan professionele opvolging vereisen ongeacht de score.

Als alle drie de vormen zijn beoordeeld, wordt de integrale prototype-score berekend als de som van de drie afzonderlijke vormscores. Ook deze som is geen kanspercentage of gevalideerde grenswaarde.

## Heimelijke waarneming

Versie 3.5 bevat een afzonderlijke optionele module voor heimelijke waarneming. De module is standaard uitgeschakeld en wordt alleen in de rapportage opgenomen als de gebruiker haar activeert.

De module kan in een fictieve oefencasus vastleggen:
- observatieperiode;
- aanloop en bezoekbewegingen;
- aantal waargenomen vrouwen/personen passend bij de onderzochte context;
- herleidbaarheid naar een publieke advertentiebron, bijvoorbeeld Kinky.nl;
- fictieve advertentie-/profielverwijzing;
- aantal bezoeken;
- duur van bezoeken en tijdspatroon;
- terugkerende observatiepatronen;
- fictieve kentekens;
- feitelijk waarneembare persoonskenmerken;
- aanvullende chronologische observatienotities.

Het ontwerp vraagt de gebruiker feitelijke observaties vast te leggen en geen automatische conclusie aan deze gegevens te verbinden. Persoonskenmerken zijn bedoeld als waarneembare beschrijving, bijvoorbeeld geschatte leeftijdscategorie, lengte, kleding, haarkleur en opvallende kenmerken. Aannames over niet-waarneembare of gevoelige persoonskenmerken horen niet als standaardcategorie in het prototype.

Voor echt gebruik kunnen kentekens, persoonskenmerken en advertentiegegevens herleidbare persoonsgegevens zijn. Voordat deze module buiten fictieve oefencasuïstiek wordt gebruikt, moeten doel, grondslag, proportionaliteit, toegang, bewaartermijn, beveiliging, logging en lokale werkafspraken worden vastgesteld.

## Validatiematrix van de 60 signalen

De werkversie staat in `docs/VALIDATIEMATRIX.md`. Alle 60 stabiele signaal-ID's uit `signals.js` zijn daarin uitgesplitst naar arbeidsuitbuiting, seksuele uitbuiting en criminele uitbuiting.

De repository bevat nog niet voor ieder signaal een geverifieerde één-op-één-bronkoppeling. Daarom blijft de verificatiestatus open totdat inhoudelijke beoordeling heeft plaatsgevonden. `Overlaprisico` in de matrix betekent risico op inhoudelijke dubbeling/dubbel tellen en niet risico op mensenhandel.

Voor criminele uitbuiting geldt bovendien dat de repository niet bij alle 20 signalen bevestigt dat deze uitsluitend op jongeren zien. Die afbakening moet per signaal nog worden beoordeeld.

## Praktijkafspraken die code niet kan vaststellen

- Wie is inhoudelijk eigenaar van de signalenset en scoremethodiek?
- Wie beoordeelt signalen en wie besluit over vervolgstappen?
- Welke concrete wettelijke of gemeentelijke aanwijzingsgrondslag geldt voor de toezichthouder in de betreffende controlecontext?
- Wat zijn de bevestigde lokale routes bij acute zorg en overige signalen?
- Hoe worden meerdere vormen gezamenlijk geduid zonder dubbel tellen?
- Onder welke voorwaarden mag een heimelijke waarneming worden uitgevoerd en vastgelegd?
- Welke persoonsgegevens mogen daarbij worden verwerkt, met welke grondslag en bewaartermijn?
- Hoe sluit vastlegging aan op een eventueel gemeentelijk systeem, waaronder PGAx? Er is nu geen koppeling.
- Welke hosting, toegang, beveiliging en logging zijn vereist voor een productievariant?

Totdat deze afspraken en beoordelingen zijn afgerond, blijft gebruik beperkt tot fictieve oefencasuïstiek.

## Evaluatievoorstel

Gebruik vooraf beschreven fictieve scenario's met onder meer:
- één afzonderlijk ernstig signaal;
- meerdere lichte of overlappende signalen;
- ontbrekende informatie;
- één, twee en drie beoordeelde uitbuitingsvormen;
- een heimelijke waarneming met aanloop, websitekoppeling, kenteken, persoonskenmerken en verschillende bezoekduren.

Observeer taakvoltooiing, gemiste signalen, verwarring tussen onbekend en niet-waargenomen, kwaliteit van bronvermelding, interpretatie van de score, volledigheid van de rapportage en de scheiding tussen feitelijke waarneming en professionele duiding.

Toets expliciet of gebruikers begrijpen dat 0,5 / 1,25 / 2,5 enzovoort een ontwerpindex is en geen empirische waarschijnlijkheid. Laat inhoudsdeskundigen beoordelen of de progressieve vorm logisch en bruikbaar is en of signalen inhoudelijk verschillend zouden moeten wegen.

Een voor-/nameting kan iets zeggen over herkenning en bruikbaarheid, maar toont op zichzelf geen voorspellende validiteit aan. Een toekomstige inhoudelijk gewogen of gekalibreerde score vereist een afzonderlijk validatietraject met deskundige onderbouwing, geschikte casuïstiek en vooraf vastgelegde uitkomstmaten.

## Beheer en vrijgave

Leg per release wijzigingen, geteste commit, testresultaten, inhoudelijke bronactualisering en besluit over toegestaan gebruik vast. Wijs een inhoudelijk en technisch beheerder aan. Gebruik geen labels als `goedgekeurd`, `veilig` of `AVG-proof` zonder aantoonbare beoordeling van de daadwerkelijke context.
