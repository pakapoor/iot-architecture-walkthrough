import os
ROOT = os.path.dirname(os.path.abspath(__file__))
import sys, os
from playwright.sync_api import sync_playwright
mode = sys.argv[1]  # png | frames
out = f'{ROOT}/frames'; os.makedirs(out, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    scale = 2 if mode == 'png' else 1.2
    pg = b.new_page(viewport={'width': 1600, 'height': 1000}, device_scale_factor=scale)
    pg.goto(f'file://{ROOT}/iot.html'); pg.wait_for_timeout(500)
    el = pg.locator('#c')
    def at(ms):
        pg.evaluate(f"document.getAnimations().forEach(a=>{{a.pause();a.currentTime={ms}}})")
    if mode == 'png':
        at(1250); el.screenshot(path=f'{ROOT}/Commercial_IoT_Monitoring_System.png')
    else:
        fps = 20
        for i in range(3 * fps):
            at(i * 1000 / fps); el.screenshot(path=f'{out}/f{i:03d}.png')
    b.close()
