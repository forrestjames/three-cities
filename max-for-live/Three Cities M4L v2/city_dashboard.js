// City Dashboard (v2)
// Runs inside a [v8ui] box (Max 9 / Live 12). Shows all three cities side by side:
// local time, temperature, the sun's position, weather bars, and each city's
// rhythm as a ring with a live playhead.
//
// Messages in:
//   weather <city> <temp> <hum> <wind> <cloud> <rain> <utc offset s>   (from city_weather.js)
//   sun <city> <arc> <isDay> <progress>                                (from city_weather.js)
//   pattern <city> <shape e.g. x..x.x.>                                (from City Track devices)
//   pos <city> <step> <played 0|1>                                     (from City Track devices)
//   names <a> <b> <c>                                                  (v2: the three cities, any places)
//   sleep <city> <depth 0-1>                                           (v2: shown as drifting off / asleep)
// Anything else is ignored.

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

inlets = 1;
outlets = 0;

let ORDER = ["Boston", "Copenhagen", "London"];
const SLOT_ACCENT = ["#d08a6a", "#6fa38c", "#a98bc4"];   // terracotta, green-teal, dusty lavender, as on the web
let ACCENT = {};

let city = {};
function setNames(list) {
  const next = {};
  list.forEach(n => { next[n] = city[n] || { w: null, sun: null, shape: null, pos: -1, played: false, sleep: 0 }; });
  ORDER = list.slice(0, 3); city = next;
  ACCENT = {}; ORDER.forEach((n, i) => { ACCENT[n] = SLOT_ACCENT[i]; });
}
setNames(ORDER);

function hex(h, a) {
  const v = parseInt(h.slice(1), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255, a === undefined ? 1 : a];
}
function rgba(c) { mgraphics.set_source_rgba(c[0], c[1], c[2], c[3]); }

// Pattern a City Track would make at its default settings, used until a track reports in.
function defaultShape(w) {
  const steps = Math.max(2, Math.abs(Math.round(w[0])));
  const hits = Math.max(1, Math.min(steps, Math.round(steps * w[1] / 100 * 0.5)));
  let s = "";
  for (let i = 0; i < steps; i++) s += (i * hits) % steps < hits ? "x" : ".";
  return s;
}

