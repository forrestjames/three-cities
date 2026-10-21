"""Capture crisp (4x) crops of the real interface for the square Instagram set.
Run from the repo root: python3 -I launch-graphics/capture_square.py
Loads index.html offline, so the cards show the saved weather snapshot."""
import pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
out = root / 'launch-graphics' / 'social' / 'assets' / 'sq'; out.mkdir(parents=True, exist_ok=True)
mock = """(() => { const outs = new Map([['ufx', { id:'ufx', name:'Fireface UCX', send(){}, state:'connected', type:'output' }]]);
  navigator.requestMIDIAccess = async () => ({ outputs: outs, inputs: new Map(), onstatechange: null, sysexEnabled:false }); })();"""
DSF = 4
def box(pg, sel, i=0):
    return pg.evaluate("([s,i])=>{const e=document.querySelectorAll(s)[i]; e.scrollIntoView({block:'center',inline:'center'}); const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}", [sel, i])
def shot(pg, name, b, pad=0):
    c = {'x': b['x'] - pad, 'y': b['y'] - pad, 'width': b['width'] + 2 * pad, 'height': b['height'] + 2 * pad}
    pg.screenshot(path=str(out / (name + '.png')), clip=c); print(name, round(c['width']), 'x', round(c['height']))

def clipbox(pg, sels):
    """union box of several [selector, index] pairs"""
    return pg.evaluate("""(L)=>{const E=L.map(([s,i])=>document.querySelectorAll(s)[i]); E[0].scrollIntoView({block:'center',inline:'center'}); let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const e of E){const r=e.getBoundingClientRect();x0=Math.min(x0,r.x);x1=Math.max(x1,r.right);y0=Math.min(y0,r.y);y1=Math.max(y1,r.bottom);}return {x:x0,y:y0,width:x1-x0,height:y1-y0}}""", sels)
def run(p, prefix, vw, vh, mobile):
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=DSF, is_mobile=mobile, has_touch=mobile); ctx.add_init_script(mock)
    pg = ctx.new_page(); pg.clock.install(time='2026-10-21T17:30:00Z'); pg.on('pageerror', lambda e: print('ERR', e))
    pg.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
    pg.goto((root / 'index.html').as_uri()); pg.wait_for_timeout(2500)
    pg.add_style_tag(content='*{animation:none!important;transition:none!important}')
    S = lambda n, bx, pad=0: shot(pg, prefix + n, bx, pad)
    for i in range(3):
        S(f'card{i}', box(pg, '.city', i))
        S(f'card{i}-top', clipbox(pg, [['.city .city-head', i], ['.city .viz', i]]))
        cb = box(pg, '.city', i); vb = pg.evaluate("(i)=>{const r=document.querySelectorAll('.city .viz')[i].getBoundingClientRect();return r.bottom}", i)
        S(f'card{i}-topfull', {'x': cb['x'], 'y': cb['y'], 'width': cb['width'], 'height': vb - cb['y'] + 6})
        S(f'card{i}-chips', box(pg, '.city .glance', i), 6)
        S(f'card{i}-lower', clipbox(pg, [['.city .glance', i], ['.city .quick', i]]), 6)
    S('harm', box(pg, '.mod-harm'))
    bx = box(pg, '.mod-harm'); cy = pg.evaluate("document.querySelector('.mod-harm .chord-sec').getBoundingClientRect().y"); bx['height'] = cy - bx['y'] - 4; S('harm-top', bx)
    S('harm-chords', box(pg, '.mod-harm .chord-sec'), 10)
    S('filter', box(pg, '.mod-filter')); S('play', box(pg, '.mod-play'))
    S('groove-head', box(pg, '.groove-head')); S('groove-grid', box(pg, '#grooveGrid'), 8)
    S('groove', box(pg, '#groove')); S('groove-controls', box(pg, '.groove-controls'), 8)
    pg.evaluate("document.getElementById('fxWrap').open=true"); pg.wait_for_timeout(400)
    S('pedal-hall', box(pg, '.pedal-hall')); S('pedal-delay', box(pg, '.pedal-delay'))
    if not mobile:
        pg.evaluate("""()=>{const m=document.querySelector('.mod-midi'); const w=document.createElement('div'); w.id='mw'; w.style.cssText='position:fixed;left:20px;top:20px;width:470px;z-index:99999;background:#120a08;--led:#ffd98a'; document.body.appendChild(w); w.appendChild(m); m.style.cssText='width:470px;min-width:470px;max-width:470px;margin:0;flex:none'; const c=m.querySelector('.midi-chans'); c.style.gridTemplateColumns='repeat(3,1fr)'; window.scrollTo(0,0)}""")
    else:
        pg.evaluate("document.querySelector('.mod-midi').scrollIntoView()")
    if mobile: b.close(); return
    pg.wait_for_timeout(300); pg.locator('#midi').focus(); pg.wait_for_timeout(300)
    pg.locator('#midi').select_option(label=pg.evaluate("document.querySelectorAll('#midi option')[1].textContent")); pg.wait_for_timeout(400)
    S('midi-default', box(pg, '.mod-midi'))
    pg.evaluate("""()=>{const set=(q,v)=>{const s=document.querySelector(q); s.value=String(v); s.dispatchEvent(new Event('change',{bubbles:true}));};
      set('[data-city="0"]',4); set('[data-city="1"]',5); set('[data-city="2"]',6); set('[data-chords="1"]',0); set('[data-drums="1"]',9);}""")
    pg.wait_for_timeout(300); S('midi-rerouted', box(pg, '.mod-midi'))
    b.close()

with sync_playwright() as p:
    run(p, 'd-', 1208, 1100, False)
    run(p, 'p-', 390, 1100, True)
