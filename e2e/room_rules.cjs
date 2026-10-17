const test = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const source = ts.transpileModule(readFileSync(path.join(__dirname,'../src/features/wordMerge/room.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const mod = {exports:{}}
new Function('module','exports',source)(mod,mod.exports)
const r=mod.exports
const state=()=>({room:r.newRoom(),coins:11,progress:{xp:5}})
function solve(s) { while(r.currentRoomTask(s.room)){ const task=r.currentRoomTask(s.room);r.chooseRoomItem(s.room,task.item);assert.equal(r.placeRoomItem(s,task.destination).ok,true) } }

test('room tasks require both pictured object and actual spatial destination; wrong taps are recoverable',()=>{
  const s=state(),before=structuredClone(s)
  assert.ok(r.validRoom(s.room));assert.equal(s.room.mode,'reading')
  assert.equal(r.enterRoom(s.room,'school'),false)
  assert.equal(r.chooseRoomItem(s.room,'book'),false)
  r.unpackRoom(s.room);r.chooseRoomItem(s.room,'hat')
  assert.deepEqual(r.placeRoomItem(s,'desk'),{ok:false,complete:false,reward:0})
  assert.equal(s.room.sessions.welcome.selected,'hat')
  r.chooseRoomItem(s.room,'book')
  assert.equal(r.placeRoomItem(s,'bed').ok,false)
  assert.equal(s.coins,before.coins);assert.deepEqual(s.room.sessions.welcome.placed,[])
  assert.deepEqual(r.placeRoomItem(s,'desk'),{ok:true,complete:false,reward:0})
  assert.deepEqual(s.room.sessions.welcome.placed,['welcome-book'])
  assert.equal(s.room.sessions.welcome.independent,1)
  assert.equal(r.chooseRoomItem(s.room,'book'),false)
  assert.ok(r.validRoom(s.room))
})

test('nine coherent rooms persist every placement, unlock in order and grant shared rewards once',()=>{
  const s=state()
  for(const chapter of r.roomChapters) {
    assert.ok(r.enterRoom(s.room,chapter.id));r.unpackRoom(s.room)
    solve(s)
    const room=s.room.sessions[chapter.id]
    assert.ok(room.rewarded);assert.equal(room.independent,chapter.tasks.length)
    assert.ok(r.validRoom(structuredClone(s.room)))
    const coins=s.coins,xp=s.progress.xp
    assert.equal(r.chooseRoomItem(s.room,chapter.tasks[0].item),false)
    assert.deepEqual(r.placeRoomItem(s,chapter.tasks[0].destination),{ok:false,complete:false,reward:0})
    assert.equal(r.unpackRoom(s.room),false)
    assert.equal(s.coins,coins);assert.equal(s.progress.xp,xp)
  }
  assert.equal(s.coins,11+30*r.roomChapters.length);assert.equal(s.progress.xp,5+16*r.roomChapters.length)
  assert.equal('deliveries' in s,false)
  assert.ok(r.enterRoom(s.room,'welcome'));assert.equal(s.room.sessions.welcome.placed.length,4)
})

test('room help, guide mode, reload and global mode changes cannot masquerade as unaided listening',()=>{
  let s=state();r.unpackRoom(s.room);r.toggleRoomHint(s.room);r.toggleRoomHint(s.room)
  s=structuredClone(s)
  r.chooseRoomItem(s.room,'book');r.placeRoomItem(s,'desk')
  assert.equal(s.room.sessions.welcome.assisted,1)
  assert.equal(s.room.sessions.welcome.helped,false)
  solve(s);r.enterRoom(s.room,'school')
  // Switching mode while viewing a completed room must mark an unfinished exposed room.
  r.enterRoom(s.room,'welcome');r.setRoomMode(s.room,'listening')
  assert.equal(s.room.sessions.school.helped,true);assert.equal(s.room.sessions.school.hintOpen,false)
  r.enterRoom(s.room,'school');r.unpackRoom(s.room);r.chooseRoomItem(s.room,'pen');r.placeRoomItem(s,'desk')
  assert.equal(s.room.sessions.school.assisted,1)
  assert.equal(s.room.sessions.school.independent,0)
  r.setRoomMode(s.room,'guide');r.chooseRoomItem(s.room,'book');r.placeRoomItem(s,'shelf')
  assert.equal(s.room.sessions.school.assisted,2)
  assert.ok(r.validRoom(s.room))
})

test('room save validation rejects impossible collections, reordering, hidden help and duplicate rewards',()=>{
  const base=r.newRoom()
  for(const mutate of [
    s=>s.sessions.welcome.placed=['welcome-bear'],
    s=>s.sessions.welcome.rewarded=true,
    s=>s.sessions.welcome.hintOpen=true,
    s=>s.sessions.welcome.independent=1,
    s=>s.sessions.school.unpacked=true,
    s=>s.sessions.welcome.selected='book',
    s=>s.selected='school',
    s=>s.mode='impossible',
  ]) {const broken=structuredClone(base);mutate(broken);assert.equal(r.validRoom(broken),false)}
  assert.equal(r.validRoom(null),false);assert.equal(r.roomUnlocked(base,'invalid'),false)
})


test('expanded rooms cover familiar new objects and eight positions without changing original tasks',()=>{
  assert.equal(r.roomChapters.length,9)
  assert.equal(new Set(r.roomChapters.map(c=>c.id)).size,9)
  assert.equal(r.roomDestinations.length,8)
  assert.deepEqual(r.roomChapters.slice(0,3).map(c=>c.tasks.map(t=>[t.id,t.item,t.destination])),[
    [['welcome-book','book','desk'],['welcome-bear','bear','box'],['welcome-shoes','shoes','bed'],['welcome-bag','bag','side']],
    [['school-pen','pen','desk'],['school-book','book','shelf'],['school-ball','ball','box'],['school-hat','hat','basket']],
    [['evening-shirt','shirt','basket'],['evening-lamp','lamp','desk'],['evening-plant','plant','shelf'],['evening-blanket','blanket','box']],
  ])
  const used=new Set()
  for(const chapter of r.roomChapters){
    assert.equal(chapter.tasks.length,4);assert.equal(new Set(chapter.goods).size,chapter.goods.length)
    assert.equal(new Set(chapter.tasks.map(t=>t.item)).size,chapter.tasks.length)
    for(const task of chapter.tasks){assert.ok(r.roomItemById[task.item]);assert.ok(chapter.goods.includes(task.item));assert.ok(r.roomDestinations.some(d=>d.id===task.destination));used.add(task.item)}
  }
  assert.ok(used.size>=25,'new chapters teach additional everyday objects')
})

test('v8 room expansion preserves every old partial placement, selected item, hint, mode and paid chapter',()=>{
  const s=state();r.unpackRoom(s.room);solve(s);r.enterRoom(s.room,'school');r.unpackRoom(s.room)
  r.chooseRoomItem(s.room,'pen');r.placeRoomItem(s,'desk');r.chooseRoomItem(s.room,'lamp');r.toggleRoomHint(s.room)
  s.room.mode='listening'
  const old=structuredClone(s.room);old.sessions=Object.fromEntries(Object.entries(old.sessions).slice(0,3))
  const before=structuredClone(old),upgraded=r.migrateRoomV8(old)
  assert.deepEqual(old,before,'migration does not mutate its source')
  assert.ok(r.validRoom(upgraded));assert.equal(upgraded.selected,'school');assert.equal(upgraded.mode,'listening')
  for(const id of ['welcome','school','evening'])assert.deepEqual(upgraded.sessions[id],old.sessions[id])
  assert.equal(upgraded.sessions.welcome.rewarded,true)
  for(const chapter of r.roomChapters.slice(3))assert.deepEqual(upgraded.sessions[chapter.id],r.newRoom().sessions[chapter.id])
  const migrated={...s,room:upgraded},coins=migrated.coins;r.enterRoom(migrated.room,'welcome');assert.equal(r.unpackRoom(migrated.room),false);assert.equal(migrated.coins,coins)
  const corrupt=structuredClone(old);delete corrupt.sessions.school;assert.equal(r.migrateRoomV8(corrupt),null)
  const forged=structuredClone(old);forged.sessions.school.independent++;assert.equal(r.migrateRoomV8(forged),null)
  assert.deepEqual(r.migrateRoomV8(r.newRoom()),r.newRoom(),'already expanded legacy fixtures retain new sessions')
})
