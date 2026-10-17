// Run: node --test e2e/verify_word_merge_rules.cjs
// Transpile the actual pure TypeScript modules in memory; no app or database needed.
const { readFileSync } = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const test = require('node:test')
const ts = require('typescript')
const cache = new Map()
function load(name) {
  if (cache.has(name)) return cache.get(name)
  const file = path.join(__dirname, '../src/features/wordMerge', name + '.ts')
  const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} }
  cache.set(name, module.exports)
  new Function('require', 'module', 'exports', source)(id => {
    if (!['./catalog', './journey', './visitors', './expansion', './progress', './stores', './kitchen', './room', './activity', './content', './delivery', './fishing', './care', './farm', './adventure'].includes(id)) throw new Error('Unexpected module: ' + id)
    return load(id.slice(2))
  }, module, module.exports)
  return module.exports
}
const c = load('catalog')
const g = load('game')
const j = load('journey')

const pets = load('visitors')
const progress = load('progress')
const originalWords = {
  coffee: ['coffee bean', 'bag', 'coffee maker', 'coffee', 'cup'],
  garden: ['seed', 'seedling', 'plant', 'flower', 'bouquet'],
  bakery: ['flour', 'dough', 'bread', 'toast', 'sandwich'],
  juice: ['orange', 'orange segment', 'juice', 'glass'],
  clothes: ['cotton', 'yarn', 'cloth', 'shirt'], paper: ['paper', 'drawing', 'card', 'greeting card'],
  pottery: ['clay', 'clay pot', 'dry pot', 'ceramic pot'], kitchen: ['potato', 'peeled potato', 'potato slice', 'crisps'],
}
function legacy(version) {
  const state = g.newGame()
  state.version = version
  delete state.progress
  for (const d of c.districts) state.boards[d.id] = Array.from({ length: 25 }, (_, i) => {
    const id = state.boards[d.id][Math.floor(i / 5) * g.BOARD_COLUMNS + i % 5]
    return id && originalWords[c.wordById[id].theme] ? id : null
  })
  state.discovered = Object.keys(originalWords).map(t => t + '-0')
  for (const t of ['fruit', 'school', 'breakfast']) delete state.orderStep[t]
  if (version === 2) { delete state.journey; delete state.visitors }
  if (version === 3) delete state.visitors
  return state
}
test('11 chains contain 78 stable-ID objects, playable actions and unambiguous choices', () => {
  assert.equal(c.themes.length, 11)
  assert.equal(c.words.length, 78)
  assert.equal(new Set(c.words.map(w => w.id)).size, c.words.length)
  for (const [theme, oldWords] of Object.entries(originalWords)) oldWords.forEach((word, i) => assert.equal(c.wordById[theme + '-' + i].word, word))
  for (const theme of c.themes) {
    const chain = c.themeWords(theme.id)
    assert.ok(chain.length >= 6 && chain.length <= 8)
    assert.equal(c.chainActions[theme.id].length, chain.length - 1)
    chain.forEach((word, index) => {
      assert.equal(word.level, index)
      assert.ok(word.sentence.toLowerCase().includes(word.word.toLowerCase()), word.id)
      assert.equal(c.isTerminal(word.id), index === chain.length - 1)
      assert.equal(new Set(c.meaningChoices(word)).size, 3)
      assert.ok(c.meaningChoices(word).includes(word.meaning))
    })
    for (const phrase of c.themePhrases[theme.id]) {
      assert.equal(phrase.prompt.replace('_____', phrase.answer), phrase.phrase)
      assert.ok(phrase.options.includes(phrase.answer)); assert.equal(new Set(phrase.options).size, 3)
    }
  }
})
test('all 78 objects are reachable from free supplies, including the eighth levels', () => {
  const state = g.newGame()
  for (const theme of c.themes) {
    g.switchDistrict(state, c.themeDistrict(theme.id))
    const terminal = c.themeWords(theme.id).at(-1).id
    let steps = 0
    while (!g.currentBoard(state).includes(terminal)) {
      const board = g.currentBoard(state), counts = new Map()
      let pair = null
      for (let i = 0; i < board.length; i++) {
        const id = board[i]
        if (!id || c.wordById[id].theme !== theme.id || c.isTerminal(id)) continue
        if (counts.has(id)) { pair = [counts.get(id), i]; break }
        counts.set(id, i)
      }
      if (pair) assert.ok(g.mergeTiles(state, ...pair)); else assert.notEqual(g.supply(state, theme.id), -1)
      assert.ok(++steps < 600)
    }
  }
  assert.equal(state.discovered.length, 78)
  assert.ok(g.parseSave(JSON.stringify(state)))
})
test('6 by 8 boards have 48 slots, terminal items stop, and district progress stays isolated', () => {
  const state = g.newGame()
  assert.equal(g.BOARD_SIZE, 48); assert.equal(g.BOARD_COLUMNS, 6); assert.equal(g.BOARD_ROWS, 8)
  assert.equal(g.currentBoard(state).length, 48)
  g.mergeTiles(state, 7, 8)
  const parked = [...state.boards.cafe]
  g.switchDistrict(state, 'market')
  assert.equal(g.supply(state, 'coffee'), -1); assert.equal(g.deliver(state, 'coffee'), false)
  const board = g.currentBoard(state); board[0] = board[1] = 'juice-6'
  const before = JSON.stringify(state)
  assert.equal(g.mergeTiles(state, 0, 1), null)
  assert.equal(g.mergeResult(board, -1, 0), null); assert.equal(g.mergeResult(board, 0, 48), null)
  assert.equal(JSON.stringify(state), before); assert.deepEqual(state.boards.cafe, parked)
})
test('early orders are affordable; later orders explore all levels and upgrade supply after 3 and 6 orders', () => {
  const state = g.newGame()
  for (const theme of c.themes) {
    g.switchDistrict(state, c.themeDistrict(theme.id))
    const seen = new Set()
    for (let step = 0; step < 40; step++) {
      const id = g.orderWord(state, theme.id); seen.add(id)
      if (step === 0) assert.equal(id, theme.id + '-1')
      if (step < 2) assert.ok(c.wordById[id].level <= 2)
      state.boards[state.district] = Array(g.BOARD_SIZE).fill(null)
      const before = state.coins
      assert.equal(g.deliver(state, theme.id), false); assert.equal(state.coins, before)
      g.currentBoard(state)[0] = id
      assert.ok(g.deliver(state, theme.id)); assert.equal(state.coins, before + 20)
      if (step === 2) assert.equal(g.supplyWord(state, theme.id), theme.id + '-1')
      if (step === 5) assert.equal(g.supplyWord(state, theme.id), theme.id + '-2')
    }
    assert.equal(seen.size, c.themeWords(theme.id).length - 1)
  }
})
test('different-ingredient recipes work in either direction and never cross district boundaries', () => {
  for (const recipe of c.combinationRecipes) for (const reversed of [false, true]) {
    const state = g.newGame()
    const ids = reversed ? [...recipe.ingredients].reverse() : recipe.ingredients
    const district = c.themeDistrict(c.wordById[ids[0]].theme)
    assert.equal(c.themeDistrict(c.wordById[ids[1]].theme), district)
    assert.equal(c.themeDistrict(c.wordById[recipe.result].theme), district)
    g.switchDistrict(state, district)
    const board = g.currentBoard(state); board[0] = ids[0]; board[1] = ids[1]
    assert.equal(g.mergeTiles(state, 0, 1), recipe.result)
    assert.equal(state.coins, 5); assert.equal(state.progress.combinations, 1)
    assert.ok(state.discovered.includes(recipe.result))
  }
})
test('shop goals are earned, claimable once and persist; discovery adds extra growth', () => {
  let state = g.newGame()
  assert.equal(g.claimShopGoal(state, 'first-merge'), false)
  g.mergeTiles(state, 7, 8)
  assert.equal(state.progress.xp, 11)
  assert.ok(g.claimShopGoal(state, 'first-merge')); assert.equal(state.coins, 12)
  state = g.parseSave(JSON.stringify(state))
  assert.equal(g.claimShopGoal(state, 'first-merge'), false)
  assert.ok(progress.shopLevel(state.progress.xp) > 1)
})
test('v1 through v4 migrations preserve spatial tile positions, money, orders, learning and decorations', () => {
  for (const version of [1, 2, 3, 4]) {
    let old = legacy(version)
    old.boards.cafe[7] = 'coffee-1'; old.discovered.push('coffee-1'); old.recall['coffee-1'] = 4
    old.coins = 81; old.merges = 8; old.deliveries = 3; old.orderStep.coffee = 3
    if (version >= 3) { old.journey.step = 1; old.journey.owned = ['sage']; old.journey.equipped.awning = 'sage'; old.journey.packed.apple = 2 }
    if (version === 1) old = { version: 1, board: old.boards.cafe, discovered: old.discovered, recall: old.recall, coins: 81, merges: 8, deliveries: 3, orderStep: { coffee: 3, garden: 0, bakery: 0 } }
    const upgraded = g.parseSave(JSON.stringify(old))
    assert.ok(upgraded, 'migration failed v' + version)
    assert.equal(upgraded.version, 9); assert.equal(upgraded.boards.cafe[8], 'coffee-1')
    assert.equal(upgraded.coins, 81); assert.equal(upgraded.recall['coffee-1'], 4); assert.equal(upgraded.orderStep.coffee, 3)
    assert.equal(upgraded.orderStep.breakfast, 0); assert.deepEqual(upgraded.journey.memory, {})
    if (version >= 3) { assert.equal(upgraded.journey.equipped.awning, 'sage'); assert.equal(upgraded.journey.packed.apple, 2) }
    assert.deepEqual(g.parseSave(JSON.stringify(upgraded)), upgraded)
  }
})
test('simple picnic starts with no inventory, enforces quantity and location, and rewards each step once', () => {
  const state = g.newGame(), now = 100000
  assert.equal(j.finishPicnicTask(state, 'apple', 2, undefined, now), false)
  assert.equal(j.finishPicnicTask(state, 'bread', 2, undefined, now), false)
  assert.ok(j.finishPicnicTask(state, 'bread', 1, undefined, now))
  for (const task of j.picnicTasks.slice(1)) {
    if (state.journey.step === 4) assert.equal(j.finishPicnicTask(state, 'bread', 1, 'table', now), false)
    assert.ok(j.finishPicnicTask(state, task.food, task.quantity, 'bag', now))
  }
  assert.equal(state.coins, 80); assert.equal(state.journey.step, 5)
  assert.equal(j.finishPicnicTask(state, 'bread', 1, 'bag', now), false)
  assert.ok(g.parseSave(JSON.stringify(state)))
})
test('review still separates help, independent and delayed recall across reloads', () => {
  let state = g.newGame(); const now = 100000
  j.introduce(state.journey, 'apple', now)
  assert.deepEqual(j.dueFoods(state.journey, now + j.DAY - 1), [])
  j.markHelp(state.journey, 'apple', now + j.DAY)
  state = g.parseSave(JSON.stringify(state)); j.recordAnswer(state.journey, 'apple', now + j.DAY)
  assert.equal(state.journey.memory.apple.helped, 1); assert.equal(state.journey.memory.apple.independent, 0)
  j.recordAnswer(state.journey, 'apple', now + 2 * j.DAY)
  assert.equal(state.journey.memory.apple.retained, 1)
  assert.equal(state.journey.memory.apple.due, now + 5 * j.DAY)
})
test('decoration unlocks, purchases and switching still preserve balances', () => {
  const state = g.newGame(); state.coins = 100
  assert.equal(j.buyDecoration(state, 'sage'), false)
  state.journey.step = 1; assert.ok(j.buyDecoration(state, 'sage')); assert.equal(state.coins, 76)
  assert.equal(j.buyDecoration(state, 'sage'), false); assert.ok(j.equipDecoration(state.journey, 'sage'))
  state.journey.step = 5; assert.ok(j.buyDecoration(state, 'bistro')); assert.ok(g.parseSave(JSON.stringify(state)))
})
test('corrupt v9 saves are rejected without overwriting data', () => {
  assert.equal(g.parseSave('{broken'), null); assert.equal(g.parseSave('null'), null)
  for (const mutate of [s => s.coins = -1, s => s.boards.cafe.pop(), s => s.boards.cafe[0] = 'juice-0',
    s => s.journey.step = 6, s => s.journey.packed.apple = -1, s => s.journey.equipped.awning = 'sage',
    s => s.progress.xp = -1, s => s.progress.claimed = ['fake'], s => s.actionRecall['fake'] = 1]) {
    const state = g.newGame(); mutate(state); assert.equal(g.parseSave(JSON.stringify(state)), null)
  }
})

