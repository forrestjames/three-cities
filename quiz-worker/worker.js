// Three Cities quiz: anonymous counts only.
// For each question and city it keeps two numbers: how often the city was offered, and how often it was picked.
// No IP addresses, no device ids, no timestamps per answer, nothing that points back to a person.
// The quiz questions. The app shows the text; this only accepts these ids. Keep in step with QUIZ in index.html.
const QUIZ = [
  ["food", "Where's the best food?"],
  ["move", "Where would you move tomorrow?"],
  ["romantic", "Which one is the most romantic?"],
  ["night-out", "Where's the best night out?"],
  ["coffee", "Where's the best coffee?"],
  ["first-date", "Where would you go on a first date?"],
  ["night", "Which one is prettiest at night?"],
  ["kid", "Where would you want to grow up?"],
  ["music", "Where's the best music?"],
  ["walk", "Where would you go for a long walk?"],
  ["friendly", "Which one is the friendliest?"],
  ["lost", "Where would you like to get lost?"],
  ["weekend", "Where would you spend a long weekend?"],
  ["sunset", "Where's the best sunset?"],
  ["underrated", "Which one is the most underrated?"],
  ["song", "Where would you write a song?"],
  ["rainy", "Where would you spend a rainy day?"],
  ["new-year", "Where would you see in the New Year?"],
  ["retire", "Where would you grow old?"],
  ["sound", "Which one sounds best right now?"]
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

    if (url.pathname === "/") return json(req, { ok: true, service: "three-cities-quiz", questions: QUIZ.length });
    return json(req, { error: "not found" }, 404);
  }
};
