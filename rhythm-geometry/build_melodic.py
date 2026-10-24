#!/usr/bin/env python3
"""Builds melodic/index.html from index.html.
The melodic page is the same app with every genre drum swapped for a melodic voice that plays the chord and scale:
kick -> bass, snare and clap -> keys, hats and shakers -> bells, toms -> marimba. The conga ring keeps its rhythm.
Run this after changing index.html:   python3 build_melodic.py
"""
import os, re
here = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(here, 'index.html'), encoding='utf8').read()

def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (s.count(a), a[:100])
    s = s.replace(a, b)

# --- names, links between the two pages
rep('<title>Rhythm Geometry</title>', '<title>Rhythm Geometry: Melodic</title>')
rep('<h1>Rhythm Geometry</h1>', '<h1>Rhythm Geometry <span class="altname">melodic</span></h1>', 2)
rep('<a class="altlink" href="melodic/" title="The version where every ring plays notes">Melodic version</a>', '<a class="altlink" href="../" title="The version with drums">Drum version</a>')
rep('  .wrap { padding:', '  .altname { font-size: .5em; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); margin-left: 8px; vertical-align: middle; }\n  .kithead .kitsel, .kithead label[for="kitSel"], #kitSel { display: none !important; }\n  .wrap { padding:')
rep('<p class="kit-credit">Drum sounds: the <a href="https://github.com/geikha/tidal-drum-machines" target="_blank" rel="noopener">Tidal drum machines</a> sample pack.</p>',
    '<p class="kit-credit">Every ring plays notes in the weather\'s scale: bass, keys, bells and marimba.</p>')

# --- the switch
rep("const REFRESH_MS = 10 * 60 * 1000;", "const REFRESH_MS = 10 * 60 * 1000;\nconst MELODIC = true;   // this page: every drum is a note")

# --- defaults: richer space, a pad underneath, the conga ring as marimba
rep("    delay: low ? 'off' : hat ? 'd8' : tom ? '8' : 'off', style: hat ? 'ping-pong' : 'mono', fb: 25,\n    dlvl: low ? 0 : hat ? 22 : tom ? 16 : 0,\n    rev: low ? 0 : skin ? 20 : hat ? 12 : 16, revDec: null };",
    "    delay: low ? 'off' : hat ? '8' : tom ? 'd8' : 'd8', style: hat ? 'ping-pong' : 'mono', fb: 32,\n    dlvl: low ? 0 : hat ? 32 : tom ? 26 : 24,\n    rev: low ? 8 : skin ? 30 : hat ? 38 : 28, revDec: null };")
rep("sound: 'stab', rhythm: 'ring', len: 25, bars: 2, hit: 0, rev: 0.3, del: 0.2,", "sound: 'glass', rhythm: 'held', len: 25, bars: 2, hit: 0, rev: 0.55, del: 0.2,") if "sound: 'stab', rhythm: 'ring', len: 25, bars: 2, hit: 0, rev: 0.3, del: 0.2," in s else None
m = re.search(r"const CHORD = \{[^}]*?\};?", s)
assert m, 'CHORD not found'
blk = m.group(0)
nb = blk.replace("sound: 'stab'", "sound: 'glass'").replace("rhythm: 'ring'", "rhythm: 'held'").replace("rev: 0.3", "rev: 0.55")
s = s.replace(blk, nb)
rep('<option value="stab" selected title="Two detuned saws, a bite at the front">Synth stab</option>', '<option value="stab" title="Two detuned saws, a bite at the front">Synth stab</option>')
rep('<option value="glass">Glass</option>', '<option value="glass" selected>Glass</option>')
rep('<input id="chordRev" type="range" min="0" max="100" value="30"', '<input id="chordRev" type="range" min="0" max="100" value="55"')
rep('<output id="chordRevOut">30</output>', '<output id="chordRevOut">55</output>')
# conga ring: marimba, with a little more room
s = re.sub(r'(<select id="congaInst"[^>]*>.*?</select>)', lambda m: m.group(1).replace(' selected', '').replace('<option value="marimba">', '<option value="marimba" selected>'), s, count=1, flags=re.S)
rep('<input id="congaRev" type="range" min="0" max="100" value="18"', '<input id="congaRev" type="range" min="0" max="100" value="30"')
rep('<output id="congaRevOut">18%</output>', '<output id="congaRevOut">30%</output>')

