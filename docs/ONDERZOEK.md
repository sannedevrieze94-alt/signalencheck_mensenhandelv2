# Onderzoeksverantwoording en voorwaarden voor vervolg

## Positie van het prototype

Versie 3.4.0-prototype is een ontwerpinterventie voor fictieve oefencasuïstiek. Beoogde onderzoeksvragen zijn onder meer: helpen de antwoordcategorieën bij het scheiden van onbekend en niet waargenomen; leggen toezichthouders hun bronnen duidelijker vast; vinden zij passende vervolgvragen; begrijpen zij de betekenis en beperking van de indicatieve risicoscore; en ondersteunt de interface een zorgvuldige professionele duiding?

Dit zijn te onderzoeken effecten, geen behaalde resultaten. Er is geen bewijs dat de tool mensenhandel voorspelt of dat de oorspronkelijke signaalverzameling volledig is.

## Ontwerpbesluiten

De eerdere formule R = K × G × B, gewichten 4/2/2, drempels 50/180 en kritieke trefwoorden zijn verwijderd. In de repository ontbrak een verantwoording en validatie voor hun toepassing op mensenhandel. Kritieke situaties mogen niet worden geblokkeerd door een lage totaalscore.

Vanaf versie 3.4 is opnieuw een **transparante prototype-risicoscore** toegevoegd omdat het onderzoek expliciet wil toetsen of een oplopend totaal van waargenomen signalen gebruikers helpt bij het herkennen van samenhang. De score is bewust eenvoudig: iedere waargenomen signaalregel telt als 1 punt; de schaal loopt van 0 tot 60. Niet waargenomen en onbekende signalen leveren geen punten op.

Deze score is **geen gevalideerde kansberekening**. Zij maakt geen onderscheid in betekenis of ernst van afzonderlijke signalen, corrigeert niet voor overlap en kent geen gevalideerde grenswaarden. Een score van 20/60 betekent dus niet 20/60 kans op mensenhandel en mag niet zelfstandig leiden tot een conclusie over slachtofferschap of noodzakelijke interventie. Acute veiligheid en professionele duiding blijven losstaan van de totaalscore.

Signaalteksten blijven behouden om de inhoudelijke wijziging controleerbaar te houden. Toekomstige tekstwijzigingen moeten per stabiel signaal-ID worden vastgelegd. De 60 regels bevatten overlap; aantallen zijn geen onafhankelijke bewijzen.

Er is geen vastgesteld lokaal opvolgingsprotocol ingevoerd. De tool vraagt de invuller een voorgestelde opvolging te beschrijven en vermeldt dat er geen overdracht plaatsvindt.

## Validatiematrix van de 60 signalen

De werkversie staat in `docs/VALIDATIEMATRIX.md`. Daarin zijn alle 60 signaal-ID's uit `signals.js` uitgesplitst naar arbeidsuitbuiting, seksuele uitbuiting en de cataloguspijler criminele uitbuiting. Omdat de repository niet voor ieder signaal een geverifieerde één-op-één-bronkoppeling bevat, blijft de verificatiestatus van alle regels open totdat een daadwerkelijke inhoudelijke beoordeling heeft plaatsgevonden.

De matrix bevat per signaal:
- signaal-ID en onderwerp;
- vermoedelijke pijler;
- exacte beschikbare repositoryverwijzing en de status van de primaire bronkoppeling;
- verificatiestatus;
- letterlijke betekenis van het signaal en openstaande alternatieve verklaringen;
- overlaprisico als risico op inhoudelijke dubbeling/dubbel tellen;
- benodigde deskundige beoordeling;
- voorgestelde beoordelaarsrol;
- openstaande informatie.

De matrix doet geen uitspraak over voorspellende waarde, slachtofferschap, waarschijnlijkheid of empirisch gevalideerde ernst. Voor criminele uitbuiting is bovendien expliciet vastgelegd dat de repository niet bij alle 20 signalen bevestigt dat het signaal uitsluitend op jongeren ziet. Die jongerenafbakening moet daarom per signaal nog worden beoordeeld.

