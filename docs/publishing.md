# Publicera Kvackademin på GitHub Pages

Appen är statisk (HTML, CSS, JS och JSON), så GitHub Pages kan servera repot direkt. Det behövs ingen byggtjänst: `css/main.css` är redan kompilerad och committad.

Adressen blir: **https://the-big-dabrowski.github.io/kvackademin/**

## 1. Kontrollera innan du publicerar

```bash
npm run build
```

```bash
npm test
```

```bash
npm run validate
```

```bash
git status
```

`git status` ska inte visa några ändringar. Om `css/main.css` ändrades av `npm run build`, committa den.

**Integritet:** repot blir publikt. Titta igenom `data/` en gång till: inget namn, ingen skola, ingen klass. Tänk på att bokens titel och veckoplanen i `data/reading-vitsippor.json` också blir publika.

## 2. Skapa repot på GitHub och pusha

### Alternativ A: med GitHub CLI (`gh`)

```bash
gh repo create kvackademin --public --source=. --remote=origin --push
```

### Alternativ B: på github.com

1. Gå till https://github.com/new.
2. Repository name: `kvackademin`. Välj **Public**. Kryssa inte i README, .gitignore eller licens.
3. Klicka **Create repository** och kör sedan:

```bash
git remote add origin https://github.com/the-big-dabrowski/kvackademin.git
```

```bash
git push -u origin main
```

## 3. Slå på GitHub Pages

### På github.com
1. Öppna repot → **Settings** → **Pages**.
2. Under **Build and deployment**: Source = **Deploy from a branch**.
3. Branch = **main**, mapp = **/ (root)**. Klicka **Save**.
4. Vänta 1–2 minuter. Adressen visas överst på sidan.
5. Kontrollera att **Enforce HTTPS** är ikryssat. HTTPS behövs för delning, kopiering och PIN-hashen.

### Eller med GitHub CLI

```bash
gh api -X POST repos/the-big-dabrowski/kvackademin/pages -f "source[branch]=main" -f "source[path]=/"
```

Filen `.nojekyll` i roten gör att GitHub serverar filerna som de är, utan Jekyll.

## 4. Uppdatera appen senare

1. Gör ändringen och kör `npm run build` om du ändrat Sass.
2. Committa och pusha:

```bash
git push
```

3. GitHub Pages publicerar om automatiskt inom någon minut. Webbläsare kan cacha filer i upp till 10 minuter.
4. På iPhone: stäng hemskärmsappen helt (svep upp i appväxlaren) och öppna den igen.

## 5. Lägg appen på hemskärmen (iPhone)

1. Öppna adressen i **Safari**.
2. Tryck på **Dela** (fyrkanten med pil uppåt).
3. Välj **Lägg till på hemskärmen** och tryck **Lägg till**.

Ikonen är Kvackis och namnet är "Kvackademin".

All data sparas lokalt i den installerade appen. Safari och hemskärmsappen delar **inte** data med varandra, så använd alltid samma (hemskärmsappen). Det finns ingen säkerhetskopia just nu, så tar man bort appen börjar övningen om.

## 6. Testa efter publicering

Det här kunde inte testas lokalt och behöver göras på den publicerade adressen, helst på iPhone 11:

- [ ] **Lighthouse** (Chrome på datorn, DevTools → Lighthouse → Accessibility, Mobile) på `/`, `#/missions` och ett prov. Mål: ≥ 90. Lokalt blev alla 100.
- [ ] **VoiceOver** (Inställningar → Hjälpmedel → VoiceOver):
  - Svep genom Idag: rubrik "Idag", Kvackis-texten, knappen "Starta dagens uppdrag".
  - Vid vybyte ska VoiceOver läsa den nya rubriken.
  - På ett kort ska det engelska ordet läsas med engelskt uttal.
  - Feedback från Kvackis ska läsas upp efter ett svar.
  - När man skriver ett svar ska ordet som ska översättas läsas upp tillsammans med fältet.
- [ ] **Zoom:** Safari → aA → 200 %, och Inställningar → Skärm och ljusstyrka → Textstorlek störst. Inget ska behöva scrollas i sidled.
- [ ] **Liggande läge:** vrid telefonen. Allt ska fungera.
- [ ] **Skriva svar:** tangentbordet ska stanna uppe från kort till kort och inte rätta orden automatiskt.
- [ ] **Lyssna:** uppläsning på engelska och svenska. Beror på vilka röster som är installerade (Inställningar → Hjälpmedel → Uppläst innehåll → Röster).
- [ ] **Återuppta:** börja ett pass, stäng appen helt, öppna igen.
