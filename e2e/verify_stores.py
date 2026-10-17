"""Real shopping interactions: find scattered goods, pack sets, and keep every shop's save."""
import json
import re
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

SAVE_KEY = 'epartner-word-merge-v1'


def verify_request_modes(browser, url, output):
    context = browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    # Verify requested utterances and failure recovery without relying on a machine's installed voices.
    context.add_init_script('''
      window.__spoken = [];
      window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
      Object.defineProperty(window, 'speechSynthesis', {configurable:true, value:{
        cancel() {}, speak(utterance) { window.__spoken.push(utterance.text); window.__lastUtterance = utterance; }
      }});
    ''')
    page = context.new_page(); page.goto(url.split('#')[0]+'#stores'); page.wait_for_load_state('networkidle')
    game = page.locator('.store-game')
    difficulty = game.get_by_role('navigation',name='接单难度')
    def mode(name): difficulty.get_by_role('button',name=name,exact=True).tap()
    def assert_listening():
        expect(difficulty.get_by_role('button',name='听力接单',exact=True)).to_have_attribute('aria-pressed','true')
        for selector in ['.store-request','.store-needs','.basket-request','.store-pile button>span','.store-translation']:
            expect(game.locator(selector)).to_have_count(0)
        expect(game.locator('.store-audio-request')).to_have_count(3)
        assert 'milk' not in game.inner_text() and 'bread' not in game.inner_text()

    # Reading is the default: text-only customers and picture-only goods in all three shops.
    expect(difficulty.get_by_role('button',name='阅读接单',exact=True)).to_have_attribute('aria-pressed','true')
    for shop in ['街角超市','水果市场','缤纷服装店']:
        game.get_by_role('navigation',name='店铺选择').get_by_role('button',name=re.compile('^'+shop)).tap()
        expect(game.locator('.store-request')).to_have_count(3)
        expect(game.locator('.store-needs .store-product-art')).to_have_count(0)
        expect(game.locator('.store-pile button>span')).to_have_count(0)
        assert game.locator('.store-pile .store-product-art').count() > 0
    game.get_by_role('navigation',name='店铺选择').get_by_role('button',name=re.compile('^街角超市')).tap()
    mode('图文入门')
    assert game.locator('.store-needs .store-product-art').count() > 0
    assert game.locator('.store-pile button>span').count() > 0
    mode('听力接单'); assert_listening()
    game.get_by_role('button',name='听 Mia 的购物需求',exact=True).tap()
    game.get_by_role('button',name='重听 Mia 的购物需求',exact=True).tap()
    spoken = page.evaluate('window.__spoken')
    assert len(spoken) == 2 and spoken[0] == spoken[1] and 'milk' in spoken[0]
    game.locator('[data-product="milk"]').first.tap(); assert_listening()
    page.reload(); page.wait_for_load_state('networkidle'); assert_listening()
    expect(game.locator('[data-tray]')).to_have_count(1)
    # Real speech errors offer a deliberate hint, never expose the transcript automatically.
    game.get_by_role('button',name='重听 Mia 的购物需求',exact=True).tap()
    page.evaluate('window.__lastUtterance.onerror({error:"synthesis-unavailable"})')
    expect(game.locator('[role="status"]')).to_contain_text('朗读暂时不可用')
    assert_listening()
    game.get_by_role('button',name='查看图文提示',exact=True).tap()
    expect(game.locator('.store-request')).to_have_count(3)
    expect(game.locator('.store-translation')).to_have_count(3)
    assert game.locator('.store-needs .store-product-art').count() > 0
    assert game.locator('.store-pile button>span').count() > 0
    game.get_by_role('button',name='收起图文提示',exact=True).tap(); assert_listening()
    saved = page.evaluate('(key) => JSON.parse(localStorage.getItem(key)).stores',SAVE_KEY)
    assert saved['sessions']['supermarket']['helped']
    # Solve the first audio order; the result must remain assisted across reloads.
    game.locator('[data-product="bread"]').first.tap(); game.locator('[data-product="egg"]').first.tap()
    game.locator('.store-checkout button').tap()
    saved = page.evaluate('(key) => JSON.parse(localStorage.getItem(key)).stores',SAVE_KEY)
    assert saved['sessions']['supermarket']['assisted'] == 1
    assert saved['sessions']['supermarket']['independent'] == 0
    page.get_by_role('navigation',name='主要功能').get_by_role('button',name='自由合成',exact=True).tap()
    page.get_by_role('navigation',name='主要功能').get_by_role('button',name='生活小镇',exact=True).tap()
    page.get_by_role('button',name='进入开店接客',exact=True).tap()
    expect(difficulty.get_by_role('button',name='听力接单',exact=True)).to_have_attribute('aria-pressed','true')
    for width,height in [(320,740),(390,844),(844,390)]:
        page.set_viewport_size({'width':width,'height':height})
        for name in ['图文入门','阅读接单','听力接单']:
            mode(name)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width,name)
        page.screenshot(path=str(output/f'store-listening-{width}.png'),full_page=True)
    context.close()


