# AI-logg

En post per fas: vad AI:n föreslog, vilka alternativ som fanns och vad som är kvar att avgöra.

---

## Fas 1 – Skelett (2026-11-14, skriven i efterhand)

### Vad som byggdes
- npm-projekt med `sass` som devDependency. Skript: `sass` (watch), `build`, `validate` (html-validate), `serve` (python3).
- Sass 7-1 med `@use`/`@forward`: tokens, reset, typografi, fokusstilar, reduced motion och `prefers-contrast`.
- Lokalt hostade fonter: Atkinson Hyperlegible (brödtext) och Pixelify Sans (rubriker), båda OFL.
- `index.html` med app shell: skip link, header med Kvackis-logo som hemlänk, huvudmeny och `main`.
- Hash-router och vyerna "Idag", "Uppdrag", "Förälder" (tom) och 404.
- `core/storage.js`, `core/registry.js` och laddning av `data/index.json` (i `core/data.js`).
- `manifest.webmanifest`, apple-touch-icon och ikoner gjorda av Kvackis-bilden.

### Val och alternativ
| Beslut | Valt | Alternativ | Varför |
|---|---|---|---|
| Routing | Hash-router (`#/uppdrag`) | History API | GitHub Pages saknar fallback till index.html. |
| Storage-API | Asynkront (Promise) | Synkront som localStorage | Kan bytas mot IndexedDB/Capacitor utan att ändra anropen. |
| Datainläsning | Egen fil `core/data.js` | Lägga den i `missions.js` eller `registry.js` | Håller fetch-logiken på ett ställe. |
| Pixelfont | Pixelify Sans | Press Start 2P, Silkscreen | Smalare, mer läsbar, har å, ä och ö. |
| Fokus vid första laddning | Stannar överst | Fokus på h1 direkt | Skip link nås först. Vid vybyte flyttas fokus till h1. |
| Skip link | JS flyttar fokus till h1 utan att ändra hash | Vanlig `#main`-länk | `#main` skulle tolkas som en väg av routern. |
| Sticky header | Bara vid skärmhöjd ≥ 30em | Alltid sticky | Annars kan headern dölja fokus vid stark zoom (2.4.11). |
| Navigering | Huvudmeny i headern (Idag, Uppdrag, Förälder) | Bara logo + länkar i vyerna | Förälder-vyn måste gå att nå. Menyn är sekundär och bryter inte "en primär handling per skärm". |
| Reset | Egen minimal i `vendors/` | normalize.css | Inga externa beroenden. |

### Avvikelser från din plan
- Namnet var först "Quackify" (från första specen). Bytt till Kvackademin överallt.
- Första versionen hade vyerna Start, "Dagens uppdrag" och 404. Förälder saknades. Rättat i avstämningen.
- `core/log.js` och `core/missions.js` byggdes redan i Fas 1 (planerat till Fas 4). Behålls som grund.
- `core/data.js` finns inte i fillistan i CLAUDE.md.
- `CLAUDE.md` fanns inte när Fas 1 byggdes. Den lades till i avstämningen.

### Avstämning mot CLAUDE.md
**Inga avvikelser hittades för:** `@import` (används inte), Google Fonts eller andra externa URL:er (inga), nästlade selektorer (max en nivå, bara media queries), JS-hookar (bara `data-js`, inga klassväljare i JS), typografiska citattecken i commits (inga).

**Rättat:**
- Manifestet låste appen i stående läge. Det bryter mot WCAG 1.3.4 (Orientation). Borttaget.
- Logotexten kunde flöda ut i sidled vid 320 px + 200 % text + ökat textavstånd. Får nu radbrytas.
- Saknad Förälder-vy och vynamn enligt CLAUDE.md.

**Kvar att avgöra eller testa:**
- `.u-visually-hidden` är en hjälpklass, inte BEM. Beslut: behålls.
- ~~Vägarna är på svenska~~ Åtgärdat: `#/missions` och `#/parent`.
- Färgerna är valda utifrån beskrivningen "blått, grönt, guld, pergament". Ingen mood board än; färgerna behålls.
- ~~Git-författaren är ditt fullständiga namn~~ Åtgärdat: se uppföljning nedan.
- Lighthouse och VoiceOver på riktig iPhone testas efter publicering (Fas 5).
- Ingen service worker än, så appen fungerar inte offline.

### Uppmätt kontrast
Text: 13.1 (text/pergament), 14.7 (text/panel), 6.8 (dämpad/pergament), 7.9 (vit/blå knapp), 6.5 (vit/grön), 9.0 (text/guld).
UI-kanter: 4.8 (kant/pergament), 6.9 (blå knapp/pergament), 13.1 (fokusring).

