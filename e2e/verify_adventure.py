"""Actual scene, inventory, listening, save and touch checks for both adventure games."""
from pathlib import Path
import tempfile
from playwright.sync_api import sync_playwright, expect

SAVE_KEY = 'epartner-word-merge-v1'
SCENES = [
    ('park-treasure', ['bag','ball','bottle','chest']),
    ('class-treasure', ['book','bag','pencil','chest']),
    ('camp-treasure', ['lantern','map','boots','chest']),
    ('garden-door', ['key','door']),
    ('stream-bridge', ['plank','bridge','flag']),
    ('camp-map', ['flashlight','tent','map']),
    ('library-treasure', ['book','pencil','bag','chest']),
    ('beach-treasure', ['hat','ball','shell','chest']),
    ('garden-treasure', ['flower','leaf','wateringcan','chest']),
    ('kitchen-treasure', ['cup','spoon','bowl','chest']),
    ('library-lost-things', ['hat','picture','book','chest']),
    ('beach-picnic', ['bottle','ball','bag','chest']),
    ('library-cupboard', ['key','cupboard','map']),
    ('garden-flower', ['wateringcan','plant','flower']),
    ('beach-boat', ['rope','boat','flag']),
    ('kitchen-snack', ['spoon','bowl','salad']),
    ('garden-window', ['towel','window','key','door']),
    ('library-light', ['battery','lamp','book','shelf']),
]

def assert_targets_separate(app):
    targets=[(button.get_attribute('data-object'),button.bounding_box()) for button in app.locator('.adventure-hotspot').all()]
    for index,(name,box) in enumerate(targets):
        assert box['width']>=43.5 and box['height']>=43.5,(name,box)
        for other_name,other in targets[index+1:]:
            overlap_x=min(box['x']+box['width'],other['x']+other['width'])-max(box['x'],other['x'])
            overlap_y=min(box['y']+box['height'],other['y']+other['height'])-max(box['y'],other['y'])
            assert not(overlap_x>1 and overlap_y>1),(name,other_name,overlap_x,overlap_y)

