"""Browser acceptance checks for the standalone word-merge demo.

Run with the frontend dev server on port 5011:
  python e2e/verify_word_merge.py
No backend or database is needed. Each run uses an isolated browser context.
"""
import argparse
import json
import re
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

SAVE_KEY = 'epartner-word-merge-v1'
MEANINGS = {
    'coffee': ['咖啡豆', '袋子', '咖啡机', '咖啡', '杯子'],
    'garden': ['种子', '幼苗', '植物', '花', '花束'],
    'bakery': ['面粉', '面团', '面包', '吐司', '三明治'],
}


def run(url: str, output: Path):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(url)
        page.wait_for_load_state('networkidle')
        expect(page.locator('.board-slot')).to_have_count(25)

        def state():
            saved = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', SAVE_KEY)
            return {**saved, 'board': saved['boards'][saved['district']]}

        def slot(index):
            return page.locator(f'[data-slot="{index}"]')

        def solve():
            modal = page.get_by_role('dialog')
            if modal.count():
                word = page.locator('.word-panel h2').inner_text()
                # Find the merged word in saved state without depending on its slot position.
                focused = page.locator('.word-panel .word-meaning').inner_text().split(' · ')[0]
                modal.get_by_role('button', name=focused, exact=True).click()
                expect(modal).to_have_count(0)

        def merge(from_index, to_index):
            slot(from_index).click()
            slot(to_index).click()
            solve()

        # First unlock, wrong answer retry, no falsely credited independent recall.
        slot(6).click()
        expect(slot(7)).to_have_class(re.compile('compatible'))
        slot(7).click()
        modal = page.get_by_role('dialog')
        expect(modal).to_be_visible()
        wrong = modal.locator('.quiz-options button').filter(has_not_text='袋子').first
        wrong.click()
        expect(modal.locator('.quiz-feedback')).to_be_visible()
        assert state()['board'][7] == 'coffee-1'
        modal.get_by_role('button', name='袋子', exact=True).click()
        assert state()['recall'].get('coffee-1', 0) == 0

        # Mouse dragging must merge exactly once, not select another tile on synthetic click.
        slot(12).scroll_into_view_if_needed()
        a, b = slot(11).bounding_box(), slot(12).bounding_box()
        page.mouse.move(a['x'] + a['width']/2, a['y'] + a['height']/2)
        page.mouse.down()
        page.mouse.move(b['x'] + b['width']/2, b['y'] + b['height']/2, steps=12)
        page.mouse.up()
        solve()
        assert state()['board'][11] is None and state()['board'][12] == 'garden-1'
        assert state()['merges'] == 2

        # Keyboard selection and movement to an empty slot.
        slot(7).focus()
        page.keyboard.press('Enter')
        slot(0).focus()
        page.keyboard.press('Enter')
        assert state()['board'][0] == 'coffee-1' and state()['board'][7] is None
        slot(0).click()  # deselect after moving

        # Finish the first coffee order through its English sentence.
        supply = page.get_by_role('button', name='coffee bean 咖啡时光', exact=True)
        supply.click(); supply.click()
        beans = [i for i, v in enumerate(state()['board']) if v == 'coffee-0']
        merge(*beans)
        bags = [i for i, v in enumerate(state()['board']) if v == 'coffee-1']
        merge(*bags)
        before = state()
        page.get_by_role('button', name='交付 coffee maker 订单', exact=True).click()
        expect(page.locator('.order-quiz-sentence')).to_contain_text('_____')
        page.get_by_role('dialog').get_by_role('button', name='coffee maker', exact=True).click()
        after = state()
        assert after['deliveries'] == 1 and after['coins'] == before['coins'] + 20
        assert 'coffee-2' not in after['board'] and after['orderStep']['coffee'] == 1

        # Reload actually restores the board and counters.
        page.reload(); page.wait_for_load_state('networkidle')
        assert state() == after

        # All eight themes are reachable through actual UI supply and merge actions.
        themes = [
            ('coffee', 'coffee bean 咖啡时光', '花园小店', 4),
            ('garden', 'seed 窗边花园', '花园小店', 4),
            ('bakery', 'flour 暖心烘焙', '花园小店', 4),
            ('clothes', 'cotton 衣物工坊', '手作街角', 3),
            ('paper', 'paper 纸艺工坊', '手作街角', 3),
            ('pottery', 'clay 陶艺工坊', '手作街角', 3),
            ('juice', 'orange 鲜榨果汁', '阳光集市', 3),
            ('kitchen', 'potato 薯片厨房', '阳光集市', 3),
        ]
        for theme_id, supply_name, district_name, terminal_level in themes:
            page.get_by_role('navigation', name='街区选择').get_by_role('button', name=re.compile(district_name)).click()
            count = 0
            while f'{theme_id}-{terminal_level}' not in state()['board']:
                current = state()
                pair = None
                for level in range(terminal_level):
                    found = [i for i, item in enumerate(current['board']) if item == f'{theme_id}-{level}']
                    if len(found) >= 2:
                        pair = found[:2]
                        break
                if pair:
                    merge(*pair)
                else:
                    assert None in current['board'], 'Progression unexpectedly filled the board'
                    page.get_by_role('button', name=supply_name, exact=True).click()
                count += 1
                assert count < 70, 'Progression did not converge'
            print(f'Unlocked {theme_id}', flush=True)
        assert len(state()['discovered']) == 35

        # Recycle a terminal item without losing its collection record.
        page.get_by_role('navigation', name='街区选择').get_by_role('button', name=re.compile('花园小店')).click()
        terminal = state()['board'].index('coffee-4')
        slot(terminal).click()
        page.get_by_role('button', name='回收选中', exact=True).click()
        assert state()['board'][terminal] is None and len(state()['discovered']) == 35
        page.get_by_role('button', name=re.compile('单词图鉴')).click()
        expect(page.locator('.collection-row button:not(:disabled)')).to_have_count(5)
        page.locator('.collection-row button').filter(has_text='bag').click()
        page.get_by_role('button', name='遮住释义，考考自己').click()
        page.get_by_role('dialog').get_by_role('button', name='袋子', exact=True).click()
        assert state()['recall']['coffee-1'] >= 1

        # New learning modes: retry does not falsely credit independent action/phrase recall.
        action_button = page.locator('.book-actions button').first
        action_button.click()
        page.get_by_role('dialog').locator('.quiz-options button').filter(has_not_text='pack').first.click()
        page.get_by_role('dialog').get_by_role('button', name='pack', exact=True).click()
        assert state()['actionRecall'].get('coffee-0', 0) == 0
        action_button.click()
        page.get_by_role('dialog').get_by_role('button', name='pack', exact=True).click()
        assert state()['actionRecall']['coffee-0'] == 1
        page.get_by_role('button', name='小店课堂', exact=True).click()
        page.locator('.phrase-lessons article .soft-button').first.click()
        page.get_by_role('dialog').get_by_role('button', name='slice', exact=True).click()
        page.get_by_role('dialog').get_by_role('button', name='cup', exact=True).click()
        assert state()['phraseRecall'].get('coffee-0', 0) == 0
        page.locator('.phrase-lessons article .soft-button').first.click()
        page.get_by_role('dialog').get_by_role('button', name='cup', exact=True).click()
        assert state()['phraseRecall']['coffee-0'] == 1

        # Every action and phrase can be practiced through the public UI.
        phrase_answers = {'coffee': ['cup', 'make'], 'garden': ['plant', 'bouquet'], 'bakery': ['slice', 'bake'], 'juice': ['glass', 'squeeze'], 'clothes': ['cotton', 'sew'], 'paper': ['piece', 'draw'], 'pottery': ['clay', 'shape'], 'kitchen': ['peel', 'fry']}
        for theme_id in phrase_answers:
            page.get_by_role('button', name=re.compile('单词图鉴')).click()
            page.get_by_label('学习主题', exact=True).select_option(theme_id)
            expect(page.locator('.collection-row button:not(:disabled)')).to_have_count(5 if theme_id in ['coffee', 'garden', 'bakery'] else 4)
            action_buttons = page.locator('.book-actions button')
            for index in range(action_buttons.count()):
                verb = action_buttons.nth(index).locator('b').inner_text()
                action_buttons.nth(index).click()
                page.get_by_role('dialog').get_by_role('button', name=verb, exact=True).click()
            page.get_by_role('button', name='小店课堂', exact=True).click()
            for index, answer in enumerate(phrase_answers[theme_id]):
                page.locator('.phrase-lessons article .soft-button').nth(index).click()
                expect(page.locator('.order-quiz-sentence')).to_contain_text('_____')
                page.get_by_role('dialog').get_by_role('button', name=answer, exact=True).click()
        assert len(state()['actionRecall']) == 27 and len(state()['phraseRecall']) == 16
        learned = state()
        page.reload(); page.wait_for_load_state('networkidle')
        assert state() == learned
        cafe_board = state()['boards']['cafe']
        page.get_by_role('navigation', name='街区选择').get_by_role('button', name=re.compile('手作街角')).click()
        assert state()['boards']['cafe'] == cafe_board
        page.get_by_role('navigation', name='街区选择').get_by_role('button', name=re.compile('花园小店')).click()

        # Full board and recovery; invalid save falls back to a valid new game.
        page.get_by_role('button', name='我的小店', exact=True).click()
        for _ in range(state()['board'].count(None)):
            supply.click()
        full = state()
        supply.click()
        assert state() == full
        expect(page.locator('.board-tip')).to_contain_text('棋盘满了')
        page.evaluate('(key) => localStorage.setItem(key, "{invalid")', SAVE_KEY)
        page.reload(); page.wait_for_load_state('networkidle')
        expect(page.locator('.board-slot.occupied')).to_have_count(6)
        expect(page.locator('.cafe-footer')).to_contain_text('旧存档无法读取')

        # Confirmation cancellation and keyboard focus trapping.
        page.get_by_role('button', name='重新开店', exact=True).click()
        modal = page.get_by_role('dialog')
        for _ in range(7):
            page.keyboard.press('Tab')
            assert page.evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)')
        page.keyboard.press('Escape')
        expect(modal).to_have_count(0)
        assert page.evaluate('document.activeElement.textContent.includes("重新开店")')

        page.screenshot(path=str(output / 'word-merge-desktop.png'), full_page=True)
        for width in [320, 375, 390, 768]:
            page.set_viewport_size({'width': width, 'height': 844})
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), f'Overflow at {width}'
        page.set_viewport_size({'width': 390, 'height': 844})
        page.screenshot(path=str(output / 'word-merge-mobile.png'), full_page=True)

        # Real touch input follows the same rules; drag via pointer events is covered above.
        touch_context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, reduced_motion='reduce')
        touch_page = touch_context.new_page()
        touch_page.goto(url); touch_page.wait_for_load_state('networkidle')
        touch_page.locator('[data-slot="6"]').tap()
        touch_page.locator('[data-slot="7"]').tap()
        expect(touch_page.get_by_role('dialog')).to_be_visible()
        touch_page.get_by_role('dialog').get_by_role('button', name='袋子', exact=True).tap()
        expect(touch_page.locator('[data-slot="7"]')).to_contain_text('bag')
        assert not errors, errors
        touch_context.close(); context.close(); browser.close()
        print('PASS: all 35 objects / 27 actions / 16 phrases, three independent street boards, retry accounting, merging, drag, keyboard, orders, persistence, full board, malformed save, focus trap, responsive layout, and touch taps')
        print(f'Screenshots: {output}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://127.0.0.1:5011/')
    parser.add_argument('--output', type=Path, default=Path(tempfile.gettempdir()) / 'epartner-word-merge-qa')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    run(args.url, args.output)
