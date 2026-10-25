#!/usr/bin/env python3
"""Builds play2/index.html (the DJ-style conga and bongo page) from play2-src.html.
It reads the city and genre patterns from index.html so there is one source of truth.
Run after changing play2-src.html or the ATLAS in index.html:   python3 build_play2.py
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from genre_blurbs import blurb
here = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(here, 'index.html'), encoding='utf8').read()
i = s.index('const ATLAS = '); j = s.index('\n', i)
A = json.loads(s[i + len('const ATLAS = '):j].rstrip().rstrip(';'))
pats = {}
def bits(a): return ''.join('1' if x else '0' for x in a)
def pat(pid):
    k = A['kicks'].get(pid)
    if not k: return None
    n = k['steps']; arrs = [k['bd']]; names = ['kick']
    v = k.get('voices') or {}
    for name, a in v.items():
        if name == k.get('bdVoice') or name in ('kick', 'bass_drum'): continue
        if len(a) == n and sum(a) > 0 and a != k['bd']: arrs.append(a); names.append(name)
    if k.get('sh') and sum(k['sh']) > 0 and k['sh'] != k['bd'] and k['sh'] not in arrs: arrs.append(k['sh']); names.append(k.get('shVoice') or 'shaker')
    keep = [(a, nm) for a, nm in zip(arrs, names) if len(a) == n and sum(a) > 0][:3]
    if not keep: return None
    return {'p': [bits(a) for a, _ in keep], 'r': [nm for _, nm in keep]}
cities = []
for c in A['cities']:
    gs = []
    for g in c['genres']:
        ids = [x for x in g['ids'] if x in A['kicks']]
        if not ids: continue
        for x in ids:
            if x not in pats:
                p = pat(x)
                if p: pats[x] = p
        ids = [x for x in ids if x in pats]
        if ids: gs.append({'n': g['name'], 'b': g.get('bpm'), 'i': ids, 'd': blurb(g['name']), 's': g.get('src', '')})
    if gs: cities.append({'n': c['name'], 'c': c['country'], 'a': c['lat'], 'o': c['lon'], 'g': gs})

# ---------- kits ----------
# each drum: (name, file, tonal, level).  Files are checked against the drum machine pack when it is available.
M = lambda m, d, f: m + '/' + m.lower() + '-' + d + '/' + f
def L(rows): return [dict(n=n, f=f, t=int(t), v=v) for n, f, t, v in rows]
KITS = [
 dict(id='congas', name='Congas and bongos', lanes=L([
   ('conga low', 'LinnDrum/linndrum-perc/Conga L-01.wav', 1, 1), ('conga mid', 'LinnDrum/linndrum-perc/Conga M-01.wav', 1, 1),
   ('conga high', 'LinnDrum/linndrum-perc/Conga H-01.wav', 1, 1), ('conga slap', 'RolandMT32/rolandmt32-perc/Conga Muted H.wav', 1, 1),
   ('quinto', 'BossDR550/bossdr550-perc/Conga S.wav', 1, 1), ('bongo low', 'RolandTR727/rolandtr727-perc/Bongo L.wav', 1, 1),
   ('bongo high', 'RolandTR727/rolandtr727-perc/Bongo H.wav', 1, 1), ('bongo bright', 'BossDR660/bossdr660-perc/BongoH.wav', 1, 1)])),
 dict(id='latin', name='Latin percussion', lanes=L([
   ('timbale', 'RolandTR727/rolandtr727-perc/Timbale L.wav', 1, 1), ('agogo', 'RolandTR727/rolandtr727-perc/Agogo L.wav', 1, 1),
   ('cowbell', 'BossDR550/bossdr550-cb/Cowbell-02.wav', 1, 1), ('wood block', 'AlesisHR16/alesishr16-perc/Wood Block L.wav', 1, 1),
   ('guiro', 'BossDR660/bossdr660-perc/GuiroL.wav', 0, 1), ('clave', 'BossDR550/bossdr550-perc/Claves.wav', 1, 1),
   ('tambourine', 'LinnDrum/linndrum-tb/Tambourine.wav', 0, 0.8), ('triangle', 'AlesisHR16/alesishr16-perc/Triangle.wav', 1, 1)])),
 dict(id='samba', name='Samba bateria', lanes=L([
   ('surdo', 'RolandMC303/rolandmc303-perc/Opensurd.wav', 1, 1), ('surdo muted', 'RolandMC303/rolandmc303-perc/Mutesurd.wav', 1, 1),
   ('pandeiro', 'RolandMC303/rolandmc303-perc/Openpand.wav', 0, 1), ('pandeiro muted', 'RolandMC303/rolandmc303-perc/Mutepand.wav', 0, 1),
   ('agogo', 'RolandMC303/rolandmc303-perc/Loagogo.wav', 1, 1), ('cuica', 'RolandMC303/rolandmc303-misc/Opencuic.wav', 0, 1),
   ('guiro', 'RolandMC303/rolandmc303-perc/Shortgui.wav', 0, 0.9), ('whistle', 'RolandMC303/rolandmc303-perc/Shortwhi.wav', 0, 0.8)])),
 dict(id='westafrica', name='West Africa', lanes=L([
   ('udu', 'RolandMC303/rolandmc303-perc/Udo.wav', 1, 1), ('conga low', 'RolandMC303/rolandmc303-perc/Locongao.wav', 1, 1),
   ('conga high', 'RolandMC303/rolandmc303-perc/Hicongao.wav', 1, 1), ('slap', 'RolandMC303/rolandmc303-misc/Slap.wav', 0, 1),
   ('agogo', 'RolandMC303/rolandmc303-perc/Hiagogo.wav', 1, 1), ('claves', 'RolandMC303/rolandmc303-perc/Claves.wav', 1, 1),
   ('shaker', 'BossDR660/bossdr660-perc/Marcas.wav', 0, 0.9), ('bongo low', 'RolandMC303/rolandmc303-perc/Lobongoo.wav', 1, 1)])),
 dict(id='eastasia', name='East Asia', lanes=L([
   ('gong', 'RolandS50/rolands50-misc/Gong.wav', 1, 0.9), ('hyoshi low', 'RolandMC303/rolandmc303-perc/Lohyoshi.wav', 0, 1),
   ('hyoshi high', 'RolandMC303/rolandmc303-perc/Hihyoshi.wav', 0, 1), ('bamboo low', 'RolandMC303/rolandmc303-perc/Lobamboo.wav', 1, 1),
   ('bamboo high', 'RolandMC303/rolandmc303-perc/Hibamboo.wav', 1, 1), ('asian gong', 'RolandMC303/rolandmc303-misc/Asiangon.wav', 1, 0.7),
   ('wood block low', 'RolandMC303/rolandmc303-perc/Lowoodbl.wav', 1, 1), ('wood block high', 'RolandMC303/rolandmc303-perc/Hiwoodbl.wav', 1, 1)])),
 dict(id='gamelan', name='Gamelan and mallets', lanes=L([
   ('gamelan', 'RolandJD990/rolandjd990-misc/Gamelan.wav', 1, 1), ('kalimba', 'RolandJD990/rolandjd990-misc/Kalimba.wav', 1, 1),
   ('marimba', 'RolandJD990/rolandjd990-misc/Marimwav.wav', 1, 1), ('xylophone', 'RolandJD990/rolandjd990-misc/Xylo.wav', 1, 1),
   ('vibes', 'RolandJD990/rolandjd990-misc/Vibes.wav', 1, 1), ('digital bells', 'RolandJD990/rolandjd990-misc/Digibels.wav', 1, 0.9),
   ('crystal', 'RolandJD990/rolandjd990-misc/Crystal.wav', 1, 0.9), ('finger bell', 'RolandJD990/rolandjd990-misc/Fingbell.wav', 1, 0.9)])),
 dict(id='tabla', name='Tabla sketch', lanes=L([
   ('tabla bayan', 'RolandMC303/rolandmc303-perc/Tablabay.wav', 1, 1), ('bongo high', 'RolandMC303/rolandmc303-perc/Hibongoo.wav', 1, 1),
   ('pandeiro', 'RolandMC303/rolandmc303-perc/Openpand.wav', 0, 0.9), ('tambourine', 'RolandMC303/rolandmc303-tb/Tambouri.wav', 0, 0.8),
   ('udu', 'RolandMC303/rolandmc303-perc/Udo.wav', 1, 1), ('finger snap', 'RolandMC303/rolandmc303-perc/Fingersn.wav', 0, 1),
   ('triangle', 'RolandMC303/rolandmc303-perc/Opentria.wav', 1, 0.8), ('shaker', 'BossDR660/bossdr660-perc/Marcas.wav', 0, 0.9)])),
 dict(id='808', name='TR-808', lanes=L([
   ('kick', M('RolandTR808', 'bd', 'BD0050.WAV'), 1, 1), ('low tom', M('RolandTR808', 'lt', 'LT50.WAV'), 1, 1),
   ('snare', M('RolandTR808', 'sd', 'SD0050.WAV'), 0, 1), ('mid tom', M('RolandTR808', 'mt', 'MT50.WAV'), 1, 1),
   ('clap', M('RolandTR808', 'cp', 'cp1.wav'), 0, 1), ('cowbell', M('RolandTR808', 'cb', 'Cowbell.wav'), 1, 1),
   ('hat', M('RolandTR808', 'hh', 'CH.WAV'), 0, 0.7), ('open hat', M('RolandTR808', 'oh', 'OH50.WAV'), 0, 0.7)])),
 dict(id='909', name='TR-909', lanes=L([
   ('kick', M('RolandTR909', 'bd', 'Bassdrum-01.wav'), 1, 1), ('low tom', M('RolandTR909', 'lt', 'Tom L.wav'), 1, 1),
   ('snare', M('RolandTR909', 'sd', 'sd01.wav'), 0, 1), ('mid tom', M('RolandTR909', 'mt', 'Tom M.wav'), 1, 1),
   ('clap', M('RolandTR909', 'cp', 'Clap.wav'), 0, 1), ('rim', M('RolandTR909', 'rim', 'Rimhot.wav'), 0, 1),
   ('hat', M('RolandTR909', 'hh', 'hh01.wav'), 0, 0.7), ('open hat', M('RolandTR909', 'oh', 'Hat Open.wav'), 0, 0.7)])),
 dict(id='linn', name='LinnDrum', lanes=L([
   ('kick', M('LinnDrum', 'bd', 'Bassdrum.wav'), 1, 1), ('low tom', M('LinnDrum', 'lt', 'Tom L-01.wav'), 1, 1),
   ('snare', M('LinnDrum', 'sd', '0Snarderum-01.wav'), 0, 1), ('high tom', M('LinnDrum', 'ht', 'Tom H-01.wav'), 1, 1),
   ('clap', M('LinnDrum', 'cp', 'Clap.wav'), 0, 1), ('cowbell', M('LinnDrum', 'cb', 'Cowbell.wav'), 1, 1),
   ('hat', M('LinnDrum', 'hh', 'Hat Closed-01.wav'), 0, 0.7), ('tambourine', M('LinnDrum', 'tb', 'Tambourine.wav'), 0, 0.8)])),
 dict(id='cr78', name='CR-78 (1978)', lanes=L([
   ('kick', M('RolandCompurhythm78', 'bd', 'Bassdrum.wav'), 1, 1), ('conga low', M('RolandCompurhythm78', 'perc', 'Conga L.wav'), 1, 1),
   ('snare', M('RolandCompurhythm78', 'sd', 'Snaredrum.wav'), 0, 1), ('conga mid', M('RolandCompurhythm78', 'perc', 'Conga M.wav'), 1, 1),
   ('wood block', M('RolandCompurhythm78', 'perc', 'Woodblock-01.wav'), 1, 1), ('cowbell', M('RolandCompurhythm78', 'cb', 'Cowbell.wav'), 1, 1),
   ('hat', M('RolandCompurhythm78', 'hh', 'Hat Closed-01.wav'), 0, 0.7), ('tambourine', M('RolandCompurhythm78', 'tb', 'Tambourine.wav'), 0, 0.8)])),
 dict(id='simmons', name='Simmons toms', lanes=L([
   ('kick', M('SimmonsSDS5', 'bd', 'Bassdrum-01.wav'), 1, 1), ('low tom', M('SimmonsSDS5', 'lt', 'Tom-07.wav'), 1, 1),
   ('snare', M('SimmonsSDS5', 'sd', 'Snaredrum-01.wav'), 0, 1), ('mid tom', M('SimmonsSDS5', 'mt', 'Tom-02.wav'), 1, 1),
   ('rim', M('SimmonsSDS5', 'rim', 'Rimshot-01.wav'), 0, 1), ('high tom', M('SimmonsSDS5', 'ht', 'Tom-01.wav'), 1, 1),
   ('hat', M('SimmonsSDS5', 'hh', 'Hat Closed-01.wav'), 0, 0.7), ('open hat', M('SimmonsSDS5', 'oh', 'Hat Open-01.wav'), 0, 0.7)])),
 dict(id='dmx', name='Oberheim DMX', lanes=L([
   ('kick', M('OberheimDMX', 'bd', 'Bassdrum-01.wav'), 1, 1), ('low tom', M('OberheimDMX', 'lt', 'Tom L.wav'), 1, 1),
   ('snare', M('OberheimDMX', 'sd', 'Snaredrum-01.wav'), 0, 1), ('mid tom', M('OberheimDMX', 'mt', 'Tom M.wav'), 1, 1),
   ('clap', M('OberheimDMX', 'cp', 'Clap.wav'), 0, 1), ('high tom', M('OberheimDMX', 'ht', 'Tom H.wav'), 1, 1),
   ('hat', M('OberheimDMX', 'hh', 'Hat Closed.wav'), 0, 0.7), ('open hat', M('OberheimDMX', 'oh', 'Hat Open.wav'), 0, 0.7)])),
 # no recordings at all: tiny synth blips, clicks and glitches, very short
 dict(id='glitch', name='Glitch and blips', lanes=[
   dict(n='sub pop', syn='sub', m=36, t=1, v=1), dict(n='pop', syn='pop', m=48, t=1, v=1),
   dict(n='bleep', syn='bleep', m=69, t=1, v=1), dict(n='blip', syn='blip', m=81, t=1, v=1),
   dict(n='zap', syn='zap', m=60, t=0, v=1), dict(n='click', syn='click', m=60, t=0, v=1),
   dict(n='tick', syn='tick', m=60, t=0, v=1), dict(n='glitch', syn='glitch', m=60, t=0, v=1)]),

 # melodic kits: eight notes of one instrument, each ring plays its own note of the key
  dict(id='kalimba', name='Kalimba', lanes=[dict(n='note 1', syn='kalimba', m=60, t=1, v=1), dict(n='note 2', syn='kalimba', m=62, t=1, v=1), dict(n='note 3', syn='kalimba', m=64, t=1, v=1), dict(n='note 4', syn='kalimba', m=65, t=1, v=1), dict(n='note 5', syn='kalimba', m=67, t=1, v=1), dict(n='note 6', syn='kalimba', m=69, t=1, v=1), dict(n='note 7', syn='kalimba', m=71, t=1, v=1), dict(n='note 8', syn='kalimba', m=72, t=1, v=1)]),
  dict(id='harp', name='Harp pluck', lanes=[dict(n='note 1', syn='harp', m=60, t=1, v=1), dict(n='note 2', syn='harp', m=62, t=1, v=1), dict(n='note 3', syn='harp', m=64, t=1, v=1), dict(n='note 4', syn='harp', m=65, t=1, v=1), dict(n='note 5', syn='harp', m=67, t=1, v=1), dict(n='note 6', syn='harp', m=69, t=1, v=1), dict(n='note 7', syn='harp', m=71, t=1, v=1), dict(n='note 8', syn='harp', m=72, t=1, v=1)]),
  dict(id='rhodes', name='Electric piano', lanes=[dict(n='note 1', syn='rhodes', m=60, t=1, v=1), dict(n='note 2', syn='rhodes', m=62, t=1, v=1), dict(n='note 3', syn='rhodes', m=64, t=1, v=1), dict(n='note 4', syn='rhodes', m=65, t=1, v=1), dict(n='note 5', syn='rhodes', m=67, t=1, v=1), dict(n='note 6', syn='rhodes', m=69, t=1, v=1), dict(n='note 7', syn='rhodes', m=71, t=1, v=1), dict(n='note 8', syn='rhodes', m=72, t=1, v=1)]),
  dict(id='steel', name='Steel pan', lanes=[dict(n='note 1', syn='steel', m=60, t=1, v=1), dict(n='note 2', syn='steel', m=62, t=1, v=1), dict(n='note 3', syn='steel', m=64, t=1, v=1), dict(n='note 4', syn='steel', m=65, t=1, v=1), dict(n='note 5', syn='steel', m=67, t=1, v=1), dict(n='note 6', syn='steel', m=69, t=1, v=1), dict(n='note 7', syn='steel', m=71, t=1, v=1), dict(n='note 8', syn='steel', m=72, t=1, v=1)]),
]
# check every file exists in the drum pack, if a copy is on this machine
PACK = os.environ.get('TDM_PACK', '/home/claude/geikha/tidal-drum-machines/machines/')
if os.path.isdir(PACK):
    for k in KITS:
        for d in k['lanes']:
            if 'f' in d and not os.path.exists(PACK + d['f']): raise SystemExit('missing sample: ' + d['f'])

data = json.dumps({'cities': cities, 'patterns': pats}, separators=(',', ':'))
out = open(os.path.join(here, 'play2-src.html'), encoding='utf8').read().replace('__ATLAS__', data).replace('__LAND__', re.search(r'const WMAP_LAND = "([^"]+)"', s).group(1)).replace('__KITS__', json.dumps(KITS, separators=(',', ':')))
os.makedirs(os.path.join(here, 'play2'), exist_ok=True)
open(os.path.join(here, 'play2', 'index.html'), 'w', encoding='utf8').write(out)
print('built play2/index.html', len(out), 'cities', len(cities), 'patterns', len(pats))
