#!/usr/bin/env python3
"""Builds live/data.js, the city and genre patterns for the performance pages (Pad and Slice).
It reads them from index.html so there is one source of truth.
Run after changing the ATLAS in index.html:   python3 build_live.py
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
        for x in ids:
            if x not in pats:
                p = pat(x)
                if p: pats[x] = p
        ids = [x for x in ids if x in pats]
        if ids: gs.append({'n': g['name'], 'b': g.get('bpm'), 'i': ids})
    if gs: cities.append({'n': c['name'], 'c': c['country'], 'a': c['lat'], 'o': c['lon'], 'g': gs})
out = 'window.RG_DATA=' + json.dumps({'cities': cities, 'patterns': pats}, separators=(',', ':')) + ';\n'
open(os.path.join(here, 'live', 'data.js'), 'w', encoding='utf8').write(out)
print('built live/data.js', len(out), 'cities', len(cities), 'patterns', len(pats))
