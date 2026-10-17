"""Render every launch graphic to PNG.  Run:  python3 launch-graphics/render.py [name ...]"""
import sys, pathlib
from playwright.sync_api import sync_playwright
here = pathlib.Path(__file__).resolve().parent
out = here / 'social' / 'png'; out.mkdir(exist_ok=True)
page_url = (here / 'social' / 'social.html').as_uri()
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1600, 'height': 2000})
    pg.on('pageerror', lambda e: print('PAGE ERROR', e))
    pg.goto(page_url); pg.wait_for_timeout(200)
    names = sys.argv[1:] or pg.evaluate('NAMES')
    for n in names:
        pg.goto(page_url + '?d=' + n); pg.wait_for_function('document.fonts.ready.then(()=>true)'); pg.wait_for_timeout(350)
        pg.locator('#stage').screenshot(path=str(out / (n + '.png')))
        print('rendered', n)
    b.close()
