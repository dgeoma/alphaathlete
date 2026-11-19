/* alphaathlete.com · palco a tappe
   Meccanismo generico (provenienza: vedi README), con l'avanzamento automatico:
   le tappe si leggono dal DOM, quante sono sono (da 4 a 7 è il caso pensato).

   Markup atteso (lo scrive src/components/Tappe.astro):
     section.tappe[style="--n:N"]
       .tappe__pista
         span.tappe__snap[style="--k:0"] … (uno per tappa)
         .tappe__palco
           .tappe__testa
           .tappe__nav > .tappe__numeri > button.tappe__num[data-vai="0"] … + button.tappe__ferma
           .tappa[data-sosta="7000"] > figure.scena + .tappa__testo   (una per tappa)
           .tappe__cta

   Regole: ogni scena si anima una volta sola (classe «is-go» sulla .scena) e chi torna indietro la trova finita.
   Il palco fisso si accende solo se: niente «movimento ridotto», IntersectionObserver presente, finestra alta
   almeno 600 px. Altrimenti le tappe restano in colonna, già finite. */
(function () {
  'use strict';
  var root = document.documentElement;
  var ridotto = matchMedia('(prefers-reduced-motion: reduce)');
  var hoIO = 'IntersectionObserver' in window;
  var SOSTA = 7000;   /* ms su ogni tappa prima di passare da soli alla successiva (data-sosta sulla .tappa lo cambia) */

  function quando(el, soglia, fn) {
    if (!el) return;
    if (!hoIO) return fn();
    var o = new IntersectionObserver(function (v) {
      if (v[0].isIntersecting) { o.disconnect(); fn(); }
    }, { threshold: soglia });
    o.observe(el);
  }
  function altezzaMenu() { var n = document.querySelector('.nav'); return n ? n.offsetHeight : 0; }
  /* Altezza dello schermo misurata come 100svh con una sonda: sui telefoni non cambia quando le barre del
     browser rientrano, così il palco non si accende e spegne sotto il dito mentre si scorre. */
  var sonda = document.createElement('div');
  sonda.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100svh;visibility:hidden;pointer-events:none';
  function altezzaSchermo() {
    if (!sonda.parentNode) document.body.appendChild(sonda);
    return sonda.offsetHeight || innerHeight;
  }

  function monta(sezione) {
    var pista = sezione.querySelector('.tappe__pista');
    var palco = sezione.querySelector('.tappe__palco');
    var tappe = [].slice.call(sezione.querySelectorAll('.tappa'));
    if (!pista || !palco || tappe.length < 2) return;
    var scene = tappe.map(function (t) { return t.querySelector('.scena'); });
    var numeri = [].slice.call(sezione.querySelectorAll('.tappe__num'));
    var barra = sezione.querySelector('.tappe__numeri');
    var ferma = sezione.querySelector('.tappe__ferma');
    var ULTIMA = tappe.length - 1;
    var viva = false, animOra = false, idx = 0, fermate = false, modoFatto = false, ultimaL = -1, ultimaA = -1;
    var giocate = tappe.map(function () { return false; });

    /* il palco è fermo sullo schermo: né in arrivo né già oltre */
    function agganciato() {
      var d = palco.getBoundingClientRect().top - altezzaMenu();
      return d <= 60 && d >= -60;
    }

    function gioca(i) {
      if (giocate[i] || ridotto.matches || !hoIO || (viva && !agganciato())) return;
      giocate[i] = true;
      if (scene[i]) scene[i].classList.add('is-go');
    }

    function mostra(i) {
      idx = i;
      tappe.forEach(function (t, k) {
        t.classList.toggle('is-att', k === i);
        t.classList.toggle('is-prima', k < i);
        /* le scene nascoste non si raggiungono col tab */
        if (!scene[k]) return;
        if (k === i) scene[k].removeAttribute('inert'); else scene[k].setAttribute('inert', '');
      });
      numeri.forEach(function (b, k) {
        if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        b.classList.toggle('is-fatto', k < i);
      });
      if (barra) barra.style.setProperty('--avanzo', ULTIMA ? i / ULTIMA : 0);
      gioca(i);
      pianifica();
    }

    /* Avanti da solo: quando il palco è fermo sullo schermo, dopo la sosta si passa alla tappa dopo, fino
       all'ultima. Se la persona scorre, tocca o clicca, l'automatico aspetta: comanda lei. Il palco è fisso,
       quindi vai() sposta solo la barra di scorrimento, non quello che si vede. Si ferma col pulsante «ferma». */
    var autoT = null, ultimoGesto = 0;
    function sosta(i) { var s = +tappe[i].getAttribute('data-sosta'); return s >= 2000 ? s : SOSTA; }
    function pianifica() {
      clearTimeout(autoT); autoT = null;
      /* il conto parte solo col palco sullo schermo: arrivando, la scena ha tutto il suo tempo */
      if (!viva || fermate || ridotto.matches || idx >= ULTIMA || !agganciato()) return;
      autoT = setTimeout(function avanti() {
        autoT = null;
        if (!viva || fermate || idx >= ULTIMA || !agganciato()) return;   /* palco uscito: riparte al ritorno */
        if (document.hidden || performance.now() - ultimoGesto < 3000) { autoT = setTimeout(avanti, 1200); return; }
        vai(idx + 1);
      }, sosta(idx));
    }
    function gesto() { ultimoGesto = performance.now(); }

    function misure() {
      var inizio = scrollY + pista.getBoundingClientRect().top - altezzaMenu();
      var corsa = pista.offsetHeight - palco.offsetHeight;
      return { inizio: inizio, passo: corsa / ULTIMA, fine: inizio + corsa };
    }
    function vai(i) {
      if (!viva) {   /* in colonna i numeri non si vedono; per sicurezza porta alla tappa */
        tappe[i].scrollIntoView({ block: 'start' });
        return;
      }
      var m = misure();
      window.scrollTo({ top: m.inizio + i * m.passo, behavior: 'instant' });
      mostra(i);
    }
    function suScroll() {
      if (!viva) return;
      var m = misure(), k = m.passo > 0 ? (scrollY - m.inizio) / m.passo : 0;
      var i = Math.max(0, Math.min(ULTIMA, Math.round(k)));
      if (i !== idx) mostra(i);
    }

    /* Una rotella, una tappa: il blocco assorbe l'inerzia del trackpad */
    var blocco = false, ultimoT = 0, ultimoD = 0, sblocco = 0, massimo = 0, eraDentro = false;
    function suRotella(e) {
      if (!viva || e.ctrlKey || !e.deltaY) return;
      var m = misure(), y = scrollY, ora = performance.now();
      var dentro = y >= m.inizio - 2 && y <= m.fine + 2;
      var d = e.deltaY, dir = d > 0 ? 1 : -1, abs = Math.abs(d);
      var calmo = ora - ultimoT > 170, piuForte = abs > ultimoD * 1.7 + 10 && ora > sblocco;
      ultimoT = ora; ultimoD = abs;
      /* poco sopra il palco (arrivi dal menu): il primo colpo aggancia la prima tappa */
      if (!dentro && dir > 0 && y >= m.inizio - 170 && y < m.inizio) {
        e.preventDefault();
        window.scrollTo({ top: m.inizio, behavior: 'instant' });
        eraDentro = true; blocco = true; sblocco = ora + 420; massimo = ora + 1500;
        return;
      }
      if (!dentro) { eraDentro = false; return; }
      /* entrando con un colpo solo: ci si ferma sulla tappa in cui si arriva */
      if (!eraDentro) {
        eraDentro = true;
        if (!calmo) { blocco = true; sblocco = ora + 420; massimo = ora + 1100; e.preventDefault(); return; }
      }
      if (blocco) {
        if ((ora > massimo && abs > 30) || (ora > sblocco && (calmo || piuForte))) blocco = false;
        else { e.preventDefault(); return; }
      }
      var dopoI = idx + dir;
      if (dopoI < 0 || dopoI > ULTIMA) return;              /* dalle estremità si esce scorrendo normalmente */
      e.preventDefault();
      vai(dopoI);
      blocco = true; sblocco = ora + 620; massimo = ora + 2200;
    }

    /* PagGiù, PagSu e Spazio: una tappa per tasto, come la rotella */
    function suTasto(e) {
      if (!viva || e.altKey || e.ctrlKey || e.metaKey) return;
      var giu = e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey), su = e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
      if (!giu && !su) return;
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      /* sui bottoni lo Spazio serve a premerli; PagGiù e PagSu cambiano tappa */
      if (e.key === ' ' && (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY')) return;
      var m = misure(), y = scrollY;
      if (y < m.inizio - 2 || y > m.fine + 2) return;
      var i = idx + (giu ? 1 : -1);
      if (i < 0 || i > ULTIMA) return;
      e.preventDefault();
      vai(i);
    }

    /* Il comando per fermare tutto: niente più avanzamento da solo, scene mostrate finite (WCAG 2.2.2) */
    function fermaScene() {
      fermate = true;
      clearTimeout(autoT); autoT = null;
      sezione.classList.add('tappe--ferme');
      scene.forEach(function (s, k) { giocate[k] = true; if (s) s.classList.add('is-go'); });
      if (ferma) {
        ferma.hidden = true;
        var b = numeri[idx]; if (b) b.focus();   /* il focus non resta su un bottone sparito */
      }
    }

    /* Il contenuto del palco fisso entra nello schermo? Si misura col palco acceso (posizioni di layout,
       non toccate dalle trasformazioni). Se un titolo lungo o tante tappe non ci stanno, si resta in colonna. */
    function ciSta() {
      var su = Infinity, giu = -Infinity;
      [].forEach.call(palco.querySelectorAll('.tappe__testa, .tappe__nav, .scena, .tappa__testo, .tappe__cta'), function (el) {
        if (!el.offsetHeight) return;
        su = Math.min(su, el.offsetTop); giu = Math.max(giu, el.offsetTop + el.offsetHeight);
      });
      return giu - su <= palco.clientHeight + 1;
    }

    function aggiornaModo(forza) {
      var L = innerWidth, A = altezzaSchermo();
      if (forza !== true && modoFatto && L === ultimaL && A === ultimaA) return;   /* misure invariate: niente da rifare */
      ultimaL = L; ultimaA = A;
      var anim = !ridotto.matches && hoIO;
      var si = anim && A >= 600;
      if (si) { sezione.classList.add('tappe--viva'); si = ciSta(); }
      sezione.classList.toggle('tappe--viva', si);
      if (modoFatto && si === viva && anim === animOra) return;
      modoFatto = true;
      viva = si; animOra = anim;
      sezione.classList.toggle('tappe--anim', anim);
      root.classList.toggle('tappe-snap', !!document.querySelector('.tappe--viva'));
      if (viva) { suScroll(); mostra(idx); }
      else {
        clearTimeout(autoT); autoT = null;
        tappe.forEach(function (t, k) {
          t.classList.remove('is-prima', 'is-att');
          if (!scene[k]) return;
          scene[k].removeAttribute('inert');
          /* niente palco: con movimento ridotto la scena è già finita, altrimenti parte quando la vedi */
          if (ridotto.matches || !hoIO) scene[k].classList.add('is-go');
          else quando(scene[k], 0.4, function () { if (!viva) gioca(k); });
        });
      }
    }

    /* la scena della tappa in vista parte quando il palco è agganciato, non mentre ci stai arrivando */
    function controllaPalco() {
      if (!viva) return;
      gioca(idx);
      if (agganciato()) { if (!autoT) pianifica(); }
      else if (autoT) { clearTimeout(autoT); autoT = null; }
    }

    aggiornaModo();
    addEventListener('resize', function () { aggiornaModo(); suScroll(); }, { passive: true });
    if (ridotto.addEventListener) ridotto.addEventListener('change', function () { aggiornaModo(true); });
    /* i caratteri arrivano dopo: con quelli veri le misure del palco possono cambiare */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { aggiornaModo(true); suScroll(); });
    addEventListener('scroll', function () { suScroll(); controllaPalco(); }, { passive: true });
    addEventListener('wheel', suRotella, { passive: false });
    addEventListener('keydown', suTasto);
    ['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown'].forEach(function (t) { addEventListener(t, gesto, { passive: true }); });
    if (ferma) ferma.addEventListener('click', fermaScene);
    numeri.forEach(function (b, k) { b.addEventListener('click', function () { vai(k); }); });
    /* arrivando col Tab il browser centra il bottone e il palco resta a metà: lo si aggancia, così la scena parte */
    palco.addEventListener('focusin', function (e) {
      var t = e.target, daTastiera = true;
      try { daTastiera = t.matches(':focus-visible'); } catch (err) {}
      if (viva && daTastiera && !agganciato()) vai(idx);
    });
    controllaPalco();
  }

  [].slice.call(document.querySelectorAll('.tappe')).forEach(monta);
})();
