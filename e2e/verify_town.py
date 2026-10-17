"""The town hub links all eight destinations without growing the five-tab navigation."""
from pathlib import Path
import tempfile
from playwright.sync_api import sync_playwright, expect
from legacy_save import legacy_save, assert_preserved

SAVE_KEY = 'epartner-word-merge-v1'


def run_town(url, output):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        page = context.new_page(); errors = []
        page.on('pageerror',lambda error: errors.append(str(error)))
        page.goto(url.split('#')[0]+'#town'); page.wait_for_load_state('networkidle')
        nav = page.get_by_role('navigation',name='主要功能')
        expect(nav.get_by_role('button')).to_have_count(5)
        expect(nav.get_by_role('button',name='生活小镇',exact=True)).to_have_attribute('aria-pressed','true')
        hub = page.get_by_role('region',name='生活小镇地图')
        for width,height in [(320,740),(390,844),(768,1024),(844,390),(1440,1000)]:
            page.set_viewport_size({'width':width,'height':height})
            expect(hub).to_be_visible()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
            assert 'NaN' not in hub.inner_text()
            for title, destination in [('开店接客','stores'),('小小厨房','kitchen'),('整理小屋','room'),('小镇送货员','delivery'),('英语钓鱼','fishing'),('宠物照料站','care'),('农场花园','farm'),('寻宝与解谜','adventure')]:
                hub.get_by_role('button',name='进入'+title,exact=True).tap()
                activity_nav = page.get_by_role('navigation',name='小镇活动')
                if width <= 960: expect(activity_nav.get_by_role('combobox',name='切换小镇活动')).to_have_value(destination)
                else: expect(activity_nav.get_by_role('button',name=title,exact=True)).to_have_attribute('aria-pressed','true')
                assert page.evaluate('location.hash') == '#'+destination
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width,destination)
                page.reload(); page.wait_for_load_state('networkidle')
                if width <= 960: expect(activity_nav.get_by_role('combobox',name='切换小镇活动')).to_have_value(destination)
                else: expect(activity_nav.get_by_role('button',name=title,exact=True)).to_have_attribute('aria-pressed','true')
                activity_nav.get_by_role('button',name='小镇地图',exact=True).tap()
            page.screenshot(path=str(output/f'town-{width}.png'),full_page=True)
        hub.get_by_role('navigation',name='小镇玩法分类').get_by_role('button',name='生活日常',exact=True).tap()
        expect(hub.locator('.town-place')).to_have_count(4)
        hub.get_by_role('navigation',name='小镇玩法分类').get_by_role('button',name='户外探索',exact=True).tap()
        expect(hub.locator('.town-place')).to_have_count(4)
        hub.get_by_role('navigation',name='小镇玩法分类').get_by_role('button',name='全部活动',exact=False).tap()
        expect(hub.locator('.town-place')).to_have_count(8)
        # Upgrade a genuine v6 shape with an unfinished shopping basket in the browser.
        page.get_by_role('button',name='进入开店接客',exact=True).tap()
        page.locator('[data-product="milk"]').first.tap()
        old = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))',SAVE_KEY)
        old = legacy_save(old,6)
        context2 = browser.new_context(viewport={'width':390,'height':844})
        import json
        context2.add_init_script(f'localStorage.setItem({json.dumps(SAVE_KEY)},JSON.stringify({json.dumps(old)}))')
        restored = context2.new_page(); restored.goto(url.split('#')[0]+'#town'); restored.wait_for_load_state('networkidle')
        new = restored.evaluate('(key) => JSON.parse(localStorage.getItem(key))',SAVE_KEY)
        assert new['version'] == 9
        for field in ['stores','boards','coins','journey','progress']:
            assert_preserved(old[field],new[field],field)
        assert 'kitchen' in new and 'room' in new
        context2.close()
        # Genuine v7 saves retain real partial cooking and placements, not only fresh defaults.
        page.goto(url.split('#')[0]+'#kitchen'); page.wait_for_load_state('networkidle')
        page.locator('[data-kitchen-action="bread"]').tap()
        page.goto(url.split('#')[0]+'#room'); page.wait_for_load_state('networkidle')
        page.get_by_role('button',name='打开搬家纸箱',exact=False).tap()
        page.locator('[data-room-item="book"]').tap(); page.locator('[data-destination="desk"]').tap()
        old = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))',SAVE_KEY)
        old = legacy_save(old,7)
        context3 = browser.new_context(viewport={'width':390,'height':844})
        context3.add_init_script(f'localStorage.setItem({json.dumps(SAVE_KEY)},JSON.stringify({json.dumps(old)}))')
        restored3 = context3.new_page(); restored3.goto(url.split('#')[0]+'#town'); restored3.wait_for_load_state('networkidle')
        new = restored3.evaluate('(key) => JSON.parse(localStorage.getItem(key))',SAVE_KEY)
        assert new['version'] == 9
        assert old['kitchen']['step'] == 1 and old['room']['sessions']['welcome']['placed'] == ['welcome-book']
        for field in ['kitchen','room','stores','coins','progress','journey','boards']:
            assert_preserved(old[field],new[field],field)
        assert all(field in new for field in ['delivery','fishing','care','farm','adventure'])
        context3.close()
        # A fourth-round v8 meal must still be the classic sandwich, never the newly added recipe.
        fixture=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',SAVE_KEY)
        fixture['kitchen'].update(round=4,step=2,served=False,independent=3,assisted=0,completed=['sandwich','fruit-cup','breakfast'])
        old=legacy_save(fixture,8)
        context4=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        context4.add_init_script(f'if(!localStorage.getItem({json.dumps(SAVE_KEY)})) localStorage.setItem({json.dumps(SAVE_KEY)},JSON.stringify({json.dumps(old)}))')
        restored4=context4.new_page(); restored4.goto(url.split('#')[0]+'#kitchen');restored4.wait_for_load_state('networkidle')
        new=restored4.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',SAVE_KEY)
        assert new['version']==9 and new['kitchen']['contentFrom']==5 and new['kitchen']['step']==2
        for field in ['stores','kitchen','room','delivery','fishing','care','farm','adventure','coins','progress','journey','boards']:
            assert_preserved(old[field],new[field],field)
        expect(restored4.locator('.kitchen-english')).to_contain_text('Add the cheese')
        for action in ['cheese','cover','cut','serve']:restored4.locator(f'[data-kitchen-action="{action}"]').tap()
        assert restored4.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).coins',SAVE_KEY)==old['coins']+20
        restored4.get_by_role('button',name='接下一单',exact=True).tap()
        expect(restored4.locator('.kitchen-recipe-name')).to_contain_text('Garden sandwich')
        restored4.reload();restored4.wait_for_load_state('networkidle')
        expect(restored4.locator('[data-kitchen-action="lettuce"]')).to_be_visible()
        context4.close(); context.close(); browser.close()
        assert not errors, errors
    print('PASS: five-tab town hub, eight activity links, categories, mobile selector, direct hashes, reload and v6/v7/v8 partial-progress migrations, high-round classic-to-new cooking')


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(); parser.add_argument('--url',default='http://127.0.0.1:5011/')
    parser.add_argument('--output',type=Path,default=Path(tempfile.gettempdir())/'epartner-word-merge-qa')
    args = parser.parse_args(); args.output.mkdir(parents=True,exist_ok=True)
    run_town(args.url,args.output)
