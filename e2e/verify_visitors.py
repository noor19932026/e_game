"""Exercise real visitor arrivals, merges, secrets and durable unlocks."""
from pathlib import Path
import tempfile
from playwright.sync_api import sync_playwright, expect

SAVE_KEY = 'epartner-word-merge-v1'
BASE_WORDS = {'cat': 'cat food', 'dog': 'dog food', 'rabbit': 'hay', 'bird': 'bird food', 'care': 'cloth'}


def run_visitors(url, output):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 950}, reduced_motion='reduce')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(url.split('#')[0] + '#visitors')
        page.wait_for_load_state('networkidle')
        cafe = page.locator('.visitor-cafe')

        def state():
            return page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', SAVE_KEY)

        def tile(index):
            return cafe.locator(f'[data-pet-slot="{index}"]')

        def clear_selection():
            selected = cafe.locator('.pet-board button[aria-pressed="true"]')
            if selected.count():
                selected.click()

        def prepare(route, level):
            cafe.get_by_label('动物合成路线', exact=True).select_option(route)
            steps = 0
            while True:
                current = state()['visitors']['board']
                ready = next((i for i, t in enumerate(current) if t and t['route'] == route and t['level'] == level), None)
                if ready is not None:
                    clear_selection(); tile(ready).click()
                    return ready
                pair = None
                for item_level in range(level):
                    found = [i for i, t in enumerate(current) if t and t['route'] == route and t['level'] == item_level]
                    if len(found) >= 2:
                        pair = found[:2]
                        break
                if pair:
                    clear_selection(); tile(pair[0]).click(); tile(pair[1]).click()
                else:
                    cafe.get_by_role('button', name=f'领取 {BASE_WORDS[route]}', exact=True).click()
                steps += 1
                assert steps < 20, 'Pet food recipe did not converge'

        def feed_and_help():
            current = state()['visitors']['current']
            before = state()['coins']
            prepare(current['animal'], current['wants'])
            cafe.locator('.pet-delivery button').click()
            assert state()['visitors']['current']['served']
            expect(cafe.locator('.animal-button')).to_be_visible()
            # A happy guest stays; interaction reveals the previously hidden task.
            cafe.locator('.animal-button').click()
            expect(cafe.get_by_label('隐藏添水任务')).to_be_visible()
            cafe.get_by_role('button', name='给动物 milk', exact=True).click()
            unchanged = state()['coins']
            assert state()['visitors']['current']['secret'] == 'found'
            expect(cafe.locator('.visitor-message')).to_contain_text('清水')
            cafe.get_by_role('button', name='给动物 water', exact=True).click()
            assert state()['visitors']['current']['secret'] == 'done'
            assert state()['coins'] >= unchanged
            assert state()['visitors']['careUnlocked']
            return state()['coins'] - before

        expect(cafe).to_be_visible()
        expect(page.locator('.picnic-journey')).not_to_be_visible()
        expect(page.locator('.free-play')).not_to_be_visible()
        expect(cafe.locator('.pet-delivery button')).to_be_disabled()
        assert state()['coins'] == 0 and state()['version'] == 9
        initial_animal = state()['visitors']['current']['animal']
        cafe.locator('.animal-preferences summary').click()
        expect(cafe.locator('.animal-preferences a')).to_have_attribute('href', f'https://www.rspca.org.uk/adviceandwelfare/pets/{"birds" if initial_animal == "bird" else initial_animal + "s"}/diet')
        page.screenshot(path=str(output / 'visitors-desktop.png'), full_page=True)
        assert feed_and_help() == 20
        assert state()['visitors']['upgraded'] == [initial_animal]
        expect(cafe.get_by_label('动物合成路线')).to_contain_text('温柔照料')

        # The gift is a playable recipe, not just a toast or a label.
        gift_slot = prepare('care', 2)
        assert state()['visitors']['board'][gift_slot] == {'route': 'care', 'level': 2}
        expect(cafe.locator('.pet-delivery button')).to_be_disabled()
        first_board = state()['visitors']['board']
        seen = [initial_animal]
        for i in range(1, 5):
            previous = state()
            page.reload(); page.wait_for_load_state('networkidle')
            current = state()['visitors']['current']['animal']
            assert current != previous['visitors']['current']['animal']
            assert state()['visitors']['board'] == previous['visitors']['board']
            assert state()['coins'] == previous['coins']
            seen.append(current)
            assert feed_and_help() == (20 if i < 4 else 0)
        assert len(set(seen[:4])) == 4
        assert state()['coins'] == 80 and state()['visitors']['points'] == 10
        assert any(t == {'route': 'care', 'level': 2} for t in first_board)

        # The next calendar day welcomes a new visitor and allows new thank-you gifts.
        tomorrow = page.evaluate('Date.now() + 24 * 60 * 60 * 1000')
        page.clock.set_fixed_time(tomorrow)
        page.reload(); page.wait_for_load_state('networkidle')
        assert state()['visitors']['fedToday'] == []
        assert state()['visitors']['helpedToday'] == []
        assert feed_and_help() == 20
        assert state()['coins'] == 100

        # New art is used in both awning products; saved purchases still work.
        page.get_by_role('navigation', name='主要功能').get_by_role('button', name='我的小店', exact=True).click()
        awnings = page.locator('.decoration-grid article').filter(has=page.locator('svg.decoration-art'))
        expect(awnings).to_have_count(4)
        assert page.locator('.decor-swatch').count() == 0
        expect(page.locator('.store-guest .animal-art')).to_be_visible()
        page.screenshot(path=str(output / 'decorations-redrawn.png'), full_page=True)
        page.get_by_role('navigation', name='主要功能').get_by_role('button', name='今日任务', exact=True).click()
        page.get_by_role('navigation', name='今日活动').get_by_role('button', name='动物来访', exact=True).click()
        for width in [320, 375, 390, 768]:
            page.set_viewport_size({'width': width, 'height': 844})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Visitor overflow at {width}'
        page.set_viewport_size({'width': 390, 'height': 844})
        cafe.locator('.guest-notebook summary').click()
        page.screenshot(path=str(output / 'visitors-mobile.png'), full_page=True)
        assert not errors, errors
        context.close(); browser.close()
        print('PASS: rotating four-animal visitors, free recipes, serving, hidden water task, playable gift route, persisted inventory, daily rewards, redrawn shop icons, and mobile layout')


if __name__ == '__main__':
    output = Path(tempfile.gettempdir()) / 'epartner-word-merge-qa'
    output.mkdir(exist_ok=True)
    run_visitors('http://127.0.0.1:5011/', output)
