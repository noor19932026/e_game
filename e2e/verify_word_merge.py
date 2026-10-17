"""Browser acceptance for the expanded workshop and simple story edition."""
import argparse
import json
import re
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

SAVE_KEY = 'epartner-word-merge-v1'

def run(url, output):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
        page = context.new_page(); errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(url); page.wait_for_load_state('networkidle')
        nav = page.get_by_role('navigation', name='主要功能')
        nav.get_by_role('button', name='自由合成', exact=True).click()
        def state():
            value = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', SAVE_KEY)
            value.pop('visitors', None)
            return value
        def board():
            s = state(); return s['boards'][s['district']]
        def slot(i): return page.locator(f'[data-slot="{i}"]')
        def clear_selection():
            selected = page.locator('.board-slot[aria-pressed="true"]')
            if selected.count(): selected.click()
        def merge(a, b):
            clear_selection(); slot(a).click(); slot(b).click()
            expect(page.get_by_role('dialog')).to_have_count(0)
        def prepare(theme, target):
            steps = 0
            while target not in board():
                values = board(); pair = None
                level = int(target.rsplit('-', 1)[1])
                for n in range(level):
                    ids = [i for i, word in enumerate(values) if word == f'{theme}-{n}']
                    if len(ids) >= 2: pair = ids[:2]; break
                if pair: merge(*pair)
                else: page.locator(f'[data-supply="{theme}"]').click()
                steps += 1; assert steps < 100, target
            return board().index(target)
        def district(name):
            nav.get_by_role('button', name='自由合成', exact=True).click()
            page.get_by_role('navigation', name='街区选择').get_by_role('button', name=name, exact=True).click()

        expect(page.locator('.board-slot')).to_have_count(48)
        assert len(board()) == 48
        slot(7).click(); expect(slot(8)).to_have_class(re.compile('compatible')); slot(8).click()
        assert board()[8] == 'coffee-1'
        expect(page.locator('.shop-growth')).to_contain_text('1 / 1')
        page.locator('.shop-growth').get_by_role('button').click()
        assert state()['progress']['claimed'] == ['first-merge']
        before = state()['coins']
        page.get_by_role('button', name='交付 bag 订单', exact=True).click()
        expect(page.get_by_role('dialog')).to_have_count(0)
        assert state()['coins'] == before + 20
        page.locator('.shop-growth').get_by_role('button').click()
        assert 'first-order' in state()['progress']['claimed']
        # Dragging and keyboard movement also reach the newly-added board rows.
        slot(13).scroll_into_view_if_needed()
        a, b = slot(13).bounding_box(), slot(14).bounding_box()
        page.mouse.move(a['x'] + a['width']/2, a['y'] + a['height']/2); page.mouse.down()
        page.mouse.move(b['x'] + b['width']/2, b['y'] + b['height']/2, steps=10); page.mouse.up()
        assert board()[13] is None and board()[14] == 'garden-1'
        slot(14).focus(); page.keyboard.press('Enter'); slot(47).focus(); page.keyboard.press('Enter')
        assert board()[14] is None and board()[47] == 'garden-1'
        clear_selection()

        # Visible orders, real supply and merge actions progress to upgraded ingredients.
        while state()['orderStep']['coffee'] < 6:
            order = page.locator('.customer-order').first
            target_word = order.locator('.order-copy span').inner_text()
            chain = ['coffee bean', 'bag', 'coffee maker', 'coffee', 'cup', 'coffee pot', 'coffee tray', 'cafe']
            target = 'coffee-' + str(chain.index(target_word))
            prepare('coffee', target)
            page.get_by_role('button', name=f'交付 {target_word} 订单', exact=True).click()
        expect(page.locator('[data-supply="coffee"]')).to_contain_text('coffee maker')
        # The eighth level is reached through actual play without 128 raw-material clicks.
        prepare('coffee', 'coffee-7')
        assert 'coffee-7' in state()['discovered']
        terminal = board().index('coffee-7')
        slot(terminal).click(); page.get_by_role('button', name='回收选中', exact=True).click()
        assert 'coffee-7' in state()['discovered'] and board()[terminal] is None
        page.get_by_role('button', name='领取基础材料', exact=True).click()
        expect(page.locator('[data-supply="coffee"]')).to_contain_text('coffee bean')
        page.get_by_role('button', name='切换升级补给', exact=True).click()

        # A combination recipe joins different ingredient chains on the same board.
        a = prepare('bakery', 'bakery-2'); b = prepare('breakfast', 'breakfast-1')
        before = state(); merge(a, b)
        assert board()[b] == 'breakfast-2'
        assert state()['progress']['combinations'] == before['progress']['combinations'] + 1
        assert state()['coins'] == before['coins'] + 5
        cafe_board = list(board())
        district('阳光集市')
        a, b = board().index('fruit-0'), board().index('juice-0')
        merge(a, b); assert board()[b] == 'fruit-2'
        assert state()['boards']['cafe'] == cafe_board
        district('手作街角')
        merge(board().index('school-0'), board().index('paper-0'))
        prepare('school', 'school-3')
        persisted = state(); page.reload(); page.wait_for_load_state('networkidle')
        assert state() == persisted
        page.screenshot(path=str(output / 'expanded-workshop-desktop.png'), full_page=True)

        # All themes expose coherent artwork, actions and phrases in the learning views.
        themes = ['coffee', 'garden', 'bakery', 'juice', 'clothes', 'paper', 'pottery', 'kitchen', 'fruit', 'breakfast', 'school']
        phrase_answers = [['cup','make'],['plant','bouquet'],['slice','bake'],['glass','squeeze'],['cotton','sew'],['piece','draw'],['clay','shape'],['peel','fry'],['bowl','slice'],['boil','breakfast'],['school','read']]
        for theme, answers in zip(themes, phrase_answers):
            nav.get_by_role('button', name='学习', exact=True).click()
            page.get_by_role('button', name=re.compile('单词图鉴')).click()
            page.get_by_label('学习主题', exact=True).select_option(theme)
            cards = page.locator('.collection-row button')
            assert 6 <= cards.count() <= 8
            for i in range(page.locator('.book-actions button').count()):
                button = page.locator('.book-actions button').nth(i); verb = button.locator('b').inner_text()
                button.click(); page.get_by_role('dialog').get_by_role('button', name=verb, exact=True).click()
            page.get_by_role('button', name='小店课堂', exact=True).click()
            for i, answer in enumerate(answers):
                page.locator('.phrase-lessons article .soft-button').nth(i).click()
                page.get_by_role('dialog').get_by_role('button', name=answer, exact=True).click()
        assert len(state()['actionRecall']) == 67 and len(state()['phraseRecall']) == 22
        page.get_by_label('学习主题', exact=True).select_option('coffee')
        page.locator('.practice-modes button').nth(1).click()
        for i, answer in enumerate(['pack', 'load', 'brew']):
            expect(page.locator('.lesson-progress')).to_contain_text(f'{i+1} / 3')
            page.get_by_role('dialog').get_by_role('button', name=answer, exact=True).click()
        expect(page.locator('.round-summary')).to_contain_text('完成 3 题')

        # Dialog accessibility and all important narrow-screen pages.
        page.get_by_role('button', name='重新开店', exact=True).click()
        for _ in range(7):
            page.keyboard.press('Tab')
            assert page.evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)')
        page.keyboard.press('Escape'); expect(page.get_by_role('dialog')).to_have_count(0)
        for width in [320, 375, 390, 414, 768, 820]:
            page.set_viewport_size({'width': width, 'height': 844})
            for name in ['今日任务', '自由合成', '生活小镇', '学习', '我的小店']:
                nav.get_by_role('button', name=name, exact=True).click()
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{name} overflow {width}'
                if name == '自由合成':
                    # Cells must stay inside their tracks, even when the minimum touch height applies.
                    cells = page.locator('.board-slot').evaluate_all('(nodes) => nodes.map(n => { const r = n.getBoundingClientRect(); return {left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height} })')
                    for row in range(8):
                        for col in range(5):
                            assert cells[row*6+col]['right'] <= cells[row*6+col+1]['left'], f'tiles overlap at {width}'
                    assert 44 <= cells[0]['width'] <= 81, (width, cells[0])
                    assert cells[0]['height'] <= 75, (width, cells[0])
                    expect(page.locator('.quick-delivery')).to_be_in_viewport()
        page.set_viewport_size({'width': 390, 'height': 844})
        nav.get_by_role('button', name='自由合成', exact=True).click()
        # The current order stays reachable on mobile while the 48-slot board scrolls.
        expect(page.locator('.quick-delivery')).to_be_in_viewport()
        expect(page.locator('.quick-delivery button')).to_be_enabled()
        before = state()['coins']; page.locator('.quick-delivery button').click()
        assert state()['coins'] == before + 20
        page.screenshot(path=str(output / 'expanded-workshop-mobile.png'), full_page=True)

        # A real v4-shaped save upgrades in the browser without losing tile position or purchases.
        old = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', SAVE_KEY)
        old['version'] = 4; old.pop('progress')
        old['boards'] = {name: [None] * 25 for name in ['cafe', 'workshop', 'market']}
        old['boards']['cafe'][7] = 'coffee-1'; old['district'] = 'cafe'
        original = {'coffee':5,'garden':5,'bakery':5,'juice':4,'clothes':4,'paper':4,'pottery':4,'kitchen':4}
        old['discovered'] = [theme+'-0' for theme in original] + ['coffee-1']
        old['orderStep'] = {theme:0 for theme in original}; old['orderStep']['coffee'] = 1
        old['recall'] = {'coffee-1':2}; old['actionRecall'] = {}; old['phraseRecall'] = {}
        old['coins'] = 42; old['journey']['step'] = 1; old['journey']['owned'] = ['sage']; old['journey']['equipped'] = {'awning':'sage'}
        migrated_context = browser.new_context(viewport={'width':390,'height':844})
        migrated_context.add_init_script(f'localStorage.setItem({json.dumps(SAVE_KEY)}, JSON.stringify({json.dumps(old)}))')
        migrated_page = migrated_context.new_page(); migrated_page.goto(url.split('#')[0]+'#merge'); migrated_page.wait_for_load_state('networkidle')
        restored = migrated_page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', SAVE_KEY)
        assert restored['version'] == 9 and restored['coins'] == 42
        assert restored['boards']['cafe'][8] == 'coffee-1' and len(restored['boards']['cafe']) == 48
        assert restored['journey']['equipped']['awning'] == 'sage' and restored['recall']['coffee-1'] == 2
        assert restored['orderStep']['coffee'] == 1 and restored['orderStep']['breakfast'] == 0
        migrated_context.close()

        touch = browser.new_context(viewport={'width':390, 'height':844}, is_mobile=True, has_touch=True, reduced_motion='reduce')
        tp = touch.new_page(); tp.goto(url); tp.wait_for_load_state('networkidle')
        tp.get_by_role('button', name='自由合成', exact=True).tap()
        tp.locator('[data-slot="7"]').tap(); tp.locator('[data-slot="8"]').tap()
        expect(tp.locator('[data-slot="8"]')).to_contain_text('bag')
        # A finger swipe over occupied tiles scrolls instead of moving or merging them.
        tp.locator('[data-slot="19"]').scroll_into_view_if_needed()
        touch_board = tp.evaluate('(key) => JSON.parse(localStorage.getItem(key)).boards.cafe', SAVE_KEY)
        scroll_before = tp.evaluate('scrollY')
        box = tp.locator('[data-slot="19"]').bounding_box()
        session = touch.new_cdp_session(tp)
        x, y = box['x'] + box['width']/2, box['y'] + box['height']/2
        session.send('Input.dispatchTouchEvent', {'type':'touchStart', 'touchPoints':[{'x':x, 'y':y}]})
        for step in range(1, 9):
            session.send('Input.dispatchTouchEvent', {'type':'touchMove', 'touchPoints':[{'x':x, 'y':y-step*15}]})
        session.send('Input.dispatchTouchEvent', {'type':'touchEnd', 'touchPoints':[]})
        tp.wait_for_function('(before) => scrollY > before + 30', arg=scroll_before)
        assert tp.evaluate('(key) => JSON.parse(localStorage.getItem(key)).boards.cafe', SAVE_KEY) == touch_board
        session.detach()
        assert not errors, errors
        touch.close(); context.close(); browser.close()
        print('PASS: 48-slot workshop, one-click orders, 8-level progression, bulk/upgraded/basic supplies, combinations, goal rewards, 67 actions, 22 phrases, persistence, accessibility and mobile/touch')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--url', default='http://127.0.0.1:5011/')
    parser.add_argument('--output', type=Path, default=Path(tempfile.gettempdir()) / 'epartner-word-merge-qa')
    args = parser.parse_args(); args.output.mkdir(parents=True, exist_ok=True)
    run(args.url, args.output)
    from verify_picnic import run_picnic
    run_picnic(args.url, args.output)
    from verify_visitors import run_visitors
    run_visitors(args.url, args.output)
    from verify_stores import run_stores
    run_stores(args.url, args.output)
    from verify_town import run_town
    run_town(args.url, args.output)
    from verify_kitchen import run_kitchen
    run_kitchen(args.url, args.output)
    from verify_room import run_room
    run_room(args.url, args.output)
    from verify_delivery import run_delivery
    run_delivery(args.url, args.output)
    from verify_fishing import run_fishing
    run_fishing(args.url, args.output)
    from verify_care import run_care
    run_care(args.url, args.output)
    from verify_farm import run_farm
    run_farm(args.url, args.output)
    from verify_adventure import run_adventure
    run_adventure(args.url, args.output)