const stores = load('stores')
test('all three stores have solvable shuffled stock for every menu, limited trays and one-time rewards', () => {
  assert.equal(stores.products.length, 44)
  for (const shop of stores.storeList) {
    const state = g.newGame()
    const firstShelf = state.stores.sessions[shop.id].shelf.slice()
    for (let round = 1; round <= 8; round++) {
      const session = state.stores.sessions[shop.id]
      assert.equal(session.round, round)
      assert.equal(stores.nextStoreRound(state.stores,shop.id), false)
      for (const [index, order] of stores.storeOrders(shop.id,round).entries()) {
        const before = structuredClone(state)
        assert.equal(stores.serveStore(state,shop.id,index), 0)
        assert.deepEqual(state, before)
        for (const need of order.lines) for (let n=0;n<need.count;n++) assert.ok(stores.takeProduct(session,need.product))
        assert.ok(stores.canServe(session,shop.id,index))
        const coins = state.coins, xp = state.progress.xp
        const reward = stores.serveStore(state,shop.id,index)
        assert.equal(reward,12+order.lines.reduce((n,l) => n+l.count,0)*4)
        assert.equal(state.coins,coins+reward); assert.equal(state.progress.xp,xp+8)
        assert.equal(stores.serveStore(state,shop.id,index),0)
        assert.equal(state.coins,coins+reward)
        assert.ok(g.parseSave(JSON.stringify(state)))
      }
      assert.equal(session.tray.length,0)
      assert.equal(session.independent,round*3)
      assert.ok(stores.nextStoreRound(state.stores,shop.id))
      assert.ok(g.parseSave(JSON.stringify(state)))
    }
    assert.notDeepEqual(state.stores.sessions[shop.id].shelf,firstShelf)
    assert.equal(state.merges,0); assert.equal(state.deliveries,24)
    assert.equal(g.goalProgress(state,'deliveries'),24)
  }
})

