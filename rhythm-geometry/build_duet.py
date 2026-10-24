#!/usr/bin/env python3
"""Builds duet/index.html from index.html.
The duet page plays the conga ring and ONE drum ring at a time, then moves on to the next, so the music keeps changing.
Run this after changing index.html:   python3 build_duet.py
"""
import os, re
here = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(here, 'index.html'), encoding='utf8').read()

def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (s.count(a), a[:100])
    s = s.replace(a, b)

# --- names and links
rep('<title>Rhythm Geometry</title>', '<title>Rhythm Geometry: Duet</title>')
rep('<h1>Rhythm Geometry</h1>', '<h1>Rhythm Geometry <span class="altname">duet</span></h1>', 2)
rep('<a class="altlink" href="duet/" title="The version where only the conga and one drum play at a time">Duet version</a>', '<a class="altlink" href="../" title="The version with every drum">Drum version</a>')
rep('href="melodic/"', 'href="../melodic/"')
rep('href="play/"', 'href="../play/"')
rep('  .wrap { padding:', '  .altname { font-size: .5em; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); margin-left: 8px; vertical-align: middle; }\n  .wrap { padding:')

# --- no sub bass, no neighbour rows (only two lanes at once)
m = re.search(r"  // the sub bass follows the kick[^\n]*\n  if \(k\) lanes\.push\(\{ id: 'sub'[^\n]*\n[^\n]*\n", s)
assert m, 'sub lane not found'
s = s.replace(m.group(0), '')
rep("function subSetup() {\n  if (sub.osc) return;", "function subSetup() {\n  return;   // the duet page has no sub bass\n  if (sub.osc) return;")
rep("  NEAR.list.forEach(o => lanes.push({ id: o.id,", "  [].forEach(o => lanes.push({ id: o.id,")
rep("  if (b <= 0.02 || !playing) return;", "  if (b <= 0.02 || !playing || DUET.on) return;   // neighbours would be a third voice")

# --- the engine, near the top so every later piece can see it
engine = r'''const REFRESH_MS = 10 * 60 * 1000;
// ---------- Duet: the conga ring and one drum at a time ----------
// The conga ring always plays. One drum ring plays with it, then after a few bars the next one takes over.
const DUET = { on: true, bars: 'mix', order: 'shuffle', cur: null, prev: null, next: 0, len: 2 };
function duetOk(id) { return !DUET.on || id === DUET.cur; }
function duetPool() { return kitList.filter(l => l.idx === 'k' && l.n > 0 && !l.noRing && !l.muted()); }
function duetPick(n) {
  const pool = duetPool();
  let nextId = null;
  if (pool.length) {
    if (DUET.order === 'hold' && pool.some(l => l.id === DUET.cur)) nextId = DUET.cur;
    else if (DUET.order === 'order') nextId = pool[(pool.findIndex(l => l.id === DUET.cur) + 1) % pool.length].id;
    else {
      let c = pool.filter(l => l.id !== DUET.cur && l.id !== DUET.prev);   // not the one just heard, nor the one before it
      if (!c.length) c = pool.filter(l => l.id !== DUET.cur);
      if (!c.length) c = pool;
      nextId = c[Math.floor(Math.random() * c.length)].id;
    }
  }
  if (nextId !== DUET.cur) DUET.prev = DUET.cur;
  DUET.cur = nextId;
  DUET.len = DUET.bars === 'mix' ? [1, 2, 2, 4, 4, 8][Math.floor(Math.random() * 6)] : Number(DUET.bars);
  DUET.next = (n % 16 === 0 ? n : Math.ceil(n / 16) * 16) + 16 * DUET.len;   // changes always land on a bar line
  duetPaint();
}
function duetStep(n) {
  if (!DUET.on) return;
  const gone = DUET.cur != null && !duetPool().some(l => l.id === DUET.cur);   // muted, or the genre changed
  if (n >= DUET.next || (gone && DUET.order !== 'hold') || (DUET.cur == null && n % 16 === 0)) duetPick(n);
}
function duetPaint() {
  const names = { ring: 'conga' };
  const lane = kitList.find(l => l.id === DUET.cur);
  document.querySelectorAll('#kit .lane').forEach(r => {
    const id = r.dataset.lane, around = /^(near\d|grit|quake)$/.test(id);
    r.classList.toggle('duet-off', DUET.on && !around && id !== 'ring' && id !== DUET.cur);
  });
  const el = document.getElementById('duetNow');
  if (!el) return;
  el.innerHTML = !DUET.on ? 'Off: every ring plays.' : lane ? `<b>Conga</b> + <b>${lane.label.replace(/_/g, ' ')}</b> <span>· changes in ${DUET.len} ${DUET.len === 1 ? 'bar' : 'bars'}</span>` : '<b>Conga</b> on its own <span>· no other ring is free</span>';
}
'''
rep("const REFRESH_MS = 10 * 60 * 1000;", engine)

