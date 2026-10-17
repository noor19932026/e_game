"""Walk all eighteen courier routes and three maps on desktop and touch."""
from playwright.sync_api import sync_playwright, expect

SAVE_KEY='epartner-word-merge-v1'
ROUTES=[['pickup','north','north','east','east','north','east','deliver'],
        ['pickup','north','east','east','south','east','east','north','deliver'],
        ['pickup','east','east','north','north','west','north','east','north','east','deliver'],
        ['pickup','north','north','north','east','deliver'],
        ['pickup','north','east','east','south','deliver'],
        ['pickup','east','north','north','east','deliver'],
        ['pickup','east','east','north','deliver'],
        ['pickup','north','north','north','east','deliver'],
        ['pickup','east','east','north','east','east','deliver'],
        ['pickup','east','north','north','west','north','north','deliver'],
        ['pickup','north','north','east','east','east','east','north','north','deliver'],
        ['pickup','east','east','north','east','north','west','deliver'],
        ['pickup','north','north','deliver'],
        ['pickup','north','east','east','south','east','east','deliver'],
        ['pickup','north','east','north','north','north','deliver'],
        ['pickup','east','east','east','north','deliver'],
        ['pickup','east','north','east','east','east','north','deliver'],
        ['pickup','north','east','north','north','north','east','east','east','deliver']]


def run_delivery(url,output):
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        for mobile in [False,True]:
            context=browser.new_context(viewport={'width':390 if mobile else 1280,'height':844 if mobile else 900},is_mobile=mobile,has_touch=mobile,reduced_motion='reduce')
            context.add_init_script('''window.__activitySpeech=[]; window.SpeechSynthesisUtterance=class {constructor(text){this.text=text}};
              Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},speak(u){window.__activitySpeech.push(u.text)}}});''')
            page=context.new_page();errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.goto(url.split('#')[0]+'#delivery');page.wait_for_load_state('networkidle')
            game=page.get_by_role('region',name='小镇送货员游戏')
            def state():return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',SAVE_KEY)
            def tap(locator):locator.tap() if mobile else locator.click()
            def action(name):tap(game.locator(f'[data-delivery-action="{name}"]'))
            def mode(name):tap(game.get_by_role('navigation',name='活动难度').get_by_role('button',name=name,exact=True))
            expect(game.locator('.activity-command')).to_contain_text('Pick up the parcel.')
            before=state();action('deliver');action('north')
            assert state()['delivery']['step']==0 and state()['coins']==before['coins']
            assert state()['delivery']['mistakes']==2
            action('pickup');action('north')
            assert state()['delivery']['x']==0 and state()['delivery']['y']==3
            page.reload();page.wait_for_load_state('networkidle')
            assert state()['delivery']['step']==2 and state()['delivery']['parcel']
            tap(game.get_by_role('button',name='查看图文提示',exact=True))
            expect(game.locator('.activity-hint')).to_contain_text('向北')
            tap(game.get_by_role('button',name='收起图文提示',exact=True))
            page.reload();page.wait_for_load_state('networkidle')
            assert state()['delivery']['helped'] and not state()['delivery']['hintOpen']
            for item in ROUTES[0][2:]:action(item)
            expect(game.locator('.delivery-receipt')).to_be_visible()
            assert state()['delivery']['assisted']==1 and state()['delivery']['stamps']==['park']
            paid=state();page.reload();page.wait_for_load_state('networkidle')
            assert state()['coins']==paid['coins']
            tap(game.get_by_role('button',name='接下一份包裹 →',exact=True))
            mode('听力挑战')
            expect(game.locator('.activity-command')).to_have_count(0)
            expect(game.locator('.activity-hint')).to_have_count(0)
            assert 'Pick up the parcel.' not in game.inner_text()
            tap(game.get_by_role('button',name='朗读任务指令',exact=True))
            tap(game.get_by_role('button',name='朗读任务指令',exact=True))
            assert page.evaluate('window.__activitySpeech')[-2:]==['Pick up the parcel.']*2
            action(ROUTES[1][0]);page.reload();page.wait_for_load_state('networkidle')
            assert state()['delivery']['mode']=='listening' and state()['delivery']['step']==1
            assert 'Go one block north.' not in game.inner_text()
            for item in ROUTES[1][1:]:action(item)
            tap(game.get_by_role('button',name='接下一份包裹 →',exact=True))
            assert not state()['delivery']['helped']
            for item in ROUTES[2]:action(item)
            saved=state()
            assert saved['delivery']['independent']==1 and saved['delivery']['assisted']==2
            assert saved['delivery']['stamps']==['park','bakery','school']
            assert saved['coins']==before['coins']+60 and saved['progress']['xp']==before['progress']['xp']+36
            assert saved['delivery']['x']==3 and saved['delivery']['y']==0
            tap(game.get_by_role('button',name='接下一份包裹 →',exact=True));mode('图文入门')
            expect(game.locator('.activity-hint')).to_be_visible()
            for index in range(3,len(ROUTES)):
                expected_map='town' if index<6 else 'river' if index<12 else 'hill'
                expect(game.locator(f'[data-delivery-map="{expected_map}"]')).to_be_visible()
                for step,item in enumerate(ROUTES[index]):
                    action(item)
                    if index in [8,14] and step==2:
                        partial=state()['delivery'];page.reload();page.wait_for_load_state('networkidle')
                        assert state()['delivery']==partial
                        expect(game.locator(f'[data-delivery-map="{expected_map}"]')).to_be_visible()
                        page.screenshot(path=str(output/f'delivery-{expected_map}-{mobile}.png'),full_page=True)
                assert len(state()['delivery']['stamps'])==index+1
                if index<len(ROUTES)-1:tap(game.get_by_role('button',name='接下一份包裹 →',exact=True))
            final=state()
            assert len(final['delivery']['stamps'])==18
            assert final['coins']==before['coins']+18*20
            tap(game.locator('.delivery-passport summary'))
            expect(game.locator('.delivery-stamp-area')).to_have_count(3)
            expect(game.locator('.delivery-stamps .collected')).to_have_count(18)
            tap(game.get_by_role('button',name='接下一份包裹 →',exact=True))
            expect(game.locator('[data-delivery-map="town"]')).to_be_visible()
            for width,height in [(320,740),(390,844),(844,390),(1280,900)]:
                page.set_viewport_size({'width':width,'height':height})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),('delivery overflow',width)
                for selector in ['.activity-modes button','.activity-controls button','.delivery-direction-pad button','.delivery-package-actions button']:
                    for bounds in game.locator(selector).evaluate_all('(nodes)=>nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height}))'):
                        assert bounds['w']>=44 and bounds['h']>=44,(selector,width,bounds)
                if width<=700:
                    game.locator('[data-delivery-action="deliver"]').scroll_into_view_if_needed()
                    bounds=game.locator('.activity-prompt').bounding_box()
                    assert bounds and bounds['y']>=0 and bounds['y']+bounds['height']<height,('sticky courier instruction',width,bounds)
                page.screenshot(path=str(output/f'delivery-{mobile}-{width}.png'),full_page=True)
            assert not errors,errors
            context.close()
        browser.close()
    print('Courier passed: eighteen routes over three maps, partial routes in new neighborhoods, stamp collection/rewards, hidden listening and desktop/touch UI.')