test('full baskets recover without loss; extra items survive checkout and help history persists', () => {
  const state = g.newGame(), session = state.stores.sessions.supermarket
  for (let n=0;n<6;n++) assert.ok(stores.takeProduct(session,session.shelf[0]))
  const full = structuredClone(session)
  assert.equal(stores.takeProduct(session,session.shelf[0]),false)
  assert.deepEqual(session,full)
  assert.equal(stores.returnProduct(session,-1),false)
  while (session.tray.length) assert.ok(stores.returnProduct(session,0))
  assert.ok(stores.takeProduct(session,'orange'))
  assert.equal(stores.takeProduct(session,'milk',-1),false)
  for (const l of stores.storeOrders('supermarket',1)[0].lines) for(let i=0;i<l.count;i++) stores.takeProduct(session,l.product)
  session.helped = true
  assert.ok(stores.serveStore(state,'supermarket',0))
  assert.deepEqual(session.tray,['orange']); assert.equal(session.assisted,1); assert.equal(session.independent,0)
  const restored = g.parseSave(JSON.stringify(state))
  assert.deepEqual(restored.stores,state.stores)
  for (const mutate of [s => s.stores.selected = 'fake', s => s.stores.sessions.fruit.shelf.push('fake'),
    s => s.stores.sessions.fruit.tray = Array(7).fill('apple'), s => s.stores.sessions.fruit.independent++,
    s => s.stores.sessions.fruit.shelf.pop(), s => s.stores.sessions.fruit.served[0] = true]) {
    const bad = structuredClone(state); mutate(bad); assert.equal(g.parseSave(JSON.stringify(bad)),null)
  }
})

