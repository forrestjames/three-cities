// Three Cities quiz and visit counts: anonymous counts only.
// Quiz: for each question and city it keeps two numbers, how often the city was offered and how often it was picked.
// Visits: one counter per day, kind and value (for example 2026-10-16 / city / london). Nothing is kept per person.
// No IP addresses, no device ids, no cookies, no timestamps per event, nothing that points back to a person.
// The quiz questions. The app shows the text; this only accepts these ids. Keep in step with QUIZ in index.html.
const QUIZ = [
  ["visit-first", "Which one would you visit first?"], ["food", "Where do you think the food is best?"], ["wake-up", "Where would you like to wake up tomorrow?"],
  ["move", "Which one could you live in?"], ["romantic", "Which one sounds the most romantic?"], ["night-out", "Where would you go out tonight?"],
  ["postcard", "Which one would you send a postcard from?"], ["sound", "Which one sounds best right now?"], ["music", "Where do you imagine the best music?"],
  ["walk", "Where would you go for a long walk?"], ["lost", "Where would you like to get lost?"], ["weekend", "Where would you spend a long weekend?"],
  ["sunset", "Where would you watch the sunset?"], ["rainy", "Where would you spend a rainy day?"], ["new-year", "Where would you see in the New Year?"],
  ["song", "Where would you write a song?"], ["like-you", "Which one feels most like you?"], ["curious", "Which one are you most curious about?"],
  ["slow", "Where would you go to slow down?"], ["friendly", "Where do you think people are friendliest?"]
];

const IDS = new Set(QUIZ.map(q => q[0]));
const ORIGINS = ["https://threecities.forrestjamesmusic.com", "https://forrestjames.github.io"];

const clean = s => String(s || "").normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 80);
function cors(req) {
  const o = req.headers.get("Origin") || "";
  const ok = ORIGINS.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o) || /^https:\/\/[a-z0-9-]+\.claudeusercontent\.com$/.test(o);
  return { "Access-Control-Allow-Origin": ok ? o : ORIGINS[0], "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
}
const json = (req, data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors(req) } });

async function tally(env, q, cities) {
  const rows = await env.DB.prepare(`SELECT city, shown, picked FROM tally WHERE q = ? AND city IN (?, ?, ?)`).bind(q, ...cities).all();
  const by = Object.fromEntries((rows.results || []).map(r => [r.city, { shown: r.shown, picked: r.picked }]));
  return cities.map(c => by[c] || { shown: 0, picked: 0 });
}

// ---------- visit counts: /e (collect) and /analytics (read, admin only) ----------
// Every row is a daily counter: day, kind, key, n. The country comes from Cloudflare and is not stored with anything else.
const STAY = new Set(["10s", "30s", "1m", "3m", "10m", "30m"]);
const HEARD = new Set(["30s", "1m", "3m", "10m", "30m"]);
const ACTS = new Set(["share-sheet", "share-copy", "record", "quiz-answer", "midi-out", "own-sound", "opened-shared-link", "chords-on", "mix-saved"]);
// kinds the page may send. Free text ones (city names, sources) are capped per day so nobody can flood the table.
const KINDS = { visit: null, listen: new Set(["start"]), stay: STAY, heard: HEARD, act: ACTS, city: "free", citypick: "free", sound: "free", soundpick: "free", kit: "free", chords: "free", scale: "free", tempo: "free" };
const FREE_CAP = 400;
const BOT = /bot|crawl|spider|headless|lighthouse|preview|facebookexternalhit|slurp|python|curl|wget|node-fetch|axios/i;
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });   // the day, in London
const clean2 = s => String(s == null ? "" : s).normalize("NFC").toLowerCase().replace(/[\u0000-\u001f<>"`]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
const deviceOf = ua => /ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua) ? "tablet" : /mobi|iphone|ipod|android/i.test(ua) ? "phone" : "computer";
const originOk = req => { const o = req.headers.get("Origin") || ""; return ORIGINS.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o); };

