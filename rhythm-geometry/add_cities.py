#!/usr/bin/env python3
"""Adds the 'round 2' cities (India, West Africa, North and East Africa, Indonesia) to the ATLAS line in index.html.
Safe to run twice: cities and patterns that already exist are skipped.  Patterns are written from memory and marked
'approximate' or 'from memory' like the rest of the Atlas.  They are starting points for a person who knows the music to correct.
Run, then rebuild the pages:   python3 add_cities.py && python3 build_play2.py
"""
import json, os
here = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(here, 'index.html')
s = open(path, encoding='utf8').read()
i = s.index('const ATLAS = '); j = s.index('\n', i)
A = json.loads(s[i + len('const ATLAS = '):j].rstrip().rstrip(';'))

def pat(name, steps, bd, sh, bpm, src, conf='approximate', **voices):
    b = lambda xs: [1 if k in xs else 0 for k in range(steps)]
    d = dict(name=name, steps=steps, bd=b(bd), sh=b(sh), bpm=bpm, src=src, conf=conf)
    if voices: d['voices'] = {k: b(v) for k, v in voices.items()}
    return d

FM = 'From memory. Pattern approximate. Needs a check by someone who knows the music'
K = {
 'x-teental': pat('Teental theka, 16 beats', 16, [0, 4, 12], [0, 1, 2, 3, 4, 5, 6, 7, 13, 14, 15], 100, 'Hindustani tala Teental: claps on 1, 5 and 13, a wave on 9. Bass drum (bayan) marked on the beats that use it. ' + FM),
 'x-dadra': pat('Dadra, 6 beats', 6, [0, 3], [0, 1, 2], 120, 'Hindustani tala Dadra, 3 + 3, light classical and film song. ' + FM),
 'x-keherwa': pat('Keherwa, 8 beats', 8, [0, 4], [0, 1, 5, 6], 130, 'Hindustani tala Keherwa (dha ge na ti na ka dhi na), the most common folk and film rhythm. ' + FM),
 'x-adi-talam': pat('Adi talam, 8 beats', 8, [0, 4, 6], [1, 2, 3, 5, 7], 100, 'Carnatic Adi talam: a clap and three finger counts, then two claps with waves (4 + 2 + 2). ' + FM),
 'x-misra-chapu': pat('Misra chapu, 7 beats', 7, [0, 3, 5], [1, 2, 4, 6], 120, 'Carnatic Misra chapu, counted 3 + 2 + 2. ' + FM),
 'x-qawwali-clap': pat('Qawwali clap and dholak, 8', 8, [0, 2, 4, 6], [3, 7], 125, 'Sufi qawwali: hand claps drive the song, the dholak plays Keherwa-type patterns underneath. ' + FM),
 'x-bell12-sabar': pat('West African 12-pulse bell, Wolof style', 12, [0, 3, 6, 9], [0, 2, 4, 5, 7, 9, 11], 118, 'The 12-pulse bell family found across West Africa (see Toussaint 2005). Dakar sabar usage is approximate. ' + FM),
 'x-djembe-kassa': pat('Mande djembe, 12-pulse', 12, [0, 6], [0, 2, 3, 5, 6, 8, 9, 11], 120, 'Mande djembe ensemble feel: dunun on a slow cycle, djembe filling the 12 pulses. ' + FM),
 'x-coupe-decale': pat('Coupé-décalé, 16', 16, [0, 4, 8, 12], [2, 5, 10, 13], 128, 'Ivorian dance music of the 2000s: a steady kick under a skipping, syncopated pattern. ' + FM),
 'x-eskista': pat('Ethiopian eskista, 6/8', 6, [0, 3], [0, 2, 3, 5], 110, 'Amhara eskista and ethio-jazz in a compound six. ' + FM),
 'x-gnawa-12': pat('Gnawa, 12-pulse', 12, [0, 3, 6, 9], [0, 1, 3, 4, 6, 7, 9, 10], 110, 'Moroccan Gnawa: the qraqeb (iron castanets) roll in a triplet feel over a heavy guembri bass. ' + FM),
 'x-lancaran': pat('Gamelan lancaran, 16', 16, [3, 7, 11, 15], [0, 2, 4, 6, 8, 10, 12, 14], 95, 'Javanese gamelan, lancaran form. Kenong (bd) on every fourth beat, kempul between them, gong on beat 16, kethuk on the off-beats. ' + FM, kempul=[1, 5, 9, 13]),
 'x-kecak': pat('Balinese kecak interlock, 16', 16, [0, 3, 4, 6, 8, 11, 12, 14], [1, 2, 5, 7, 9, 10, 13, 15], 140, 'The kecak chant: two groups of voices interlock so that together they make one continuous pulse (kotekan). ' + FM),
}
C = [
 ('delhi', 'Delhi', 'IN', 28.6139, 77.209, [('Hindustani teental', ['x-teental'], 100), ('Qawwali', ['x-qawwali-clap'], 125), ('bhangra', ['pop-pop-1-a', 'pop-in-the-air-last-night-a'], 120)]),
 ('kolkata', 'Kolkata', 'IN', 22.5726, 88.3639, [('Dadra (light classical)', ['x-dadra'], 120), ('Hindustani teental', ['x-teental'], 100)]),
 ('chennai', 'Chennai', 'IN', 13.0827, 80.2707, [('Carnatic Adi talam', ['x-adi-talam'], 100), ('Carnatic Misra chapu', ['x-misra-chapu'], 120)]),
 ('jaipur', 'Jaipur', 'IN', 26.9124, 75.7873, [('Rajasthani folk (dholak)', ['x-keherwa'], 130), ('Hindustani teental', ['x-teental'], 100)]),
 ('lahore', 'Lahore', 'PK', 31.5204, 74.3587, [('Qawwali', ['x-qawwali-clap'], 125), ('bhangra', ['pop-pop-1-a', 'pop-in-the-air-last-night-a'], 120)]),
 ('dakar', 'Dakar', 'SN', 14.7167, -17.4677, [('Sabar and mbalax', ['x-bell12-sabar'], 118), ('afrobeat', ['funk-and-soul-expensive-shit'], 108)]),
 ('bamako', 'Bamako', 'ML', 12.6392, -8.0029, [('Mande djembe', ['x-djembe-kassa'], 120), ('Sabar and mbalax', ['x-bell12-sabar'], 118)]),
 ('abidjan', 'Abidjan', 'CI', 5.36, -4.0083, [('Coupé-décalé', ['x-coupe-decale'], 128), ('afrobeat', ['funk-and-soul-expensive-shit'], 108)]),
 ('addis-ababa', 'Addis Ababa', 'ET', 9.03, 38.74, [('Eskista and ethio-jazz', ['x-eskista'], 110)]),
 ('marrakech', 'Marrakech', 'MA', 31.6295, -7.9811, [('Gnawa', ['x-gnawa-12'], 110), ('arab rhythms', ['eu-york-samai-5-6', 'eu-agsag-samai-5-9', 'eu-nawakhat-5-7'], 100)]),
 ('yogyakarta', 'Yogyakarta', 'ID', -7.7956, 110.3695, [('Javanese gamelan (lancaran)', ['x-lancaran'], 95)]),
 ('denpasar', 'Denpasar', 'ID', -8.6705, 115.2126, [('Balinese kecak', ['x-kecak'], 140), ('Javanese gamelan (lancaran)', ['x-lancaran'], 95)]),
]
added_k = added_c = 0
for k, v in K.items():
    if k not in A['kicks']: A['kicks'][k] = v; added_k += 1
have = {c['id'] for c in A['cities']}
for cid, name, cc, lat, lon, gs in C:
    if cid in have: continue
    genres = [dict(name=n, ids=ids, bpm=b, conf='approximate' if ids[0].startswith('x-') else 'from memory',
                   src=(K[ids[0]]['src'] if ids[0].startswith('x-') else 'Existing pattern reused. Approximate')) for n, ids, b in gs]
    A['cities'].append(dict(id=cid, name=name, country=cc, lat=lat, lon=lon, note='Round 2 (Oct 2026). From memory. Not checked', genres=genres)); added_c += 1
line = 'const ATLAS = ' + json.dumps(A, ensure_ascii=False, separators=(',', ':')) + ';'
open(path, 'w', encoding='utf8').write(s[:i] + line + s[j:])
print('added', added_c, 'cities and', added_k, 'patterns; now', len(A['cities']), 'cities')
