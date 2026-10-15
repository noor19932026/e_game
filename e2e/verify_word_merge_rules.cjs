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
    if (!['./catalog', './journey', './visitors'].includes(id)) throw new Error('Unexpected module: ' + id)
    return load(id.slice(2))
  }, module, module.exports)
  return module.exports
}
const c = load('catalog')
const g = load('game')
const j = load('journey')

test('the eight chains have coherent actions, unique IDs, playable order sentences, and 74 vocabulary targets', () => {
  assert.equal(c.themes.length, 8)
  assert.deepEqual(c.vocabularyStats, { objects: 35, actionEntries: 27, phrases: 16, unique: 74 })
  assert.equal(new Set(c.words.map(w => w.id)).size, c.words.length)
  for (const theme of c.themes) {
    const chain = c.themeWords(theme.id)
    assert.equal(c.chainActions[theme.id].length, chain.length - 1)
    chain.forEach((word, index) => {
      assert.equal(word.level, index)
      assert.ok(word.sentence.toLowerCase().includes(word.word.toLowerCase()), `Order sentence lacks ${word.word}`)
      assert.equal(c.isTerminal(word.id), index === chain.length - 1)
      const choices = c.meaningChoices(word)
      assert.equal(choices.length, 3)
      assert.equal(new Set(choices).size, 3)
      assert.ok(choices.includes(word.meaning))
    })
    for (const phrase of c.themePhrases[theme.id]) {
      assert.equal(phrase.prompt.replace('_____', phrase.answer), phrase.phrase)
      assert.ok(phrase.options.includes(phrase.answer))
      assert.equal(new Set(phrase.options).size, 3)
    }
  }
})

test('every chain reaches its configured terminal through actual supply and merge rules', () => {
  const state = g.newGame()
  for (const theme of c.themes) {
    g.switchDistrict(state, c.themeDistrict(theme.id))
    const terminal = c.themeWords(theme.id).at(-1).id
    let steps = 0
    while (!g.currentBoard(state).includes(terminal)) {
      const board = g.currentBoard(state)
      const counts = new Map()
      let pair = null
      for (let i = 0; i < board.length; i++) {
        const id = board[i]
        if (!id || c.wordById[id].theme !== theme.id || c.isTerminal(id)) continue
        if (counts.has(id)) { pair = [counts.get(id), i]; break }
        counts.set(id, i)
      }
      if (pair) assert.ok(g.mergeTiles(state, ...pair))
      else assert.notEqual(g.supply(state, theme.id), -1)
      assert.ok(++steps < 70)
    }
  }
  assert.equal(state.discovered.length, 35)
  assert.ok(g.parseSave(JSON.stringify(state)))
})

test('four-level terminal items do not create a phantom fifth level', () => {
  const state = g.newGame()
  g.switchDistrict(state, 'market')
  const board = g.currentBoard(state)
  board[0] = board[1] = 'juice-3'
  const before = JSON.stringify(state)
  assert.equal(g.mergeTiles(state, 0, 1), null)
  assert.equal(JSON.stringify(state), before)
  assert.equal(g.mergeResult(board, 0, 0), null)
  assert.equal(g.mergeResult(board, -1, 0), null)
  assert.equal(g.mergeResult(board, 0, 25), null)
})

test('street boards remain independent; supplies and deliveries cannot affect parked streets', () => {
  const state = g.newGame()
  g.mergeTiles(state, 6, 7)
  const cafe = [...state.boards.cafe]
  g.switchDistrict(state, 'workshop')
  assert.equal(g.supply(state, 'coffee'), -1)
  assert.equal(g.deliver(state, 'coffee'), false)
  g.mergeTiles(state, 6, 7)
  assert.deepEqual(state.boards.cafe, cafe)
  g.switchDistrict(state, 'cafe')
  assert.deepEqual(g.currentBoard(state), cafe)
})

