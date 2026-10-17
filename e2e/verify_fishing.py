"""Catch pictured moving fish by English features, preserve observation and keep listening honest."""
from playwright.sync_api import sync_playwright, expect

SAVE_KEY='epartner-word-merge-v1'
SETS=[['small-yellow','big-blue','small-red'],['big-yellow','small-blue','big-green'],['small-striped','big-red','small-green'],
      ['small-orange','big-orange','small-purple'],['big-purple','small-pink','big-pink'],
      ['small-white','big-white','small-black'],['big-black','small-brown','big-brown'],
      ['big-blue-striped','big-orange-striped','small-red-spotted'],
      ['big-yellow-spotted','small-green-spotted','big-purple-spotted'],
      ['small-red','small-red-spotted','big-red'],['big-blue','big-blue-striped','small-blue'],
      ['small-purple','small-striped','big-purple'],['small-green-spotted','big-green','small-green'],
      ['big-orange-striped','small-orange','big-orange'],['big-purple-spotted','big-purple','small-purple'],
      ['small-yellow','big-yellow-spotted','big-yellow'],['small-white','small-black','small-brown'],
      ['big-pink','big-red','big-orange'],['small-blue','small-green-spotted','small-striped'],
      ['big-yellow-spotted','big-orange-striped','big-blue-striped'],['big-black','small-pink','big-purple-spotted']]