### Testat
- axe-core (WCAG 2.0–2.2 A/AA + best practice): 0 fel på Idag, Uppdrag, Förälder och 404.
- `npm run validate`: 0 fel.
- 320 px bredd med 200 % text och ökat textavstånd: ingen horisontell scroll.
- Tangentbord: skip link → logo → meny → innehåll. Vybyte flyttar fokus till h1, `document.title` och `aria-current` uppdateras.
- Menylänkarna är minst 44 px höga.

### Uppföljning (2026-11-14)
- **Kod på engelska:** vägarna heter nu `#/missions` och `#/parent`, och alla kommentarer i JS och Sass är översatta. UI-texten är fortfarande svenska. Gamla svenska vägar ger 404-vyn.
- **Git-författare:** repots lokala git-config är `Kvackademin <the-big-dabrowski@users.noreply.github.com>`. Alla tidigare commits är omskrivna med den författaren (inget var pushat). Den globala git-configen på datorn är orörd.
- **Färger:** behålls. Alla färger finns som tokens i `src/scss/abstracts/_tokens.scss`, så en ny palett är en ändring i en fil. Kontrasten måste kontrolleras igen efter ändring.

**Kvar för dig att avgöra:**
- ~~Noreply-adress med användar-ID~~ Åtgärdat: repot använder nu GitHub-adressen med ID, och alla commits är omskrivna.
- Användarnamnet `the-big-dabrowski` syns ändå i repo-URL:en och i CLAUDE.md.

---

## Fas 2 – Kortlek och prov (2026-11-14)

### Vad som byggdes
- `engines/flashcards.js`: Leitner med 3 lådor och båda riktningarna. "Kunde" flyttar upp en låda, "Inte än" flyttar till låda 1. Rena funktioner utan DOM och storage, med 6 enhetstester (`npm test`).
- `modules/exam.js`: ett prov per datafil. Räknar dagar kvar till provdatum och föreslår dagens pass på ungefär 10 minuter (20 kort à 30 s).
- `views/exam-session.js`: intro → ett kort i taget → klart. Autosave efter varje svar, återupptagning, timer som räknar uppåt med pausförslag efter 20 min, knapp för att pausa och spara.
- `views/mission.js` och vägen `#/missions/:id`: slår upp dagens uppdrag och lämnar det till modulens vy.
- "Uppdrag" listar dagens uppdrag med status i text. "Starta dagens uppdrag" går direkt till första ofärdiga uppdraget.
- `lib/speech.js`: valfri uppläsning med knappen "Lyssna" (`en-GB` för engelska, `sv-SE` för svenska).
- Exempeldata: `exam-english-w47.json` (10 höstglosor) och `exam-biology.json` (5 exempelbegrepp, `"placeholder": true`). Båda har provdatum `PLACEHOLDER`.
- Routern kör nu en `cleanup()` från vyn innan nästa vy visas (stoppar timern och sparar).

### Val och alternativ
| Beslut | Valt | Alternativ | Varför |
|---|---|---|---|
| Svarssätt | Vänd kortet och bedöm själv ("Ja, jag kunde det" / "Inte än") | Skriva svaret | Lägst tröskel att komma igång, fungerar för både glosor och begrepp med långa förklaringar, och inga stavningsfällor. |
| Nytt försök vid "Inte än" | Kortet kommer tillbaka 3 kort senare, högst 2 gånger per pass | Direkt igen / aldrig i samma pass | Ger ett nytt försök utan att fastna på samma kort. |
| Räknare | "Kort 3 av 20", omförsök visas som "Nytt försök" | Total som växer vid omförsök | Passet ska aldrig se ut att bli längre. |
| Repetitionsintervall | Låda 1 varje dag, låda 2 varannan, låda 3 var 4:e dag. Från 2 dagar före provet: allt som inte övats idag | Fast schema | Enkel Leitner som ändå trappar upp inför provet. |
| Ordning | Lägsta lådan först, aldrig samma kort i båda riktningarna direkt efter varandra | Slumpad | Förutsägbart och testbart. |
| Provdatum `PLACEHOLDER` | Visas som "Provdatum är inte bestämt än" och uppdraget finns ändå | Dölja uppdraget | Går att öva innan datumet är inlagt. |
| Uppdrag per dag | Ett uppdrag per prov och dag (`exam-<id>-<datum>`) | Ett uppdrag per prov totalt | Passar livscykeln start → in progress → done per dag. Leitner-lådorna sparas separat. |
| Feedback | Kvackis i en synlig ruta ovanför kortet, samma ruta är `aria-live="polite"` | Bara för skärmläsare | Alla ser feedbacken direkt. |
| Uppläsning | `src/js/lib/speech.js` | Lägga i `core/` | Inte en del av core-listan i CLAUDE.md. |
| Slutskärm | Visar antal övade kort, aldrig antal rätt | Visa resultat | Följer principen om ansträngning, inte antal rätt. |