test('v5 saves gain fresh shops while preserving all original progress and 48-slot positions', () => {
  const old = g.newGame(); old.version = 5; delete old.stores
  old.progress.xp = 120; old.progress.claimed = ['first-merge']; old.coins = 59
  old.boards.cafe[7] = null; old.boards.cafe[47] = 'coffee-0'
  const upgraded = g.parseSave(JSON.stringify(old))
  assert.ok(upgraded); assert.equal(upgraded.version,9)
  assert.deepEqual(upgraded.progress,old.progress); assert.deepEqual(upgraded.boards,old.boards)
  assert.deepEqual(upgraded.journey,old.journey); assert.deepEqual(upgraded.visitors,old.visitors)
  assert.equal(upgraded.coins,59); assert.deepEqual(upgraded.stores,stores.newStores())
})

function classicStores(state) {
  for(const shop of stores.storeList) {
    const session=stores.newSession(shop.id,1,0,0,2)
    state.stores.sessions[shop.id]=session
  }
}
function removeLoopSchedule(state) {
  for(const session of Object.values(state.stores.sessions)) delete session.contentFrom
  if(state.kitchen) delete state.kitchen.contentFrom
}
test('v6 stores and partial baskets survive the v7 kitchen and room migration', () => {
  const old = g.newGame(); old.version = 6; delete old.kitchen; delete old.room; classicStores(old)
  old.coins = 83; old.progress.xp = 101; old.journey.step = 1
  old.journey.owned = ['sage']; old.journey.equipped.awning = 'sage'
  old.stores.selected = 'fashion'
  const session = old.stores.sessions.fashion
  assert.ok(stores.takeProduct(session,'red-shirt'))
  assert.ok(stores.takeProduct(session,'red-hat'))
  removeLoopSchedule(old)
  const upgraded = g.parseSave(JSON.stringify(old))
  assert.ok(upgraded); assert.equal(upgraded.version,9)
  assert.deepEqual(upgraded.stores,stores.migrateStoresV8(old.stores))
  for (const field of ['coins','progress','journey','visitors','boards','orderStep','recall','discovered']) assert.deepEqual(upgraded[field],old[field],field)
  assert.deepEqual(upgraded.kitchen,load('kitchen').newKitchen())
  assert.deepEqual(upgraded.room,load('room').newRoom())
  for (const missing of ['kitchen','room']) {
    const bad = structuredClone(upgraded); delete bad[missing]
    assert.equal(g.parseSave(JSON.stringify(bad)),null)
  }
})

