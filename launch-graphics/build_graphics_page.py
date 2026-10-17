"""Build /graphics (graphics.html): every graphic, every version, with PNG, MP4 and Figma SVG links.
Run from the repo root after adding or re-rendering graphics:  python3 -I launch-graphics/build_graphics_page.py
Also makes the small thumbnails in launch-graphics/thumbs/ and the download zips."""
import pathlib, zipfile, html, re, tempfile
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent
lg = root / 'launch-graphics'
SETS = [  # key, heading, blurb, png dir, ext, svg dir, mp4 dir
    ('square', 'Instagram squares', '1080 × 1080. Big screens from the phone layout, for the feed. Slides with b in the name pair with the one before.', lg / 'social' / 'square', 'png', lg / 'figma' / 'square', lg / 'animated' / 'square'),
    ('social', 'Social: feature details', 'Posts (4:5), stories (9:16) and banners (3:1) that show real interface detail for music nerds.', lg / 'social' / 'png', 'png', lg / 'figma' / 'social', lg / 'animated' / 'social'),
    ('launch', 'Launch graphics', 'The 14 launch designs: squares, stories, a banner, a link card and a portrait. The final lighter, warmer set.', lg / 'png', 'png', lg / 'figma' / 'launch', lg / 'animated' / 'launch'),
]
EARLIER = [
    ('launch/v1', 'Launch, version 1', 'The first set. Dark backgrounds.', 'launch-earlier/v1'),
    ('launch/v2', 'Launch, version 2', 'Lighter, warmer daylight backgrounds.', 'launch-earlier/v2'),
    ('launch/v3', 'Launch, version 3', 'Logo added, bolder Now live, legible city names, app-style shapes.', 'launch-earlier/v3'),
    ('launch/v4', 'Launch, version 4', '"Listen before they dream", bigger logo, punchier Now live.', 'launch-earlier/v4'),
    ('launch/v5', 'Launch, version 5', 'The cities grid as app-style cards with readable names.', 'launch-earlier/v5'),
    ('social/v1', 'Social MIDI, version 1', 'The first MIDI graphic, before the Fireface UCX and channel routing.', 'social-earlier/v1'),
]
FORMAT = {(1080, 1080): 'Square 1:1', (1080, 1350): 'Post 4:5', (1080, 1920): 'Story 9:16', (1500, 500): 'Banner 3:1'}
def pretty(stem):
    s = re.sub(r'^\d+b?-', '', stem); m = re.search(r'-(post|story|banner|square)$', s); s = re.sub(r'-(post|story|banner|square)$', '', s)
    tag = ', ' + m.group(1) if m and m.group(1) in ('story', 'banner') else ''
    return ('Part 2: ' if re.match(r'^\d+b-', stem) else '') + s.replace('-', ' ').capitalize() + tag
