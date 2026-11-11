#!/usr/bin/env python3
"""Makes the four place-driven performance pages from pad/index.html and slice/index.html:
   three/ and three/slice/ (Boston, Copenhagen, London), wave/ and wave/slice/ (four seas).
   Run after changing pad/index.html or slice/index.html:   python3 build_perform.py"""
import os, re
here = os.path.dirname(os.path.abspath(__file__))
def rd(p): return open(os.path.join(here, p), encoding='utf8').read()
SRCS = {
  'three': dict(name='Three Cities', eyebrow='Three Cities', desc='Play the live weather in Boston, Copenhagen and London with your hands. A chaos pad and a slicer, with full MIDI out.', how='Pick any three cities. Each plays two rings. Temperature sets how long a ring is.', accent='#e8744a'),
  'wave': dict(name='Blue Wave', eyebrow='Blue Wave', desc='Play live sea waves with your hands. A chaos pad and a slicer, with full MIDI out.', how='Pick four seas or beaches. Each plays two rings. Bigger waves play more notes. Longer waves play more steps.', accent='#5aa9e6'),
}
for src, c in SRCS.items():
    for surf, base, out in (('pad', 'pad/index.html', src + '/index.html'), ('slice', 'slice/index.html', src + '/slice/index.html')):
        h = rd(base)
        h = h.replace('<body data-surface="%s">' % surf, '<body data-surface="%s" data-source="%s">' % (surf, src))
        h = re.sub(r'<title>[^<]*</title>', '<title>%s: %s</title>' % (c['name'], 'Pad' if surf == 'pad' else 'Slice'), h)
        h = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="%s">' % c['desc'], h)
        h = re.sub(r'<p class="eyebrow">.*?</p>', '<p class="eyebrow">%s &middot; <b>%s</b></p>' % (c['eyebrow'], 'Pad' if surf == 'pad' else 'Slice'), h, count=1)
        h = re.sub(r'<div class="picks">.*?</div>', '<div class="picks" id="places"></div><p class="how2">%s</p>' % c['how'], h, count=1, flags=re.S)
        if src == 'wave': h = h.replace('<script src="/rhythm-geometry/live/data.js"></script>', '<script src="/rhythm-geometry/live/places.js"></script>')
        h = h.replace('title="Drums: the rings play the kit. Notes: every ring plays a note of the chord, for your synths."', 'title="Drums, Notes or Both. Both: the first ring of each place plays notes and the second plays the kit."')
        h = h.replace('</head>', '<style>:root{--accent:%s}.how2{margin:6px 0 0;font-size:11.5px;color:var(--ink-dim);max-width:34ch}</style>\n</head>' % c['accent'])
        d = os.path.join(here, os.path.dirname(out)); os.makedirs(d, exist_ok=True)
        open(os.path.join(here, out), 'w', encoding='utf8').write(h)
        print('wrote', out)
