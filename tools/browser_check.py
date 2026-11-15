"""Browser regression checks. Run after tools/build.sh; requires Playwright Chromium."""
import argparse
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
PREFIX = '/iot-architecture-walkthrough'


class ProjectHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        return super().translate_path(path.removeprefix(PREFIX))

    def log_message(self, *_):
        pass


@contextmanager
def browser_session():
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(ProjectHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    with sync_playwright() as p:
        options = {'args': ['--no-sandbox']}
        if os.getenv('IOT_CHROMIUM_PATH'):
            options['executable_path'] = os.environ['IOT_CHROMIUM_PATH']
        browser = p.chromium.launch(**options)
        try:
            yield browser, f'http://127.0.0.1:{server.server_port}{PREFIX}'
        finally:
            browser.close()
            server.shutdown()


def run(output, playback=None):
    output.mkdir(parents=True, exist_ok=True)
    results, errors = [], []

    def passed(name):
        results.append(name)
        print('PASS', name, flush=True)

    with browser_session() as (browser, base):
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        # Offline font fallback makes checks independent of Google's availability.
        context.route('https://fonts.googleapis.com/**', lambda route: route.fulfill(body='', content_type='text/css'))
        context.on('page', lambda page: page.on('pageerror', lambda err: errors.append(str(err))))
        page = context.new_page()
        page.set_default_timeout(8000)

        def shell(slug='telemetry'):
            page.goto(f'{base}/pres/?flow={slug}', wait_until='load')
            page.wait_for_function("document.querySelector('#stage iframe')?.contentWindow.PRESENTER")
            page.wait_for_timeout(100)
            return page.frames[-1]

        for v in range(1, 28):
            page.goto(f'{base}/pres/flow{v}.html?embed=1&obs=1&why=1&caps=1')
            page.wait_for_function('window.PRESENTER')
            result = page.evaluate('''() => {
              for (const p of PRESENTER.PAUSES) setT(p.t);
              return {pauses:PRESENTER.PAUSES.length, finite:Number.isFinite(window.TOTAL)};
            }''')
            assert result['finite'] and result['pauses'] > 5, (v, result)
        passed('all 27 timelines render every pause without runtime errors')

        frame = shell()
        assert page.locator('#flows button[data-flow]').count() == 7
        assert page.locator('#issues button[data-flow]').count() == 6
        assert page.locator('#deepTopics button[data-flow]').count() == 7
        assert page.locator('#deploy button[data-flow]').count() == 7
        assert page.locator('#deepToggle').get_attribute('aria-expanded') == 'false'
        assert page.locator('#deployToggle').get_attribute('aria-expanded') == 'false'
        page.locator('#deepToggle').click()
        page.locator('#issues button[data-flow="growth"]').click()
        page.wait_for_function("document.querySelector('#stage iframe')?.src.includes('flow19.html')")
        page.wait_for_timeout(500)
        page.locator('#deepToggle').click()
        assert page.locator('#deepToggle').evaluate("e => e.classList.contains('has-active')")
        page.keyboard.press('9')
        assert page.locator('#deepToggle').get_attribute('aria-expanded') == 'true'
        page.keyboard.press('4')
        page.wait_for_function("document.querySelector('#stage iframe')?.src.includes('flow9.html')")
        assert page.locator('#deployToggle').get_attribute('aria-expanded') == 'true'
        assert page.locator('select').count() == 0
        page.locator('#deepToggle').click()
        page.locator('#deepTopics button[data-flow="replay"]').click()
        page.wait_for_function("document.querySelector('#stage iframe:last-of-type')?.src.includes('flow20.html')")
        assert 'flow=replay' in page.url and page.locator('#deepToggle').get_attribute('aria-expanded') == 'true'
        assert page.locator('#deepTopics button[data-flow="replay"]').get_attribute('aria-pressed') == 'true'
        passed('sections: Flows, Deep dives (infra issues + lessons), Deployment; selection, links and shortcuts preserved')

        page.locator('#roleBtn').click()
        page.locator('#dmodal').wait_for(state='visible')
        assert 'Chief architect' in page.locator('#dtitle').inner_text() and 'Team' in page.locator('#dtext').inner_text()
        assert page.evaluate("[...document.querySelectorAll('#dtext .rolesec')].every(d => !d.open)"), 'role sections start collapsed'
        page.locator('#roleAll').click()
        assert page.evaluate("[...document.querySelectorAll('#dtext .rolesec')].every(d => d.open)") and page.locator('#roleAll').inner_text() == 'Collapse all'
        page.locator('#dtext .rolesec summary').first.click()
        page.wait_for_function("document.getElementById('roleAll').textContent === 'Expand all'")   # toggle fires async
        page.keyboard.press('Escape')
        assert page.locator('#roleBtn').evaluate('e => e === document.activeElement')
        page.locator('body').press('r')
        page.locator('#dmodal').wait_for(state='visible')
        page.keyboard.press('Escape')
        passed('My role dialog opens from the sidebar and the R key; sections start collapsed, expand/collapse all; focus returns')

        frame = shell()
        # fixed layout: observability always shown, no design-decision cards or switches, panel in every flow
        assert frame.locator('#a-obsp').is_visible() and frame.locator('#xpanel').is_visible()
        assert not frame.locator('.cards').is_visible() and page.locator('.toggles, #tObs, #tWhy, #tCap').count() == 0
        page.locator('#roleBtn').click()
        page.locator('#dmodal').wait_for(state='visible')
        assert page.locator('#dclose').evaluate('e => e === document.activeElement')
        for _ in range(6):
            page.keyboard.press('Tab')
            assert page.evaluate("document.getElementById('dmodal').contains(document.activeElement)")
        page.keyboard.press('Escape')
        assert page.locator('#roleBtn').evaluate('e => e === document.activeElement')
        frame.locator('#a-gw').focus()
        page.keyboard.press('Enter')
        frame.locator('#cucard').wait_for(state='visible')
        page.wait_for_timeout(120)
        expect(frame.locator('#cucard .bk').first).to_be_focused()
        page.keyboard.press('Shift+Tab')
        expect(frame.locator('#cucard .bk').last).to_be_focused()
        page.keyboard.press('Escape')
        frame.locator('#cucard').wait_for(state='hidden')
        assert frame.locator('#a-gw').evaluate('e => e === document.activeElement')
        passed('fixed layout; dialog and close-up: focus, trap, Escape, restoration; no icon freeze')

        # Complete a manually stepped flow using the actual keyboard handler.
        frame = shell('health')
        frame.locator('body').click(position={'x': 10, 'y': 10})
        count = frame.evaluate('PRESENTER.PAUSES.length')
        for _ in range(count * 2):
            page.keyboard.press('ArrowRight')
        page.wait_for_timeout(200)
        assert 'health' in page.evaluate("JSON.parse(localStorage.getItem('explored'))")
        page.wait_for_timeout(5300)
        assert page.locator('#upnext').evaluate('e => e.hidden')
        assert 'flow=health' in page.url
        passed('manual arrow stepping records completion without auto-advance')

        # Accelerate frame-time increments, keeping real five-second countdowns.
        auto = context.new_page()
        auto.add_init_script('''(() => {
          let clock = performance.now();
          window.requestAnimationFrame = fn => setTimeout(() => { clock += 100; fn(clock); }, 0);
        })()''')
        for slug in (playback if playback is not None else ['cicd-svc', 'cicd-dash', 'telemetry', 'storm', 'red-snow', 'growth']):
            auto.goto(f'{base}/pres/?flow={slug}')
            auto.wait_for_function("document.querySelector('#stage iframe')?.contentWindow.PRESENTER")
            fr = auto.frames[-1]
            before = auto.evaluate('location.search')
            fr.locator('#bPlay').click()
            auto.locator('#upnext').wait_for(state='visible', timeout=60000)
            assert slug in auto.evaluate("JSON.parse(localStorage.getItem('explored'))")
            auto.wait_for_function('s => location.search !== s', arg=before, timeout=8000)
            passed(f'automatic playback: {slug}, completed end card, countdown and advance')
        auto.close()

        for theme in ['light', 'dark']:
            page.set_viewport_size({'width': 1440, 'height': 900})
            page.emulate_media(color_scheme=theme)
            shell('growth')
            page.screenshot(path=str(output / f'desktop-{theme}.png'))
            for width, height in [(1280, 800), (1024, 768), (821, 900)]:
                page.set_viewport_size({'width': width, 'height': height})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.set_viewport_size({'width': 390, 'height': 844})
            page.goto(f'{base}/pres/?flow=storm')
            assert page.locator('#vnote').is_visible()
            page.screenshot(path=str(output / f'phone-{theme}.png'))
            page.set_viewport_size({'width': 1440, 'height': 900})
            page.wait_for_function("document.querySelector('#stage iframe')?.src.includes('flow16.html')")
            page.set_viewport_size({'width': 390, 'height': 844})
            page.goto(f'{base}/pres/?flow=telemetry')
            assert page.locator('#v-telemetry').evaluate("e => e.classList.contains('hl')")
            assert page.locator('#v-telemetry').evaluate('e => e.getBoundingClientRect().top < innerHeight')
        passed('light/dark layouts, narrow desktop, phone links/resizing')

        # The correctness deep dives are flows: old ?deep= links, desktop sidebar and phone list all reach them.
        lessons = {'replay': 20, 'liveness': 21, 'incidents': 22, 'tenancy': 23, 'consistency': 24, 'upgrades': 25, 'residency': 26}
        desk = context.new_page()
        desk.set_default_timeout(8000)
        desk.goto(f'{base}/pres/?deep=consistency')
        desk.wait_for_function("document.querySelector('#stage iframe')?.src.includes('flow24.html')")
        assert 'flow=consistency' in desk.url and 'deep=' not in desk.url and desk.locator('#dmodal').is_hidden()
        for slug, v in lessons.items():
            desk.locator(f'#deepTopics button[data-flow="{slug}"]').click()
            desk.wait_for_function(f"document.querySelector('#stage iframe:last-of-type')?.src.includes('flow{v}.html')")
            desk.wait_for_function("document.querySelector('#stage iframe:last-of-type')?.contentWindow.PRESENTER")
            assert desk.evaluate("document.querySelector('#stage iframe:last-of-type').contentWindow.PRESENTER.PAUSES.length") > 1, slug
        desk.locator('#issues button[data-flow="region"]').click()   # multi-region failover, a When things break flow
        desk.wait_for_function("document.querySelector('#stage iframe:last-of-type')?.src.includes('flow27.html')")
        assert 'flow=region' in desk.url
        desk.close()
        phone = context.new_page()
        phone.set_viewport_size({'width': 390, 'height': 844})
        phone.goto(f'{base}/pres/?deep=replay')
        assert phone.locator('#vnote').inner_text().startswith('Delivery & replay') and phone.locator('.mobile-learning').evaluate('e => e.open')
        assert phone.locator('#dmodal').is_hidden() and phone.locator('#stage iframe').count() == 0
        for slug in [*lessons, 'region']:
            phone.locator('#mobile-flow-' + slug).click()
            assert phone.locator('#vnote').is_visible() and f'flow={slug}' in phone.url, slug
        phone.close()
        passed('the correctness deep dives and the region flow open as flows: sidebar, old ?deep= links, phone list')

        page.set_viewport_size({'width': 1440, 'height': 900})
        page.goto(f'{base}/pres/?future=security')   # removed section: an old link falls back to the architecture
        page.wait_for_function("document.querySelector('iframe')?.contentWindow.PRESENTER")
        assert 'flow4.html' in page.locator('#stage iframe').get_attribute('src') and 'future' not in page.url
        page.goto(f'{base}/pres/?flow=storm')
        page.wait_for_function("document.querySelector('iframe')?.contentWindow.PRESENTER")
        frame = page.frames[-1]
        page.evaluate('''() => {
          window.__unsafe = false;
          document.querySelector('iframe').contentWindow.postMessage({type:'opts', dd:[['<img src=x onerror="parent.__unsafe=true">','<script>bad</script>']]}, location.origin);
        }''')
        page.wait_for_timeout(100)
        assert not page.evaluate('__unsafe')
        assert frame.locator('.cards img, .cards script').count() == 0   # option messages no longer render HTML
        shell('telemetry')
        page.evaluate("postMessage({type:'home'},location.origin)")
        page.wait_for_timeout(100)
        assert 'flow=telemetry' in page.url  # an unrelated 'home' message from the page itself is ignored
        passed('trusted message text is escaped and shell ignores unrelated senders')

        page.evaluate("select(ALL.find(f => f.slug === 'telemetry'), true, true)")
        page.set_viewport_size({'width': 390, 'height': 844})
        page.wait_for_timeout(1300)
        assert page.evaluate("!document.querySelector('iframe').contentDocument.getElementById('bPlay').classList.contains('on')")
        page.set_viewport_size({'width': 1440, 'height': 900})
        page.evaluate("select(ALL.find(f => f.slug === 'telemetry'), true, true)")
        page.wait_for_function("document.querySelector('#stage iframe:last-of-type')?.contentWindow.PRESENTER")
        page.locator('#roleBtn').click()
        page.wait_for_timeout(1300)
        assert page.evaluate("!document.querySelector('iframe').contentDocument.getElementById('bPlay').classList.contains('on')")
        page.keyboard.press('Escape')
        passed('queued autoplay stays stopped on mobile/behind a modal')

        assert not errors, errors
        passed('no JavaScript exceptions across tested pages and interactions')
        context.close()
    report = {'checks': results, 'javascript_errors': errors}
    (output / 'browser-results.json').write_text(json.dumps(report, indent=2) + '\n')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=Path('/tmp/iot-browser-checks'))
    parser.add_argument('--playback', nargs='*', help='Limit automatic playback checks to these slugs')
    args = parser.parse_args()
    run(args.output, args.playback)
