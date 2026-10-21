// City Track (v2)
// Max for Live version of Three Cities. Runs inside [v8 city_track.js].
// Put one device on each MIDI track and pick City 1, 2 or 3.
//
//   steps = temperature in °C (21°C = a 21-step pattern)
//   hits  = triggers spread evenly across the steps. Comes from humidity,
//           wind, cloud cover or rain, then scaled by the Density dial.
//   Below zero it uses the absolute value and drops an octave.
//
// New in v2, as in the web version:
//   Melody mode   each hit walks the shared scale and leans onto a shared chord
//                 progression that moves every 4, 8, 16 or 32 bars (or holds, as a drone) of Live's song position, so all
//                 City Tracks in a set play in the same key over the same chords.
//   Sleep         after sunset a city drifts off: more rests, softer notes, and in
//                 deep sleep it moves at half speed. It stirs before sunrise.
//   Rain chance   the chance of rain this hour thins the line (up to a third resting).
//   Auto rate     air pressure sets the pace: settled high pressure in 1/8s, otherwise 1/16s.
//   Flourishes    unsettled weather adds quick ornaments: grace notes, doubles, little runs.
//   Lead swell    the three cities take turns leading: one up front, one back, one further back.
//   Mod wheel     the sun's arc as CC1, as before. CC74 carries brightness (sun, less when asleep).
//
// Messages in (from the patch):
//   city <0-2>  hitsource <0-3>  density <0-100>  note <midi>  rate <0-6, 0 = Auto>
//   chance <0-100>  mode <0 rhythm | 1 melody>  tick | restart | panic
// Messages in (from city_weather.js):
//   names, weather, sun, sleep, harmony, status
//
// Outlets:
//   0: pitch velocity            -> [midiformat] note inlet
//   1: w | d | p <words>         -> the three display lines
//   2: value controller          -> [midiformat] CC inlet
//   3: interval <note value>     -> the metro, to change step rate

autowatch = 1;
inlets = 1;
outlets = 4;

const SOURCES = ["humidity", "wind", "cloud", "rain"];
const RATES = ["32n", "16n", "8n", "4n", "2n", "1n"];
const BEATS = { "32n": 0.125, "16n": 0.25, "8n": 0.5, "4n": 1, "2n": 2, "1n": 4 };
const SCALES = [
  ["minor pentatonic", [0, 3, 5, 7, 10]], ["major pentatonic", [0, 2, 4, 7, 9]], ["dorian", [0, 2, 3, 5, 7, 9, 10]],
  ["natural minor", [0, 2, 3, 5, 7, 8, 10]], ["major", [0, 2, 4, 5, 7, 9, 11]], ["lydian", [0, 2, 4, 6, 7, 9, 11]],
  ["phrygian", [0, 1, 3, 5, 7, 8, 10]], ["whole tone", [0, 2, 4, 6, 8, 10]], ["mixolydian", [0, 2, 4, 5, 7, 9, 10]],
  ["harmonic minor", [0, 2, 3, 5, 7, 8, 11]], ["blues", [0, 3, 5, 6, 7, 10]], ["suspended pentatonic", [0, 2, 5, 7, 10]],
  ["yo", [0, 2, 5, 7, 9]], ["kumoi", [0, 2, 3, 7, 9]], ["major hexatonic", [0, 2, 4, 7, 9, 11]],
  ["minor hexatonic", [0, 2, 3, 5, 7, 10]], ["ryukyu", [0, 4, 5, 7, 11]]
];

let names = ["Boston", "Copenhagen", "London"];
let slot = 0;
const data = {};      // city -> { t, h, w, c, r, off, p, g, pp, p3 }
const sunData = {};   // city -> { arc, day, light }
const sleepData = {}; // city -> depth 0-1
let hitSource = "humidity", densityAmt = 0.5, baseNote = 60, chanceAmt = 1, rateIdx = 0, playMode = 0;
let keyRoot = 0, scaleIdx = 0, changeIdx = 0;   // changeIdx: the chord moves every 4, 8, 16 or 32 bars, or never (a drone)
let steps = 0, hits = 0, pattern = [], pos = 0, cold = false, tickCount = 0, mel = null;
const held = [];      // notes waiting for their note-off on the next tick

