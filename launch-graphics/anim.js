/* Shared animation for the Three Cities graphics.
   Everything is driven by setT(seconds) so frames can be captured one by one.
   Reveal runs 0 to about 3s, then gentle motion carries on (glows drift,
   markers pulse, playheads turn, film grain flickers). */
(function () {
  const ease = (x) => { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); };
  const back = (x) => { x = Math.max(0, Math.min(1, x)); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const prog = (t, d, dur) => (t - d) / dur;
  let items = [], glows = [], grain = null, heads = [], scans = [], pulses = [], ready = false;

  function collect() {
    const st = document.getElementById('stage'); items = []; glows = []; heads = []; scans = []; pulses = [];
    grain = st.querySelector('.grain');
    const kids = Array.from(st.children).filter((e) => e !== grain);
    const isSocial = !!st.querySelector('.mk, .fig, .note') || document.title.indexOf('social') > -1;
    // background svg (first) holds the glow circles on both pages
    const first = kids[0];
    const launch = document.title.toLowerCase().indexOf('launch') > -1;
    if (first && first.tagName.toLowerCase() === 'svg') { items.push(launch ? { el: first, kind: 'art', d: 0.1, dur: 1.4 } : { el: first, kind: 'bg', d: 0, dur: 1.0 }); first.querySelectorAll('circle[filter="url(#blur40)"], circle[filter="url(#b40)"]').forEach((c, i) => glows.push({ el: c, i, cx: +c.getAttribute('cx'), cy: +c.getAttribute('cy') })); }
    const rest = kids.slice(1);
    let rank = 0; const texts = [];
    rest.forEach((el) => {
      const tag = el.tagName.toLowerCase(); const cls = el.className && el.className.baseVal === undefined ? el.className : '';
      if (tag === 'svg') {
        const hasLogo = el.querySelector('g[fill="#f3ece6"]') && !el.querySelector('circle');
        if (hasLogo) items.push({ el, kind: 'logo', d: 0.1, dur: .8 });
        else items.push({ el, kind: 'art', d: isSocial ? 1.0 : 0.15, dur: 1.2 });
        el.querySelectorAll('.ph').forEach((g) => heads.push({ g, cx: +g.dataset.cx, cy: +g.dataset.cy, n: +g.dataset.n, sp: +(g.dataset.sp || 3) }));
        el.querySelectorAll('.scan').forEach((g) => scans.push({ g, x0: +g.dataset.x0, w: +g.dataset.w, n: +(g.dataset.n || 36) }));
      } else if (cls.indexOf('mk') > -1) { items.push({ el, kind: 'pop', d: 1.9 + pulses.length * 0.16, dur: .55 }); pulses.push(el); }
      else if (cls.indexOf('fig') > -1) items.push({ el, kind: 'fig', d: 0.95, dur: 1.0 });
      else if (cls.indexOf('grain') > -1) { /* skip */ }
      else texts.push(el);
    });
    // text blocks reveal top to bottom
    texts.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    texts.forEach((el) => {
      const notes = el.querySelectorAll(':scope > .note');
      if (notes.length) notes.forEach((n, i) => items.push({ el: n, kind: 'rise', d: 1.5 + i * 0.28, dur: .7 }));
      else { items.push({ el, kind: 'rise', d: 0.3 + rank * 0.28, dur: .75 }); rank++; }
    });
    // footer-like (bottom-most) text appears last
    ready = true;
  }

  window.setT = function (t) {
    if (!ready) collect();
    items.forEach((it) => {
      const p = prog(t, it.d, it.dur), e = ease(p), el = it.el;
      if (it.kind === 'bg') { el.style.opacity = ease(p); return; }
      if (it.kind === 'logo') { el.style.opacity = e; el.style.transform = `translateY(${(1 - e) * -14}px) scale(${.92 + .08 * e})`; el.style.transformOrigin = '50% 0%'; return; }
      if (it.kind === 'art') { el.style.opacity = e; el.style.transform = `scale(${1.05 - .05 * e})`; el.style.transformOrigin = '50% 50%'; return; }
      if (it.kind === 'fig') { el.style.opacity = e; el.style.transform = `translateY(${(1 - e) * 36}px) scale(${.965 + .035 * e})`; return; }
      if (it.kind === 'pop') { const b = back(p); el.style.opacity = Math.min(1, p * 4 < 0 ? 0 : Math.min(1, p * 4)); el.style.transform = `scale(${Math.max(0.0001, b)})`; return; }
      el.style.opacity = e; el.style.transform = (el.classList.contains('pill') ? 'translateX(-50%) ' : '') + `translateY(${(1 - e) * 26}px)`;
    });
    // glows drift slowly
    glows.forEach((g) => { const a = t * .55 + g.i * 2.1; g.el.setAttribute('transform', `translate(${Math.sin(a) * 34} ${Math.cos(a * .8) * 26})`); });
    // grain flicker
    if (grain) { const k = Math.floor(t * 12); grain.style.backgroundPosition = `${(k * 53) % 300}px ${(k * 97) % 300}px`; }
    // markers pulse (ring that expands and fades)
    pulses.forEach((el, i) => { const ph = ((t - 2.4 - i * .2) % 1.6 + 1.6) % 1.6 / 1.6; const on = t > 2.4 + i * .2; el.style.boxShadow = `0 0 0 3px rgba(255,236,220,.9), 0 4px 14px rgba(20,8,4,.6)` + (on ? `, 0 0 0 ${6 + ph * 16}px rgba(255,138,79,${.5 * (1 - ph)})` : ''); });
    // footer dot pulse
    document.querySelectorAll('.dot').forEach((d) => { d.style.opacity = .55 + .45 * (0.5 + 0.5 * Math.sin(t * 5)); });
    // ring playheads step round
    heads.forEach((h) => { const k = Math.floor(Math.max(0, t - 1.4) * h.sp); h.g.setAttribute('transform', `rotate(${k * 360 / h.n} ${h.cx} ${h.cy})`); });
    // scanning cursor
    scans.forEach((s) => { const u = ((Math.max(0, t - 1.6) * (s.n / 6)) % s.n); const x = s.x0 + Math.floor(u) * (s.w / s.n); s.g.setAttribute('transform', `translate(${x} 0)`); s.g.style.opacity = Math.min(1, Math.max(0, (t - 1.6) * 2)); });
  };
  window.resetAnim = function () { ready = false; };
})();