test('v7 partial kitchen, room and shopping progress survive all five v8 additions', () => {
  const old = g.newGame(); old.version = 7; classicStores(old)
  for (const key of ['delivery','fishing','care','farm','adventure']) delete old[key]
  load('kitchen').actKitchen(old,'bread')
  load('room').unpackRoom(old.room); load('room').chooseRoomItem(old.room,'book'); load('room').placeRoomItem(old,'desk')
  stores.takeProduct(old.stores.sessions.supermarket,'milk')
  old.coins=57; old.progress.xp=42
  removeLoopSchedule(old)
  const upgraded=g.parseSave(JSON.stringify(old)); assert.ok(upgraded); assert.equal(upgraded.version,9)
  assert.deepEqual(upgraded.kitchen,load('kitchen').migrateKitchenV8(old.kitchen))
  assert.deepEqual(upgraded.stores,stores.migrateStoresV8(old.stores))
  for(const field of ['room','boards','journey','progress','coins','visitors','recall']) assert.deepEqual(upgraded[field],old[field],field)
  for(const [field,module,create] of [['delivery','delivery','newDelivery'],['fishing','fishing','newFishing'],['care','care','newCare'],['farm','farm','newFarm'],['adventure','adventure','newAdventure']]) {
    assert.deepEqual(upgraded[field],load(module)[create]())
    const bad=structuredClone(upgraded); delete bad[field]; assert.equal(g.parseSave(JSON.stringify(bad)),null)
  }
})

