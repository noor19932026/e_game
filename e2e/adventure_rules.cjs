const {readFileSync}=require('node:fs')
const path=require('node:path')
const assert=require('node:assert/strict')
const test=require('node:test')
const ts=require('typescript')
const cache=new Map()
function load(name){
  if(cache.has(name))return cache.get(name)
  assert.match(name,/^[a-zA-Z]+$/)
  const source=ts.transpileModule(readFileSync(path.join(__dirname,'../src/features/wordMerge',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
  const module={exports:{}};cache.set(name,module.exports)
  new Function('require','module','exports',source)(id=>{assert.match(id,/^\.\/[a-zA-Z]+$/);return load(id.slice(2))},module,module.exports)
  return module.exports
}
const a=load('adventure')
const host=()=>({adventure:a.newAdventure(),coins:0,progress:{xp:0}})
test('eighteen actual scene adventures have reachable inventories and award each prize exactly once',()=>{
  const g=host()
  assert.ok(a.validAdventure(g.adventure))
  assert.equal(a.adventureScenes.filter(s=>s.kind==='treasure').length,9)
  assert.equal(a.adventureScenes.filter(s=>s.kind==='puzzle').length,9)
  for(const scene of a.adventureScenes){
    assert.equal(a.selectAdventure(g.adventure,scene.id),true)
    assert.ok(a.validAdventure(g.adventure))
    const original=JSON.stringify(g)
    assert.equal(a.interactAdventure(g,scene.steps.at(-1).target),'wrong')
    assert.equal(JSON.stringify(g),original,'cannot skip to final object')
    for(const [i,step] of scene.steps.entries()){
      assert.equal(a.currentAdventureStep(g.adventure),step)
      assert.equal(a.interactAdventure(g,step.target),i===scene.steps.length-1?'complete':step.take?'collected':'changed')
      const session=a.adventureSession(g.adventure)
      if(step.use)assert.ok(!session.inventory.includes(step.use),'tools are actually consumed')
      assert.ok(a.validAdventure(g.adventure),scene.id+' step '+i)
    }
    const rewarded=JSON.stringify(g)
    assert.equal(a.interactAdventure(g,scene.steps.at(-1).target),'finished')
    a.selectAdventure(g.adventure,scene.id)
    assert.equal(JSON.stringify(g),rewarded,'revisiting never resets an adventure')
  }
  assert.equal(g.coins,a.adventureScenes.reduce((sum,s)=>sum+s.coins,0));assert.equal(g.progress.xp,a.adventureScenes.reduce((sum,s)=>sum+s.xp,0))
  assert.equal(g.adventure.independent,a.adventureScenes.length);assert.equal(g.adventure.assisted,0)
})
test('help persists through reload and global mode changes mark every exposed unfinished scene',()=>{
  let g=host()
  a.toggleAdventureHint(g.adventure)
  assert.equal(g.adventure.helped,true)
  g=JSON.parse(JSON.stringify(g))
  assert.ok(a.validAdventure(g.adventure));assert.equal(g.adventure.hintOpen,true)
  a.toggleAdventureHint(g.adventure)
  assert.equal(g.adventure.helped,true,'closing a hint does not undo assistance')
  a.selectAdventure(g.adventure,'class-treasure')
  assert.equal(g.adventure.helped,false)
  a.setAdventureMode(g.adventure,'listening')
  assert.equal(g.adventure.sessions['park-treasure'].helped,true)
  assert.equal(g.adventure.sessions['class-treasure'].helped,true)
  assert.equal(g.adventure.sessions['camp-treasure'].helped,false)
  a.selectAdventure(g.adventure,'park-treasure')
  for(const step of a.activeAdventure(g.adventure).steps)a.interactAdventure(g,step.target)
  assert.equal(g.adventure.assisted,1);assert.equal(g.adventure.independent,0)
  a.selectAdventure(g.adventure,'camp-treasure')
  for(const step of a.activeAdventure(g.adventure).steps)a.interactAdventure(g,step.target)
  assert.equal(g.adventure.assisted,1);assert.equal(g.adventure.independent,1)
  assert.ok(a.validAdventure(g.adventure))
})
test('guide instructions seen before any action count as assisted, hidden objects cannot be collected early',()=>{
  const g=host();a.setAdventureMode(g.adventure,'guide');a.selectAdventure(g.adventure,'camp-map')
  assert.equal(g.adventure.helped,true)
  assert.equal(a.interactAdventure(g,'map'),'wrong')
  assert.equal(a.interactAdventure(g,'tent'),'wrong')
  for(const step of a.activeAdventure(g.adventure).steps)a.interactAdventure(g,step.target)
  assert.equal(g.adventure.assisted,1);assert.ok(a.validAdventure(g.adventure))
  a.setAdventureMode(g.adventure,'reading')
  assert.ok(a.validAdventure(g.adventure),'completed assisted sessions remain valid after switching modes')
})
test('validation rejects skipped tools, duplicate inventories, forged completions and mismatched totals',()=>{
  for(const corrupt of [
    s=>{s.sessions['garden-door'].step=1;s.sessions['garden-door'].exposed=true},
    s=>{s.sessions['park-treasure'].found=['bag','bag']},
    s=>{s.sessions['park-treasure'].complete=true},
    s=>{s.sessions['park-treasure'].inventory=['key']},
    s=>{s.independent=1},
    s=>{s.hintOpen=true},
    s=>{s.selected='unknown'},
  ]){const s=a.newAdventure();corrupt(s);assert.equal(a.validAdventure(s),false)}
})


test('expanded scenes have distinct settings, reachable hidden objects and genuinely consumed puzzle tools',()=>{
  assert.equal(a.adventureScenes.length,18)
  assert.equal(new Set(a.adventureScenes.map(s=>s.id)).size,18)
  assert.ok(new Set(a.adventureScenes.map(s=>s.setting)).size>=7)
  assert.deepEqual(a.adventureScenes.slice(0,6).map(s=>[s.id,s.steps.map(t=>t.target)]),[
    ['park-treasure',['bag','ball','bottle','chest']],['class-treasure',['book','bag','pencil','chest']],['camp-treasure',['lantern','map','boots','chest']],
    ['garden-door',['key','door']],['stream-bridge',['plank','bridge','flag']],['camp-map',['flashlight','tent','map']],
  ])
  for(const scene of a.adventureScenes){
    assert.equal(new Set(scene.objects.map(o=>o.id)).size,scene.objects.length)
    const inventory=new Set()
    scene.steps.forEach((step,index)=>{
      const target=scene.objects.find(o=>o.id===step.target);assert.ok(target,scene.id)
      assert.ok((target.hiddenUntil??0)<=index,'every required object is visible when needed')
      if(step.take)inventory.add(step.target)
      if(step.use){assert.ok(inventory.has(step.use),scene.id+' needs its actual tool first');inventory.delete(step.use)}
    })
    if(scene.kind==='puzzle')assert.ok(scene.steps.some(s=>s.take)&&scene.steps.some(s=>s.use))
  }
})

test('v8 adventure expansion preserves partial inventories, exposed hints and completed rewards',()=>{
  const g=host()
  for(const step of a.activeAdventure(g.adventure).steps)a.interactAdventure(g,step.target)
  a.selectAdventure(g.adventure,'garden-door');a.interactAdventure(g,'key');a.toggleAdventureHint(g.adventure)
  a.selectAdventure(g.adventure,'camp-map');a.setAdventureMode(g.adventure,'listening');a.selectAdventure(g.adventure,'garden-door')
  a.toggleAdventureHint(g.adventure)
  const old=structuredClone(g.adventure);old.sessions=Object.fromEntries(Object.entries(old.sessions).slice(0,6))
  const before=structuredClone(old),upgraded=a.migrateAdventureV8(old)
  assert.deepEqual(old,before,'migration is a copy, not a reset of saved data')
  assert.ok(a.validAdventure(upgraded));assert.equal(upgraded.selected,'garden-door');assert.equal(upgraded.mode,'listening')
  for(const scene of a.adventureScenes.slice(0,6))assert.deepEqual(upgraded.sessions[scene.id],old.sessions[scene.id])
  for(const scene of a.adventureScenes.slice(6))assert.deepEqual(upgraded.sessions[scene.id],a.newAdventure().sessions[scene.id])
  assert.equal(upgraded.independent,old.independent);assert.equal(upgraded.assisted,old.assisted)
  const coins=g.coins;g.adventure=upgraded;a.selectAdventure(g.adventure,'park-treasure');assert.equal(a.interactAdventure(g,'chest'),'finished');assert.equal(g.coins,coins)
  const corrupt=structuredClone(old);delete corrupt.sessions['camp-map'];assert.equal(a.migrateAdventureV8(corrupt),null)
  const forged=structuredClone(old);forged.sessions['garden-door'].inventory=[];assert.equal(a.migrateAdventureV8(forged),null)
  assert.deepEqual(a.migrateAdventureV8(a.newAdventure()),a.newAdventure())
})


test('expanded spatial clues match their actual visible arrangement',()=>{
  const light=a.adventureScenes.find(s=>s.id==='library-light')
  const book=light.objects.find(o=>o.id==='book'),lamp=light.objects.find(o=>o.id==='lamp')
  assert.equal(book.y,lamp.y);assert.ok(book.x<lamp.x-25,'the revealed book sits beside the lamp')
  const lost=a.adventureScenes.find(s=>s.id==='library-lost-things')
  const bag=lost.objects.find(o=>o.id==='bag'),picture=lost.objects.find(o=>o.id==='picture'),cup=lost.objects.find(o=>o.id==='cup')
  assert.equal(bag.y,picture.y);assert.equal(picture.y,cup.y)
  assert.ok(bag.x<picture.x&&picture.x<cup.x,'the picture is between the bag and cup in the same row')
})
