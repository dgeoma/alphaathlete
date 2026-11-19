/* alphaathlete.com · comportamento comune a tutte le pagine
   Provenienza di ogni file: vedi README («Da dove viene ogni pezzo»). */
(function () {
  'use strict';
  window.aaPronto = true;   /* lo script in <head> toglie la classe «js» dopo 3 s se questo file non è partito */
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hoIO = 'IntersectionObserver' in window;

  /* Comparsa al primo passaggio, una volta sola */
  var els = document.querySelectorAll('.reveal');
  if (!hoIO || reduce) {
    els.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* Menu: ombra (e fondo marmo, se parte trasparente) dopo 12 px di scroll */
  var nav = document.querySelector('.nav');
  if (nav) {
    var suScroll = function () { nav.classList.toggle('is-scrolled', scrollY > 12); };
    addEventListener('scroll', suScroll, { passive: true });
    suScroll();
  }

  /* Menu: sottolineatura oro sulla sezione in vista (solo ancore della stessa pagina).
     Si osservano TUTTE le sezioni con un id, non solo quelle del menu: se quella in vista non ha una voce
     (le regole, da dove viene, chi c'è dietro, la scena finale…) la sottolineatura si toglie da tutte. */
  var links = document.querySelectorAll('.nav__links a[href^="#"]');
  if (hoIO && links.length) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var a = map[e.target.id];
        links.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
        if (a) { a.classList.add('is-active'); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* Ogni «Candidati» porta al questionario con un salto morbido e ci sposta il focus */
  var cand = document.getElementById('candidatura');
  if (cand) {
    var titolo = cand.querySelector('[data-candidatura-titolo]');
    /* dentro il questionario il bottone «Candidati» del menu porterebbe dove si è già: si toglie finché ci si sta */
    if (hoIO) new IntersectionObserver(function (v) {
      document.body.classList.toggle('in-candidatura', v[0].isIntersecting);
    }, { rootMargin: '-30% 0px -30% 0px' }).observe(cand);
    document.querySelectorAll('a[href="#candidatura"]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        cand.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        if (titolo) titolo.focus({ preventScroll: true });
        if (history.replaceState) history.replaceState(null, '', '#candidatura');
      });
    });
  }
})();
