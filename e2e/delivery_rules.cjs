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
const d=load('delivery'),a=load('activity')
const host=()=>({delivery:d.newDelivery(),coins:7,progress:{xp:3}})
test('courier walks three actual map routes, picks up before walking and delivers exactly once',()=>{
  const h=host(),s=h.delivery
  for(let round=0;round<3;round++){
    assert.equal(d.validDelivery(s),true)
    const start=JSON.stringify({x:s.x,y:s.y,parcel:s.parcel,step:s.step}),coins=h.coins
    for(const wrong of ['deliver','east','north','unknown'])assert.equal(d.actDelivery(h,wrong).ok,false)
    assert.equal(JSON.stringify({x:s.x,y:s.y,parcel:s.parcel,step:s.step}),start)
    assert.equal(h.coins,coins)
    for(const action of d.deliveryActions(s)){
      assert.equal(d.currentDeliveryCommand(s).action,action)
      const result=d.actDelivery(h,action)
      assert.ok(result.ok);assert.equal(result.completed,action==='deliver')
      assert.ok(s.x>=0&&s.x<5&&s.y>=0&&s.y<5)
      assert.equal(d.deliveryObstacles.some(([x,y])=>x===s.x&&y===s.y),false)
      assert.equal(d.validDelivery(JSON.parse(JSON.stringify(s))),true)
    }
    assert.deepEqual([s.x,s.y],d.currentDeliveryRoute(s).destination)
    assert.equal(h.coins,coins+20);assert.equal(s.parcel,false)
    for(const action of d.deliveryActions(s))assert.equal(d.actDelivery(h,action).ok,false)
    assert.equal(h.coins,coins+20);assert.equal(s.independent,round+1)
    assert.equal(s.stamps.length,round+1)
    assert.ok(d.nextDeliveryRound(s));assert.equal(d.nextDeliveryRound(s),false)
  }
  assert.equal(h.coins,67);assert.equal(h.progress.xp,39)
  const directions=new Set(d.deliveryRoutes.flatMap(route=>route.directions))
  assert.deepEqual([...directions].sort(),['east','north','south','west'])
})
test('courier persists route position and conservative help through reload, rejects corrupt saved progress',()=>{
  const h=host();d.actDelivery(h,'pickup');d.actDelivery(h,'north')
  a.toggleActivityHint(h.delivery);a.toggleActivityHint(h.delivery)
  h.delivery=JSON.parse(JSON.stringify(h.delivery))
  assert.ok(d.validDelivery(h.delivery));assert.ok(h.delivery.helped);assert.equal(h.delivery.hintOpen,false)
  a.changeActivityMode(h.delivery,'listening')
  while(!h.delivery.delivered)d.actDelivery(h,d.currentDeliveryCommand(h.delivery).action)
  assert.equal(h.delivery.assisted,1);assert.equal(h.delivery.independent,0)
  assert.ok(d.nextDeliveryRound(h.delivery));assert.equal(h.delivery.helped,false)
  for(const patch of [{x:4},{step:3},{round:0},{round:1000001},{stamps:['school']},{stamps:['park','park']},{parcel:true},{helped:false,hintOpen:true},{independent:999}]){
    assert.equal(d.validDelivery({...h.delivery,...patch}),false,JSON.stringify(patch))
  }
  a.changeActivityMode(h.delivery,'guide')
  while(!h.delivery.delivered)d.actDelivery(h,d.currentDeliveryCommand(h.delivery).action)
  assert.equal(h.delivery.assisted,2);assert.equal(d.validDelivery(h.delivery),true)
})

test('expanded courier explores eighteen distinct routes over three valid, different maps and a full replay',()=>{
  assert.equal(d.deliveryRoutes.length,18);assert.equal(d.deliveryMaps.length,3)
  assert.equal(new Set(d.deliveryRoutes.map(route=>route.id)).size,18)
  assert.equal(new Set(d.deliveryMaps.map(map=>JSON.stringify(map.obstacles))).size,3)
  assert.ok(new Set(d.deliveryRoutes.map(route=>route.directions.length)).size>=5)
  const h=host(),s=h.delivery,seenMaps=new Set()
  for(let round=0;round<d.deliveryRoutes.length+1;round++){
    const route=d.currentDeliveryRoute(s),map=d.currentDeliveryMap(s)
    assert.equal(route.id,d.deliveryRoutes[round%d.deliveryRoutes.length].id)
    assert.equal(route.map,map.id);seenMaps.add(map.id)
    assert.ok(map.landmarks.some(mark=>mark.x===route.destination[0]&&mark.y===route.destination[1]))
    assert.equal(new Set(map.landmarks.map(mark=>`${mark.x},${mark.y}`)).size,map.landmarks.length)
    for(const action of d.deliveryActions(s)){
      assert.ok(d.actDelivery(h,action).ok)
      assert.ok(s.x>=0&&s.x<5&&s.y>=0&&s.y<5)
      assert.ok(!map.obstacles.some(([x,y])=>x===s.x&&y===s.y),`${route.id} crossed an obstacle`)
      assert.ok(d.validDelivery(JSON.parse(JSON.stringify(s))),`${route.id} did not preserve its save`)
    }
    assert.deepEqual([s.x,s.y],route.destination)
    assert.equal(s.stamps.length,Math.min(round+1,18))
    assert.ok(d.nextDeliveryRound(s))
  }
  assert.equal(seenMaps.size,3);assert.equal(h.coins,7+19*20);assert.equal(h.progress.xp,3+19*12)
})

test('migrated courier keeps a partially walked fourth classic round, then enters unseen routes without losing stamps',()=>{
  const h=host(),s=h.delivery;s.contentFrom=5
  for(let n=0;n<3;n++){for(const action of d.deliveryActions(s))d.actDelivery(h,action);d.nextDeliveryRound(s)}
  assert.equal(d.currentDeliveryRoute(s).id,'park')
  d.actDelivery(h,'pickup');d.actDelivery(h,'north')
  assert.ok(d.validDelivery(JSON.parse(JSON.stringify(s))))
  assert.deepEqual(s.stamps,['park','bakery','school']);assert.deepEqual([s.x,s.y],[0,3])
  while(!s.delivered)d.actDelivery(h,d.currentDeliveryCommand(s).action)
  assert.ok(d.nextDeliveryRound(s));assert.equal(d.currentDeliveryRoute(s).id,'library')
  for(const action of d.deliveryActions(s))d.actDelivery(h,action)
  assert.ok(d.validDelivery(s));assert.deepEqual(s.stamps,['park','bakery','school','library'])
  for(const contentFrom of [-1,1,1.5,1000])assert.equal(d.validDelivery({...s,contentFrom}),false)
})
