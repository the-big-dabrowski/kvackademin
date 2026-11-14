# Kvackademin (arbetsnamn)

Läxapp för barn runt 10 år med startsvårigheter. Syftet är att göra skolans riktiga läxor lättare att komma igång med. Maskoten Kvackis, en pixel art-anka med slips, är appens kompanjon och står för uppmuntran och feedback. Primär enhet: iPhone 11, Safari, installerad på hemskärmen. Hostas gratis på GitHub Pages (the-big-dabrowski.github.io/kvackademin), ingen egen domän.

## Stack
- HTML, Sass (Dart Sass CLI), vanilla JavaScript med ES modules. Inga ramverk, ingen bundler.
- Sass kompileras till css/main.css som committas. Script: `npm run sass` (watch) och `npm run build`.
- Använd `@use`/`@forward`, aldrig `@import`.
- Inga externa beroenden vid runtime: inga CDN:er, ingen tredjepartsanalys, inga Google Fonts-länkar. Fonter hostas lokalt.
- Kod, filnamn och JSON-nycklar på engelska. All UI-text på svenska.

## Arkitektur (skalbarhet)
- All innehållsdata ligger som JSON i /data. /data/index.json listar aktiva filer, eftersom statisk hosting inte kan lista en mapp.
- Varje datafil har ett `type`-fält. Moduler registreras i core/registry.js efter type. En ny typ av uppdrag ska kunna läggas till utan att ändra core.
- core/storage.js är ENDA stället som läser eller skriver localStorage. Den ska senare kunna bytas mot IndexedDB eller Capacitor utan att resten ändras.
- core/missions.js räknar ut dagens uppdrag från alla moduler. Varje uppdrag har samma livscykel: `start → in progress → done`.
- core/log.js sparar en händelse per livscykelsteg: `{ missionId, type, event, timestamp, meta }`.
- engines/flashcards.js: Leitner med 3 lådor, båda riktningarna, fel svar flyttar kortet till låda 1. Används av exam-modulen.
- Glosor och biologibegrepp är samma sak: ett `exam` med datum och kort.
- Autosave efter varje svar. Ett avbrutet pass ska kunna återupptas.
- Vyer: "Idag" (start, en knapp: "Starta dagens uppdrag"), "Uppdrag", "Förälder" och en 404-vy.

```
/index.html
/manifest.webmanifest
/css/main.css
/data/index.json, exam-*.json, reading-*.json
/src/scss/abstracts|vendors|base|layout|components|pages|themes + main.scss
/src/js/main.js
/src/js/core/router.js, storage.js, registry.js, missions.js, log.js
/src/js/engines/flashcards.js
/src/js/modules/exam.js, reading.js
/src/js/views/
/docs/ai-log.md
```

## Sass och BEM
- 7-1-struktur. En BEM-block per fil i components/.
- BEM: `.block__element--modifier`. Inga nästlade selektorer djupare än en nivå.
- JS hookar via `data-js="..."`, aldrig via BEM-klasser.
- Design tokens som CSS custom properties i abstracts/. Färger från mood boarden (pixel art, blått, grönt, guld, pergament), men varje textkombination måste klara 4.5:1 och varje UI-kant 3:1.
- Pixelfont endast i rubriker. Brödtext och frågor i en läsbar font, t.ex. Atkinson Hyperlegible (OFL, lokalt hostad). Text alltid på solid panel, aldrig direkt på illustration.
- Minimal design. Inga assets från mood boarden. Ikoner som enkla SVG med `aria-hidden="true"` plus synlig text.

## UX-principer (får inte brytas)
- En primär handling per skärm. Startskärmen har en knapp: "Starta dagens uppdrag".
- Första steget i varje uppdrag är litet, till exempel ett enda kort eller en enda sida.
- Ingen tidspress: inga nedräkningar, inga liv eller hjärtan, ingen belöning för hastighet. En timer räknar uppåt och föreslår paus efter 20 min.
- Coins och XP ges för genomfört uppdrag och ansträngning, aldrig för antal rätt. Coins-tak: 25 kr/vecka och 100 kr/kalendermånad. Ingen betalning i appen.
- Fel svar ger lugn, uppmuntrande feedback från Kvackis och ett nytt försök, aldrig ett straff.
- Inga topplistor, ingen chatt, ingen reklam.

## Tillgänglighet (WCAG 2.2 AA)
- Semantisk HTML, landmarks, skip link, en h1 per vy och korrekt rubrikordning.
- Vid vybyte (SPA): flytta fokus till vyns h1 och uppdatera document.title.
- Feedback på svar via `aria-live="polite"`.
- `lang="sv"` på html. Engelska ord markeras med `lang="en"` (3.1.2).
- Synligt fokus med hög kontrast som aldrig döljs (2.4.7, 2.4.11).
- Touch targets minst 44×44 px (överträffar 2.5.8).
- Fungerar vid 320 px bredd, 200 % zoom och ökat textavstånd (1.4.10, 1.4.4, 1.4.12).
- Färg är aldrig enda informationsbärare.
- `prefers-reduced-motion` respekteras. Inga animationer under övningar.
- Alla fält har synliga labels. Fel identifieras i text (3.3.1) i vänlig ton.
- Föräldra-PIN: tillåt inklistring (3.3.8).
- Valfri uppläsning med Web Speech API (`en-GB` för glosor, `sv-SE` för svenska), som en knapp, aldrig automatiskt.
- Allt fungerar med tangentbord, mus och touch.

## Integritet
- Repot är publikt: inget namn, ingen skola, ingen klass i kod, data eller commit-meddelanden.
- Ingen data lämnar enheten, utom det användaren själv delar via rapportknappen.
- Anropa `navigator.storage.persist()` vid start. Erbjud export och import av logg som JSON i föräldraläget.

## Arbetssätt
- Arbeta en fas i taget. Stanna efter varje fas och sammanfatta vad som byggts och hur jag testar det.
- Förklara viktiga beslut kort och varför.
- Små commits med raka citattecken i commit-meddelanden, aldrig typografiska.
- Efter varje fas: lägg till en post i docs/ai-log.md med vad du föreslog, vilka alternativ som fanns och vad som är kvar för mig att avgöra.

## Definition of done
Mobile first, godkänd HTML-validering, Lighthouse ≥ 90 på tillgänglighet, WCAG-snabbkoll (tangentbord, zoom 200/400 %, kontrast, rubriker, formulär, axe, VoiceOver på iPhone).