def run_adventure(url, output):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width':1280,'height':1000})
        page = context.new_page(); errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(url.split('#')[0]+'#adventure'); page.wait_for_load_state('networkidle')
        app = page.get_by_role('region',name='探险乐园',exact=True)
        expect(app).to_be_visible()
        def saved(): return page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',SAVE_KEY)
        before = saved()
        # Incorrect choices must preserve the actual game state.
        app.locator('[data-object="chest"]').click()
        assert saved()['adventure']['sessions']['park-treasure']['step'] == 0
        # Every scene performs real collection or changes, completed chapters never pay twice.
        for index,(scene,steps) in enumerate(SCENES):
            app.get_by_role('button',name='场景寻宝' if scene in [s[0] for s in SCENES[:3]+SCENES[6:12]] else '小小解谜',exact=False).click()
            app.get_by_role('combobox',name='选择探险场景').select_option(scene)
            if scene in ['library-treasure','beach-treasure','garden-treasure','kitchen-treasure']:
                page.screenshot(path=str(output/f'adventure-{scene}-desktop.png'),full_page=True)
            if scene == 'camp-map':
                expect(app.locator('[data-object="map"]')).to_have_count(0)
                app.locator('[data-object="tent"]').click()
                assert saved()['adventure']['sessions'][scene]['step'] == 0
            for step_index,target in enumerate(steps):
                assert_targets_separate(app)
                app.locator('[data-object="'+target+'"]').click()
                state = saved()['adventure']['sessions'][scene]
                assert state['step'] == step_index+1, (scene,target)
                if target in state['found']: expect(app.locator('[data-object="'+target+'"]').first).to_have_count(0)
                else:
                    expect(app.locator('[data-object="'+target+'"]').first).to_have_class('adventure-scene-object adventure-scenery')
                    assert app.locator('[data-object="'+target+'"] .adventure-object-art path').count()>0
            expect(app.get_by_role('heading',name='探险完成！',exact=True)).to_be_visible()
            rewarded = saved()
            app.get_by_role('combobox',name='选择探险场景').select_option(scene)
            assert saved()['coins'] == rewarded['coins']
            assert saved()['progress'] == rewarded['progress']
        after=saved()
        assert after['coins']-before['coins'] == 162+4*26+2*28+4*32+2*36
        assert after['progress']['xp']-before['progress']['xp'] == 120+4*18+2*20+4*24+2*26
        assert after['adventure']['independent'] == len(SCENES)
        page.reload(); page.wait_for_load_state('networkidle')
        assert saved()['adventure'] == after['adventure']
        page.screenshot(path=str(output/'adventure-desktop.png'),full_page=True)
        context.close()
        # Independent listening starts with a fresh unexposed scene after switching mode.
        mobile=browser.new_context(viewport={'width':320,'height':740},is_mobile=True,has_touch=True)
        page=mobile.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(url.split('#')[0]+'#adventure');page.wait_for_load_state('networkidle')
        app=page.get_by_role('region',name='探险乐园',exact=True)
        app.get_by_role('button',name='听力挑战',exact=True).tap()
        app.get_by_role('combobox',name='选择探险场景').select_option('class-treasure')
        # English and translation must not be exposed through scene labels, inventory or prompt.
        assert 'green book' not in app.inner_text().lower()
        assert '绿色' not in app.inner_text()
        assert '书包' not in app.inner_text()
        app.get_by_role('button',name='朗读任务指令',exact=True).tap()
        app.locator('[data-object="book"]').tap()
        assert saved()['adventure']['sessions']['class-treasure']['step'] == 1
        page.reload();page.wait_for_load_state('networkidle')
        assert saved()['adventure']['mode'] == 'listening'
        assert 'blue bag' not in app.inner_text().lower()
        # Open an explicit hint; closing it or reloading cannot undo assisted status.
        prompt=app.get_by_role('region',name='当前任务指令')
        prompt.get_by_role('button',name='查看图文提示',exact=True).tap()
        assert saved()['adventure']['helped']
        page.reload();page.wait_for_load_state('networkidle')
        assert saved()['adventure']['hintOpen']
        expect(app.get_by_text('blue bag',exact=True)).to_be_visible()
        for target in ['bag','pencil','chest']: app.locator('[data-object="'+target+'"]').tap()
        assert saved()['adventure']['assisted'] == 1
        for width,height in [(320,740),(390,844),(844,390),(768,1024),(1440,1000)]:
            page.set_viewport_size({'width':width,'height':height})
            app.get_by_role('combobox',name='选择探险场景').select_option('camp-treasure')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
            assert_targets_separate(app)
            page.screenshot(path=str(output/f'adventure-{width}.png'),full_page=True)
        # Complete the final fresh scene through touch in listening mode.
        for target in ['lantern','map','boots','chest']: app.locator('[data-object="'+target+'"]').tap()
        assert saved()['adventure']['independent'] == 1
        page.set_viewport_size({'width':390,'height':844})
        # Every fresh scene and every step works with touch on the narrowest phone.
        page.set_viewport_size({'width':320,'height':740})
        for scene,steps in [s for s in SCENES if s[0] not in ['class-treasure','camp-treasure']]:
            kind='场景寻宝' if scene in [s[0] for s in SCENES[:3]+SCENES[6:12]] else '小小解谜'
            app.get_by_role('button',name=kind,exact=False).tap()
            app.get_by_role('combobox',name='选择探险场景').select_option(scene)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),scene
            assert saved()['adventure']['sessions'][scene]['step'] == 0
            for target in steps:
                assert_targets_separate(app)
                expect(app.locator('.adventure-hint')).to_have_count(0)
                app.locator('[data-object="'+target+'"]').tap()
            assert saved()['adventure']['sessions'][scene]['complete']
        assert saved()['adventure']['independent'] == len(SCENES)-2
        assert saved()['adventure']['assisted'] == 2
        page.screenshot(path=str(output/'adventure-puzzle-mobile.png'),full_page=True)
        mobile.close();browser.close()
        assert not errors,errors
    print('PASS: 9 treasure scenes +9 inventory puzzles, once-only rewards, listening hints, safe wrong clicks, persistence and touch layouts')

if __name__ == '__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://127.0.0.1:5011/')
    parser.add_argument('--output',type=Path,default=Path(tempfile.gettempdir())/'epartner-word-merge-qa')
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    run_adventure(args.url,args.output)
