"""Build the manual PDF and the device pictures.
Run from the repo root:  python3 max-for-live/manual/build.py
Needs: python3 + playwright (chromium)."""
import pathlib, sys
from playwright.sync_api import sync_playwright
here = pathlib.Path(__file__).resolve().parent
(here / 'img').mkdir(exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    # 1. pictures of the two devices (drawn from the patches, not screenshots from Live)
    pg = b.new_page(viewport={'width': 900, 'height': 500}, device_scale_factor=2)
    dev = (here / 'devices.html').as_uri()
    for d, sel, name in [('track', '#track', 'city-track'), ('dash', '#dash', 'city-dashboard'), ('track-rhythm', '#track', 'city-track-rhythm')]:
        pg.goto(dev + '?d=' + d); pg.wait_for_timeout(250); pg.locator(sel).screenshot(path=str(here / 'img' / (name + '.png')))
    # 2. the manual
    pg = b.new_page(viewport={'width': 1280, 'height': 800})
    pg.on('pageerror', lambda e: print('PAGE ERROR', e))
    pg.goto((here / 'manual.html').as_uri()); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(500)
    if '--shots' in sys.argv:
        for i in range(1, 9):
            pg.locator(f'#p{i}').screenshot(path=str(here / f'_p{i}.png'))
    pg.pdf(path=str(here.parent / 'Three Cities Manual.pdf'), width='1280px', height='800px', print_background=True, margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'})
    b.close()
print('built')