### Testat
- `npm test`: 6 av 6 godkända (lådor, intervall, urval, omförsök).
- Hela flödet i webbläsaren: Idag → första kortet → "Inte än" → omförsök → klart. Loggen fick 1 start, 21 progress och 1 done.
- Återupptagning efter omladdning och efter att man lämnat vyn mitt i ett pass.
- Pausförslaget visas efter 20 min (simulerat).
- axe: 0 fel på Idag, Uppdrag, intro, kort, visat svar och slutskärm.
- Tangentbord: Tab till "Visa svaret", fokus flyttas till svaret och sedan till nästa kort.
- 320 px bredd: ingen horisontell scroll. `npm run validate`: 0 fel.

### Kvar för dig att avgöra
- Riktiga provdatum (`examDate` i formatet `ÅÅÅÅ-MM-DD`) och riktiga biologibegrepp.
- ~~Självbedömning eller skrivläge?~~ Beslut: självbedömning behålls.
- Är 10 minuter och 20 kort lagom? Värdet ändras i `SESSION_MINUTES` i `modules/exam.js`.
- Uppläsningen beror på vilka röster som finns i iPhonen. Testas efter publicering.

---

## Fas 3 – Läsning (2026-11-14)

### Vad som byggdes
- `modules/reading-plan.js`: ren logik för läsplanen (ISO-veckor, dagens sidor, hur långt efter planen man är). 6 enhetstester.
- `modules/reading.js` och `data/reading-vitsippor.json` med veckoplanen v43–v48 (s. 3–166) och tre generiska frågor.
- `views/reading-session.js`, stegen:
  1. "Var är du i boken?" Man skriver vilken sida man läst till.
  2. "Dagens läsning" visar förslaget, en neutral rad om planen och läsläget (Själv / Tillsammans med någon / Lyssnar på boken).
  3. "Nu läser du": börja med en sida, timern räknar uppåt, pausa och spara.
  4. "Var kom du?" Man skriver sidan man läste till.
  5. "Svara på frågor" eller "Berätta muntligt för en vuxen" → klart.
- `views/form.js`: fält med synliga etiketter, hjälptext och vänliga felmeddelanden i text (3.3.1), samt radioknappar med stora tryckytor.
- `lib/clock.js` och `views/pause-notice.js`: timern och pausförslaget delas nu av prov och läsning.

### Val och alternativ
| Beslut | Valt | Alternativ | Varför |
|---|---|---|---|
| Dagens sidor | Veckans återstående sidor delat på återstående dagar (mån–sön), högst 15 per dag (`maxPagesPerDay`) | Fast antal sidor per dag | Anpassar sig om man ligger före eller efter, utan att ett enskilt pass blir för stort. |
| Ligger efter | Jämförs med planens början på veckan, inte dag för dag | Daglig jämförelse | Mindre tjat. Visas i en neutral ruta med info-ikon, guldkant och aldrig rött. |
| Sidor före planen | Sida 1–2 räknas inte (planen börjar på s. 3) | Börja på s. 1 | Följer skolans plan. |
| Läsläge | Väljs innan man börjar läsa, sparas i loggen, påverkar inget annat | Väljs efteråt | Alla tre räknas lika. Texten säger det också. |
| Frågor | Valfria att svara på, inga krav på längd, sparas i loggen till föräldraläget | Obligatoriska | Ansträngning, inte prestation. |
| Muntligt | Visar frågorna som stöd, sedan "Vi har pratat" | Bara en knapp | Hjälper den vuxna att veta vad man kan prata om. |
| Sidfält | `type="text"` med `inputmode="numeric"` | `type="number"` | Bättre för skärmläsare och ingen scroll som av misstag ändrar värdet. Ger ändå sifferknappsatsen på iPhone. |
| Tom feedbackruta | Visuellt dold när den är tom | `display: none` | Live-regionen ligger kvar i tillgänglighetsträdet så att VoiceOver läser upp ny text. |

### Testat
- `npm test`: 12 av 12 godkända.
- Hela flödet: felaktig sida ("sextio", 200) ger vänligt fel i text med `aria-invalid` och fokus i fältet → s. 60 → förslag s. 61–75 och "14 sidor efter planen" → läsa → avbryta och återuppta → s. 70 → frågor → klart.
- Muntliga vägen och läsläget "tillsammans" sparas i loggen.
- Kortflödet fungerar fortfarande efter att timern flyttades till en delad fil.
- axe: 0 fel i alla steg. Tangentbord: piltangenter i radiogruppen, Enter skickar formulär, fokus flyttas till varje stegs rubrik.
- 320 px: ingen horisontell scroll. `npm run validate`: 0 fel.

### Kvar för dig att avgöra
- Är 15 sidor per dag lagom som tak? Ändras med `maxPagesPerDay` i JSON-filen.
- Ska läsningen räknas över helgen (7 dagar) eller bara vardagar? Nu räknas alla 7 dagar.
- Svaren på frågorna sparas på enheten och visas i föräldraläget i Fas 4. Är det okej, eller ska de inte sparas alls?
