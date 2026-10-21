"""Export the graphics as SVG with live text and separate shapes, for Figma.
Run from the repo root:  python3 -I launch-graphics/export_svg.py [launch|social|square] [name ...]
Text is exported one <text> per line, boxes as <rect>, screenshots as <image>, rings and art as vector.
Fonts used: Abel and Source Code Pro (design-assets/fonts, also on Google Fonts)."""
import sys, pathlib, base64, re, urllib.parse
from playwright.sync_api import sync_playwright
here = pathlib.Path(__file__).resolve().parent
PAGES = {'launch': here / 'src' / 'launch.html', 'social': here / 'social' / 'social.html', 'square': here / 'social' / 'square.html'}

WALK = r"""
() => {
  const st = document.getElementById('stage'), sr = st.getBoundingClientRect(), W = sr.width, H = sr.height;
  const cv = document.createElement('canvas').getContext('2d'), imgs = [];
  const asc = (f) => { cv.font = f; return cv.measureText('Hg').fontBoundingBoxAscent; };
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = (v) => Math.round(v * 100) / 100;
  const rgba = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const hex = (o) => '#' + [o.r, o.g, o.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const name = (el, i) => { const c = (typeof el.className === 'string' ? el.className : '').trim().split(/\s+/)[0]; return (c || el.tagName.toLowerCase()) + (i ? ' ' + i : ''); };
  let n = 0;
  function svgRoot(el) {
    const r = el.getBoundingClientRect(), vb = (el.getAttribute('viewBox') || '').split(/[ ,]+/).map(Number);
    const sx = vb.length === 4 ? r.width / vb[2] : 1, sy = vb.length === 4 ? r.height / vb[3] : 1;
    const c = el.cloneNode(true);
    // carry text styling into attributes so it survives outside the page's CSS
    const live = el.querySelectorAll('text, tspan'), cl = c.querySelectorAll('text, tspan');
    live.forEach((t, i) => { const cs = getComputedStyle(t); cl[i].setAttribute('font-family', cs.fontFamily.split(',')[0].replace(/["']/g, '')); cl[i].setAttribute('font-size', cs.fontSize); cl[i].setAttribute('font-weight', cs.fontWeight); if (cs.letterSpacing !== 'normal') cl[i].setAttribute('letter-spacing', cs.letterSpacing); if (!cl[i].getAttribute('fill')) cl[i].setAttribute('fill', cs.fill); });
    const tx = r.left - sr.left - (vb.length === 4 ? vb[0] * sx : 0), ty = r.top - sr.top - (vb.length === 4 ? vb[1] * sy : 0);
    return `<g id="${esc(name(el, ++n))}" transform="translate(${num(tx)} ${num(ty)})${sx !== 1 || sy !== 1 ? ` scale(${num(sx)} ${num(sy)})` : ''}">${c.innerHTML}</g>`;
  }
  function textOf(node, cs, op) {
    const raw = node.textContent; if (!raw.trim()) return '';
    let s = raw.replace(/\s+/g, ' ');
    // split into words with offsets, find each word's rect, group into lines
    const words = []; const re = /\S+/g; let m; const txt = node.textContent;
    const norm = []; // map of normalised string positions
    let out = '';
    const rg = document.createRange();
    let lines = [];
    const ws = txt.replace(/\s/g, ' ');
    while ((m = re.exec(ws))) {
      rg.setStart(node, m.index); rg.setEnd(node, m.index + m[0].length);
      const rects = rg.getClientRects(); if (!rects.length) continue; const r = rects[0];
      const last = lines[lines.length - 1];
      if (last && Math.abs(r.top - last.top) < r.height * 0.5) { last.words.push(m[0]); last.right = r.right; }
      else lines.push({ top: r.top, left: r.left, right: r.right, h: r.height, words: [m[0]] });
    }
    const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, a = asc(font);
    const col = rgba(cs.color) || { r: 255, g: 255, b: 255, a: 1 };
    for (const l of lines) {
      let t = l.words.join(' '); if (cs.textTransform === 'uppercase') t = t.toUpperCase(); else if (cs.textTransform === 'lowercase') t = t.toLowerCase();
      const ls = cs.letterSpacing !== 'normal' ? ` letter-spacing="${num(parseFloat(cs.letterSpacing))}"` : '';
      out += `<text x="${num(l.left - sr.left)}" y="${num(l.top - sr.top + a)}" font-family="${esc(fam)}" font-size="${parseFloat(cs.fontSize)}" font-weight="${cs.fontWeight}"${ls} fill="${hex(col)}" fill-opacity="${num(col.a * op)}" xml:space="preserve">${esc(t)}</text>`;
    }
    return out;
  }
  function walk(el, op) {
    if (el.nodeType !== 1) return '';
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return '';
    if (el.classList.contains('grain')) return '';
    const o = op * parseFloat(cs.opacity); if (o <= 0) return '';
    if (el.tagName.toLowerCase() === 'svg') return svgRoot(el);
    const r = el.getBoundingClientRect(); let s = '';
    const bg = rgba(cs.backgroundColor), bw = parseFloat(cs.borderTopWidth) || 0, bc = rgba(cs.borderTopColor);
    const rad = parseFloat(cs.borderTopLeftRadius) || 0;
    if (r.width > 0 && r.height > 0 && ((bg && bg.a > 0) || (bw > 0 && bc && bc.a > 0 && cs.borderTopStyle !== 'none'))) {
      const fill = bg && bg.a > 0 ? `fill="${hex(bg)}" fill-opacity="${num(bg.a * o)}"` : 'fill="none"';
      const stroke = bw > 0 && bc && bc.a > 0 && cs.borderTopStyle !== 'none' ? ` stroke="${hex(bc)}" stroke-opacity="${num(bc.a * o)}" stroke-width="${bw}"` : '';
      const rr = Math.min(rad, Math.min(r.width, r.height) / 2);
      s += `<rect id="${esc(name(el, 0))} box" x="${num(r.left - sr.left + bw / 2)}" y="${num(r.top - sr.top + bw / 2)}" width="${num(r.width - bw)}" height="${num(r.height - bw)}" rx="${num(rr)}" ${fill}${stroke}/>`;
    }
    { const bs = cs.boxShadow; if (bs && bs !== 'none') { const m = bs.match(/(rgba?\([^)]+\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px(?:\s+([\d.]+)px)?/); if (m && parseFloat(m[4]) === 0 && parseFloat(m[5] || 0) > 0) { const sp = parseFloat(m[5]), c = rgba(m[1]); const rr = Math.min(rad + sp, Math.min(r.width, r.height) / 2 + sp); s += `<rect id="ring" x="${num(r.left - sr.left - sp / 2)}" y="${num(r.top - sr.top - sp / 2)}" width="${num(r.width + sp)}" height="${num(r.height + sp)}" rx="${num(rr)}" fill="none" stroke="${hex(c)}" stroke-opacity="${num(c.a * o)}" stroke-width="${sp}"/>`; } } }
    if (el.tagName.toLowerCase() === 'img') {
      imgs.push(el.currentSrc); return `<image id="screenshot" x="${num(r.left - sr.left)}" y="${num(r.top - sr.top)}" width="${num(r.width)}" height="${num(r.height)}" preserveAspectRatio="none" href="__IMG__${imgs.length - 1}__" opacity="${num(o)}"/>`;
    }
    const kids = [];
    el.childNodes.forEach((c) => { if (c.nodeType === 3) { const t = textOf(c, cs, o); if (t) kids.push(t); } else if (c.nodeType === 1) { const k = walk(c, o); if (k) kids.push(k); } });
    s += kids.join('');
    if (!s) return '';
    return `<g id="${esc(name(el, ++n))}">${s}</g>`;
  }
  const body = Array.from(st.children).map((c) => walk(c, 1)).join('\n');
  const bgc = [st, document.body, document.documentElement].map(e => rgba(getComputedStyle(e).backgroundColor)).find(c => c && c.a > 0) || { r: 46, g: 28, b: 23, a: 1 };
  return { W, H, body, imgs, bg: hex(bgc) };
}
"""

