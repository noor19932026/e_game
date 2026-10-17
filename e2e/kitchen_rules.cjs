const { readFileSync } = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const test = require('node:test')
const ts = require('typescript')
const cache=new Map()
function load(name) {
  if(cache.has(name)) return cache.get(name)
  const source=ts.transpileModule(readFileSync(path.join(__dirname,'../src/features/wordMerge',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
  const mod={exports:{}}
  new Function('require','module','exports',source)(id=>load(id.slice(2)),mod,mod.exports)
  cache.set(name,mod.exports);return mod.exports
}
const kitchen=load('kitchen')
function host() { return {kitchen:kitchen.newKitchen(),coins:7,deliveries:2,progress:{xp:5}} }
function finish(state) { for (const step of kitchen.currentRecipe(state.kitchen).steps) assert.equal(kitchen.actKitchen(state,step.action).ok,true) }

test('kitchen requires real ordered ingredient/tool actions; mistakes never consume or pay',() => {
  const state = host()
  assert.equal(kitchen.validKitchen(state.kitchen),true)
  for (const wrong of ['serve','cut','banana','invalid']) {
    assert.deepEqual(kitchen.actKitchen(state,wrong),{ok:false,served:false,reward:0})
    assert.equal(state.kitchen.step,0); assert.equal(state.coins,7); assert.equal(state.deliveries,2); assert.equal(state.progress.xp,5)
  }
  assert.equal(state.kitchen.mistakes,4)
  assert.equal(kitchen.nextKitchenRound(state.kitchen),false)
  assert.equal(kitchen.actKitchen(state,'bread').ok,true)
  assert.equal(kitchen.actKitchen(state,'bread').ok,false)
  assert.equal(state.kitchen.step,1)
  assert.equal(kitchen.validKitchen(JSON.parse(JSON.stringify(state.kitchen))),true)
})
test('all twelve kitchen recipes can be made, collected and served once per round',() => {
  const state = host()
  for (let round=1;round<=kitchen.kitchenRecipes.length;round++) {
    assert.equal(state.kitchen.round,round)
    const recipe = kitchen.currentRecipe(state.kitchen)
    for (const step of recipe.steps.slice(0,-1)) {
      assert.equal(kitchen.actKitchen(state,step.action).reward,0)
      assert.equal(state.coins,7+(round-1)*20)
    }
    assert.deepEqual(kitchen.actKitchen(state,'serve'),{ok:true,served:true,reward:20})
    const completed = JSON.stringify(state)
    for (const action of ['serve','bread','mix']) assert.equal(kitchen.actKitchen(state,action).ok,false)
    assert.equal(JSON.stringify(state),completed)
    assert.equal(state.coins,7+round*20); assert.equal(state.progress.xp,5+round*12); assert.equal(state.deliveries,2+round)
    assert.equal(kitchen.validKitchen(state.kitchen),true)
    assert.equal(state.kitchen.independent,round)
    assert.equal(kitchen.nextKitchenRound(state.kitchen),true)
    assert.equal(kitchen.validKitchen(state.kitchen),true)
  }
  assert.deepEqual(state.kitchen.completed,kitchen.kitchenRecipes.map(r=>r.id))
})
test('help and mode changes remain assisted across serialization; next order starts honestly',() => {
  const state = host()
  kitchen.toggleKitchenHint(state.kitchen); kitchen.toggleKitchenHint(state.kitchen)
  assert.equal(state.kitchen.helped,true); assert.equal(state.kitchen.hintOpen,false)
  state.kitchen = JSON.parse(JSON.stringify(state.kitchen))
  finish(state); assert.equal(state.kitchen.assisted,1); assert.equal(state.kitchen.independent,0)
  kitchen.nextKitchenRound(state.kitchen)
  assert.equal(state.kitchen.helped,false)
  kitchen.setKitchenMode(state.kitchen,'listening')
  assert.equal(state.kitchen.helped,true)
  finish(state); kitchen.nextKitchenRound(state.kitchen)
  assert.equal(state.kitchen.mode,'listening'); assert.equal(state.kitchen.helped,false)
  finish(state); assert.equal(state.kitchen.independent,1); assert.equal(state.kitchen.assisted,2)
  kitchen.setKitchenMode(state.kitchen,'guide'); kitchen.nextKitchenRound(state.kitchen)
  assert.equal(state.kitchen.helped,true)
  finish(state); assert.equal(state.kitchen.assisted,3)
  assert.equal(kitchen.validKitchen(state.kitchen),true)
})
test('kitchen save validator rejects impossible progress and invented collections',() => {
  for (const patch of [{step:6},{served:true},{round:0},{round:1.5},{round:1000001},{step:-1},{assisted:1},{mistakes:-1},{mode:'cheat'},{completed:['sandwich']},{hintOpen:true}]) {
    assert.equal(kitchen.validKitchen({...kitchen.newKitchen(),...patch}),false,JSON.stringify(patch))
  }
  const state = host(); finish(state)
  assert.equal(kitchen.validKitchen({...state.kitchen,completed:['sandwich','sandwich']}),false)
  assert.equal(kitchen.validKitchen({...state.kitchen,completed:['breakfast']}),false)
})

test('expanded recipes are distinct, all steps have tools, and shelves stay bounded',()=>{
  assert.equal(kitchen.kitchenRecipes.length,12)
  assert.equal(new Set(kitchen.kitchenRecipes.map(r=>r.steps.map(s=>s.action).join(','))).size,12)
  const state=host()
  for(const recipe of kitchen.kitchenRecipes) {
    assert.equal(kitchen.currentRecipe(state.kitchen).id,recipe.id)
    const choices=kitchen.kitchenChoices(state.kitchen).map(a=>a.id)
    assert.ok(choices.length<=13)
    for(const step of recipe.steps) assert.ok(step.action==='serve'||choices.includes(step.action),step.action)
    finish(state);assert.equal(kitchen.validKitchen(state.kitchen),true);kitchen.nextKitchenRound(state.kitchen)
  }
})
test('v8 high-round cooking keeps the half-made legacy recipe then enters new recipes',()=>{
  for(const round of [4,5,6,13,1000000]) {
    const old={...kitchen.newKitchen(),round,independent:round-1,completed:['sandwich','fruit-cup','breakfast']}
    delete old.contentFrom
    const k=kitchen.migrateKitchenV8(old)
    assert.ok(k);assert.equal(k.contentFrom,round+1)
    assert.equal(kitchen.currentRecipe(k).id,kitchen.kitchenRecipes[(round-1)%3].id)
    const state={...host(),kitchen:k};kitchen.actKitchen(state,kitchen.currentKitchenStep(k).action)
    assert.equal(kitchen.validKitchen(k),true)
    finishRemaining(state)
    if(round<1000000) {kitchen.nextKitchenRound(k);assert.equal(kitchen.currentRecipe(k).id,'veggie-sandwich');assert.equal(kitchen.validKitchen(k),true)}
  }
  function finishRemaining(state) {while(!state.kitchen.served) assert.equal(kitchen.actKitchen(state,kitchen.currentKitchenStep(state.kitchen).action).ok,true)}
})
