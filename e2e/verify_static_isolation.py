"""Verify the built game at both / and /word-merge/, without any backend."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

dist = Path(__file__).resolve().parents[1] / 'dist'


class StaticHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if path.startswith('/word-merge/'):
            path = path[len('/word-merge'):]
        return super().translate_path(path)

    def log_message(self, *_):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(StaticHandler, directory=str(dist)))
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
origin = f'http://127.0.0.1:{server.server_port}'
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for prefix in ['/', '/word-merge/']:
            context = browser.new_context(viewport={'width': 390, 'height': 844})
            page = context.new_page()
            requests, errors = [], []
            page.on('request', lambda request: requests.append(request.url))
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(origin + prefix)
            page.wait_for_load_state('networkidle')
            expect(page.locator('.board-slot')).to_have_count(25)
            page.locator('[data-slot="6"]').click()
            page.locator('[data-slot="7"]').click()
            page.get_by_role('dialog').get_by_role('button', name='袋子', exact=True).click()
            expect(page.locator('[data-slot="7"]')).to_contain_text('bag')
            page.reload(); page.wait_for_load_state('networkidle')
            expect(page.locator('[data-slot="7"]')).to_contain_text('bag')
            assert not errors, errors
            assert all(urlsplit(url).netloc == urlsplit(origin).netloc for url in requests), requests
            assert not any('/api/' in url or 'runtime-config' in url for url in requests), requests
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
            context.close()
            print(f'PASS: {prefix} loads, merges and persists with only its own static assets; no API or external resource requests')
        browser.close()
finally:
    server.shutdown(); server.server_close()