def run_fishing(url,output):
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        for mobile in [False,True]:
            context=browser.new_context(viewport={'width':390 if mobile else 1280,'height':844 if mobile else 900},is_mobile=mobile,has_touch=mobile,reduced_motion='reduce')
            context.add_init_script('''window.__activitySpeech=[];window.SpeechSynthesisUtterance=class {constructor(text){this.text=text}};
              Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},speak(u){window.__activitySpeech.push(u.text)}}});''')
            page=context.new_page();errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.goto(url.split('#')[0]+'#fishing');page.wait_for_load_state('networkidle')
            game=page.get_by_role('region',name='英语钓鱼游戏')
            def state():return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',SAVE_KEY)
            def tap(locator):locator.tap() if mobile else locator.click()
            def catch(fish):tap(game.locator(f'[data-fish="{fish}"]'))
            def mode(name):tap(game.get_by_role('navigation',name='活动难度').get_by_role('button',name=name,exact=True))
            expect(game.locator('.activity-command')).to_contain_text('Catch the small yellow fish.')
            expect(game.locator('.fishing-choice>span:not(.fishing-observed)')).to_have_count(0)
            before=state();catch('big-yellow')
            assert state()['fishing']['caught']==[] and state()['fishing']['misses']==1 and state()['coins']==before['coins']
            catch('small-yellow')
            expect(game.locator('.fishing-cast')).to_have_count(1)
            page.reload();page.wait_for_load_state('networkidle')
            assert state()['fishing']['caught']==['small-yellow']
            expect(game.locator('.activity-command')).to_contain_text('Catch the big blue fish.')
            tap(game.get_by_role('button',name='查看图文提示',exact=True))
            expect(game.locator('.activity-hint')).to_contain_text('大蓝鱼')
            expect(game.locator('.fishing-choice>span:not(.fishing-observed)')).to_have_count(9)
            tap(game.get_by_role('button',name='收起图文提示',exact=True))
            page.reload();page.wait_for_load_state('networkidle')
            assert state()['fishing']['helped'] and not state()['fishing']['hintOpen']
            catch('big-blue');catch('small-red')
            expect(game.get_by_role('button',name='再去钓一轮 →',exact=True)).to_be_visible()
            assert state()['fishing']['assisted']==1 and len(state()['fishing']['collection'])==3
            paid=state();page.reload();page.wait_for_load_state('networkidle')
            assert state()['coins']==paid['coins']
            tap(game.get_by_role('button',name='再去钓一轮 →',exact=True));mode('听力挑战')
            expect(game.locator('.activity-command')).to_have_count(0)
            expect(game.locator('.activity-hint')).to_have_count(0)
            expect(game.locator('.fishing-choice>span:not(.fishing-observed)')).to_have_count(0)
            assert 'big yellow fish' not in game.inner_text()
            assert all('yellow' not in text for text in game.locator('.fishing-choice').evaluate_all('(nodes)=>nodes.map(n=>n.getAttribute("aria-label"))'))
            tap(game.get_by_role('button',name='朗读任务指令',exact=True));tap(game.get_by_role('button',name='朗读任务指令',exact=True))
            assert page.evaluate('window.__activitySpeech')[-2:]==['Catch the big yellow fish.']*2
            catch(SETS[1][0]);page.reload();page.wait_for_load_state('networkidle')
            assert state()['fishing']['mode']=='listening' and state()['fishing']['caught']==['big-yellow']
            for fish in SETS[1][1:]:catch(fish)
            tap(game.get_by_role('button',name='再去钓一轮 →',exact=True))
            assert not state()['fishing']['helped']
            for fish in SETS[2]:catch(fish)
            saved=state()
            assert saved['fishing']['independent']==1 and saved['fishing']['assisted']==2
            assert len(saved['fishing']['collection'])==9
            assert saved['coins']==before['coins']+60 and saved['progress']['xp']==before['progress']['xp']+36
            tap(game.get_by_role('button',name='再去钓一轮 →',exact=True));mode('图文入门')
            for index in range(3,len(SETS)):
                expect(game.locator('.fishing-choice')).to_have_count(9)
                for fish in SETS[index]:expect(game.locator(f'[data-fish="{fish}"]')).to_be_visible()
                if index==9:
                    expect(game.locator('.activity-command')).to_contain_text('small plain red fish')
                    expect(game.locator('[data-fish="small-red-spotted"] .pond-fish-art g[opacity=".7"] circle')).to_have_count(5)
                    page.screenshot(path=str(output/f'fishing-patterns-{mobile}.png'),full_page=True)
                for step,fish in enumerate(SETS[index]):
                    catch(fish)
                    if index in [7,19] and step==0:
                        partial=state()['fishing'];page.reload();page.wait_for_load_state('networkidle')
                        assert state()['fishing']==partial
                        expect(game.locator('.fishing-choice')).to_have_count(9)
                if index<len(SETS)-1:tap(game.get_by_role('button',name='再去钓一轮 →',exact=True))
            final=state()
            assert len(final['fishing']['collection'])==27
            assert final['coins']==before['coins']+21*20
            tap(game.locator('.fishing-collection summary'))
            expect(game.locator('.fishing-collection-grid .is-known')).to_have_count(27)
            tap(game.get_by_role('button',name='再去钓一轮 →',exact=True))
            for width,height in [(320,740),(390,844),(844,390),(1280,900)]:
                page.set_viewport_size({'width':width,'height':height})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),('fishing overflow',width)
                for selector in ['.activity-modes button','.activity-controls button','.fishing-choice']:
                    for bounds in game.locator(selector).evaluate_all('(nodes)=>nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height}))'):
                        assert bounds['w']>=44 and bounds['h']>=44,(selector,width,bounds)
                boxes=game.locator('.fishing-choice').evaluate_all('(nodes)=>nodes.map(n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,r:b.right,b:b.bottom}})')
                for i,box in enumerate(boxes):
                    for other in boxes[i+1:]:
                        assert min(box['r'],other['r'])-max(box['x'],other['x'])<=0.5 or min(box['b'],other['b'])-max(box['y'],other['y'])<=0.5,('overlapping fish touch targets',width,box,other)
                if width<=700:
                    game.locator('[data-fish="small-striped"]').scroll_into_view_if_needed()
                    bounds=game.locator('.activity-prompt').bounding_box()
                    assert bounds and bounds['y']>=0 and bounds['y']+bounds['height']<height,('sticky fishing instruction',width,bounds)
                page.screenshot(path=str(output/f'fishing-{mobile}-{width}.png'),full_page=True)
            assert not errors,errors
            context.close()
        browser.close()
    print('Fishing passed: twenty-seven fish across twenty-one sets, nine nonoverlapping choices, plain/pattern disambiguation, later-set reload, rewards and desktop/touch UI.')
