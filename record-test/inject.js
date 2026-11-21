  // ---------- Record test: sounds you record yourself, with MIDI on the side ----------
  // Each city has two sides: audio (your recording, played here) and MIDI (the same notes, sent out on its own channel).
  // Either side can be switched off. The recording is trimmed, then cut up and shaped by the loop, like "Your sample".
  const STUDIO = (() => {
    const DEF = () => ({ slice: "even", dir: "fwd", ftype: "lowpass", fLo: 220, fHi: 14000, q: 3, spread: 100, drift: 100, root: "auto", edge: "xfade30", snap: true, t0: 0, t1: 1 });
    const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const MAXSEC = 60;
    const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
    const io = { stream: null, src: null, an: null, node: null, owner: null, chunks: [[], []], frames: 0, recording: false, t0: 0, raf: 0, devId: lsGet("tc-rec-dev") || "", ch: lsGet("tc-rec-ch") || "auto", nch: Number(lsGet("tc-rec-nch")) || 2, peaks: [], pick: [0], worklet: false };
    const WORKLET = `class RecTap extends AudioWorkletProcessor {
      constructor() { super(); this.on = false; this.pick = [0]; this.pk = []; this.n = 0; this.port.onmessage = e => { if (e.data.pick) this.pick = e.data.pick; if ("on" in e.data) this.on = !!e.data.on; }; }
      process(inputs) {
        const x = inputs[0]; if (!x || !x.length || !x[0].length) return true;
        for (let c = 0; c < x.length; c++) { let m = this.pk[c] || 0; const a = x[c]; for (let i = 0; i < a.length; i++) { const v = a[i] < 0 ? -a[i] : a[i]; if (v > m) m = v; } this.pk[c] = m; }
        this.n += x[0].length;
        if (this.n >= 2048) { this.port.postMessage({ peaks: this.pk.slice() }); this.pk = []; this.n = 0; }
        if (this.on) { const out = this.pick.map(c => (x[c] || x[0]).slice()); this.port.postMessage({ chunk: out }, out.map(a => a.buffer)); }
        return true;
      }
    }
    registerProcessor("rec-tap", RecTap);`;
    const idx = c => cities.indexOf(c);
    // saved on this device
    const DB = () => new Promise((res, rej) => { const r = indexedDB.open("three-cities-record", 1); r.onupgradeneeded = () => r.result.createObjectStore("slots"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    async function dbSet(key, val) { try { const db = await DB(); await new Promise((res, rej) => { const tx = db.transaction("slots", "readwrite"); tx.objectStore("slots").put(val, key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); db.close(); } catch (e) {} }
    async function dbGet(key) { try { const db = await DB(); const v = await new Promise((res, rej) => { const r = db.transaction("slots").objectStore("slots").get(key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); db.close(); return v; } catch (e) { return null; } }
    async function dbDel(key) { try { const db = await DB(); await new Promise(res => { const tx = db.transaction("slots", "readwrite"); tx.objectStore("slots").delete(key); tx.oncomplete = res; tx.onerror = res; }); db.close(); } catch (e) {} }
    const saveOpts = c => { clearTimeout(c.rec.saveT); c.rec.saveT = setTimeout(() => { const { slice, dir, ftype, fLo, fHi, q, spread, drift, root, edge, snap, t0, t1 } = c.rec; dbSet("opts" + idx(c), { slice, dir, ftype, fLo, fHi, q, spread, drift, root, edge, snap, t0, t1, ref: c.samp ? c.samp.ref || 0 : 0, audioOff: !!c.recMute, midiOff: !!c.recNoMidi }); }, 400); };

    // ----- the input -----
    async function fillDevices() {
      try {
        const list = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "audioinput");
        cities.forEach(c => {
          const sel = c.rec && c.rec.ui && c.rec.ui.dev; if (!sel) return;
          sel.innerHTML = '<option value="">Default input</option>' + list.map((d, i) => `<option value="${d.deviceId.replace(/"/g, "")}">${(d.label || "Input " + (i + 1)).replace(/</g, "&lt;")}</option>`).join("");
          sel.value = list.some(d => d.deviceId === io.devId) ? io.devId : "";
        });
      } catch (e) {}
    }
    // which channels of the interface to listen to: one you choose, or the loudest ones (up to eight)
    function setPick() { const n = io.nch, k = io.ch === "auto" ? -1 : Math.min(Number(io.ch), n - 1); io.pick = k < 0 ? Array.from({ length: Math.min(n, 8) }, (_, i) => i) : [k]; if (io.node) io.node.port.postMessage({ pick: io.pick }); }
    function fillChannels() {
      if (io.ch !== "auto" && Number(io.ch) >= io.nch) { io.ch = "auto"; lsSet("tc-rec-ch", "auto"); }
      cities.forEach(c => {
        const sel = c.rec && c.rec.ui && c.rec.ui.ch; if (!sel) return;
        sel.innerHTML = '<option value="auto">Auto (the loudest)</option>' + Array.from({ length: io.nch }, (_, i) => `<option value="${i}">Input ${i + 1}</option>`).join("");
        sel.value = io.ch;
      });
    }
    function closeInput() {
      cancelAnimationFrame(io.raf);
      if (io.stream) io.stream.getTracks().forEach(t => t.stop());
      try { io.src && io.src.disconnect(); io.node && io.node.disconnect(); } catch (e) {}
      if (io.owner && io.owner.rec && io.owner.rec.ui) { io.owner.rec.ui.meter.style.width = "0%"; io.owner.rec.ui.check.setAttribute("aria-pressed", "false"); io.owner.rec.ui.check.textContent = "Check level"; }
      io.stream = io.src = io.node = null; io.owner = null; io.peaks = [];
    }
    async function openInput(c) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("This browser can't reach an input here. It needs a secure (https) page.");
      if (!window.AudioWorkletNode) throw new Error("This browser can't record here. Try Chrome or Safari.");
      if (!ac) setupAudio();
      if (ac.state === "suspended") await ac.resume();
      closeInput();
      const audio = { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 32 } };
      if (io.devId) audio.deviceId = { exact: io.devId };
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio }); }
      catch (e) { if (io.devId && e.name === "OverconstrainedError") { io.devId = ""; delete audio.deviceId; stream = await navigator.mediaDevices.getUserMedia({ audio }); } else throw e; }
      io.stream = stream; io.owner = c;
      io.src = ac.createMediaStreamSource(stream);
      const got = (stream.getAudioTracks()[0].getSettings().channelCount) || 2; io.nch = got; lsSet("tc-rec-nch", String(got));
      if (!io.worklet) { const url = URL.createObjectURL(new Blob([WORKLET], { type: "text/javascript" })); await ac.audioWorklet.addModule(url); io.worklet = true; }
      io.node = new AudioWorkletNode(ac, "rec-tap", { numberOfInputs: 1, numberOfOutputs: 0, channelCount: got, channelCountMode: "explicit", channelInterpretation: "discrete" });
      io.src.connect(io.node);
      setPick();
      io.node.port.onmessage = e => {
        if (e.data.peaks) { io.peaks = e.data.peaks; return; }
        if (!io.recording || !e.data.chunk) return;
        e.data.chunk.forEach((a, i) => { if (io.chunks[i]) io.chunks[i].push(a); });
        io.frames += e.data.chunk[0].length;
        if (io.frames > MAXSEC * ac.sampleRate) stopRec(io.owner);
      };
      fillDevices(); fillChannels();
      const tick = () => {
        if (!io.node) return;
        let pk = 0; (io.ch === "auto" ? io.peaks : [io.peaks[Number(io.ch)] || 0]).forEach(v => { pk = Math.max(pk, v || 0); });
        io.lvl = Math.max(io.lvl || 0, pk); const ui = io.owner.rec.ui; ui.meter.style.width = Math.min(100, Math.sqrt(pk) * 100) + "%"; ui.meter.classList.toggle("hot", pk > 0.97);
        if (io.recording) ui.time.textContent = "Recording " + ((ac.currentTime - io.t0)).toFixed(1) + " s. Press Stop when you are done.";
        io.raf = requestAnimationFrame(tick);
      };
      tick();
    }
    async function startRec(c) {
      const ui = c.rec.ui;
      try {
        if (io.recording) await stopRec(io.owner);
        if (!io.stream || io.owner !== c) await openInput(c);
        setPick(); io.chunks = io.pick.map(() => []); io.frames = 0; io.t0 = ac.currentTime; io.recording = true; io.node.port.postMessage({ on: true });
        ui.go.textContent = "■ Stop"; ui.go.classList.add("on"); ui.check.hidden = true;
      } catch (e) {
        closeInput(); io.recording = false;
        ui.time.textContent = e && e.name === "NotAllowedError" ? "The browser said no to the input. Allow it for this page and try again." : (e && e.message) || "Couldn't open that input.";
      }
    }
    async function stopRec(c) {
      if (!io.recording) return;
      io.recording = false; try { io.node.port.postMessage({ on: false }); } catch (e) {}
      const ui = c.rec.ui; ui.go.textContent = "● Record"; ui.go.classList.remove("on"); ui.check.hidden = false;
      const sr = ac.sampleRate, chans = io.chunks.map(parts => { const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; parts.forEach(p => { out.set(p, o); o += p.length; }); return out; }).filter(a => a.length);
      closeInput();
      if (!chans.length || !chans[0].length) { ui.time.textContent = "Nothing came in. Check the input and try again."; return; }
      // on Auto: use the loudest input, or mix the two loudest when both are clearly live (a stereo pair)
      const rms = a => { let t = 0; for (let i = 0; i < a.length; i += 8) t += a[i] * a[i]; return Math.sqrt(t / (a.length / 8 || 1)); };
      let data;
      if (chans.length === 1) data = chans[0];
      else { const ranked = chans.map(a => ({ a, r: rms(a) })).sort((x, y) => y.r - x.r), A = ranked[0], B = ranked[1]; data = B.r > A.r * 0.5 ? A.a.map((v, i) => (v + B.a[i]) / 2) : A.a; }
      if (rms(data) < 0.0005) { ui.time.textContent = io.ch === "auto" ? "Nothing but silence came in. Check the level and the input." : `Input ${Number(io.ch) + 1} was silent. Pick another channel, or check the level with Check level.`; return; }
      newTake(c, data, sr, null);
    }

    // ----- a take, its trim, and the sound the city plays -----
    function newTake(c, data, sr, name) {
      const R = c.rec; R.raw = { data, sr }; R.name = name || "Recording"; R.t0 = 0; R.t1 = 1; R.peaks = null;
      ui_show(c); autoTrim(c, true);
      dbSet("raw" + idx(c), { data, sr, name: R.name });
    }
    function ui_show(c) { c.rec.ui.edit.hidden = false; }
    function autoTrim(c, first) {
      const R = c.rec, d = R.raw.data, sr = R.raw.sr; let pk = 0; for (let i = 0; i < d.length; i += 4) pk = Math.max(pk, Math.abs(d[i]));
      const th = Math.max(0.002, pk * 0.02); let a = 0, b = d.length - 1;
      while (a < b && Math.abs(d[a]) < th) a++; while (b > a && Math.abs(d[b]) < th) b--;
      a = Math.max(0, a - Math.round(sr * 0.005)); b = Math.min(d.length, b + Math.round(sr * 0.03));
      R.t0 = a / d.length; R.t1 = Math.max(R.t0 + 0.001, b / d.length);
      sync(c); apply(c, { key: first });
    }
    const zc = (d, i, w) => { for (let k = 0; k <= w; k++) for (const j of [i - k, i + k]) if (j > 0 && j < d.length && d[j - 1] * d[j] <= 0) return j; return i; };
    function cut(R) {
      const d = R.raw.data, sr = R.raw.sr, n = d.length; let a = Math.max(0, Math.floor(R.t0 * n)), b = Math.min(n, Math.floor(R.t1 * n));
      if (R.snap) { const w = Math.round(sr * 0.02); a = zc(d, a, w); b = zc(d, b, w); }
      if (b - a < sr * 0.02) b = Math.min(n, a + Math.round(sr * 0.02));
      const len = b - a; let out;
      if (R.edge.startsWith("xfade")) {   // the end melts into the start, so the loop has no join
        const x = Math.min(Math.round(sr * parseInt(R.edge.slice(5)) / 1000), len >> 1); out = new Float32Array(len - x);
        for (let i = 0; i < out.length; i++) out[i] = d[a + i];
        for (let i = 0; i < x; i++) { const p = i / x; out[i] = d[a + i] * Math.sin(p * Math.PI / 2) + d[a + len - x + i] * Math.cos(p * Math.PI / 2); }
      } else {
        out = d.slice(a, b);
        if (R.edge.startsWith("fade")) { const f = Math.min(Math.round(sr * parseInt(R.edge.slice(4)) / 1000), len >> 1); for (let i = 0; i < f; i++) { out[i] *= i / f; out[len - 1 - i] *= i / f; } }
      }
      return out;
    }
    function findOnsets(buf) {
      const d = buf.getChannelData(0), sr = buf.sampleRate, hop = Math.round(sr * 0.01), nf = Math.floor(d.length / hop), e = new Float32Array(nf); let pk = 0;
      for (let k = 0; k < nf; k++) { let s = 0; for (let i = 0; i < hop; i++) { const v = d[k * hop + i]; s += v * v; } e[k] = Math.sqrt(s / hop); pk = Math.max(pk, e[k]); }
      const on = [0]; let last = 0;
      for (let k = 5; k < nf && on.length < 32; k++) {
        let m = 0; for (let j = 1; j <= 5; j++) m += e[k - j]; m /= 5;
        if (e[k] > 0.08 * pk && e[k] > Math.max(2.2 * m, 0.02 * pk) && k - last > 8) { on.push(Math.max(0, (k - 1) * hop / sr)); last = k; }
      }
      return on;
    }
    function apply(c, o = {}) {
      const R = c.rec; if (!R.raw) return;
      const seg = cut(R); let pk = 0; for (let i = 0; i < seg.length; i += 2) pk = Math.max(pk, Math.abs(seg[i]));
      const buf = new AudioBuffer({ length: seg.length, sampleRate: R.raw.sr, numberOfChannels: 1 }); buf.copyToChannel(seg, 0);
      const old = c.samp || {};
      c.samp = Object.assign({}, old, { buf, name: R.name, norm: pk > 0.001 ? 0.9 / pk : 1, ref: old.ref || 0, onsets: findOnsets(buf), rev: null });
      c.voice = "sample"; c.ref.samp.hidden = false;
      const sel = c.el.querySelector("select[id$='-sound']"); if (sel) sel.value = "sample";
      const secs = buf.duration < 10 ? buf.duration.toFixed(2) : buf.duration.toFixed(1);
      c.ref.sampName.textContent = `${R.name} · ${secs} s`;
      R.ui.time.textContent = `Playing ${secs} s, trimmed from ${(R.raw.data.length / R.raw.sr).toFixed(1)} s. ${c.samp.onsets.length > 1 ? c.samp.onsets.length + " hits found." : "No clear hits found, so slices are even."}`;
      applySound(c); draw(c); saveOpts(c);
      if (o.key) matchSampleKey(c);
    }

    // ----- the waveform -----
    function peaks(R) { if (R.peaks) return R.peaks; const d = R.raw.data, N = 1200, per = Math.max(1, Math.floor(d.length / N)), out = new Float32Array(N * 2);
      for (let k = 0; k < N; k++) { let lo = 0, hi = 0; for (let i = k * per; i < Math.min(d.length, (k + 1) * per); i += Math.max(1, per >> 5)) { lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); } out[k * 2] = lo; out[k * 2 + 1] = hi; }
      return (R.peaks = out); }
    function draw(c) {
      const R = c.rec, ui = R.ui; if (!R.raw || ui.edit.hidden) return;
      const cv = ui.wave, dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 300, h = 96;
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = h * dpr; }
      const g2 = cv.getContext("2d"); g2.setTransform(dpr, 0, 0, dpr, 0, 0); g2.clearRect(0, 0, w, h);
      const cs = getComputedStyle(c.el), accent = cs.getPropertyValue("--accent").trim() || "#c98", ink = cs.getPropertyValue("--ink").trim() || "#eee";
      const x0 = R.t0 * w, x1 = R.t1 * w, p = peaks(R), N = p.length / 2;
      g2.fillStyle = "rgba(255,255,255,0.05)"; g2.fillRect(x0, 0, x1 - x0, h);
      for (let x = 0; x < w; x++) { const k = Math.min(N - 1, Math.floor(x / w * N)), lo = p[k * 2], hi = p[k * 2 + 1], inside = x >= x0 && x <= x1;
        g2.fillStyle = inside ? ink : "rgba(160,150,150,0.35)"; g2.fillRect(x, h / 2 - Math.max(1, hi * h * 0.48), 1, Math.max(1, (hi - lo) * h * 0.48)); }
      g2.fillStyle = accent; g2.fillRect(Math.max(0, x0 - 1), 0, 3, h); g2.fillRect(Math.min(w - 3, x1 - 1), 0, 3, h);
    }
    function sync(c) {
      const R = c.rec, ui = R.ui;
      ui.box.querySelectorAll("[data-opt]").forEach(b => { const [k, v] = b.dataset.opt.split(":"); b.setAttribute("aria-pressed", String(R[k] === v)); });
      ui.box.querySelectorAll("[data-v]").forEach(el => { const k = el.dataset.v; if (el.type === "range") { el.value = R[k]; const o = el.parentElement.querySelector("output"); if (o) o.textContent = k === "q" ? Number(R[k]).toFixed(1) : k === "spread" || k === "drift" ? R[k] + "%" : Math.round(R[k]) + " Hz"; } else el.value = R[k]; });
      ui.snap.setAttribute("aria-pressed", String(R.snap));
      ui.r0.value = Math.round(R.t0 * 1000); ui.r1.value = Math.round(R.t1 * 1000);
      ui.audio.setAttribute("aria-pressed", String(!c.recMute)); ui.midi.setAttribute("aria-pressed", String(!c.recNoMidi));
      draw(c);
    }

    // ----- play: the city's note through your recording -----
    function reversed(buf) { const r = new AudioBuffer({ length: buf.length, sampleRate: buf.sampleRate, numberOfChannels: buf.numberOfChannels }); for (let ch = 0; ch < buf.numberOfChannels; ch++) { const s = buf.getChannelData(ch), t = r.getChannelData(ch); for (let i = 0; i < s.length; i++) t[i] = s[s.length - 1 - i]; } return r; }
    function play(c, midi, vel, t, L) {
      const sp = c.samp, R = c.rec; if (!sp || !sp.buf || !R) return false;
      const buf = sp.buf, sh = c.sampShape, steps = c.steps || 1, idx0 = c.pos % steps, ph = idx0 / steps;
      if (c._rpos !== undefined && idx0 < c._rpos) c._rlap = (c._rlap || 0) + 1; c._rpos = idx0;
      const rev = R.dir === "rev" || (R.dir === "alt" && (c._rlap || 0) % 2 === 1);
      const ref = R.root === "auto" ? (sp.ref || 0) : Number(R.root);
      const rate = sh.pitch ? Math.pow(2, (midi - 60 - ref) / 12) : 1;
      let v = vel; if (sh.vel) v *= 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(ph * 2 * Math.PI));
      const flt = ac.createBiquadFilter(); flt.type = R.ftype;
      if (sh.filter) { const lo = R.fLo, hi = Math.max(lo * 1.5, R.fHi), p = R.ftype === "highpass" ? 1 - ph : ph; flt.frequency.value = lo * Math.pow(hi / lo, p); flt.Q.value = R.q; }
      else { flt.frequency.value = R.ftype === "highpass" ? 20 : 16000; flt.Q.value = 0.5; }
      const dur = buf.duration, drift = (c._sampDrift || 0) * (R.drift / 100);
      let off = 0, maxLen = dur;
      if (sh.start) {
        if (R.slice === "hits" && sp.onsets && sp.onsets.length > 1) { const o = sp.onsets, k = (idx0 + Math.round(drift * o.length)) % o.length; off = o[k]; maxLen = (o[k + 1] !== undefined ? o[k + 1] : dur) - off; }
        else { const where = (ph * R.spread / 100 + drift) % 1; off = where * Math.max(0, dur - 0.06); maxLen = dur - off; }
      }
      const hold = Math.max(0.05, Math.min(maxLen / rate, 0.18 + 0.85 * L)), len = Math.min(maxLen, hold * rate);
      const src = ac.createBufferSource(); let at = off;
      if (rev) { if (!sp.rev) sp.rev = reversed(buf); src.buffer = sp.rev; at = Math.max(0, dur - off - len); } else src.buffer = buf;
      src.playbackRate.value = rate;
      const b0 = buses.get(c), env0 = ac.createGain(); env0.connect(b0.input); env0.gain.setValueAtTime(0, t);
      const lvl = SAMPLE_USER_G * sp.norm * v;
      src.connect(flt).connect(env0);
      env0.gain.linearRampToValueAtTime(lvl, t + 0.004); env0.gain.setValueAtTime(lvl, t + hold); env0.gain.linearRampToValueAtTime(0, t + hold + 0.08);
      src.start(t, at); src.stop(t + hold + 0.12);
      return true;
    }
    function wav(c) {
      const buf = c.samp.buf, d = buf.getChannelData(0), n = d.length, sr = buf.sampleRate, ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
      const k = c.samp.norm; for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i] * k)) * 32767, true);
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ab], { type: "audio/wav" })); a.download = `Three Cities - ${c.name} recording.wav`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
    let prev = null;
    function preview(c) {
      if (prev) { try { prev.src.stop(); } catch (e) {} const same = prev.c === c; prev.c.rec.ui.prev.setAttribute("aria-pressed", "false"); prev = null; if (same) return; }
      if (!c.samp || !c.samp.buf) return; if (!ac) setupAudio(); if (ac.state === "suspended") ac.resume();
      const src = ac.createBufferSource(), g3 = ac.createGain(); src.buffer = c.samp.buf; src.loop = true; g3.gain.value = 0.5 * c.samp.norm * 0.6; src.connect(g3).connect(ac.destination); src.start();
      prev = { src, c }; c.rec.ui.prev.setAttribute("aria-pressed", "true");
    }

    // ----- the panel on each city -----
    function mount(c) {
      const R = c.rec = Object.assign(DEF(), { raw: null, name: "Recording", peaks: null });
      const box = document.createElement("div"); box.className = "rec";
      box.innerHTML = `
        <div class="rec-sides" role="group" aria-label="${c.name} sides">
          <span class="samp-label">This city plays</span>
          <button type="button" data-k="audio" aria-pressed="true" title="Your recording, played here in the browser">Audio</button>
          <button type="button" data-k="midi" aria-pressed="true" title="The same notes, sent out as MIDI on this city's channel. Choose the output and channel in the MIDI section">MIDI</button>
        </div>
        <div class="rec-row">
          <label class="rec-in">Input <select data-k="dev" aria-label="Audio input"><option value="">Default input</option></select></label>
          <label class="rec-in">Channel <select data-k="ch" aria-label="Input channel on the interface"><option value="auto">Auto (the loudest)</option></select></label>
          <button type="button" class="samp-load" data-k="check" aria-pressed="false">Check level</button>
          <button type="button" class="samp-load rec-go" data-k="go">● Record</button>
        </div>
        <div class="rec-meter" aria-hidden="true"><i data-k="meter"></i></div>
        <div class="rec-time" data-k="time" aria-live="polite">Pick your input and press Record. Up to a minute. Raw sound, with no echo or noise clean-up.</div>
        <div class="rec-edit" data-k="edit" hidden>
          <canvas class="rec-wave" data-k="wave" height="96" role="img" aria-label="The recording. The bright part is what plays."></canvas>
          <div class="rec-trim">
            <label>Start <input type="range" min="0" max="1000" step="1" data-k="r0"></label>
            <label>End <input type="range" min="0" max="1000" step="1" data-k="r1"></label>
          </div>
          <div class="samp-shape" role="group" aria-label="Trim">
            <span class="samp-label">Trim</span>
            <button type="button" data-k="prev" aria-pressed="false" title="Hear it loop, to check the join">▶ Loop it</button>
            <button type="button" data-k="auto" title="Cut the silence from both ends">Auto trim</button>
            <button type="button" data-k="snap" aria-pressed="true" title="Move the edges to the nearest quiet point, so nothing clicks">Snap to quiet</button>
            <select data-v="edge" aria-label="Loop edge" title="How the end meets the start"><option value="none">Edge: none</option><option value="fade10">Edge: tiny fade</option><option value="xfade30">Edge: smooth join</option><option value="xfade100">Edge: long join</option></select>
            <button type="button" data-k="wav">Save WAV</button>
            <button type="button" data-k="clear">Clear</button>
          </div>
        </div>
        <div class="rec-shape">
          <div class="samp-shape" role="group" aria-label="Slices"><span class="samp-label">Slices</span>
            <button type="button" data-opt="slice:even" title="The steps move evenly across the sound">Even</button>
            <button type="button" data-opt="slice:hits" title="Each step plays one hit found in the sound, up to its next hit">At the hits</button></div>
          <div class="samp-shape" role="group" aria-label="Direction"><span class="samp-label">Direction</span>
            <button type="button" data-opt="dir:fwd">Forward</button><button type="button" data-opt="dir:rev">Backwards</button><button type="button" data-opt="dir:alt" title="Forward, then backwards on the next lap">Back and forth</button></div>
          <div class="samp-shape" role="group" aria-label="Filter"><span class="samp-label">Filter</span>
            <select data-v="ftype" aria-label="Filter type"><option value="lowpass">Low pass</option><option value="bandpass">Band pass</option><option value="highpass">High pass</option></select></div>
          <div class="rec-sliders">
            <label class="rec-sl">Opens from <output></output><input type="range" min="60" max="2000" step="10" data-v="fLo"></label>
            <label class="rec-sl">Opens to <output></output><input type="range" min="2000" max="16000" step="100" data-v="fHi"></label>
            <label class="rec-sl">Resonance <output></output><input type="range" min="0.5" max="12" step="0.1" data-v="q"></label>
            <label class="rec-sl">Start spread <output></output><input type="range" min="0" max="100" step="1" data-v="spread" title="How far across the sound the steps travel"></label>
            <label class="rec-sl">Wind drift <output></output><input type="range" min="0" max="100" step="1" data-v="drift" title="How much the wind carries the slices on, bar by bar"></label>
          </div>
          <div class="rec-row">
            <label class="rec-in">Sound's own note <select data-v="root" aria-label="Root note"><option value="auto">Found for me</option>${NOTES.map((n, i) => `<option value="${i}">${n}</option>`).join("")}</select></label>
            <button type="button" class="samp-load" data-k="main" title="Move Three Cities to the key of this recording, and tune the others to it">Use this city as the main pitch</button>
          </div>
        </div>`;
      const q = k => box.querySelector(`[data-k="${k}"]`);
      R.ui = { box, dev: q("dev"), ch: q("ch"), check: q("check"), go: q("go"), meter: q("meter"), time: q("time"), edit: q("edit"), wave: q("wave"), r0: q("r0"), r1: q("r1"), prev: q("prev"), snap: q("snap"), audio: q("audio"), midi: q("midi") };
      c.ref.samp.prepend(box);
      // what plays and what is sent
      R.ui.audio.addEventListener("click", () => { c.recMute = !c.recMute; sync(c); saveOpts(c); });
      R.ui.midi.addEventListener("click", () => { c.recNoMidi = !c.recNoMidi; sync(c); saveOpts(c); if (c.recNoMidi && typeof midiOut !== "undefined" && midiOut) { try { midiOut.send([0xB0 | (c.midiCh ?? c.index), 123, 0]); } catch (e) {} } });
      // recording
      R.ui.go.addEventListener("click", () => io.recording && io.owner === c ? stopRec(c) : startRec(c));
      R.ui.check.addEventListener("click", async () => {
        if (io.stream && io.owner === c) { closeInput(); return; }
        try { await openInput(c); R.ui.check.setAttribute("aria-pressed", "true"); R.ui.check.textContent = "Stop checking"; R.ui.time.textContent = "Play or sing a loud bit. The bar should reach about three quarters, and stay out of the red."; }
        catch (e) { R.ui.time.textContent = e && e.name === "NotAllowedError" ? "The browser said no to the input. Allow it for this page and try again." : (e && e.message) || "Couldn't open that input."; }
      });
      R.ui.ch.addEventListener("change", () => { if (io.recording) { R.ui.ch.value = io.ch; return; } io.ch = R.ui.ch.value; lsSet("tc-rec-ch", io.ch); setPick(); fillChannels(); });
      R.ui.dev.addEventListener("change", () => { io.devId = R.ui.dev.value; lsSet("tc-rec-dev", io.devId); if (io.stream && !io.recording) { const keep = io.owner; openInput(keep).catch(() => {}); } });
      // trimming
      const setT = (a, b, final) => { R.t0 = Math.max(0, Math.min(a, b - 0.002)); R.t1 = Math.min(1, Math.max(b, R.t0 + 0.002)); R.ui.r0.value = Math.round(R.t0 * 1000); R.ui.r1.value = Math.round(R.t1 * 1000); draw(c); if (final) apply(c); };
      R.ui.r0.addEventListener("input", () => setT(R.ui.r0.value / 1000, R.t1, false)); R.ui.r0.addEventListener("change", () => setT(R.ui.r0.value / 1000, R.t1, true));
      R.ui.r1.addEventListener("input", () => setT(R.t0, R.ui.r1.value / 1000, false)); R.ui.r1.addEventListener("change", () => setT(R.t0, R.ui.r1.value / 1000, true));
      let drag = 0;
      R.ui.wave.addEventListener("pointerdown", e => { const r = R.ui.wave.getBoundingClientRect(), x = (e.clientX - r.left) / r.width; drag = Math.abs(x - R.t0) <= Math.abs(x - R.t1) ? 1 : 2; R.ui.wave.setPointerCapture(e.pointerId); move(e); });
      const move = e => { if (!drag) return; const r = R.ui.wave.getBoundingClientRect(), x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); drag === 1 ? setT(x, R.t1, false) : setT(R.t0, x, false); };
      R.ui.wave.addEventListener("pointermove", move);
      R.ui.wave.addEventListener("pointerup", () => { if (drag) { drag = 0; apply(c); } });
      R.ui.wave.addEventListener("pointercancel", () => { drag = 0; });
      R.ui.prev.addEventListener("click", () => preview(c));
      q("auto").addEventListener("click", () => autoTrim(c, false));
      R.ui.snap.addEventListener("click", () => { R.snap = !R.snap; sync(c); apply(c); });
      q("wav").addEventListener("click", () => { if (c.samp && c.samp.buf) wav(c); });
      q("clear").addEventListener("click", () => { if (prev && prev.c === c) preview(c); R.raw = null; R.peaks = null; R.ui.edit.hidden = true; c.samp = null; c.ref.sampName.textContent = "No recording yet"; c.ref.sampKey.hidden = true; R.ui.time.textContent = "Cleared. Press Record for a new one."; dbDel("raw" + idx(c)); saveOpts(c); });
      q("main").addEventListener("click", () => { if (!c.samp) { R.ui.time.textContent = "Record or load a sound first."; return; } keyLeader = null; matchSampleKey(c); });
      // shaping
      box.querySelectorAll("[data-opt]").forEach(b => b.addEventListener("click", () => { const [k, v] = b.dataset.opt.split(":"); R[k] = v; sync(c); saveOpts(c); }));
      box.querySelectorAll("[data-v]").forEach(el => { const k = el.dataset.v; el.addEventListener(el.type === "range" ? "input" : "change", () => { R[k] = el.type === "range" ? Number(el.value) : el.value; if (k === "edge") { apply(c); } else { sync(c); saveOpts(c); } }); });
      window.addEventListener("resize", () => draw(c));
      sync(c); fillChannels();
      // bring back what was saved on this device
      (async () => {
        const raw = await dbGet("raw" + idx(c)), o = await dbGet("opts" + idx(c));
        if (o) { ["slice", "dir", "ftype", "fLo", "fHi", "q", "spread", "drift", "root", "edge", "snap", "t0", "t1"].forEach(k => { if (o[k] !== undefined) R[k] = o[k]; }); c.recMute = !!o.audioOff; c.recNoMidi = !!o.midiOff; }
        if (raw && raw.data) { R.raw = { data: raw.data, sr: raw.sr }; R.name = raw.name || "Recording"; ui_show(c); apply(c); if (o && o.ref) c.samp.ref = o.ref; }
        sync(c);
      })();
      if (c === cities[0]) setTimeout(() => { try { setMore(true); } catch (e) {} }, 0);
      if (c === cities[cities.length - 1]) setTimeout(initRemote, 0);
    }
    // a file loaded or dropped on the card goes through the same trim
    function fromFile(c, buf, name) {
      const n = buf.length, mono = new Float32Array(n), chs = buf.numberOfChannels;
      for (let ch = 0; ch < chs; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < n; i++) mono[i] += d[i] / chs; }
      newTake(c, mono, buf.sampleRate, name);
    }

    // ----- the phone remote: pick a city and start or stop a take from across the studio -----
    // The phone page (/record-remote) and this page share a six letter code through the quiz Worker. This side checks in about once a second.
    const rem = { on: false, code: lsGet("tc-remote-code") || "", sel: 0, count: 0, timer: 0, tick: 0, busy: false, err: "", last: "", hooked: new WeakSet() };
    const makeCode = () => { const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let o = ""; for (let i = 0; i < 6; i++) o += A[Math.floor(Math.random() * A.length)]; return o; };
    const recBusy = () => io.recording || rem.count > 0;
    function pick(n) {
      rem.sel = Math.max(0, Math.min(cities.length - 1, n));
      cities.forEach((x, i) => x.el.classList.toggle("remote-sel", i === rem.sel));
      try { cities[rem.sel].el.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
    }
    function beep(hz) { try { if (!ac) return; const o = ac.createOscillator(), g4 = ac.createGain(); o.frequency.value = hz; g4.gain.value = 0.06; o.connect(g4).connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.07); } catch (e) {} }
    async function recordIn(n) {
      if (recBusy()) return;
      const c = cities[rem.sel]; rem.err = "";
      if (n <= 0) { await startRec(c); return; }
      rem.count = n;
      try { if (!ac) setupAudio(); await openInput(c); } catch (e) { rem.count = 0; rem.err = (e && e.name === "NotAllowedError") ? "The browser said no to the input. Allow it on the computer." : (e && e.message) || "Couldn't open the input."; c.rec.ui.time.textContent = rem.err; return; }
      const step = async () => {
        if (rem.count <= 0) return;
        if (rem.count <= 3) beep(660);
        await new Promise(r => { rem.tick = setTimeout(r, 1000); });
        if (rem.count <= 0) return;   // cancelled
        rem.count--;
        if (rem.count > 0) return step();
        await startRec(c);
      };
      step();
    }
    function stopAny() {
      if (rem.count > 0) { rem.count = 0; clearTimeout(rem.tick); if (!io.recording) closeInput(); return; }
      if (io.recording) stopRec(io.owner);
    }
    function toggleRec() { recBusy() ? stopAny() : recordIn(0); }
    function run(cmd) {
      rem.last = cmd; renderRem();
      if (/^city:[0-9]$/.test(cmd)) { if (!recBusy()) pick(Number(cmd.slice(5))); }
      else if (cmd.startsWith("record:")) recordIn(Number(cmd.slice(7)));
      else if (cmd === "stop") stopAny();
      else if (cmd === "clear") { if (!recBusy()) { const b = cities[rem.sel].rec.ui.box.querySelector('[data-k="clear"]'); b && b.click(); } }
    }
    const NAMES = { stop: "Stop", clear: "Clear take" };
    function renderRem() {
      const el = rem.el; if (!el) return;
      el.querySelector(".rr-code").textContent = rem.code;
      const c = cities[rem.sel], last = rem.last ? (rem.last.startsWith("city:") ? "City: " + cities[Number(rem.last.slice(5))].name : rem.last.startsWith("record:") ? "Record" : NAMES[rem.last] || rem.last) : "";
      el.querySelector(".rr-last").textContent = last ? `Last tap from your phone: ${last} (${new Date().toLocaleTimeString("en-GB")}).` : "Nothing from your phone yet.";
    }
    function status() {
      const c = cities[rem.sel], lvl = Math.round(Math.sqrt(io.lvl || 0) * 100); io.lvl = 0;
      const msg = rem.count > 0 ? `${c.name} starts in ${rem.count}.` : io.recording ? `Recording ${c.name}.` : rem.err || (c.rec.ui.time.textContent || "").slice(0, 120);
      return { city: rem.sel, names: cities.map(x => x.name), rec: !!io.recording, count: rem.count, secs: io.recording ? Math.floor(ac.currentTime - io.t0) : 0, lvl: io.stream ? lvl : 0, take: cities.map(x => !!(x.rec && x.rec.raw)), msg };
    }
    async function sync() {
      if (!rem.on || rem.busy) return; rem.busy = true;
      try {
        const r = await fetch(QUIZ_API + "/remote/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: rem.code, status: status() }) }).then(x => x.json());
        rem.el.querySelector(".rr-net").textContent = "";
        (r.cmds || []).forEach(run);
      } catch (e) { rem.el.querySelector(".rr-net").textContent = "Can't reach the server right now."; }
      rem.busy = false;
    }
    async function hookMidi() {
      try {
        const acc = (typeof midiAccess !== "undefined" && midiAccess) || (navigator.requestMIDIAccess ? await navigator.requestMIDIAccess() : null); if (!acc) return;
        const on = e => { const [st, n, v] = e.data; if (!rem.on || (st & 0xF0) !== 0x90 || !v) return; if (n >= 36 && n <= 38) { if (!recBusy()) pick(n - 36); } else if (n === 39) toggleRec(); };
        acc.inputs.forEach(i => { if (!rem.hooked.has(i)) { rem.hooked.add(i); i.addEventListener("midimessage", on); } });
      } catch (e) {}
    }
    function setRemote(on) {
      rem.on = on; rem.el.querySelector(".rr-panel").hidden = !on; rem.el.querySelector(".rr-btn").setAttribute("aria-pressed", String(on));
      clearInterval(rem.timer);
      if (on) { if (!rem.code) { rem.code = makeCode(); lsSet("tc-remote-code", rem.code); } renderRem(); pick(rem.sel); sync(); rem.timer = setInterval(sync, 900); hookMidi(); }
    }
    function initRemote() {
      const el = rem.el = document.createElement("div"); el.className = "rr";
      el.innerHTML = `<button type="button" class="rr-btn" aria-pressed="false">Phone remote</button>
        <div class="rr-panel" hidden>
          <div class="rr-code" aria-label="Pairing code"></div>
          <p>On your phone, open <b>/record-remote</b> and type this code. Then pick a city and tap Record.</p>
          <div class="rr-row"><button type="button" class="samp-load" data-k="copy">Copy phone link</button><button type="button" class="samp-load" data-k="new">New code</button></div>
          <p class="rr-last" aria-live="polite"></p><p class="rr-net"></p>
          <p class="rr-keys">Keys: R records or stops, 1 2 3 pick a city. A page-turner pedal works too (Page Down records or stops). MIDI: C1, C#1, D1 pick a city, D#1 records or stops.</p>
        </div>`;
      document.body.appendChild(el);
      el.querySelector(".rr-btn").addEventListener("click", () => setRemote(!rem.on));
      el.querySelector('[data-k="copy"]').addEventListener("click", async e => { const u = location.origin + "/record-remote?c=" + rem.code; try { await navigator.clipboard.writeText(u); e.target.textContent = "Copied"; } catch (x) { e.target.textContent = u; } setTimeout(() => { e.target.textContent = "Copy phone link"; }, 2500); });
      el.querySelector('[data-k="new"]').addEventListener("click", () => { rem.code = makeCode(); lsSet("tc-remote-code", rem.code); renderRem(); sync(); });
      document.addEventListener("keydown", e => {
        if (!rem.on || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
        const t = e.target, tag = t && t.tagName; if (tag === "TEXTAREA" || tag === "SELECT" || tag === "INPUT" && /^(text|search|email|url|number)$/.test(t.type) || (t && t.isContentEditable)) return;
        const k = (e.key || "").toLowerCase(); let used = true;
        if (k === "r" || k === "pagedown") toggleRec(); else if (k >= "1" && k <= "3") { if (!recBusy()) pick(Number(k) - 1); } else used = false;
        if (used) { e.preventDefault(); e.stopImmediatePropagation(); }
      }, true);
    }
    return { mount, play, fromFile, initRemote };
  })();