test('each four-visit bag covers all animals; adjacent guests differ across reloads and bags', () => {
  const state = g.newGame(), now = Date.now()
  const seen = []
  for (let i = 0; i < 20; i++) {
    pets.arrive(state.visitors, now, () => .25)
    seen.push(state.visitors.current.animal)
    assert.ok(g.parseSave(JSON.stringify(state)))
    if (i > 0) assert.notEqual(seen[i], seen[i - 1])
    if (i % 4 === 3) assert.equal(new Set(seen.slice(i - 3, i + 1)).size, 4)
  }
})

test('feeding checks requested species and level; wrong deliveries preserve inventory and rewards', () => {
  const state = g.newGame()
  pets.arrive(state.visitors, Date.now(), () => .99)
  assert.equal(state.visitors.current.animal, 'cat')
  assert.ok(pets.supplyPet(state.visitors, 'dog'))
  assert.ok(pets.supplyPet(state.visitors, 'dog'))
  assert.ok(pets.mergePet(state.visitors, 0, 1))
  const before = JSON.stringify(state)
  assert.equal(pets.feedVisitor(state, 1).ok, false)
  assert.equal(pets.feedVisitor(state, -1).ok, false)
  assert.equal(JSON.stringify(state), before)
  state.visitors.board[1] = null
  assert.ok(pets.supplyPet(state.visitors, 'cat'))
  assert.equal(pets.feedVisitor(state, 0).ok, false)
  assert.ok(pets.supplyPet(state.visitors, 'cat'))
  assert.ok(pets.mergePet(state.visitors, 0, 1))
  const result = pets.feedVisitor(state, 1)
  assert.deepEqual(result, { ok: true, coins: 12, unlocked: true })
  assert.equal(state.visitors.board[1], null)
  assert.equal(state.visitors.points, 1)
  assert.equal(pets.feedVisitor(state, 1).ok, false)
})

test('hidden water task unlocks care chain once, and all unlocked chains merge to their terminal', () => {
  const state = g.newGame()
  pets.arrive(state.visitors, Date.now(), () => .99)
  assert.equal(pets.supplyPet(state.visitors, 'care'), false)
  assert.equal(pets.greetVisitor(state.visitors), false)
  assert.equal(pets.waterVisitor(state, 'water').ok, false)
  state.visitors.board[0] = { route: 'cat', level: 1 }
  pets.feedVisitor(state, 0)
  assert.ok(pets.greetVisitor(state.visitors))
  assert.equal(pets.waterVisitor(state, 'milk').ok, false)
  assert.deepEqual(pets.waterVisitor(state, 'water'), { ok: true, coins: 8, unlocked: true })
  assert.equal(pets.waterVisitor(state, 'water').ok, false)
  for (const route of ['cat', 'care']) {
    assert.ok(pets.supplyPet(state.visitors, route)); assert.ok(pets.supplyPet(state.visitors, route))
    assert.ok(pets.mergePet(state.visitors, 0, 1))
    assert.ok(pets.supplyPet(state.visitors, route)); assert.ok(pets.supplyPet(state.visitors, route))
    assert.ok(pets.mergePet(state.visitors, 0, 2)); assert.ok(pets.mergePet(state.visitors, 1, 2))
    assert.equal(state.visitors.board[2].level, 2)
    assert.equal(pets.mergePet(state.visitors, 2, 2), false)
    state.visitors.board[2] = null
  }
  assert.ok(g.parseSave(JSON.stringify(state)))
})

