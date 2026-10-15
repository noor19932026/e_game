"""Story, learning and shop acceptance checks against the built static app."""
import re
from playwright.sync_api import sync_playwright, expect

SAVE_KEY = 'epartner-word-merge-v1'
DAY = 24 * 60 * 60 * 1000


def run_picnic(url, output):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
        page = context.new_page()
        errors, requests = [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('request', lambda request: requests.append(request.url))
        page.goto(url)
        page.wait_for_load_state('networkidle')
        story = page.locator('.picnic-journey')
        navigation = page.get_by_role('navigation', name='主要功能')
        expect(navigation.get_by_role('button')).to_have_count(4)
        expect(story).to_be_visible()
        expect(page.locator('.free-play')).not_to_be_visible()
        navigation.get_by_role('button', name='我的小店', exact=True).click()
        default_awning = page.locator('.awning i').first.evaluate('(el) => getComputedStyle(el).backgroundColor')
        expect(page.get_by_label('我的小店实时预览')).to_be_visible()
        expect(story.locator('.prep-board')).to_have_count(0)
        navigation.get_by_role('button', name='今日任务', exact=True).click()

        def state():
            saved = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', SAVE_KEY)
            saved.pop('visitors', None)
            return saved

        def choose(food, quantity=1, destination=None):
            story.get_by_role('button', name=f'选择 {food}', exact=True).click()
            if destination:
                story.get_by_role('button', name=re.compile(destination), exact=False).click()
            elif story.locator('.quantity-picker').count():
                story.get_by_role('button', name=f'数量 {quantity}', exact=True).click()
            story.get_by_role('button', name='确认交付', exact=True).click()

        # Nothing can be delivered before it is packed, and closing a request is safe.
        story.get_by_role('button', name='打开订单', exact=True).click()
        choose('bread')
        assert state()['journey']['step'] == 0 and state()['coins'] == 0
        expect(story.locator('.picnic-help')).to_contain_text('没有足够')
        story.get_by_role('button', name='收起订单', exact=True).click()

        # Real UI supplies and packing; no save fixtures are used for chapter progression.
        for food in ['bread', 'apple', 'milk', 'water']:
            story.get_by_role('button', name=f'领取 {food}', exact=True).click()
            story.get_by_role('button', name=f'领取 {food}', exact=True).click()
            story.get_by_role('button', name=f'备餐格 1 {food}', exact=True).click()
            story.get_by_role('button', name=f'备餐格 2 {food}', exact=True).click()
            assert state()['journey']['packed'][food] == 2
        page.screenshot(path=str(output / 'picnic-desktop.png'), full_page=True)
        story.get_by_role('button', name='打开订单', exact=True).click()
        # Explicit help must survive a reload and must not turn into independent recall.
        story.get_by_role('button', name='需要中文提示', exact=True).click()
        page.reload(); page.wait_for_load_state('networkidle')
        story.get_by_role('button', name='打开订单', exact=True).click()
        choose('bread')
        assert state()['journey']['memory']['bread']['helped'] == 1
        assert state()['journey']['memory']['bread']['independent'] == 0
        assert state()['journey']['step'] == 1

        # Quantity errors preserve inventory; corrected answers earn the normal game reward.
        story.get_by_role('button', name='打开订单', exact=True).click()
        before = state()
        choose('apple', 1)
        assert state()['journey']['packed'] == before['journey']['packed']
        assert state()['coins'] == before['coins']
        choose('apple', 2)
        assert state()['journey']['memory']['apple']['helped'] == 1
        # A usable sink for existing and newly-earned coins.
        navigation.get_by_role('button', name='我的小店', exact=True).click()
        sage = story.locator('.decoration-grid article').filter(has_text='鼠尾草绿雨棚')
        sage.get_by_role('button').click()
        assert state()['coins'] == 0
        assert state()['journey']['equipped']['awning'] == 'sage'
        assert page.locator('.awning i').first.evaluate('(el) => getComputedStyle(el).backgroundColor') == 'rgb(132, 155, 119)'
        assert default_awning != 'rgb(132, 155, 119)'
        expect(page.locator('.equipped-label')).to_have_text('鼠尾草绿雨棚')
        navigation.get_by_role('button', name='今日任务', exact=True).click()

        # Listening hides the text; replaying audio is allowed, revealing it marks help.
        story.get_by_label('订单练习方式').select_option('listen')
        story.get_by_role('button', name='打开订单', exact=True).click()
        expect(story.locator('.picnic-sentence')).to_contain_text('听听 Mia')
        assert 'carton' not in story.locator('.picnic-question').inner_text()
        story.get_by_role('button', name='查看英文文字', exact=True).click()
        choose('milk')
        assert state()['journey']['memory']['milk']['helped'] == 1
        story.get_by_label('订单练习方式').select_option('picture')
        story.get_by_role('button', name='打开订单', exact=True).click()
        choose('water')
        assert state()['journey']['memory']['water']['independent'] == 1
        story.get_by_role('button', name='整理野餐包', exact=True).click()
        choose('bread', destination='table')
        assert state()['journey']['step'] == 4
        choose('bread', destination='bag')
        assert state()['journey']['step'] == 5 and state()['coins'] == 56
        expect(story.locator('.picnic-place.filled')).to_have_count(4)
        expect(story.locator('.picnic-bag.filled')).to_have_count(1)
        navigation.get_by_role('button', name='我的小店', exact=True).click()
        story.locator('.decoration-grid article').filter(has_text='野餐小馆招牌').get_by_role('button').click()
        expect(page.locator('.shop-sign')).to_contain_text('MIA’S PICNIC')
        complete = state()
        page.reload(); page.wait_for_load_state('networkidle')
        assert state() == complete
        expect(page.locator('.shop-sign')).to_contain_text('MIA’S PICNIC')

        # Before the time boundary no delayed test is offered.
        navigation.get_by_role('button', name='学习', exact=True).click()
        expect(story.get_by_role('button', name='开始隔天复习')).to_have_count(0)

        # Move the browser clock forward, keeping the real persisted learning history.
        future = max(r['due'] for r in state()['journey']['memory'].values()) + 1
        page.clock.install(time=future)
        page.reload(); page.wait_for_load_state('networkidle')
        navigation.get_by_role('button', name='学习', exact=True).click()
        story.get_by_role('button', name='开始隔天复习', exact=True).click()
        for index, food in enumerate(['bread', 'apple', 'milk', 'water']):
            expect(story.locator('.question-heading')).to_contain_text(f'{index + 1} / 4')
            # The alternate illustration is a different SVG, not just a changed label.
            assert story.locator('.picnic-question .food-choices svg').count() == 4
            if food == 'apple':
                story.get_by_role('button', name='选择 milk', exact=True).click()
                story.get_by_role('button', name='确认，下一题', exact=True).click()
            story.get_by_role('button', name=f'选择 {food}', exact=True).click()
            story.get_by_role('button', name='确认，下一题', exact=True).click()
        expect(story.locator('.review-desk')).to_contain_text('复习完成')
        memory = state()['journey']['memory']
        assert memory['apple']['retained'] == 0 and memory['apple']['helped'] == 2
        for food in ['bread', 'milk', 'water']:
            assert memory[food]['retained'] == 1
        assert memory['water']['due'] - memory['water']['lastSeen'] == 3 * DAY
        assert memory['water']['lastSeen'] >= future
        page.clock.resume()

        # Three questions stay in one classroom flow and end with a round summary.
        navigation.get_by_role('button', name='学习', exact=True).click()
        page.get_by_role('button', name='小店课堂', exact=True).click()
        page.locator('.practice-modes button').nth(1).click()
        for index, word in enumerate(['pack', 'load', 'brew']):
            expect(page.locator('.lesson-progress')).to_contain_text(f'{index + 1} / 3')
            # Correct verb comes from the existing public action description.
            correct = page.get_by_role('dialog').locator('p').filter(has_text='选择表示').inner_text()
            verbs = {'装袋': 'pack', '装入': 'load', '冲煮': 'brew', '制作': 'brew'}
            answer = next((v for k, v in verbs.items() if k in correct), word)
            page.get_by_role('dialog').get_by_role('button', name=answer, exact=True).click()
        expect(page.get_by_role('dialog')).to_have_count(0)
        expect(page.locator('.round-summary')).to_contain_text('完成 3 题')

        # Compact screens show the same story and do not overflow horizontally.
        for width in [320, 375, 390, 768]:
            page.set_viewport_size({'width': width, 'height': 844})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow at {width}'
        page.set_viewport_size({'width': 390, 'height': 844})
        navigation.get_by_role('button', name='今日任务', exact=True).click()
        story.screenshot(path=str(output / 'picnic-mobile.png'))
        # Earn the remaining four coins through real merges, then buy a second awning on mobile.
        navigation.get_by_role('button', name='自由合成', exact=True).click()
        for start, end in [(6, 7), (11, 12)]:
            page.locator(f'[data-slot="{start}"]').click()
            page.locator(f'[data-slot="{end}"]').click()
        assert state()['coins'] == 24
        navigation.get_by_role('button', name='我的小店', exact=True).click()
        story.locator('.decoration-grid article').filter(has_text='蜜桃色雨棚').get_by_role('button').click()
        expect(page.locator('.equipped-label')).to_have_text('蜜桃色雨棚')
        expect(page.get_by_label('我的小店实时预览')).to_be_in_viewport()
        assert state()['coins'] == 0
        story.locator('.decoration-grid article').filter(has_text='鼠尾草绿雨棚').get_by_role('button').click()
        expect(page.locator('.equipped-label')).to_have_text('鼠尾草绿雨棚')
        expect(page.get_by_label('我的小店实时预览')).to_be_in_viewport()
        assert state()['coins'] == 0
        page.screenshot(path=str(output / 'simple-shop-equipped-mobile.png'), full_page=True)
        assert not errors, errors
        assert not any('/api/' in request for request in requests), requests
        context.close(); browser.close()
        print('PASS: picnic packing and five tasks, quantity retries, listening help, chapter rewards, purchases/equipment, persistence, real 24h review scheduling, continuous classroom, and 320–768px layout')


if __name__ == '__main__':
    from pathlib import Path
    import tempfile
    output = Path(tempfile.gettempdir()) / 'epartner-word-merge-qa'
    output.mkdir(exist_ok=True)
    run_picnic('http://127.0.0.1:5011/', output)
