# AI-logg

En post per fas: vad AI:n föreslog, vilka alternativ som fanns och vad som är kvar att avgöra.

---

## Fas 1 – Grund (2026-11-14)

### Vad som byggdes
- Projektstruktur enligt specen, npm-skript (`sass`, `build`, `validate`, `serve`).
- Sass 7-1 med BEM, en block per fil. Design tokens som CSS custom properties i `abstracts/_tokens.scss`.
- Lokalt hostade fonter: Atkinson Hyperlegible (brödtext) och Pixelify Sans (rubriker), båda OFL.
- Logo och hemskärmsikoner gjorda av den bifogade ankbilden (vit bakgrund borttagen, beskuren).
- Core: `storage.js`, `registry.js`, `log.js`, `missions.js`, `router.js`, plus `data.js`.
- Vyer: start (en knapp), dagens uppdrag (tomt läge), 404.
- `manifest.webmanifest` och iOS-metataggar för hemskärmen.

### Förslag och alternativ
| Beslut | Valt | Alternativ | Varför |
|---|---|---|---|
| Routing | Hash-router (`#/uppdrag`) | History API | GitHub Pages saknar fallback till index.html; hash fungerar utan 404-hack. |
| Storage-API | Asynkront (Promise) | Synkront som localStorage | Gör det möjligt att byta till IndexedDB/Capacitor utan att ändra anropen. |
| Datainläsning | Egen fil `core/data.js` | Lägga det i `missions.js` | Håller `missions.js` fri från fetch-logik. Avviker lite från fillistan i specen. |
| Pixelfont | Pixelify Sans | Press Start 2P, Silkscreen | Mer läsbar och smalare, klarar svenska tecken. |
| Fokus vid första laddning | Stannar överst | Fokus på h1 direkt | Då hittar man skip link först. Vid vybyte flyttas fokus till h1. |
| Skip link | JS flyttar fokus utan att ändra hash | Vanlig `#main`-länk | `#main` skulle annars tolkas som en väg av routern. |
| Sticky header | Bara vid skärmhöjd ≥ 30em | Alltid sticky | Vid stark zoom skulle headern kunna dölja fokus (2.4.11). |
| Reset | Egen minimal reset i `vendors/` | normalize.css | Inga externa beroenden. |
| Dev-server | `python3 -m http.server` | http-server via npx | Inget extra paket att ladda ner. |

### Uppmätt kontrast
Text: 13.1 (text/pergament), 14.7 (text/panel), 6.8 (dämpad/pergament), 7.9 (vit/blå knapp), 6.5 (vit/grön), 9.0 (text/guld).
UI-kanter: 4.8 (kant/pergament), 6.9 (blå knapp/pergament), 13.1 (fokusring).

### Testat
- axe-core (WCAG 2.0–2.2 A/AA + best practice): 0 fel på start, uppdrag och 404.
- `html-validate`: 0 fel på `index.html`.
- 320 px bredd, 200 % text + ökat textavstånd: ingen horisontell scroll.
- Tangentbord: skip link → h1, Tab → knapp, Enter → vybyte, fokus till ny h1, `document.title` uppdateras.
- Livscykel start → progress → done skriver rätt poster i loggen.

### Kvar för dig att avgöra
- Namnet "Quackify" (arbetsnamn).
- Ska appen fungera offline (service worker)? Föreslår ja i en senare fas.
- Ordning för fas 2: jag föreslår flashcards-motorn + exam-modulen först.
- VoiceOver på riktig iPhone och Lighthouse är inte körda än.
