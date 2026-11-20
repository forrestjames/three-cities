#!/usr/bin/env python3
"""Builds record-test.html from index.html. Run from the repo root: python3 record-test/build.py"""
import re, sys
src = open('index.html', encoding='utf-8').read()
inj = open('record-test/inject.js', encoding='utf-8').read()
css = open('record-test/inject.css', encoding='utf-8').read()

def sub(old, new, s, count=1):
    if s.count(old) != count:
        sys.exit('expected %d of %r, found %d' % (count, old[:70], s.count(old)))
    return s.replace(old, new)

s = src
s = sub('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex, nofollow">', s)
s = re.sub(r'<link rel="canonical"[^>]*>\n?', '', s)
s = re.sub(r'<script type="application/ld\+json">.*?</script>\n?', '', s, flags=re.S)
s = sub('<title>Three Cities by Forrest James · Music played by live weather</title>', '<title>Three Cities · Record test</title>', s)
s = sub('if (QS.has("reel") ||', 'if (true || QS.has("reel") ||', s)
# the cards are built early, so the recorder goes in before them
s = sub('  cities.forEach(c => {\n    const id = c.key.toLowerCase();\n', inj + '  cities.forEach(c => {\n    const id = c.key.toLowerCase();\n', s)
s = sub('    c.ref.sampFile.addEventListener("change",', '    STUDIO.mount(c);\n    c.ref.sampFile.addEventListener("change",', s)
# every city starts on your recording (felt piano keeps the seat warm until there is one)
s = sub('color: "--boston", voice: "marimba"', 'color: "--boston", voice: "sample"', s)
s = sub('color: "--copenhagen", voice: "mallet"', 'color: "--copenhagen", voice: "sample"', s)
s = sub('color: "--london", voice: "sub"', 'color: "--london", voice: "sample"', s)
s = sub('["sample", "Your sample…"]', '["sample", "Your recording…"]', s)
s = sub('No sample yet', 'No recording yet', s, 2)
# audio side: the studio engine plays the recording, and the Audio switch can silence the browser side
s = sub('  function voiceCore(c, midi, vel, t, L = 1) {\n', '  function voiceCore(c, midi, vel, t, L = 1) {\n    if (c.recMute) return;\n    if (c.voice === "sample" && c.samp && c.samp.buf && STUDIO.play(c, midi, vel, t, L)) return;\n', s)
# MIDI side: the MIDI switch can silence what goes out
s = sub('  function sendMidi(c, note, vel, t) {\n    if (!midiOut) return;\n', '  function sendMidi(c, note, vel, t) {\n    if (!midiOut || c.recNoMidi) return;\n', s)
# a loaded file gets the trim too
s = sub('      matchSampleKey(c);\n    } catch (err) { c.ref.sampName.textContent = "Couldn\'t read that file.', '      matchSampleKey(c); STUDIO.fromFile(c, buf, c.samp.name);\n    } catch (err) { c.ref.sampName.textContent = "Couldn\'t read that file.', s)
s = sub('@media (pointer: coarse) { .samp-shape button, .samp-load { min-height: 40px; } }', '@media (pointer: coarse) { .samp-shape button, .samp-load { min-height: 40px; } }\n' + css, s)
open('record-test.html', 'w', encoding='utf-8').write(s)
print('wrote record-test.html', len(s))
