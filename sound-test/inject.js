  // ===== SOUND TEST (only in sound-test.html) =====
  // Swaps the sounds for MusyngKite General MIDI (gleitz/midi-js-soundfonts) and Tidal drum machines (ritchse/tidal-drum-machines).
  const ST = (() => {
    const GM_URLS = ["https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/MusyngKite/", "https://gleitz.github.io/midi-js-soundfonts/MusyngKite/"];
    const TIDAL_BASE = "https://raw.githubusercontent.com/ritchse/tidal-drum-machines/main/machines/";
    const TIDAL_JSON = "https://raw.githubusercontent.com/felixroos/dough-samples/main/tidal-drum-machines.json";
    // voice id -> General MIDI instrument. g: level, a: attack, h: hold (x note length), r: release, lp: optional lowpass
    const GM = {
      felt: { i: "acoustic_grand_piano", g: 0.5, a: 0.004, h: 1.3, r: 0.4, lp: 2200 },
      piano: { i: "acoustic_grand_piano", g: 0.6, a: 0.003, h: 1.6, r: 0.5 },
      flute: { i: "flute", g: 0.55, a: 0.06, h: 0.9, r: 0.5 },
      mallet: { i: "vibraphone", g: 0.55, a: 0.003, h: 1.4, r: 0.6 },
      bowed: { i: "cello", g: 0.5, a: 0.7, h: 1.2, r: 1.2 },
      pluck: { i: "pizzicato_strings", g: 0.7, a: 0.002, h: 0.5, r: 0.3 },
      string: { i: "acoustic_guitar_nylon", g: 0.6, a: 0.002, h: 1.0, r: 0.4 },
      epiano: { i: "electric_piano_1", g: 0.5, a: 0.003, h: 1.2, r: 0.5 },
      bell: { i: "tubular_bells", g: 0.45, a: 0.002, h: 2.0, r: 0.8 },
      kalimba: { i: "kalimba", g: 0.65, a: 0.002, h: 0.9, r: 0.4 },
      marimba: { i: "marimba", g: 0.6, a: 0.002, h: 0.8, r: 0.4 },
      soft: { i: "lead_3_calliope", g: 0.4, a: 0.03, h: 0.9, r: 0.4 },
      breath: { i: "pan_flute", g: 0.5, a: 0.08, h: 0.9, r: 0.5 },
      pad: { i: "pad_2_warm", g: 0.4, a: 0.5, h: 1.5, r: 1.2 },
      choir: { i: "choir_aahs", g: 0.45, a: 0.3, h: 1.3, r: 0.9 },
      acid: { i: "synth_bass_1", g: 0.5, a: 0.005, h: 0.5, r: 0.2 },
      sub: { i: "synth_bass_2", g: 0.55, a: 0.005, h: 0.9, r: 0.3 },
      organ: { i: "drawbar_organ", g: 0.4, a: 0.01, h: 0.9, r: 0.15 },
      harp: { i: "orchestral_harp", g: 0.6, a: 0.002, h: 1.6, r: 0.6 },
      junopad: { i: "pad_1_new_age", g: 0.4, a: 0.5, h: 1.5, r: 1.2 },
      junostrings: { i: "string_ensemble_1", g: 0.4, a: 0.25, h: 1.3, r: 0.8 },
      junokeys: { i: "electric_piano_2", g: 0.5, a: 0.003, h: 1.0, r: 0.4 },
      graincloud: { i: "fx_4_atmosphere", g: 0.4, a: 0.5, h: 1.6, r: 1.2 },
      grainshimmer: { i: "fx_3_crystal", g: 0.45, a: 0.02, h: 1.4, r: 0.9 },
      graindust: { i: "fx_1_rain", g: 0.4, a: 0.1, h: 1.0, r: 0.6 },
      handdrum: { i: "melodic_tom", g: 0.7, a: 0.002, h: 0.4, r: 0.2 },
      woodblock: { i: "woodblock", g: 0.7, a: 0.001, h: 0.15, r: 0.1 },
      tongue: { i: "steel_drums", g: 0.55, a: 0.002, h: 1.2, r: 0.6 }
    };
    // voice id -> Tidal drum type. perc: filename test for the conga family. g: level
    const DR = {
      kick: { t: "bd", g: 0.9 }, snare: { t: "sd", g: 0.7 }, hat: { t: "hh", g: 0.45 }, rimshot: { t: "rim", g: 0.6 },
      cowbell: { t: "cb", g: 0.45 }, shaker: { t: "sh", g: 0.5 }, drum: { t: "mt", g: 0.8 }, clave: { t: "perc", re: /^CL\b|clave/i, g: 0.6 },
      conga: { t: "perc", re: /^(MC|Conga M)/i, k: 2, g: 0.7 }, congahi: { t: "perc", re: /^(HC|Conga H)/i, g: 0.65 },
      congamid: { t: "perc", re: /^(MC|Conga M)/i, g: 0.7 }, congalo: { t: "perc", re: /^(LC|Conga L)/i, g: 0.75 }
    };
    const MACHINES = [["RolandTR808", "Roland TR-808"], ["RolandTR909", "Roland TR-909"], ["LinnDrum", "LinnDrum"], ["RolandTR707", "Roland TR-707"], ["OberheimDMX", "Oberheim DMX"], ["AkaiLinn", "Akai Linn"], ["YamahaRX5", "Yamaha RX5"], ["BossDR55", "Boss DR-55"]];
    const st = { on: !/[?&]sounds=original/.test(location.search), machine: "RolandTR808", list: null };
    const banks = {}, drums = {};
    const midiOf = n => { const m = n.match(/^([A-G])(b?)(\d)$/); return 12 * (+m[3] + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] - (m[2] ? 1 : 0); };
    async function fetchText(name) {
      let err;
      for (const base of GM_URLS) { try { const r = await fetch(base + name + "-mp3.js"); if (r.ok) return await r.text(); err = r.status; } catch (e) { err = e; } }
      throw new Error("soundfont " + name + " " + err);
    }
    function loadBank(inst) {
      if (banks[inst]) return banks[inst];
      const bank = banks[inst] = { list: [], ready: false, failed: false };
      fetchText(inst).then(async txt => {
        const re = /"?([A-G]b?\d)"?\s*:\s*"data:audio\/[a-z0-9]+;base64,([^"]+)"/g; let m; const out = [];
        while ((m = re.exec(txt))) {
          const bin = atob(m[2]), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
          try { out.push({ midi: midiOf(m[1]), buf: await ac.decodeAudioData(u8.buffer) }); } catch (e) {}
        }
        bank.list = out.sort((a, b) => a.midi - b.midi); bank.ready = out.length > 0; bank.failed = !bank.ready; status();
      }).catch(() => { bank.failed = true; status(); });
      return bank;
    }
    function nearest(bank, midi) {
      let best = bank.list[0];
      for (const x of bank.list) if (Math.abs(x.midi - midi) < Math.abs(best.midi - midi)) best = x;
      return best;
    }
    function drumFile(voice) {
      const s = DR[voice]; if (!st.list) return null;
      for (const mach of [st.machine, "RolandTR808"]) {
        let files = st.list[mach + "_" + s.t]; if (!files || !files.length) continue;
        if (s.re) { files = files.filter(f => s.re.test(f.split("/").pop())); if (!files.length) continue; }
        return files[Math.min(files.length - 1, Math.floor(files.length / 3) + (s.k || 0))];
      }
      return null;
    }
    function loadDrum(url) {
      if (drums[url]) return drums[url];
      const d = drums[url] = { buf: null, norm: 1, failed: false };
      fetch(TIDAL_BASE + url.split("/").map(encodeURIComponent).join("/")).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(a => ac.decodeAudioData(a)).then(buf => {
          let pk = 0; for (let ch = 0; ch < buf.numberOfChannels; ch++) { const x = buf.getChannelData(ch); for (let i = 0; i < x.length; i++) { const v = Math.abs(x[i]); if (v > pk) pk = v; } }
          d.norm = pk > 0 ? 0.9 / pk : 1; d.buf = buf; status();
        }).catch(() => { d.failed = true; });
      return d;
    }
    // The Groove grid's drum kit (drumHit in the rhythm section): the same Tidal machine, one sample per drum
    const KIT = { kick: { t: "bd", g: 0.9 }, snare: { t: "sd", g: 0.7 }, hat: { t: "hh", g: 0.45 }, rim: { t: "rim", g: 0.6 } };
    function playKit(kind, out, t, vel) {
      const s = KIT[kind]; if (!s || !st.list || !ac) return false;
      const pick = mach => { const files = st.list[mach + "_" + s.t]; return files && files.length ? files[Math.min(files.length - 1, Math.floor(files.length / 3))] : null; };
      const f = pick(st.machine) || pick("RolandTR808"); if (!f) return false;
      const d = loadDrum(f); if (!d.buf) return false;
      const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = d.buf;
      g.gain.value = s.g * d.norm * Math.min(1.2, vel);
      src.connect(g).connect(out); src.start(t);
      return true;
    }
    function play(c, midi, vel, t, L) {
      const v = c.voice, b = buses.get(c); if (!ac || !b) return false;
      if (v === "sub" && loneAwake(c)) return false;
      if (GM[v]) {
        const P = GM[v], bank = loadBank(P.i); if (!bank.ready) return false;
        const x = nearest(bank, midi), env = ac.createGain(), src = ac.createBufferSource();
        src.buffer = x.buf; src.playbackRate.value = Math.pow(2, (midi - x.midi) / 12);
        const lvl = P.g * Math.min(1.2, vel), hold = Math.max(0.08, P.h * L);
        env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(lvl, t + P.a);
        env.gain.setValueAtTime(lvl, t + Math.max(P.a, hold)); env.gain.setTargetAtTime(0, t + Math.max(P.a, hold), P.r / 3);
        if (P.lp) { const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = P.lp; src.connect(lp).connect(env); } else src.connect(env);
        env.connect(b.input);
        src.start(t); src.stop(t + hold + P.r * 2 + 0.2);
        return true;
      }
      if (DR[v]) {
        const f = drumFile(v); if (!f) return false;
        const d = loadDrum(f); if (!d.buf) return false;
        const env = ac.createGain(), src = ac.createBufferSource(); src.buffer = d.buf;
        env.gain.value = DR[v].g * d.norm * Math.min(1.2, vel); src.connect(env).connect(b.input); src.start(t);
        return true;
      }
      return false;
    }
    // warm up whatever the three cities are using now
    function ensure() {
      if (!st.on || !ac) return;
      try {
        ["kick", "snare", "hat", "rim"].forEach(k => { const t = st.machine + "_" + KIT[k].t; const files = st.list && (st.list[t] || st.list["RolandTR808_" + KIT[k].t]); if (files && files.length) loadDrum(files[Math.min(files.length - 1, Math.floor(files.length / 3))]); });
        cities.forEach(c => { const v = c.voice; if (GM[v]) loadBank(GM[v].i); else if (DR[v]) { const f = drumFile(v); if (f) loadDrum(f); } });
      } catch (e) {}
    }
    setInterval(ensure, 800);
    const TYPE_NAME = { bd: "Kick", sd: "Snare", rim: "Rim", cp: "Clap", hh: "Closed hat", oh: "Open hat", cr: "Cymbal", rd: "Ride", sh: "Shaker", cb: "Cowbell", tb: "Tambourine", ht: "High tom", mt: "Mid tom", lt: "Low tom", perc: "Percussion", fx: "FX", misc: "Other", "": "Other" };
    const TYPE_ORDER = ["bd", "sd", "rim", "cp", "hh", "oh", "cr", "rd", "sh", "cb", "tb", "ht", "mt", "lt", "perc", "fx", "misc", ""];
    const niceName = m => m.replace(/([a-z])([A-Z0-9])/g, "$1 $2");
    // every machine in the library, with its drum types: { machine: { type: [files] } }
    function library() {
      const out = {};
      Object.keys(st.list || {}).forEach(k => { const i = k.lastIndexOf("_"), m = k.slice(0, i), t = k.slice(i + 1); (out[m] = out[m] || {})[t] = st.list[k]; });
      return out;
    }
    function fillMachines() {
      const sel = bar && bar.querySelector("select"); if (!sel || !st.list) return;
      const lib = library(), names = Object.keys(lib).sort((a, b) => niceName(a).localeCompare(niceName(b)));
      sel.innerHTML = names.map(m => '<option value="' + m + '">' + niceName(m) + '</option>').join("");
      if (!lib[st.machine]) st.machine = "RolandTR808";
      sel.value = st.machine; renderShelf();
    }
    // the drum shelf: every drum type of the chosen machine, with its samples to step through and play
    const idx = {};
    function preview(url) {
      const d = loadDrum(url), go = () => { const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = d.buf; g.gain.value = 0.9 * d.norm; src.connect(g).connect(ac.destination); src.start(); };
      if (d.buf) go(); else setTimeout(() => { if (d.buf) go(); }, 900);
    }
    function renderShelf() {
      const box = document.getElementById("stShelf"); if (!box) return;
      const lib = library()[st.machine] || {};
      const types = Object.keys(lib).sort((a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b));
      box.innerHTML = types.length ? "" : '<p style="margin:0;color:#93A0AD">This machine has no samples in the library.</p>';
      types.forEach(t => {
        const files = lib[t], key = st.machine + "|" + t, row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #2A3643";
        const b = (label, fn) => { const x = document.createElement("button"); x.type = "button"; x.textContent = label; x.style.cssText = "all:unset;cursor:pointer;padding:4px 9px;border-radius:7px;border:1px solid #6F8CFF"; x.addEventListener("click", fn); return x; };
        const name = document.createElement("span"); name.style.cssText = "flex:1;min-width:110px";
        const show = () => { name.textContent = (TYPE_NAME[t] || t) + "  " + ((idx[key] || 0) + 1) + " of " + files.length; };
        const step = d => { idx[key] = ((idx[key] || 0) + d + files.length) % files.length; show(); };
        row.append(name, b("◀", () => step(-1)), b("▶", () => step(1)), b("Play", () => preview(files[idx[key] || 0])));
        show(); box.appendChild(row);
      });
    }
    fetch(TIDAL_JSON).then(r => r.json()).then(j => { st.list = j; fillMachines(); status(); }).catch(() => {});
    // the little bar
    let bar, stat, shelf;
    function status() {
      if (!stat) return;
      const bs = Object.values(banks), ds = Object.values(drums);
      const total = bs.length + ds.length, ready = bs.filter(x => x.ready).length + ds.filter(x => x.buf).length, bad = bs.filter(x => x.failed).length + ds.filter(x => x.failed).length;
      stat.textContent = !st.on ? "Original sounds" : (total ? "Loaded " + ready + " of " + total + (bad ? " · " + bad + " failed" : "") : "Waiting for a sound");
    }
    function mount() {
      bar = document.createElement("div");
      bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "Sound test");
      bar.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:99999;display:flex;gap:10px;align-items:center;flex-wrap:wrap;max-width:calc(100vw - 24px);padding:8px 12px;border-radius:12px;background:#17202A;color:#E6EBF0;font:12px/1.3 ui-monospace,Menlo,monospace;box-shadow:0 4px 18px rgba(0,0,0,.35)";
      bar.innerHTML = '<b style="letter-spacing:.08em">SOUND TEST</b>' +
        '<button type="button" data-m="on" style="all:unset;cursor:pointer;padding:5px 10px;border-radius:8px;border:1px solid #6F8CFF">MusyngKite + Tidal</button>' +
        '<button type="button" data-m="off" style="all:unset;cursor:pointer;padding:5px 10px;border-radius:8px;border:1px solid #6F8CFF">Original</button>' +
        '<button type="button" data-shelf style="all:unset;cursor:pointer;padding:5px 10px;border-radius:8px;border:1px solid #6F8CFF">Drum shelf</button>' +
        '<label style="display:flex;gap:6px;align-items:center">Drum machine <select style="font:inherit;color:#18222D;background:#E6EBF0;border:0;border-radius:6px;padding:3px 4px;max-width:200px"><option>Loading…</option></select></label>' +
        '<span data-s style="opacity:.75"></span>';
      shelf = document.createElement("div"); shelf.id = "stShelf";
      shelf.style.cssText = "position:fixed;left:12px;bottom:70px;z-index:99998;width:min(520px,calc(100vw - 24px));max-height:55vh;overflow:auto;padding:12px 14px;border-radius:12px;background:#17202A;color:#E6EBF0;font:13px/1.3 ui-monospace,Menlo,monospace;box-shadow:0 4px 18px rgba(0,0,0,.35)";
      shelf.hidden = true;
      document.body.append(shelf, bar); stat = bar.querySelector("[data-s]");
      bar.querySelector("[data-shelf]").addEventListener("click", () => { shelf.hidden = !shelf.hidden; renderShelf(); });
      const paint = () => bar.querySelectorAll("button").forEach(b => { const on = (b.dataset.m === "on") === st.on; b.style.background = on ? "#6F8CFF" : "transparent"; b.style.color = on ? "#0B1020" : "#E6EBF0"; b.setAttribute("aria-pressed", on); });
      bar.querySelectorAll("button").forEach(b => b.addEventListener("click", () => { st.on = b.dataset.m === "on"; paint(); status(); ensure(); }));
      bar.querySelector("select").addEventListener("change", e => { st.machine = e.target.value; ensure(); renderShelf(); });
      paint(); status();
    }
    if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
    window.__ST = { st, banks, drums, GM, DR, loadBank, drumFile, loadDrum };
    return { get on() { return st.on; }, play, playKit, st, banks, drums };
  })();
