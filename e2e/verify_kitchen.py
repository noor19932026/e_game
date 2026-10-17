"""Use real kitchen actions, preserve a half-made meal, and keep audio hints honest."""
import re
from playwright.sync_api import sync_playwright, expect

SAVE_KEY = 'epartner-word-merge-v1'
RECIPES = [
    ['bread','egg','cheese','cover','cut','serve'],
    ['apple','banana','strawberry','mix','serve'],
    ['bread','egg','apple','pour-milk','serve'],
    ['bread', 'lettuce', 'tomato', 'cucumber', 'cover', 'cut', 'serve'],
    ['bread', 'toast', 'cheese', 'tomato', 'serve'],
    ['bread', 'toast', 'banana', 'honey', 'serve'],
    ['lettuce', 'tomato', 'cucumber', 'cheese', 'mix', 'serve'],
    ['orange', 'pear', 'strawberry', 'mix', 'serve'],
    ['banana', 'strawberry', 'apple', 'skewer', 'serve'],
    ['lettuce', 'egg', 'tomato', 'wrap', 'cut', 'serve'],
    ['lemon', 'squeeze', 'pour-water', 'strawberry', 'mix', 'serve'],
    ['apple', 'banana', 'pour-milk', 'mix', 'serve'],
]


def run_kitchen(url, output):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for mobile in [False,True]:
            context = browser.new_context(viewport={'width':390 if mobile else 1280,'height':844 if mobile else 900},is_mobile=mobile,has_touch=mobile,reduced_motion='reduce')
            context.add_init_script('''
              window.__kitchenSpeech = [];
              window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
              Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},speak(u){window.__kitchenSpeech.push(u.text);window.__lastKitchenVoice=u;}}});
            ''')
            page=context.new_page(); errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(url.split('#')[0]+'#kitchen'); page.wait_for_load_state('networkidle')
            game=page.get_by_role('region',name='小小厨房游戏')
            def state(): return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',SAVE_KEY)
            def tap(locator): locator.tap() if mobile else locator.click()
            def action(name): tap(game.locator(f'[data-kitchen-action="{name}"]'))
            def mode(name): tap(game.get_by_role('navigation',name='厨房难度').get_by_role('button',name=name,exact=True))

            expect(game.get_by_role('button',name='阅读下厨',exact=True)).to_have_attribute('aria-pressed','true')
            expect(game.locator('.kitchen-english')).to_contain_text('Put the bread')
            expect(game.locator('.kitchen-step-hint')).to_have_count(0)
            expect(game.locator('.kitchen-ingredients button>span')).to_have_count(0)
            before=state(); action('serve'); action('banana')
            after=state()
            assert after['coins']==before['coins'] and after['deliveries']==before['deliveries']
            assert after['kitchen']['step']==0 and after['kitchen']['mistakes']==2
            action('bread'); action('egg')
            page.reload(); page.wait_for_load_state('networkidle')
            assert state()['kitchen']['step']==2
            expect(game.locator('.kitchen-english')).to_contain_text('Add the cheese')
            tap(game.get_by_role('button',name='查看图文提示',exact=True))
            expect(game.locator('.kitchen-step-hint')).to_contain_text('奶酪')
            tap(game.get_by_role('button',name='收起图文提示',exact=True))
            page.reload(); page.wait_for_load_state('networkidle')
            assert state()['kitchen']['helped'] and not state()['kitchen']['hintOpen']
            for item in RECIPES[0][2:]: action(item)
            expect(game.locator('.kitchen-served-dish')).to_have_count(1)
            expect(game.locator('.kitchen-receipt')).to_contain_text('鸡蛋三明治')
            assert state()['coins']==before['coins']+20
            assert state()['kitchen']['assisted']==1 and state()['kitchen']['independent']==0
            assert state()['version']==9
            # A remount/reload never pays again.
            saved=state(); page.reload(); page.wait_for_load_state('networkidle')
            assert state()['coins']==saved['coins'] and state()['deliveries']==saved['deliveries']
            tap(game.get_by_role('button',name='接下一单',exact=True))
            mode('听力下厨')
            expect(game.locator('.kitchen-english')).to_have_count(0)
            expect(game.locator('.kitchen-step-hint')).to_have_count(0)
            assert 'Put the apple' not in game.inner_text()
            tap(game.get_by_role('button',name='朗读厨房指令',exact=True))
            tap(game.get_by_role('button',name='朗读厨房指令',exact=True))
            spoken=page.evaluate('window.__kitchenSpeech')
            assert spoken[-2:]==['Put the apple in the cup.']*2
            page.evaluate('window.__lastKitchenVoice.onerror({error:"interrupted"})')
            assert '朗读暂时不可用' not in game.locator('[role="status"]').inner_text()
            page.evaluate('window.__lastKitchenVoice.onerror({error:"synthesis-unavailable"})')
            expect(game.locator('[role="status"]')).to_contain_text('朗读暂时不可用')
            expect(game.locator('.kitchen-english')).to_have_count(0)
            for item in RECIPES[1]: action(item)
            tap(game.get_by_role('button',name='接下一单',exact=True))
            # New order in the same mode starts without extra help, and survives a partial-save reload.
            assert not state()['kitchen']['helped']
            action('bread'); page.reload(); page.wait_for_load_state('networkidle')
            assert state()['kitchen']['step']==1 and state()['kitchen']['mode']=='listening'
            for item in RECIPES[2][1:]: action(item)
            saved=state(); assert saved['kitchen']['independent']==1 and saved['kitchen']['assisted']==2
            assert len(saved['kitchen']['completed'])==3
            assert saved['coins']==before['coins']+60 and saved['progress']['xp']==before['progress']['xp']+36
            assert saved['deliveries']==before['deliveries']+3
            tap(game.get_by_role('button',name='接下一单',exact=True))
            mode('图文入门')
            expect(game.locator('.kitchen-step-hint')).to_be_visible()
            assert game.locator('.kitchen-ingredients button>span').count()==6
            for width,height in [(320,740),(390,844),(844,390),(1280,900)]:
                page.set_viewport_size({'width':width,'height':height})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
                for selector in ['.kitchen-modes button','.kitchen-ingredients button','.kitchen-tools button','.kitchen-hear','.kitchen-help']:
                    for bounds in game.locator(selector).evaluate_all('(nodes)=>nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height}))'):
                        assert bounds['w']>=44 and bounds['h']>=44,(selector,width,bounds)
                if width <= 700:
                    game.locator('.kitchen-tools button').last.scroll_into_view_if_needed()
                    bounds=game.locator('.kitchen-command').bounding_box()
                    assert bounds and bounds['y']>=0 and bounds['y']+bounds['height']<=height,('sticky instruction',width,bounds)
                page.screenshot(path=str(output/f'kitchen-{mobile}-{width}.png'),full_page=True)
            # Every new recipe uses actual pictured tools and visibly builds its own dish.
            for index, recipe_actions in enumerate(RECIPES[3:],start=4):
                assert state()['kitchen']['round']==index
                dish=game.locator('[data-dish]').first
                expect(dish).to_have_attribute('data-dish-stage','0')
                for step_number,item in enumerate(recipe_actions):
                    action(item)
                    if item!='serve': expect(dish).to_have_attribute('data-dish-stage',str(step_number+1))
                assert len(state()['kitchen']['completed'])==index
                expect(game.locator('.kitchen-served-dish')).to_have_attribute('data-dish-stage',str(len(recipe_actions)))
                page.reload(); page.wait_for_load_state('networkidle')
                assert state()['kitchen']['served']
                if index==11: page.screenshot(path=str(output/f'kitchen-lemon-water-{mobile}.png'),full_page=True)
                if index<12: tap(game.get_by_role('button',name='接下一单',exact=True))
            assert state()['coins']==before['coins']+240
            assert not errors,errors
            context.close()
        browser.close()
    print('Kitchen browser tests passed: ordered cooking, safe retry, dish delivery, hints, modes, save, rewards and mobile.')
