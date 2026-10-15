import { chainActions, districts, isTerminal, themeDistrict, themePhrases, themeWords, wordById, themes, type DistrictId, type ThemeId } from './catalog'
import { newJourney, validJourney, type JourneyState } from './journey'
import { newVisitors, validVisitors, type VisitorState } from './visitors'

export const BOARD_SIZE = 25
// Keep the original key so earlier demo saves can be migrated in place.
export const SAVE_KEY = 'epartner-word-merge-v1'
export interface GameState {
  version: 4
  journey: JourneyState
  visitors: VisitorState
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
    district.themes.forEach((theme, index) => { board[6 + index * 5] = `${theme}-0`; board[7 + index * 5] = `${theme}-0` })
    return [district.id, board]
  })) as GameState['boards']
  return { version: 4, journey: newJourney(), visitors: newVisitors(), district: 'cafe', boards, discovered: themes.map(t => `${t.id}-0`),
    recall: {}, actionRecall: {}, phraseRecall: {}, coins: 0, merges: 0, deliveries: 0,
    orderStep: Object.fromEntries(themes.map(t => [t.id, 0])) as Record<ThemeId, number> }
}
export function currentBoard(state: GameState) { return state.boards[state.district] }
export function switchDistrict(state: GameState, district: DistrictId) { state.district = district }

export function parseSave(raw: string): GameState | null {
  try {
    const value = JSON.parse(raw)
    const counter = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0
    const boardValid = (board: unknown, district: DistrictId) => Array.isArray(board) && board.length === BOARD_SIZE
      && board.every(id => id === null || typeof id === 'string' && !!wordById[id] && themeDistrict(wordById[id]!.theme) === district)
    const recordValid = (record: unknown, validKey: (id: string) => boolean) => !!record && typeof record === 'object' && !Array.isArray(record)
      && Object.entries(record).every(([id, count]) => validKey(id) && counter(count))
    if (!value || ![value.coins, value.merges, value.deliveries].every(counter)
      || !Array.isArray(value.discovered) || !value.discovered.every((id: unknown) => typeof id === 'string' && !!wordById[id])
      || !recordValid(value.recall, id => !!wordById[id]) || !value.orderStep) return null
    if (value.version === 1) {
      if (!boardValid(value.board, 'cafe') || !['coffee', 'garden', 'bakery'].every(id => counter(value.orderStep[id]))
        || !value.board.every((id: string | null) => id === null || value.discovered.includes(id))) return null
      const migrated = newGame()
      migrated.boards.cafe = value.board
      migrated.discovered = [...new Set<string>([...migrated.discovered, ...value.discovered])]
      migrated.recall = value.recall
      for (const id of ['coffee', 'garden', 'bakery'] as ThemeId[]) migrated.orderStep[id] = value.orderStep[id]
      migrated.coins = value.coins; migrated.merges = value.merges; migrated.deliveries = value.deliveries
      return migrated
    }
    const actionKeys = new Set(themes.flatMap(t => chainActions[t.id].map((_, i) => `${t.id}-${i}`)))
    const phraseKeys = new Set(themes.flatMap(t => themePhrases[t.id].map((_, i) => `${t.id}-${i}`)))
    if (![2, 3, 4].includes(value.version) || !districts.some(d => d.id === value.district) || !value.boards
      || !districts.every(d => boardValid(value.boards[d.id], d.id)
        && value.boards[d.id].every((id: string | null) => id === null || value.discovered.includes(id)))
      || !themes.every(t => counter(value.orderStep[t.id]))
      || !recordValid(value.actionRecall, id => actionKeys.has(id)) || !recordValid(value.phraseRecall, id => phraseKeys.has(id))) return null
    if (value.version >= 3 && !validJourney(value.journey) || value.version === 4 && !validVisitors(value.visitors)) return null
    return { ...value, version: 4, journey: value.version === 2 ? newJourney() : value.journey,
      visitors: value.version === 4 ? value.visitors : newVisitors(), discovered: [...new Set<string>(value.discovered)] } as GameState
  } catch { return null }
}
export function mergeResult(board: (string | null)[], from: number, to: number): string | null {
  if (from === to || !Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= BOARD_SIZE || to >= BOARD_SIZE) return null
  const id = board[from]
  if (!id || board[to] !== id || isTerminal(id)) return null
  const word = wordById[id]
  return word ? `${word.theme}-${word.level + 1}` : null
}
export function mergeTiles(state: GameState, from: number, to: number): string | null {
  const board = currentBoard(state)
  const result = mergeResult(board, from, to)
  if (!result) return null
  board[from] = null; board[to] = result
  state.merges++; state.coins += 2
  if (!state.discovered.includes(result)) state.discovered.push(result)
  return result
}
export function supply(state: GameState, theme: ThemeId): number {
  if (themeDistrict(theme) !== state.district) return -1
  const board = currentBoard(state)
  const index = board.indexOf(null)
  if (index < 0) return -1
  const id = `${theme}-0`
  board[index] = id
  if (!state.discovered.includes(id)) state.discovered.push(id)
  return index
}
export function orderWord(state: GameState, theme: ThemeId): string {
  const candidates = themeWords(theme).slice(Math.max(1, themeWords(theme).length - 3))
  return candidates[state.orderStep[theme] % candidates.length]!.id
}
export function deliver(state: GameState, theme: ThemeId): boolean {
  if (themeDistrict(theme) !== state.district) return false
  const board = currentBoard(state)
  const index = board.indexOf(orderWord(state, theme))
  if (index < 0) return false
  board[index] = null
  state.orderStep[theme]++; state.deliveries++; state.coins += 20
  return true
}