test('daily species rewards cannot be farmed by re-entry; a new local day resets eligibility', () => {
  const state = g.newGame(), now = new Date(2026, 9, 15, 12).getTime()
  for (let i = 0; i < 8; i++) {
    pets.arrive(state.visitors, now, () => .25)
    const visit = state.visitors.current
    state.visitors.board[0] = { route: visit.animal, level: visit.wants }
    assert.equal(pets.feedVisitor(state, 0, now).coins, i < 4 ? 12 : 0)
    pets.greetVisitor(state.visitors)
    assert.equal(pets.waterVisitor(state, 'water', now).coins, i < 4 ? 8 : 0)
  }
  assert.equal(state.coins, 80)
  assert.equal(state.visitors.points, 16)
  pets.arrive(state.visitors, now + j.DAY, () => .25)
  assert.deepEqual(state.visitors.fedToday, [])
  assert.deepEqual(state.visitors.helpedToday, [])
  const visit = state.visitors.current
  state.visitors.board[0] = { route: visit.animal, level: visit.wants }
  assert.equal(pets.feedVisitor(state, 0, now + j.DAY).coins, 12)
})

test('visitor saves reject unknown animals, invalid tiles, duplicate ledgers and locked routes', () => {
  for (const mutate of [s => s.visitors.met = ['dragon'], s => s.visitors.queue = ['cat', 'cat'], s => s.visitors.points = -1,
    s => s.visitors.board[0] = { route: 'care', level: 0 }, s => s.visitors.board[0] = { route: 'cat', level: 2 },
    s => s.visitors.current.secret = 'done', s => s.visitors.board[0] = { route: 'cat', level: 9 }]) {
    const state = g.newGame(); pets.arrive(state.visitors); mutate(state)
    assert.equal(g.parseSave(JSON.stringify(state)), null)
  }
})