# --- no drum samples to load
rep("function wantedSamples() {\n  const want = new Set();", "function wantedSamples() {\n  const want = new Set();\n  if (MELODIC) return [];")

# --- the voices
voices = r'''// ---------- melodic voices: what the drum rings play on this page ----------
// Each ring keeps its rhythm but plays a note from the chord in the weather's scale.
//   bass: the chord root, low   keys: the chord's notes, round and soft   bell: a bright arpeggio   tom: a marimba on the chord
const ARP = { keys: 0, bell: 0, tom: 0 };
const mNote = (deg, oct) => { const k = chordKey(); return 48 + k.k + scaleSemis(deg) + 12 * (oct + k.oct); };
function roleOf(v) {
  if (/bass|kick|surdo_low|low_drum|^dum$|bass_drum/.test(v)) return 'bass';
  if (HAT_RE.test(v) || /cowbell|clave|bell|tamborim|^tak$|perc_high/.test(v)) return 'bell';
  if (SKIN_RE.test(v)) return 'keys';
  return 'tom';
}
function melodicHit(role, node, t, vel) {
  const r = chordRootAt(schedN), tu = tuneOf(node);
  const hz = midi => 440 * Math.pow(2, (midi - 69) / 12) * tu;
  if (role === 'bass' || role === 'bass2') {
    const f = hz(mNote(role === 'bass2' ? r + 4 : r, -1));
    tone(node, t, 'triangle', f, 0.6 * vel, 0.7, 800);
    tone(node, t, 'sine', f * 2, 0.1 * vel, 0.22, 1600);
    noiseBurst(node, t, 'lowpass', 600, 0.7, 0.02, 0.18 * vel);
  } else if (role === 'keys') {
    const f = hz(mNote(r + [2, 4, 0, 4][ARP.keys++ % 4], 0) + 12);
    tone(node, t, 'triangle', f, 0.3 * vel, 0.55, 3800);
    tone(node, t, 'sine', f * 2, 0.1 * vel, 0.4, 5200);
  } else if (role === 'bell') {
    const f = hz(mNote(r + [0, 2, 4, 7, 9, 7, 4, 2][ARP.bell++ % 8], 1) + 12);
    tone(node, t, 'sine', f, 0.17 * vel, 1.1, 9000);
    tone(node, t, 'sine', f * 2.76, 0.06 * vel, 0.5, 9000);
  } else {
    const f = hz(mNote(r + [4, 2, 0, 2, 7, 4][ARP.tom++ % 6], 1));
    tone(node, t, 'sine', f, 0.34 * vel, 0.42, 6000);
    tone(node, t, 'sine', f * 4, 0.07 * vel, 0.07, 9000);
  }
}
'''
rep("function kickHit(t, dest, vel = 1) {", voices + "function kickHit(t, dest, vel = 1) {\n  if (MELODIC) { melodicHit(dest ? 'bass2' : 'bass', dest || bus.kick, t, vel); return; }")
rep("function drumHit(v, t, out, velIn) {\n  if (SILENT.has(v)) return;", "function drumHit(v, t, out, velIn) {\n  if (SILENT.has(v)) return;\n  if (MELODIC) { melodicHit(roleOf(v), out || laneBus(v), t, velIn != null ? velIn : 0.85 + Math.random() * 0.3); return; }")
rep("function shakerHit(t, f) {\n  f = f || { vel: 0.8 + Math.random() * 0.4, rate: 1, cap: 1, len: 1 };", "function shakerHit(t, f) {\n  f = f || { vel: 0.8 + Math.random() * 0.4, rate: 1, cap: 1, len: 1 };\n  if (MELODIC) { melodicHit('bell', bus.shaker, t, f.vel * 0.8); return; }")

# --- the story says what is going on
rep("  if (room) lines.push(room);\n", "  if (room) lines.push(room);\n  lines.push('Every ring plays notes: the kick is the bass, the snare plays the chord, the hats are bells.');\n")

# --- chords on from the start
rep("renderLanes();\nmapLayout(); drawMapBase();", "renderLanes();\nif (!SHARED) $('chordOn').click();   // a pad under the rings from the start\nmapLayout(); drawMapBase();")

os.makedirs(os.path.join(here, 'melodic'), exist_ok=True)
open(os.path.join(here, 'melodic', 'index.html'), 'w', encoding='utf8').write(s)
print('built melodic/index.html', len(s))
