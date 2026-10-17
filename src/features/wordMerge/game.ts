import { chainActions, combinationRecipes, districts, isTerminal, themeDistrict, themePhrases, themeWords, wordById, themes, type DistrictId, type ThemeId } from './catalog'
import { newJourney, validJourney, type JourneyState } from './journey'
import { newVisitors, validVisitors, type VisitorState } from './visitors'
import { newProgress, validProgress, shopGoals, type ShopProgress } from './progress'
import { newStores, validStores, migrateStoresV8, type StoresState } from './stores'
import { newKitchen, validKitchen, migrateKitchenV8, type KitchenState } from './kitchen'
import { newRoom, validRoom, migrateRoomV8, type RoomState } from './room'
import { newDelivery, validDelivery, type DeliveryState } from './delivery'
import { newFishing, validFishing, type FishingState } from './fishing'
import { newCare, validCare, migrateCareV8, type CareState } from './care'
import { newFarm, validFarm, migrateFarmV8, type FarmState } from './farm'
import { newAdventure, validAdventure, migrateAdventureV8, type AdventureState } from './adventure'

export const BOARD_COLUMNS = 6
export const BOARD_ROWS = 8
export const BOARD_SIZE = BOARD_COLUMNS * BOARD_ROWS
export const SAVE_KEY = 'epartner-word-merge-v1'
export interface GameState {
  version: 9
  delivery: DeliveryState
  fishing: FishingState
  care: CareState
  farm: FarmState
  adventure: AdventureState
  kitchen: KitchenState
  room: RoomState
  stores: StoresState
  journey: JourneyState
  visitors: VisitorState
  progress: ShopProgress
  district: DistrictId
  boards: Record<DistrictId, (string | null)[]>
  discovered: string[]
  recall: Record<string, number>
  actionRecall: Record<string, number>
  phraseRecall: Record<string, number>
  coins: number
  merges: number
  deliveries: number
  orderStep: Record<ThemeId, number>
}
export function newGame(): GameState {
  const boards = Object.fromEntries(districts.map(district => {
    const board: (string | null)[] = Array(BOARD_SIZE).fill(null)
    district.themes.forEach((theme, index) => { board[7 + index * BOARD_COLUMNS] = `${theme}-0`; board[8 + index * BOARD_COLUMNS] = `${theme}-0` })
    return [district.id, board]
  })) as GameState['boards']
  return { version: 9, delivery:newDelivery(), fishing:newFishing(), care:newCare(), farm:newFarm(), adventure:newAdventure(), kitchen:newKitchen(), room:newRoom(), stores:newStores(), journey: newJourney(), visitors: newVisitors(), progress: newProgress(), district: 'cafe', boards,
    discovered: themes.map(t => `${t.id}-0`), recall: {}, actionRecall: {}, phraseRecall: {}, coins: 0, merges: 0, deliveries: 0,
    orderStep: Object.fromEntries(themes.map(t => [t.id, 0])) as Record<ThemeId, number> }
}
export function currentBoard(state: GameState) { return state.boards[state.district] }
export function switchDistrict(state: GameState, district: DistrictId) { state.district = district }
export function expandLegacyBoard(board: (string | null)[]) {
  const expanded: (string | null)[] = Array(BOARD_SIZE).fill(null)
  board.forEach((id, i) => { expanded[Math.floor(i / 5) * BOARD_COLUMNS + i % 5] = id })
  return expanded
}
export function parseSave(raw: string): GameState | null {
  try {
    const value = JSON.parse(raw)
    const counter = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0
    const legacy = value?.version < 5
    const boardValid = (board: unknown, district: DistrictId) => Array.isArray(board) && board.length === (legacy ? 25 : BOARD_SIZE)
      && board.every(id => id === null || typeof id === 'string' && !!wordById[id] && themeDistrict(wordById[id]!.theme) === district && value.discovered.includes(id))
    const recordValid = (record: unknown, validKey: (id: string) => boolean) => !!record && typeof record === 'object' && !Array.isArray(record)
      && Object.entries(record).every(([id, count]) => validKey(id) && counter(count))
    if (!value || ![1, 2, 3, 4, 5, 6, 7, 8, 9].includes(value.version) || ![value.coins, value.merges, value.deliveries].every(counter)
      || !Array.isArray(value.discovered) || !value.discovered.every((id: unknown) => typeof id === 'string' && !!wordById[id])
      || !recordValid(value.recall, id => !!wordById[id]) || !value.orderStep) return null
    if(value.version<=8) {
      // Preserve the in-flight classic round, then start the newly added content.
      if(value.version>=6) value.stores=migrateStoresV8(value.stores)
      if(value.version>=7) { value.kitchen=migrateKitchenV8(value.kitchen); value.room=migrateRoomV8(value.room) }
      if(value.version>=8) {
        if(value.delivery && typeof value.delivery==='object') value.delivery={...value.delivery,contentFrom:value.delivery.round+1}
        if(value.fishing && typeof value.fishing==='object') value.fishing={...value.fishing,contentFrom:value.fishing.round+1}
        value.care=migrateCareV8(value.care); value.farm=migrateFarmV8(value.farm); value.adventure=migrateAdventureV8(value.adventure)
      }
    }
    const migrated = newGame()
    migrated.progress.xp = Math.min(Number.MAX_SAFE_INTEGER, value.merges * 3 + value.deliveries * 12)
    if (value.version === 1) {
      if (!boardValid(value.board, 'cafe') || !['coffee', 'garden', 'bakery'].every(id => counter(value.orderStep[id]))) return null
      migrated.boards.cafe = expandLegacyBoard(value.board)
    } else {
      const actionKeys = new Set(themes.flatMap(t => chainActions[t.id].map((_, i) => `${t.id}-${i}`)))
      const phraseKeys = new Set(themes.flatMap(t => themePhrases[t.id].map((_, i) => `${t.id}-${i}`)))
      if (!districts.some(d => d.id === value.district) || !value.boards || !districts.every(d => boardValid(value.boards[d.id], d.id))
        || !recordValid(value.actionRecall, id => actionKeys.has(id)) || !recordValid(value.phraseRecall, id => phraseKeys.has(id))
        || value.version >= 3 && !validJourney(value.journey) || value.version >= 4 && !validVisitors(value.visitors)
        || value.version >= 5 && !validProgress(value.progress) || value.version >= 6 && !validStores(value.stores)
        || value.version >= 7 && (!validKitchen(value.kitchen) || !validRoom(value.room))
        || value.version >= 8 && (!validDelivery(value.delivery) || !validFishing(value.fishing) || !validCare(value.care) || !validFarm(value.farm) || !validAdventure(value.adventure))) return null
      migrated.district = value.district
      for (const d of districts) migrated.boards[d.id] = legacy ? expandLegacyBoard(value.boards[d.id]) : value.boards[d.id]
      migrated.actionRecall = value.actionRecall; migrated.phraseRecall = value.phraseRecall
      if (value.version >= 3) migrated.journey = value.journey
      if (value.version >= 4) migrated.visitors = value.visitors
      if (value.version >= 5) migrated.progress = value.progress
      if (value.version >= 6) migrated.stores = value.stores
      if (value.version >= 7) { migrated.kitchen = value.kitchen; migrated.room = value.room }
      if (value.version >= 8) { migrated.delivery=value.delivery; migrated.fishing=value.fishing; migrated.care=value.care; migrated.farm=value.farm; migrated.adventure=value.adventure }
    }
    const oldThemes = ['coffee', 'garden', 'bakery', 'juice', 'clothes', 'paper', 'pottery', 'kitchen']
    const required = value.version === 1 ? ['coffee', 'garden', 'bakery'] : legacy ? oldThemes : themes.map(t => t.id)
    if (!required.every(id => counter(value.orderStep[id]))) return null
    for (const t of themes) migrated.orderStep[t.id] = counter(value.orderStep[t.id]) ? value.orderStep[t.id] : 0
    migrated.discovered = [...new Set<string>([...migrated.discovered, ...value.discovered])]
    migrated.recall = value.recall; migrated.coins = value.coins; migrated.merges = value.merges; migrated.deliveries = value.deliveries
    return migrated
  } catch { return null }
}
export function mergeResult(board: (string | null)[], from: number, to: number): string | null {
  if (from === to || !Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= board.length || to >= board.length) return null
  const id = board[from], target = board[to]
  if (!id || !target) return null
  if (id !== target) return combinationRecipes.find(r => r.ingredients.includes(id as never) && r.ingredients.includes(target as never))?.result || null
  if (isTerminal(id)) return null
  const word = wordById[id]
  return word ? `${word.theme}-${word.level + 1}` : null
}
export function mergeTiles(state: GameState, from: number, to: number): string | null {
  const board = currentBoard(state), result = mergeResult(board, from, to)
  if (!result) return null
  const combination = board[from] !== board[to], isNew = !state.discovered.includes(result)
  board[from] = null; board[to] = result
  state.merges++; state.coins += combination ? 5 : 2
  state.progress.xp += (combination ? 10 : 3) + (isNew ? 8 : 0)
  if (combination) state.progress.combinations++
  if (isNew) state.discovered.push(result)
  return result
}
export function supplyLevel(state: GameState, theme: ThemeId) { return Math.min(2, Math.floor(state.orderStep[theme] / 3)) }
export function supplyWord(state: GameState, theme: ThemeId, basic = false) { return `${theme}-${basic ? 0 : supplyLevel(state, theme)}` }
export function supply(state: GameState, theme: ThemeId, basic = false): number {
  if (themeDistrict(theme) !== state.district) return -1
  const board = currentBoard(state), index = board.indexOf(null)
  if (index < 0) return -1
  const id = supplyWord(state, theme, basic)
  board[index] = id
  if (!state.discovered.includes(id)) state.discovered.push(id)
  return index
}
export function orderWord(state: GameState, theme: ThemeId): string {
  const chain = themeWords(theme), step = state.orderStep[theme]
  const highest = Math.min(chain.length - 1, 2 + Math.floor(step / 2))
  const lowest = Math.max(1, supplyLevel(state, theme))
  return chain[lowest + step % (highest - lowest + 1)]!.id
}
export function deliver(state: GameState, theme: ThemeId): boolean {
  if (themeDistrict(theme) !== state.district) return false
  const board = currentBoard(state), index = board.indexOf(orderWord(state, theme))
  if (index < 0) return false
  board[index] = null; state.orderStep[theme]++; state.deliveries++; state.coins += 20; state.progress.xp += 12
  return true
}
export function goalProgress(state: GameState, kind: typeof shopGoals[number]['kind']) {
  if (kind === 'discoveries') return state.discovered.filter(id => wordById[id]!.level > 0).length
  if (kind === 'combinations') return state.progress.combinations
  return state[kind]
}
export function claimShopGoal(state: GameState, id: string): boolean {
  const goal = shopGoals.find(g => g.id === id)
  if (!goal || state.progress.claimed.includes(id) || goalProgress(state, goal.kind) < goal.target) return false
  state.progress.claimed.push(id); state.coins += goal.reward; state.progress.xp += 10
  return true
}
