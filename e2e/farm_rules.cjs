const { readFileSync } = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const test = require('node:test')
const ts = require('typescript')
const cache=new Map()
function load(name){
  if(cache.has(name))return cache.get(name)
  const source=ts.transpileModule(readFileSync(path.join(__dirname,'../src/features/wordMerge',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
  const mod={exports:{}};cache.set(name,mod.exports)
  new Function('require','module','exports',source)(id=>{assert.ok(['./activity','./content'].includes(id));return load(id.slice(2))},mod,mod.exports)
  return mod.exports
}
const f=load('farm')
function host(){return {farm:f.newFarm(),coins:7,deliveries:2,progress:{xp:5}}}
function stage(state,tool){
  assert.equal(f.chooseFarmTool(state.farm,tool),true)
  for(let index=0;index<f.currentFarmQuest(state.farm).quantity;index++)assert.equal(f.actFarmPlot(state,index).ok,true)
}
function grow(state){for(const tool of [f.currentFarmQuest(state.farm).crop,'water','sun','basket'])stage(state,tool)}

test('farm uses multiple plots and seed/water/sun/pick actions; mistakes cost no resources and cannot skip growth',()=>{
  const state=host()
  assert.equal(f.validFarm(state.farm),true)
  assert.equal(state.farm.plots.length,3)
  assert.equal(f.nextFarmRound(state.farm),false)
  assert.equal(f.deliverFarm(state).ok,false)
  assert.equal(f.chooseFarmTool(state.farm,'unknown'),false)
  f.chooseFarmTool(state.farm,'tomato');assert.equal(f.actFarmPlot(state,0).ok,false)
  assert.equal(state.farm.plots[0].stage,'empty')
  f.chooseFarmTool(state.farm,'carrot');assert.equal(f.actFarmPlot(state,0).ok,true)
  assert.equal(f.actFarmPlot(state,0).ok,false)
  assert.equal(f.validFarm(state.farm),true)
  state.farm=JSON.parse(JSON.stringify(state.farm))
  assert.equal(state.farm.plots[0].stage,'seed');assert.equal(state.farm.selected,'carrot')
  assert.equal(f.actFarmPlot(state,1).ok,true);assert.equal(state.farm.stage,'water')
  f.chooseFarmTool(state.farm,'sun');assert.equal(f.actFarmPlot(state,0).ok,false)
  assert.equal(state.farm.plots[0].stage,'seed')
  assert.equal(state.coins,7);assert.equal(state.progress.xp,5);assert.equal(state.deliveries,2)
  for(const index of [-1,.5,3,99])assert.equal(f.actFarmPlot(state,index).ok,false)
})

test('8 crops and 18 distinct orders vary quantities and customers; every crop grows and pays exactly once across repeats',()=>{
  const state=host()
  assert.equal(f.farmCrops.length,8);assert.equal(f.farmQuests.length,18)
  assert.equal(new Set(f.farmQuests.map(q=>q.id)).size,18)
  assert.deepEqual([...new Set(f.farmQuests.map(q=>q.quantity))].sort(),[1,2,3])
  assert.ok(new Set(f.farmQuests.map(q=>q.customer)).size>=6)
  assert.deepEqual(f.farmQuests.slice(0,3).map(q=>[q.id,q.quantity]),[['carrot',2],['tomato',3],['sunflower',2]])
  for(let round=1;round<=36;round++){
    const q=f.currentFarmQuest(state.farm)
    assert.equal(q.id,f.farmQuests[(round-1)%18].id)
    assert.match(f.currentFarmCommand(state.farm).english,new RegExp(`Plant (one|two|three) ${q.crop} seeds?\\.`))
    for(const [tool,expected] of [[q.crop,'water'],['water','grow'],['sun','harvest'],['basket','deliver']]){
      assert.equal(f.chooseFarmTool(state.farm,tool),true)
      for(let index=0;index<q.quantity;index++){
        assert.equal(f.actFarmPlot(state,index).reward,0)
        assert.equal(f.validFarm(state.farm),true)
        assert.equal(state.coins,7+(round-1)*24)
      }
      assert.equal(state.farm.stage,expected);assert.equal(state.farm.selected,null)
    }
    assert.equal(state.farm.harvested,q.quantity);assert.equal(state.deliveries,2+round-1)
    assert.deepEqual(f.deliverFarm(state),{ok:true,reward:24})
    assert.equal(state.farm.stage,'complete');assert.equal(state.farm.independent,round)
    assert.equal(state.coins,7+round*24);assert.equal(state.progress.xp,5+round*15);assert.equal(state.deliveries,2+round)
    const saved=JSON.stringify(state)
    assert.equal(f.deliverFarm(state).ok,false);assert.equal(f.actFarmPlot(state,0).ok,false);assert.equal(f.chooseFarmTool(state.farm,q.crop),false)
    assert.equal(JSON.stringify(state),saved);assert.equal(f.validFarm(state.farm),true)
    assert.equal(f.nextFarmRound(state.farm),true);assert.equal(f.validFarm(state.farm),true)
  }
  assert.deepEqual(state.farm.completed,f.farmQuests.map(q=>q.id))
  assert.deepEqual(state.farm.produce,{carrot:12,tomato:8,sunflower:6,strawberry:12,corn:8,pumpkin:6,cucumber:10,pea:10})
})

test('v8 farm migration preserves repeated classic harvests and a partially planted current plot; expansion begins next order',()=>{
  const legacy={...f.newFarm(),round:8,independent:7,helped:true,selected:'tomato',produce:{carrot:6,tomato:6,sunflower:4},completed:['carrot','tomato','sunflower']}
  legacy.plots[0]={crop:'tomato',stage:'seed'};delete legacy.contentFrom
  const before=JSON.stringify(legacy),migrated=f.migrateFarmV8(legacy)
  assert.equal(JSON.stringify(legacy),before);assert.ok(migrated)
  assert.equal(migrated.contentFrom,9);assert.equal(f.currentFarmQuest(migrated).id,'tomato')
  assert.deepEqual(migrated.produce,{carrot:6,tomato:6,sunflower:4,strawberry:0,corn:0,pumpkin:0,cucumber:0,pea:0})
  const state={farm:migrated,coins:37,deliveries:7,progress:{xp:29}}
  f.actFarmPlot(state,1);f.actFarmPlot(state,2)
  for(const tool of ['water','sun','basket'])stage(state,tool)
  assert.equal(f.deliverFarm(state).ok,true);assert.equal(state.coins,61);assert.equal(state.deliveries,8)
  f.nextFarmRound(state.farm);assert.equal(f.currentFarmQuest(state.farm).id,'berry-cup')
  grow(state);f.deliverFarm(state);assert.equal(state.farm.produce.strawberry,3)
  assert.equal(state.farm.produce.tomato,9);assert.equal(f.validFarm(state.farm),true)
  assert.equal(f.migrateFarmV8({...legacy,produce:{carrot:999,tomato:6,sunflower:4}}),null)
  assert.equal(f.migrateFarmV8({...legacy,produce:{carrot:6,tomato:6}}),null)
  const large=f.migrateFarmV8({...f.newFarm(),round:1000000,independent:999999,produce:{carrot:666666,tomato:999999,sunflower:666666},completed:['carrot','tomato','sunflower']})
  assert.ok(large);assert.equal(f.currentFarmQuest(large).id,'carrot')
})

test('farm hint/mode assistance persists across growth and reload; fresh listening quest counts independent',()=>{
  const state=host()
  f.toggleFarmHint(state.farm);f.toggleFarmHint(state.farm)
  state.farm=JSON.parse(JSON.stringify(state.farm))
  assert.equal(state.farm.helped,true)
  grow(state);f.deliverFarm(state);assert.equal(state.farm.assisted,1)
  f.nextFarmRound(state.farm);f.setFarmMode(state.farm,'listening');assert.equal(state.farm.helped,true)
  grow(state);f.deliverFarm(state);f.nextFarmRound(state.farm);assert.equal(state.farm.helped,false)
  grow(state);f.deliverFarm(state)
  assert.equal(state.farm.assisted,2);assert.equal(state.farm.independent,1)
  f.nextFarmRound(state.farm);f.setFarmMode(state.farm,'guide');grow(state);f.deliverFarm(state)
  assert.equal(state.farm.assisted,3);assert.equal(f.validFarm(state.farm),true)
})

test('farm validator rejects impossible crops/stages, premature delivery and invented produce totals',()=>{
  for(const patch of [{round:0},{round:1.5},{round:1000001},{contentFrom:1},{contentFrom:3},{stage:'complete'},{complete:true},{stage:'water'},{stage:'invalid'},{selected:'poison'},{plots:[]},{harvested:1},{independent:1},{hintOpen:true},{produce:{carrot:2,tomato:0,sunflower:0}},{completed:['carrot']},{completed:['berry-cup']},{mistakes:-1}]){
    assert.equal(f.validFarm({...f.newFarm(),...patch}),false,JSON.stringify(patch))
  }
  const state=host();f.chooseFarmTool(state.farm,'carrot');f.actFarmPlot(state,2)
  assert.equal(f.validFarm(state.farm),true)
  const wrong=JSON.parse(JSON.stringify(state.farm));wrong.plots[2].crop='tomato';assert.equal(f.validFarm(wrong),false)
  const wrongStage=JSON.parse(JSON.stringify(state.farm));wrongStage.plots[2].stage='ready';assert.equal(f.validFarm(wrongStage),false)
  const complete=host();grow(complete);f.deliverFarm(complete)
  assert.equal(f.validFarm({...complete.farm,selected:'basket'}),false)
  assert.equal(f.validFarm({...complete.farm,produce:{carrot:200,tomato:0,sunflower:0}}),false)
})
