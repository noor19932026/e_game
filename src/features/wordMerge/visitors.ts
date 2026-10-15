export const animals = [
  { id: 'cat', name: 'Mochi', label: '小猫', word: 'cat', color: '#d3a077', greeting: 'Hello! I am Mochi.', hint: '为 Mochi 准备营养均衡的猫粮，再添一碗清水。', source: 'https://www.rspca.org.uk/adviceandwelfare/pets/cats/diet' },
  { id: 'dog', name: 'Biscuit', label: '小狗', word: 'dog', color: '#bc9472', greeting: 'Woof! Nice to meet you.', hint: 'Biscuit 今天想吃犬用全价粮，清水也要随时备好。', source: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/diet' },
  { id: 'rabbit', name: 'Clover', label: '小兔', word: 'rabbit', color: '#c6b7a4', greeting: 'Hello! May I sit here?', hint: 'Clover 喜欢新鲜、干净的干草；干草是兔子日常饮食的主要部分。', source: 'https://www.rspca.org.uk/adviceandwelfare/pets/rabbits/diet' },
  { id: 'bird', name: 'Pip', label: '小鹦鹉', word: 'budgie', color: '#93aaa0', greeting: 'Tweet! What a lovely shop!', hint: '给 Pip 准备适合虎皮鹦鹉的配方颗粒粮，配一小碗清水。', source: 'https://www.rspca.org.uk/adviceandwelfare/pets/birds/diet' },
] as const
export type AnimalId = typeof animals[number]['id']
export type PetRoute = AnimalId | 'care'
export const petRecipes: Record<PetRoute, { name: string; color: string; words: readonly string[]; meanings: readonly string[] }> = {
  cat: { name: '猫咪餐点', color: '#c99d79', words: ['cat food', 'a bowl of cat food', 'cat picnic box'], meanings: ['猫粮小份', '一碗猫粮', '猫咪野餐盒'] },
  dog: { name: '小狗餐点', color: '#c3a26b', words: ['dog food', 'a bowl of dog food', 'dog picnic box'], meanings: ['犬粮小份', '一碗犬粮', '小狗野餐盒'] },
  rabbit: { name: '干草备餐', color: '#9da66a', words: ['hay', 'a basket of hay', 'hay picnic box'], meanings: ['干草小把', '一篮干草', '干草野餐盒'] },
  bird: { name: '小鸟餐点', color: '#8ea9a2', words: ['bird food', 'a dish of bird food', 'bird picnic box'], meanings: ['鸟用配方粮小份', '一碟鸟用配方粮', '小鸟野餐盒'] },
  care: { name: '温柔照料', color: '#b6a1b8', words: ['cloth', 'soft towel', 'pet cushion'], meanings: ['布料', '柔软毛巾', '小动物坐垫'] },
}
export interface PetTile { route: PetRoute; level: number }
export interface Visit { animal: AnimalId; number: number; served: boolean; secret: 'locked' | 'found' | 'done'; wants: 1 | 2 }
export interface VisitorState {
  day: string
  count: number
  queue: AnimalId[]
  current: Visit | null
  board: (PetTile | null)[]
  fedToday: AnimalId[]
  helpedToday: AnimalId[]
  met: AnimalId[]
  upgraded: AnimalId[]
  careUnlocked: boolean
  points: number
}
export function newVisitors(): VisitorState {
  return { day: '', count: 0, queue: [], current: null, board: Array(8).fill(null), fedToday: [], helpedToday: [], met: [], upgraded: [], careUnlocked: false, points: 0 }
}
export function localDay(now = Date.now()): string {
  const d = new Date(now)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const isAnimal = (id: unknown): id is AnimalId => animals.some(a => a.id === id)
export function validVisitors(value: unknown): value is VisitorState {
  if (!value || typeof value !== 'object') return false
  const v = value as VisitorState
  const count = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0
  const animalList = (list: unknown) => Array.isArray(list) && list.every(isAnimal) && new Set(list).size === list.length
  return typeof v.day === 'string' && (v.day === '' || /^\d{4}-\d{2}-\d{2}$/.test(v.day)) && count(v.count) && count(v.points)
    && [v.queue, v.fedToday, v.helpedToday, v.met, v.upgraded].every(animalList) && typeof v.careUnlocked === 'boolean'
    && (v.current === null || !!v.current && isAnimal(v.current.animal) && count(v.current.number) && v.current.number === v.count
      && typeof v.current.served === 'boolean' && ['locked', 'found', 'done'].includes(v.current.secret) && [1, 2].includes(v.current.wants)
      && (v.current.secret === 'locked' || v.current.served) && (v.current.wants === 1 || v.upgraded.includes(v.current.animal)))
    && Array.isArray(v.board) && v.board.length === 8 && v.board.every(tile => tile === null || !!tile && (isAnimal(tile.route) || tile.route === 'care' && v.careUnlocked)
      && Number.isInteger(tile.level) && tile.level >= 0 && tile.level <= 2 && (tile.level < 2 || tile.route === 'care' || v.upgraded.includes(tile.route)))
}
function resetDay(v: VisitorState, now: number) {
  const day = localDay(now)
  if (v.day !== day) { v.day = day; v.fedToday = []; v.helpedToday = [] }
}
// One shuffled bag per four visits; even across bags, adjacent visitors differ.
export function arrive(v: VisitorState, now = Date.now(), random = Math.random): Visit {
  resetDay(v, now)
  if (!v.queue.length) {
    v.queue = animals.map(a => a.id)
    for (let i = v.queue.length - 1; i > 0; i--) {
      const n = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))))
      ;[v.queue[i], v.queue[n]] = [v.queue[n]!, v.queue[i]!]
    }
  }
  if (v.queue[0] === v.current?.animal && v.queue.length > 1) [v.queue[0], v.queue[1]] = [v.queue[1]!, v.queue[0]!]
  const animal = v.queue.shift()!
  v.current = { animal, number: ++v.count, served: false, secret: 'locked', wants: v.upgraded.includes(animal) && random() > .5 ? 2 : 1 }
  if (!v.met.includes(animal)) v.met.push(animal)
  return v.current
}
export function supplyPet(v: VisitorState, route: PetRoute): boolean {
  if (!Object.hasOwn(petRecipes, route) || route === 'care' && !v.careUnlocked) return false
  const slot = v.board.indexOf(null)
  if (slot < 0) return false
  v.board[slot] = { route, level: 0 }; return true
}
export function mergePet(v: VisitorState, from: number, to: number): boolean {
  if (![from, to].every(i => Number.isInteger(i) && i >= 0 && i < 8) || from === to) return false
  const a = v.board[from], b = v.board[to]
  if (!a || !b || a.route !== b.route || a.level !== b.level || a.level >= 2
    || a.level === 1 && a.route !== 'care' && !v.upgraded.includes(a.route)) return false
  v.board[from] = null; v.board[to] = { route: a.route, level: a.level + 1 }; return true
}
export function feedVisitor(state: { visitors: VisitorState; coins: number }, slot: number, now = Date.now()): { ok: boolean; coins: number; unlocked: boolean } {
  const v = state.visitors, visit = v.current, tile = v.board[slot]
  if (!Number.isInteger(slot) || slot < 0 || slot >= 8 || !visit || visit.served || !tile || tile.route !== visit.animal || tile.level !== visit.wants) return { ok: false, coins: 0, unlocked: false }
  resetDay(v, now)
  v.board[slot] = null; visit.served = true
  const reward = v.fedToday.includes(visit.animal) ? 0 : 12
  const unlocked = !v.upgraded.includes(visit.animal)
  if (unlocked) v.upgraded.push(visit.animal)
  if (!v.fedToday.includes(visit.animal)) v.fedToday.push(visit.animal)
  v.points += 1; state.coins += reward
  return { ok: true, coins: reward, unlocked }
}
export function greetVisitor(v: VisitorState): boolean {
  if (!v.current?.served || v.current.secret !== 'locked') return false
  v.current.secret = 'found'; return true
}
export function waterVisitor(state: { visitors: VisitorState; coins: number }, choice: string, now = Date.now()): { ok: boolean; coins: number; unlocked: boolean } {
  const v = state.visitors, visit = v.current
  if (!visit?.served || visit.secret !== 'found' || choice !== 'water') return { ok: false, coins: 0, unlocked: false }
  resetDay(v, now)
  const reward = v.helpedToday.includes(visit.animal) ? 0 : 8, unlocked = !v.careUnlocked
  visit.secret = 'done'; v.careUnlocked = true; state.coins += reward; v.points += 1
  if (!v.helpedToday.includes(visit.animal)) v.helpedToday.push(visit.animal)
  return { ok: true, coins: reward, unlocked }
}
