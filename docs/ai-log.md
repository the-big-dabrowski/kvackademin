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
- ~~Ska svaren på frågorna sparas?~~ Beslut: ja, de sparas på enheten och visas i föräldraläget i Fas 4.

---

## Fas 4 – Logg, rapport och föräldraläge (2026-11-14)

### Vad som byggdes
- `core/rewards.js`: coins och XP räknas fram ur loggen. 5 kr per genomfört uppdrag, tak 25 kr per ISO-vecka och 100 kr per kalendermånad. XP: 1 per svar eller steg, 10 per genomfört uppdrag, inget tak. 5 enhetstester.
- `core/log.js`: import som slår ihop loggar utan dubbletter. `core/missions.js` sparar nu uppdragets titel i loggen vid start och klart.
- `core/report.js`: dagens rapport ur loggen. Varje modul har en `summarize(meta)` som ger en rad, till exempel "läste sidorna 61–72, läste själv, svarade på frågor".
- `core/settings.js`: mottagare för rapporten (standard "pappa") och PIN-hash.
- `views/report.js` ("Dagens rapport"): lista över dagens uppdrag, coins den här veckan, knappen "Skicka till pappa" (Web Share API) och "Kopiera text" som reserv. Texten som skickas syns i en ruta.
- `views/mission-done.js`: gemensam avslutning efter varje uppdrag med coins och en primär knapp: "Nästa uppdrag: …" eller "Till dagens rapport".
- `views/parent.js` ("Förälder"): skapa PIN, lås upp, coins och XP, tabeller per vecka och månad, logg per dag med läsfrågornas svar, mottagare för rapporten, export och import, lås.
- Idag visar "Se dagens rapport" som enda knapp när allt är klart.

### Val och alternativ
| Beslut | Valt | Alternativ | Varför |
|---|---|---|---|
| Coins sparas | Räknas fram ur loggen varje gång | Spara ett saldo | Kan aldrig hamna i otakt med loggen, och taken följer med vid import. |
| Coins per uppdrag | 5 kr (max 5 uppdrag per vecka ger taket) | Olika belopp per typ | Enkelt och lika för alla uppdrag. |
| Vecka/månad | ISO-vecka och kalendermånad, båda tak gäller | Bara veckotak | Månadstaket på 100 kr spelar roll i månader med fem veckor. |
| PIN | Saltad SHA-256-hash, 4–8 siffror, klistra in tillåtet (3.3.8) | Klartext | Lätt spärr, inte riktig säkerhet: den som rensar webbplatsdata rensar också PIN-koden. Utan säker anslutning (http på lokalt nät) används en enklare hash. |
| Upplåst läge | Bara i minnet medan vyn är öppen | Kom ihåg upplåsning | Barnet kan inte gå in i föräldraläget efter att en vuxen lämnat det. |
| Glömd PIN | Förklaring: rensa webbplatsdata | Återställ-knapp | En knapp skulle barnet också kunna använda. |
| Mottagare | Inställning i föräldraläget, standard "pappa" | Hårdkodat "pappa" | Fungerar för alla familjer och lägger inget namn i koden. |
| Export | All sparad data som JSON | Bara loggen | Kan återställa allt på en ny enhet. |
| Import | Loggen slås ihop utan dubbletter, övrig data ersätts, PIN och inställningar ändras inte | Ersätt allt | Inget försvinner av misstag, och man låser inte ut sig med en gammal PIN. |
| Rapporttext | Titel och en rad per uppdrag, coins för veckan, inga svar och inga minuter | Allt från loggen | Kort, och läsfrågornas svar stannar på enheten. |

### Testat
- `npm test`: 17 av 17 godkända.
- Hela dagen i webbläsaren: glosor → "Nästa uppdrag" → biologi → läsning med frågor → "Till dagens rapport". Coins 5, 10, 15 av 25. Idag visar "Se dagens rapport".
- "Kopiera text" fungerar med reserv via markerad text. Web Share finns inte i testwebbläsaren och testas på iPhone efter publicering.
- PIN: för kort kod och olika koder ger vänliga fel i text, fel PIN ger "Försök igen", upplåst läge låses när man lämnar vyn.
- Export → rensa → import återställer alla 39 händelser. En andra import lägger till 0. En trasig fil ger ett vänligt fel.
- axe: 0 fel på rapport, föräldraläge (låst och upplåst), Idag och Uppdrag. 320 px: ingen horisontell scroll. `npm run validate`: 0 fel.

