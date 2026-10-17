"""Render animated MP4s.  Run from the repo root:
   python3 -I launch-graphics/render_anim.py [launch|social] [name ...]
Frames come from setT(t) in anim.js, so every frame is exact. Needs ffmpeg."""
import sys, pathlib, subprocess
from multiprocessing import Pool
from playwright.sync_api import sync_playwright
here = pathlib.Path(__file__).resolve().parent
PAGES = {'launch': here / 'src' / 'launch.html', 'social': here / 'social' / 'social.html', 'square': here / 'social' / 'square.html'}
FPS, SECS = 24, 6

def work(job):
    kind, names = job
    out = here / 'animated' / kind; out.mkdir(parents=True, exist_ok=True)
    url = PAGES[kind].as_uri()
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1600, 'height': 2000})
        pg.on('pageerror', lambda e: print('PAGE ERROR', e))
        for n in names:
            pg.goto(url + '?d=' + n); pg.wait_for_function('document.fonts.ready.then(()=>true)'); pg.evaluate('resetAnim()'); pg.wait_for_timeout(250)
            box = pg.locator('#stage'); w, h = pg.evaluate('[document.getElementById("stage").offsetWidth, document.getElementById("stage").offsetHeight]')
            ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(out / (n + '.mp4'))], stdin=subprocess.PIPE)
            for f in range(FPS * SECS):
                pg.evaluate('setT(%f)' % (f / FPS))
                ff.stdin.write(box.screenshot(type='jpeg', quality=95))
            ff.stdin.close(); ff.wait(); print('animated', kind, n, flush=True)
        b.close()

if __name__ == '__main__':
    kind = sys.argv[1]; names = sys.argv[2:]
    if not names:
        with sync_playwright() as p:
            b = p.chromium.launch(); pg = b.new_page(); pg.goto(PAGES[kind].as_uri()); names = pg.evaluate('NAMES'); b.close()
    jobs = [(kind, names[i::2]) for i in range(2)]
    with Pool(2) as pool: pool.map(work, jobs)
