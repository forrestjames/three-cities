// City Weather (v2)
// Runs inside [node.script city_weather.js @autostart 1] in Max / Max for Live.
// Every Three Cities device runs one of these. They share a small settings file
// (~/.three-cities.json), so changing the cities, key or scale on the City
// Dashboard reaches every City Track in the set.
//
// Out of the left outlet:
//   names <city1> <city2> <city3>                    the three cities, in slot order
//   weather <city> <temp C> <hum %> <wind km/h> <cloud %> <rain mm> <utc offset s>
//           <pressure hPa> <gusts km/h> <rain chance %> <pressure 3h ago>
//   sun <city> <arc 0-1> <isDay 0|1> <progress 0-1> <light 0-1>    every minute
//   sleep <city> <depth 0-1>                         every minute: 0 awake, 1 deep sleep
//   harmony <key 0-11> <scale index> <change 0-4>    the shared key, scale and how often the chord moves
//   status <text>
//
// Messages in:
//   refresh                     fetch now
//   interval <min>              how often to fetch (default 10)
//   cities <a>, <b>, <c>        three places, separated by commas or slashes ("New York / Tokyo / Lima")
//   key <0-11> | scale <index> | change <0-4>  set the shared key, scale or chord change

const maxApi = require("max-api");
const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");

const SHARED = path.join(os.homedir(), ".three-cities.json");
const DEFAULT = {
  cities: [
    { name: "Boston", lat: 42.36, lon: -71.06 },
    { name: "Copenhagen", lat: 55.68, lon: 12.57 },
    { name: "London", lat: 51.51, lon: -0.13 }
  ],
  key: 0, scale: 0, change: 0   // change: how often the chord moves, 0 to 4 = 4, 8, 16, 32 bars or a drone
};

let shared = readShared();
let minutes = 10;
let timer = null;
const sunTimes = {};   // city -> [{rise, set}] in unix seconds

function readShared() {
  try {
    const j = JSON.parse(fs.readFileSync(SHARED, "utf8"));
    if (Array.isArray(j.cities) && j.cities.length === 3) return Object.assign({}, DEFAULT, j);
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT));
}
function writeShared() {
  try { fs.writeFileSync(SHARED, JSON.stringify(shared, null, 1)); }
  catch (e) { maxApi.post("Couldn't save shared settings: " + e.message, maxApi.POST_LEVELS.WARN); }
}

function getJSONOnce(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) { res.resume(); reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => { body += c; });
      res.on("end", () => { try { resolve(JSON.parse(body)); } catch (e) { reject(new Error("bad response")); } });
    });
    req.on("timeout", () => req.destroy(new Error("timed out")));
    req.on("error", reject);
  });
}
// Open-Meteo is sometimes busy or slow: try up to three times, a little longer apart each time
async function getJSON(url) {
  for (let i = 0; ; i++) {
    try { return await getJSONOnce(url); }
    catch (e) { if (i >= 2) throw e; await new Promise(r => setTimeout(r, 2000 * (i + 1))); }
  }
}

async function fetchCity(c) {
  const url = "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${c.lat}&longitude=${c.lon}` +
    "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,cloud_cover,precipitation,pressure_msl" +
    "&hourly=precipitation_probability,pressure_msl&past_hours=3&forecast_hours=1" +
    "&daily=sunrise,sunset&timezone=auto&timeformat=unixtime&past_days=1&forecast_days=2";
  const j = await getJSON(url);
  const k = j.current, h = j.hourly || {};
  sunTimes[c.name] = j.daily.sunrise.map((rise, i) => ({ rise, set: j.daily.sunset[i] }));
  const pps = h.precipitation_probability || [], pp = pps.length ? pps[pps.length - 1] : null;
  const p3 = h.pressure_msl && h.pressure_msl.length ? h.pressure_msl[0] : k.pressure_msl;
  return [k.temperature_2m, k.relative_humidity_2m, k.wind_speed_10m, k.cloud_cover, k.precipitation,
          j.utc_offset_seconds || 0, Math.round(k.pressure_msl), Math.round(k.wind_gusts_10m ?? k.wind_speed_10m * 1.7),
          pp == null ? -1 : pp, Math.round(p3 || k.pressure_msl)];
}

