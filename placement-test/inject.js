  // ===== PLACEMENT TEST (only in placement-test.html) =====
  // Where each city's hits go: Euclid (even), Drift (wind nudges hits forward), Cluster (rain bunches hits into bursts).
  // The number of hits still comes from the city's source, as before. Changes take effect at the start of the next loop.
  const PLACE = (() => {
    const pick = {};   // city key -> "auto" | "euclid" | "drift" | "cluster"
    function modeFor(c) {
      const choice = pick[c.key] || "auto";
      if (choice !== "auto") return choice;
      const w = c.w || {};
      if ((w.r || 0) > 0) return "cluster";     // rain: bunched into bursts
      if ((w.w || 0) >= 15) return "drift";     // wind of 15 km/h or more: hits drift
      return "euclid";                          // calm: even
    }
    const windAmt = c => Math.min(1, Math.max(0, ((c.w && c.w.w) || 0) / 50));
    function driftRing(c, prev, H, L) {
      // each hit has a chance to move one step forward, into an empty step only. Calm air (0) keeps the pattern even.
      const p = 0.5 * windAmt(c), next = new Array(L).fill(0);
      for (let i = 0; i < L; i++) {
        if (!prev[i]) continue;
        const to = (i + 1) % L;
        if (Math.random() < p && !prev[to]) next[to] = 1; else next[i] = 1;
      }
      return next;
    }
    function clusterRing(H, L) {
      // a new random burst pattern: 2 to 4 gaps of 1, 2 or 3 steps
      const gaps = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => 1 + Math.floor(Math.random() * 3));
      const p = new Array(L).fill(0);
      let pos = Math.floor(Math.random() * L), placed = 0, i = 0, guard = 0;
      while (placed < H && guard++ < L * 8) {
        const at = ((pos % L) + L) % L;
        if (p[at]) { pos += 1; continue; }
        p[at] = 1; placed++; pos += gaps[i++ % gaps.length];
      }
      return p;
    }
    const evenRot = (c) => { const base = euclid(c.hits, c.steps), rot = (c.rot || 0) % c.steps; return base.slice(rot).concat(base.slice(0, rot)); };
    // called from rebuild() in place of the old even pattern: changes now only if the hit count or steps changed
    function setup(c) {
      const key = c.steps + "/" + c.hits;
      if (!c.pattern || c.pattern.length !== c.steps || c.ringKey !== key) {
        c.ringKey = key;
        if (modeFor(c) === "euclid" || !c.hits || !c.steps) return evenRot(c);
        return modeFor(c) === "drift" ? driftRing(c, euclid(c.hits, c.steps), c.hits, c.steps) : clusterRing(c.hits, c.steps);
      }
      return c.pattern;
    }
    // called at the start of each loop (step 0): drift moves on, cluster redraws, euclid stays even
    function loop(c) {
      if (!c.steps || !c.hits) return;
      const mode = modeFor(c), before = c.pattern && c.pattern.length === c.steps ? c.pattern.slice() : null;
      if (mode === "euclid") c.pattern = evenRot(c);
      else if (mode === "drift") c.pattern = driftRing(c, before || euclid(c.hits, c.steps), c.hits, c.steps);
      else c.pattern = clusterRing(c.hits, c.steps);
      c.ringKey = c.steps + "/" + c.hits;
      const L = c.steps, now = c.pattern;
      // what this loop did: hits that stepped forward (drift), or the number of bursts (cluster)
      const moved = before ? before.filter((h, i) => h && !now[i]).length : 0;
      const bursts = now.filter((h, i) => h && !now[(i - 1 + L) % L]).length;
      c._note = { mode, moved, bursts, hits: now.reduce((a, b) => a + b, 0) };
    }
    let bar, status, explain;
    const pct = n => Math.round(n * 100);
    // what is happening for one city, in plain words
    function describe(c) {
      const mode = modeFor(c), manual = (pick[c.key] || "auto") !== "auto", w = c.w || {}, n = c._note || {};
      const why = manual ? "You set it to " + mode[0].toUpperCase() + mode.slice(1) + ". " : "";
      if (mode === "euclid") {
        return "<b>" + c.name + ": Euclid.</b> " + why + (manual ? "" : "The air is calm, so the hits are spread evenly. ") + "Nothing moves.";
      }
      if (mode === "drift") {
        const chance = pct(0.5 * windAmt(c));
        return "<b>" + c.name + ": Drift.</b> " + why + "Wind is " + Math.round(w.w || 0) + " km/h, so each hit has about a " + chance + "% chance to step forward, into an empty space, at the start of each loop. " +
          (c._note ? "The last loop moved " + n.moved + " of " + n.hits + " hits." : "");
      }
      return "<b>" + c.name + ": Cluster.</b> " + why + (w.r > 0 ? "It is raining (" + (Math.round(w.r * 10) / 10) + " mm), so " : "") +
        "the hits are bunched into bursts with empty stretches between them. The bursts are redrawn at the start of each loop. " +
        (c._note ? "The last loop made " + n.bursts + " burst" + (n.bursts === 1 ? "" : "s") + " from " + n.hits + " hits." : "");
    }
    function mount() {
      bar = document.createElement("div");
      bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "Placement test");
      bar.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:99999;display:flex;gap:10px;align-items:center;flex-wrap:wrap;max-width:calc(100vw - 24px);padding:8px 12px;border-radius:12px;background:#17202A;color:#E6EBF0;font:12px/1.3 ui-monospace,Menlo,monospace;box-shadow:0 4px 18px rgba(0,0,0,.35)";
      bar.innerHTML = '<b style="letter-spacing:.08em">PLACEMENT</b>' + cities.map(c => '<label style="display:flex;gap:6px;align-items:center">' + c.name + ' <select data-k="' + c.key + '" style="font:inherit;color:#18222D;background:#E6EBF0;border:0;border-radius:6px;padding:3px 4px"><option value="auto">Auto</option><option value="euclid">Euclid</option><option value="drift">Drift</option><option value="cluster">Cluster</option></select></label>').join("") + '<span data-s style="opacity:.8"></span>';
      document.body.appendChild(bar); status = bar.querySelector("[data-s]");
      explain = document.createElement("div");
      explain.id = "plExplain"; explain.setAttribute("aria-live", "polite");
      explain.style.cssText = "position:fixed;left:12px;bottom:72px;z-index:99998;width:min(520px,calc(100vw - 24px));max-height:40vh;overflow:auto;padding:12px 14px;border-radius:12px;background:#17202A;color:#E6EBF0;font:13px/1.45 ui-monospace,Menlo,monospace;box-shadow:0 4px 18px rgba(0,0,0,.35)";
      document.body.appendChild(explain);
      bar.querySelectorAll("select").forEach(s => s.addEventListener("change", e => { pick[s.dataset.k] = e.target.value; }));
      const tick = () => { status.textContent = cities.map(c => c.name + ": " + modeFor(c) + (c.pattern ? " (" + c.pattern.reduce((a, b) => a + b, 0) + " hits)" : "")).join("  ·  "); };
      const words = () => {
        explain.innerHTML = '<p style="margin:0 0 8px;color:#93A0AD">Placement decides where each city\'s hits land in its loop. The number of hits still comes from the weather source. Changes take effect at the start of the next loop.</p>' +
          cities.map(c => '<p style="margin:0 0 8px">' + describe(c) + '</p>').join("");
      };
      setInterval(() => { tick(); words(); }, 1000); tick(); words();
    }
    if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
    window.__PL = { pick, modeFor, setup, loop, ring: driftRing, cluster: clusterRing };
    return { setup, loop, modeFor };
  })();
