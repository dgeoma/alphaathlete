# alphaathlete.com

Il sito di Alpha Athlete, una community di Alpha Group.

Sito statico costruito con [Astro](https://astro.build). Font e immagini sono locali, non ci sono script di terze parti né strumenti di tracciamento.

## Avvio

```bash
npm install
npm run dev
```

## Struttura

- `src/pages/` le pagine (home, regole, privacy, grazie, 404)
- `src/components/` i componenti (apertura, stendardo, tappe, questionario…)
- `src/data/` i testi condivisi fra più pagine
- `src/config.ts` le impostazioni del sito
- `public/` fogli di stile, script e immagini

## Pubblicazione

Ogni push su `main` pubblica il sito su GitHub Pages (`.github/workflows/pages.yml`).

© Alpha Consulting Group FZE
