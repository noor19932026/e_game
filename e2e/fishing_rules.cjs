const {readFileSync}=require('node:fs')
const path=require('node:path')
const ts=require('typescript')
const test=require('node:test')
const assert=require('node:assert/strict')
const cache=new Map()
function load(name){
  if(cache.has(name))return cache.get(name)
  const source=ts.transpileModule(readFileSync(path.join(__dirname,'../src/features/wordMerge',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
  const module={exports:{}};cache.set(name,module.exports)
  new Function('require','module','exports',source)(id=>{if(!['./activity','./content'].includes(id))throw Error(id);return load(id.slice(2))},module,module.exports)
  return module.exports
}
const f=load('fishing'),a=load('activity')
const host=()=>({fishing:f.newFishing(),coins:4,progress:{xp:5}})
test('fishing uses distinct color/size/pattern targets, observes nine fish across three sets and rewards complete sets only',()=>{
  const h=host(),s=h.fishing
  assert.equal(new Set(f.pondFish.map(fish=>fish.english)).size,27)
  assert.equal(new Set(f.fishingSets.slice(0,3).flat()).size,9)
  assert.equal(f.validFishing(s),true)
  for(let round=0;round<3;round++){
    const coins=h.coins
    assert.equal(f.nextFishingRound(s),false)
    assert.equal(f.catchFish(h,'not-a-fish').ok,false);assert.equal(s.caught.length,0);assert.equal(h.coins,coins)
    for(const [i,id] of f.currentFishingSet(s).entries()){
      assert.equal(f.currentFishingTarget(s).id,id)
      assert.ok(f.fishingCommand(s).english.includes(f.pondFishById[id].english))
      const result=f.catchFish(h,id)
      assert.equal(result.ok,true);assert.equal(result.completed,i===2)
      assert.equal(h.coins,coins+(i===2?20:0))
      assert.equal(f.validFishing(JSON.parse(JSON.stringify(s))),true)
      assert.equal(f.catchFish(h,id).ok,false)
      assert.equal(s.caught.length,i+1)
    }
    assert.equal(s.independent,round+1)
    assert.equal(s.collection.length,(round+1)*3)
    for(const fish of f.pondFish)assert.equal(f.catchFish(h,fish.id).ok,false)
    assert.equal(h.coins,coins+20)
    assert.ok(f.nextFishingRound(s))
  }
  assert.equal(h.coins,64);assert.equal(h.progress.xp,41);assert.equal(s.collection.length,9)
  // The next round introduces three new fish instead of repeating the first set.
  for(const id of f.currentFishingSet(s))f.catchFish(h,id)
  assert.equal(s.collection.length,12);assert.equal(f.validFishing(s),true)
})

test('twenty-one fishing lessons cover twenty-seven distinct fish without crowded or ambiguous ponds',()=>{
  assert.equal(f.fishingSets.length,21);assert.equal(f.pondFish.length,27)
  assert.equal(new Set(f.pondFish.map(fish=>fish.id)).size,27)
  assert.equal(new Set(f.pondFish.map(fish=>`${fish.colorName}/${fish.size}/${!!fish.striped}/${!!fish.spotted}`)).size,27)
  assert.equal(new Set(f.pondFish.map(fish=>fish.colorName)).size,10)
  assert.equal(new Set(f.fishingSets.map(set=>[...set].sort().join('/'))).size,21)
  const h=host(),s=h.fishing,orders=[]
  for(let n=0;n<21;n++){
    const choices=f.visiblePondFish(s),ids=choices.map(fish=>fish.id),targets=f.currentFishingSet(s)
    orders.push(ids.join('/'))
    assert.equal(choices.length,9);assert.equal(new Set(ids).size,9)
    assert.deepEqual(f.visiblePondFish(JSON.parse(JSON.stringify(s))).map(fish=>fish.id),ids)
    assert.ok(targets.every(id=>ids.includes(id)));assert.equal(new Set(targets).size,3)
    const descriptions=choices.map(fish=>f.fishingDescription(s,fish).english)
    assert.equal(new Set(descriptions).size,9)
    for(const id of targets){
      const target=f.currentFishingTarget(s),description=f.fishingDescription(s,target)
      assert.equal(f.fishingCommand(s).english,`Catch the ${description.english}.`)
      if(!target.striped&&!target.spotted&&choices.some(fish=>fish.colorName===target.colorName&&fish.size===target.size&&(fish.striped||fish.spotted)))assert.ok(description.english.includes('plain'))
      assert.ok(f.catchFish(h,id).ok);assert.ok(f.validFishing(JSON.parse(JSON.stringify(s))))
      assert.deepEqual(f.visiblePondFish(s).map(fish=>fish.id),ids)
    }
    assert.ok(f.nextFishingRound(s))
  }
  assert.equal(s.collection.length,27);assert.equal(new Set(orders).size,21)
  assert.notDeepEqual(f.visiblePondFish(s).map(fish=>fish.id),orders[0].split('/'))
  assert.equal(h.coins,4+21*20)
  assert.equal(f.pondFishById['small-striped'].colorName,'purple')
  assert.equal(f.pondFishById['small-striped'].size,'small');assert.equal(f.pondFishById['small-striped'].striped,true)
})

test('migrated fishing keeps the fourth classic set, partial catch and collection until expanded content starts',()=>{
  const h=host(),s=h.fishing;s.contentFrom=5
  for(let n=0;n<3;n++){for(const id of f.currentFishingSet(s))f.catchFish(h,id);f.nextFishingRound(s)}
  assert.deepEqual(f.currentFishingSet(s),f.fishingSets[0])
  f.catchFish(h,'small-yellow');assert.equal(s.collection.length,9);assert.ok(f.validFishing(JSON.parse(JSON.stringify(s))))
  f.catchFish(h,'big-blue');f.catchFish(h,'small-red');f.nextFishingRound(s)
  assert.deepEqual(f.currentFishingSet(s),f.fishingSets[3]);assert.equal(s.collection.length,9)
  f.catchFish(h,'small-orange');assert.ok(f.validFishing(s));assert.equal(s.collection.length,10)
  for(const contentFrom of [-1,1,2.5,1000])assert.equal(f.validFishing({...s,contentFrom}),false)
})
test('fishing remembers partial catch, all assistance and mode changes, and rejects impossible collection/save states',()=>{
  const h=host();f.catchFish(h,'small-yellow');a.toggleActivityHint(h.fishing);a.toggleActivityHint(h.fishing)
  h.fishing=JSON.parse(JSON.stringify(h.fishing));assert.equal(f.validFishing(h.fishing),true)
  assert.equal(h.fishing.helped,true);assert.equal(h.fishing.hintOpen,false)
  a.changeActivityMode(h.fishing,'listening')
  f.catchFish(h,'big-blue');f.catchFish(h,'small-red')
  assert.equal(h.fishing.assisted,1);assert.ok(f.nextFishingRound(h.fishing));assert.equal(h.fishing.helped,false)
  for(const patch of [{round:0},{round:1000001},{completed:true},{caught:['small-blue']},{collection:['not-a-fish']},{collection:[]},{independent:3},{helped:false,hintOpen:true},{misses:-1}]){
    assert.equal(f.validFishing({...h.fishing,...patch}),false,JSON.stringify(patch))
  }
  a.changeActivityMode(h.fishing,'guide')
  for(const id of f.currentFishingSet(h.fishing))f.catchFish(h,id)
  assert.equal(h.fishing.assisted,2);assert.equal(f.validFishing(h.fishing),true)
})