def thumb(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime: return
    im = Image.open(src).convert('RGB'); im.thumbnail((520, 520)); im.save(dst, quality=82)
def rel(p): return '/' + str(p.relative_to(root)).replace('\\', '/')
def tile(key, png, svg, mp4):
    t = lg / 'thumbs' / key / (png.stem + '.jpg'); thumb(png, t)
    w, h = Image.open(png).size
    fmt = FORMAT.get((w, h), f'{w} × {h}')
    links = f'<a href="{rel(png)}" target="_blank" rel="noopener">{png.suffix[1:].upper()}</a>'
    if svg.exists(): links += f'<a href="{rel(svg)}" download>Figma SVG</a>'
    if mp4 and mp4.exists(): links += f'<a href="{rel(mp4)}" download>MP4</a><button type="button" data-play="{rel(mp4)}">Play</button>'
    return f'<div class="sc"><div class="th"><img src="{rel(t)}" alt="{html.escape(pretty(png.stem))}" loading="lazy" width="{t_w(t)}" height="{t_h(t)}"></div><div class="in"><b>{html.escape(pretty(png.stem))}</b><div class="sz">{png.stem} · {fmt} · {w}×{h}</div><div class="acts">{links}</div></div></div>'
_sz = {}
def t_w(p): return _sz.setdefault(p, Image.open(p).size)[0]
def t_h(p): return _sz.setdefault(p, Image.open(p).size)[1]
out = []
nav = []
total = 0
for key, head, blurb, pdir, ext, sdir, mdir in SETS:
    files = sorted(pdir.glob('*.' + ext)); total += len(files)
    tiles = ''.join(tile(key, f, sdir / (f.stem + '.svg'), mdir / (f.stem + '.mp4')) for f in files)
    nav.append(f'<a href="#{key}">{head}</a>')
    out.append(f'<h2 id="{key}">{head} <small>{len(files)}</small></h2><p class="hint">{blurb}</p><div class="sg">{tiles}</div>')
out.append('<h2 id="earlier">Earlier versions <small>kept in case you want them back</small></h2>')
nav.append('<a href="#earlier">Earlier versions</a>')
for sub, head, blurb, svgsub in EARLIER:
    d = lg / 'earlier' / sub; files = sorted(d.glob('*.jpg')); total += len(files)
    tiles = ''.join(tile('earlier-' + sub.replace('/', '-'), f, lg / 'figma' / svgsub / (f.stem + '.svg'), None) for f in files)
    out.append(f'<details class="ver"><summary><b>{head}</b> <span>{len(files)} · {blurb}</span></summary><div class="sg">{tiles}</div></details>')
# zips: the stills and videos zips are already in the repo. The Figma and earlier-version zips are big copies of
# files the page links one by one, so they are made on request (python3 launch-graphics/build_graphics_page.py zips) and not committed.
import sys
def mkzip(path, items):
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for arc, p in items: zf.write(p, arc)
if 'zips' in sys.argv:
    print('writing zips to', tempfile.gettempdir())
    mkzip(pathlib.Path(tempfile.gettempdir()) / 'Three_Cities_Figma_SVG.zip', [(f'{k}/{f.name}', f) for k in ('launch', 'social', 'square') for f in sorted((lg / 'figma' / k).glob('*.svg'))])
    mkzip(pathlib.Path(tempfile.gettempdir()) / 'Three_Cities_Earlier_Versions.zip', [(str(f.relative_to(lg / 'earlier')), f) for f in sorted((lg / 'earlier').rglob('*.jpg'))] + [(str(f.relative_to(lg / 'figma')), f) for k in ('launch-earlier', 'social-earlier') for f in sorted((lg / 'figma' / k).rglob('*.svg'))])
zips = []
for n, label in [('Three_Cities_Square_Graphics.zip', 'Square stills'), ('Three_Cities_Social_Graphics.zip', 'Social stills'), ('Three_Cities_Launch_Graphics.zip', 'Launch stills'), ('Three_Cities_Animated_Square.zip', 'Square videos'), ('Three_Cities_Animated_Social_Launch.zip', 'Social and launch videos')]:
    if (lg / n).exists(): zips.append((lg / n, label))
zl = ''.join(f'<a class="page" style="padding:9px 16px;border-radius:18px;display:inline-block" href="{rel(p)}" download>{l} <small>{p.stat().st_size // 1048576} MB</small></a>' for p, l in zips)
page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Three Cities Graphics</title>
<link rel="icon" href="/favicon.svg?v=5" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Abel&family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {{ --bg: #100806; --panel: #1b1210; --ink: #f3ece6; --dim: rgba(243,236,230,0.6); --faint: rgba(243,236,230,0.14); --ember: #e07a4f; --mono: "Source Code Pro", monospace; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 Abel, "Arial Narrow", sans-serif; letter-spacing: 0.02em; }}
.wrap {{ max-width: 1180px; margin: 0 auto; padding: 32px 16px 80px; }}
header {{ display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }}
h1 {{ font-weight: 400; font-size: 26px; letter-spacing: 0.18em; text-transform: uppercase; margin: 0; }}
h1 span {{ color: var(--dim); }}
.back {{ font: 12px var(--mono); color: var(--dim); text-decoration: none; display: inline-block; margin-bottom: 18px; }}
.back:hover {{ color: var(--ink); }}
h2 {{ font: 500 11px var(--mono); letter-spacing: 0.2em; text-transform: uppercase; color: var(--dim); margin: 40px 0 8px; }}
h2 small {{ font-weight: 400; letter-spacing: 0.08em; margin-left: 8px; color: var(--ember); text-transform: none; }}
.hint {{ color: var(--dim); font-size: 15px; max-width: 760px; margin: 0 0 4px; }}
.page {{ border: 1px solid var(--faint); background: var(--panel); color: var(--ink); text-decoration: none; transition: border-color .2s; font: 13px var(--mono); }}
.page:hover {{ border-color: var(--ember); }}
.page small {{ color: var(--dim); margin-left: 6px; }}
.bar-row {{ display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 10px; }}
.jump {{ display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 0; }}
.jump a {{ font: 12px var(--mono); padding: 6px 14px; border-radius: 16px; border: 1px solid var(--faint); color: var(--ink); text-decoration: none; }}
.jump a:hover {{ border-color: var(--ink); }}
.sg {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; margin-top: 12px; }}
.sc {{ border: 1px solid var(--faint); border-radius: 16px; background: var(--panel); overflow: hidden; display: flex; flex-direction: column; }}
.sc .th {{ display: flex; align-items: center; justify-content: center; height: 230px; background: #000; }}
.sc .th img, .sc .th video {{ max-width: 100%; max-height: 100%; width: auto; height: auto; display: block; }}
.sc .in {{ padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 8px; }}
.sc b {{ font-weight: 400; font-size: 17px; letter-spacing: 0.04em; }}
.sc .sz {{ font: 11px var(--mono); color: var(--dim); }}
.sc .acts {{ display: flex; flex-wrap: wrap; gap: 6px; }}
.sc .acts a, .sc .acts button {{ font: 11px var(--mono); padding: 6px 12px; border-radius: 16px; border: 1px solid var(--faint); background: var(--panel); color: var(--ink); text-decoration: none; cursor: pointer; }}
.sc .acts a:hover, .sc .acts button:hover {{ border-color: var(--ink); }}
details.ver {{ margin-top: 12px; border: 1px solid var(--faint); border-radius: 16px; background: rgba(27,18,16,.5); padding: 4px 16px 16px; }}
details.ver summary {{ cursor: pointer; padding: 12px 0; list-style: none; }}
details.ver summary b {{ font-weight: 400; font-size: 19px; letter-spacing: 0.05em; margin-right: 10px; }}
details.ver summary span {{ font: 12px var(--mono); color: var(--dim); }}
details.ver summary::-webkit-details-marker {{ display: none; }}
.fig {{ background: var(--panel); border: 1px solid var(--faint); border-radius: 16px; padding: 16px 18px; margin-top: 14px; max-width: 760px; }}
.fig b {{ font-weight: 400; font-size: 18px; letter-spacing: 0.05em; }}
.fig p {{ margin: 6px 0 0; color: var(--dim); font-size: 14px; }}
</style>
</head>
<body>
<div class="wrap">
<a class="back" href="/admin">← Admin</a>
<header><h1>Graphics <span>· {total} designs</span></h1></header>
<p class="hint">Every launch and social graphic made so far, including the earlier versions. PNG to post, MP4 for the animated version, Figma SVG to edit.</p>
<div class="jump">{''.join(nav)}</div>
<h2>Downloads</h2>
<div class="bar-row">{zl}</div>
<div class="fig"><b>Using the SVGs in Figma</b><p>Drag an SVG onto a Figma page. Text stays live, boxes and rings are shapes, and the screenshots are images you can swap. Install Abel and Source Code Pro first (both are in design-assets/fonts and on Google Fonts). Each line of text is its own layer, so a paragraph that wraps is a few layers. Glows come in as blurred circles. The grain overlay is left out.</p></div>
{''.join(out)}
</div>
<script>
document.addEventListener("click", function (e) {{
  var b = e.target.closest("button[data-play]"); if (!b) return;
  var th = b.closest(".sc").querySelector(".th");
  if (th.querySelector("video")) {{ th.querySelector("video").remove(); th.insertAdjacentHTML("afterbegin", th.dataset.img); b.textContent = "Play"; return; }}
  th.dataset.img = th.innerHTML; th.innerHTML = '<video src="' + b.dataset.play + '" autoplay loop muted playsinline controls></video>'; b.textContent = "Stop";
}});
</script>
</body>
</html>
'''
(root / 'graphics.html').write_text(page)
print('built graphics.html', total, 'designs')
