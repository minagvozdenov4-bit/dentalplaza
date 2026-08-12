(function () {
  if (window.__pageFx) return;
  window.__pageFx = true;

  var css = document.createElement('style');
  css.textContent =
    '@keyframes pgIn{from{opacity:0}to{opacity:1}}' +
    'body{animation:pgIn .55s ease both}' +
    'body.pg-out{opacity:0;transition:opacity .3s ease}' +
    'html{scroll-behavior:smooth}' +
    '@keyframes pgReveal{from{opacity:0;transform:translateY(-14px);clip-path:inset(0 0 100% 0)}' +
    'to{opacity:1;transform:none;clip-path:inset(0 0 -10% 0)}}' +
    '.pg-rv{opacity:0}' +
    '.pg-rv.pg-on{animation:pgReveal .75s cubic-bezier(.2,.85,.3,1) both}' +
    '@media(prefers-reduced-motion:reduce){.pg-rv,.pg-rv.pg-on{opacity:1;animation:none}}' +
    '@keyframes pgCard{from{opacity:0;transform:translateY(-16px) scale(.985)}to{opacity:1;transform:none}}' +
    '.pg-cd{opacity:0}' +
    '.pg-cd.pg-on{animation:pgCard .75s cubic-bezier(.2,.85,.3,1) both}' +
    '@media(prefers-reduced-motion:reduce){.pg-cd,.pg-cd.pg-on{opacity:1;animation:none}}';
  document.head.appendChild(css);

  var SEL = 'h1,h2,h3,h4,p,summary,li,blockquote';
  function isCard(el) {
    if (el.closest('header, footer')) return false;
    var cs = getComputedStyle(el);
    var r = parseFloat(cs.borderTopLeftRadius) || 0;
    if (r < 14) return false;
    if (cs.boxShadow === 'none' && cs.backgroundColor !== 'rgb(255, 255, 255)') return false;
    if (el.offsetHeight < 70 || el.offsetWidth < 120) return false;
    if (el.parentElement && el.parentElement.classList.contains('pg-cd')) return false;
    return !!el.querySelector(SEL);
  }
  function reveal() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        var delay = (el.__pgi || 0) * 90;
        setTimeout(function () { el.classList.add('pg-on'); }, delay);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    var seen = new WeakSet();
    function scan() {
      var cards = Array.prototype.slice.call(document.querySelectorAll('div,article,details,section > a'));
      var cg = new Map();
      cards.forEach(function (el) {
        if (seen.has(el) || el.classList.contains('pg-cd')) return;
        if (!isCard(el)) return;
        seen.add(el);
        el.classList.add('pg-cd');
        var p = el.parentElement;
        var i = cg.get(p) || 0;
        cg.set(p, i + 1);
        el.__pgi = Math.min(i, 5);
        io.observe(el);
      });
      var nodes = Array.prototype.slice.call(document.querySelectorAll(SEL));
      var groups = new Map();
      nodes.forEach(function (el) {
        if (seen.has(el) || el.closest('header, footer')) return;
        seen.add(el);
        el.classList.add('pg-rv');
        var p = el.parentElement;
        var i = groups.get(p) || 0;
        groups.set(p, i + 1);
        el.__pgi = Math.min(i, 5);
        io.observe(el);
      });
    }
    scan();
    new MutationObserver(function () { scan(); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reveal);
  else reveal();

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    var href = a.getAttribute('href');
    if (!href || href.indexOf('.dc.html') === -1) return;
    var here = location.pathname.split('/').pop();
    if (decodeURIComponent(href.split('#')[0]) === decodeURIComponent(here)) return;
    e.preventDefault();
    document.body.classList.add('pg-out');
    setTimeout(function () { location.href = href; }, 300);
  });

  // --- Lightbox za slike (osim logotipa i galerijskih snopova) ---
  (function lightbox() {
    var ov = document.createElement('div');
    ov.setAttribute('style', 'position:fixed;inset:0;z-index:900;display:none;align-items:center;justify-content:center;padding:28px;background:rgba(10,26,19,.92);opacity:0;transition:opacity .25s ease;cursor:zoom-out');
    ov.innerHTML = '<img alt="" style="max-width:92vw;max-height:88vh;object-fit:contain;border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.45);transform:scale(.97);transition:transform .28s cubic-bezier(.2,.85,.3,1)">' +
      '<button type="button" aria-label="Zatvori" style="position:absolute;top:22px;right:24px;width:46px;height:46px;border-radius:999px;background:rgba(255,255,255,.14);border:0;color:#fff;font-size:20px;cursor:pointer">✕</button>';
    document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(ov); });
    if (document.body) document.body.appendChild(ov);
    var big = ov.querySelector('img');

    function open(src, alt) {
      big.src = src; big.alt = alt || '';
      ov.style.display = 'flex';
      requestAnimationFrame(function () { ov.style.opacity = '1'; big.style.transform = 'none'; });
    }
    function close() {
      ov.style.opacity = '0'; big.style.transform = 'scale(.97)';
      setTimeout(function () { ov.style.display = 'none'; big.removeAttribute('src'); }, 250);
    }
    ov.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.style.display === 'flex') close(); });

    document.addEventListener('click', function (e) {
      var img = e.target;
      if (!img || img.tagName !== 'IMG') return;
      if (img === big) return;
      if (img.closest('header, footer, .stack, a, button')) return;
      if ((img.naturalWidth || 0) < 200) return;
      e.preventDefault();
      open(img.currentSrc || img.src, img.alt);
    });

    var styleTag = document.createElement('style');
    styleTag.textContent = 'main img,section img{cursor:zoom-in}header img,footer img,.stack img,a img{cursor:inherit}';
    document.head.appendChild(styleTag);
  })();

  window.addEventListener('pageshow', function () { document.body.classList.remove('pg-out'); });

  // DC pages render after load, so a #hash landing must be re-applied once the
  // target exists and stops moving.
  (function hashLand() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var tries = 0, lastTop = null;
    var iv = setInterval(function () {
      var el = document.getElementById(id);
      if (el) {
        var top = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo(0, top);
        if (lastTop !== null && Math.abs(top - lastTop) < 2) { clearInterval(iv); return; }
        lastTop = top;
      }
      if (++tries > 30) clearInterval(iv);
    }, 120);
  })();
})();
