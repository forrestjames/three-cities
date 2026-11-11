/* One small menu for every Rhythm Geometry, No Fixed Address and Blue Wave page.
   Add <script src="/rhythm-geometry/nav.js" defer></script> to a page and it appears. */
(function () {
  if (window.__rgNav) return; window.__rgNav = 1;
  var ITEMS = [
    ['Rhythm Geometry', null],
    ['Drums', '/rhythm-geometry/', 'Every drum, every city'],
    ['Melodic', '/rhythm-geometry/melodic/', 'Every ring plays notes'],
    ['Duet', '/rhythm-geometry/duet/', 'The conga and one drum'],
    ['Play', '/rhythm-geometry/play/', 'Congas and bongos on a mixer'],
    ['Play 2', '/rhythm-geometry/play2/', 'Weather sky and forecast slider'],
    ['Play 3', '/rhythm-geometry/play3/', 'A melody that develops, with a voice'],
    ['Perform', null],
    ['Pad', '/rhythm-geometry/pad/', 'A chaos pad for the rings'],
    ['Slice', '/rhythm-geometry/slice/', 'Eight slices to loop and reorder'],
    ['Three Cities Pad', '/rhythm-geometry/three/', 'Boston, Copenhagen, London: chaos pad'],
    ['Three Cities Slice', '/rhythm-geometry/three/slice/', 'The same, as eight slices'],
    ['Blue Wave Pad', '/rhythm-geometry/wave/', 'Four live seas: chaos pad'],
    ['Blue Wave Slice', '/rhythm-geometry/wave/slice/', 'The same, as eight slices'],
    ['No Fixed Address', null],
    ['The ledger of homes', '/no-fixed-address/', 'Homelessness counts as rings'],
    ['The cuts', '/no-fixed-address/ledger/', 'The DOGE cuts as rings'],
    ['Blue Wave', null],
    ['Blue Wave', '/blue-wave/', 'Live waves and sea temperature']
  ];
  var path = location.pathname.replace(/index\.html$/, '');
  var css = '.gnav{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:2147483000;font:12px/1.4 "Source Code Pro",ui-monospace,Menlo,monospace;letter-spacing:.06em}' +
    '.gnav-btn{display:flex;align-items:center;gap:8px;height:30px;padding:0 13px 0 11px;border-radius:999px;border:1px solid rgba(243,236,230,.26);background:rgba(12,7,16,.72);color:rgba(243,236,230,.82);cursor:pointer;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);text-transform:uppercase;font:inherit;font-size:10.5px;letter-spacing:.16em;opacity:.7;transition:opacity .2s,border-color .2s}' +
    '.gnav-btn:hover,.gnav-btn[aria-expanded=true],.gnav-btn:focus-visible{opacity:1;border-color:rgba(243,236,230,.6);outline:0}' +
    '.gnav-btn i{display:block;width:12px;height:8px;border-top:1.5px solid currentColor;border-bottom:1.5px solid currentColor;position:relative}' +
    '.gnav-btn i:after{content:"";position:absolute;left:0;right:0;top:2.5px;border-top:1.5px solid currentColor}' +
    '.gnav-menu{position:absolute;top:38px;left:50%;width:min(720px,calc(100vw - 20px));margin-left:calc(min(720px,calc(100vw - 20px)) / -2);padding:8px;display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0 6px;align-content:start;max-height:calc(100vh - 60px);overflow-y:auto;overscroll-behavior:contain;border-radius:20px;border:1px solid rgba(243,236,230,.26);background:rgba(12,7,16,.94);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 18px 40px rgba(0,0,0,.4);opacity:0;transform:translateY(-6px);pointer-events:none;visibility:hidden;transition:opacity .2s,transform .2s,visibility .2s}' +
    '.gnav.open .gnav-menu{opacity:1;transform:none;pointer-events:auto;visibility:visible}' +
    '.gnav-col{min-width:0}' +
    '.gnav-h{padding:10px 12px 4px;font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:rgba(243,236,230,.45)}' +
    '.gnav-menu a{display:block;padding:8px 12px;border-radius:12px;color:#f3ece6;text-decoration:none;font-size:12.5px;letter-spacing:.04em}' +
    '.gnav-menu a small{display:block;color:rgba(243,236,230,.5);font-size:10.5px;letter-spacing:.03em}' +
    '.gnav-menu a:hover,.gnav-menu a:focus-visible{background:rgba(243,236,230,.09);outline:0}' +
    '.gnav-menu a[aria-current=page]{background:rgba(208,138,106,.16);box-shadow:inset 2px 0 #d08a6a}' +
    '.gnav.low{top:auto;bottom:10px;left:auto;right:10px;transform:none}.gnav.low .gnav-menu{top:auto;bottom:38px;left:auto;right:0;margin-left:0;transform:translateY(6px)}.gnav.low.open .gnav-menu{transform:none}' +
    'body:not(.on-map) .gnav.app{top:auto;bottom:10px}body:not(.on-map) .gnav.app .gnav-menu{top:auto;bottom:38px;transform:translateY(6px)}body:not(.on-map) .gnav.app.open .gnav-menu{transform:none}' +
    '@media(max-width:640px){.gnav-menu,.gnav.low .gnav-menu{width:250px;max-height:calc(100vh - 24px)}body:not(.on-map) .gnav.app .gnav-menu{top:50%;bottom:auto}.gnav,.gnav.low,body:not(.on-map) .gnav.app{top:50%;bottom:auto;left:0;right:auto;transform:translateY(-50%)}.gnav-btn{height:56px;width:24px;padding:0;justify-content:center;border-left:0;border-radius:0 14px 14px 0;font-size:0;gap:0}.gnav-menu,.gnav.low .gnav-menu{top:50%;bottom:auto;left:30px;right:auto;margin-left:0;transform:translateY(-50%) translateX(-6px)}.gnav.open .gnav-menu,.gnav.low.open .gnav-menu{transform:translateY(-50%)}}' +
    '@media print{.gnav{display:none}}';
  function go() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var w = document.createElement('nav'); w.className = 'gnav'; w.setAttribute('aria-label', 'Rhythm Geometry pages'); if (/\/rhythm-geometry\/play\/$/.test(path)) w.classList.add('low'); if (/\/rhythm-geometry\/(melodic\/|duet\/)?$/.test(path)) w.classList.add('app');
    var b = document.createElement('button'); b.className = 'gnav-btn'; b.type = 'button'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-haspopup', 'true');
    b.innerHTML = '<i></i>Pages';
    var m = document.createElement('div'); m.className = 'gnav-menu';
    var col = null;
    ITEMS.forEach(function (it) {
      if (!it[1]) { if (!col || it[0] !== 'Blue Wave') { col = document.createElement('div'); col.className = 'gnav-col'; m.appendChild(col); } var h = document.createElement('div'); h.className = 'gnav-h'; h.textContent = it[0]; col.appendChild(h); return; }
      var a = document.createElement('a'); a.href = it[1]; a.innerHTML = it[0] + '<small>' + it[2] + '</small>';
      if (path === it[1] || path === it[1].replace(/\/$/, '')) a.setAttribute('aria-current', 'page');
      col.appendChild(a);
    });
    w.appendChild(b); w.appendChild(m); document.body.appendChild(w);
    function set(o) { w.classList.toggle('open', o); b.setAttribute('aria-expanded', o ? 'true' : 'false'); }
    b.addEventListener('click', function (e) { e.stopPropagation(); set(!w.classList.contains('open')); });
    document.addEventListener('click', function (e) { if (!w.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); b.blur(); } });
  }
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
