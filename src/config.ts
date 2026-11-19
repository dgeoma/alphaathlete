// Impostazioni del sito, in un posto solo.

/** Dominio definitivo, senza www (decisione D17). Usato per canonical e og:url. */
export const SITO = 'https://alphaathlete.com';
export const NOME_SITO = 'Alpha Athlete';

/** Il sito non è ancora pubblico: finché è `true` ogni pagina esce con <meta name="robots" content="noindex, nofollow">.
 *  Il giorno della pubblicazione: metti `false` qui e riscrivi public/robots.txt (oggi vieta tutto). */
export const SITO_NON_PUBBLICO = true;

/** Le lettere via email (la riga `#lettere` in fondo alla home e la spunta facoltativa nel passo «contatti» del
 *  questionario). Finché è `false`:
 *   - <Questionario> toglie da solo la spunta delle lettere (mette `lettere: false` nel passo «contatti»),
 *     e `consenso_lettere` parte sempre `false`;
 *   - la home non deve stampare la riga `#lettere`: `{LETTERE_ATTIVE && ( …riga… )}`. */
export const LETTERE_ATTIVE = false;

/** L'email di conferma al candidato (pagina /grazie/). Finché è `false` la pagina NON promette nessuna email di
 *  conferma: oggi non esistono né il mittente né la casella che George legge. Si accende quando l'email parte davvero. */
export const CONFERMA_EMAIL = false;

/** Il webhook a cui il questionario manda le candidature (POST JSON). <Questionario> lo scrive nel JSON in pagina
 *  («hook») e public/candidatura.js lo legge da lì. VUOTO = modalità prova: niente parte in rete, e il modulo lo
 *  dice con un avviso su qualunque indirizzo. Il build si ferma se il sito è pubblico (`SITO_NON_PUBBLICO = false`)
 *  e questo è ancora vuoto: una candidatura non deve poter sparire nel nulla. */
export const WEBHOOK_CANDIDATURA = '';

/** Coda aggiunta agli indirizzi di CSS e JS in public/ per svuotare la cache: cambia da sola a ogni build. */
export const VERSIONE = new Date().toISOString().slice(0, 16).replace(/\D/g, '');

/** Meta del sito (copy v2 §7). La home li usa tutti; le pagine di servizio hanno il loro <title> e, per il resto,
 *  questi. L'immagine per le anteprime dei link è public/assets/og-alpha-athlete.jpg (1200×630), fatta come chiede
 *  il copy v2 §7: Λ e nome, il claim, la riga piccola, il tempio a destra. Sorgente: _non-online/og/og.html. */
export const META = {
  titolo: 'Alpha Athlete · Community per atlete e atleti del digitale',
  descrizione: 'Community privata per atlete e atleti del digitale. Costruisci un mestiere da freelance in IT e AI, e lavori su di te. Corso a tappe, si entra su candidatura.',
  ogTitolo: 'Qui alleni il mestiere. E alleni te.',
  ogDescrizione: 'Alpha Athlete è una community privata con un corso a tappe, per atlete e atleti del digitale. Si entra con una candidatura scritta e un colloquio.',
  ogImmagine: '/assets/og-alpha-athlete.jpg',
  ogImmagineAlt: 'Il tempio di Apollo a Delfi in costruzione, con i robot al lavoro e uno stendardo blu appeso al ponteggio. Sopra, il nome Alpha Athlete.',
};
