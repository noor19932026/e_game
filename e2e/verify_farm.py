"""Plant multiple plots and grow crops with actions; deliver exact harvests without clock gates."""
from playwright.sync_api import sync_playwright, expect

SAVE_KEY='epartner-word-merge-v1'


def run_farm(url,output):
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        for mobile in [False,True]:
            context=browser.new_context(viewport={'width':390 if mobile else 1280,'height':844 if mobile else 900},is_mobile=mobile,has_touch=mobile,reduced_motion='reduce')
            context.add_init_script('''
              window.__farmSpeech=[];
              window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
              Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},speak(u){window.__farmSpeech.push(u.text);window.__lastFarmVoice=u;}}});
            ''')
            page=context.new_page();errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(url.split('#')[0]+'#farm');page.wait_for_load_state('networkidle')
            game=page.get_by_role('region',name='农场花园游戏')
            def state():return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',SAVE_KEY)
            def tap(locator):locator.tap() if mobile else locator.click()
            def tool(name):tap(game.locator(f'[data-farm-tool="{name}"]'))
            def plot(index):tap(game.locator(f'[data-farm-plot="{index}"]'))
            def stage(name,quantity):
                tool(name)
                for index in range(quantity):plot(index)
            def finish(crop,quantity):
                for name in [crop,'water','sun','basket']:stage(name,quantity)
                tap(game.get_by_role('button',name='把收获送给',exact=False))
            def mode(name):tap(game.get_by_role('navigation',name='活动难度').get_by_role('button',name=name,exact=True))

            expect(game.locator('.activity-command')).to_have_text('Plant two carrot seeds.')
            expect(game.locator('.activity-hint')).to_have_count(0)
            expect(game.locator('.farm-tools button>span')).to_have_count(0)
            assert game.locator('[data-farm-plot]').count()==3
            assert '播种' not in game.locator('.farm-stage-strip').inner_text()
            before=state();tool('tomato');plot(0)
            assert state()['farm']['plots'][0]['stage']=='empty' and state()['farm']['mistakes']==1
            assert state()['coins']==before['coins']
            tool('carrot');plot(0);plot(0)
            assert state()['farm']['mistakes']==2
            page.reload();page.wait_for_load_state('networkidle')
            assert state()['farm']['plots'][0]['stage']=='seed' and state()['farm']['selected']=='carrot'
            plot(1);assert state()['farm']['stage']=='water'
            expect(game.locator('.activity-command')).to_have_text('Water each plant, please.')
            assert state()['farm']['plots'][2]['stage']=='empty'
            tool('sun');plot(0);assert state()['farm']['plots'][0]['stage']=='seed'
            tap(game.get_by_role('button',name='查看图文提示',exact=True))
            expect(game.locator('.activity-hint')).to_contain_text('浇水')
            tap(game.get_by_role('button',name='收起图文提示',exact=True))
            stage('water',2);page.reload();page.wait_for_load_state('networkidle')
            assert state()['farm']['stage']=='grow' and state()['farm']['helped']
            assert state()['farm']['plots'][0]['stage']=='watered'
            stage('sun',2);expect(game.locator('[data-farm-plot="0"]')).to_have_attribute('data-stage','ready')
            stage('basket',2)
            expect(game.get_by_role('region',name='本单收获篮')).to_contain_text('2')
            assert state()['farm']['harvested']==2 and state()['farm']['stage']=='deliver'
            assert state()['coins']==before['coins'] and state()['deliveries']==before['deliveries']
            tap(game.get_by_role('button',name='把收获送给 Mia',exact=True))
            assert state()['farm']['produce']['carrot']==2 and state()['farm']['assisted']==1
            saved=state();page.reload();page.wait_for_load_state('networkidle')
            assert state()['coins']==saved['coins'] and state()['deliveries']==saved['deliveries']
            tap(game.get_by_role('button',name='接下一份花园委托',exact=True));mode('听力挑战')
            expect(game.locator('.activity-command')).to_have_count(0)
            expect(game.locator('.activity-hint')).to_have_count(0)
            assert 'Plant three tomato seeds.' not in game.inner_text()
            tap(game.get_by_role('button',name='朗读任务指令',exact=True));tap(game.get_by_role('button',name='朗读任务指令',exact=True))
            assert page.evaluate('window.__farmSpeech')[-2:]==['Plant three tomato seeds.']*2
            page.evaluate('window.__lastFarmVoice.onerror({error:"synthesis-unavailable"})')
            expect(game.locator('.activity-speech-notice')).to_contain_text('朗读暂时不可用')
            expect(game.locator('.activity-command')).to_have_count(0)
            finish('tomato',3)
            tap(game.get_by_role('button',name='接下一份花园委托',exact=True))
            assert state()['farm']['mode']=='listening' and not state()['farm']['helped']
            stage('sunflower',2);page.reload();page.wait_for_load_state('networkidle')
            assert state()['farm']['stage']=='water' and state()['farm']['mode']=='listening'
            for name in ['water','sun','basket']:stage(name,2)
            tap(game.get_by_role('button',name='把收获送给 Nora',exact=True))
            saved=state()
            assert saved['farm']['independent']==1 and saved['farm']['assisted']==2
            assert saved['farm']['completed']==['carrot','tomato','sunflower']
            assert saved['farm']['produce']=={'carrot':2,'tomato':3,'sunflower':2,'strawberry':0,'corn':0,'pumpkin':0,'cucumber':0,'pea':0}
            assert saved['coins']==before['coins']+72 and saved['progress']['xp']==before['progress']['xp']+45
            assert saved['deliveries']==before['deliveries']+3 and saved['version']==9
            tap(game.get_by_role('button',name='接下一份花园委托',exact=True));mode('图文入门')
            expect(game.locator('.activity-hint')).to_be_visible()
            assert game.locator('.farm-tools button>span').count()==11
            assert game.locator('.farm-collection article').count()==8
            expect(game.locator('.activity-command')).to_have_text('Plant three strawberry seeds.')
            finish('strawberry',3)
            assert state()['farm']['produce']['strawberry']==3
            tap(game.get_by_role('button',name='接下一份花园委托',exact=True));mode('阅读挑战')
            expect(game.locator('.activity-command')).to_have_text('Plant one corn seed.')
            stage('corn',1)
            assert state()['farm']['plots'][1]['stage']=='empty' and state()['farm']['plots'][2]['stage']=='empty'
            for name in ['water','sun','basket']:stage(name,1)
            expect(game.locator('.activity-command')).to_have_text('One ear of corn for my lunch, please.')
            expect(game.locator('.farm-basket-produce .farm-art')).to_be_visible()
            tap(game.get_by_role('button',name='把收获送给 Ben',exact=True))
            assert state()['farm']['produce']['corn']==1
            tap(game.get_by_role('button',name='接下一份花园委托',exact=True))
            finish('pumpkin',2)
            tap(game.get_by_role('button',name='接下一份花园委托',exact=True))
            finish('cucumber',3)
            tap(game.get_by_role('button',name='接下一份花园委托',exact=True))
            stage('pea',2);page.reload();page.wait_for_load_state('networkidle')
            assert state()['farm']['stage']=='water'
            for name in ['water','sun','basket']:stage(name,2)
            tap(game.get_by_role('button',name='把收获送给 Ruby',exact=True))
            assert state()['farm']['produce']=={'carrot':2,'tomato':3,'sunflower':2,'strawberry':3,'corn':1,'pumpkin':2,'cucumber':3,'pea':2}
            assert len(state()['farm']['completed'])==8
            assert game.locator('.farm-crop-known').count()==8
            assert state()['coins']==before['coins']+192
            tap(game.get_by_role('button',name='接下一份花园委托',exact=True));mode('图文入门')
            expect(game.locator('.activity-command')).to_have_text('Plant one sunflower seed.')
            for width,height in [(320,740),(390,844),(844,390),(1280,900)]:
                page.set_viewport_size({'width':width,'height':height})
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
                for selector in ['.activity-modes button','.activity-controls button','.farm-tools button','.farm-plots button']:
                    for bounds in game.locator(selector).evaluate_all('(nodes)=>nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height}))'):
                        assert bounds['w']>=44 and bounds['h']>=44,(selector,width,bounds)
                if width<=760:
                    game.locator('[data-farm-tool="basket"]').scroll_into_view_if_needed()
                    bounds=game.locator('.activity-prompt').bounding_box()
                    assert bounds and bounds['y']>=0 and bounds['y']+bounds['height']<=height,('sticky farm instruction',width,bounds)
                page.screenshot(path=str(output/f'farm-{mobile}-{width}.png'),full_page=True)
            assert not errors,errors
            context.close()
        browser.close()
    print('Farm browser tests passed: eight crops, one/two/three quantities, later orders/customer requests, visible growth, safe retry, save, rewards and touch.')
