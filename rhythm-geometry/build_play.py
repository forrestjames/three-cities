#!/usr/bin/env python3
"""Builds play/index.html (the DJ-style conga and bongo page) from play-src.html.
It reads the city and genre patterns from index.html so there is one source of truth.
Run after changing play-src.html or the ATLAS in index.html:   python3 build_play.py
"""
import json, os
here = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(here, 'index.html'), encoding='utf8').read()
i = s.index('const ATLAS = '); j = s.index('\n', i)
A = json.loads(s[i + len('const ATLAS = '):j].rstrip().rstrip(';'))
pats = {}
def bits(a): return ''.join('1' if x else '0' for x in a)
def pat(pid):
    k = A['kicks'].get(pid)
    if not k: return None
    n = k['steps']; arrs = [k['bd']]
    v = k.get('voices') or {}
    for name, a in v.items():
        if name == k.get('bdVoice') or name in ('kick', 'bass_drum'): continue
        if len(a) == n and sum(a) > 0 and a != k['bd']: arrs.append(a)
    if k.get('sh') and sum(k['sh']) > 0 and k['sh'] != k['bd'] and k['sh'] not in arrs: arrs.append(k['sh'])
    arrs = [a for a in arrs if len(a) == n and sum(a) > 0][:3]
    if not arrs: return None
    return {'p': [bits(a) for a in arrs]}
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
        if ids: gs.append({'n': g['name'], 'b': g.get('bpm'), 'i': ids})
    if gs: cities.append({'n': c['name'], 'a': c['lat'], 'o': c['lon'], 'g': gs})
data = json.dumps({'cities': cities, 'patterns': pats}, separators=(',', ':'))
out = open(os.path.join(here, 'play-src.html'), encoding='utf8').read().replace('__ATLAS__', data)
os.makedirs(os.path.join(here, 'play'), exist_ok=True)
open(os.path.join(here, 'play', 'index.html'), 'w', encoding='utf8').write(out)
print('built play/index.html', len(out), 'cities', len(cities), 'patterns', len(pats))