const cur = () => names[slot];
const sl = () => sleepData[cur()] || 0;
const light = () => (sunData[cur()] ? (sunData[cur()].light ?? sunData[cur()].day) : 1);
const scale = () => (SCALES[scaleIdx] || SCALES[0])[1];

function euclid(k, n) { const p = []; for (let i = 0; i < n; i++) p.push((i * k) % n < k ? 1 : 0); return p; }

function sourceAmount(d) {
  switch (hitSource) {
    case "wind":  return Math.min(d.w, 50) / 50;
    case "cloud": return d.c / 100;
    case "rain":  return Math.min(d.r, 5) / 5;
    default:      return d.h / 100;
  }
}

function say(line, text) {
  const words = String(text).split(" ").filter(s => s.length).map(s => (/^-?\d+(\.\d+)?$/.test(s) ? Number(s) : s));
  outlet(1, [line].concat(words));
}
function viz() { try { messnamed.apply(null, ["cityviz"].concat(Array.prototype.slice.call(arguments))); } catch (e) {} }

function show() {
  const d = data[cur()];
  if (!d) return;
  const s = sunData[cur()], depth = sl();
  const state = !s ? "" : s.day ? ` | sun ${Math.round(s.arc * 100)}%` : depth > 0.6 ? " | asleep" : depth > 0.05 ? " | drifting off" : " | night";
  say("w", `${cur()} ${d.t}°C${state}${playMode ? " | " + (SCALES[scaleIdx] || SCALES[0])[0] : ""}`);
  say("d", `hum ${Math.round(d.h)}% | wind ${Math.round(d.w)} km/h | gusts ${Math.round(d.g || 0)} | ${d.p || "–"} hPa | rain ${d.r} mm${d.pp >= 0 ? " (" + d.pp + "%)" : ""}`);
  const shape = pattern.map(x => (x ? "x" : ".")).join("");
  viz("pattern", cur(), shape);
  say("p", `${steps} steps | ${hits} ${hits === 1 ? "hit" : "hits"} from ${hitSource} | ${rateIdx === 0 ? "auto " + autoRate() : RATES[rateIdx - 1]} | ${shape}`);
}

// Air pressure sets the pace when Rate is on Auto
function autoRate() { const d = data[cur()]; return d && d.p > 1020 ? "8n" : "16n"; }
function sendRate() { outlet(3, "interval", rateIdx === 0 ? autoRate() : RATES[rateIdx - 1]); }

function rebuild() {
  const d = data[cur()];
  if (!d) { say("w", `${cur()}: waiting for weather`); say("d", ""); say("p", ""); return; }
  steps = Math.max(2, Math.abs(Math.round(d.t)));
  hits = Math.max(1, Math.min(steps, Math.round(steps * sourceAmount(d) * densityAmt)));
  cold = d.t < 0;
  pattern = euclid(hits, steps);
  pos = pos % steps;
  sendRate();
  show();
}

// ---- harmony, shared by every City Track through Live's song position ----
function progression() {
  const n = scale().length;
  const opts = n >= 7 ? [[0, 5, 3, 4], [0, 3, 4, 0], [0, 4, 5, 3], [5, 3, 0, 4]] : n === 5 ? [[0, 3, 1, 2], [0, 2, 3, 1], [0, 3, 4, 2]] : [[0, 2, 4, 1], [0, 3, 1, 4]];
  return opts[(keyRoot + scaleIdx) % opts.length];   // the same choice on every device
}
let live = null;
function songBeats() {
  try { if (!live) live = new LiveAPI("live_set"); return Number(live.get("current_song_time")) || 0; }
  catch (e) { return tickCount * BEATS[rateIdx === 0 ? autoRate() : RATES[rateIdx - 1]]; }
}
function tempo() { try { if (!live) live = new LiveAPI("live_set"); return Number(live.get("tempo")) || 120; } catch (e) { return 120; } }
const CHANGE_BARS = [4, 8, 16, 32];
function chordRoot() {   // a new chord every 4, 8, 16 or 32 bars; a drone stays on the home chord
  const p = progression();
  if (changeIdx >= CHANGE_BARS.length) return p[0];
  return p[Math.floor(songBeats() / (4 * CHANGE_BARS[changeIdx])) % p.length];
}

