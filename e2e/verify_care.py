"""Care stories use different tools and retain species friendship plus separate story memories."""
from playwright.sync_api import sync_playwright, expect

SAVE_KEY='epartner-word-merge-v1'
STORIES=[['water','brush','bed'],['towel','water','ball'],['water','brush','bed']]


def run_care(url,output):
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        for mobile in [False,True]:
            context=browser.new_context(viewport={'width':390 if mobile else 1280,'height':844 if mobile else 900},is_mobile=mobile,has_touch=mobile,reduced_motion='reduce')
            context.add_init_script('''
              window.__careSpeech=[];
              window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
              Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},speak(u){window.__careSpeech.push(u.text);window.__lastCareVoice=u;}}});
            ''')
            page=context.new_page();errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(url.split('#')[0]+'#care');page.wait_for_load_state('networkidle')
            game=page.get_by_role('region',name='宠物照料站游戏')
            def state():return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',SAVE_KEY)
            def tap(locator):locator.tap() if mobile else locator.click()
            def tool(name):tap(game.locator(f'[data-care-tool="{name}"]'))
            def action(name):tool(name);tap(game.get_by_role('button',name='照料小动物',exact=True))
            def mode(name):tap(game.get_by_role('navigation',name='活动难度').get_by_role('button',name=name,exact=True))

            expect(game.locator('.activity-command')).to_contain_text("I'm thirsty")
            expect(game.locator('.activity-hint')).to_have_count(0)
            expect(game.locator('.care-tools button>span')).to_have_count(0)
            before=state();action('ball')
            assert state()['care']['step']==0 and state()['care']['mistakes']==1
            assert state()['coins']==before['coins'] and state()['deliveries']==before['deliveries']
            action('water');expect(game.locator('.care-visible-water')).to_be_visible()
            assert state()['care']['step']==1
            page.reload();page.wait_for_load_state('networkidle')
            assert state()['care']['step']==1
            expect(game.locator('.care-visible-water')).to_be_visible()
            expect(game.locator('.activity-command')).to_contain_text('Brush my fur')
            tap(game.get_by_role('button',name='查看图文提示',exact=True))
            expect(game.locator('.activity-hint')).to_contain_text('梳理')
            tap(game.get_by_role('button',name='收起图文提示',exact=True))
            page.reload();page.wait_for_load_state('networkidle')
            assert state()['care']['helped'] and not state()['care']['hintOpen']
            action('brush');expect(game.locator('.care-clean')).to_be_visible()
            action('bed');expect(game.locator('.care-visible-bed')).to_be_visible()
            expect(game.locator('.care-receipt')).to_contain_text('照料完成')
            assert state()['care']['assisted']==1 and state()['care']['friends']==['cat']
            assert state()['coins']==before['coins']+18 and state()['deliveries']==before['deliveries']
            saved=state();page.reload();page.wait_for_load_state('networkidle')
            assert state()['coins']==saved['coins']
            tap(game.get_by_role('button',name='迎接下一位朋友',exact=True))
            expect(game.locator('.care-mud')).to_be_visible()
            mode('听力挑战')
            expect(game.locator('.activity-command')).to_have_count(0)
            expect(game.locator('.activity-hint')).to_have_count(0)
            assert 'My paws are muddy.' not in game.inner_text()
            tap(game.get_by_role('button',name='朗读任务指令',exact=True));tap(game.get_by_role('button',name='朗读任务指令',exact=True))
            assert page.evaluate('window.__careSpeech')[-2:]==['My paws are muddy. Wipe them with the towel.']*2
            page.evaluate('window.__lastCareVoice.onerror({error:"synthesis-unavailable"})')
            expect(game.locator('.activity-speech-notice')).to_contain_text('朗读暂时不可用')
            expect(game.locator('.activity-command')).to_have_count(0)
            action('towel');expect(game.locator('.care-mud')).to_have_count(0)
            for item in STORIES[1][1:]:action(item)
            expect(game.locator('.care-visible-ball')).to_be_visible()
            tap(game.get_by_role('button',name='迎接下一位朋友',exact=True))
            assert state()['care']['mode']=='listening' and not state()['care']['helped']
            action('water');page.reload();page.wait_for_load_state('networkidle')
            assert state()['care']['step']==1 and state()['care']['mode']=='listening'
            for item in STORIES[2][1:]:action(item)
            saved=state()
            assert saved['care']['independent']==1 and saved['care']['assisted']==2
            assert saved['care']['friends']==['cat','dog','rabbit']
            assert saved['coins']==before['coins']+54 and saved['progress']['xp']==before['progress']['xp']+36
            assert saved['deliveries']==before['deliveries'] and saved['version']==9
            assert saved['care']['memories']==['cat','dog','rabbit']
            tap(game.get_by_role('button',name='迎接下一位朋友',exact=True));mode('图文入门')
            expect(game.locator('.activity-hint')).to_be_visible()
            assert game.locator('.care-tools button>span').count()==8
            expect(game.locator('.care-story-title')).to_contain_text('窗边游戏时间')
            action('feather');expect(game.locator('.care-visible-feather')).to_be_visible()
            page.reload();page.wait_for_load_state('networkidle')
            assert state()['care']['step']==1
            expect(game.locator('.care-visible-feather')).to_be_visible()
            action('water');action('blanket')
            expect(game.locator('.care-visible-blanket')).to_be_visible()
            assert state()['care']['memories']==['cat','dog','rabbit','cat-play']
            assert state()['care']['friends']==['cat','dog','rabbit']
            tap(game.get_by_role('button',name='迎接下一位朋友',exact=True))
            expect(game.locator('.care-story-title')).to_contain_text('雨后的门廊')
            for item in ['towel','blanket','bed']:action(item)
            tap(game.get_by_role('button',name='迎接下一位朋友',exact=True));mode('阅读挑战')
            expect(game.locator('.care-tools button>span')).to_have_count(0)
            expect(game.locator('.activity-command')).to_contain_text('explore')
            action('tunnel');expect(game.locator('.care-visible-tunnel')).to_be_visible()
            action('ball');action('water')
            assert state()['care']['memories']==['cat','dog','rabbit','cat-play','dog-rain','rabbit-explore']
            assert state()['coins']==before['coins']+108
            tap(game.locator('.care-memories summary'))
            assert game.locator('.care-memory-done').count()==6
            assert game.locator('.care-memories article').count()==15
            tap(game.get_by_role('button',name='迎接下一位朋友',exact=True));mode('图文入门')
            for width,height in [(320,740),(390,844),(844,390),(1280,900)]:
                page.set_viewport_size({'width':width,'height':height})
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
                for selector in ['.activity-modes button','.activity-controls button','.care-tools button','.care-pet']:
                    for bounds in game.locator(selector).evaluate_all('(nodes)=>nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height}))'):
                        assert bounds['w']>=44 and bounds['h']>=44,(selector,width,bounds)
                if width<=760:
                    game.locator('[data-care-tool="ball"]').scroll_into_view_if_needed()
                    bounds=game.locator('.activity-prompt').bounding_box()
                    assert bounds and bounds['y']>=0 and bounds['y']+bounds['height']<=height,('sticky care instruction',width,bounds)
                page.screenshot(path=str(output/f'care-{mobile}-{width}.png'),full_page=True)
            assert not errors,errors
            context.close()
        browser.close()
    print('Pet care browser tests passed: six varied stories, new feather/blanket/tunnel art, separate friendship/memories, safe retries, modes, save and touch.')
