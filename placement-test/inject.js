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
      const mode = modeFor(c);
      if (mode === "euclid") c.pattern = evenRot(c);
      else if (mode === "drift") c.pattern = driftRing(c, c.pattern.length === c.steps ? c.pattern : euclid(c.hits, c.steps), c.hits, c.steps);
      else c.pattern = clusterRing(c.hits, c.steps);
      c.ringKey = c.steps + "/" + c.hits;
    }
    let bar, status;
    function mount() {
      bar = document.createElement("div");
      bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "Placement test");
      bar.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:99999;display:flex;gap:10px;align-items:center;flex-wrap:wrap;max-width:calc(100vw - 24px);padding:8px 12px;border-radius:12px;background:#17202A;color:#E6EBF0;font:12px/1.3 ui-monospace,Menlo,monospace;box-shadow:0 4px 18px rgba(0,0,0,.35)";
      bar.innerHTML = '<b style="letter-spacing:.08em">PLACEMENT</b>' + cities.map(c => '<label style="display:flex;gap:6px;align-items:center">' + c.name + ' <select data-k="' + c.key + '" style="font:inherit;color:#18222D;background:#E6EBF0;border:0;border-radius:6px;padding:3px 4px"><option value="auto">Auto</option><option value="euclid">Euclid</option><option value="drift">Drift</option><option value="cluster">Cluster</option></select></label>').join("") + '<span data-s style="opacity:.8"></span>';
      document.body.appendChild(bar); status = bar.querySelector("[data-s]");
      bar.querySelectorAll("select").forEach(s => s.addEventListener("change", e => { pick[s.dataset.k] = e.target.value; }));
      const tick = () => { status.textContent = cities.map(c => c.name + ": " + modeFor(c) + (c.pattern ? " (" + c.pattern.reduce((a, b) => a + b, 0) + " hits)" : "")).join("  ·  "); };
      setInterval(tick, 1000); tick();
    }
    if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
    window.__PL = { pick, modeFor, setup, loop, ring: driftRing, cluster: clusterRing };
    return { setup, loop, modeFor };
  })();
