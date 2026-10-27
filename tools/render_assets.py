"""Regenerate previews from the HTML source; requires Playwright and PyMuPDF."""
from pathlib import Path
import sys

import pymupdf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from browser_check import ROOT, browser_session


def render():
    with browser_session() as (browser, base):
        page = browser.new_page(viewport={'width': 1600, 'height': 1000}, device_scale_factor=1)
        page.goto(base + '/iot.html')
        page.add_script_tag(url=base + '/pres/icons.js')
        page.evaluate('document.getAnimations().forEach(a => {a.pause(); a.currentTime=1250})')
        preview_style = page.add_style_tag(content='.rhead,.cards,.foot{display:none}')
        page.screenshot(path=str(ROOT / 'pres/arch_snapshot.png'), clip={'x': 0, 'y': 0, 'width': 1600, 'height': 720})
        preview_style.evaluate('e => e.remove()')
        # PDF preserves vector text/paths; PyMuPDF turns the page into a standalone SVG.
        page.emulate_media(media='screen')
        pdf = page.pdf(width='1600px', height='1000px', print_background=True, margin={'top': '0', 'left': '0', 'right': '0', 'bottom': '0'})
        with pymupdf.open(stream=pdf, filetype='pdf') as document:
            (ROOT / 'docs/architecture.svg').write_text(document[0].get_svg_image())
        page.set_viewport_size({'width': 1200, 'height': 630})
        page.add_style_tag(content='''
          html,body{width:1200px;height:630px;overflow:hidden;background:#F5F8FC}
          #c{position:absolute;left:40px;top:62px;height:720px;transform:scale(.7);transform-origin:0 0}
          .rhead,.cards,.foot{display:none}
        ''')
        page.screenshot(path=str(ROOT / 'docs/og.png'))
        page.set_viewport_size({'width': 1600, 'height': 960})
        page.goto(base + '/svcnow.html')
        page.add_script_tag(url=base + '/pres/icons.js')
        page.evaluate('document.getAnimations().forEach(a => {a.pause(); a.currentTime=0})')
        page.screenshot(path=str(ROOT / 'pres/actions_detail.png'), clip={'x': 0, 'y': 0, 'width': 1600, 'height': 960})
        page.set_viewport_size({'width': 1600, 'height': 970})
        sys.path.insert(0, str(ROOT / 'vid'))
        from proposal_data import PROPOSALS
        for number, proposal in PROPOSALS.items():
            source = page.request.get(f'{base}/pres/flow{number}.html').text()
            source = source.split('<div id="veil"')[0] + '</div></body></html>'
            source = source.replace('<head>', f'<head><base href="{base}/pres/">', 1)
            page.set_content(source)
            page.add_style_tag(content='.rhead,.cards,#a-obsp,.foot{display:none!important} body{overflow:hidden}')
            page.add_script_tag(url=base + '/pres/icons.js')
            page.screenshot(path=str(ROOT / f'pres/future-{proposal["slug"]}.png'), clip={'x': 0, 'y': 0, 'width': 1600, 'height': 970})
        print('Updated overview, vector/social previews, action close-up and four future architectures')


if __name__ == '__main__':
    render()