const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
// Where the sun is, and how much light there is (easing across half an hour either side of the horizon)
function sunNow(name) {
  const days = sunTimes[name];
  if (!days) return null;
  const now = Date.now() / 1000;
  let edge = -Infinity, arc = 0, prog = 0, day = 0;
  for (const d of days) {
    const up = now >= d.rise && now <= d.set;
    if (up) { prog = (now - d.rise) / (d.set - d.rise); arc = Math.sin(Math.PI * prog); day = 1; }
    edge = Math.max(edge, up ? Math.min(now - d.rise, d.set - now) : -Math.min(Math.abs(now - d.rise), Math.abs(now - d.set)));
  }
  return { arc, day, prog, light: smooth((edge + 1800) / 3600) };
}
// How deeply a city sleeps, as in the web version: it drifts off over two hours after sunset,
// sleeps through the night, and stirs a little in the last 90 minutes before sunrise.
function sleepNow(name) {
  const days = sunTimes[name];
  if (!days) return 0;
  const now = Date.now() / 1000;
  if (days.some(d => now >= d.rise && now <= d.set)) return 0;
  const sets = days.map(d => d.set).filter(s => s <= now), rises = days.map(d => d.rise).filter(r => r >= now);
  const falling = sets.length ? smooth((now - Math.max(...sets)) / 7200) : 1;
  const stirring = rises.length ? 0.55 + 0.45 * smooth((Math.min(...rises) - now) / 5400) : 1;
  const s = sunNow(name);
  return Math.min(falling, stirring) * (1 - (s ? s.light : 0));
}

async function sendSun() {
  for (const c of shared.cities) {
    const s = sunNow(c.name);
    if (!s) continue;
    await maxApi.outlet("sun", c.name, +s.arc.toFixed(3), s.day, +s.prog.toFixed(3), +s.light.toFixed(3));
    await maxApi.outlet("sleep", c.name, +sleepNow(c.name).toFixed(3));
  }
}

async function sendHeader() {
  await maxApi.outlet("names", ...shared.cities.map(c => c.name));
  await maxApi.outlet("harmony", shared.key, shared.scale, shared.change);
}

async function refresh() {
  await sendHeader();
  // all three at once, so one slow city doesn't hold up the others. A city that fails keeps its last weather.
  await Promise.all(shared.cities.map(async (c) => {
    try {
      const v = await fetchCity(c);
      await maxApi.outlet("weather", c.name, ...v);
    } catch (e) {
      const msg = `Could not fetch ${c.name}: ${e.message}. Will try again in ${minutes} minutes.`;
      maxApi.post(msg, maxApi.POST_LEVELS.WARN);
      await maxApi.outlet("status", msg);
    }
  }));
  await sendSun();
}

function schedule() {
  if (timer) clearInterval(timer);
  timer = setInterval(refresh, minutes * 60 * 1000);
}

// Look a place up by name, and keep its proper name and position
async function geocode(q) {
  const j = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en`);
  const h = (j.results || [])[0];
  if (!h) throw new Error(q);
  return { name: h.name, lat: +h.latitude.toFixed(3), lon: +h.longitude.toFixed(3) };
}

maxApi.addHandler("refresh", refresh);
maxApi.addHandler("interval", (m) => { minutes = Math.max(1, Number(m) || 10); schedule(); });
// Three places typed into the Dashboard's box. Commas split a Max message into pieces, so the words are
// gathered for a moment and then read as one line, split on commas or slashes ("Lima / Oslo / Perth" works too).
let cityWords = [], cityTimer = null;
function gatherCities(words) {
  cityWords = cityWords.concat(words.map(String));
  clearTimeout(cityTimer);
  cityTimer = setTimeout(() => { const w = cityWords; cityWords = []; setCities(w); }, 350);
}
async function setCities(words) {
  if (words[0] === "text") words = words.slice(1);
  const names = words.join(" ").split(/[,/]/).map(s => s.trim()).filter(Boolean).slice(0, 3);
  if (names.length !== 3) { await maxApi.outlet("status", "Type three places, separated by commas or slashes"); return; }
  try {
    await maxApi.outlet("status", "Looking up " + names.join(", ") + "…");
    shared.cities = await Promise.all(names.map(geocode));
    writeShared();   // the other devices see the file change and follow
    await refresh();
  } catch (e) { await maxApi.outlet("status", "Couldn't find " + e.message); }
}
maxApi.addHandler("cities", (...words) => gatherCities(words));
// pieces that arrive straight after "cities" (the rest of a comma-split line) join the same request
maxApi.addHandler(maxApi.MESSAGE_TYPES.ALL, (handled, ...args) => { if (!handled && cityTimer) gatherCities([","].concat(args)); });
maxApi.addHandler("key", async (k) => { shared.key = ((Math.round(Number(k)) % 12) + 12) % 12; writeShared(); await sendHeader(); });
maxApi.addHandler("change", async (c) => { shared.change = Math.max(0, Math.min(4, Math.round(Number(c)) || 0)); writeShared(); await sendHeader(); });
maxApi.addHandler("scale", async (s) => { shared.scale = Math.max(0, Math.round(Number(s)) || 0); writeShared(); await sendHeader(); });

// When another device changes the shared file, follow it
fs.watchFile(SHARED, { interval: 1500 }, () => {
  const next = readShared();
  const citiesChanged = JSON.stringify(next.cities) !== JSON.stringify(shared.cities);
  shared = next;
  if (citiesChanged) refresh(); else sendHeader();
});

maxApi.outlet("status", "Weather script running, fetching…");
schedule();
setInterval(sendSun, 60 * 1000);
refresh();
