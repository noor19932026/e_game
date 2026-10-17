import { scheduledIndex, validContentSchedule } from './content'
export type StoreId = 'supermarket' | 'fruit' | 'fashion'
export type StoreRequestMode = 'guide' | 'reading' | 'listening'
export const STORE_MODE_KEY = 'epartner-store-request-mode'
export const storeRequestModes: { id:StoreRequestMode; name:string; description:string }[] = [
  { id:'guide', name:'图文入门', description:'顾客和商品都显示图片与英文，先熟悉物品。' },
  { id:'reading', name:'阅读接单', description:'顾客只给英文，商品只显示图片。读懂物品、颜色和数量，再配套。' },
  { id:'listening', name:'听力接单', description:'顾客只播放语音，商品只显示图片。可以重复听，需要时再打开图文提示。' },
]
export interface Product { id: string; word: string; meaning: string; kind: string; color: string; one: string; many: string }
const product = (id: string, word: string, meaning: string, kind: string, color: string, one = `a ${word}`, many = `${word}s`): Product => ({ id, word, meaning, kind, color, one, many })
export const products: Product[] = [
  product('milk', 'milk', '牛奶', 'milk', '#a3bfc1', 'a carton of milk', 'cartons of milk'),
  product('bread', 'bread', '面包', 'bread', '#d5ae6b', 'a loaf of bread', 'loaves of bread'),
  product('egg', 'egg', '鸡蛋', 'egg', '#ede0bf', 'an egg', 'eggs'),
  product('water', 'water', '水', 'water', '#a9c7d3', 'a bottle of water', 'bottles of water'),
  product('carrot', 'carrot', '胡萝卜', 'carrot', '#dfa06a'),
  product('cheese', 'cheese', '奶酪', 'cheese', '#e1c268', 'a piece of cheese', 'pieces of cheese'),
  product('apple', 'apple', '苹果', 'apple', '#cc8268', 'an apple', 'apples'),
  product('orange', 'orange', '橙子', 'orange', '#e0ad59', 'an orange', 'oranges'),
  product('banana', 'banana', '香蕉', 'banana', '#e4cb6c'),
  product('pear', 'pear', '梨', 'pear', '#b8c27b'),
  product('strawberry', 'strawberry', '草莓', 'strawberry', '#d18b88', 'a strawberry', 'strawberries'),
  product('grapes', 'grapes', '葡萄', 'grapes', '#ac98b8', 'a bunch of grapes', 'bunches of grapes'),
  product('tomato','tomato','番茄','tomato','#d77b61','a tomato','tomatoes'),
  product('cucumber','cucumber','黄瓜','cucumber','#8aa575'),
  product('lettuce','lettuce','生菜','lettuce','#abc183','a head of lettuce','heads of lettuce'),
  product('corn','corn','玉米','corn','#e5c864','an ear of corn','ears of corn'),
  product('watermelon','watermelon','西瓜','watermelon','#87a37a','a watermelon','watermelons'),
  product('peach','peach','桃子','peach','#e4b09a','a peach','peaches'),
  product('blueberry','blueberry','蓝莓','blueberry','#929abd','a box of blueberries','boxes of blueberries'),
  product('lemon','lemon','柠檬','lemon','#e7cf70'),
  ...(['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'white'] as const).flatMap((color, i) => (['shirt', 'hat', 'shoes'] as const).map(kind => product(`${color}-${kind}`, `${color} ${kind}`, `${['红色', '蓝色', '绿色', '黄色', '紫色', '粉色', '橙色', '白色'][i]}${{shirt:'衬衫',hat:'帽子',shoes:'鞋子'}[kind]}`, kind, ['#ce8b79', '#8caebf', '#9cb28a', '#e4c666', '#a592ba', '#e4afc1', '#dfaa6e', '#f7f1df'][i]!, kind === 'shoes' ? `a pair of ${color} shoes` : `${color === 'orange' ? 'an' : 'a'} ${color} ${kind}`, kind === 'shoes' ? `pairs of ${color} shoes` : `${color} ${kind}s`))),
]
export const productById = Object.fromEntries(products.map(p => [p.id, p])) as Record<string, Product>
export const storeList: { id: StoreId; name: string; english: string; tagline: string; color: string; goods: string[] }[] = [
  { id:'supermarket', name:'街角超市', english:'Corner market', tagline:'早餐、午餐、出游包，配齐购物清单', color:'#6e907b', goods:['milk','bread','egg','water','carrot','cheese','apple','orange','tomato','cucumber','lettuce','corn'] },
  { id:'fruit', name:'水果市场', english:'Fruit market', tagline:'三份成一盒，也能搭配缤纷水果篮', color:'#c58d57', goods:['apple','orange','banana','pear','strawberry','grapes','watermelon','peach','blueberry','lemon'] },
  { id:'fashion', name:'缤纷服装店', english:'Little wardrobe', tagline:'看懂颜色，把衣帽鞋搭成一套', color:'#9297b3', goods:products.filter(p => ['shirt','hat','shoes'].includes(p.kind)).map(p => p.id) },
]
type Line = { product: string; count: number }
export interface StoreOrder { name: string; title: string; lines: Line[]; request: string; translation: string }
const line = (product: string, count = 1): Line => ({ product, count })
const menus: Record<StoreId, {title:string; lines:Line[]}[]> = {
  supermarket: [
    {title:'早餐袋',lines:[line('milk'),line('bread'),line('egg')]},
    {title:'出游包',lines:[line('water'),line('apple',2)]},
    {title:'轻食午餐',lines:[line('bread'),line('carrot'),line('cheese')]},
    {title:'家庭早餐',lines:[line('milk',2),line('egg',2)]},
    {title:'水果点心',lines:[line('orange',2),line('cheese')]},
    {title:'野餐补给',lines:[line('water',2),line('bread'),line('apple')]},
    {title:'沙拉材料',lines:[line('lettuce'),line('tomato'),line('cucumber')]},
    {title:'玉米午餐',lines:[line('corn'),line('cheese'),line('water')]},
    {title:'双人三明治',lines:[line('bread',2),line('cheese'),line('tomato')]},
    {title:'蔬菜分享包',lines:[line('carrot',2),line('cucumber',2)]},
    {title:'运动补给',lines:[line('water',3),line('apple')]},
    {title:'早餐加餐',lines:[line('milk'),line('egg',2),line('corn')]},
    {title:'番茄芝士盘',lines:[line('tomato',2),line('cheese')]},
    {title:'花园午餐',lines:[line('lettuce'),line('carrot'),line('bread')]},
    {title:'家人购物袋',lines:[line('milk'),line('egg'),line('corn'),line('water')]},
    {title:'清爽野餐',lines:[line('cucumber',2),line('bread'),line('water')]},
    {title:'明早的早餐',lines:[line('milk',2),line('bread'),line('egg',2)]},
    {title:'彩色蔬菜篮',lines:[line('tomato'),line('corn'),line('carrot'),line('lettuce')]},
  ],
  fruit: [
    {title:'苹果三只装',lines:[line('apple',3)]},
    {title:'香蕉三只装',lines:[line('banana',3)]},
    {title:'缤纷水果篮',lines:[line('orange'),line('pear'),line('strawberry')]},
    {title:'橙子三只装',lines:[line('orange',3)]},
    {title:'分享水果盒',lines:[line('apple',2),line('grapes')]},
    {title:'草莓三只装',lines:[line('strawberry',3)]},
    {title:'桃子分享盒',lines:[line('peach',2),line('pear')]},
    {title:'夏日水果篮',lines:[line('watermelon'),line('peach'),line('grapes')]},
    {title:'蓝莓苹果盒',lines:[line('blueberry'),line('apple',2)]},
    {title:'清新柠檬组',lines:[line('lemon',3)]},
    {title:'黄色水果盒',lines:[line('banana'),line('lemon'),line('pear')]},
    {title:'莓果双拼',lines:[line('strawberry',2),line('blueberry')]},
    {title:'红绿水果篮',lines:[line('apple'),line('watermelon'),line('grapes')]},
    {title:'甜橙与蜜桃',lines:[line('orange',2),line('peach',2)]},
    {title:'全家分享盒',lines:[line('watermelon'),line('banana'),line('strawberry'),line('pear')]},
    {title:'柠檬水果水',lines:[line('lemon'),line('orange'),line('strawberry')]},
    {title:'两份蓝莓',lines:[line('blueberry',2),line('banana')]},
    {title:'野餐水果袋',lines:[line('peach'),line('apple'),line('grapes'),line('orange')]},
  ],
  fashion: [
    {title:'红色出游套装',lines:[line('red-shirt'),line('red-hat'),line('red-shoes')]},
    {title:'蓝色日常套装',lines:[line('blue-shirt'),line('blue-shoes')]},
    {title:'绿色周末套装',lines:[line('green-shirt'),line('green-hat'),line('green-shoes')]},
    {title:'红蓝搭配',lines:[line('red-shirt'),line('blue-hat'),line('blue-shoes')]},
    {title:'清新搭配',lines:[line('green-shirt'),line('blue-shoes')]},
    {title:'双人帽子组',lines:[line('red-hat'),line('green-hat')]},
    {title:'向日葵套装',lines:[line('yellow-shirt'),line('yellow-hat'),line('yellow-shoes')]},
    {title:'紫色散步套装',lines:[line('purple-shirt'),line('purple-shoes')]},
    {title:'粉色派对套装',lines:[line('pink-shirt'),line('pink-hat'),line('pink-shoes')]},
    {title:'橙白阳光搭配',lines:[line('orange-shirt'),line('white-hat'),line('white-shoes')]},
    {title:'白绿清爽搭配',lines:[line('white-shirt'),line('green-hat'),line('green-shoes')]},
    {title:'双色姐妹帽',lines:[line('pink-hat',2),line('purple-hat')]},
    {title:'蓝黄郊游搭配',lines:[line('blue-shirt'),line('yellow-hat'),line('yellow-shoes')]},
    {title:'紫白舞台搭配',lines:[line('purple-shirt'),line('white-shoes')]},
    {title:'雨后彩虹搭配',lines:[line('orange-shirt'),line('blue-hat'),line('orange-shoes')]},
    {title:'两双白鞋',lines:[line('white-shoes',2),line('white-hat')]},
    {title:'暖色朋友组',lines:[line('red-shirt'),line('orange-hat'),line('yellow-shoes')]},
    {title:'周末换装包',lines:[line('pink-shirt'),line('purple-hat'),line('blue-shoes')]},
  ],
}
export function storeOrders(id: StoreId, round: number, contentFrom = 0): StoreOrder[] {
  return Array.from({length:3}, (_, i) => {
    const menu = menus[id][scheduledIndex(round,contentFrom,2,menus[id].length/3)*3+i]!
    const parts = menu.lines.map(l => l.count === 1 ? productById[l.product]!.one : `${['','','two','three'][l.count]} ${productById[l.product]!.many}`)
    return { ...menu, name:['Mia','Leo','Nora'][(i+round-1)%3]!, request:`I'd like ${parts.join(', ').replace(/, ([^,]*)$/, ' and $1')}, please.`, translation:`我想要${menu.lines.map(l => `${l.count} 份${productById[l.product]!.meaning}`).join('和')}。` }
  })
}
export const STORE_ORDER_COUNT = Object.values(menus).reduce((sum,rows) => sum+rows.length,0)
export const TRAY_SIZE = 6
export interface StoreSession { contentFrom:number; round:number; served:boolean[]; shelf:string[]; tray:string[]; helped:boolean; independent:number; assisted:number }
export interface StoresState { selected:StoreId; sessions:Record<StoreId,StoreSession> }
const legacyGoods:Record<StoreId,string[]> = {
  supermarket:['milk','bread','egg','water','carrot','cheese','apple','orange'],
  fruit:['apple','orange','banana','pear','strawberry','grapes'],
  fashion:['red','blue','green'].flatMap(c => ['shirt','hat','shoes'].map(k => `${c}-${k}`)),
}
function stockFor(id: StoreId, round: number, contentFrom: number) {
  const orders = storeOrders(id,round,contentFrom)
  const goods = storeList.find(s => s.id===id)!.goods
  const required = [...new Set(orders.flatMap(o => o.lines.map(l => l.product)))]
  // The current classic shelf must survive a save migration exactly.
  const pool = contentFrom>0 && round<contentFrom ? legacyGoods[id] : [
    ...required,
    ...goods.filter(p => !required.includes(p)).sort((a,b) => {
      const rank = (p:string) => (goods.indexOf(p)*17+round*13)%goods.length
      return rank(a)-rank(b)
    }).slice(0,5),
  ]
  const stock = Object.fromEntries(pool.map(p => [p,1]))
  for(const order of orders) for(const l of order.lines) stock[l.product] = (stock[l.product] || 0)+l.count
  return stock
}
export function newSession(id: StoreId, round = 1, independent = 0, assisted = 0, contentFrom = 0): StoreSession {
  const shelf = Object.entries(stockFor(id,round,contentFrom)).flatMap(([p,count]) => Array<string>(count).fill(p))
  let seed = round*97+storeList.findIndex(s => s.id === id)*41
  for (let i=shelf.length-1;i>0;i--) { seed = (seed*1664525+1013904223) >>> 0; const k = seed%(i+1); [shelf[i],shelf[k]] = [shelf[k]!,shelf[i]!] }
  return { contentFrom, round, served:[false,false,false], shelf, tray:[], helped:false, independent, assisted }
}
export function newStores(): StoresState { return { selected:'supermarket', sessions:Object.fromEntries(storeList.map(s => [s.id,newSession(s.id)])) as StoresState['sessions'] } }
export function takeProduct(session: StoreSession, id: string, index = session.shelf.indexOf(id)) {
  if (session.served.every(Boolean) || session.tray.length >= TRAY_SIZE || !Number.isInteger(index) || index < 0 || session.shelf[index] !== id) return false
  session.shelf.splice(index,1); session.tray.push(id); return true
}
export function returnProduct(session: StoreSession, index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= session.tray.length) return false
  const [id] = session.tray.splice(index,1); session.shelf.push(id!); return true
}
export function inTray(session: StoreSession, id: string) { return session.tray.filter(p => p === id).length }
export function canServe(session: StoreSession, id: StoreId, index: number) {
  const order = storeOrders(id,session.round,session.contentFrom)[index]
  return !!order && !session.served[index] && order.lines.every(l => inTray(session,l.product) >= l.count)
}
// Consume only this customer's set; other items remain available for the next order.
export function serveStore(state: { stores:StoresState; coins:number; deliveries:number; progress:{xp:number} }, id: StoreId, index: number): number {
  const session = state.stores.sessions[id]
  if (!canServe(session,id,index)) return 0
  const order = storeOrders(id,session.round,session.contentFrom)[index]!
  for (const l of order.lines) for (let n=0;n<l.count;n++) session.tray.splice(session.tray.indexOf(l.product),1)
  session.served[index] = true
  session[session.helped ? 'assisted' : 'independent']++
  const reward = 12 + order.lines.reduce((sum,l) => sum+l.count,0)*4
  state.coins += reward; state.progress.xp += 8; state.deliveries++
  return reward
}
export function nextStoreRound(state: StoresState, id: StoreId) {
  const s = state.sessions[id]
  if (!s.served.every(Boolean) || s.round>=1000000) return false
  state.sessions[id] = newSession(id,s.round+1,s.independent,s.assisted,s.contentFrom); return true
}
export function validStores(value: unknown): value is StoresState {
  if (!value || typeof value !== 'object') return false
  const v = value as StoresState
  const count = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0
  return storeList.some(s => s.id === v.selected) && !!v.sessions && storeList.every(shop => {
    const s = v.sessions[shop.id]
    if (!s || !count(s.round) || s.round < 1 || s.round > 1000000 || !validContentSchedule(s.contentFrom,s.round) || !count(s.independent) || !count(s.assisted) || typeof s.helped !== 'boolean'
      || !Array.isArray(s.served) || s.served.length !== 3 || !s.served.every(b => typeof b === 'boolean')
      || !Array.isArray(s.tray) || s.tray.length > TRAY_SIZE || !s.tray.every(id => shop.goods.includes(id))
      || !Array.isArray(s.shelf) || s.shelf.length > 40 || !s.shelf.every(id => shop.goods.includes(id))) return false
    // Reject impossible inventories and inconsistent completion ledgers.
    const expected = stockFor(shop.id,s.round,s.contentFrom)
    storeOrders(shop.id,s.round,s.contentFrom).forEach((o,i) => { if (s.served[i]) for (const l of o.lines) expected[l.product]! -= l.count })
    return shop.goods.every(id => s.shelf.filter(p => p === id).length + inTray(s,id) === (expected[id] || 0))
      && s.independent+s.assisted === (s.round-1)*3+s.served.filter(Boolean).length
  })
}

export function migrateStoresV8(value:unknown):StoresState|null {
  if(!value || typeof value!=='object') return null
  const old=value as StoresState
  if(!old.sessions || typeof old.sessions!=='object') return null
  const sessions=Object.fromEntries(storeList.map(shop => {
    const session=old.sessions[shop.id]
    return [shop.id,session && {...session,contentFrom:session.round+1}]
  })) as StoresState['sessions']
  const migrated={...old,sessions}
  return validStores(migrated) ? migrated : null
}
