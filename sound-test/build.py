#!/usr/bin/env python3
"""Builds sound-test.html from index.html. Run from the repo root: python3 sound-test/build.py"""
import re, sys
src = open('index.html', encoding='utf-8').read()
inj = open('sound-test/inject.js', encoding='utf-8').read()

def sub(old, new, s, count=1):
    if s.count(old) != count:
        sys.exit('expected %d of %r, found %d' % (count, old[:60], s.count(old)))
    return s.replace(old, new)

s = src
s = sub('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex, nofollow">', s)
s = re.sub(r'<link rel="canonical"[^>]*>\n?', '', s)
s = re.sub(r'<script type="application/ld\+json">.*?</script>\n?', '', s, flags=re.S)
s = sub('<title>Three Cities by Forrest James · Music played by live weather</title>', '<title>Three Cities · Sound test</title>', s)
# the test page never counts as a visit
s = sub('if (QS.has("reel") ||', 'if (true || QS.has("reel") ||', s)
# put the test kit in front of the original voices
s = sub('  function voiceCore(c, midi, vel, t, L = 1) {\n', inj + '  function voiceCore(c, midi, vel, t, L = 1) {\n    if (ST.on && c.voice !== "sample" && ST.play(c, midi, vel, t, L)) return;\n', s)
open('sound-test.html', 'w', encoding='utf-8').write(s)
print('wrote sound-test.html', len(s))