# --- the left column control
html = '''      <div class="sidebox duet-sec" id="duetSec">
        <div class="chord-head">
          <p class="label">Duet <span class="hint">the conga and one drum at a time</span></p>
          <button id="duetOn" class="btn small tog" type="button" aria-pressed="true" title="On: only the conga and one drum play, and the drum changes. Off: every ring plays."><i class="tog-dot" aria-hidden="true"></i><span id="duetOnText">On</span></button>
        </div>
        <p class="duet-now" id="duetNow" aria-live="polite"></p>
        <div class="duetpick" role="group" aria-label="How long each drum stays"><span class="qlab">Stay</span>
          <button type="button" data-bars="mix" aria-pressed="true" title="A different length each time">Mixed</button><button type="button" data-bars="1" aria-pressed="false">1 bar</button><button type="button" data-bars="2" aria-pressed="false">2</button><button type="button" data-bars="4" aria-pressed="false">4</button><button type="button" data-bars="8" aria-pressed="false">8</button></div>
        <div class="duetpick" role="group" aria-label="Which drum comes next"><span class="qlab">Next</span>
          <button type="button" data-order="shuffle" aria-pressed="true" title="Any other drum, never the same one twice running">Shuffle</button><button type="button" data-order="order" aria-pressed="false" title="Down the list of rings">In order</button><button type="button" data-order="hold" aria-pressed="false" title="Stay on this drum">Hold</button><button id="duetSkip" type="button" title="Move to the next drum at the next bar">Skip</button></div>
      </div>
      <div class="sidebox groove-sec" id="grooveSec">'''
rep('      <div class="sidebox groove-sec" id="grooveSec">', html)
rep("  .groove-sec, .around-sec, .chord-sec {", "  .duet-now { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--ink-dim); }\n  .duet-now b { color: var(--ink); font-weight: 400; text-transform: capitalize; }\n  .duet-now span { color: var(--ink-faint); }\n  .duetpick { display: flex; align-items: stretch; border: 1px solid var(--line); }\n  .duetpick .qlab { display: flex; align-items: center; padding: 0 8px; font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-faint); }\n  .duetpick button { flex: 1; background: transparent; border: 0; border-left: 1px solid var(--line); padding: 5px 4px; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-dim); }\n  .duetpick button[aria-pressed=\"true\"] { background: rgba(243, 236, 230, 0.14); color: var(--ink); box-shadow: inset 0 -2px 0 var(--accent); }\n  .kit .lane.duet-off { opacity: .38; }\n  .knob-cell:has(#grooveBleed) { display: none; }\n  .groove-sec, .duet-sec, .around-sec, .chord-sec {")

