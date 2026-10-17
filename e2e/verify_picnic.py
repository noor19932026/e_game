"""One-screen picnic: tap once per portion, deliver, and keep learning honest."""
import re
from pathlib import Path
import tempfile
from playwright.sync_api import sync_playwright, expect
SAVE_KEY = 'epartner-word-merge-v1'
DAY = 24 * 60 * 60 * 1000

def run_picnic(url, output):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width':1280,'height':900}, reduced_motion='reduce')
        page = context.new_page(); errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(url.split('#')[0] + '#today'); page.wait_for_load_state('networkidle')
        story = page.locator('.picnic-journey'); nav = page.get_by_role('navigation', name='主要功能')
        def state():
            saved = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', SAVE_KEY)
            saved.pop('visitors', None); return saved
        def tap(food, count=1):
            for _ in range(count): story.get_by_role('button', name=f'准备 {food}', exact=True).click()
        def deliver(): story.get_by_role('button', name='确认交付', exact=True).click()

        expect(story.locator('.picnic-question')).to_be_visible()
        expect(story.locator('.prep-board')).to_have_count(0)
        expect(story.get_by_role('button', name='打开订单')).to_have_count(0)
        expect(story.get_by_role('button', name='确认交付')).to_be_disabled()
        page.screenshot(path=str(output/'simple-picnic-desktop.png'), full_page=True)
        story.get_by_role('button', name='需要中文提示', exact=True).click()
        page.reload(); page.wait_for_load_state('networkidle')
        tap('bread'); deliver()
        assert state()['journey']['step'] == 1 and state()['coins'] == 12
        assert state()['journey']['memory']['bread']['helped'] == 1
        expect(story.locator('.picnic-sentence')).to_contain_text('Two apples')
        tap('apple'); before = state(); deliver()
        assert state()['journey']['step'] == 1 and state()['coins'] == before['coins']
        tap('apple'); expect(story.get_by_label('已经准备的食物')).to_contain_text('2')
        deliver(); assert state()['journey']['step'] == 2
        # Nothing is merged or collected: the next task stays on the same screen.
        story.get_by_label('订单练习方式').select_option('listen')
        expect(story.locator('.picnic-sentence')).to_contain_text('听听 Mia')
        story.get_by_role('button', name='查看英文文字', exact=True).click()
        tap('milk'); story.get_by_label('订单练习方式').select_option('picture'); deliver()
        assert state()['journey']['memory']['milk']['helped'] == 1
        tap('water'); deliver()
        assert state()['journey']['memory']['water']['independent'] == 1
        tap('bread'); story.locator('.destination-picker button').filter(has_text='table').click(); deliver()
        assert state()['journey']['step'] == 4
        story.locator('.destination-picker button').filter(has_text='bag').click(); deliver()
        assert state()['journey']['step'] == 5 and state()['coins'] == 80
        assert state()['progress']['xp'] == 60
        expect(story.locator('.picnic-place.filled')).to_have_count(4)
        expect(story.locator('.picnic-bag.filled')).to_have_count(1)
        expect(story.get_by_role('button', name='继续自由合成')).to_be_visible()

        nav.get_by_role('button', name='我的小店', exact=True).click()
        story.locator('.decoration-grid article').filter(has_text='鼠尾草绿雨棚').get_by_role('button').click()
        expect(page.locator('.equipped-label')).to_have_text('鼠尾草绿雨棚')
        story.locator('.decoration-grid article').filter(has_text='野餐小馆招牌').get_by_role('button').click()
        assert state()['coins'] == 20
        saved = state(); page.reload(); page.wait_for_load_state('networkidle'); assert state() == saved
        expect(page.locator('.shop-sign')).to_have_text('MIA’S PICNIC')
        nav.get_by_role('button', name='学习', exact=True).click()
        expect(story.get_by_role('button', name='开始隔天复习')).to_have_count(0)
        future = max(r['due'] for r in state()['journey']['memory'].values()) + 1
        page.clock.set_fixed_time(future); page.reload(); page.wait_for_load_state('networkidle')
        story.get_by_role('button', name='开始隔天复习', exact=True).click()
        for i, food in enumerate(['bread','apple','milk','water']):
            expect(story.locator('.question-heading')).to_contain_text(f'{i+1} / 4')
            if food == 'apple':
                story.get_by_role('button', name='选择 milk', exact=True).click()
                story.get_by_role('button', name='确认，下一题', exact=True).click()
            story.get_by_role('button', name=f'选择 {food}', exact=True).click()
            story.get_by_role('button', name='确认，下一题', exact=True).click()
        expect(story.locator('.review-desk')).to_contain_text('复习完成')
        memory = state()['journey']['memory']
        assert memory['apple']['retained'] == 0
        for food in ['bread','milk','water']: assert memory[food]['retained'] == 1
        assert memory['water']['due'] - memory['water']['lastSeen'] == 3 * DAY

        page.set_viewport_size({'width':390,'height':844})
        nav.get_by_role('button', name='自由合成', exact=True).click()
        for a,b in [(7,8),(13,14)]:
            page.locator(f'[data-slot="{a}"]').click(); page.locator(f'[data-slot="{b}"]').click()
        assert state()['coins'] == 24
        nav.get_by_role('button', name='我的小店', exact=True).click()
        story.locator('.decoration-grid article').filter(has_text='蜜桃色雨棚').get_by_role('button').click()
        expect(page.get_by_label('我的小店实时预览')).to_be_in_viewport()
        expect(page.locator('.equipped-label')).to_have_text('蜜桃色雨棚')
        nav.get_by_role('button', name='今日任务', exact=True).click()
        story.screenshot(path=str(output/'simple-picnic-finished-mobile.png'))
        assert not errors, errors
        context.close(); browser.close()
        print('PASS: direct one-screen picnic, repeated taps for quantities, safe retries, no packing gate, honest help, chapter rewards, spaced review, decorations and mobile')

if __name__ == '__main__':
    output=Path(tempfile.gettempdir())/'epartner-word-merge-qa'; output.mkdir(exist_ok=True)
    run_picnic('http://127.0.0.1:5011/',output)
