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