function nextDegree(atStart) {
  const n = scale().length, d0 = data[cur()], root = chordRoot();
  if (mel == null) mel = root;
  const wind = Math.min(d0 ? d0.w : 10, 50) / 50, hum = d0 ? d0.h / 100 : 0.5;
  let d = mel, dir = 0;
  if (Math.random() > hum * 0.18) {                                  // humid air repeats itself
    const leap = Math.random() < 0.08 + wind * 0.45;                 // wind makes it leap
    const size = leap ? 2 + Math.floor(Math.random() * (2 + Math.round(wind * 3))) : 1;
    dir = Math.random() < 0.5 ? 1 : -1;
    if (mel > n + 2) dir = -1; else if (mel < -3) dir = 1;
    d = mel + dir * size;
  }
  const tones = [root, root + 2, root + 4].map(x => ((x % n) + n) % n), isTone = x => tones.indexOf(((x % n) + n) % n) >= 0;
  const pull = baseNote >= 62 ? 0.8 : 0.55;   // a high line is the most exposed, so it sits on the chord more often
  if ((atStart || Math.random() < pull) && !isTone(d)) {
    const way = dir || (Math.random() < 0.5 ? 1 : -1);
    for (let k = 1; k <= 3; k++) { if (isTone(d + way * k) && d + way * k !== mel) { d += way * k; break; } }
  }
  if (d < -5) d += n; else if (d > n + 4) d -= n;
  mel = d;
  return d;
}
function noteFor(deg) {
  const sc = scale(), n = sc.length, o = Math.floor(deg / n), i = ((deg % n) + n) % n;
  return baseNote + (keyRoot > 6 ? keyRoot - 12 : keyRoot) + sc[i] + 12 * o;
}

// ---- the weather's extra touches ----
function rainGap() { const d = data[cur()]; return !d || d.pp == null || d.pp < 0 ? 0 : 0.35 * Math.max(0, d.pp - 10) / 90; }
function flourishChance() {
  const d = data[cur()]; if (!d || !d.p) return 0;
  const low = Math.max(0, Math.min(1, (1008 - d.p) / 18)), gusty = Math.max(0, Math.min(1, ((d.g || 0) - 25) / 30));
  const falling = d.p3 ? Math.max(0, Math.min(1, (d.p3 - d.p) / 4)) : 0;
  return Math.min(0.2, 0.2 * (low + 0.25 * gusty + 0.3 * falling)) * (1 - sl());
}
// The lead passes round the three cities every minute or two, the same on every device (it follows the clock)
function leadSwell() {
  const x = Date.now() / 100000;
  return 0.62 + 0.38 * (0.5 + 0.5 * Math.cos(2 * Math.PI * (x - slot / 3)));
}

function play(pitch, vel, offAfterMs) {
  pitch = Math.max(0, Math.min(127, Math.round(pitch)));
  vel = Math.max(1, Math.min(127, Math.round(vel)));
  outlet(0, pitch, vel);
  if (offAfterMs && typeof Task !== "undefined") { const t = new Task(function () { outlet(0, pitch, 0); }); t.schedule(offAfterMs); }
  else held.push(pitch);
}
function later(ms, fn) { if (typeof Task === "undefined") return; const t = new Task(fn); t.schedule(ms); }