# --- the gates
rep("const kickNow = k >= 0 && kickOn && state.kick.bd[k] && !kickDrift.skip && roll();", "const kickNow = k >= 0 && kickOn && duetOk('kick') && state.kick.bd[k] && !kickDrift.skip && roll();")
rep("const twinNow = tj >= 0 && twin.bits[tj] && kickOn && !laneMuted.twin && roll();", "const twinNow = tj >= 0 && twin.bits[tj] && kickOn && duetOk('twin') && !laneMuted.twin && roll();")
rep("  if (sh && sh.bits[k] && roll()) {", "  if (sh && duetOk('shaker') && sh.bits[k] && roll()) {")
rep("if (state.kick.voices[v][k] && !laneMuted[v]) {", "if (state.kick.voices[v][k] && !laneMuted[v] && duetOk(v)) {")
rep("  if (k >= 0 && shaker && !shaker.bits[k] &&", "  if (k >= 0 && shaker && duetOk('shaker') && !shaker.bits[k] &&")
rep("  if (k >= 0 && V && V.snare && V.snare.some(Boolean) && !V.snare[k] && !laneMuted.snare &&", "  if (k >= 0 && V && V.snare && duetOk('snare') && V.snare.some(Boolean) && !V.snare[k] && !laneMuted.snare &&")
rep("  if (k >= 0 && kickOn && state.kick.bd.some(", "  if (k >= 0 && kickOn && duetOk('kick') && state.kick.bd.some(")
rep("extrasOf(state.kick).filter(v => !laneMuted[v] && !SILENT.has(v))", "extrasOf(state.kick).filter(v => !laneMuted[v] && !SILENT.has(v) && duetOk(v))")
rep("  else if (!muted.shaker && shakerSrc(state.kick)) shakerHit(", "  else if (!muted.shaker && duetOk('shaker') && shakerSrc(state.kick)) shakerHit(")
rep("  schedN = n;\n", "  schedN = n;\n  duetStep(n);\n")
rep("  stepN = 0;\n  nextTime = ctx.currentTime + 0.05;", "  stepN = 0;\n  DUET.cur = null; DUET.prev = null; DUET.next = 0;\n  nextTime = ctx.currentTime + 0.05;")
rep("  renderVoiceTabs();\n  refreshChordRhythm();", "  renderVoiceTabs();\n  duetPaint();\n  refreshChordRhythm();")

# --- the picture: the drums that are resting fade
rep("    const dim = r.lane.muted() ? 0.3 : 1;", "    const dim = r.lane.muted() ? 0.3 : (duetOk(r.lane.id) ? 1 : 0.2);")
rep("    const lit = playKick >= 0 && !!r.lane.bits[playKick % r.L];\n    ringName(", "    const lit = playKick >= 0 && duetOk(r.lane.id) && !!r.lane.bits[playKick % r.L];\n    ringName(")
rep("r.lane.color, lit, r.lane.muted());", "r.lane.color, lit, r.lane.muted() || !duetOk(r.lane.id));")
rep("      const lit = hit && playKick >= 0 && (i % r.L) === playKick;", "      const lit = hit && duetOk(r.lane.id) && playKick >= 0 && (i % r.L) === playKick;")

# --- wiring
wire = r'''
// ---------- duet controls ----------
$('duetOn').addEventListener('click', () => {
  DUET.on = !DUET.on;
  $('duetOn').setAttribute('aria-pressed', String(DUET.on)); $('duetOnText').textContent = DUET.on ? 'On' : 'Off';
  if (DUET.on) DUET.next = 0; else { DUET.cur = null; DUET.prev = null; }
  duetPaint();
});
document.querySelectorAll('.duetpick button[data-bars]').forEach(b => b.addEventListener('click', () => {
  DUET.bars = b.dataset.bars;
  document.querySelectorAll('.duetpick button[data-bars]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
}));
document.querySelectorAll('.duetpick button[data-order]').forEach(b => b.addEventListener('click', () => {
  DUET.order = b.dataset.order;
  document.querySelectorAll('.duetpick button[data-order]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
}));
$('duetSkip').addEventListener('click', () => { DUET.next = 0; if (DUET.order === 'hold') DUET.order = 'shuffle', document.querySelectorAll('.duetpick button[data-order]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.order === 'shuffle'))); });
'''
rep("// ---------- start up ----------", wire + "\n// ---------- start up ----------")
rep("renderLanes();\nmapLayout(); drawMapBase();", "renderLanes();\nduetPaint();\nmapLayout(); drawMapBase();")

# --- a line in the story
rep("  if (room) lines.push(room);\n", "  if (room) lines.push(room);\n  if (DUET.on) lines.push('Only the conga and one drum play at a time. The drum changes every few bars.');\n")
rep('<p class="kit-credit">Drum sounds:', '<p class="kit-credit">One drum at a time. Drum sounds:')

os.makedirs(os.path.join(here, 'duet'), exist_ok=True)
open(os.path.join(here, 'duet', 'index.html'), 'w', encoding='utf8').write(s)
print('built duet/index.html', len(s))
