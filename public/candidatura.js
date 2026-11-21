/* alphaathlete.com · questionario di candidatura
   Motore generico (provenienza: vedi README): nessun profilo, nessun ramo, nessun esito.
   I passi NON sono qui: si leggono dal JSON in pagina, <script type="application/json" id="candidatura-dati">.

   Schema del JSON:
   {
     "hook": "",                        // il webhook: lo mette <Questionario> da src/config.ts (WEBHOOK_CANDIDATURA). Vuoto = modalità prova
     "versione": "2026-11-v1",          // parte nel payload come «versione_questionario»; se cambia, le bozze vecchie non si riprendono
     "intro": "testo sopra il questionario (lo mostra già la pagina; qui serve solo come ripiego)",
     "passi": [
       { "chiave": "nome_campo", "titolo": "La domanda", "aiuto": "riga piccola sotto la domanda",
         "tipo": "singola" | "multipla" | "testo" | "testo_lungo" | "contatti" | "spunta",
         "gruppo": "Da dove parti",       // riga piccola sopra l'avanzamento (di solito uguale su più passi di fila)
         "sopra": "Riga di passaggio…",   // una riga sopra il titolo, per i passi che aprono un blocco nuovo
         "errore": "…",                   // sostituisce il messaggio generico («scelta», «obbligatorio») di questo passo
         "opzioni": ["Etichetta", { "valore": "id", "etichetta": "Etichetta", "nota": "riga piccola" }],
         "obbligatorio": true,            // se manca vale true
         "max": 600,                      // testo/testo_lungo: caratteri (se manca: 120 e 600); multipla: quante scelte al massimo
         "min": 10,                       // testo/testo_lungo: caratteri minimi (facoltativo)
         "segnaposto": "Es.: …",          // testo/testo_lungo (facoltativo)

         // solo «testo», «spunta» e «contatti»: un secondo campo, sempre facoltativo, con chiave, etichetta e
         // massimo propri. Nel passo «contatti» sta dopo il telefono e prima delle spunte
         "extra": { "chiave": "altra_chiave", "etichetta": "Etichetta del campo", "max": 200, "segnaposto": "…" },
         // è un campo a una riga (tipo «testo»); se manca "max" vale 200
         // se la chiave dell'extra è «link_facoltativo» e il campo non è vuoto deve sembrare un indirizzo
         // (un punto, nessuno spazio), altrimenti errore «link»

         // solo «spunta»: elenco numerato sopra la casella e link che si apre in un'altra scheda
         "elenco": ["Prima voce", "Seconda voce"],     // numeri romani messi dal motore; se TUTTE le voci
                                                       // iniziano già con «I. » o «1. » si usa quel numero
         "link": { "href": "/regole/", "testo": "Leggi le regole per intero" },

         // solo «contatti»
         "etichette": { "nome": "Nome", "cognome": "Cognome", "email": "Email", "telefono": "Telefono" },
         "maggiorenne": { "testo": "…" },  // spunta obbligatoria prima della privacy; se manca non c'è
         "privacy": { "testo": "…", "link": "/privacy/", "link_testo": "…" },   // consenso obbligatorio
         "lettere": { "testo": "…" } }     // consenso facoltativo; false per toglierlo
     ],
     "etichette": { "facoltativo": "facoltativo", "passo": "Passo {n} di {tot}", "avanzamento": "Avanzamento",
                    "caratteri": "caratteri", "nuova_scheda": "si apre in un'altra scheda" },
     "invio": { "etichetta": "Invia", "in_corso": "Invio…", "riprova": "Riprova", "avanti": "Avanti",
                "indietro": "Indietro", "destinazione": "/grazie/", "fonte": "alphaathlete.com · candidatura" },
     "errori": { "invio": "…", "contatto": "email@…", "obbligatorio": "…", "scelta": "…", "min": "… {min} …",
                 "max": "… {max} … (caratteri)", "max_scelte": "… {max} … (scelta multipla)", "link": "…",
                 "manca": "Manca {cosa}.", "nome": "il nome", "cognome": "il cognome", "email": "un'email valida",
                 "telefono": "un telefono valido…", "maggiorenne": "la spunta sui 18 anni",
                 "privacy": "la spunta sulla privacy" }
   }
   Nel tipo «spunta» il testo accanto alla casella è opzioni[0].
   Il limite dei caratteri non blocca la tastiera: chi scrive troppo vede il contatore in rosso e, premendo
   «Avanti», il messaggio «max». Così un testo incollato non viene tagliato di nascosto.
   Se il motore non può partire (JSON rotto, nessun passo valido) rimette in vista il testo di ripiego
   che la pagina ha scritto dentro #candidatura-modulo (classe «cand__ripiego»).

   Cosa parte all'invio (POST JSON): fonte, pagina, inviata_il, versione_questionario, una chiave per ogni passo
   (scelta singola e multipla: il VALORE dell'opzione; testo: il testo; spunta: «Sì»/«No»), una chiave per ogni
   «extra» (testo, anche vuoto), riepilogo (domande e risposte leggibili, con le etichette, una per riga);
   dal passo «contatti»: first_name, last_name, email, phone, maggiorenne (solo se la spunta esiste),
   consenso_privacy, consenso_lettere. */