async function collect(req, env) {
  const text = await req.text();
  if (text.length > 4000) return json(req, { error: "too big" }, 413);
  let b; try { b = JSON.parse(text); } catch (e) { return json(req, { error: "bad json" }, 400); }
  if (!originOk(req) || BOT.test(req.headers.get("User-Agent") || "")) return json(req, { ok: true, counted: 0 });   // a quiet yes: bots and other sites are simply not counted
  const list = Array.isArray(b.e) ? b.e.slice(0, 40) : [];
  const day = today(), add = new Map(), free = new Map();
  const bump = (kind, key) => { if (!key) return; const k = kind + "\u0001" + key; add.set(k, (add.get(k) || 0) + 1); };
  for (const ev of list) {
    if (!Array.isArray(ev)) continue;
    const kind = String(ev[0] || ""), key = clean2(ev[1]);
    if (!(kind in KINDS)) continue;
    if (kind === "visit") {   // one visit becomes a few counters: the visit, where from, which country, what kind of device
      bump("visit", "all"); bump("src", key || "direct");
      const c = (req.cf && req.cf.country) || "unknown"; bump("country", c === "XX" ? "unknown" : c);
      bump("device", deviceOf(req.headers.get("User-Agent") || ""));
      continue;
    }
    const allowed = KINDS[kind];
    if (allowed === "free") { if (!key) continue; free.set(kind, true); bump(kind, key); }
    else if (allowed && allowed.has(key)) bump(kind, key);
  }
  if (!add.size) return json(req, { ok: true, counted: 0 });
  // free-text kinds (and src): refuse new values once a day already has plenty
  const full = new Set();
  for (const kind of [...free.keys(), "src"]) {
    if (kind === "src" && !add.has("src")) continue;
    const r = await env.DB.prepare(`SELECT COUNT(*) AS n FROM events WHERE day = ? AND kind = ?`).bind(day, kind).first();
    if (r && r.n >= FREE_CAP) full.add(kind);
  }
  const up = env.DB.prepare(`INSERT INTO events (day, kind, key, n) VALUES (?, ?, ?, ?) ON CONFLICT (day, kind, key) DO UPDATE SET n = n + excluded.n`);
  const stmts = [];
  for (const [k, n] of add) { const [kind, key] = k.split("\u0001"); stmts.push({ kind, key, n }); }
  const keep = stmts.filter(x => !full.has(x.kind));
  if (keep.length) await env.DB.batch(keep.map(x => up.bind(day, x.kind, x.key, x.n)));
  return json(req, { ok: true, counted: keep.length });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });

    // record one answer: { q: "food", c: ["lisbon|portugal", "osaka|japan", "quito|ecuador"], p: 0 }
    if (url.pathname === "/answer" && req.method === "POST") {
      const text = await req.text();
      if (text.length > 1000) return json(req, { error: "too big" }, 413);
      let b; try { b = JSON.parse(text); } catch (e) { return json(req, { error: "bad json" }, 400); }
      const q = String(b.q || ""), cities = Array.isArray(b.c) ? b.c.map(clean) : [], p = Number(b.p);
      if (!IDS.has(q) || cities.length !== 3 || cities.some(c => !c) || new Set(cities).size !== 3 || ![0, 1, 2].includes(p)) return json(req, { error: "bad answer" }, 400);
      const up = env.DB.prepare(`INSERT INTO tally (q, city, shown, picked) VALUES (?, ?, 1, ?)
        ON CONFLICT (q, city) DO UPDATE SET shown = shown + 1, picked = picked + excluded.picked`);
      await env.DB.batch(cities.map((c, i) => up.bind(q, c, i === p ? 1 : 0)));
      return json(req, { ok: true, cities: await tally(env, q, cities) });
    }

    // what everyone said about these three: /results?q=food&c=lisbon|portugal~osaka|japan~quito|ecuador
    if (url.pathname === "/results" && req.method === "GET") {
      const q = url.searchParams.get("q") || "", cities = (url.searchParams.get("c") || "").split("~").map(clean);
      if (!IDS.has(q) || cities.length !== 3 || cities.some(c => !c)) return json(req, { error: "bad query" }, 400);
      return json(req, { cities: await tally(env, q, cities) });
    }

    // the leaderboard for a question, for posts: /top?q=food&min=20
    if (url.pathname === "/top" && req.method === "GET") {
      const q = url.searchParams.get("q") || "", min = Math.max(1, Number(url.searchParams.get("min")) || 20);
      if (!IDS.has(q)) return json(req, { error: "bad query" }, 400);
      const rows = await env.DB.prepare(`SELECT city, shown, picked, ROUND(1.0 * picked / shown, 3) AS rate FROM tally WHERE q = ? AND shown >= ? ORDER BY rate DESC, shown DESC LIMIT 25`).bind(q, min).all();
      return json(req, { q, text: QUIZ.find(x => x[0] === q)[1], top: rows.results || [] });
    }

    // everything, for the admin page: /stats?key=… (the key is the ADMIN_KEY secret, when one is set)
    if (url.pathname === "/stats" && req.method === "GET") {
      if (env.ADMIN_KEY && url.searchParams.get("key") !== env.ADMIN_KEY) return json(req, { error: "wrong key" }, 401);
      const rows = await env.DB.prepare(`SELECT q, city, shown, picked FROM tally ORDER BY q, picked DESC LIMIT 20000`).all();
      return json(req, { questions: QUIZ, rows: rows.results || [], locked: !!env.ADMIN_KEY });
    }

    // one batch of anonymous visit events from the page: { e: [["visit", "reddit.com"], ["city", "london"], ["stay", "30s"]] }
    if (url.pathname === "/e" && req.method === "POST") return collect(req, env);

    // visit counts for the admin page: /analytics?key=…&days=120
    if (url.pathname === "/analytics" && req.method === "GET") {
      if (env.ADMIN_KEY && url.searchParams.get("key") !== env.ADMIN_KEY) return json(req, { error: "wrong key" }, 401);
      const days = Math.max(1, Math.min(400, Number(url.searchParams.get("days")) || 120));
      const from = new Date(Date.now() - days * 86400000).toLocaleDateString("en-CA", { timeZone: "Europe/London" });
      const rows = await env.DB.prepare(`SELECT day, kind, key, n FROM events WHERE day >= ? ORDER BY day LIMIT 60000`).bind(from).all();
      return json(req, { today: today(), from, rows: (rows.results || []).map(r => [r.day, r.kind, r.key, r.n]), locked: !!env.ADMIN_KEY });
    }

    if (url.pathname === "/") return json(req, { ok: true, service: "three-cities-quiz", questions: QUIZ.length });
    return json(req, { error: "not found" }, 404);
  }
};
