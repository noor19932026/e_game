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
    if (id !== './catalog') throw new Error('Unexpected module: ' + id)
    return load('catalog')
  }, module, module.exports)
  return module.exports
}
const c = load('catalog')
const g = load('game')

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
  assert.equal(upgraded.version, 2)
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
