/* alphaathlete.com · tema «Tempio»: robot in volo e portatori
   Provenienza: vedi README. I soli movimenti continui della pagina sono qui:
   hanno il pulsante di pausa (WCAG 2.2.2) e fuori schermo si fermano. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hoIO = 'IntersectionObserver' in window;
  var root = document.documentElement;

  /* Robot in volo: si possono fermare; con l'apertura fuori schermo non consumano */
  var hero = document.querySelector('.hero'), pausa = document.querySelector('.volo__pausa');
  var ICO_VIA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>';
  var ICO_PAUSA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
  /* il nome del pulsante dice cosa fa adesso («Ferma i robot» / «Fai ripartire i robot»): niente aria-pressed,
     che insieme a un nome che cambia direbbe la cosa due volte. I due nomi li scrive <Apertura> (data-pausa, data-riparti). */
  if (pausa) pausa.addEventListener('click', function () {
    var on = root.classList.toggle('robot-fermi');
    pausa.setAttribute('aria-label', (on ? pausa.getAttribute('data-riparti') : pausa.getAttribute('data-pausa')) || 'Ferma');
    pausa.innerHTML = on ? ICO_VIA : ICO_PAUSA;
  });
  if (hero && hoIO) {
    new IntersectionObserver(function (e) { hero.classList.toggle('is-fuori', !e[0].isIntersecting); }).observe(hero);
  }

  /* Robot portatori: camminano sopra il loro blocco solo mentre scorri, e solo se sono in vista.
     Con movimento ridotto restano fermi a sinistra (lo decide il CSS). */
  var scene = [].slice.call(document.querySelectorAll('.portatori')).map(function (s) {
    return { scena: s, robot: s.querySelector('.robot-portatori'), vista: false };
  }).filter(function (p) { return p.robot; });
  if (reduce || !hoIO || !scene.length) return;

  function posa(p) {
    var r = p.scena.getBoundingClientRect(), k = (innerHeight - r.top) / (innerHeight + r.height);
    k = Math.max(0, Math.min(1, k));
    p.robot.style.setProperty('--x', ((r.width - p.robot.offsetWidth) * (0.04 + k * 0.92)).toFixed(1) + 'px');
  }

  var atteso = false;
  function aggiorna() { atteso = false; scene.forEach(function (p) { if (p.vista) posa(p); }); }
  function chiedi() { if (!atteso) { atteso = true; requestAnimationFrame(aggiorna); } }

  /* il passo si ferma da solo 220 ms dopo l'ultimo scroll */
  var fermo;
  addEventListener('scroll', function () {
    root.classList.add('is-scorre');
    clearTimeout(fermo);
    fermo = setTimeout(function () { root.classList.remove('is-scorre'); }, 220);
    chiedi();
  }, { passive: true });
  addEventListener('resize', chiedi, { passive: true });

  var oss = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      scene.forEach(function (p) {
        if (p.scena !== v.target) return;
        p.vista = v.isIntersecting;
        p.robot.classList.toggle('is-fermo', !v.isIntersecting);
      });
    });
    chiedi();
  }, { rootMargin: '10% 0px 10% 0px' });
  scene.forEach(function (p) { oss.observe(p.scena); });
})();