### Kvar för dig att avgöra
- ~~Är 5 kr per uppdrag rätt nivå?~~ Ändrat, se uppföljning nedan.
- Ska barnet se XP någonstans? Nu syns XP bara i föräldraläget.
- Behövs "Byt PIN-kod" och "Rensa all data" i föräldraläget? Inte byggt.
- Exportknappen laddar ner en fil. Testas på iPhone efter publicering.

### Uppföljning: belopp per uppdrag (2026-11-14)
Du ville att beloppet skulle räknas fram utifrån månadstaket 100 kr, med veckotaket 25 kr kvar.
- **Beräkning:** 100 kr / (30,4 dagar × 3 uppdrag per dag) ≈ 1,10 kr per uppdrag. Avrundat till hela 10 öre.
- **Effekt:** alla uppdrag en hel vecka ger 21 × 1,10 = 23,10 kr (under veckotaket). En månad med 31 dagar ger 102,30 kr, som stoppas av taket på 100 kr. Månader med 30 dagar ger 99 kr.
- **Teknik:** alla belopp räknas i öre (heltal) och visas som "1,10 kr". Beräkningen står i `core/rewards.js` (`EXPECTED_MISSIONS_PER_DAY`, `AVERAGE_DAYS_PER_MONTH`), så beloppet ändras automatiskt om antalet uppdrag per dag ändras där.
- **Alternativ:** 1 kr (enklare tal, ger högst 91–93 kr i månaden) eller räkna om beloppet efter hur många uppdrag som faktiskt finns varje dag (blir olika belopp olika dagar, svårare för barnet att förstå).
- **Testat:** 19 av 19 tester godkända, bland annat att en hel vecka ger 23,10 kr och att en hel månad med 31 dagar landar på exakt 100 kr.

**Kvar för dig att avgöra:** antalet uppdrag per dag är nu 3 (glosor, biologi, läsning). Om det blir fler eller färre uppdrag framöver, ska `EXPECTED_MISSIONS_PER_DAY` ändras så att månaden fortfarande landar på ungefär 100 kr?

---

## Fas 5 – Granskning och publicering (2026-11-14)

### Definition of done
| Krav | Resultat | Hur |
|---|---|---|
| Mobile first | Uppfyllt | Alla stilar utgår från minsta skärmen, media queries bara uppåt. |
| Godkänd HTML-validering | Uppfyllt för `index.html`, delvis för vyerna | `npm run validate`: 0 fel. Vyerna byggs i JS; deras markup har granskats manuellt i 16 lägen och med axe, men inte med en validator. |
| Lighthouse ≥ 90 tillgänglighet | Uppfyllt lokalt | 100 på Idag, Uppdrag, prov, läsning, rapport och föräldraläge (mobil). Best practices 100 (96 på en vy på grund av att den lokala Python-servern tappade anslutningar under testet, inte ett fel i appen). Körs igen på publicerad adress. |
| Tangentbord | Uppfyllt | Hela flödet med Tab, Enter och piltangenter. Fokus flyttas till rubrik vid vybyte och mellan steg. |
| Zoom 200/400 % | Uppfyllt i simulering | 320 px bredd + ökat textavstånd i alla vyer: ingen horisontell scroll, inga element utanför. Riktig zoom i Safari testas efter publicering. |
| Kontrast | Uppfyllt | Alla tokens uppmätta (text ≥ 6,2:1, kanter ≥ 4,8:1). axe: 0 kontrastfel. |
| Rubriker | Uppfyllt | En h1 per vy, h2 för steg och uppdrag, h3 för dagar i loggen. Ingen nivå hoppas över. |
| Formulär | Uppfyllt | Synliga etiketter, hjälptexter med `aria-describedby`, fel i text med ikon och `aria-invalid`, fokus till fältet. |
| axe | Uppfyllt | 0 fel i alla vyer och steg. |
| VoiceOver på iPhone | Inte gjort | Kräver riktig iPhone. Checklista i `docs/publishing.md`. |