def export(pg, url, name, out):
    pg.goto(url + '?d=' + name); pg.wait_for_function('document.fonts.ready.then(()=>true)'); pg.wait_for_timeout(250)
    r = pg.evaluate(WALK)
    body = r['body']
    def sub(m):
        src = r['imgs'][int(m.group(1))]
        path = pathlib.Path(urllib.parse.unquote(urllib.parse.urlparse(src).path))
        mime = 'image/png' if path.suffix == '.png' else 'image/jpeg'
        return 'data:%s;base64,%s' % (mime, base64.b64encode(path.read_bytes()).decode())
    body = re.sub(r'__IMG__(\d+)__', sub, body)
    W, H = round(r['W']), round(r['H'])
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n<rect id="Background" width="{W}" height="{H}" fill="{r['bg']}"/>\n{body}\n</svg>\n'
    out.mkdir(parents=True, exist_ok=True); (out / (name + '.svg')).write_text(svg); print('svg', name, len(svg) // 1024, 'KB', flush=True)

def run(kind, names=None, page=None, outdir=None):
    page = page or PAGES[kind]; outdir = outdir or (here / 'figma' / kind)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1600, 'height': 2000}); pg.on('pageerror', lambda e: print('PAGE ERROR', e))
        pg.goto(page.as_uri()); names = names or pg.evaluate('NAMES')
        for n in names: export(pg, page.as_uri(), n, outdir)
        b.close()

if __name__ == '__main__':
    run(sys.argv[1], sys.argv[2:])
