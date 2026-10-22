#!/usr/bin/env python3
"""Builds placement-test.html from index.html. Run from the repo root: python3 placement-test/build.py"""
import sys, re
src = open('index.html', encoding='utf-8').read()
inj = open('placement-test/inject.js', encoding='utf-8').read()

def sub(old, new, s):
    if s.count(old) != 1:
        sys.exit('expected 1 of %r, found %d' % (old[:70], s.count(old)))
    return s.replace(old, new)

s = src
s = sub('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex, nofollow">', s)
s = re.sub(r'<link rel="canonical"[^>]*>\n?', '', s)
s = re.sub(r'<script type="application/ld\+json">.*?</script>\n?', '', s, flags=re.S)
s = sub('<title>Three Cities by Forrest James · Music played by live weather</title>', '<title>Three Cities · Placement test</title>', s)
s = sub('if (QS.has("reel") ||', 'if (true || QS.has("reel") ||', s)
s = sub('    const base = euclid(c.hits, c.steps), rot = (c.rot || 0) % c.steps;\n    c.pattern = base.slice(rot).concat(base.slice(0, rot));   // rotated by the long-form shifts below',
        '    c.pattern = PLACE.setup(c);   // where the hits go: Euclid, Drift or Cluster (see the placement bar)', s)
s = sub('  function rebuild(c) {\n', inj + '  function rebuild(c) {\n', s)
s = sub('    const pos = c.pos;\n    const s = sunNow(c);', '    const pos = c.pos;\n    if (pos === 0) PLACE.loop(c);   // a new loop: drift moves on, cluster redraws\n    const s = sunNow(c);', s)
open('placement-test.html', 'w', encoding='utf-8').write(s)
print('wrote placement-test.html', len(s))