(function () {
  'use strict';

  var root = document.getElementById('candidatura-modulo');
  var fonteDati = document.getElementById('candidatura-dati');
  if (!root) return;
  /* se il motore non può partire, il riquadro non resta vuoto: torna visibile il testo di ripiego della pagina */
  function guasto(perche, e) { console.error('[candidatura] ' + perche, e || ''); root.classList.add('cand--guasto'); }
  if (!fonteDati) { guasto('manca il JSON dei passi (#candidatura-dati)'); return; }

  var D;
  try { D = JSON.parse(fonteDati.textContent); } catch (e) { guasto('JSON dei passi non valido', e); return; }
  var TIPI = ['singola', 'multipla', 'testo', 'testo_lungo', 'contatti', 'spunta'];
  var RISERVATE = ['fonte', 'pagina', 'inviata_il', 'versione_questionario', 'riepilogo', 'riepilogo_html', 'first_name', 'last_name', 'email', 'phone', 'maggiorenne', 'consenso_privacy', 'consenso_lettere'];
  var usate = {};
  var PASSI = (D.passi || []).filter(function (p) {
    var ok = p && p.chiave && p.titolo && TIPI.indexOf(p.tipo) >= 0;
    if (!ok) { console.warn('[candidatura] passo ignorato (servono chiave, titolo e un tipo valido):', p); return false; }
    if (p.tipo !== 'contatti' && RISERVATE.indexOf(p.chiave) >= 0) { console.warn('[candidatura] chiave riservata, rinominata:', p.chiave); p.chiave = 'r_' + p.chiave; }
    if (usate[p.chiave]) { console.warn('[candidatura] passo ignorato (chiave già usata):', p.chiave); return false; }
    usate[p.chiave] = true;
    return true;
  });
  /* il campo in più: solo su «testo», «spunta» e «contatti», con una chiave sua che non sia già presa */
  PASSI.forEach(function (p) {
    var x = p.extra;
    if (!x) return;
    var ok = (p.tipo === 'testo' || p.tipo === 'spunta' || p.tipo === 'contatti') && typeof x === 'object' && x.chiave && x.etichetta && RISERVATE.indexOf(x.chiave) < 0 && !usate[x.chiave];
    if (!ok) { console.warn('[candidatura] «extra» ignorato (va su un passo «testo», «spunta» o «contatti», con chiave libera ed etichetta):', p.chiave, x); p.extra = null; return; }
    usate[x.chiave] = true;
  });
  if (!PASSI.length) { guasto('nessun passo valido nel JSON'); return; }

  function unisci(base, extra) { var o = {}, k; for (k in base) o[k] = base[k]; for (k in (extra || {})) if (extra[k] != null && extra[k] !== '') o[k] = extra[k]; return o; }
  var T = unisci({ etichetta: 'Invia', in_corso: 'Invio…', riprova: 'Riprova', avanti: 'Avanti', indietro: 'Indietro', destinazione: '/grazie/', fonte: location.hostname + ' · candidatura' }, D.invio);
  var L = unisci({ facoltativo: 'facoltativo', passo: 'Passo {n} di {tot}', avanzamento: 'Avanzamento', caratteri: 'caratteri', nuova_scheda: 'si apre in un\'altra scheda' }, D.etichette);
  var E = unisci({
    invio: 'Non sono riuscito a inviare. Riprova tra poco.', contatto: '',
    obbligatorio: 'Questa risposta serve per andare avanti.', scelta: 'Scegli una risposta per andare avanti.',
    min: 'Scrivi almeno {min} caratteri.', max: 'Resta entro {max} caratteri.', max_scelte: 'Puoi sceglierne al massimo {max}.',
    link: 'Il link sembra incompleto. Correggilo, oppure lascia il campo vuoto.', manca: 'Manca {cosa}.',
    nome: 'il nome', cognome: 'il cognome', email: 'un\'email valida',
    telefono: 'un telefono valido, con prefisso (es. +39 333 1234567)', maggiorenne: 'la spunta sui 18 anni', privacy: 'la spunta sulla privacy'
  }, D.errori);
  /* IL WEBHOOK NON SI SCRIVE QUI: sta in src/config.ts (WEBHOOK_CANDIDATURA) e arriva nel JSON in pagina («hook»).
     Finché è vuoto il modulo NON manda niente in rete (modalità prova) e lo dice con un avviso sotto il modulo,
     su qualunque indirizzo.
       · sul computer di chi sviluppa o nella rete di casa (localhost, 127.0.0.1, [::1], *.local, 10.x, 192.168.x,
         172.16-31.x): salva il payload in sessionStorage («candidatura.prova»), lo stampa in console e va alla
         pagina di grazie, che dichiara in chiaro che è una prova;
       · su qualunque altro indirizzo: NON finge l'invio. Niente viene salvato né stampato, non si va a /grazie/:
         esce il messaggio «errori.invio».
     Solo in locale, con ?prova=errore nell'indirizzo, il primo invio finge di fallire (senza rete): serve a
     vedere il messaggio d'errore e il bottone «Riprova». */
  var HOOK = typeof D.hook === 'string' ? D.hook.trim() : '';
  var VERSIONE = D.versione != null ? String(D.versione) : '';
  if (!VERSIONE) console.warn('[candidatura] manca «versione» nel JSON: versione_questionario parte vuota');

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOST = location.hostname.replace(/^\[|\]$/g, '');
  var LOCALE = HOST === 'localhost' || HOST === '127.0.0.1' || HOST === '::1' || /\.(localhost|local)$/.test(HOST) ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(HOST);
  var BOZZA = 'candidatura.bozza';
  var A = {};     /* risposte, per chiave */
  var i = 0;      /* passo corrente */
  var attendo = false, inviando = false, disegnatoA = -1e9, fintoErrore = false;
  var intro = document.querySelector('[data-candidatura-intro]');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* un indirizzo per un link: solo percorsi del sito, ancore, http(s) e mailto */
  function href(u) { u = String(u == null ? '' : u).trim(); return /^(\/|#|https?:\/\/|mailto:)/i.test(u) ? u : ''; }
  function romano(n) { var s = ''; [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].forEach(function (c) { while (n >= c[0]) { s += c[1]; n -= c[0]; } }); return s; }
  function obbl(p) { return p.obbligatorio !== false; }
  function opzioni(p) {
    return (p.opzioni || []).map(function (o) {
      if (o && typeof o === 'object') return { v: String(o.valore != null ? o.valore : o.etichetta), t: String(o.etichetta != null ? o.etichetta : o.valore), s: o.nota ? String(o.nota) : '' };
      return { v: String(o), t: String(o), s: '' };
    });
  }
  function maxTesto(p) { return p.max > 0 ? p.max : (p.tipo === 'testo' ? 120 : 600); }
  function maxExtra(x) { return x.max > 0 ? x.max : 200; }
  function valori(p) { return opzioni(p).map(function (o) { return o.v; }); }
  /* la firma della bozza: se cambiano versione, passi, opzioni o limiti, la bozza vecchia non si riprende */
  var FIRMA = VERSIONE + '#' + PASSI.map(function (p) { return [p.chiave, p.tipo, valori(p).join('~'), p.max || '', p.extra ? p.extra.chiave + '~' + maxExtra(p.extra) : ''].join(':'); }).join('|');

  /* ---------- bozza: un ricaricamento non perde le risposte (solo in questa scheda) ---------- */
  function salva() {
    try {
      var copia = JSON.parse(JSON.stringify(A));
      /* consensi e maggiore età non si ricordano: vanno dati di nuovo, con un gesto */
      PASSI.forEach(function (p) {
        if (p.tipo === 'contatti' && copia[p.chiave]) { delete copia[p.chiave].maggiorenne; delete copia[p.chiave].privacy; delete copia[p.chiave].lettere; }
        if (p.tipo === 'spunta') delete copia[p.chiave];   /* anche «ho letto le regole» è un impegno: si ridà */
      });
      sessionStorage.setItem(BOZZA, JSON.stringify({ f: FIRMA, a: copia, i: i }));
    } catch (e) {}
  }
  function riprendi() {
    try {
      var b = JSON.parse(sessionStorage.getItem(BOZZA) || 'null');
      if (!b || b.f !== FIRMA || !b.a) return;
      A = b.a;
      i = Math.max(0, Math.min(PASSI.length - 1, b.i | 0));
    } catch (e) {}
  }
  function azzera() { A = {}; i = 0; attendo = false; inviando = false; }

  /* ---------- disegno di un passo ---------- */
  function barra() {
    var n = PASSI.length, dove = esc(L.passo.replace('{n}', i + 1).replace('{tot}', n));
    return '<div class="cand__top"><div class="cand__bar" role="progressbar" aria-label="' + esc(L.avanzamento) + '" aria-valuemin="1" aria-valuemax="' + n + '" aria-valuenow="' + (i + 1) + '" aria-valuetext="' + dove + '"><i style="width:' + Math.round((i + 1) / n * 100) + '%"></i></div>' +
      '<span class="cand__n" aria-hidden="true">' + dove + '</span></div>';
  }
  function scelte(p, multi) {
    var a = A[p.chiave], sel = multi ? (Array.isArray(a) ? a : []) : [a];
    /* scelta multipla: caselle (role=checkbox). Scelta singola: bottoni normali con aria-pressed, perché premendoli
       si va avanti da soli (un gruppo di radio farebbe aspettare le frecce a chi usa un lettore di schermo). */
    return '<div class="cand__opts' + (multi ? ' cand__opts--multi' : '') + '" role="group" aria-labelledby="cand-q"' + (p.aiuto ? ' aria-describedby="cand-aiuto"' : '') + '>' +
      opzioni(p).map(function (o, n) {
        var on = sel.indexOf(o.v) >= 0;
        return '<button type="button" class="cand__opt" data-n="' + n + '"' + (multi ? ' role="checkbox" aria-checked="' + on + '"' : ' aria-pressed="' + on + '"') + '><b>' + esc(o.t) + '</b>' + (o.s ? '<small>' + esc(o.s) + '</small>' : '') + '</button>';
      }).join('') + '</div>';
  }
  /* cosa scrive la tastiera del telefono sul tasto Invio: «avanti», oppure «invia» sull'ultimo passo */
  var TASTO = 'next';
  function campo(c, id, lab, tipo, auto, req, fac) {
    return '<label class="cand__campo"><span>' + esc(lab) + (req ? '' : ' <em>(' + esc(fac) + ')</em>') + '</span><input data-c="' + id + '" type="' + tipo + '" autocomplete="' + auto + '" value="' + esc(c[id] || '') + '"' + (req ? ' required aria-required="true"' : '') + (tipo === 'tel' ? ' inputmode="tel"' : '') + ' enterkeyhint="' + TASTO + '"></label>';
  }
  /* contatore dei caratteri. `sempre` = si vede sempre (testo lungo); altrimenti compare solo oltre il limite */
  function conta(id, lung, max, sempre) {
    return '<p class="cand__conta' + (lung > max ? ' is-pieno' : '') + '" id="' + id + '"' + (sempre ? '' : ' data-oltre' + (lung > max ? '' : ' hidden')) + '><span>' + lung + '</span> / ' + max + '<span class="sr-only"> ' + esc(L.caratteri) + '</span></p>';
  }
  function campoExtra(p) {
    var x = p.extra; if (!x) return '';
    var v = String(A[x.chiave] || ''), m = maxExtra(x), eLink = x.chiave === 'link_facoltativo';
    var comune = ' data-extra data-conta="cand-conta-x" data-max="' + m + '" aria-describedby="cand-conta-x" enterkeyhint="' + TASTO + '" placeholder="' + esc(x.segnaposto || '') + '"';
    return '<label class="cand__campo cand__extra"><span>' + esc(x.etichetta) + ' <em>(' + esc(L.facoltativo) + ')</em></span>' +
      '<input type="text"' + comune + (eLink ? ' inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false"' : '') + ' value="' + esc(v) + '"></label>' +
      conta('cand-conta-x', v.length, m, false);
  }
  function disegna(focus) {
    var p = PASSI[i], ultimo = i === PASSI.length - 1, a = A[p.chiave], h = '';
    var descr = p.aiuto ? ' aria-describedby="cand-aiuto"' : '';
    TASTO = ultimo ? 'send' : 'next';
    /* gruppo e riga di passaggio descrivono il titolo: chi usa un lettore di schermo li sente quando il passo cambia */
    var intorno = (p.gruppo ? 'cand-gruppo ' : '') + (p.sopra ? 'cand-sopra' : '');
    if (p.gruppo) h += '<p class="cand__gruppo" id="cand-gruppo">' + esc(p.gruppo) + '</p>';
    h += barra();
    if (p.sopra) h += '<p class="cand__sopra" id="cand-sopra">' + esc(p.sopra) + '</p>';
    h += '<h3 id="cand-q" tabindex="-1"' + (intorno ? ' aria-describedby="' + intorno.trim() + '"' : '') + '>' + esc(p.titolo) + '</h3>';
    if (p.aiuto) h += '<p class="cand__hint" id="cand-aiuto">' + esc(p.aiuto) + '</p>';
    /* il messaggio d'errore sta qui, sotto titolo e aiuto e PRIMA dei campi: sul telefono resta insieme al campo
       col cursore, sopra la tastiera. I campi sbagliati lo citano con aria-describedby (vedi mostraErrore) */
    h += '<div class="cand__err" id="cand-err" role="alert" hidden></div>';

    if (p.tipo === 'singola') h += scelte(p, false);
    else if (p.tipo === 'multipla') h += scelte(p, true);
    else if (p.tipo === 'testo' || p.tipo === 'testo_lungo') {
      var m = maxTesto(p), lung = String(a || '').length, lungo = p.tipo === 'testo_lungo';
      var attr = ' data-testo data-conta="cand-conta" data-max="' + m + '" aria-labelledby="cand-q" aria-describedby="' + (p.aiuto ? 'cand-aiuto ' : '') + 'cand-conta"' + (obbl(p) ? ' aria-required="true"' : '') + ' placeholder="' + esc(p.segnaposto || '') + '"';
      h += (lungo ? '<textarea class="cand__text" rows="5"' + attr + '>' + esc(a || '') + '</textarea>' : '<input class="cand__input" type="text" enterkeyhint="' + TASTO + '"' + attr + ' value="' + esc(a || '') + '">') + conta('cand-conta', lung, m, lungo);
      h += campoExtra(p);
    } else if (p.tipo === 'spunta') {
      var testo = (p.opzioni && p.opzioni[0]) || p.etichetta || p.titolo;
      if (testo && typeof testo === 'object') testo = testo.etichetta;
      if (Array.isArray(p.elenco) && p.elenco.length) {
        var re = /^\s*((?:[IVXLCDM]+|\d+)[.)])\s+(.+)$/;
        var voci = p.elenco.map(function (v) { return String(v); });
        var numerate = voci.every(function (v) { return re.test(v); });
        h += '<ol class="cand__elenco" role="list">' + voci.map(function (v, n) {
          var mm = numerate ? v.match(re) : null;
          return '<li><span class="cand__elenco-n" aria-hidden="true">' + esc(mm ? mm[1] : romano(n + 1) + '.') + '</span><span>' + esc(mm ? mm[2] : v) + '</span></li>';
        }).join('') + '</ol>';
      }
      var lk = p.link && typeof p.link === 'object' ? href(p.link.href) : '';
      if (lk) h += '<p class="cand__link"><a href="' + esc(lk) + '" target="_blank" rel="noopener">' + esc(p.link.testo || lk) + '<span class="sr-only"> (' + esc(L.nuova_scheda) + ')</span></a></p>';
      h += '<label class="cand__ok"><input type="checkbox" data-spunta' + (a ? ' checked' : '') + (obbl(p) ? ' aria-required="true"' : '') + descr + '> <span>' + esc(testo) + '</span></label>';
      h += campoExtra(p);
    } else if (p.tipo === 'contatti') {
      var c = a || {}, et = unisci({ nome: 'Nome', cognome: 'Cognome', email: 'Email', telefono: 'Telefono', facoltativo: L.facoltativo }, p.etichette);
      var pr = unisci({ testo: 'Ho letto l\'informativa sulla privacy e voglio che la mia candidatura venga valutata.', link: '', link_testo: 'Leggi l\'informativa' }, p.privacy);
      var prLink = href(pr.link);
      h += '<div class="cand__campi">' + campo(c, 'nome', et.nome, 'text', 'given-name', true) + campo(c, 'cognome', et.cognome, 'text', 'family-name', true) +
        campo(c, 'email', et.email, 'email', 'email', true) + campo(c, 'tel', et.telefono, 'tel', 'tel', false, et.facoltativo) + '</div>';
      h += campoExtra(p);   /* dopo il telefono, prima delle spunte */
      if (p.maggiorenne) {
        var mg = unisci({ testo: 'Ho compiuto 18 anni.' }, typeof p.maggiorenne === 'object' ? p.maggiorenne : null);
        h += '<label class="cand__ok"><input type="checkbox" data-c="maggiorenne" aria-required="true"' + (c.maggiorenne ? ' checked' : '') + '> <span>' + esc(mg.testo) + '</span></label>';
      }
      h += '<label class="cand__ok"><input type="checkbox" data-c="privacy" aria-required="true"' + (c.privacy ? ' checked' : '') + '> <span>' + esc(pr.testo) + (prLink ? ' <a href="' + esc(prLink) + '" target="_blank" rel="noopener">' + esc(pr.link_testo) + '<span class="sr-only"> (' + esc(L.nuova_scheda) + ')</span></a>' : '') + '</span></label>';
      if (p.lettere !== false) {
        var le = unisci({ testo: 'Voglio ricevere anche le lettere via email.' }, p.lettere);
        h += '<label class="cand__ok"><input type="checkbox" data-c="lettere"' + (c.lettere ? ' checked' : '') + '> <span>' + esc(le.testo) + ' <em>(' + esc(et.facoltativo) + ')</em></span></label>';
      }
    }

    /* la scelta singola avanza da sola: «Avanti» serve negli altri casi, se la domanda è facoltativa
       o se la risposta c'è già (chi è tornato indietro non deve ricliccarla) */
    if (ultimo) h += '<button type="button" class="btn cand__send">' + esc(T.etichetta) + '</button>';
    else if (p.tipo !== 'singola' || !obbl(p) || (a != null && a !== '')) h += '<button type="button" class="btn cand__next">' + esc(T.avanti) + '</button>';
    h += '<div class="cand__foot">' + (i > 0 ? '<button type="button" class="cand__back">← ' + esc(T.indietro) + '</button>' : '') + '</div>';

    root.innerHTML = '<div class="cand__step' + (p.tipo === 'testo' || p.tipo === 'testo_lungo' ? ' cand__step--testo' : '') + '">' + h + '</div>';
    /* le righe d'istruzione sopra il modulo servono al primo passo: dal secondo si tolgono */
    if (intro) intro.hidden = i > 0;
    disegnatoA = performance.now();
    if (focus) { var t = root.querySelector('#cand-q'); if (t) t.focus({ preventScroll: true }); }
  }

  /* ---------- lettura e controlli ---------- */
  function leggi() {
    var p = PASSI[i], el;
    if (p.tipo === 'testo' || p.tipo === 'testo_lungo') { el = root.querySelector('[data-testo]'); if (el) A[p.chiave] = el.value; }
    else if (p.tipo === 'spunta') { el = root.querySelector('[data-spunta]'); if (el) A[p.chiave] = el.checked; }
    else if (p.tipo === 'contatti') {
      var c = A[p.chiave] = (A[p.chiave] && typeof A[p.chiave] === 'object') ? A[p.chiave] : {};
      root.querySelectorAll('[data-c]').forEach(function (x) { c[x.getAttribute('data-c')] = x.type === 'checkbox' ? x.checked : x.value; });
    }
    if (p.extra) { el = root.querySelector('[data-extra]'); if (el) A[p.extra.chiave] = el.value; }
  }
  /* Telefono: deve cominciare col prefisso, «+» oppure «00» (00 → +), come chiede il messaggio d'errore.
     Nessun prefisso viene aggiunto di nascosto. Vuoto = va bene; null = non valido */
  function telefono(t) {
    t = (t || '').trim(); if (!t) return '';
    var piu = t.charAt(0) === '+', d = t.replace(/\D/g, '');
    if (!piu && d.indexOf('00') === 0) { d = d.slice(2); piu = true; }
    if (!piu) return null;
    return d.length >= 8 && d.length <= 15 ? '+' + d : null;
  }
  /* restituisce { msg, campi: [selettori da segnare], fuoco: selettore } oppure null se il passo va bene.
     `gen: true` = messaggio generico, che il passo può sostituire con il suo `errore` */
  function controllaPasso(p) {
    var a = A[p.chiave];
    /* contano solo le risposte che esistono ancora fra le opzioni */
    if (p.tipo === 'singola') return obbl(p) && valori(p).indexOf(a) < 0 ? { msg: E.scelta, fuoco: '.cand__opt', gen: true } : null;
    if (p.tipo === 'multipla') {
      var buone = Array.isArray(a) ? a.filter(function (v) { return valori(p).indexOf(v) >= 0; }) : [];
      if (Array.isArray(a)) A[p.chiave] = buone;
      return obbl(p) && !buone.length ? { msg: E.scelta, fuoco: '.cand__opt', gen: true } : null;
    }
    if (p.tipo === 'testo' || p.tipo === 'testo_lungo') {
      var n = String(a || '').trim().length, min = p.min > 0 ? p.min : 1, max = maxTesto(p);
      if (!n) return obbl(p) ? { msg: E.obbligatorio, campi: ['[data-testo]'], fuoco: '[data-testo]', gen: true } : null;
      if (n < min) return { msg: E.min.replace('{min}', min), campi: ['[data-testo]'], fuoco: '[data-testo]' };
      return n > max ? { msg: E.max.replace('{max}', max), campi: ['[data-testo]'], fuoco: '[data-testo]' } : null;
    }
    if (p.tipo === 'spunta') return obbl(p) && !a ? { msg: E.obbligatorio, campi: ['[data-spunta]'], fuoco: '[data-spunta]', gen: true } : null;
    if (p.tipo === 'contatti') {
      var c = a || {}, m = [];
      if (!(c.nome || '').trim()) m.push(['nome', E.nome]);
      if (!(c.cognome || '').trim()) m.push(['cognome', E.cognome]);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((c.email || '').trim())) m.push(['email', E.email]);
      if (telefono(c.tel) === null) m.push(['tel', E.telefono]);
      if (p.maggiorenne && !c.maggiorenne) m.push(['maggiorenne', E.maggiorenne]);
      if (!c.privacy) m.push(['privacy', E.privacy]);
      if (!m.length) return null;
      /* una cosa sola: la frase intera («Manca il nome.»). Più di una: «Manca:» e sotto una voce per riga, con le
         stesse parole (ogni voce ha già i suoi due punti: cucite con le virgole non si leggono) */
      var e = { campi: m.map(function (x) { return '[data-c="' + x[0] + '"]'; }), fuoco: '[data-c="' + m[0][0] + '"]', contatti: true };
      if (m.length === 1) e.msg = E.manca.replace('{cosa}', m[0][1]);
      else { e.msg = E.manca.replace('{cosa}', '').replace(/[\s.]+$/, '') + ':'; e.voci = m.map(function (x) { return x[1]; }); }
      return e;
    }
    return null;
  }
  /* il campo in più è facoltativo: si controlla solo se è stato scritto */
  function controllaExtra(p) {
    var x = p.extra; if (!x) return null;
    var v = String(A[x.chiave] || '').trim(), max = maxExtra(x);
    if (!v) return null;
    if (v.length > max) return { msg: E.max.replace('{max}', max), campi: ['[data-extra]'], fuoco: '[data-extra]' };
    if (x.chiave === 'link_facoltativo' && !/^\S+\.\S+$/.test(v)) return { msg: E.link, campi: ['[data-extra]'], fuoco: '[data-extra]' };
    return null;
  }
  function controlla(p) {
    var e = controllaPasso(p);
    if (e && e.gen && p.errore) e.msg = String(p.errore);
    return e || controllaExtra(p);
  }
  /* aria-describedby è una lista di id: si aggiunge o si toglie «cand-err» senza perdere gli altri */
  function descritto(x, si) {
    var ids = (x.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (v) { return v && v !== 'cand-err'; });
    if (si) ids.push('cand-err');
    if (ids.length) x.setAttribute('aria-describedby', ids.join(' ')); else x.removeAttribute('aria-describedby');
  }
  function scriviErrore(err, e) {
    err.textContent = '';
    var riga = document.createElement('p'); riga.textContent = e.msg; err.appendChild(riga);
    if (e.voci && e.voci.length) {
      var ul = document.createElement('ul');
      e.voci.forEach(function (v) { var li = document.createElement('li'); li.textContent = v; ul.appendChild(li); });
      err.appendChild(ul);
    }
    err.hidden = false;
  }
  var erroreContatti = false;   /* sul passo «contatti» l'elenco di ciò che manca si accorcia mentre si corregge */
  function mostraErrore(e, senzaFuoco) {
    var err = root.querySelector('.cand__err'); if (!err) return;
    scriviErrore(err, e);
    erroreContatti = !!e.contatti;
    root.querySelectorAll('[aria-invalid]').forEach(function (x) { x.removeAttribute('aria-invalid'); descritto(x, false); });
    (e.campi || []).forEach(function (s) { var x = root.querySelector(s); if (x) { x.setAttribute('aria-invalid', 'true'); descritto(x, true); } });
    if (senzaFuoco) return;
    var f = e.fuoco && root.querySelector(e.fuoco);
    if (f) {
      f.focus({ preventScroll: true });
      /* il messaggio sta sopra i campi: si porta in vista lui (e il campo, che gli sta subito sotto) */
      var r = err.getBoundingClientRect(), cima = (document.querySelector('.nav') || {}).offsetHeight || 0;
      if (r.top < cima + 8 || f.getBoundingClientRect().bottom > innerHeight - 8) scrollBy({ top: r.top - cima - 16, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  function togliErrore() {
    var err = root.querySelector('.cand__err'); if (err) { err.hidden = true; err.textContent = ''; }
    erroreContatti = false;
    root.querySelectorAll('[aria-describedby~="cand-err"]').forEach(function (x) { descritto(x, false); });
  }

  /* ---------- avanti, indietro ---------- */
  function porta() {
    var r = root.getBoundingClientRect(), cima = (document.querySelector('.nav') || {}).offsetHeight || 0;
    /* sul telefono la riga del gruppo («Le sei domande · Passo 5 di 16») va in cima allo schermo a ogni passo */
    var soglia = innerWidth <= 700 ? cima + 48 : innerHeight * 0.6;
    if (r.top < 60 || r.top > soglia) root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  function vaiA(n, errore) {
    i = Math.max(0, Math.min(PASSI.length - 1, n));
    salva();
    disegna(!errore);
    porta();
    if (errore) mostraErrore(errore);
  }
  function prosegui() {
    leggi();
    var e = controlla(PASSI[i]);
    if (e) { mostraErrore(e); return; }
    if (i < PASSI.length - 1) vaiA(i + 1);
  }

  /* ---------- invio ---------- */
  function dati() {
    var d = { fonte: T.fonte, pagina: location.pathname, inviata_il: new Date().toISOString(), versione_questionario: VERSIONE }, righe = [];
    PASSI.forEach(function (p) {
      var a = A[p.chiave], v = '', leggibile;
      if (p.tipo === 'contatti') {
        a = a || {};
        d.first_name = (a.nome || '').trim(); d.last_name = (a.cognome || '').trim();
        d.email = (a.email || '').trim(); d.phone = telefono(a.tel) || '';
        if (p.maggiorenne) d.maggiorenne = !!a.maggiorenne;
        d.consenso_privacy = !!a.privacy; d.consenso_lettere = p.lettere !== false && !!a.lettere;
        if (p.extra) {
          var vc = String(A[p.extra.chiave] || '').trim();
          d[p.extra.chiave] = vc;
          righe.push(String(p.extra.etichetta).replace(/[?:.]\s*$/, '') + ': ' + (vc || '—'));
        }
        return;
      }
      /* scelte: nel payload va il VALORE dell'opzione, nel riepilogo la sua etichetta */
      if (p.tipo === 'singola') { leggibile = ''; opzioni(p).forEach(function (o) { if (o.v === a) { v = o.v; leggibile = o.t; } }); }
      else if (p.tipo === 'multipla') {
        var prese = opzioni(p).filter(function (o) { return Array.isArray(a) && a.indexOf(o.v) >= 0; });
        v = prese.map(function (o) { return o.v; }).join(', '); leggibile = prese.map(function (o) { return o.t; }).join(', ');
      }
      else if (p.tipo === 'spunta') v = a ? 'Sì' : 'No';
      else v = String(a || '').trim();
      if (leggibile == null) leggibile = v;
      d[p.chiave] = v;
      righe.push(String(p.titolo).replace(/[?:.]\s*$/, '') + ': ' + (leggibile || '—'));
      if (p.extra) {
        var vx = String(A[p.extra.chiave] || '').trim();
        d[p.extra.chiave] = vx;
        righe.push(String(p.extra.etichetta).replace(/[?:.]\s*$/, '') + ': ' + (vx || '—'));
      }
    });
    d.riepilogo = righe.join('\n').replace(/\u2060/g, '');
    /* lo stesso riepilogo per l'email e la nota in HighLevel, dove gli a capo semplici spariscono:
       testo reso innocuo (niente HTML scritto da chi si candida), una riga vuota fra una risposta e l'altra */
    var sicuro = function (t) { return String(t).replace(/\u2060/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r?\n/g, '<br>'); };
    d.riepilogo_html = (d.phone ? ['Telefono: ' + d.phone] : []).concat(righe).map(sicuro).join('<br><br>');
    return d;
  }
  function fine(d) {
    try { sessionStorage.setItem('candidatura.nome', d.first_name || ''); sessionStorage.removeItem(BOZZA); } catch (e) {}
    location.href = T.destinazione;
  }
  /* invio non riuscito: le risposte restano dove sono, il bottone diventa «Riprova» */
  function nonRiuscito() {
    var btn = root.querySelector('.cand__send'), err = root.querySelector('.cand__err');
    inviando = false;
    if (btn) { btn.disabled = false; btn.textContent = T.riprova; }
    if (err) {
      scriviErrore(err, { msg: E.invio });
      erroreContatti = false;
      if (E.contatto) {   /* il recapito arriva dal JSON della pagina, non è scritto qui */
        var l = document.createElement('a');
        l.href = 'mailto:' + E.contatto; l.textContent = E.contatto;
        err.firstChild.appendChild(document.createTextNode(' ')); err.firstChild.appendChild(l);
      }
    }
    if (btn) btn.focus();
  }
  function invia() {
    if (inviando) return;
    leggi();
    /* si ricontrolla tutto: una bozza ripresa o un passo saltato non devono partire a metà */
    for (var k = 0; k < PASSI.length; k++) {
      var e = controlla(PASSI[k]);
      if (e) { if (k === i) mostraErrore(e); else vaiA(k, e); return; }
    }
    var btn = root.querySelector('.cand__send'), d = dati();
    root.querySelectorAll('[aria-invalid]').forEach(function (x) { x.removeAttribute('aria-invalid'); });
    togliErrore();
    inviando = true;
    if (btn) { btn.disabled = true; btn.textContent = T.in_corso; }

    if (!HOOK) {   /* modalità prova: niente rete */
      if (LOCALE && !fintoErrore && /[?&]prova=errore(&|$)/.test(location.search)) {
        fintoErrore = true;
        console.info('[candidatura] modalità prova: invio finto NON riuscito (?prova=errore). Al secondo tentativo va.');
        setTimeout(nonRiuscito, 600);
        return;
      }
      /* fuori dal locale, senza webhook, NON si finge l'invio: niente salvato, niente stampato, niente /grazie/ */
      if (!LOCALE) { console.error('[candidatura] manca il webhook (WEBHOOK_CANDIDATURA in src/config.ts): la candidatura NON è partita.'); setTimeout(nonRiuscito, 300); return; }
      try { sessionStorage.setItem('candidatura.prova', JSON.stringify(d)); } catch (e2) {}
      console.info('[candidatura] modalità prova (webhook vuoto): nessun invio in rete. Payload:', d);
      fine(d);
      return;
    }
    var ctl = 'AbortController' in window ? new AbortController() : null;
    var stop = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    fetch(HOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(stop); if (!r.ok) throw new Error(r.status); return r.text(); })
      /* HighLevel risponde 200 anche quando il workflow è in bozza («test request received»): in quel caso la
         candidatura NON è entrata, quindi non si va a /grazie/. Se un giorno il workflow viene spento, chi si
         candida vede «non riuscito» invece di un grazie falso. */
      .then(function (t) { if (/test request/i.test(t || '')) throw new Error('workflow in bozza'); try { sessionStorage.removeItem('candidatura.prova'); } catch (e3) {} fine(d); })
      .catch(function () { clearTimeout(stop); nonRiuscito(); });
  }

  /* ---------- eventi ---------- */
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled || attendo || inviando) return;
    if (b.classList.contains('cand__back')) { leggi(); vaiA(i - 1); return; }
    if (b.classList.contains('cand__next')) { prosegui(); return; }
    if (b.classList.contains('cand__send')) { invia(); return; }
    if (!b.classList.contains('cand__opt')) return;
    /* il secondo colpo di un doppio click non deve rispondere alla domanda appena comparsa */
    if (e.detail > 1 || performance.now() - disegnatoA < 350) return;
    var p = PASSI[i], o = opzioni(p)[+b.getAttribute('data-n')]; if (!o) return;
    togliErrore();
    if (p.tipo === 'multipla') {
      var l = Array.isArray(A[p.chiave]) ? A[p.chiave] : (A[p.chiave] = []);
      var k = l.indexOf(o.v);
      if (k >= 0) l.splice(k, 1);
      else if (p.max > 0 && l.length >= p.max) { mostraErrore({ msg: E.max_scelte.replace('{max}', p.max) }); return; }
      else l.push(o.v);
      b.setAttribute('aria-checked', String(k < 0));
      salva();
      return;
    }
    A[p.chiave] = o.v;
    root.querySelectorAll('.cand__opt').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    salva();
    /* dopo una scelta singola si avanza da soli (non sull'ultimo passo: lì c'è «Invia») */
    if (i < PASSI.length - 1) {
      attendo = true;
      setTimeout(function () { attendo = false; vaiA(i + 1); }, reduce ? 0 : 180);
    }
  });
  function suCampo(e) {
    var t = e.target; if (!t || !t.matches || !t.matches('[data-testo], [data-extra], [data-spunta], [data-c]')) return;
    leggi();
    t.removeAttribute('aria-invalid'); descritto(t, false);
    /* passo «contatti» con l'elenco di ciò che manca in vista: le voci sistemate escono, e quando non manca più
       niente il messaggio sparisce (senza spostare il cursore) */
    if (erroreContatti && PASSI[i].tipo === 'contatti') {
      var ec = controllaPasso(PASSI[i]);
      if (ec) mostraErrore(ec, true); else { togliErrore(); root.querySelectorAll('[aria-invalid]').forEach(function (x) { x.removeAttribute('aria-invalid'); }); }
    }
    var c = t.hasAttribute('data-conta') && document.getElementById(t.getAttribute('data-conta'));
    if (c) {
      var n = t.value.length, oltre = n > +t.getAttribute('data-max');
      c.firstChild.textContent = n;
      c.classList.toggle('is-pieno', oltre);
      if (c.hasAttribute('data-oltre')) c.hidden = !oltre;
    }
    salva();
  }
  root.addEventListener('input', suCampo);
  root.addEventListener('change', suCampo);
  root.addEventListener('keydown', function (e) {
    var t = e.target; if (!t || !t.matches) return;
    /* Invio nei campi a una riga: avanti (o invia, sull'ultimo passo) */
    if (e.key === 'Enter' && t.matches('input[data-testo], input[data-extra], input[data-c]:not([type="checkbox"])')) {
      e.preventDefault();
      if (i === PASSI.length - 1) invia(); else prosegui();
      return;
    }
  });
  /* tornando qui con «Indietro» del browser dopo l'invio, la pagina esce dalla cache così com'era
     (bottone fermo su «Invio…»): si riparte puliti */
  addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    azzera(); riprendi(); disegna(false);
  });

  /* ---------- partenza ---------- */
  if (intro && D.intro && !intro.textContent.trim()) intro.textContent = D.intro;
  riprendi();
  disegna(false);
  disegnatoA = -1e9;   /* il blocco anti doppio click vale solo dopo un cambio di passo, non al primo disegno */
  if (!HOOK) {   /* su OGNI indirizzo: finché manca il webhook nessuno deve credere di aver inviato */
    var avviso = document.createElement('p');
    avviso.className = 'cand__prova';
    avviso.textContent = LOCALE
      ? 'Modalità prova: il webhook è vuoto, la candidatura non parte. Il payload finisce in console e in sessionStorage, e la pagina di grazie dice che è una prova.'
      : 'Modalità prova: il webhook è vuoto. Da qui la candidatura non può partire: premendo «Invia» esce un messaggio d’errore.';
    root.parentNode.insertBefore(avviso, root.nextSibling);
  }
})();