function localTime(offset) {
  const d = new Date(Date.now() + offset * 1000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return hh + ":" + mm;
}

// ---- messages ----
function anything() {
  const a = arrayfromargs(messagename, arguments);
  const kind = a[0], name = a[1];
  if (kind === "names") { const l = a.slice(1, 4).map(String); if (l.join("|") !== ORDER.join("|")) { setNames(l); mgraphics.redraw(); } return; }
  const c = city[name];
  if (!c) return;
  if (kind === "weather") {
    c.w = a.slice(2, 9).map(Number);
  } else if (kind === "sun") {
    c.sun = { arc: Number(a[2]), day: Number(a[3]) === 1, prog: Number(a[4] || 0) };
  } else if (kind === "sleep") {
    c.sleep = Number(a[2]) || 0;
  } else if (kind === "pattern") {
    c.shape = String(a[2]);
  } else if (kind === "pos") {
    c.pos = Number(a[2]);
    c.played = Number(a[3]) === 1;
  } else {
    return;
  }
  mgraphics.redraw();
}

// ---- drawing ----
function text(str, x, y, size, col, bold) {
  mgraphics.select_font_face(bold ? "Arial Bold" : "Arial");
  mgraphics.set_font_size(size);
  rgba(col);
  mgraphics.move_to(x, y);
  mgraphics.show_text(str);
}

function textRight(str, xr, y, size, col, bold) {
  mgraphics.select_font_face(bold ? "Arial Bold" : "Arial");
  mgraphics.set_font_size(size);
  const w = mgraphics.text_measure(str)[0];
  text(str, xr - w, y, size, col, bold);
}

function panel(name, x, y, w, h) {
  const c = city[name];
  const acc = ACCENT[name];
  const day = c.sun ? c.sun.day : true;
  const glow = c.sun && c.sun.day ? c.sun.arc : 0;

  // Background: deep blue at night, warming with the sun by day.
  const night = [0.09, 0.10, 0.16];
  const dayCol = [0.17 + 0.07 * glow, 0.16 + 0.04 * glow, 0.15];
  const bg = day ? dayCol : night;
  mgraphics.set_source_rgba(bg[0], bg[1], bg[2], 1);
  mgraphics.rectangle_rounded(x, y, w, h, 8, 8);
  mgraphics.fill();

  const white = [0.95, 0.95, 0.95, 1];
  const dim = [0.95, 0.95, 0.95, 0.45];

  text(name, x + 10, y + 18, 12, hex(acc), true);
  if (!c.w) {
    text("waiting for weather", x + 10, y + 36, 10, dim);
    return;
  }
  const [temp, hum, wind, cloud, rain, offset] = c.w;
  text(localTime(offset || 0) + (day ? "  day" : c.sleep > 0.6 ? "  asleep" : c.sleep > 0.05 ? "  drifting off" : "  night"), x + 10, y + 33, 10, dim);
  textRight(Math.round(temp * 10) / 10 + "°", x + w - 10, y + 26, 20, white, true);

  // ---- rhythm ring ----
  const shape = c.shape || defaultShape(c.w);
  const n = shape.length;
  const cx = x + 58, cy = y + h - 58, R = 40;
  rgba(hex(acc, 0.18));
  mgraphics.set_line_width(1);
  mgraphics.ellipse(cx - R, cy - R, R * 2, R * 2);
  mgraphics.stroke();
  const dot = Math.max(2, Math.min(5, 70 / n));
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const px = cx + R * Math.cos(ang), py = cy + R * Math.sin(ang);
    const hit = shape[i] === "x";
    const here = i === c.pos;
    let r = hit ? dot : dot * 0.5;
    if (here) {
      r += c.played ? 3 : 1.5;
      rgba(c.played ? white : hex(acc, 0.9));
    } else {
      rgba(hit ? hex(acc, day ? 1 : 0.55) : [1, 1, 1, 0.2]);
    }
    mgraphics.ellipse(px - r, py - r, r * 2, r * 2);
    mgraphics.fill();
  }
  const hits = shape.split("").filter(s => s === "x").length;
  mgraphics.select_font_face("Arial Bold");
  mgraphics.set_font_size(13);
  const label = String(n);
  const lw = mgraphics.text_measure(label)[0];
  text(label, cx - lw / 2, cy + 2, 13, white, true);
  const sub = hits + (hits === 1 ? " hit" : " hits");
  mgraphics.select_font_face("Arial");
  mgraphics.set_font_size(9);
  const sw = mgraphics.text_measure(sub)[0];
  text(sub, cx - sw / 2, cy + 13, 9, dim);

  // ---- sun arc ----
  const sx = x + w - 52, sy = y + 66, SR = 26;
  rgba([1, 1, 1, 0.25]);
  mgraphics.set_line_width(1);
  mgraphics.arc(sx, sy, SR, Math.PI, 2 * Math.PI);
  mgraphics.stroke();
  mgraphics.move_to(sx - SR - 6, sy);
  mgraphics.line_to(sx + SR + 6, sy);
  mgraphics.stroke();
  if (c.sun && c.sun.day) {
    const a = Math.PI + Math.PI * c.sun.prog;
    const ux = sx + SR * Math.cos(a), uy = sy + SR * Math.sin(a);
    rgba([1, 0.82, 0.35, 0.25]);
    mgraphics.ellipse(ux - 8, uy - 8, 16, 16);
    mgraphics.fill();
    rgba([1, 0.82, 0.35, 1]);
    mgraphics.ellipse(ux - 4.5, uy - 4.5, 9, 9);
    mgraphics.fill();
  } else if (c.sun) {
    // A small crescent moon below the horizon.
    rgba([0.85, 0.88, 1, 0.9]);
    mgraphics.ellipse(sx - 5, sy + 4, 10, 10);
    mgraphics.fill();
    mgraphics.set_source_rgba(bg[0], bg[1], bg[2], 1);
    mgraphics.ellipse(sx - 2, sy + 2, 10, 10);
    mgraphics.fill();
  }

  // ---- weather bars ----
  const bars = [
    ["hum", hum / 100, Math.round(hum) + "%"],
    ["wind", Math.min(wind, 50) / 50, Math.round(wind) + " km/h"],
    ["cloud", cloud / 100, Math.round(cloud) + "%"],
    ["rain", Math.min(rain, 5) / 5, rain + " mm"]
  ];
  const bx = x + 112, bw = w - 122;
  bars.forEach((b, i) => {
    const by = y + h - 64 + i * 15;
    text(b[0], bx, by + 7, 9, dim);
    const barX = bx + 30, barW = bw - 30 - 46;   // leave room for the value
    rgba([1, 1, 1, 0.1]);
    mgraphics.rectangle(barX, by, barW, 6);
    mgraphics.fill();
    rgba(hex(acc, 0.85));
    mgraphics.rectangle(barX, by, Math.max(1, barW * Math.max(0, Math.min(1, b[1]))), 6);
    mgraphics.fill();
    textRight(b[2], x + w - 10, by + 7, 8, [1, 1, 1, 0.35]);
  });
}

function size() {
  if (mgraphics.size) return mgraphics.size;
  return [box.rect[2] - box.rect[0], box.rect[3] - box.rect[1]];
}

function paint() {
  const [W, H] = size();
  mgraphics.set_source_rgba(0.12, 0.12, 0.12, 1);
  mgraphics.rectangle(0, 0, W, H);
  mgraphics.fill();
  const gap = 6;
  const pw = (W - gap * 4) / 3;
  ORDER.forEach((n, i) => panel(n, gap + i * (pw + gap), gap, pw, H - gap * 2));
}
