"""Tap a pictured object, then a real room location; verify honest help and saved rooms."""
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

SAVE_KEY = 'epartner-word-merge-v1'
CHAPTERS = {
    'welcome': [('book','desk'),('bear','box'),('shoes','bed'),('bag','side')],
    'school': [('pen','desk'),('book','shelf'),('ball','box'),('hat','basket')],
    'evening': [('shirt','basket'),('lamp','desk'),('plant','shelf'),('blanket','box')],
    'rainy': [('coat','hook'),('umbrella','side'),('socks','basket'),('blanket','bedtop')],
    'wash': [('toothbrush','basket'),('cup','desk'),('towel','hook'),('clock','shelf')],
    'breakfast': [('plate','desk'),('spoon','basket'),('bowl','shelf'),('flower','side')],
    'creative': [('crayons','desk'),('picture','shelf'),('book','side'),('shirt','hook')],
    'playtime': [('robot','shelf'),('car','box'),('ball','bed'),('pillow','bedtop')],
    'garden': [('wateringcan','side'),('plant','shelf'),('flower','desk'),('hat','hook')],
}


def run_room(url, output):
    output = Path(output); output.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for mobile in [False, True]:
            context = browser.new_context(viewport={'width':390 if mobile else 1280,'height':844 if mobile else 900},is_mobile=mobile,has_touch=mobile,reduced_motion='reduce')
            context.add_init_script('''
              window.__spoken = [];
              window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
              Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
                cancel(){}, speak(utterance){window.__spoken.push(utterance.text); window.__lastUtterance=utterance;}
              }});
            ''')
            page = context.new_page(); errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.goto(url.split('#')[0]+'#room');page.wait_for_load_state('networkidle')
            game=page.get_by_role('region',name='整理小屋游戏')
            def activate(locator):
                if mobile: locator.tap()
                else: locator.click()
            def state(): return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',SAVE_KEY)
            def session(chapter='welcome'): return state()['room']['sessions'][chapter]
            def choose(item): activate(game.locator(f'[data-room-item="{item}"]'))
            def place(destination): activate(game.locator(f'[data-destination="{destination}"]'))
            def mode(name): activate(game.get_by_role('navigation',name='整理难度').get_by_role('button',name=name,exact=True))
            def assert_audio():
                expect(game.locator('.tidy-request')).to_have_count(0)
                expect(game.locator('.tidy-hint')).to_have_count(0)
                expect(game.locator('.tidy-destination small')).to_have_count(0)
                expect(game.locator('.tidy-items button>span')).to_have_count(0)
                assert 'Put the' not in game.inner_text()

            expect(game.get_by_role('button',name='阅读整理',exact=True)).to_have_attribute('aria-pressed','true')
            assert game.get_by_role('combobox',name='选择小屋章节').locator('option[value="school"]').is_disabled()
            expect(game.locator('.tidy-request')).to_have_text('Put the book on the desk.')
            expect(game.locator('[data-room-item]')).to_have_count(0)
            activate(game.get_by_role('button',name='打开搬家纸箱',exact=True))
            expect(game.locator('[data-room-item]')).to_have_count(6)
            page.screenshot(path=str(output/f'room-unpacked-{"touch" if mobile else "desktop"}.png'),full_page=True)
            snapshot=state()
            # Wrong item and wrong location both keep all objects and allow a new tap.
            choose('hat');place('desk')
            expect(game.locator('[role="status"]')).to_contain_text('不会扣分')
            assert session()['placed']==[] and state()['coins']==snapshot['coins']
            choose('book');place('bed')
            assert session()['selected']=='book' and session()['placed']==[]
            page.reload();page.wait_for_load_state('networkidle')
            expect(game.locator('[data-room-item="book"]')).to_have_attribute('aria-pressed','true')
            place('desk')
            expect(game.locator('[data-destination="desk"] .room-item-art')).to_have_count(1)
            expect(game.locator('[data-room-item="book"]')).to_have_count(0)
            assert session()['independent']==1
            # Explicit help and its transcript survive reload; hiding it never clears assisted status.
            activate(game.get_by_role('button',name='查看图文提示',exact=True))
            expect(game.locator('.tidy-hint')).to_contain_text('玩具熊')
            page.reload();page.wait_for_load_state('networkidle')
            expect(game.locator('.tidy-hint')).to_contain_text('玩具熊')
            activate(game.get_by_role('button',name='收起图文提示',exact=True))
            choose('bear');place('box')
            assert session()['assisted']==1 and session()['independent']==1
            # Audio hides target text/pictures until help is explicitly opened.
            mode('听力整理');assert_audio()
            activate(game.get_by_role('button',name='听整理指令',exact=True))
            assert page.evaluate('window.__spoken.at(-1)')=='Put the shoes under the bed.'
            page.evaluate('window.__lastUtterance.onerror({error:"interrupted"})')
            assert '朗读暂时不可用' not in game.locator('[role="status"]').inner_text()
            page.evaluate('window.__lastUtterance.onerror({error:"synthesis-unavailable"})')
            expect(game.locator('[role="status"]')).to_contain_text('朗读暂时不可用')
            assert_audio()
            choose('shoes');page.reload();page.wait_for_load_state('networkidle');assert_audio()
            assert session()['selected']=='shoes' and session()['helped']
            place('bed');assert session()['assisted']==2
            choose('bag');place('side')
            expect(game.get_by_role('region',name='小屋布置完成')).to_be_visible()
            assert session()['independent']==2 and session()['assisted']==2
            after=state()
            assert after['coins']==snapshot['coins']+30 and after['progress']['xp']==snapshot['progress']['xp']+16
            assert after['deliveries']==snapshot['deliveries']
            assert len(after['room']['sessions']['welcome']['placed'])==4
            # Re-entering/reloading a finished room never grants its reward twice.
            page.reload();page.wait_for_load_state('networkidle')
            assert state()['coins']==after['coins']
            expect(game.locator('[data-destination] .room-item-art')).to_have_count(4)
            for destination in CHAPTERS['welcome']:
                expect(game.locator(f'[data-destination="{destination[1]}"]')).to_be_disabled()
            # Every actual arrangement, with visible objects left where we put them.
            for chapter in list(CHAPTERS)[1:]:
                game.get_by_role('combobox',name='选择小屋章节').select_option(chapter)
                if chapter=='school':
                    # Reading is exposed before unpacking: a completed-room mode-switch
                    # detour must not erase this unfinished task's assistance flag.
                    assert not session('school')['unpacked']
                    game.get_by_role('combobox',name='选择小屋章节').select_option('welcome')
                    mode('阅读整理')
                    game.get_by_role('combobox',name='选择小屋章节').select_option('school')
                    assert session('school')['helped']
                else:
                    mode('图文入门')
                    expect(game.locator('.tidy-hint')).to_be_visible()
                activate(game.get_by_role('button',name='打开搬家纸箱',exact=True))
                before=state()
                for item,destination in CHAPTERS[chapter]: choose(item);place(destination)
                expect(game.get_by_role('region',name='小屋布置完成')).to_be_visible()
                assert state()['coins']==before['coins']+30
                assert state()['progress']['xp']==before['progress']['xp']+16
                expect(game.locator('[data-destination] .room-item-art')).to_have_count(4)
                assert session(chapter)['rewarded']
            expect(game.get_by_role('region',name='我的小屋纪念章')).to_contain_text(f'{len(CHAPTERS)} / {len(CHAPTERS)}')
            assert session('school')['assisted']==1 and session('school')['independent']==3
            assert session('evening')['assisted']==4
            collection=state()['room'];page.reload();page.wait_for_load_state('networkidle')
            assert state()['room']==collection
            for width,height in [(320,740),(390,844),(768,1024),(844,390)]:
                page.set_viewport_size({'width':width,'height':height})
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
                for control in game.locator('button:visible, select:visible').all():
                    box=control.bounding_box()
                    assert box['width']>=43.9 and box['height']>=43.9,(width,control.get_attribute('class'),box)
                locations=[(b.get_attribute('data-destination'),b.bounding_box()) for b in game.locator('[data-destination]').all()]
                for index,(name,box) in enumerate(locations):
                    for other_name,other in locations[index+1:]:
                        overlap_x=min(box['x']+box['width'],other['x']+other['width'])-max(box['x'],other['x'])
                        overlap_y=min(box['y']+box['height'],other['y']+other['height'])-max(box['y'],other['y'])
                        assert not(overlap_x>1 and overlap_y>1),(width,name,other_name,overlap_x,overlap_y)
                page.screenshot(path=str(output/f'room-complete-{width}-{"touch" if mobile else "desktop"}.png'),full_page=True)
            assert not errors,errors
            context.close()
        browser.close()
    print('PASS: room unpacking, actual item/location taps, retry, reading/audio/help, honest saved assistance, 9 room collections, once-only shared rewards, reload and mobile touch')


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://127.0.0.1:5011/')
    parser.add_argument('--output',type=Path,default=Path(tempfile.gettempdir())/'epartner-word-merge-qa')
    args=parser.parse_args();run_room(args.url,args.output)
