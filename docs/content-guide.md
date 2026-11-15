# Lägga in glosor och prov

Allt innehåll ligger som JSON-filer i mappen `data/`. Du ändrar dem direkt på github.com. Appen visar ändringen efter 1–2 minuter.

## Så ändrar du en fil på github.com

1. Öppna repot och mappen `data/`.
2. Tryck på filen och sedan på pennan (Edit).
3. Gör ändringen och tryck **Commit changes**.

Inga namn, ingen skola och ingen klass i filerna. Repot är publikt.

## En fil per prov

Varje glosförhör eller prov är en egen fil, till exempel `exam-english-w50.json`. `data/index.json` bestämmer vilka filer appen visar:

```json
{
  "files": [
    "exam-english-w50.json",
    "exam-biology.json"
  ]
}
```

- **Nytt prov:** kopiera en gammal fil, ge den ett nytt namn, byt innehållet och lägg till filnamnet i `index.json`.
- **Prov som är över:** ta bort raden i `index.json`. Appen slutar också själv visa ett prov dagen efter provdatumet.

## Mall

```json
{
  "type": "exam",
  "id": "english-w50",
  "subject": "Engelska",
  "title": "Glosor vecka 50",
  "examDate": "2026-12-11",
  "front": { "label": "Engelska", "lang": "en" },
  "back": { "label": "Svenska", "lang": "sv" },
  "answerMode": "type",
  "cards": [
    { "id": "snow", "front": "snow", "back": "snö" },
    { "id": "autumn", "front": "autumn", "back": "höst", "acceptFront": ["fall"] },
    { "id": "gloves", "front": "gloves", "back": "vantar", "answerMode": "choice" }
  ]
}
```

| Fält | Betyder |
|---|---|
| `id` | Kort namn utan mellanslag. Måste vara unikt. Byt inte efteråt, då börjar övningen om. |
| `examDate` | Provdatum som `ÅÅÅÅ-MM-DD`. Skriv `null` (utan citattecken) eller `"PLACEHOLDER"` om det inte är bestämt. |
| `front` / `back` | Kortets två sidor. `lang` är `"en"` för engelska och `"sv"` för svenska (styr uttal och uppläsning). |
| `answerMode` | Hur barnet svarar, se nedan. Gäller hela provet. |
| `cards` | Ett kort per rad. `front` och `back` är de två sidorna. |

Barnet övar åt båda hållen: engelska → svenska och svenska → engelska. Ett kort med `"directions": ["forward"]` övas bara från framsidan till baksidan.

## Svarslägen

| Värde | Barnet… |
|---|---|
| `"type"` | skriver svaret. Stora/små bokstäver, mellanslag och punkt spelar ingen roll. Ett stavfel godkänns i ord med minst 5 bokstäver. |
| `"choice"` | väljer bland fyra knappar. Felalternativen tas från andra kort i samma prov. |
| `"self"` | vänder kortet och säger själv om hen kunde det. |

Olika läge åt olika håll: `"answerMode": { "forward": "choice", "reverse": "type" }`. `forward` är front → back.

Ett enskilt kort kan ha ett eget `"answerMode"` som gäller före provets.

## Extra fält på ett kort (valfria)

| Fält | Exempel | Betyder |
|---|---|---|
| `acceptBack` | `["kallt"]` | Fler svar som räknas som rätt när barnet skriver baksidan. |
| `acceptFront` | `["fall"]` | Fler svar som räknas som rätt när barnet skriver framsidan. |
| `choicesBack` | `["vante", "handske"]` | Egna felalternativ i flerval när svaret är baksidan. |
| `choicesFront` | `["glove"]` | Egna felalternativ i flerval när svaret är framsidan. |

## Frågor och begrepp i samma prov

I ett ämnesprov kan korten vara av olika slag, till exempel öppna frågor och begrepp. Ge varje kort ett `kind` och bestäm i `kinds` vad som gäller för varje slag. Se `exam-biology.json`.

```json
"front": { "label": "Fråga", "lang": "sv" },
"back": { "label": "Svar", "lang": "sv" },
"kinds": {
  "question": { "directions": ["forward"] },
  "term": { "frontLabel": "Begrepp", "backLabel": "Förklaring" }
},
"cards": [
  { "id": "q01", "kind": "question", "front": "Vad är en cell?", "back": "En liten byggsten…" },
  { "id": "t07", "kind": "term", "front": "Cell", "back": "En liten byggsten i levande organismer." }
]
```

- **Frågor** övas bara åt ett håll. Det är svårt att gissa frågan utifrån svaret.
- **Begrepp** övas åt båda hållen och visas som "Begrepp" och "Förklaring" i stället för "Fråga" och "Svar".
- I flerval tas felalternativen bara från kort av samma slag.
- Långa svar passar bäst med `"answerMode": "self"`. Att skriva en hel mening rättas inte rättvist.
- `section` och `tips` sparas i filen men visas inte i appen än.

## Vanliga fel

- **Kommatecken:** varje kort-rad slutar med `,` utom den sista.
- **Citattecken:** använd raka `"`, inte `”`. Skriv helst i datorns webbläsare, eftersom iPhone gör om citattecken.
- Om en fil är trasig hoppar appen över den och visar resten. Kör `npm test` på datorn för att se exakt vad som är fel.
