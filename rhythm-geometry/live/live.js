/* Rhythm Geometry, the performance pages: Pad and Slice.
   One engine, two playing surfaces. <body data-surface="pad"> or "slice" picks which one is on screen.

   The idea: every effect works on the rhythm itself, not just on the sound. Repeats, slices, scatter, shift and
   pitch all change which hits play and when, so everything you do with your hands goes out over MIDI as notes,
   and the TR-8S, a sampler or a synth plays the same performance. Filter and echo also go out as controllers.

   Rings: the first three are the city's genre rhythm. The other five are Euclidean rings whose step counts come
   from the live weather, the same way the Play pages do it. */
(function () {
  'use strict';
  const D = window.RG_DATA, SURFACE = document.body.dataset.surface || 'pad';
  const $ = id => document.getElementById(id);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), mod = (a, n) => ((a % n) + n) % n;
  const COLORS = ['#e8744a', '#f2b84b', '#7bc6a4', '#5aa9e6', '#c58ad8', '#e86a92', '#9bd35a', '#f0e0c8'];
  const TDM = 'https://raw.githubusercontent.com/geikha/tidal-drum-machines/6577395a4d05031728ced2ec3e5637fa89d8be48/machines/';
  const M = (m, d, f) => m + '/' + m.toLowerCase() + '-' + d + '/' + f;
  // drum machines list their voices in this order: kick, snare, hat, clap, low tom, bell, open hat, mid tom
  const KITS = [
    { id: '808', name: 'TR-808', v: [['kick', M('RolandTR808', 'bd', 'BD0050.WAV')], ['snare', M('RolandTR808', 'sd', 'SD0050.WAV')], ['hat', M('RolandTR808', 'hh', 'CH.WAV'), 0.7], ['clap', M('RolandTR808', 'cp', 'cp1.wav')], ['low tom', M('RolandTR808', 'lt', 'LT50.WAV')], ['cowbell', M('RolandTR808', 'cb', 'Cowbell.wav'), 0.8], ['open hat', M('RolandTR808', 'oh', 'OH50.WAV'), 0.7], ['mid tom', M('RolandTR808', 'mt', 'MT50.WAV')]] },
    { id: '909', name: 'TR-909', v: [['kick', M('RolandTR909', 'bd', 'Bassdrum-01.wav')], ['snare', M('RolandTR909', 'sd', 'sd01.wav')], ['hat', M('RolandTR909', 'hh', 'hh01.wav'), 0.7], ['clap', M('RolandTR909', 'cp', 'Clap.wav')], ['low tom', M('RolandTR909', 'lt', 'Tom L.wav')], ['rim', M('RolandTR909', 'rim', 'Rimhot.wav')], ['open hat', M('RolandTR909', 'oh', 'Hat Open.wav'), 0.7], ['mid tom', M('RolandTR909', 'mt', 'Tom M.wav')]] },
    { id: 'linn', name: 'LinnDrum', v: [['kick', M('LinnDrum', 'bd', 'Bassdrum.wav')], ['snare', M('LinnDrum', 'sd', '0Snarderum-01.wav')], ['hat', M('LinnDrum', 'hh', 'Hat Closed-01.wav'), 0.7], ['clap', M('LinnDrum', 'cp', 'Clap.wav')], ['low tom', M('LinnDrum', 'lt', 'Tom L-01.wav')], ['cowbell', M('LinnDrum', 'cb', 'Cowbell.wav'), 0.8], ['tambourine', M('LinnDrum', 'tb', 'Tambourine.wav'), 0.8], ['high tom', M('LinnDrum', 'ht', 'Tom H-01.wav')]] },
    { id: 'cr78', name: 'CR-78', v: [['kick', M('RolandCompurhythm78', 'bd', 'Bassdrum.wav')], ['snare', M('RolandCompurhythm78', 'sd', 'Snaredrum.wav')], ['hat', M('RolandCompurhythm78', 'hh', 'Hat Closed-01.wav'), 0.7], ['wood block', M('RolandCompurhythm78', 'perc', 'Woodblock-01.wav')], ['conga low', M('RolandCompurhythm78', 'perc', 'Conga L.wav')], ['cowbell', M('RolandCompurhythm78', 'cb', 'Cowbell.wav'), 0.8], ['tambourine', M('RolandCompurhythm78', 'tb', 'Tambourine.wav'), 0.8], ['conga mid', M('RolandCompurhythm78', 'perc', 'Conga M.wav')]] },
    { id: 'congas', name: 'Congas and bongos', perc: 1, v: [['conga low', 'LinnDrum/linndrum-perc/Conga L-01.wav'], ['conga mid', 'LinnDrum/linndrum-perc/Conga M-01.wav'], ['conga high', 'LinnDrum/linndrum-perc/Conga H-01.wav'], ['conga slap', 'RolandMT32/rolandmt32-perc/Conga Muted H.wav'], ['quinto', 'BossDR550/bossdr550-perc/Conga S.wav'], ['bongo low', 'RolandTR727/rolandtr727-perc/Bongo L.wav'], ['bongo high', 'RolandTR727/rolandtr727-perc/Bongo H.wav'], ['bongo bright', 'BossDR660/bossdr660-perc/BongoH.wav']] },
    { id: 'latin', name: 'Latin percussion', perc: 1, v: [['timbale', 'RolandTR727/rolandtr727-perc/Timbale L.wav'], ['agogo', 'RolandTR727/rolandtr727-perc/Agogo L.wav'], ['cowbell', 'BossDR550/bossdr550-cb/Cowbell-02.wav'], ['wood block', 'AlesisHR16/alesishr16-perc/Wood Block L.wav'], ['guiro', 'BossDR660/bossdr660-perc/GuiroL.wav'], ['clave', 'BossDR550/bossdr550-perc/Claves.wav'], ['tambourine', 'LinnDrum/linndrum-tb/Tambourine.wav', 0.8], ['triangle', 'AlesisHR16/alesishr16-perc/Triangle.wav']] }
  ];
  const MODES = { lydian: [0, 2, 4, 6, 7, 9, 11], major: [0, 2, 4, 5, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10], dorian: [0, 2, 3, 5, 7, 9, 10], minor: [0, 2, 3, 5, 7, 8, 10], phrygian: [0, 1, 3, 5, 7, 8, 10] };
  const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const PROG = [0, 5, 3, 4];                       // the chord moves every two bars, as scale degrees
  const LDEG = [0, 0, 2, 4, 7, 6, 8, 11];          // notes mode: ring one is the bass, the others stack a chord and its colours

  /* ---------- state ---------- */
  let saved = {}; try { saved = JSON.parse(localStorage.getItem('rg-live') || '{}'); } catch (e) {}
  const keep = () => { try { localStorage.setItem('rg-live', JSON.stringify({ city: ST.city, bpm: ST.follow ? null : ST.bpm, kit: ST.kit, mode: ST.mode })); } catch (e) {} };
  const cityByName = n => D.cities.findIndex(c => c.n === n);
  const ST = { city: saved.city != null && D.cities[saved.city] ? saved.city : Math.max(0, cityByName('London')), genre: 0, kit: saved.kit || '808', bpm: saved.bpm || 120, mode: saved.mode === 'notes' ? 'notes' : 'drums', follow: !saved.bpm, playing: false };
  let WX = { temp: 11, wind: 14, hum: 70, cloud: 60, pres: 1010, rain: 0, live: false };
  let ROOT = 0, MODE = 'dorian', pattern = null;
  // what the hands are doing to the rhythm right now
  const FX = { repeat: null, held: [], heldTk0: 0, sliceLen: 2, order: [0, 1, 2, 3, 4, 5, 6, 7], reverse: false, scatter: 0, rprob: 0, rot: 0, dens: 0, pitch: 0, len: 1, chord: 0, chordHeld: false, oct: 0 };

  /* ---------- sound ---------- */
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const mix = ctx.createGain(), hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), comp = ctx.createDynamicsCompressor(), native = ctx.createGain();
  hp.type = 'highpass'; hp.frequency.value = 20; lp.type = 'lowpass'; lp.frequency.value = 20000; hp.Q.value = lp.Q.value = 0.7;
  comp.threshold.value = -9; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.14; mix.gain.value = 0.9;
  const dly = ctx.createDelay(2), dfb = ctx.createGain(), dSend = ctx.createGain(), dTone = ctx.createBiquadFilter();
  dSend.gain.value = 0; dfb.gain.value = 0.4; dTone.type = 'lowpass'; dTone.frequency.value = 3400;
  const verb = ctx.createConvolver(), vSend = ctx.createGain(); vSend.gain.value = 0.1;
  (function () { const n = Math.floor(ctx.sampleRate * 2.2), b = ctx.createBuffer(2, n, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); } verb.buffer = b; })();
  mix.connect(hp).connect(lp).connect(comp).connect(native).connect(ctx.destination);
  lp.connect(dSend).connect(dly).connect(dTone).connect(dfb).connect(dly); dTone.connect(comp);
  lp.connect(vSend).connect(verb).connect(comp);
  const SAMPLES = new Map();
  function loadSample(path) {
    if (SAMPLES.has(path)) return SAMPLES.get(path).p;
    const rec = { buf: null, p: null };
    rec.p = fetch(TDM + path.split('/').map(encodeURIComponent).join('/')).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(a => ctx.decodeAudioData(a)).then(b => {
      let pk = 0; for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i += 3) pk = Math.max(pk, Math.abs(d[i])); }
      rec.buf = b; rec.gain = pk > 0.01 ? Math.min(3, 0.8 / pk) : 1;
    }).catch(() => {});
    SAMPLES.set(path, rec); return rec.p;
  }
  const noise = (() => { const b = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();
  function drumSound(l, t, vel) {
    const s = SAMPLES.get(l.file), rate = Math.pow(2, FX.pitch / 12), g = ctx.createGain();
    g.connect(l.g);
    if (s && s.buf) {
      const src = ctx.createBufferSource(); src.buffer = s.buf; src.playbackRate.value = rate;
      const dur = Math.min(s.buf.duration / rate, 1.6 * FX.len);
      g.gain.setValueAtTime(0.42 * s.gain * l.lvl * vel, t); g.gain.setTargetAtTime(0, t + dur * 0.7, Math.max(0.01, dur * 0.1));
      src.connect(g); src.start(t); src.stop(t + dur + 0.3); return;
    }
    // until the recording arrives: a small synth stand-in, so there is never silence
    if (l.i === 0) { const o = ctx.createOscillator(); o.frequency.setValueAtTime(140 * rate, t); o.frequency.exponentialRampToValueAtTime(48 * rate, t + 0.09); g.gain.setValueAtTime(0.7 * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(g); o.start(t); o.stop(t + 0.32); }
    else { const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(); n.buffer = noise; f.type = 'bandpass'; f.frequency.value = (900 + l.i * 1100) * rate; f.Q.value = 1.2; g.gain.setValueAtTime(0.3 * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07); n.connect(f).connect(g); n.start(t); n.stop(t + 0.1); }
  }
  function noteOf(l) {
    const sc = MODES[MODE], d = FX.chord + LDEG[l.i], semis = sc[mod(d, 7)] + 12 * Math.floor(d / 7);
    return clamp((l.i === 0 ? 36 : 60) + ROOT + semis + 12 * FX.oct + FX.pitch, 12, 115);
  }
  function noteSound(l, m, t, vel) {
    const f = 440 * Math.pow(2, (m - 69) / 12), g = ctx.createGain(), fl = ctx.createBiquadFilter(), o = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain();
    const bass = l.i === 0, dec = (bass ? 0.5 : 0.34) * FX.len;
    o.type = bass ? 'sawtooth' : 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * (bass ? 0.5 : 2); g2.gain.value = bass ? 0.6 : 0.22;
    fl.type = 'lowpass'; fl.Q.value = bass ? 3 : 0.8; fl.frequency.setValueAtTime(bass ? 900 : Math.min(12000, f * 7), t); fl.frequency.exponentialRampToValueAtTime(bass ? 160 : Math.max(300, f * 1.5), t + dec);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime((bass ? 0.34 : 0.2) * vel, t + 0.004); g.gain.setTargetAtTime(0, t + 0.02, dec / 2.2);
    o.connect(fl); o2.connect(g2).connect(fl); fl.connect(g).connect(l.g);
    o.start(t); o2.start(t); o.stop(t + dec * 3 + 0.1); o2.stop(t + dec * 3 + 0.1);
  }

  /* ---------- rings ---------- */
  const lanes = COLORS.map((color, i) => { const g = ctx.createGain(), pn = ctx.createStereoPanner(); pn.pan.value = [0, -0.15, 0.2, 0.3, -0.35, 0.4, -0.25, 0.1][i]; g.connect(pn).connect(mix); return { i, color, g, mute: i > 5,   /* the page opens with six rings playing: the last two are a key press away */ steps: 16, bits: [], name: '', file: '', lvl: 1, why: '', wx: false, flash: -1, now: -1 }; });
  const euclid = (n, k, rot) => { const b = []; for (let i = 0; i < n; i++) b.push(((((i + rot) % n) * k) % n) < k ? 1 : 0); return b; };
  function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const kit = () => KITS.find(k => k.id === ST.kit) || KITS[0];
  function buildLanes() {
    const c = D.cities[ST.city], g = c.g[ST.genre] || c.g[0];
    pattern = D.patterns[g.i[0]] || null;
    const rows = pattern ? pattern.p : [], K = kit(), used = new Set(), free = [0, 1, 2, 3, 4, 5, 6, 7];
    const take = want => { const k = want != null && free.includes(want) ? want : free[0]; free.splice(free.indexOf(k), 1); return k; };
    const r = rng(Math.round(WX.temp * 10) * 31 + Math.round(WX.wind * 10) * 7 + Math.round(WX.pres));
    const picks = [null, null, null,
      { s: clamp(Math.round(Math.abs(WX.temp)), 5, 16), why: 'temperature ' + Math.round(WX.temp) + '°' },
      { s: clamp(Math.round(WX.wind / 2) + 4, 5, 16), why: 'wind ' + Math.round(WX.wind) + ' km/h' },
      { s: 5 + Math.round(WX.hum / 100 * 11), why: 'humidity ' + Math.round(WX.hum) + '%' },
      { s: 5 + Math.round(WX.cloud / 100 * 11), why: 'cloud ' + Math.round(WX.cloud) + '%' },
      { s: 5 + (Math.round(WX.pres) % 12), why: 'pressure ' + Math.round(WX.pres) },
      { s: 12, why: 'the hour' }, { s: 9, why: 'wind and cloud' }, { s: 7, why: 'dry day' }];
    const wantOf = nm => K.perc ? null : /open/.test(nm) ? 6 : /snare|rim/.test(nm) ? 1 : /clap|palmas/.test(nm) ? 3 : /hat|shaker|ride|tamb|guach/.test(nm) ? 2 : /tom|drum|conga|surdo/.test(nm) ? 4 : null;
    lanes.forEach((l, i) => {
      const arr = i < 3 && rows[i] ? rows[i] : null;
      l.wx = !arr;
      if (arr) { l.steps = arr.length; l.bits = arr.split('').map(Number); l.why = i === 0 ? 'genre kick' : 'genre ' + String(pattern.r[i]).replace(/_/g, ' '); }
      else {
        const pk = picks[i < 3 ? 8 + i : i]; let steps = pk.s;
        while (used.has(steps)) steps = steps >= 16 ? 5 : steps + 1;
        const dens = [0.28, 0.32, 0.4, 0.38, 0.42, 0.36, 0.45, 0.4][i] + (r() - 0.5) * 0.18, hits = clamp(Math.round(steps * dens), 2, Math.max(2, steps - 2));
        l.steps = steps; l.bits = euclid(steps, hits, Math.floor(r() * steps)); l.why = pk.why;
      }
      used.add(l.steps);
      const v = K.v[take(arr ? (i === 0 ? 0 : wantOf(pattern.r[i])) : (K.perc ? null : [2, 3, 6, 4, 5, 7, 1][i - 3]))];
      l.name = v[0]; l.file = v[1]; l.lvl = v[2] || 1; loadSample(l.file);
    });
    ROOT = mod(Math.round(WX.temp), 12);
    const b = clamp((WX.temp - 4) / 22, 0, 1) * 0.55 + (1 - WX.cloud / 100) * 0.45 - (WX.rain > 0.1 ? 0.22 : 0);
    MODE = WX.temp < 0 && WX.cloud > 60 ? 'phrygian' : b > 0.78 ? 'lydian' : b > 0.62 ? 'major' : b > 0.46 ? 'mixolydian' : b > 0.3 ? 'dorian' : 'minor';
    paintLanes(); paintFacts(); paintSlices();
  }
  async function loadWeather() {
    const c = D.cities[ST.city];
    try {
      const j = await (await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + c.a + '&longitude=' + c.o + '&current=temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,precipitation,surface_pressure&timezone=auto')).json(), w = j.current, num = (v, d) => typeof v === 'number' && isFinite(v) ? v : d;
      WX = { temp: num(w.temperature_2m, 11), wind: num(w.wind_speed_10m, 14), hum: num(w.relative_humidity_2m, 70), cloud: num(w.cloud_cover, 60), pres: num(w.surface_pressure, 1010), rain: num(w.precipitation, 0), live: true };
    } catch (e) { WX.live = false; }
    buildLanes();
  }

  /* ---------- the clock ---------- */
  let tk = 0, next = 0, timer = null; const vis = [];
  const sd = () => 60 / ST.bpm / 4;
  const nowTk = () => ST.playing ? tk - (next - ctx.currentTime) / sd() : 0;
  // where the patterns are read from on this tick, after repeats, slices, scatter and reverse
  function playhead(k) {
    let pos = k, ratchet = 1, vm = 1; const R = FX.repeat;
    if (R) {
      const n = k - R.tk0;
      if (R.len >= 1) { pos = R.p0 + (n % R.len); vm = Math.pow(R.fade, Math.floor(n / R.len)); }
      else { pos = R.p0; ratchet = Math.round(1 / R.len); vm = Math.pow(R.fade, n); }
    }
    const bar = Math.floor(pos / 16), b = mod(pos, 16); let b2;
    if (FX.held.length) { const n = Math.max(0, k - FX.heldTk0), L = FX.sliceLen; b2 = mod(FX.held[Math.floor(n / L) % FX.held.length] * 2 + (n % L), 16); }
    else b2 = FX.order[b >> 1] * 2 + (b & 1);
    if (FX.scatter > 0 && hash(k, 7) < FX.scatter) b2 = Math.floor(hash(k, 13) * 8) * 2 + (b & 1);
    if (FX.rprob > 0 && ratchet === 1 && hash(k, 23) < FX.rprob) ratchet = hash(k, 29) < 0.3 ? 3 : 2;
    if (FX.reverse) b2 = 15 - b2;
    return { pos: bar * 16 + b2, ratchet, vm: Math.max(0.12, vm), slice: b >> 1, src: b2 >> 1 };
  }
  function fire(l, t, vel) {
    l.flash = t;
    if (ST.mode === 'notes') { const m = noteOf(l); noteSound(l, m, t, vel); RGMidi.note(l.i === 0 ? 'bass' : 'melody', m, vel, t, sd() * (l.i === 0 ? 1.8 : 1.4) * FX.len, { label: l.i === 0 ? 'bass' : 'ring ' + (l.i + 1) }); }
    else { drumSound(l, t, vel); RGMidi.drum(l.name, vel, t, { idx: l.i, dur: 0.06 * FX.len }); }
  }
  function step(t, k) {
    inStep = k; motionStep(k); inStep = null;
    autoStep(k);
    RGMidi.step(t, sd());
    const P = playhead(k), s = sd();
    if (!FX.chordHeld) FX.chord = PROG[Math.floor(k / 32) % PROG.length];
    vis.push({ t, pos: P.pos, slice: P.slice, src: P.src });
    for (const l of lanes) {
      const idx = mod(P.pos + (l.wx ? FX.rot : 0), l.steps); l.sched = idx;
      if (l.mute) continue;
      const h = hash(l.i + 1, idx); let on = l.bits[idx], ghost = false;
      if (on && FX.dens < 0 && h < -FX.dens && !(l.i === 0 && idx === 0)) on = 0;   // thin it out, but the first kick of the bar stays
      if (!on && FX.dens > 0 && h < FX.dens * 0.55) ghost = true;                    // or fill the gaps with quiet hits
      if (!on && !ghost) continue;
      const base = (idx % 4 === 0 ? 1 : 0.78) * (0.92 + Math.random() * 0.14) * P.vm * (ghost ? 0.42 : 1);
      for (let r = 0; r < P.ratchet; r++) fire(l, t + r * s / P.ratchet, base * Math.pow(0.82, r));
    }
  }
  function tick() { while (next < ctx.currentTime + 0.1) { step(next, tk); next += sd(); tk++; } }
  async function start() {
    await ctx.resume();
    await Promise.race([Promise.all(lanes.map(l => loadSample(l.file))), new Promise(r => setTimeout(r, 2500))]);
    tk = 0; next = ctx.currentTime + 0.06; vis.length = 0; setDelay();
    RGMidi.transport(true, next);
    timer = setInterval(tick, 25); ST.playing = true; paintPlay();
  }
  function stop() {
    clearInterval(timer); ST.playing = false; vis.length = 0; lanes.forEach(l => { l.now = -1; });
    RGMidi.transport(false); FX.repeat = null; paintPlay();
  }
  const toggle = () => (ST.playing ? stop() : start());
  function setBpm(b, user) { let x = b; while (x < 60) x *= 2; while (x > 180) x /= 2; ST.bpm = Math.round(x); if (user) ST.follow = false; $('bpm').value = ST.bpm; $('bpmV').textContent = ST.bpm; setDelay(); keep(); }
  let DDIV = 0.75; function setDelay() { dly.delayTime.setTargetAtTime(Math.min(1.9, 60 / ST.bpm * DDIV), ctx.currentTime, 0.02); }

  /* ---------- hands on the rhythm: used by the pad programs, the slice pads and the keys ---------- */
  const LEN_NAMES = { 8: '1/2 bar', 4: '1/4', 3: 'dotted 1/8', 2: '1/8', 1: '1/16', 0.5: '1/32', 0.25: '1/64' };
  let inStep = null;   // the tick being scheduled, when a recorded move is what is calling
  function repeatOn(len, fade) { const k = inStep != null ? inStep : Math.ceil(nowTk()); if (!FX.repeat) FX.repeat = { p0: k, tk0: k, len, fade: fade == null ? 1 : fade }; else { FX.repeat.len = len; if (fade != null) FX.repeat.fade = fade; } }
  function repeatOff() { FX.repeat = null; }
  function holdSlices(list, len) { const same = list.join() === FX.held.join(); FX.held = list.slice(); if (len) FX.sliceLen = len; if (!same) FX.heldTk0 = inStep != null ? inStep : Math.ceil(nowTk()); paintSlices(); }
  function setOrder(o) { FX.order = o.slice(); paintSlices(); }
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const AUTO = { bars: 0 };
  function autoStep(k) { if (AUTO.bars && k > 0 && k % (16 * AUTO.bars) === 0) { const o = shuffle(FX.order); if (FX.order[0] === 0 || Math.random() < 0.6) { const z = o.indexOf(0); [o[0], o[z]] = [o[z], o[0]]; } setOrder(o); } }   // most times the bar still starts on the one

  /* ---------- the pad ---------- */
  const PAD = { prog: 'filter', x: 0.5, y: 0.5, down: false, hold: false, trail: [], said: '' };
  const zone = (v, n) => clamp(Math.floor(v * n), 0, n - 1);
  const PROGS = [
    { id: 'filter', name: 'Filter', key: 'Q', x: 'low pass · open · high pass', y: 'resonance', on(x, y) {
        const q = 0.7 + y * y * 13, t = ctx.currentTime; let say = 'open';
        if (x < 0.46) { const f = 120 * Math.pow(20000 / 120, x / 0.46); lp.frequency.setTargetAtTime(f, t, 0.02); hp.frequency.setTargetAtTime(20, t, 0.02); say = 'low pass ' + (f > 999 ? (f / 1000).toFixed(1) + ' kHz' : Math.round(f) + ' Hz'); }
        else if (x > 0.54) { const f = 20 * Math.pow(6000 / 20, (x - 0.54) / 0.46); hp.frequency.setTargetAtTime(f, t, 0.02); lp.frequency.setTargetAtTime(20000, t, 0.02); say = 'high pass ' + (f > 999 ? (f / 1000).toFixed(1) + ' kHz' : Math.round(f) + ' Hz'); }
        else { lp.frequency.setTargetAtTime(20000, t, 0.02); hp.frequency.setTargetAtTime(20, t, 0.02); }
        lp.Q.setTargetAtTime(q, t, 0.02); hp.Q.setTargetAtTime(q, t, 0.02);
        RGMidi.cc('pad', 74, x * 127); RGMidi.cc('pad', 71, y * 127); return say;
      }, off() { const t = ctx.currentTime; lp.frequency.setTargetAtTime(20000, t, 0.06); hp.frequency.setTargetAtTime(20, t, 0.06); lp.Q.setTargetAtTime(0.7, t, 0.06); hp.Q.setTargetAtTime(0.7, t, 0.06); RGMidi.cc('pad', 74, 64); RGMidi.cc('pad', 71, 0); } },
    { id: 'repeat', name: 'Repeat', key: 'W', x: 'long · short', y: 'fades · holds', xz: 7, on(x, y) { const len = [8, 4, 3, 2, 1, 0.5, 0.25][zone(x, 7)]; repeatOn(len, 0.7 + 0.3 * y); return LEN_NAMES[len] + (y < 0.9 ? ' · fading' : ''); }, off: repeatOff },
    { id: 'slice', name: 'Slice', key: 'E', x: 'slice 1 to 8', y: 'long · short', xz: 8, yz: 3, on(x, y) { const s = zone(x, 8), len = [4, 2, 1][zone(y, 3)]; holdSlices([s], len); return 'slice ' + (s + 1) + ' · ' + LEN_NAMES[len]; }, off() { holdSlices([], 2); } },
    { id: 'scatter', name: 'Scatter', key: 'R', x: 'in order · scattered', y: 'plain · rolls · backwards', on(x, y) { FX.scatter = x * 0.85; FX.rprob = clamp(y, 0, 0.8) * 0.55; FX.reverse = y > 0.82; return Math.round(x * 100) + '% scattered' + (FX.reverse ? ' · backwards' : y > 0.15 ? ' · rolls' : ''); }, off() { FX.scatter = 0; FX.rprob = 0; FX.reverse = false; } },
    { id: 'shift', name: 'Shift', key: 'T', x: 'turn the weather rings', y: 'thinner · as written · fuller', xz: 16, on(x, y) { FX.rot = zone(x, 16); const d = (y - 0.5) * 2; FX.dens = Math.abs(d) < 0.1 ? 0 : d; return 'turned ' + FX.rot + (FX.dens ? (FX.dens < 0 ? ' · thinner' : ' · fuller') : ''); }, off() { FX.rot = 0; FX.dens = 0; } },
    { id: 'echo', name: 'Echo', key: 'Y', x: 'slow · fast', y: 'a little · a lot', xz: 5, on(x, y) { const z = zone(x, 5); DDIV = [1, 0.75, 0.5, 1 / 3, 0.25][z]; setDelay(); const t = ctx.currentTime; dfb.gain.setTargetAtTime(0.25 + 0.6 * y, t, 0.03); dSend.gain.setTargetAtTime(0.2 + 0.7 * y, t, 0.03); RGMidi.cc('pad', 91, y * 127); return ['1/4', 'dotted 1/8', '1/8', '1/8 triplet', '1/16'][z] + ' echo'; }, off() { dSend.gain.setTargetAtTime(0, ctx.currentTime, 0.03); RGMidi.cc('pad', 91, 0); } },
    { id: 'pitch', name: 'Pitch', key: 'U', x: 'down · up', y: 'short · long', xz: 25, on(x, y) { FX.pitch = zone(x, 25) - 12; FX.len = 0.25 + 1.5 * y; return (FX.pitch > 0 ? '+' : '') + FX.pitch + ' semitones'; }, off() { FX.pitch = 0; FX.len = 1; } },
    { id: 'chord', name: 'Chord', key: 'I', x: 'chord one to seven', y: 'low · high', xz: 7, yz: 3, on(x, y) { FX.chord = zone(x, 7); FX.oct = zone(y, 3) - 1; FX.chordHeld = true; return 'chord ' + ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][FX.chord] + (ST.mode === 'notes' ? '' : ' · switch to Notes to hear it'); }, off() {} }
  ];
  const progOf = id => PROGS.find(p => p.id === id);
  function padSet(x, y, fromMotion) {
    PAD.x = clamp(x, 0, 1); PAD.y = clamp(y, 0, 1); PAD.down = true;
    PAD.said = progOf(PAD.prog).on(PAD.x, PAD.y) || '';
    RGMidi.cc('pad', 12, PAD.x * 127); RGMidi.cc('pad', 13, PAD.y * 127); RGMidi.cc('pad', 92, 127);
    PAD.trail.push([PAD.x, PAD.y, performance.now()]); if (PAD.trail.length > 28) PAD.trail.shift();
    if (!fromMotion && MOT.state === 'rec') MOT.ev.push({ k: nowTk() - MOT.t0, x: PAD.x, y: PAD.y });
    paintSay();
  }
  function padRelease(fromMotion) {
    if (!PAD.down) return;
    if (!fromMotion && MOT.state === 'rec') motionEnd();
    if (PAD.hold && !fromMotion) return;
    PAD.down = false; progOf(PAD.prog).off(); RGMidi.cc('pad', 92, 0); PAD.said = ''; paintSay();
  }
  function setProg(id) {
    if (id === PAD.prog) return;
    const was = PAD.down; if (PAD.down) { PAD.down = false; progOf(PAD.prog).off(); }
    if (PAD.prog === 'chord') { FX.chordHeld = false; FX.oct = 0; }
    PAD.prog = id; PAD.said = '';
    if (MOT.state !== 'off') motionClear();
    if (was && PAD.hold) padSet(PAD.x, PAD.y);
    paintProgs(); paintSay();
  }
  // pad motion: record one gesture, then it loops in time, a whole number of bars long
  const MOT = { state: 'off', ev: [], t0: 0, len: 16, start: 0, live: false };
  function motionArm() { if (MOT.state === 'off') { MOT.state = 'armed'; } else motionClear(); paintMotion(); }
  function motionBegin() { MOT.state = 'rec'; MOT.ev = []; MOT.t0 = nowTk(); paintMotion(); }
  function motionEnd() { const dur = nowTk() - MOT.t0; if (!ST.playing || MOT.ev.length < 2) { motionClear(); return; } MOT.len = Math.max(16, Math.ceil(dur / 16) * 16); MOT.start = Math.floor(MOT.t0); MOT.state = 'play'; paintMotion(); }
  function motionClear() { const was = MOT.live; MOT.state = 'off'; MOT.ev = []; MOT.live = false; if (was) padRelease(true); paintMotion(); }
  function motionStep(k) {
    if (MOT.state !== 'play') return;
    const ph = mod(k - MOT.start, MOT.len), last = MOT.ev[MOT.ev.length - 1].k;
    if (ph <= last + 0.5) { let e = MOT.ev[0]; for (const x of MOT.ev) { if (x.k <= ph + 0.5) e = x; else break; } MOT.live = true; padSet(e.x, e.y, true); }
    else if (MOT.live) { MOT.live = false; padRelease(true); }
  }

  /* ---------- drawing ---------- */
  const cv = $('rings'), g2 = cv.getContext('2d'); let W = 0, H = 0, DPR = 1;
  function size() { const r = cv.getBoundingClientRect(); DPR = Math.min(2, window.devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); }
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  let curSlice = -1, curSrc = -1;
  function draw() {
    requestAnimationFrame(draw);
    if (!W) return;
    const now = ctx.currentTime; let ev = null;
    while (vis.length && vis[0].t <= now) ev = vis.shift();
    if (ev) { lanes.forEach(l => { l.now = mod(ev.pos + (l.wx ? FX.rot : 0), l.steps); }); curSlice = ev.slice; curSrc = ev.src; paintSliceNow(); }
    if (!ST.playing) { curSlice = -1; curSrc = -1; }
    g2.setTransform(DPR, 0, 0, DPR, 0, 0); g2.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - (SURFACE === 'slice' ? 34 : 14), r0 = R * 0.2, dr = (R - r0) / 7.4;
    g2.beginPath(); g2.arc(cx, cy, R + 6, 0, 7); g2.fillStyle = 'rgba(8,6,10,.5)'; g2.fill();
    // the rings
    lanes.forEach(l => {
      const r = r0 + l.i * dr, dim = l.mute ? 0.22 : 1, fl = clamp(1 - (now - l.flash) / 0.16, 0, 1);
      g2.beginPath(); g2.arc(cx, cy, r, 0, 7); g2.strokeStyle = rgba(l.color, (0.22 + 0.3 * fl) * dim); g2.lineWidth = 1 + fl; g2.stroke();
      for (let s = 0; s < l.steps; s++) {
        const a = -Math.PI / 2 + s / l.steps * Math.PI * 2, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a), on = l.bits[s], cur = s === l.now && ST.playing;
        g2.beginPath(); g2.arc(x, y, on ? (cur ? 7.5 : 5) : (cur ? 3.2 : 1.6), 0, 7);
        g2.fillStyle = on ? (cur ? '#fff' : rgba(l.color, 0.95 * dim)) : (cur ? 'rgba(243,236,230,.8)' : 'rgba(243,236,230,' + 0.2 * dim + ')');
        if (on && cur && !l.mute) { g2.shadowColor = l.color; g2.shadowBlur = 16; } g2.fill(); g2.shadowBlur = 0;
      }
    });
    // slices round the outside: where each eighth of the bar is being read from
    if (SURFACE === 'slice') {
      const ro = R + 20;
      for (let s = 0; s < 8; s++) {
        const a0 = -Math.PI / 2 + s / 8 * Math.PI * 2 + 0.03, a1 = -Math.PI / 2 + (s + 1) / 8 * Math.PI * 2 - 0.03, held = FX.held.includes(FX.order[s]), cur = s === curSlice && !FX.held.length, src = FX.held.length ? FX.order[s] === curSrc : false;
        g2.beginPath(); g2.arc(cx, cy, ro, a0, a1); g2.lineWidth = cur || src ? 7 : 4; g2.lineCap = 'round';
        g2.strokeStyle = held || src ? '#e8744a' : cur ? '#f3ece6' : FX.order[s] !== s ? 'rgba(240,194,122,.75)' : 'rgba(243,236,230,.22)'; g2.stroke();
        const am = (a0 + a1) / 2; g2.fillStyle = cur || src || held ? '#f3ece6' : 'rgba(243,236,230,.55)'; g2.font = '500 11px "Source Code Pro", monospace'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
        g2.fillText(String(FX.order[s] + 1), cx + (ro - 15) * Math.cos(am), cy + (ro - 15) * Math.sin(am));
      }
    }
    // the repeat loop, drawn as an arc on the kick ring
    if (FX.repeat && ST.playing) { const L = Math.max(1, FX.repeat.len), a0 = -Math.PI / 2 + mod(FX.repeat.p0, 16) / 16 * Math.PI * 2; g2.beginPath(); g2.arc(cx, cy, r0 - 12, a0, a0 + L / 16 * Math.PI * 2); g2.strokeStyle = '#e8744a'; g2.lineWidth = 3; g2.lineCap = 'round'; g2.stroke(); }
    // the pad: zone lines, a trail and the point under the finger
    if (SURFACE === 'pad') {
      const P = progOf(PAD.prog), act = PAD.down;
      g2.strokeStyle = 'rgba(243,236,230,' + (act ? 0.1 : 0.05) + ')'; g2.lineWidth = 1;
      if (P.xz && P.xz <= 16) for (let i = 1; i < P.xz; i++) { const x = i / P.xz * W; g2.beginPath(); g2.moveTo(x, 0); g2.lineTo(x, H); g2.stroke(); }
      if (P.yz) for (let i = 1; i < P.yz; i++) { const y = i / P.yz * H; g2.beginPath(); g2.moveTo(0, y); g2.lineTo(W, y); g2.stroke(); }
      const t = performance.now();
      PAD.trail = PAD.trail.filter(p => t - p[2] < 700);
      PAD.trail.forEach(p => { const a = 1 - (t - p[2]) / 700; g2.beginPath(); g2.arc(p[0] * W, (1 - p[1]) * H, 5 + 9 * a, 0, 7); g2.fillStyle = 'rgba(232,116,74,' + 0.22 * a + ')'; g2.fill(); });
      if (act) {
        const x = PAD.x * W, y = (1 - PAD.y) * H;
        g2.strokeStyle = 'rgba(232,116,74,.45)'; g2.beginPath(); g2.moveTo(x, 0); g2.lineTo(x, H); g2.moveTo(0, y); g2.lineTo(W, y); g2.stroke();
        g2.beginPath(); g2.arc(x, y, 15, 0, 7); g2.fillStyle = '#e8744a'; g2.shadowColor = '#e8744a'; g2.shadowBlur = 30; g2.fill(); g2.shadowBlur = 0;
        g2.beginPath(); g2.arc(x, y, 24, 0, 7); g2.strokeStyle = PAD.hold ? '#f3ece6' : 'rgba(232,116,74,.6)'; g2.lineWidth = 1.5; g2.stroke();
      }
    }
  }

  /* ---------- the page ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function paintFacts() {
    const c = D.cities[ST.city], g = c.g[ST.genre] || c.g[0];
    $('cityName').textContent = c.n;
    $('facts').textContent = (WX.live ? Math.round(WX.temp) + '° · wind ' + Math.round(WX.wind) + ' · ' : 'weather offline · ') + NOTE_NAMES[ROOT] + ' ' + MODE;
    $('genreLine').textContent = g.n + (g.b ? ' · ' + g.b + ' bpm' : '');
  }
  function paintLanes() {
    $('lanes').innerHTML = lanes.map(l => '<button type="button" class="lane" data-i="' + l.i + '" aria-pressed="' + (!l.mute) + '" title="' + esc(l.why) + '. Click to mute."><i style="background:' + l.color + '"></i><span>' + esc(ST.mode === 'notes' ? (l.i === 0 ? 'bass' : 'note ' + (l.i + 1)) : l.name) + '</span><b>' + l.steps + '</b><kbd>' + (SURFACE === 'pad' ? l.i + 1 : 'ASDFGHJK'[l.i]) + '</kbd></button>').join('');
  }
  function setMute(i, v) { lanes[i].mute = v == null ? !lanes[i].mute : v; const b = $('lanes').children[i]; if (b) b.setAttribute('aria-pressed', String(!lanes[i].mute)); }
  function paintPlay() { $('play').setAttribute('aria-pressed', String(ST.playing)); $('play').setAttribute('aria-label', ST.playing ? 'Stop' : 'Play'); }
  function paintSay() { const P = progOf(PAD.prog), el = $('say'); if (!el) return; el.innerHTML = '<b>' + P.name + '</b>' + (PAD.said ? esc(PAD.said) : 'touch the rings'); $('axX').textContent = P.x; $('axY').textContent = P.y; }
  function paintProgs() { const h = $('progs'); if (!h) return; [...h.children].forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === PAD.prog))); }
  function paintMotion() { const b = $('motion'); if (!b) return; b.setAttribute('aria-pressed', String(MOT.state !== 'off')); b.querySelector('span').textContent = { off: 'Record a move', armed: 'Now touch the pad', rec: 'Recording', play: 'Move is looping' }[MOT.state]; b.classList.toggle('rec', MOT.state === 'rec' || MOT.state === 'armed'); }
  function paintSlices() {
    const h = $('slices'); if (!h) return;
    const kick = lanes[0];
    [...h.children].forEach((b, s) => {
      const src = FX.order[s], dots = [0, 1].map(j => { const idx = mod(src * 2 + j, kick.steps || 16); return '<i class="' + (kick.bits[idx] ? 'on' : '') + '"></i>'; }).join('');
      b.innerHTML = '<kbd>' + (s + 1) + '</kbd><b>' + (src + 1) + '</b><span>' + dots + '</span>';
      b.classList.toggle('moved', src !== s);
    });
  }
  function paintSliceNow() { const h = $('slices'); if (!h) return; const cur = FX.held.length ? -1 : curSlice; [...h.children].forEach((b, s) => b.classList.toggle('now', s === cur || (FX.held.length > 0 && FX.order[s] === curSrc))); }

  // city, genre, kit
  const citySel = $('city'), genreSel = $('genre'), kitSel = $('kit');
  citySel.innerHTML = D.cities.map((c, i) => [c.n, i]).sort((a, b) => a[0].localeCompare(b[0])).map(([n, i]) => '<option value="' + i + '">' + esc(n) + '</option>').join('');
  kitSel.innerHTML = KITS.map(k => '<option value="' + k.id + '">' + k.name + '</option>').join('');
  function fillGenres() { const c = D.cities[ST.city]; genreSel.innerHTML = c.g.map((g, i) => '<option value="' + i + '">' + esc(g.n) + '</option>').join(''); genreSel.value = ST.genre; }
  function pickGenre(i) { ST.genre = i; const g = D.cities[ST.city].g[i]; if (ST.follow && g && g.b) { setBpm(g.b); ST.follow = true; } buildLanes(); }
  function pickCity(i) { ST.city = +i; ST.genre = 0; citySel.value = ST.city; fillGenres(); keep(); pickGenre(0); loadWeather(); }
  citySel.addEventListener('change', () => pickCity(citySel.value));
  genreSel.addEventListener('change', () => pickGenre(+genreSel.value));
  kitSel.value = ST.kit; kitSel.addEventListener('change', () => { ST.kit = kitSel.value; keep(); buildLanes(); });
  $('play').addEventListener('click', toggle);
  $('bpm').addEventListener('input', e => setBpm(+e.target.value, true));
  { let taps = []; $('tap').addEventListener('click', () => { const t = performance.now(); taps = taps.filter(x => t - x < 2400); taps.push(t); if (taps.length >= 3) setBpm(60000 / ((taps[taps.length - 1] - taps[0]) / (taps.length - 1)), true); }); }
  function setMode(m) { ST.mode = m; $('mode').setAttribute('aria-pressed', String(m === 'notes')); $('mode').querySelector('span').textContent = m === 'notes' ? 'Notes' : 'Drums'; RGMidi.allOff(); keep(); paintLanes(); paintSay(); }
  $('mode').addEventListener('click', () => setMode(ST.mode === 'notes' ? 'drums' : 'notes'));
  $('lanes').addEventListener('click', e => { const b = e.target.closest('.lane'); if (b) setMute(+b.dataset.i); });

  // the pad surface
  if (SURFACE === 'pad') {
    $('progs').innerHTML = PROGS.map(p => '<button type="button" class="pill" data-p="' + p.id + '" aria-pressed="false"><kbd>' + p.key + '</kbd>' + p.name + '</button>').join('');
    $('progs').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) setProg(b.dataset.p); });
    const at = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]; };
    let pid = null;
    cv.addEventListener('pointerdown', e => { e.preventDefault(); ctx.resume(); pid = e.pointerId; try { cv.setPointerCapture(pid); } catch (x) {} if (MOT.state === 'play') motionClear(); if (MOT.state === 'armed') motionBegin(); const [x, y] = at(e); padSet(x, y); });
    cv.addEventListener('pointermove', e => { if (e.pointerId !== pid) return; const [x, y] = at(e); padSet(x, y); });
    const up = e => { if (e.pointerId !== pid) return; pid = null; padRelease(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    $('hold').addEventListener('click', () => { PAD.hold = !PAD.hold; $('hold').setAttribute('aria-pressed', String(PAD.hold)); if (!PAD.hold && PAD.down && pid == null) padRelease(); });
    $('motion').addEventListener('click', motionArm);
    paintProgs(); paintMotion();
  }
  // the slice surface
  if (SURFACE === 'slice') {
    $('slices').innerHTML = Array.from({ length: 8 }, (_, s) => '<button type="button" class="sl" data-s="' + s + '"></button>').join('');
    const down = [], LATCH = { on: false }; let drag = null;
    const press = s => { if (LATCH.on) { const i = down.indexOf(s); if (i >= 0) down.splice(i, 1); else down.push(s); } else if (!down.includes(s)) down.push(s); holdSlices(down.map(x => FX.order[x]), 2); markHeld(); };
    const lift = s => { if (LATCH.on) return; const i = down.indexOf(s); if (i >= 0) down.splice(i, 1); holdSlices(down.map(x => FX.order[x]), 2); markHeld(); };
    const markHeld = () => [...$('slices').children].forEach((b, s) => b.setAttribute('aria-pressed', String(down.includes(s))));
    const clear = () => { down.length = 0; holdSlices([], 2); markHeld(); };
    $('slices').addEventListener('pointerdown', e => { const b = e.target.closest('.sl'); if (!b) return; e.preventDefault(); ctx.resume(); drag = { from: +b.dataset.s, over: +b.dataset.s, id: e.pointerId }; press(drag.from); });
    addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return; const el = document.elementFromPoint(e.clientX, e.clientY), b = el && el.closest && el.closest('.sl'); const o = b ? +b.dataset.s : drag.from; if (o !== drag.over) { drag.over = o; [...$('slices').children].forEach((x, s) => x.classList.toggle('drop', s === o && o !== drag.from)); } });
    addEventListener('pointerup', e => { if (!drag || e.pointerId !== drag.id) return; const d = drag; drag = null; [...$('slices').children].forEach(x => x.classList.remove('drop'));
      if (d.over !== d.from) { const o = FX.order.slice(); [o[d.from], o[d.over]] = [o[d.over], o[d.from]]; const i = down.indexOf(d.from); if (i >= 0) down.splice(i, 1); setOrder(o); holdSlices(down.map(x => FX.order[x]), 2); markHeld(); } else lift(d.from); });
    const acts = { scramble: () => setOrder(shuffle(FX.order)), mirror: () => setOrder(FX.order.slice().reverse()), turn: () => setOrder(FX.order.slice(1).concat(FX.order[0])), reset: () => { clear(); setOrder([0, 1, 2, 3, 4, 5, 6, 7]); } };
    document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => acts[b.dataset.act]()));
    $('latch').addEventListener('click', () => { LATCH.on = !LATCH.on; $('latch').setAttribute('aria-pressed', String(LATCH.on)); if (!LATCH.on) clear(); });
    $('auto').addEventListener('change', e => { AUTO.bars = +e.target.value; });
    // momentary repeats and reverse
    document.querySelectorAll('[data-rep]').forEach(b => { const on = e => { e.preventDefault(); ctx.resume(); repeatOn(+b.dataset.rep, 1); b.setAttribute('aria-pressed', 'true'); }, off = () => { if (b.getAttribute('aria-pressed') === 'true') { b.setAttribute('aria-pressed', 'false'); repeatOff(); } }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off); });
    { const b = $('rev'), on = e => { e.preventDefault(); FX.reverse = true; b.setAttribute('aria-pressed', 'true'); }, off = () => { FX.reverse = false; b.setAttribute('aria-pressed', 'false'); }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off); }
    $('dens').addEventListener('input', e => { const d = +e.target.value / 100; FX.dens = Math.abs(d) < 0.08 ? 0 : d; $('densV').textContent = FX.dens === 0 ? 'as written' : FX.dens < 0 ? 'thinner' : 'fuller'; RGMidi.cc('pad', 13, (d + 1) * 63.5); });
    $('cut').addEventListener('input', e => { const x = +e.target.value / 100; progOf('filter').on(x, 0.25); $('cutV').textContent = x < 0.46 ? 'low pass' : x > 0.54 ? 'high pass' : 'open'; RGMidi.cc('pad', 12, x * 127); });
    window.__slice = { press, lift, clear };
  }

  // keys
  const typing = e => e.target.matches && e.target.matches('select, input:not([type=range]), textarea');
  const heldKeys = {};
  addEventListener('keydown', e => {
    if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) toggle(); return; }
    if (e.repeat || heldKeys[e.code]) return; heldKeys[e.code] = 1;
    const d = /^Digit([1-8])$/.exec(e.code), n = d ? +d[1] - 1 : -1;
    if (SURFACE === 'pad') {
      if (n >= 0) setMute(n);
      const p = PROGS.find(p => 'Key' + p.key === e.code); if (p) setProg(p.id);
      if (e.code === 'KeyH') $('hold').click(); if (e.code === 'KeyM') $('motion').click();
    } else {
      if (n >= 0) window.__slice.press(n);
      const li = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK'].indexOf(e.code); if (li >= 0) setMute(li);
      const rep = { KeyQ: 4, KeyW: 2, KeyE: 1, KeyR: 0.5 }[e.code]; if (rep) { const b = document.querySelector('[data-rep="' + rep + '"]'); repeatOn(rep, 1); b.setAttribute('aria-pressed', 'true'); }
      if (e.code === 'KeyT') { FX.reverse = true; $('rev').setAttribute('aria-pressed', 'true'); }
      if (e.code === 'KeyZ') document.querySelector('[data-act=scramble]').click(); if (e.code === 'KeyX') document.querySelector('[data-act=mirror]').click(); if (e.code === 'KeyC') document.querySelector('[data-act=turn]').click(); if (e.code === 'KeyV') document.querySelector('[data-act=reset]').click();
      if (e.code === 'KeyL') $('latch').click();
    }
  });
  addEventListener('keyup', e => {
    delete heldKeys[e.code];
    if (SURFACE !== 'slice') return;
    const d = /^Digit([1-8])$/.exec(e.code); if (d) window.__slice.lift(+d[1] - 1);
    const rep = { KeyQ: 4, KeyW: 2, KeyE: 1, KeyR: 0.5 }[e.code]; if (rep) { document.querySelector('[data-rep="' + rep + '"]').setAttribute('aria-pressed', 'false'); repeatOff(); }
    if (e.code === 'KeyT') { FX.reverse = false; $('rev').setAttribute('aria-pressed', 'false'); }
  });

  /* ---------- MIDI ---------- */
  RGMidi.init({ page: SURFACE, ctx: () => ctx, button: 'midi', mute: v => native.gain.setTargetAtTime(v ? 0 : 1, ctx.currentTime, 0.03),
    parts: [{ id: 'drums', label: 'Drums', kind: 'drum', ch: 1, hint: 'the rings, in Drums mode' }, { id: 'melody', label: 'Notes', kind: 'note', ch: 2, hint: 'rings two to eight, in Notes mode' }, { id: 'bass', label: 'Bass', kind: 'note', ch: 6, hint: 'ring one, in Notes mode' }, { id: 'pad', label: SURFACE === 'pad' ? 'The pad' : 'Filter and density', kind: 'cc', ch: 9, hint: 'controllers' }],
    note: SURFACE === 'pad' ? 'Repeats, slices, scatter, shift, pitch and chords change the notes themselves, so your machines play the same moves. The pad also sends its position like a Kaoss Pad: X on CC 12, Y on CC 13, touch on CC 92. Filter adds CC 74 and 71. Echo adds CC 91.' : 'Slices, repeats, reverse and the thin to full slider change the notes themselves, so your machines play the same moves. Filter goes out on CC 12 and CC 74, thin to full on CC 13.' });

  /* ---------- go ---------- */
  size(); addEventListener('resize', size); if (window.ResizeObserver) new ResizeObserver(size).observe(cv);
  citySel.value = ST.city; fillGenres(); setBpm(ST.bpm); if (!saved.bpm) ST.follow = true;
  $('mode').setAttribute('aria-pressed', String(ST.mode === 'notes')); $('mode').querySelector('span').textContent = ST.mode === 'notes' ? 'Notes' : 'Drums';
  pickGenre(0); loadWeather(); paintSay(); paintPlay(); draw();
  window.__live = { ST, FX, PAD, MOT, lanes, padSet, padRelease, setProg, playhead, start, stop };
})();
