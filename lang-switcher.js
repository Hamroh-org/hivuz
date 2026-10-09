// Hamroh — til almashtirgich (uz / ru / kk).
// uz: /x.html · ru: /ru/x.html · kk: /kk/x.html. Avtomatik yo'naltirish YO'Q (SEO va ishonch uchun).
(function () {
  'use strict';
  var LANGS = [
    { code: 'uz', label: 'UZ', name: "O'zbekcha" },
    { code: 'ru', label: 'RU', name: 'Русский' },
    { code: 'kk', label: 'KK', name: 'Қазақша' }
  ];
  var path = location.pathname;
  var m = path.match(/^\/(ru|kk)(\/|$)/);
  var cur = m ? m[1] : 'uz';
  var base = m ? (path.replace(/^\/(ru|kk)/, '') || '/') : path;

  function target(code) {
    return (code === 'uz' ? base : '/' + code + base) + location.search + location.hash;
  }

  try { localStorage.setItem('hamroh_lang', cur); } catch (e) {}

  var css = document.createElement('style');
  css.textContent =
    '.hl-switch{position:fixed;left:12px;bottom:12px;z-index:2147483000;display:flex;gap:2px;' +
    'padding:3px;background:rgba(20,20,24,.88);border-radius:999px;font:700 12px/1 system-ui,sans-serif;' +
    'box-shadow:0 2px 10px rgba(0,0,0,.25)}' +
    '.hl-switch a{padding:7px 10px;border-radius:999px;color:#e8e8ea;text-decoration:none;min-width:34px;text-align:center}' +
    '.hl-switch a[aria-current="true"]{background:#e8896b;color:#fff}' +
    '.hl-switch a:focus-visible{outline:2px solid #fff;outline-offset:1px}' +
    // Telefonda pastki qatorni "Tezkor chiqish" (chapda) va 1003 (o'ngda) egallaydi — ustiga ko'taramiz.
    '@media (max-width:700px){.hl-switch{bottom:76px}}';
  document.head.appendChild(css);

  // <nav> emas: sahifalarning umumiy `nav{...}` CSS qoidalari unga tushmasligi uchun.
  var nav = document.createElement('div');
  nav.setAttribute('role', 'navigation');
  nav.className = 'hl-switch';
  nav.setAttribute('aria-label', 'Language');
  LANGS.forEach(function (l) {
    var a = document.createElement('a');
    a.href = target(l.code);
    a.textContent = l.label;
    a.title = l.name;
    a.lang = l.code;
    a.hreflang = l.code;
    if (l.code === cur) a.setAttribute('aria-current', 'true');
    a.addEventListener('click', function () {
      try { localStorage.setItem('hamroh_lang', l.code); } catch (e) {}
    });
    nav.appendChild(a);
  });
  function mount() { document.body.appendChild(nav); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