## Nog vast te leggen bronmatrix

De validatiematrix is de werkversie van deze bronmatrix. Vul alleen gegevens aan die daadwerkelijk zijn beoordeeld; plaats geen goedkeuringsnamen of -data zonder daadwerkelijke beoordeling.

| Signaal-ID | Exacte primaire bron en vindplaats | Letterlijk/bewerkt | Betekenis en alternatieve verklaringen | Overlap | Beoordelaar/rol en datum | Status |
|---|---|---|---|---|---|---|
| arbeid-specific-1 (voorbeeld-ID) | Nog te verifiëren | Overgenomen uit eerder prototype | Nog uit te werken | Nog te beoordelen | Niet beoordeeld | Open |

De vijf bronverwijzingen op de pagina zijn overgenomen uit de vorige versie. Controleer beschikbaarheid, exacte titel/datum, inhoudelijke aansluiting en APA 7. Zij onderbouwen geen voorspellende waarde of grenswaarde van de prototype-score.

## Praktijkafspraken die code niet kan vaststellen

- Wie is inhoudelijk eigenaar, wie beoordeelt signalen en wie besluit over vervolgstappen?
- Wat zijn de bevestigde lokale routes bij acute zorg en overige signalen?
- Hoe worden meerdere vormen gezamenlijk geduid, zonder dubbel tellen?
- Hoe wordt het slachtofferperspectief betrokken zonder in het onderzoek echte casusgegevens onnodig vast te leggen?
- Hoe sluit vastlegging aan op een eventueel gemeentelijk systeem, waaronder PGAx? Er is nu geen koppeling.
- Welke verwerking, toegang, bewaartermijnen, hosting en beveiliging zijn voor een eventuele productieversie beoordeeld?
- Welke betekenis mag de prototype-risicoscore in een toekomstige werkwijze krijgen, en welke betekenis nadrukkelijk niet?

Totdat deze afspraken en inhoudelijke beoordeling gereed zijn, blijft gebruik beperkt tot fictieve oefencasuïstiek.

## Evaluatievoorstel

Gebruik vooraf beschreven fictieve scenario's, waaronder een enkel ernstig signaal, meerdere lichte of overlappende signalen, ontbrekende informatie en meerdere uitbuitingsvormen. Laat inhoudsdeskundigen vooraf de gewenste herkenning en vervolgvragen bepalen. Beschrijf hoe scenario's en beoordelingscriteria tot stand kwamen.

Observeer taakvoltooiing, gemiste signalen, verwarring tussen onbekend/niet waargenomen, kwaliteit van bronvermelding, passende opvolging en fouten in rapportage. Toets expliciet of gebruikers de prototype-risicoscore begrijpen als optelsom van waargenomen regels en niet als kanspercentage of automatisch handelingsadvies. Verzamel feedback zonder echte casusgegevens.

Een voor-/nameting kan leren over herkenning en bruikbaarheid, maar toont op zichzelf geen voorspellende validiteit aan. Als later een inhoudelijk gewogen of gekalibreerde score wordt gewenst, is daarvoor een afzonderlijk validatietraject nodig met deskundige onderbouwing, representatieve casuïstiek en vooraf vastgelegde uitkomstmaten.

Leg de geteste commit, deelnemersrollen, testomgeving, methode, resultaten, beperkingen en daaropvolgende wijzigingen vast. Rapporteer feitelijk wat daadwerkelijk is getest of vastgesteld.

## Beheer en vrijgave

Wijs een inhoudelijk en technisch beheerder aan. Leg per release wijzigingen, bronactualisering, testresultaten en besluit over toegestaan gebruik vast. Verhoog de app- en cacheversie bij wijzigingen. Gebruik geen labels als ‘goedgekeurd’, ‘veilig’ of ‘AVG-proof’ zonder aantoonbare beoordeling van de toepasselijke context.
