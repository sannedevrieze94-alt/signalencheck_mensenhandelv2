/* Signaalteksten overgenomen uit prototype 28-03-2026; inhoudelijke validatie nog nodig. */
(function (root) {
  "use strict";
  const catalog = [
  {
    "id": "arbeid",
    "title": "Arbeidsuitbuiting",
    "groups": [
      {
        "id": "specific",
        "title": "Specifieke signalen",
        "items": [
          {
            "id": "arbeid-specific-1",
            "text": "Gevaarlijk of ongezond werk moeten doen"
          },
          {
            "id": "arbeid-specific-2",
            "text": "Structureel extreem lange werkdagen maken"
          },
          {
            "id": "arbeid-specific-3",
            "text": "Niet of te weinig betaald krijgen"
          },
          {
            "id": "arbeid-specific-4",
            "text": "Lang moeten wachten op betaling"
          },
          {
            "id": "arbeid-specific-5",
            "text": "Niet vrij kunnen beschikken over eigen paspoort of identiteitsbewijs"
          },
          {
            "id": "arbeid-specific-6",
            "text": "Met valse beloften naar Nederland zijn gehaald"
          },
          {
            "id": "arbeid-specific-7",
            "text": "Door werkgever of derde worden bedreigd, gechanteerd of mishandeld"
          },
          {
            "id": "arbeid-specific-8",
            "text": "Hoge schuld moeten afbetalen aan werkgever of bemiddelaar"
          },
          {
            "id": "arbeid-specific-9",
            "text": "Afhankelijk zijn van werkgever voor huisvesting, vervoer of eten"
          },
          {
            "id": "arbeid-specific-10",
            "text": "Niet zelf kunnen bepalen wanneer gestopt wordt met werken"
          }
        ]
      },
      {
        "id": "general",
        "title": "Algemene signalen",
        "items": [
          {
            "id": "arbeid-general-1",
            "text": "Angstige, gespannen of ontwijkende houding"
          },
          {
            "id": "arbeid-general-2",
            "text": "Tegenstrijdige of ingestudeerde verklaringen"
          },
          {
            "id": "arbeid-general-3",
            "text": "Sterke afhankelijkheid van een begeleider of derde"
          },
          {
            "id": "arbeid-general-4",
            "text": "Geen beschikking over eigen geld, telefoon of documenten"
          },
          {
            "id": "arbeid-general-5",
            "text": "Zichtbare vermoeidheid, verwaarlozing of lichamelijke uitputting"
          }
        ]
      },
      {
        "id": "environment",
        "title": "Omgevingssignalen / dossier",
        "items": [
          {
            "id": "arbeid-environment-1",
            "text": "Meerdere meldingen over locatie, persoon of bedrijf"
          },
          {
            "id": "arbeid-environment-2",
            "text": "Relevante bestuurlijke of handhavingsgeschiedenis"
          },
          {
            "id": "arbeid-environment-3",
            "text": "Combinatie van signalen uit dossier en actuele controle"
          },
          {
            "id": "arbeid-environment-4",
            "text": "Bekende risicolocatie binnen breder lokaal of regionaal beeld"
          },
          {
            "id": "arbeid-environment-5",
            "text": "Onduidelijke woon-werkconstructie of veel wisselingen op adres"
          }
        ]
      }
    ]
  },
  {
    "id": "seksueel",
    "title": "Seksuele uitbuiting",
    "groups": [
      {
        "id": "specific",
        "title": "Specifieke signalen",
        "items": [
          {
            "id": "seksueel-specific-1",
            "text": "Persoon lijkt onder controle te staan van een derde"
          },
          {
            "id": "seksueel-specific-2",
            "text": "Geen vrije toegang hebben tot telefoon, geld of identiteitsbewijs"
          },
          {
            "id": "seksueel-specific-3",
            "text": "Geen zicht hebben op eigen werktijden of inkomsten"
          },
          {
            "id": "seksueel-specific-4",
            "text": "Gedwongen lijken tot seksuele handelingen of prostitutie"
          },
          {
            "id": "seksueel-specific-5",
            "text": "Mogelijke minderjarigheid of duidelijke kwetsbaarheid"
          },
          {
            "id": "seksueel-specific-6",
            "text": "Sporen van geweld, mishandeling of dwang vertonen"
          },
          {
            "id": "seksueel-specific-7",
            "text": "Moeten afdragen van verdiend geld aan een ander"
          },
          {
            "id": "seksueel-specific-8",
            "text": "Niet vrij kunnen beschikken over vervoer of verblijfplaats"
          },
          {
            "id": "seksueel-specific-9",
            "text": "Angst tonen voor begeleider, partner of exploitant"
          },
          {
            "id": "seksueel-specific-10",
            "text": "Geen ruimte hebben om zelfstandig te spreken"
          }
        ]
      },
      {
        "id": "general",
        "title": "Algemene signalen",
        "items": [
          {
            "id": "seksueel-general-1",
            "text": "Angstige, gespannen of onderdanige houding"
          },
          {
            "id": "seksueel-general-2",
            "text": "Tegenstrijdige of ingestudeerde verklaringen"
          },
          {
            "id": "seksueel-general-3",
            "text": "Sterke afhankelijkheid van een derde"
          },
          {
            "id": "seksueel-general-4",
            "text": "Geen beschikking over eigen documenten of telefoon"
          },
          {
            "id": "seksueel-general-5",
            "text": "Plotselinge verandering in gedrag, kleding of presentatie"
          }
        ]
      },
      {
        "id": "environment",
        "title": "Omgevingssignalen / dossier",
        "items": [
          {
            "id": "seksueel-environment-1",
            "text": "Meerdere meldingen over locatie, persoon of bedrijf"
          },
          {
            "id": "seksueel-environment-2",
            "text": "Relevante bestuurlijke of handhavingsgeschiedenis"
          },
          {
            "id": "seksueel-environment-3",
            "text": "Opvallende combinatie van signalen uit dossier en controle"
          },
          {
            "id": "seksueel-environment-4",
            "text": "Bekende locatie binnen prostitutie-, zorg- of overlastcontext"
          },
          {
            "id": "seksueel-environment-5",
            "text": "Onverklaarbare aanwezigheid van wisselende personen op locatie"
          }
        ]
      }
    ]
  },
  {
    "id": "crimineel",
    "title": "Criminele uitbuiting",
    "groups": [
      {
        "id": "specific",
        "title": "Specifieke signalen",
        "items": [
          {
            "id": "crimineel-specific-1",
            "text": "Persoon voert risicovolle of strafbare taken uit voor anderen"
          },
          {
            "id": "crimineel-specific-2",
            "text": "Jonge of kwetsbare persoon lijkt gestuurd door een oudere derde"
          },
          {
            "id": "crimineel-specific-3",
            "text": "Onverklaarbare aanwezigheid op risicolocaties"
          },
          {
            "id": "crimineel-specific-4",
            "text": "Duidelijke afhankelijkheid van een derde voor geld, vervoer of onderdak"
          },
          {
            "id": "crimineel-specific-5",
            "text": "Signalen van dwang, druk, bedreiging of schuldpositie"
          },
          {
            "id": "crimineel-specific-6",
            "text": "Persoon moet opbrengsten of goederen afgeven aan een ander"
          },
          {
            "id": "crimineel-specific-7",
            "text": "Gebruik van meerdere telefoons, koeriersbewegingen of verborgen taken"
          },
          {
            "id": "crimineel-specific-8",
            "text": "Persoon kan geen duidelijke uitleg geven over eigen rol of aanwezigheid"
          },
          {
            "id": "crimineel-specific-9",
            "text": "Lijkt niet vrij te zijn om te stoppen of weg te lopen"
          },
          {
            "id": "crimineel-specific-10",
            "text": "Betrokkenheid bij drugs-, diefstal- of geldezelconstructies"
          }
        ]
      },
      {
        "id": "general",
        "title": "Algemene signalen",
        "items": [
          {
            "id": "crimineel-general-1",
            "text": "Angstige, gespannen of ontwijkende houding"
          },
          {
            "id": "crimineel-general-2",
            "text": "Tegenstrijdige of ingestudeerde verklaringen"
          },
          {
            "id": "crimineel-general-3",
            "text": "Sterke afhankelijkheid van een derde"
          },
          {
            "id": "crimineel-general-4",
            "text": "Geen beschikking over eigen documenten of geld"
          },
          {
            "id": "crimineel-general-5",
            "text": "Zichtbare stress, vermoeidheid of sociale isolatie"
          }
        ]
      },
      {
        "id": "environment",
        "title": "Omgevingssignalen / dossier",
        "items": [
          {
            "id": "crimineel-environment-1",
            "text": "Meerdere meldingen over locatie, persoon of bedrijf"
          },
          {
            "id": "crimineel-environment-2",
            "text": "Relevante bestuurlijke of handhavingsgeschiedenis"
          },
          {
            "id": "crimineel-environment-3",
            "text": "Opvallende combinatie van signalen uit dossier en controle"
          },
          {
            "id": "crimineel-environment-4",
            "text": "Bekende locatie in relatie tot ondermijnende of jeugdproblematiek"
          },
          {
            "id": "crimineel-environment-5",
            "text": "Patroon van eerdere constateringen of partnerinformatie"
          }
        ]
      }
    ]
  }
];
  if (typeof module !== "undefined" && module.exports) module.exports = catalog;
  else root.APP_SIGNALS = catalog;
})(typeof globalThis !== "undefined" ? globalThis : this);
