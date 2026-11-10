/* Rhythm Geometry MIDI out. One engine and one panel for every page.
   A page calls RGMidi.init({...}) once, then RGMidi.drum(), .note(), .cc(), .step() and .transport() as it plays.
   Settings are saved in the browser and shared by every Rhythm Geometry page, so the studio is set up once.

   What it does that the old per-page code did not:
   - remembers the device, channels and set-up
   - set-ups for the TR-8S, General MIDI drum racks, Digitakt, Model:Cycles, one ring per channel, and pads from note 36
   - a note that plays again before it has ended is closed first, so nothing is cut short or left hanging
   - a nudge, in milliseconds, to line the hardware up with the browser sound
   - note length and velocity controls, all notes off on Stop, and a Panic button
   - a small monitor that shows what is going out */
(function () {
  if (window.RGMidi) return;
  var KEY = 'rg-midi-v1';
  var S = { on: false, out: '', clock: true, cc: true, nudge: 0, gate: 100, vel: 'played', preset: 'tr8s', mute: false, parts: {} };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) for (var k in saved) S[k] = saved[k]; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  var cfg = null, access = null, out = null, panel = null, els = {}, offs = [], lastCC = {}, lastProg = {}, running = false, mon = [], monT = 0, flashT = 0, pump = null;
  var clamp = function (x, a, b) { return Math.min(b, Math.max(a, x)); };

  /* ---------- drum names to notes ---------- */
  // The eleven sounds a TR-8S has: BD 36, RS 37, SD 38, HC 39, CH 42, LT 43, OH 46, MT 47, CC 49, HT 50, RC 51.
  var ROLE_NOTE = { bd: 36, rs: 37, sd: 38, cp: 39, ch: 42, lt: 43, oh: 46, mt: 47, cc: 49, ht: 50, rc: 51 };
  var ROLE_RULES = [
    [/open.?hat|^oh$|glitch|long bell/, 'oh'],
    [/kick|bass.?drum|^bd$|sub pop|^dum$|surdo(?!.*mute)|^gong$/, 'bd'],
    [/rim|clave|wood|stick|slap|click|hyoshi|finger/, 'rs'],
    [/snare|^pop$|pandeiro/, 'sd'],
    [/clap|palmas|snap|zap/, 'cp'],
    [/hat|shaker|maraca|marcas|guiro|cabasa|tick|guacharaca|alegre/, 'ch'],
    [/crash|tambourine|tamborim|triangle|splash|blip|whistle|crystal|gong/, 'cc'],
    [/ride|cowbell|agogo|bell|bleep|vibes|digital/, 'rc'],
    [/conga low|low conga|locongao/, 'lt'], [/bongo low|lobongo/, 'mt'],
    [/high|bongo|timbale|quinto|^tak$|bright|xylo|kalimba/, 'ht'],
    [/mid|conga|sabar|marimba|cuica/, 'mt'],
    [/low|tom|drum|udu|tabla|surdo|dhol|daiko|tambora|tumbao|bamboo|gamelan/, 'lt']
  ];
  // General MIDI percussion, for drum racks and sound modules that have the Latin sounds too
  var GM_RULES = [
    [/conga.*(slap|mute)|quinto/, 62], [/conga.*high/, 63], [/conga/, 64], [/bongo.*(low)/, 61], [/bongo/, 60],
    [/timbale.*low/, 66], [/timbale/, 65], [/agogo.*low|loagogo/, 68], [/agogo/, 67], [/cabasa/, 69], [/maraca|marcas|shaker/, 70],
    [/whistle/, 71], [/guiro/, 73], [/clave/, 75], [/wood.*low/, 77], [/wood/, 76], [/cuica.*open/, 79], [/cuica/, 78],
    [/triangle/, 81], [/tambourine|tamborim|pandeiro/, 54], [/cowbell/, 56], [/splash/, 55], [/hat.*pedal/, 44], [/surdo.*mute/, 41], [/low.?tom|low.?drum/, 45], [/high.?tom|high.?drum/, 50]
  ];
  var DT_TRACK = { bd: 0, sd: 1, lt: 2, mt: 2, ht: 2, cp: 3, rs: 4, ch: 5, oh: 6, cc: 7, rc: 7 };      // Digitakt: kick, snare, tom, clap, rim, closed hat, open hat, cymbal
  var MC_TRACK = { bd: 0, sd: 1, cp: 1, ch: 2, oh: 2, cc: 2, rc: 2, lt: 3, mt: 3, ht: 3, rs: 3 };      // Model:Cycles: kick, snare, metal, perc (tone and chord stay free)
  var PRESETS = {
    tr8s: ['TR-8S or TR-8', 'Every drum lands on one of the eleven TR sounds, on one channel. Congas and bongos play the toms.'],
    gm: ['Drum rack or General MIDI', 'Standard drum notes on one channel, with the Latin percussion on its own keys.'],
    digitakt: ['Digitakt', 'Kick, snare, tom, clap, rim, closed hat, open hat and cymbal go to tracks 1 to 8, each on its own channel, counting up from the drum channel.'],
    cycles: ['Model:Cycles', 'Kick, snare, metal and perc go to tracks 1 to 4, each on its own channel, counting up from the drum channel.'],
    rings: ['One ring per channel', 'Each ring gets its own channel, counting up from the drum channel. Every hit is middle C.'],
    pads: ['Pads from note 36', 'Ring one is note 36, ring two is 37 and so on. Good for a blank drum rack or a sampler.'],
    tuned: ['The tuned notes of the key', 'Each drum sends the note it is tuned to.']
  };
  var TR_LEVEL = { bd: 24, sd: 29, lt: 48, mt: 51, ht: 54, rs: 57, cp: 60, ch: 63, oh: 82, cc: 85, rc: 88 };   // the Level knob of each TR-8S instrument
  var roleCache = {};
  function roleOf(name) {
    var n = String(name || '').toLowerCase().replace(/_/g, ' ');
    if (roleCache[n]) return roleCache[n];
    var r = null, gm = null, i;
    for (i = 0; i < ROLE_RULES.length; i++) if (ROLE_RULES[i][0].test(n)) { r = ROLE_RULES[i][1]; break; }
    for (i = 0; i < GM_RULES.length; i++) if (GM_RULES[i][0].test(n)) { gm = GM_RULES[i][1]; break; }
    return (roleCache[n] = { role: r, gm: gm });
  }
  var ORDER = ['bd', 'sd', 'ch', 'oh', 'lt', 'ht', 'cc', 'cp', 'rs', 'mt', 'rc'];
  // where one drum hit goes: { ch (0 to 15), note }
  function drumTarget(name, o) {
    o = o || {};
    var p = part(o.part || 'drums'), base = p.ch - 1, idx = o.idx || 0, R = roleOf(name), role = R.role || ORDER[idx % ORDER.length], pr = S.preset;
    if (pr === 'tuned' && o.tuned != null) return { ch: base, note: clamp(Math.round(o.tuned), 0, 127) };
    if (pr === 'rings') return { ch: (base + idx) % 16, note: 60 };
    if (pr === 'pads') return { ch: base, note: clamp(36 + idx, 0, 127) };
    if (pr === 'digitakt') return { ch: (base + DT_TRACK[role]) % 16, note: 60 };
    if (pr === 'cycles') return { ch: (base + MC_TRACK[role]) % 16, note: 60 };
    if (pr === 'gm' && R.gm != null) return { ch: base, note: R.gm };
    return { ch: base, note: ROLE_NOTE[role] };
  }

  /* ---------- parts ---------- */
  function part(id) {
    var d = (cfg && cfg.parts.find(function (p) { return p.id === id; })) || { id: id, ch: 1 };
    var p = S.parts[id] || (S.parts[id] = {});
    if (p.ch == null) p.ch = d.ch || 1;
    if (p.on == null) p.on = true;
    if (p.oct == null) p.oct = 0;
    if (p.as == null) p.as = 'notes';
    return p;
  }

  /* ---------- sending ---------- */
  function ctx() { return cfg && cfg.ctx ? cfg.ctx() : null; }
  // audio clock time to the clock MIDI uses, with the nudge added
  function perf(t) {
    var c = ctx(), now = performance.now();
    if (t == null || !c) return now;
    var ts = c.getOutputTimestamp ? c.getOutputTimestamp() : null;
    var p = ts && ts.performanceTime ? ts.performanceTime + (t - ts.contextTime) * 1000 : now + (t - c.currentTime) * 1000;
    return Math.max(now, p + S.nudge);
  }
  function raw(bytes, when) { if (!out) return; try { out.send(bytes, when); } catch (e) {} }
  function live() { return S.on && !!out; }
  function velOf(v) {
    if (S.vel === 'full') return 127;
    if (S.vel === 'fixed') return 100;
    v = clamp(v == null ? 0.8 : v, 0, 1.2);
    if (S.vel === 'soft') return clamp(Math.round(20 + 80 * v), 1, 127);
    if (S.vel === 'hard') return clamp(Math.round(70 + 57 * v), 1, 127);
    return clamp(Math.round(34 + 93 * Math.min(1, v)), 1, 127);
  }
  // note on now, and its note off kept in a small list so a repeat of the same note can close the first one early
  function sendNote(ch, note, vel, when, durMs, label) {
    if (note < 0 || note > 127) return;
    var key = ch * 128 + note, i;
    for (i = offs.length - 1; i >= 0; i--) if (offs[i].key === key && offs[i].at > when - 2) { raw([0x80 | ch, note, 0], Math.max(performance.now(), when - 2)); offs.splice(i, 1); }
    raw([0x90 | ch, note, vel], when);
    offs.push({ key: key, ch: ch, note: note, at: when + Math.max(10, durMs) });
    if (!pump) pump = setInterval(flush, 8);
    watch(label, ch, note, vel);
  }
  function flush() {
    var now = performance.now();
    for (var i = offs.length - 1; i >= 0; i--) if (offs[i].at < now + 30) { raw([0x80 | offs[i].ch, offs[i].note, 0], Math.max(now, offs[i].at)); offs.splice(i, 1); }
    if (!offs.length && pump) { clearInterval(pump); pump = null; }
  }
  function watch(label, ch, note, vel) {
    mon.unshift([label || '', ch + 1, note, vel]); if (mon.length > 6) mon.length = 6;
    var now = performance.now();
    if (now - flashT > 90) { flashT = now; buttons().forEach(function (b) { b.classList.add('rgm-hit'); setTimeout(function () { b.classList.remove('rgm-hit'); }, 70); }); }
    if (panel && !panel.hidden && now - monT > 120) { monT = now; paintMon(); }
  }

  var API = {
    presets: PRESETS,
    get on() { return live(); },
    get settings() { return S; },
    init: function (c) {
      cfg = c; cfg.parts = cfg.parts || [{ id: 'drums', label: 'Drums', kind: 'drum', ch: 1 }];
      cfg.parts.forEach(function (p) { part(p.id); });
      if (S.preset === 'tuned' && !cfg.tuned) S.preset = 'tr8s';
      buttons().forEach(function (b) { b.addEventListener('click', API.open); });
      light();
      if (S.mute && cfg.mute) { try { cfg.mute(true); } catch (e) {} }
      // come back on by itself when the browser has already said yes to MIDI
      if (S.on && navigator.permissions && navigator.requestMIDIAccess) {
        navigator.permissions.query({ name: 'midi' }).then(function (r) { if (r.state === 'granted') connect(); }).catch(function () {});
      }
      addEventListener('pagehide', function () { API.panic(); });
      return API;
    },
    // one drum hit. name is the drum's name ("kick", "conga low", "closed_hat"). o: { idx, part, tuned, dur }
    drum: function (name, vel, t, o) {
      if (!live()) return;
      o = o || {}; var p = part(o.part || 'drums'); if (!p.on) return;
      var tg = drumTarget(name, o);
      sendNote(tg.ch, tg.note, velOf(vel), perf(t), (o.dur || 0.06) * 1000, name);
    },
    // one pitched note. o: { drum: name } lets a part be sent as a drum hit when its "plays" switch says so
    note: function (id, n, vel, t, dur, o) {
      if (!live()) return;
      var p = part(id); if (!p.on) return;
      if (p.as === 'drum' && o && o.drum) { var tg = drumTarget(o.drum, { idx: o.idx }); sendNote(tg.ch, tg.note, velOf(vel), perf(t), 60, o.drum); return; }
      sendNote(p.ch - 1, clamp(Math.round(n) + 12 * p.oct, 0, 127), velOf(vel), perf(t), (dur || 0.2) * 1000 * S.gate / 100, (o && o.label) || id);
    },
    // a held set of notes (a pad or a drone): each call replaces the last set on that part
    hold: function (id, notes, vel, t) {
      var p = part(id), h = API._held[id] || [], when = perf(t), c = p.ch - 1;
      h.forEach(function (x) { raw([0x80 | x[0], x[1], 0], when); });
      API._held[id] = [];
      if (!live() || !p.on || !notes) return;
      API._held[id] = notes.map(function (n) { n = clamp(Math.round(n) + 12 * p.oct, 0, 127); raw([0x90 | c, n, velOf(vel)], when + 1); return [c, n]; });
      if (notes.length) watch(id + ' chord', c, API._held[id][0][1], velOf(vel));
    },
    _held: {},
    cc: function (id, num, v, t) {
      if (!live() || !S.cc) return;
      var p = part(id); if (!p.on) return;
      var c = p.ch - 1, val = clamp(Math.round(v), 0, 127), key = c * 128 + num;
      if (lastCC[key] === val) return; lastCC[key] = val;
      raw([0xB0 | c, num, val], t == null ? undefined : perf(t));
    },
    // a ring's fader. On the TR-8S set-up it moves that drum's Level on the machine itself
    level: function (name, v, o) {
      if (!live() || !S.cc) return;
      o = o || {}; var p = part(o.part || 'drums'); if (!p.on) return;
      var tg = drumTarget(name, o), R = roleOf(name).role || ORDER[(o.idx || 0) % ORDER.length], val = clamp(Math.round(v * 127), 0, 127);
      var num = S.preset === 'tr8s' ? TR_LEVEL[R] : (S.preset === 'digitakt' || S.preset === 'cycles' || S.preset === 'rings') ? 7 : 20 + ((o.idx || 0) % 12);
      var key = tg.ch * 128 + num; if (lastCC[key] === val) return; lastCC[key] = val;
      raw([0xB0 | tg.ch, num, val]);
    },
    program: function (id, pc, t) {
      if (!live()) return; var p = part(id), c = p.ch - 1;
      if (lastProg[c] === pc) return; lastProg[c] = pc; raw([0xC0 | c, clamp(pc, 0, 127)], perf(t));
    },
    // call once for every sixteenth note: sends the six clock pulses that fall inside it
    step: function (t, stepDur, pulses) {
      if (!live() || !S.clock) return;
      pulses = pulses || 6;
      for (var k = 0; k < pulses; k++) raw([0xF8], perf(t + stepDur * k / pulses));
    },
    transport: function (go, t) {
      running = !!go;
      if (live() && S.clock) raw([go ? 0xFA : 0xFC], perf(t));
      if (!go) API.allOff(t);
    },
    allOff: function (t) {
      var when = perf(t);
      offs.forEach(function (o) { raw([0x80 | o.ch, o.note, 0], when); }); offs.length = 0;
      for (var id in API._held) { API._held[id].forEach(function (x) { raw([0x80 | x[0], x[1], 0], when); }); API._held[id] = []; }
    },
    panic: function () {
      API.allOff();
      if (!out) return;
      for (var c = 0; c < 16; c++) { raw([0xB0 | c, 123, 0]); raw([0xB0 | c, 64, 0]); }
      lastCC = {}; lastProg = {};
    },
    target: drumTarget,
    open: function () { build(); panel.hidden = false; els.close.focus(); connect(); paint(); },
    close: function () { if (panel) panel.hidden = true; }
  };

  /* ---------- the device ---------- */
  function buttons() {
    var b = cfg && cfg.button; if (!b) return [];
    return (Array.isArray(b) ? b : [b]).map(function (x) { return typeof x === 'string' ? document.getElementById(x) : x; }).filter(Boolean);
  }
  function light() { var on = live(); buttons().forEach(function (b) { b.setAttribute('aria-pressed', String(on)); b.classList.toggle('rgm-on', on); }); if (cfg && cfg.onChange) { try { cfg.onChange(on); } catch (e) {} } }
  function outputs() { return access ? Array.from(access.outputs.values()) : []; }
  function pick() {
    var list = outputs(), o = list.find(function (x) { return x.id === S.out; }) || list.find(function (x) { return x.name === S.outName; }) || null;
    if (!o && list.length && !S.out) o = list[0];
    if (out && out !== o) API.panic();
    out = o; if (o) { S.out = o.id; S.outName = o.name; }
    light(); paint();
  }
  function connect() {
    if (access) { pick(); return Promise.resolve(true); }
    if (!navigator.requestMIDIAccess) { say('This browser cannot send MIDI. Chrome, Edge and Firefox can. Safari cannot yet.'); return Promise.resolve(false); }
    return navigator.requestMIDIAccess().then(function (a) {
      access = a; a.onstatechange = pick;
      var first = !S.out; pick();
      if (first && out && !S.on) { S.on = true; save(); light(); paint(); }   // the first time a device is found, switch on
      return true;
    }).catch(function () { say('MIDI was blocked. Allow it in the browser and try again.'); return false; });
  }
  function say(m) { if (els.msg) els.msg.textContent = m; }

  /* ---------- the panel ---------- */
  var CSS = '.rgm{position:fixed;inset:0;z-index:2147482000;display:grid;place-items:center;padding:16px;background:rgba(8,5,4,.72);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font:13px/1.45 "Source Code Pro",ui-monospace,Menlo,monospace;letter-spacing:.02em;color:#f3ece6;--rgm-a:#e8744a;--rgm-l:rgba(243,236,230,.16);--rgm-d:rgba(243,236,230,.62)}' +
    '.rgm[hidden]{display:none}.rgm *{box-sizing:border-box}' +
    '.rgm-box{width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:22px;border-radius:22px;border:1px solid var(--rgm-l);background:rgba(20,13,11,.96);box-shadow:0 24px 60px rgba(0,0,0,.5);display:grid;gap:14px}' +
    '.rgm-head{display:flex;align-items:center;justify-content:space-between;gap:14px}.rgm-head b{font:400 24px/1 "Abel","Arial Narrow",sans-serif;letter-spacing:.04em}' +
    '.rgm p{margin:0;color:var(--rgm-d);font-size:12px}' +
    '.rgm-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.rgm label{display:grid;gap:4px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--rgm-d);min-width:0}' +
    '.rgm select,.rgm-btn{font:inherit;color:#f3ece6;background:#0d0807;border:1px solid var(--rgm-l);border-radius:999px;padding:8px 14px;min-height:36px;text-transform:none;letter-spacing:.02em;max-width:100%}' +
    '.rgm-btn{cursor:pointer;text-transform:uppercase;letter-spacing:.1em;font-size:11px}.rgm-btn[aria-pressed=true]{border-color:var(--rgm-a);color:var(--rgm-a);box-shadow:0 0 14px -4px var(--rgm-a)}' +
    '.rgm-btn.big{background:var(--rgm-a);color:#14110f;border:0;font-size:12px;padding:8px 22px}.rgm-btn.big[aria-pressed=true]{background:#f3ece6;color:#14110f;box-shadow:none}' +
    '.rgm select:focus-visible,.rgm-btn:focus-visible,.rgm input:focus-visible{outline:2px solid var(--rgm-a);outline-offset:2px}' +
    '.rgm input[type=range]{width:100%;accent-color:var(--rgm-a);margin:0;height:22px}' +
    '.rgm-parts{display:grid;gap:8px;padding:14px;border:1px solid var(--rgm-l);border-radius:16px}' +
    '.rgm-part{display:grid;grid-template-columns:22px minmax(0,1fr) 96px 86px;gap:8px;align-items:center}.rgm-part.wide{grid-template-columns:22px minmax(0,1fr) 96px 86px}' +
    '.rgm-part input{width:18px;height:18px;accent-color:var(--rgm-a);margin:0}.rgm-part span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rgm-part small{display:block;color:var(--rgm-d);font-size:10.5px;white-space:normal}' +
    '.rgm-part select{padding:4px 8px;min-height:30px;font-size:12px}' +
    '.rgm-chips{display:flex;flex-wrap:wrap;gap:8px}' +
    '.rgm-mon{font-size:11px;color:var(--rgm-d);min-height:34px;padding:8px 14px;border-radius:3px;background:#0a0808;border:1px solid var(--rgm-l);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rgm-mon b{color:var(--rgm-a);font-weight:400}' +
    '.rgm-hit{box-shadow:0 0 0 1px #e8744a,0 0 14px -2px #e8744a !important}' +
    '@media(max-width:520px){.rgm-row{grid-template-columns:1fr}.rgm-part{grid-template-columns:22px minmax(0,1fr) 80px 70px}}';
  function h(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function build() {
    if (panel) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    panel = h('div', { 'class': 'rgm', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'MIDI out', hidden: '' });
    var chans = function (sel) { var s = ''; for (var i = 1; i <= 16; i++) s += '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>Ch ' + i + '</option>'; return s; };
    var presetKeys = Object.keys(PRESETS).filter(function (k) { return k !== 'tuned' || cfg.tuned; });
    panel.innerHTML = '<div class="rgm-box">' +
      '<div class="rgm-head"><b>MIDI out</b><button class="rgm-btn" data-k="close" type="button">Done</button></div>' +
      '<p data-k="msg"></p>' +
      '<div class="rgm-row"><label>Send to<select data-k="out"></select></label><label>Set up for<select data-k="preset">' + presetKeys.map(function (k) { return '<option value="' + k + '">' + PRESETS[k][0] + '</option>'; }).join('') + '</select></label></div>' +
      '<p data-k="pnote"></p>' +
      '<div class="rgm-parts" data-k="parts"></div>' +
      '<div class="rgm-row"><label>Nudge <span data-k="nudgeV"></span><input data-k="nudge" type="range" min="-60" max="120" step="1"></label><label>Note length <span data-k="gateV"></span><input data-k="gate" type="range" min="10" max="200" step="5"></label></div>' +
      '<div class="rgm-row"><label>Velocity<select data-k="vel"><option value="played">As played</option><option value="soft">Softer</option><option value="hard">Harder</option><option value="fixed">Fixed at 100</option><option value="full">Fixed at 127</option></select></label><span></span></div>' +
      '<div class="rgm-chips"><button class="rgm-btn big" data-k="on" type="button">Send MIDI</button>' +
      '<button class="rgm-btn" data-k="clock" type="button" title="Tempo, start and stop, so your machines follow">Clock</button>' +
      '<button class="rgm-btn" data-k="cc" type="button" title="Knobs, faders and the pad go out as controllers">Knobs</button>' +
      (cfg.mute ? '<button class="rgm-btn" data-k="mute" type="button" title="Silence the browser and let the hardware play">Mute browser</button>' : '') +
      '<button class="rgm-btn" data-k="test" type="button">Test</button><button class="rgm-btn" data-k="panic" type="button" title="All notes off, on every channel">Panic</button></div>' +
      '<div class="rgm-mon" data-k="mon" aria-live="off"></div>' +
      (cfg.note ? '<p>' + cfg.note + '</p>' : '') +
      '<p>These settings are shared by every Rhythm Geometry page and saved in this browser.</p></div>';
    document.body.appendChild(panel);
    panel.querySelectorAll('[data-k]').forEach(function (e) { els[e.getAttribute('data-k')] = e; });
    els.parts.innerHTML = cfg.parts.map(function (p) {
      var s = part(p.id);
      return '<div class="rgm-part"><input type="checkbox" data-on="' + p.id + '" aria-label="Send ' + p.label + '"' + (s.on ? ' checked' : '') + '><span>' + p.label + (p.hint ? '<small>' + p.hint + '</small>' : '') + '</span>' +
        '<select data-ch="' + p.id + '" aria-label="' + p.label + ' channel">' + chans(s.ch) + '</select>' +
        (p.kind === 'note' ? (p.drumAlt ? '<select data-as="' + p.id + '" aria-label="' + p.label + ' plays"><option value="notes">Notes</option><option value="drum">A drum</option></select>' : '<select data-oct="' + p.id + '" aria-label="' + p.label + ' octave"><option value="-2">-2 oct</option><option value="-1">-1 oct</option><option value="0">Octave</option><option value="1">+1 oct</option><option value="2">+2 oct</option></select>') : '<span></span>') + '</div>';
    }).join('');
    els.parts.addEventListener('change', function (e) {
      var t = e.target, id;
      if ((id = t.getAttribute('data-on'))) part(id).on = t.checked;
      else if ((id = t.getAttribute('data-ch'))) { API.allOff(); part(id).ch = +t.value; lastProg = {}; }
      else if ((id = t.getAttribute('data-oct'))) { API.allOff(); part(id).oct = +t.value; }
      else if ((id = t.getAttribute('data-as'))) part(id).as = t.value;
      save();
    });
    els.close.addEventListener('click', API.close);
    panel.addEventListener('pointerdown', function (e) { if (e.target === panel) API.close(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel && !panel.hidden) { e.stopPropagation(); API.close(); } }, true);
    els.out.addEventListener('change', function () { S.out = els.out.value; S.outName = ''; save(); pick(); });
    els.preset.addEventListener('change', function () { API.allOff(); S.preset = els.preset.value; save(); paint(); });
    els.nudge.addEventListener('input', function () { S.nudge = +els.nudge.value; save(); paint(); });
    els.gate.addEventListener('input', function () { S.gate = +els.gate.value; save(); paint(); });
    els.vel.addEventListener('change', function () { S.vel = els.vel.value; save(); });
    var tog = function (k, fn) { if (els[k]) els[k].addEventListener('click', function () { S[k] = !S[k]; save(); if (fn) fn(S[k]); light(); paint(); }); };
    tog('on', function (v) { if (!v) API.panic(); else if (running && S.clock) raw([0xFA]); });
    tog('clock'); tog('cc');
    tog('mute', function (v) { try { cfg.mute(v); } catch (e) {} });
    els.test.addEventListener('click', function () {
      if (!out) { say('No MIDI device found yet.'); return; }
      var was = S.on; S.on = true;
      var d = cfg.parts.find(function (p) { return p.kind === 'drum'; }), n = cfg.parts.find(function (p) { return p.kind === 'note'; });
      if (d) ['kick', 'snare', 'closed hat', 'clap'].forEach(function (nm, i) { var tg = drumTarget(nm, { part: d.id, idx: i }); sendNote(tg.ch, tg.note, 100, performance.now() + i * 180, 60, nm); });
      else if (n) { var p = part(n.id); [60, 64, 67].forEach(function (m, i) { sendNote(p.ch - 1, m, 100, performance.now() + i * 180, 160, n.label); }); }
      S.on = was; paintMon();
    });
    els.panic.addEventListener('click', function () { API.panic(); say('All notes off sent on every channel.'); });
  }
  function paint() {
    if (!panel) return;
    var list = outputs();
    els.out.innerHTML = '<option value="">None</option>' + list.map(function (o) { return '<option value="' + o.id + '">' + o.name + '</option>'; }).join('');
    els.out.value = out ? out.id : '';
    els.preset.value = S.preset; els.pnote.textContent = PRESETS[S.preset][1];
    els.nudge.value = S.nudge; els.nudgeV.textContent = S.nudge === 0 ? 'none' : (S.nudge > 0 ? S.nudge + ' ms later' : -S.nudge + ' ms sooner');
    els.gate.value = S.gate; els.gateV.textContent = S.gate + '%';
    els.vel.value = S.vel;
    cfg.parts.forEach(function (p) { var s = part(p.id), a = els.parts.querySelector('[data-as="' + p.id + '"]'), o = els.parts.querySelector('[data-oct="' + p.id + '"]'); if (a) a.value = s.as; if (o) o.value = s.oct; });
    ['on', 'clock', 'cc', 'mute'].forEach(function (k) { if (els[k]) els[k].setAttribute('aria-pressed', String(!!S[k])); });
    els.on.textContent = S.on ? 'Sending' : 'Send MIDI';
    if (navigator.requestMIDIAccess) say(!access ? 'Looking for MIDI devices.' : !list.length ? 'No MIDI device found. Plug one in and it will show up here.' : !out ? 'Pick where the music should go.' : S.on ? 'Sending to ' + out.name + '.' : 'Ready. Press Send MIDI.');
    paintMon();
  }
  function paintMon() {
    if (!els.mon) return;
    els.mon.innerHTML = mon.length ? mon.map(function (m) { return '<b>' + m[0] + '</b> ch ' + m[1] + ' note ' + m[2]; }).join(' &nbsp;·&nbsp; ') : 'Nothing sent yet. Press Play, or Test.';
  }

  window.RGMidi = API;
})();