test('orders cycle through existing levels, and only a successful delivery earns coins', () => {
  const state = g.newGame()
  for (const theme of c.themes) {
    g.switchDistrict(state, c.themeDistrict(theme.id))
    const expected = c.themeWords(theme.id).slice(-3).map(w => w.id)
    for (let step = 0; step < 7; step++) {
      assert.equal(g.orderWord(state, theme.id), expected[step % 3])
      const id = g.orderWord(state, theme.id)
      // Isolate an absent-order attempt before adding its tile.
      state.boards[state.district] = Array(g.BOARD_SIZE).fill(null)
      const before = state.coins
      assert.equal(g.deliver(state, theme.id), false)
      assert.equal(state.coins, before)
      g.currentBoard(state)[0] = id
      assert.equal(g.deliver(state, theme.id), true)
      assert.equal(g.currentBoard(state)[0], null)
      assert.equal(state.coins, before + 20)
    }
  }
  assert.equal(state.deliveries, 56)
})

test('old saves retain boards, counters, word recall, and order position when upgraded', () => {
  const old = { version: 1, board: Array(25).fill(null), discovered: ['coffee-0', 'garden-0', 'bakery-0', 'coffee-1'], recall: { 'coffee-1': 2 }, coins: 42, merges: 8, deliveries: 1, orderStep: { coffee: 1, garden: 0, bakery: 0 } }
  old.board[7] = 'coffee-1'
  const upgraded = g.parseSave(JSON.stringify(old))
  assert.equal(upgraded.version, 4)
  assert.deepEqual(upgraded.boards.cafe, old.board)
  assert.equal(upgraded.coins, 42)
  assert.equal(upgraded.merges, 8)
  assert.equal(upgraded.deliveries, 1)
  assert.equal(upgraded.recall['coffee-1'], 2)
  assert.equal(upgraded.orderStep.coffee, 1)
  assert.equal(upgraded.boards.market[6], 'juice-0')
  assert.deepEqual(upgraded.actionRecall, {})
  assert.deepEqual(g.parseSave(JSON.stringify(upgraded)), upgraded)
})

test('invalid saves and cross-street tiles are rejected without modifying game data', () => {
  assert.equal(g.parseSave('{broken'), null)
  assert.equal(g.parseSave('null'), null)
  for (const mutate of [s => s.coins = -1, s => s.boards.cafe.pop(), s => s.boards.cafe[0] = 'juice-0', s => s.district = 'unknown', s => s.actionRecall['unknown-0'] = 1, s => s.phraseRecall['coffee-20'] = 1]) {
    const state = g.newGame()
    mutate(state)
    assert.equal(g.parseSave(JSON.stringify(state)), null)
  }
})

test('v2 migration preserves all street data and adds a fresh journey without invented recall', () => {
  const state = g.newGame()
  g.mergeTiles(state, 6, 7)
  state.recall['coffee-1'] = 4; state.coins = 81
  const { journey, ...old } = state
  old.version = 2
  const upgraded = g.parseSave(JSON.stringify(old))
  assert.deepEqual(upgraded, { ...old, version: 4, journey: j.newJourney(), visitors: load('visitors').newVisitors() })
  assert.deepEqual(upgraded.journey.memory, {})
})

test('picnic packing preserves food identity, enforces quantities, and rewards each task once', () => {
  const state = g.newGame(), now = 100000
  for (const food of j.foods) {
    assert.equal(j.collectFood(state.journey, food.id, now), true)
    assert.equal(j.collectFood(state.journey, food.id, now), true)
    assert.equal(j.packFood(state.journey, 0, 1), true)
    assert.equal(state.journey.packed[food.id], 2)
  }
  assert.equal(j.packFood(state.journey, 0, 0), false)
  assert.equal(j.packFood(state.journey, -1, 1), false)
  assert.equal(j.finishPicnicTask(state, 'apple', 2, undefined, now), false)
  assert.equal(j.finishPicnicTask(state, 'bread', 2, undefined, now), false)
  for (const task of j.picnicTasks) {
    if (state.journey.step === 4) {
      assert.equal(j.finishPicnicTask(state, 'bread', 1, 'table', now), false)
      assert.equal(state.journey.packed.bread, 1)
    }
    assert.equal(j.finishPicnicTask(state, task.food, task.quantity, 'bag', now), true)
  }
  assert.equal(state.coins, 80)
  assert.equal(state.journey.packed.bread, 1)
  assert.equal(state.journey.packed.apple, 0)
  assert.equal(j.finishPicnicTask(state, 'bread', 1, 'bag', now), false)
  assert.ok(g.parseSave(JSON.stringify(state)))
})

