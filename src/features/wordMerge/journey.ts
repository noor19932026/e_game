export const DAY = 24 * 60 * 60 * 1000
export const foods = [
  { id: 'bread', word: 'bread', meaning: '面包', phonetic: '/bred/' },
  { id: 'apple', word: 'apple', meaning: '苹果', phonetic: '/ˈæpəl/' },
  { id: 'milk', word: 'milk', meaning: '牛奶', phonetic: '/mɪlk/' },
  { id: 'water', word: 'water', meaning: '水', phonetic: '/ˈwɔːtə/' },
] as const
export type FoodId = typeof foods[number]['id']
export type OrderMode = 'picture' | 'listen'
export const picnicTasks = [
  { food: 'bread', quantity: 1, sentence: 'Some bread, please.', translation: '请给我一些面包。' },
  { food: 'apple', quantity: 2, sentence: 'Two apples, please.', translation: '请给我两个苹果。' },
  { food: 'milk', quantity: 1, sentence: 'A carton of milk, please.', translation: '请给我一盒牛奶。' },
  { food: 'water', quantity: 1, sentence: 'A bottle of water, please.', translation: '请给我一瓶水。' },
  { food: 'bread', quantity: 1, sentence: 'Put the bread in the bag.', translation: '把面包装进包里。' },
] as const
export const decorations = [
  { id: 'sage', category: 'awning', name: '鼠尾草绿雨棚', price: 24, unlock: 1, color: '#849b77' },
  { id: 'peach', category: 'awning', name: '蜜桃色雨棚', price: 24, unlock: 1, color: '#c97d62' },
  { id: 'bistro', category: 'sign', name: '野餐小馆招牌', price: 36, unlock: 5, color: '#e7bc67' },
  { id: 'flowers', category: 'plant', name: '窗边小花盆', price: 30, unlock: 5, color: '#b66f7b' },
] as const
export type DecorationId = typeof decorations[number]['id']
export interface MemoryRecord {
  helped: number
  independent: number
  retained: number
  lastSeen: number
  due: number
  pendingHelp: boolean
}
export interface JourneyState {
  step: number
  mode: OrderMode
  pantry: (FoodId | null)[]
  packed: Record<FoodId, number>
  memory: Partial<Record<FoodId, MemoryRecord>>
  owned: DecorationId[]
  equipped: Partial<Record<'awning' | 'sign' | 'plant', DecorationId>>
}
export function newJourney(): JourneyState {
  return { step: 0, mode: 'picture', pantry: Array(6).fill(null), packed: { bread: 0, apple: 0, milk: 0, water: 0 }, memory: {}, owned: [], equipped: {} }
}
export function isFood(id: unknown): id is FoodId { return foods.some(f => f.id === id) }
export function validJourney(value: unknown): value is JourneyState {
  if (!value || typeof value !== 'object') return false
  const j = value as JourneyState
  const count = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0
  return count(j.step) && j.step <= picnicTasks.length && ['picture', 'listen'].includes(j.mode)
    && Array.isArray(j.pantry) && j.pantry.length === 6 && j.pantry.every(id => id === null || isFood(id))
    && !!j.packed && foods.every(f => count(j.packed[f.id]))
    && !!j.memory && !Array.isArray(j.memory) && Object.entries(j.memory).every(([id, r]) => isFood(id) && !!r
      && [r.helped, r.independent, r.retained, r.lastSeen, r.due].every(count) && r.retained <= r.independent && typeof r.pendingHelp === 'boolean')
    && Array.isArray(j.owned) && new Set(j.owned).size === j.owned.length && j.owned.every(id => decorations.some(d => d.id === id && j.step >= d.unlock))
    && !!j.equipped && !Array.isArray(j.equipped) && Object.entries(j.equipped).every(([category, id]) => j.owned.includes(id) && decorations.some(d => d.id === id && d.category === category))
}
export function introduce(j: JourneyState, id: FoodId, now = Date.now()) {
  if (!j.memory[id]) j.memory[id] = { helped: 0, independent: 0, retained: 0, lastSeen: now, due: now + DAY, pendingHelp: false }
}
export function studyFood(j: JourneyState, id: FoodId, now = Date.now()) {
  introduce(j, id, now)
  j.memory[id]!.lastSeen = now; j.memory[id]!.due = now + DAY
}
export function collectFood(j: JourneyState, id: FoodId, now = Date.now()): boolean {
  if (!isFood(id)) return false
  const slot = j.pantry.indexOf(null)
  if (slot < 0) return false
  j.pantry[slot] = id; studyFood(j, id, now)
  return true
}
// Two portions remain the same food. Packing changes quantity, never the word's meaning.
export function packFood(j: JourneyState, from: number, to: number): boolean {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from === to || from < 0 || to < 0 || from >= 6 || to >= 6) return false
  const id = j.pantry[from]
  if (!id || j.pantry[to] !== id) return false
  j.pantry[from] = null; j.pantry[to] = null; j.packed[id] += 2
  return true
}
export function markHelp(j: JourneyState, id: FoodId, now = Date.now()) { introduce(j, id, now); j.memory[id]!.pendingHelp = true }
export function recordAnswer(j: JourneyState, id: FoodId, now = Date.now()) {
  introduce(j, id, now)
  const r = j.memory[id]!
  const delayed = now >= r.due && now - r.lastSeen >= DAY
  if (r.pendingHelp) r.helped++
  else { r.independent++; if (delayed) r.retained++ }
  r.lastSeen = now; r.due = now + (delayed && !r.pendingHelp ? 3 * DAY : DAY); r.pendingHelp = false
}
export function dueFoods(j: JourneyState, now = Date.now()): FoodId[] {
  return foods.filter(f => j.memory[f.id] && j.memory[f.id]!.due <= now).map(f => f.id)
}
export function finishPicnicTask(state: { journey: JourneyState; coins: number; progress?: { xp: number } }, food: FoodId, quantity: number, destination?: string, now = Date.now()): boolean {
  const j = state.journey, task = picnicTasks[j.step]
  if (!task || food !== task.food || quantity !== task.quantity || (j.step === 4 && destination !== 'bag')) return false
  // Story food is prepared directly by tapping its picture. Legacy pantry data is
  // retained in saves, but never gates the story behind a second merge board.
  recordAnswer(j, food, now); j.step++; state.coins += 12
  if (j.step === picnicTasks.length) state.coins += 20
  if (state.progress) state.progress.xp += 8 + (j.step === picnicTasks.length ? 20 : 0)
  return true
}
export function buyDecoration(state: { journey: JourneyState; coins: number }, id: DecorationId): boolean {
  const item = decorations.find(d => d.id === id), j = state.journey
  if (!item || j.step < item.unlock || j.owned.includes(id) || state.coins < item.price) return false
  state.coins -= item.price; j.owned.push(id); j.equipped[item.category] = id
  return true
}
export function equipDecoration(j: JourneyState, id: DecorationId): boolean {
  const item = decorations.find(d => d.id === id)
  if (!item || !j.owned.includes(id)) return false
  j.equipped[item.category] = id; return true
}