def run_stores(url, output):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        verify_request_modes(browser,url,output)
        for mobile in [False, True]:
            context = browser.new_context(viewport={'width':390 if mobile else 1280, 'height':844 if mobile else 900}, is_mobile=mobile, has_touch=mobile, reduced_motion='reduce')
            page = context.new_page(); errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(url.split('#')[0]+'#stores'); page.wait_for_load_state('networkidle')
            game = page.get_by_role('region', name='开店接客游戏')
            def state(): return page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', SAVE_KEY)
            def activate(locator):
                if mobile: locator.tap()
                else: locator.click()
            def pick(product): activate(game.locator(f'[data-product="{product}"]').first)
            def choose(name): activate(game.get_by_role('navigation',name='店铺选择').get_by_role('button',name=re.compile('^'+name)))

            expect(page.locator('.board')).not_to_be_visible()
            expect(game.locator('.store-customer')).to_have_count(3)
            expect(game.locator('.store-translation')).to_have_count(0)
            checkout = game.locator('.store-checkout button')
            expect(checkout).to_be_disabled()
            # Six wrong/early picks fill the tray; returning goods restores the exact inventory.
            before = state()['stores']['sessions']['supermarket']
            for _ in range(6): activate(game.locator('[data-product]').first)
            expect(game.locator('[data-product]:enabled')).to_have_count(0)
            expect(game.locator('.store-basket')).to_contain_text('篮子满了')
            for _ in range(6): activate(game.locator('[data-tray="0"]'))
            after = state()['stores']['sessions']['supermarket']
            assert sorted(after['shelf']) == sorted(before['shelf']) and after['tray'] == []
            # Switching shops and reloading preserve an unfinished basket independently.
            pick('milk'); choose('水果市场'); pick('banana'); choose('街角超市')
            assert state()['stores']['sessions']['supermarket']['tray'] == ['milk']
            assert state()['stores']['sessions']['fruit']['tray'] == ['banana']
            page.reload(); page.wait_for_load_state('networkidle')
            expect(game.locator('[data-tray]')).to_have_count(1)
            activate(game.locator('[data-tray="0"]'))
            choose('水果市场'); activate(game.locator('[data-tray="0"]'))

            for store_id, name in [('supermarket','街角超市'), ('fruit','水果市场'), ('fashion','缤纷服装店')]:
                choose(name)
                for round_number in range(1,7):
                    if store_id == 'fruit' and round_number == 1:
                        activate(game.get_by_role('button',name='查看图文提示',exact=True))
                        expect(game.locator('.store-translation')).to_have_count(3)
                        page.reload(); page.wait_for_load_state('networkidle')
                        assert state()['stores']['sessions']['fruit']['helped']
                    orders = game.locator('.store-customer')
                    for i in range(3):
                        needs = orders.nth(i).locator('[data-need]').evaluate_all('(nodes) => nodes.map(n => ({id:n.dataset.need,count:Number(n.dataset.count)}))')
                        snapshot = state()
                        for need in needs:
                            for _ in range(need['count']): pick(need['id'])
                        expect(orders.nth(i)).to_have_class(re.compile('customer-ready'))
                        expect(checkout).to_be_enabled()
                        activate(checkout)
                        current = state()
                        assert current['coins'] == snapshot['coins']+12+sum(n['count'] for n in needs)*4
                        assert current['progress']['xp'] == snapshot['progress']['xp']+8
                        assert current['deliveries'] == snapshot['deliveries']+1
                        assert current['stores']['sessions'][store_id]['served'][i]
                        expect(checkout).to_be_disabled()
                        expect(page.get_by_role('dialog')).to_have_count(0)
                    expect(game.get_by_role('region',name='本轮经营结算')).to_be_visible()
                    assert state()['stores']['sessions'][store_id]['tray'] == []
                    activate(game.get_by_role('button',name=re.compile('^继续开店')))
                    assert state()['stores']['sessions'][store_id]['round'] == round_number+1
                session = state()['stores']['sessions'][store_id]
                assert session['assisted'] == (3 if store_id == 'fruit' else 0)
                assert session['independent'] == (15 if store_id == 'fruit' else 18)

            saved = state()['stores']; page.reload(); page.wait_for_load_state('networkidle')
            assert state()['stores'] == saved
            for width, height in [(320,740),(390,844),(768,1024),(844,390)]:
                page.set_viewport_size({'width':width,'height':height})
                for name in ['街角超市','水果市场','缤纷服装店']:
                    choose(name)
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (name,width)
                    expect(game.locator('.store-basket')).to_be_in_viewport()
                page.screenshot(path=str(output/f'stores-{width}-{"touch" if mobile else "desktop"}.png'), full_page=True)
            # A v5 save keeps its existing game and gains empty store progress in a real browser.
            old = state(); old['version'] = 5; old.pop('stores')
            context2 = browser.new_context()
            context2.add_init_script(f'localStorage.setItem({json.dumps(SAVE_KEY)},JSON.stringify({json.dumps(old)}))')
            restored = context2.new_page(); restored.goto(url.split('#')[0]+'#stores'); restored.wait_for_load_state('networkidle')
            upgraded = restored.evaluate('(key) => JSON.parse(localStorage.getItem(key))',SAVE_KEY)
            assert upgraded['version'] == 9 and upgraded['coins'] == old['coins']
            assert upgraded['boards'] == old['boards'] and upgraded['progress'] == old['progress']
            assert upgraded['stores']['sessions']['supermarket']['round'] == 1
            context2.close()
            assert not errors, errors
            context.close()
        browser.close()
    print('PASS: three shops, scattered goods, quantities/colors/sets, basket recovery, rounds, honest help, shared rewards, shop isolation, v5 migration and mobile touch')


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(); parser.add_argument('--url',default='http://127.0.0.1:5011/')
    parser.add_argument('--output',type=Path,default=Path(tempfile.gettempdir())/'epartner-word-merge-qa')
    args = parser.parse_args(); args.output.mkdir(parents=True,exist_ok=True)
    run_stores(args.url,args.output)