test('expanded stores cover 54 unique orders and all 44 goods with bounded shelves',()=>{
  assert.equal(stores.STORE_ORDER_COUNT,54)
  assert.equal(stores.productById.tomato.many,'tomatoes')
  assert.equal(stores.productById['orange-shirt'].one,'an orange shirt')
  assert.equal(stores.productById['orange-hat'].one,'an orange hat')
  assert.ok(stores.storeOrders('supermarket',5).some(o=>o.request.includes('two tomatoes')))
  for(const shop of stores.storeList) {
    const signatures=new Set(),seen=new Set()
    for(let round=1;round<=6;round++) {
      const session=stores.newSession(shop.id,round,(round-1)*3)
      assert.ok(session.shelf.length<=31)
      for(const order of stores.storeOrders(shop.id,round)) {
        signatures.add(order.lines.map(l=>l.product+':'+l.count).join('|'))
        assert.ok(order.lines.reduce((sum,l)=>sum+l.count,0)<=6)
        for(const line of order.lines) seen.add(line.product)
      }
    }
    assert.equal(signatures.size,18)
    assert.deepEqual([...seen].sort(),[...shop.goods].sort(),shop.id)
  }
})
test('v8 save expansion keeps every high-round partial task and currency, then serves new content',()=>{
  const old=g.newGame(),round=8
  for(const shop of stores.storeList) old.stores.sessions[shop.id]=stores.newSession(shop.id,round,21,0,round+1)
  stores.takeProduct(old.stores.sessions.fashion,'red-shirt')
  const k=load('kitchen'),d=load('delivery'),f=load('fishing'),c=load('care'),farm=load('farm')
  old.kitchen={...k.newKitchen(),round,contentFrom:9,step:2,independent:7,completed:['sandwich','fruit-cup','breakfast'],helped:true}
  old.delivery={...d.newDelivery(),round,contentFrom:9,independent:7,stamps:d.deliveryRoutes.slice(0,3).map(r=>r.id)}
  d.actDelivery(old,'pickup');d.actDelivery(old,d.deliveryActions(old.delivery)[1])
  old.fishing={...f.newFishing(),round,contentFrom:9,independent:7,collection:[...new Set(f.fishingSets.slice(0,3).flat())]}
  f.catchFish(old,f.currentFishingTarget(old.fishing).id)
  old.care={...c.newCare(),round,contentFrom:9,step:1,independent:7,friends:['cat','dog','rabbit'],memories:['cat','dog','rabbit'],helped:true}
  old.farm={...farm.newFarm(),round,contentFrom:9,independent:7,completed:['carrot','tomato','sunflower'],produce:{...farm.newFarm().produce,carrot:6,tomato:6,sunflower:4}}
  farm.chooseFarmTool(old.farm,'tomato');farm.actFarmPlot(old,0)
  old.coins=432;old.progress.xp=321;old.version=8
  removeLoopSchedule(old)
  for(const field of ['delivery','fishing','care','farm']) delete old[field].contentFrom
  delete old.care.memories
  for(const key of ['strawberry','corn','pumpkin','cucumber','pea']) delete old.farm.produce[key]
  for(const chapter of load('room').roomChapters.slice(3)) delete old.room.sessions[chapter.id]
  for(const scene of load('adventure').adventureScenes.slice(6)) delete old.adventure.sessions[scene.id]
  const upgraded=g.parseSave(JSON.stringify(old));assert.ok(upgraded)
  for(const field of ['coins','progress','boards','recall','journey','visitors']) assert.deepEqual(upgraded[field],old[field],field)
  for(const field of ['kitchen','delivery','fishing','care','farm']) {
    assert.equal(upgraded[field].round,round)
    assert.equal(upgraded[field].contentFrom,round+1)
    for(const key of Object.keys(old[field])) {
      if(field==='farm'&&key==='produce') {for(const crop of ['carrot','tomato','sunflower']) assert.equal(upgraded.farm.produce[crop],old.farm.produce[crop])}
      else assert.deepEqual(upgraded[field][key],old[field][key],field+':'+key)
    }
  }
  assert.equal(k.currentRecipe(upgraded.kitchen).id,'fruit-cup')
  assert.equal(d.currentDeliveryRoute(upgraded.delivery).id,'bakery')
  assert.equal(c.currentCareStory(upgraded.care).id,'dog')
  assert.equal(farm.currentFarmQuest(upgraded.farm).id,'tomato')
  assert.deepEqual(g.parseSave(JSON.stringify(upgraded)),upgraded)
  while(!upgraded.kitchen.served) k.actKitchen(upgraded,k.currentKitchenStep(upgraded.kitchen).action)
  k.nextKitchenRound(upgraded.kitchen)
  assert.equal(k.currentRecipe(upgraded.kitchen).id,'veggie-sandwich')
  for(const action of d.deliveryActions(upgraded.delivery).slice(upgraded.delivery.step)) d.actDelivery(upgraded,action)
  d.nextDeliveryRound(upgraded.delivery);assert.equal(d.currentDeliveryRoute(upgraded.delivery).id,'library')
  assert.ok(g.parseSave(JSON.stringify(upgraded)))
  for(const field of ['stores','kitchen','room','delivery','fishing','care','farm','adventure']) {
    const corrupt=structuredClone(old);delete corrupt[field]
    assert.equal(g.parseSave(JSON.stringify(corrupt)),null,field)
  }
})
