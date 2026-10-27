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

        for v in range(1, 20):
            page.goto(f'{base}/pres/flow{v}.html?embed=1&obs=1&why=1&caps=1')
            page.wait_for_function('window.PRESENTER')
            result = page.evaluate('''() => {
              for (const p of PRESENTER.PAUSES) setT(p.t);
              return {pauses:PRESENTER.PAUSES.length, finite:Number.isFinite(window.TOTAL)};
            }''')
            assert result['finite'] and result['pauses'] > 5, (v, result)
        passed('all 19 timelines render every pause without runtime errors')

        frame = shell()
        assert page.locator('#flowSelect option[data-slug]').count() == 14
        assert page.locator('#issueSelect option[data-slug]').count() == 5
        assert page.locator('#deepToggle').get_attribute('aria-expanded') == 'false'
        assert page.locator('#futureToggle').get_attribute('aria-expanded') == 'false'
        page.locator('#issueToggle').click()
        page.locator('#issueSelect').select_option('growth')
        page.wait_for_function("document.querySelector('#stage iframe')?.src.includes('flow19.html')")
        page.wait_for_timeout(500)
        page.locator('#issueToggle').click()
        assert page.locator('#issueToggle').evaluate("e => e.classList.contains('has-active')")
        page.keyboard.press('9')
        assert page.locator('#issueToggle').get_attribute('aria-expanded') == 'true'
        passed('grouped flow/infra selectors preserve selection, deep links and shortcuts')

        frame = shell()
        page.locator('#tWhy').check()
        frame.locator('#ddc-0').click()
        assert not page.locator('#dmodal').evaluate('e => e.hidden')
        assert page.locator('#dclose').evaluate('e => e === document.activeElement')
        page.keyboard.press('Tab')
        assert page.locator('#dclose').evaluate('e => e === document.activeElement')
        page.keyboard.press('Escape')
        assert frame.locator('#ddc-0').evaluate('e => e === document.activeElement')
        frame.locator('#ddc-0').press('Enter')
        page.locator('#dmodal').wait_for(state='visible')
        page.keyboard.press('Escape')
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
        passed('mouse/keyboard decision modal and close-up: focus, trap, Escape, restoration; no icon freeze')

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
            fr.locator('#bPlay').click()
            auto.locator('#upnext').wait_for(state='visible', timeout=60000)
            assert slug in auto.evaluate("JSON.parse(localStorage.getItem('explored'))")
            auto.wait_for_function('s => !location.search.includes("flow=" + s)', arg=slug, timeout=8000)
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
        passed('light/dark layouts, narrow desktop, phone deep links and desktop initialization')

        # Lesson playback on mobile has no hidden iframe and can use a virtual clock.
        lessons = context.new_page()
        lessons.set_viewport_size({'width': 390, 'height': 844})
        lessons.clock.install()
        lessons.goto(f'{base}/pres/?future=predictive')
        lessons.locator('#dmodal').wait_for(state='visible')
        lessons.keyboard.press('Escape')
        lessons.locator('.mobile-learning summary').click()
        topics = lessons.evaluate('KNOWLEDGE.map(t => ({slug:t.slug, count:t.steps.length, section:t.section}))')
        for topic in topics:
            lessons.locator('#mobileSelect').select_option(topic['slug'])
            assert lessons.locator('#dmodal').is_visible()
            lessons.locator('#lessonPlay').click()
            lessons.clock.run_for(2700 * topic['count'])
            assert lessons.locator('#lessonNext').is_disabled()
            assert lessons.locator('#lessonCount').inner_text() == f"{topic['count']} / {topic['count']}"
            assert lessons.locator('#lessonPlay').inner_text() == 'Play'
            if topic['section'] == 'future':
                assert 'GenAI' in lessons.locator('#dsnap').inner_text()
            lessons.keyboard.press('Escape')
            assert lessons.locator('#mobileSelect').evaluate('e => e === document.activeElement')
        lessons.close()
        passed('all six deep dives and four AI proposals run to completion; mobile focus returns correctly')

        page.set_viewport_size({'width': 1440, 'height': 900})
        page.goto(f'{base}/pres/?future=security')
        page.locator('#dmodal').wait_for(state='visible')
        page.screenshot(path=str(output / 'security-proposal.png'))
        page.keyboard.press('Escape')
        frame = page.frames[-1]
        page.evaluate('''() => {
          window.__unsafe = false;
          document.querySelector('iframe').contentWindow.postMessage({type:'opts', dd:[['<img src=x onerror="parent.__unsafe=true">','<script>bad</script>']]}, location.origin);
        }''')
        page.wait_for_timeout(100)
        assert not page.evaluate('__unsafe')
        assert frame.locator('.ddc img, .ddc script').count() == 0
        shell('telemetry')
        page.evaluate("postMessage({type:'home'},location.origin)")
        page.wait_for_timeout(100)
        assert 'flow=telemetry' in page.url  # close removed only the proposal parameter
        passed('trusted message text is escaped and shell ignores unrelated senders')

        page.evaluate("select(ALL.find(f => f.slug === 'telemetry'), true, true)")
        page.set_viewport_size({'width': 390, 'height': 844})
        page.wait_for_timeout(1300)
        assert page.evaluate("!document.querySelector('iframe').contentDocument.getElementById('bPlay').classList.contains('on')")
        page.set_viewport_size({'width': 1440, 'height': 900})
        page.evaluate("select(ALL.find(f => f.slug === 'telemetry'), true, true)")
        page.locator('#futureToggle').click()
        page.locator('#futureSelect').select_option('predictive')
        page.wait_for_timeout(1300)
        assert page.evaluate("!document.querySelector('iframe').contentDocument.getElementById('bPlay').classList.contains('on')")
        page.keyboard.press('Escape')
        assert page.evaluate('lessonTimer === null')
        passed('queued autoplay stays stopped on mobile/behind a modal; closing stops lesson timers')

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