### Rättat i den här fasen
- Uppdragslistan skrev ut texten "null" när det fanns uppdrag kvar. Rättat.
- Föräldraläget hittade statusrutan via en BEM-klass. Använder nu `data-js`.
- Fristående textlänkar ("Tillbaka till Idag" m.fl.) var 22 px höga. Har nu en egen klass `.text-link` med minst 44 px.

### Avvikelser från CLAUDE.md som är kvar
1. **Engelska ord utan `lang="en"` (3.1.2):** "coins" och "XP" står i svensk UI-text. Förslag: byt till svenska ("mynt" och "poäng") eller markera dem med `lang="en"`.
2. **Filer utanför fillistan:** `core/data.js`, `core/rewards.js`, `core/report.js`, `core/settings.js` samt mappen `lib/` (speech, clock, share, pin, dates). Alla följer arkitekturen men står inte i listan.
3. **`.u-visually-hidden`** är inte BEM (beslutat att behålla).
4. **Exempeldata:** provdatum är `PLACEHOLDER` och biologibegreppen är exempel.

### Övrigt att känna till
- **Offline:** ingen service worker, så hemskärmsappen behöver nätverk för att starta. Inget krav i CLAUDE.md, men rekommenderas som nästa steg.
- **Många små filer:** ungefär 35 JS-moduler laddas var för sig (ingen bundler enligt CLAUDE.md). Fungerar bra över HTTP/2 på GitHub Pages, men första laddningen blir långsammare på svag uppkoppling.
- **Publikt innehåll:** bokens titel och veckoplanen blir publika med repot.
- **Ej byggt:** "Byt PIN-kod" och "Rensa all data" i föräldraläget.
- **Testas efter publicering:** Web Share, export på iPhone, uppläsningens röster, VoiceOver, riktig zoom och liggande läge.

### Publicering
Steg för steg i `docs/publishing.md`: kontroll före publicering, skapa repot (med `gh` eller på github.com), slå på Pages från `main` / root, uppdatera, lägga på hemskärmen och en checklista för test efter publicering.

### Kvar för dig att avgöra
- "coins" och "XP": svenska ord eller `lang="en"`?
- ~~Ska jag publicera?~~ Publicerat 2026-11-14, se nedan.
- Ska offline-stöd (service worker) byggas innan appen används på riktigt?

### Publicerat (2026-11-14)
- Repo: https://github.com/the-big-dabrowski/kvackademin (publikt), skapat via github.com i webbläsarpanelen.
- `main` pushad. GitHub Pages bygger från `main` / root, HTTPS påtvingat.
- Live: https://the-big-dabrowski.github.io/kvackademin/
- Kontrollerat på live-adressen: sidan, CSS, JS, data, manifest, logo och fonter svarar 200. Säker kontext (HTTPS) och SubtleCrypto finns. Inga konsolfel. Uppdragslistan laddar alla tre uppdrag.
- Kvar: checklistan i `docs/publishing.md` på iPhone (VoiceOver, delning, uppläsning, export, zoom, liggande läge).

## Förenklad version: glosor och prov med direkt rättning (2026-11-15)

### Bakgrund
Efter första körningen: att få ut barnets svar krävde antingen flera steg i iPhones dela-meny eller en GitHub-nyckel på barnets telefon. Beslut: ta bort belöningar, föräldrasida och rapport tills vidare och fokusera på frågor som rättas direkt. Läsdelen vilar.

