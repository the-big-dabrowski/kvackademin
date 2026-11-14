# Kvackademin (arbetsnamn)

Läxapp som gör det lättare att komma igång med skolans riktiga läxor. Byggd för iPhone (Safari, hemskärmen) och hostas på GitHub Pages.

## Kom igång

```bash
npm install
npm run sass     # bevakar och kompilerar Sass medan du jobbar
npm run serve    # http://localhost:8080
```

Innan commit: `npm run build` (komprimerad CSS), `npm test` (enhetstester) och `npm run validate` (HTML).

Publicering och test efter publicering: se [docs/publishing.md](docs/publishing.md).

## Struktur
- `data/` – innehåll som JSON. `data/index.json` listar aktiva filer.
- `src/js/core/` – router, storage, registry, missions, log, data.
- `src/js/engines/` – återanvändbara motorer (t.ex. flashcards).
- `src/js/modules/` – uppdragstyper, registreras efter `type`.
- `src/js/views/` – vyer.
- `src/scss/` – Sass 7-1, kompileras till `css/main.css`.

## Licenser
Fonter: Atkinson Hyperlegible och Pixelify Sans, SIL Open Font License (se `fonts/`).
