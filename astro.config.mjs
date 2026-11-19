import { defineConfig } from 'astro/config';

// La pagina di lavoro /kit/ (ogni componente con testo segnaposto e un questionario di prova) esiste solo con
// `npm run dev`: il build non la scrive, quindi non può finire online. Il file è src/kit/kit.astro.
const kitSoloInSviluppo = {
  name: 'kit-solo-in-sviluppo',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev') injectRoute({ pattern: '/kit', entrypoint: './src/kit/kit.astro' });
    },
  },
};

export default defineConfig({
  integrations: [kitSoloInSviluppo],
  site: 'https://alphaathlete.com',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'never' },
  compressHTML: false,
  devToolbar: { enabled: false },
  // Three.js (sfera armillare) pesa circa 520 kB: è un pezzo a parte, scaricato solo su desktop dopo il caricamento.
  vite: { build: { chunkSizeWarningLimit: 600 } },
});
