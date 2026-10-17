const { readFileSync } = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const test = require('node:test')
const ts = require('typescript')
const cache=new Map()
function load(name) {
  if(cache.has(name))return cache.get(name)
  const source=ts.transpileModule(readFileSync(path.join(__dirname,'../src/features/wordMerge',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
  const mod={exports:{}};cache.set(name,mod.exports)
  new Function('require','module','exports',source)(id=>{assert.ok(['./activity','./content'].includes(id));return load(id.slice(2))},mod,mod.exports)
  return mod.exports
}
const c=load('care')
function host(){return {care:c.newCare(),coins:7,deliveries:2,progress:{xp:5}}}
function step(state,tool) { assert.equal(c.chooseCareTool(state.care,tool),true);return c.actCare(state) }
function finish(state){for(const need of c.currentCareStory(state.care).steps.slice(state.care.step))assert.equal(step(state,need.tool).ok,true)}

test('care needs a selected appropriate tool and a real action on the pet; safe errors preserve progress',()=>{
  const state=host()
  assert.equal(c.validCare(state.care),true)
  assert.equal(c.nextCareRound(state.care),false)
  assert.equal(c.chooseCareTool(state.care,'unknown'),false)
  assert.equal(c.actCare(state).ok,false)
  assert.equal(step(state,'ball').ok,false)
  assert.equal(state.care.step,0);assert.equal(state.care.mistakes,2)
  assert.equal(state.coins,7);assert.equal(state.progress.xp,5);assert.equal(state.deliveries,2)
  assert.equal(step(state,'water').ok,true)
  assert.equal(state.care.step,1);assert.equal(state.care.selected,null)
  state.care=JSON.parse(JSON.stringify(state.care))
  assert.equal(c.validCare(state.care),true);assert.equal(c.currentCareStep(state.care).tool,'brush')
})

test('15 pet stories vary needs and tool sequences; animal friendship and story memories remain separate with one reward per visit',()=>{
  const state=host()
  assert.equal(c.careStories.length,15)
  assert.equal(c.careTools.length,8)
  assert.equal(new Set(c.careStories.map(s=>s.id)).size,15)
  assert.equal(new Set(c.careStories.map(s=>s.steps.map(n=>n.tool).join(','))).size,14)
  assert.deepEqual(c.careStories.slice(0,3).map(s=>[s.id,s.steps.map(n=>n.tool)]),[['cat',['water','brush','bed']],['dog',['towel','water','ball']],['rabbit',['water','brush','bed']]])
  for(const story of c.careStories){
    assert.ok(story.steps.length>=3&&story.steps.length<=4)
    assert.ok(['cat','dog','rabbit'].includes(story.animal))
    for(const need of story.steps){
      assert.ok(c.careTools.some(t=>t.id===need.tool))
      assert.ok(need.english.length>15&&need.chinese.length>5)
    }
  }
  for(let round=1;round<=30;round++){
    assert.equal(c.currentCareStory(state.care).id,c.careStories[(round-1)%15].id)
    for(const need of c.currentCareStory(state.care).steps){
      const result=step(state,need.tool)
      assert.equal(result.ok,true);assert.equal(c.validCare(state.care),true)
      assert.equal(result.reward,state.care.complete?18:0)
    }
    assert.equal(state.coins,7+round*18);assert.equal(state.progress.xp,5+round*12);assert.equal(state.deliveries,2)
    assert.equal(state.care.independent,round)
    const saved=JSON.stringify(state)
    assert.equal(c.actCare(state).ok,false);assert.equal(c.chooseCareTool(state.care,'water'),false)
    assert.equal(JSON.stringify(state),saved)
    assert.equal(c.nextCareRound(state.care),true);assert.equal(c.validCare(state.care),true)
  }
  assert.deepEqual(state.care.friends,['cat','dog','rabbit'])
  assert.deepEqual(state.care.memories,c.careStories.map(s=>s.id))
})

test('v8 care migration preserves a high-round partial classic story and all past friendship without awarding new stories',()=>{
  const legacy={...c.newCare(),round:8,step:1,independent:7,friends:['cat','dog','rabbit'],helped:true}
  delete legacy.contentFrom;delete legacy.memories
  const before=JSON.stringify(legacy),migrated=c.migrateCareV8(legacy)
  assert.equal(JSON.stringify(legacy),before)
  assert.ok(migrated);assert.equal(migrated.contentFrom,9)
  assert.equal(c.currentCareStory(migrated).id,'dog');assert.equal(c.currentCareStep(migrated).tool,'water')
  assert.deepEqual(migrated.memories,['cat','dog','rabbit'])
  const state={care:migrated,coins:37,progress:{xp:29}}
  finish(state);assert.equal(state.coins,55);assert.equal(state.care.independent,7);assert.equal(state.care.assisted,1)
  assert.deepEqual(state.care.memories,['cat','dog','rabbit'])
  c.nextCareRound(state.care);assert.equal(c.currentCareStory(state.care).id,'cat-play')
  finish(state);assert.equal(state.care.memories.at(-1),'cat-play');assert.equal(c.validCare(state.care),true)
  assert.equal(c.migrateCareV8({...legacy,friends:['cat']}),null)
  assert.equal(c.migrateCareV8({...legacy,step:4}),null)
  const large=c.migrateCareV8({...legacy,round:1000000,step:0,independent:999999})
  assert.ok(large);assert.equal(c.currentCareStory(large).id,'cat')
})

test('care help cannot be erased by hiding, reloading, or changing difficulty; next visit starts honestly',()=>{
  const state=host()
  c.toggleCareHint(state.care);c.toggleCareHint(state.care)
  state.care=JSON.parse(JSON.stringify(state.care))
  assert.equal(state.care.helped,true);assert.equal(state.care.hintOpen,false)
  finish(state);assert.equal(state.care.assisted,1);assert.equal(state.care.independent,0)
  c.nextCareRound(state.care);assert.equal(state.care.helped,false)
  c.setCareMode(state.care,'listening');assert.equal(state.care.helped,true)
  finish(state);c.nextCareRound(state.care);assert.equal(state.care.helped,false)
  finish(state);assert.equal(state.care.independent,1);assert.equal(state.care.assisted,2)
  c.nextCareRound(state.care);c.setCareMode(state.care,'guide');finish(state)
  assert.equal(state.care.assisted,3);assert.equal(c.validCare(state.care),true)
})

test('care validator rejects impossible stages, forged friendship and invalid counters',()=>{
  for(const patch of [{round:0},{round:1.5},{round:1000001},{contentFrom:1},{contentFrom:3},{step:3},{step:-1},{complete:true},{friends:['cat']},{friends:['unknown']},{memories:['cat-play']},{memories:['cat','cat']},{independent:1},{mode:'unknown'},{hintOpen:true},{selected:'poison'},{mistakes:-1}]){
    assert.equal(c.validCare({...c.newCare(),...patch}),false,JSON.stringify(patch))
  }
  const state=host();finish(state)
  assert.equal(c.validCare({...state.care,friends:['dog']}),false)
  assert.equal(c.validCare({...state.care,selected:'water'}),false)
  assert.equal(c.validCare({...state.care,friends:['cat','cat']}),false)
})
