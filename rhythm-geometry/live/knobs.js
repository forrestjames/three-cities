/* Small knobs for the Pad and Slice pages: the same dials as the Three Cities app. Any range input with class "k" becomes a knob.
   Drag up and down, scroll, use the arrow keys, or double-click to go back to the starting value. */
(function () {
  var R = 23;
  function pt(a, r) { var d = a * Math.PI / 180; return [30 + r * Math.sin(d), 30 - r * Math.cos(d)]; }
  function arc(a0, a1) { var p = pt(a0, R), q = pt(a1, R); return 'M' + p[0].toFixed(2) + ' ' + p[1].toFixed(2) + ' A' + R + ' ' + R + ' 0 ' + ((a1 - a0) > 180 ? 1 : 0) + ' 1 ' + q[0].toFixed(2) + ' ' + q[1].toFixed(2); }
  function draw(input) {
    var d = input._dial; if (!d) return;
    var a = -135 + 270 * (+input.value - +input.min) / (+input.max - +input.min);
    d.querySelector('.val').setAttribute('d', a > -134.9 ? arc(-135, a) : 'M30 30');
    var p1 = pt(a, 9), p2 = pt(a, 19), p = d.querySelector('.ptr');
    p.setAttribute('x1', p1[0].toFixed(2)); p.setAttribute('y1', p1[1].toFixed(2)); p.setAttribute('x2', p2[0].toFixed(2)); p.setAttribute('y2', p2[1].toFixed(2));
    d.setAttribute('aria-valuenow', input.value);
  }
  function set(input, v) {
    var min = +input.min, max = +input.max, step = +input.step || 1, s = Math.round((Math.min(max, Math.max(min, v)) - min) / step) * step + min;
    if (String(s) === input.value) return; input.value = String(s); input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function make(input) {
    var cell = input.parentElement; cell.classList.add('knob-cell');
    var d = document.createElement('div'); d.className = 'dial'; d.tabIndex = 0; d.setAttribute('role', 'slider');
    d.setAttribute('aria-label', input.getAttribute('aria-label') || input.id); d.setAttribute('aria-valuemin', input.min); d.setAttribute('aria-valuemax', input.max);
    d.innerHTML = '<svg viewBox="0 0 60 60" aria-hidden="true"><circle class="face" cx="30" cy="30" r="25"/><path class="trk" d="' + arc(-135, 135) + '"/><path class="val" d="M30 30"/><line class="ptr" x1="30" y1="30" x2="30" y2="30"/></svg>';
    input.classList.add('sr-only'); input.tabIndex = -1; input._dial = d; cell.insertBefore(d, input);
    var step = +input.step || 1, span = +input.max - +input.min, drag = null, home = +input.defaultValue;
    d.addEventListener('pointerdown', function (e) { drag = { y: e.clientY, v: +input.value }; d.setPointerCapture(e.pointerId); e.preventDefault(); });
    d.addEventListener('pointermove', function (e) { if (drag) set(input, drag.v + (drag.y - e.clientY) * span / 150); });
    d.addEventListener('pointerup', function () { drag = null; }); d.addEventListener('pointercancel', function () { drag = null; });
    d.addEventListener('wheel', function (e) { e.preventDefault(); set(input, +input.value + (e.deltaY < 0 ? step : -step) * (e.shiftKey ? 10 : 1)); }, { passive: false });
    d.addEventListener('dblclick', function () { set(input, home); });
    d.addEventListener('keydown', function (e) {
      var k = e.key; e.stopPropagation();
      if (k === 'ArrowUp' || k === 'ArrowRight') set(input, +input.value + step); else if (k === 'ArrowDown' || k === 'ArrowLeft') set(input, +input.value - step);
      else if (k === 'Home') set(input, +input.min); else if (k === 'End') set(input, +input.max); else return; e.preventDefault();
    });
    input.addEventListener('input', function () { draw(input); }); draw(input);
  }
  function go() { document.querySelectorAll('input[type=range].k').forEach(make); }
  window.RGKnobs = { redraw: function () { document.querySelectorAll('input[type=range].k').forEach(draw); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