function tick() {
  while (held.length) outlet(0, held.pop(), 0);
  if (!pattern.length) return;
  tickCount++;
  if (sl() >= 0.5 && tickCount % 2) return;                           // deep sleep moves at half speed
  const depth = sl();
  const played = pattern[pos] && Math.random() < chanceAmt && Math.random() > depth * 0.75 && Math.random() > rainGap();
  viz("pos", cur(), pos, played ? 1 : 0);
  if (played) {
    let v = (pos === 0 ? 1 : 0.7) * (0.55 + 0.45 * light()) * (1 - depth * 0.3) * (0.85 + Math.random() * 0.15) * leadSwell();
    const vel = 30 + 97 * Math.min(1, v);
    const drop = cold ? 12 : 0;
    if (playMode === 1) {
      const deg = nextDegree(pos === 0), pitch = noteFor(deg) - drop;
      play(pitch, vel);
      if (Math.random() < flourishChance()) {                         // unsettled weather ornaments the line
        const step = 60000 / tempo() * BEATS["32n"], k = Math.random();
        if (k < 0.5) later(step, () => play(pitch, vel * 0.55, step * 0.8));                                  // a double
        else [1, 2].forEach(j => later(step * j, () => play(noteFor(deg - j) - drop, vel * (0.5 - j * 0.08), step * 0.8)));   // a little run
      }
    } else {
      play(baseNote - drop, vel);
      if (Math.random() < flourishChance()) { const step = 60000 / tempo() * BEATS["32n"]; later(step, () => play(baseNote - drop, vel * 0.55, step * 0.8)); }
    }
  }
  pos = (pos + 1) % steps;
}

function sendCCs() {
  const s = sunData[cur()];
  if (!s) return;
  outlet(2, Math.round(s.arc * 127), 1);
  outlet(2, Math.round(Math.max(0, Math.min(1, 0.25 + 0.75 * s.arc - 0.4 * sl())) * 127), 74);
}

// ---- messages ----
function anything() {
  const a = arrayfromargs(messagename, arguments);
  const kind = a[0];
  if (kind === "names") { names = a.slice(1, 4).map(String); mel = null; rebuild(); sendCCs(); return; }
  if (kind === "weather") {
    const n = String(a[1]), v = a.slice(2).map(Number);
    data[n] = { t: v[0], h: v[1], w: v[2], c: v[3] || 0, r: v[4] || 0, off: v[5] || 0, p: v[6] || 0, g: v[7] || 0, pp: v[8] == null ? -1 : v[8], p3: v[9] || 0 };
    if (n === cur()) rebuild();
    return;
  }
  if (kind === "sun") { sunData[String(a[1])] = { arc: Number(a[2]), day: Number(a[3]) === 1, light: a[5] == null ? Number(a[3]) : Number(a[5]) }; if (String(a[1]) === cur()) { sendCCs(); show(); } return; }
  if (kind === "sleep") { sleepData[String(a[1])] = Number(a[2]); return; }
  if (kind === "harmony") { keyRoot = Number(a[1]) || 0; scaleIdx = Number(a[2]) || 0; changeIdx = Math.max(0, Math.min(4, Number(a[3]) || 0)); mel = null; show(); return; }
  if (kind === "status") { if (!data[cur()]) say("w", a.slice(1).join(" ")); return; }
}

function city(v) { panic(); slot = Math.max(0, Math.min(2, Math.round(Number(v)) || 0)); pos = 0; mel = null; rebuild(); sendCCs(); }
function hitsource(v) { const s = typeof v === "number" ? SOURCES[Math.max(0, Math.min(3, Math.round(v)))] : v; if (SOURCES.indexOf(s) < 0) return; hitSource = s; rebuild(); }
function density(v) { densityAmt = Math.max(0, Math.min(100, Number(v))) / 100; rebuild(); }
function note(n) { panic(); baseNote = Math.max(0, Math.min(127, Math.round(n))); }
function rate(i) { rateIdx = Math.max(0, Math.min(RATES.length, Math.round(i))); sendRate(); show(); }
function chance(v) { chanceAmt = Math.max(0, Math.min(100, Number(v))) / 100; }
function mode(v) { panic(); playMode = Math.round(Number(v)) ? 1 : 0; mel = null; show(); }
function restart() { panic(); pos = 0; mel = null; }
function panic() { while (held.length) outlet(0, held.pop(), 0); }