test('missing food never consumes coins, rewards, or chapter progress; full pantry can recover', () => {
  const state = g.newGame()
  assert.equal(j.finishPicnicTask(state, 'bread', 1), false)
  assert.equal(state.coins, 0); assert.equal(state.journey.step, 0)
  for (let i = 0; i < 6; i++) assert.ok(j.collectFood(state.journey, 'apple'))
  assert.equal(j.collectFood(state.journey, 'bread'), false)
  assert.ok(j.packFood(state.journey, 0, 1))
  assert.ok(j.collectFood(state.journey, 'bread'))
  assert.equal(j.packFood(state.journey, 0, 2), false)
})

test('review separates helped, independent and delayed recall; reload cannot erase a hint', () => {
  let state = g.newGame()
  const now = 100000
  j.introduce(state.journey, 'apple', now)
  assert.deepEqual(j.dueFoods(state.journey, now + j.DAY - 1), [])
  assert.deepEqual(j.dueFoods(state.journey, now + j.DAY), ['apple'])
  j.markHelp(state.journey, 'apple', now + j.DAY)
  state = g.parseSave(JSON.stringify(state))
  j.recordAnswer(state.journey, 'apple', now + j.DAY)
  assert.equal(state.journey.memory.apple.helped, 1)
  assert.equal(state.journey.memory.apple.independent, 0)
  assert.equal(state.journey.memory.apple.retained, 0)
  j.recordAnswer(state.journey, 'apple', now + j.DAY + 1)
  assert.equal(state.journey.memory.apple.independent, 1)
  assert.equal(state.journey.memory.apple.retained, 0)
  j.recordAnswer(state.journey, 'apple', now + 2 * j.DAY + 1)
  assert.equal(state.journey.memory.apple.retained, 1)
  assert.equal(state.journey.memory.apple.due, now + 5 * j.DAY + 1)
  j.studyFood(state.journey, 'apple', now + 5 * j.DAY)
  assert.deepEqual(j.dueFoods(state.journey, now + 5 * j.DAY + 1), [])
})

test('decoration purchases honor chapter unlocks and balance; repeat equip is free', () => {
  const state = g.newGame(); state.coins = 100
  assert.equal(j.buyDecoration(state, 'peach'), false)
  state.journey.step = 1
  assert.equal(j.buyDecoration(state, 'bistro'), false)
  assert.ok(j.buyDecoration(state, 'peach'))
  assert.equal(state.coins, 76)
  assert.equal(j.buyDecoration(state, 'peach'), false)
  assert.ok(j.equipDecoration(state.journey, 'peach'))
  assert.equal(j.equipDecoration(state.journey, 'bistro'), false)
  state.journey.step = 5
  assert.ok(j.buyDecoration(state, 'bistro'))
  assert.equal(state.coins, 40)
  assert.ok(g.parseSave(JSON.stringify(state)))
})

test('v4 malformed chapter, memory, pantry and decoration saves are rejected', () => {
  for (const mutate of [s => s.journey.step = 6, s => s.journey.pantry[0] = 'coffee-0', s => s.journey.packed.apple = -1,
    s => s.journey.owned = ['bistro'], s => s.journey.equipped.awning = 'peach',
    s => s.journey.memory.apple = { helped: 0, independent: 0, retained: 1, lastSeen: 0, due: 0, pendingHelp: false }]) {
    const state = g.newGame(); mutate(state)
    assert.equal(g.parseSave(JSON.stringify(state)), null)
  }
})

const pets = load('visitors')
test('v3 saves retain chapter, purchases, memory and all boards when adding free visitors', () => {
  const state = g.newGame()
  state.journey.step = 5
  state.coins = 88
  j.buyDecoration(state, 'sage')
  j.introduce(state.journey, 'apple', 100000)
  const { visitors, ...old } = state; old.version = 3
  const upgraded = g.parseSave(JSON.stringify(old))
  assert.deepEqual(upgraded, { ...old, version: 4, visitors: pets.newVisitors() })
  assert.equal(upgraded.journey.equipped.awning, 'sage')
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