### Vad som byggdes
- **Svarslägen** (`answerMode`) per prov, per riktning eller per kort: `type` (skriv), `choice` (flerval) och `self` (vänd kortet, som tidigare).
- **Rättning** i `lib/answers.js`: stora/små bokstäver, mellanslag och skiljetecken ignoreras. Ett stavfel godkänns i ord med minst 5 bokstäver. Extra godkända svar via `acceptBack`/`acceptFront`.
- **Flerval:** felalternativen hämtas från andra kort i samma prov (eller `choicesBack`/`choicesFront`). Ordningen är stabil per kort, så den inte hoppar runt vid omladdning.
- **Efter svar:** "Rätt!" eller "Inte riktigt än." i text och ikon (inte bara färg), rätt svar visas, Kvackis svarar via `aria-live`, och en knapp "Nästa kort". Fel kort kommer tillbaka senare i passet som förut. "Jag vet inte" finns som lugn utväg.
- **Skriv-läget:** fältet får fokus på varje kort så att tangentbordet stannar uppe. Autokorrigering och stor bokstav är avstängt. Ordet som ska översättas är kopplat till fältet med `aria-describedby`.
- **Borttaget:** coins/XP (`rewards.js`), föräldrasidan och PIN (`parent.js`, `pin.js`, `settings.js`), rapport och delning (`report.js`, `share.js`) samt tillhörande Sass. Allt finns i git-historiken.
- **Läsdelen** är kvar i koden men inte med i `data/index.json`.
- **`tests/data.test.js`** kontrollerar alla `exam-*.json`: giltig JSON, obligatoriska fält, datumformat, svarslägen och unika id:n.
- **`docs/content-guide.md`:** hur man lägger in ett nytt prov på github.com, med mall.
- Engelska glosor: skriv-läge. Biologi: flerval (förklaringarna är för långa att skriva).

### Kontrollerat
`npm test` (21 gröna), html-validate, axe 0 fel på kort, resultat och Idag, ingen sidscroll vid 320 px. Flödena körda hela vägen i webbläsaren.

### Alternativ som diskuterades
- Automatisk sändning av svar till ett privat GitHub-repo: kräver nyckel på barnets telefon och internet. Valdes bort.
- Dela-knapp efter varje svar eller i slutet: för många steg utanför appen. Valdes bort.

### Kvar för dig att avgöra
- Säkerhetskopia av framstegen, nu när föräldrasidan är borta (just nu finns ingen).
- Hur du vill se barnets resultat framöver.
- Riktiga provdatum och biologibegrepp.
- När läsdelen ska tillbaka, och då med kontrollfrågor i JSON.
- Typsnittet (Pixelify Sans) är inte ändrat än.

## Biologiprovet "Den levande planeten" (2026-11-15)

### Vad som gjordes
- `data/exam-biology.json` ersatt med det riktiga provet: 22 frågor och 24 begrepp i fyra avsnitt. Exempelbegreppen är borta.
- Filen anpassades lite för att appen ska kunna läsa den: `"answerMode": "self"` i stället för `"self-assessment"`, `"Biologi"` med stor bokstav, samt etiketterna `front` och `back` ("Fråga" och "Svar").
- **Nytt fält `kinds`:** standardvärden per korttyp. Frågor (`question`) övas bara framåt, eftersom det är svårt att gissa frågan utifrån svaret. Begrepp (`term`) övas åt båda hållen och visas som "Begrepp" och "Förklaring".
- **Nytt fält `directions`** på kort och i `kinds`, till exempel `["forward"]`. Flashcard-motorn skapar bara de riktningar som kortet tillåter.
- I flerval tas felalternativ bara från kort av samma `kind`.
- `examDate` får vara `null` när datumet inte är bestämt.
- `tests/data.test.js` och `docs/content-guide.md` uppdaterade.

### Kontrollerat
`npm test` (23 gröna), html-validate. I webbläsaren: 70 övningar (22 frågor framåt plus 24 begrepp åt båda hållen), frågekort med "Fråga/Svar" och begreppskort med "Begrepp/Förklaring".

### Alternativ
- Använda filen exakt som den klistrades in, med appen ändrad för att läsa `"self-assessment"`. Valdes bort för att svarslägena ska heta likadant i alla filer.
- Visa avsnittet (`section`) och `tips` i appen. Inte gjort än.

### Kvar för dig att avgöra
- Provdatum.
- Om avsnitt och tips ska visas, och om barnet ska kunna välja avsnitt.
- Ordningen: första dagarna kommer mest frågor, eftersom korten tas i filens ordning. Ska frågor och begrepp blandas?
