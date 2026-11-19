// Anteprima su un indirizzo con sottocartella (es. https://utente.github.io/alphaathlete/).
// Il sito è scritto per stare alla radice di alphaathlete.com: tutti gli indirizzi interni partono da «/».
// Finché il dominio non è collegato, GitHub Pages lo serve sotto «/alphaathlete/» e quegli indirizzi non
// troverebbero niente. Questo script, DOPO il build, antepone il prefisso agli indirizzi interni di dist/.
//   node scripts/prefisso-anteprima.mjs /alphaathlete
// Con prefisso vuoto non fa niente: quando il dominio è collegato, il workflow gli passa una stringa vuota da solo.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const prefisso = (process.argv[2] || '').replace(/\/+$/, '');
const radice = process.argv[3] || 'dist';
if (!prefisso) { console.log('[prefisso] nessun prefisso: dist/ resta com\'è.'); process.exit(0); }
if (!/^\/[A-Za-z0-9._-]+$/.test(prefisso)) { console.error('[prefisso] prefisso non valido: ' + prefisso); process.exit(1); }

// cartelle e file che stanno alla radice del sito
const VOCI = readdirSync(radice).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
// un indirizzo interno comincia subito dopo: virgolette, apice, accento grave, «(», «=», spazio o virgola (srcset)
const INTERNO = new RegExp('(["\'`(=\\s,])/(' + VOCI + ')(?=[/"\'`?#)\\s,]|$)', 'g');
// la home: href="/"  ·  "/#candidatura"  ·  '/?prova=…'
const HOME = /(["'`])\/(?=["'`#?])/g;

let toccati = 0, cambi = 0;
(function giro(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { giro(p); continue; }
    if (!['.html', '.css', '.js', '.txt', '.xml', '.webmanifest', '.json'].includes(extname(n))) continue;
    const prima = readFileSync(p, 'utf8');
    let n1 = 0;
    const dopo = prima
      .replace(INTERNO, (_, a, b) => { n1++; return a + prefisso + '/' + b; })
      .replace(HOME, (_, a) => { n1++; return a + prefisso + '/'; });
    if (dopo !== prima) { writeFileSync(p, dopo); toccati++; cambi += n1; }
  }
})(radice);
console.log(`[prefisso] ${prefisso}: ${cambi} indirizzi in ${toccati} file.`);
