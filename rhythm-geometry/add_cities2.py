#!/usr/bin/env python3
"""Round 3 of Atlas coverage: patterns that come from a written source, with the source on every line.
  * 16 Arabic iqa'at (dum/tak notation) from rythm.organology.net/rhythms
  * Turkish usul from chromatone.center/theory/rhythm/system/turkish
  * Korean gutgeori janggu syllables from the Jangdan article (National Gugak Center), mapped onto its 12 pulses
  * Baiao from soundbrenner.com/blogs/articles/baiao
Safe to run twice.   python3 add_cities2.py && python3 build_play2.py
"""
import json, os
here = os.path.dirname(os.path.abspath(__file__)); path = os.path.join(here, 'index.html')
s = open(path, encoding='utf8').read(); i = s.index('const ATLAS = '); j = s.index('\n', i)
A = json.loads(s[i + len('const ATLAS = '):j].rstrip().rstrip(';'))

def grid(txt, hi, lo):
    sl = [t for t in txt.replace('|', ' ').split()]
    return len(sl), [1 if t in hi else 0 for t in sl], [1 if t in lo else 0 for t in sl]
ORG = 'rythm.organology.net/rhythms (dum = D, tak = T, ka = k). One symbol is an eighth note'
def iqa(key, name, meter, txt, bpm):
    n, bd, sh = grid(txt, 'D', 'Tk')
    return key, dict(name=name + ', ' + meter, steps=n, bd=bd, sh=sh, bpm=bpm, src='Pattern: ' + ORG + '. Which city plays it is general knowledge', conf='sourced')
K = dict([
 iqa('x-iqa-baladi', 'Baladi', '4/4', 'D D – T D – T –', 100), iqa('x-iqa-saidi', 'Saidi', '4/4', 'D T – D D – T –', 100),
 iqa('x-iqa-malfuf', 'Malfuf', '2/4', 'D – – T – – T –', 120), iqa('x-iqa-wahda', 'Wahda', '4/4', 'D – – T – – T –', 80),
 iqa('x-iqa-masmudi-s', 'Masmudi saghir', '4/4', 'D – D – T k T – D – – – T – – –', 90), iqa('x-iqa-zaffa', 'Zaffa', '4/4', 'D – T k T – T – D – T – T – – –', 100),
 iqa('x-iqa-maqsum', 'Maqsum', '4/4', 'D T – T D – T –', 100), iqa('x-iqa-ayyub', 'Ayyub', '2/4', 'D – D T', 110),
])
def usul(key, name, txt, bpm):
    n = len(txt); bd = [1 if c == 'X' else 0 for c in txt]; sh = [1 if c == 'x' else 0 for c in txt]
    return key, dict(name='Usul ' + name + ', ' + str(n), steps=n, bd=bd, sh=sh, bpm=bpm, src='Pattern: chromatone.center/theory/rhythm/system/turkish (X = düm, x = tek). Which city plays it is general knowledge', conf='sourced')
K.update(dict([usul('x-usul-aksak', 'Aksak', 'X.x.x.x..', 110), usul('x-usul-aksak-semai', 'Aksak Semai', 'X.x.x.x.x.', 110), usul('x-usul-devr-i-hindi', 'Devr-i Hindi', 'X...x..', 100)]))
# gutgeori: 덩기덕 쿵 더러러러 쿵기덕 쿵 더러러러 on 12 pulses. The kung/deong strokes (low) fall on pulses 1, 4, 7, 10 and the rest fill between.
K['x-gutgeori'] = dict(name='Gutgeori janggu, 12 pulses', steps=12, bd=[1,0,0,1,0,0,1,0,0,1,0,0], sh=[1,1,1,0,1,1,1,1,1,0,1,1], bpm=100,
    src='Syllables from the Jangdan article (National Gugak Center): 덩기덕 쿵 더러러러 쿵기덕 쿵 더러러러, 12 pulses. Mapping the syllables onto pulses is my reading, so approximate', conf='approximate')
K['x-baiao'] = dict(name='Baião, zabumba and triangle', steps=8, bd=[1,0,0,0,1,0,0,0], sh=[1,0,0,1,0,0,1,0], voices={'dry': [0,0,0,1,0,0,0,0]}, bpm=100,
    src='soundbrenner.com/blogs/articles/baiao: zabumba low on 1 and 5 with a dry hit before the second, a 3+3+2 accent shape over a steady sixteenth triangle. The article says it is not a fixed clave', conf='approximate')

def G(name, ids, bpm): return dict(name=name, ids=ids, bpm=bpm, conf=K[ids[0]]['conf'], src=K[ids[0]]['src'])
ADD = {   # city id -> genres to add
 'cairo': [G('Baladi iqa', ['x-iqa-baladi'], 100), G('Masmoudi saghir iqa', ['x-iqa-masmudi-s'], 90), G('Zaffa (wedding procession)', ['x-iqa-zaffa'], 100)],
 'beirut': [G('Wahda iqa', ['x-iqa-wahda'], 80), G('Malfuf iqa', ['x-iqa-malfuf'], 120), G('Zaffa (wedding procession)', ['x-iqa-zaffa'], 100)],
 'istanbul': [G('Usul Aksak Semai', ['x-usul-aksak-semai'], 110), G('Usul Devr-i Hindi', ['x-usul-devr-i-hindi'], 100)],
 'izmir': [G('Usul Aksak', ['x-usul-aksak'], 110)],
 'seoul': [G('Gutgeori (samulnori)', ['x-gutgeori'], 100)],
}
NEW = [('damascus', 'Damascus', 'SY', 33.5138, 36.2765, [G('Maqsum iqa', ['x-iqa-maqsum'], 100), G('Malfuf iqa', ['x-iqa-malfuf'], 120), G('Zaffa (wedding procession)', ['x-iqa-zaffa'], 100)]),
       ('luxor', 'Luxor', 'EG', 25.6872, 32.6396, [G('Saidi iqa', ['x-iqa-saidi'], 100), G('Ayyub iqa', ['x-iqa-ayyub'], 110)]),
       ('alexandria', 'Alexandria', 'EG', 31.2001, 29.9187, [G('Baladi iqa', ['x-iqa-baladi'], 100), G('Maqsum iqa', ['x-iqa-maqsum'], 100)]),
       ('jeonju', 'Jeonju', 'KR', 35.8242, 127.148, [G('Gutgeori (samulnori)', ['x-gutgeori'], 100)]),
       ('recife', 'Recife', 'BR', -8.0476, -34.877, [G('Baião', ['x-baiao'], 100)]),
       ('fortaleza', 'Fortaleza', 'BR', -3.7319, -38.5267, [G('Baião', ['x-baiao'], 100)])]
nk = nc = ng = 0
for k, v in K.items():
    if k not in A['kicks']: A['kicks'][k] = v; nk += 1
byid = {c['id']: c for c in A['cities']}
for cid, gs in ADD.items():
    c = byid[cid]; have = {g['name'] for g in c['genres']}
    for g in gs:
        if g['name'] not in have: c['genres'].append(g); ng += 1
for cid, name, cc, lat, lon, gs in NEW:
    if cid in byid: continue
    A['cities'].append(dict(id=cid, name=name, country=cc, lat=lat, lon=lon, note='Round 3 (Oct 2026). Patterns from a written source, place from general knowledge', genres=gs)); nc += 1
open(path, 'w', encoding='utf8').write(s[:i] + 'const ATLAS = ' + json.dumps(A, ensure_ascii=False, separators=(',', ':')) + ';' + s[j:])
print('added', nc, 'cities,', ng, 'genres to existing cities,', nk, 'patterns; now', len(A['cities']), 'cities')
