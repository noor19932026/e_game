import { scheduledIndex, validContentSchedule, completedLessonCounts } from './content'
export type KitchenMode = 'guide' | 'reading' | 'listening'
export type KitchenAction = 'bread' | 'egg' | 'cheese' | 'apple' | 'banana' | 'strawberry' | 'cover' | 'cut' | 'mix' | 'pour-milk' | 'serve' | 'lettuce' | 'tomato' | 'cucumber' | 'orange' | 'pear' | 'lemon' | 'honey' | 'toast' | 'skewer' | 'wrap' | 'squeeze' | 'pour-water'
export interface KitchenStep { action:KitchenAction; english:string; chinese:string }
export interface KitchenRecipe { id:string; name:string; english:string; customer:string; vessel?:'plate'|'bowl'|'cup'|'sandwich'|'toast'|'wrap'|'skewer'; steps:KitchenStep[] }
const step = (action:KitchenAction, english:string, chinese:string): KitchenStep => ({action,english,chinese})
export const kitchenRecipes:KitchenRecipe[] = [
  {id:'sandwich',name:'鸡蛋三明治',english:'Egg sandwich',customer:'Mia',steps:[
    step('bread','Put the bread on the plate.','把面包放到盘子上。'),
    step('egg','Add the cooked egg.','加上已经煮熟的鸡蛋。'),
    step('cheese','Add the cheese.','加上奶酪。'),
    step('cover','Put another slice of bread on top.','再盖上一片面包。'),
    step('cut','Cut the sandwich.','把三明治切开。'),
    step('serve','Serve the sandwich.','把三明治端给顾客。'),
  ]},
  {id:'fruit-cup',name:'缤纷水果杯',english:'Fruit cup',customer:'Leo',steps:[
    step('apple','Put the apple in the cup.','把苹果放进杯子里。'),
    step('banana','Add the banana.','加上香蕉。'),
    step('strawberry','Add the strawberries.','加上草莓。'),
    step('mix','Mix the fruit.','搅拌水果。'),
    step('serve','Serve the fruit cup.','把水果杯端给顾客。'),
  ]},
  {id:'breakfast',name:'元气早餐盘',english:'Breakfast plate',customer:'Nora',steps:[
    step('bread','Put the bread on the plate.','把面包放到盘子上。'),
    step('egg','Add the cooked egg.','加上已经煮熟的鸡蛋。'),
    step('apple','Add the apple.','加上苹果。'),
    step('pour-milk','Pour the milk into the glass.','把牛奶倒进玻璃杯。'),
    step('serve','Serve the breakfast.','把早餐端给顾客。'),
  ]},
  {id:'veggie-sandwich',name:'花园三明治',english:'Garden sandwich',customer:'Ben',vessel:'sandwich',steps:[
    step('bread','Put the bread on the plate.','把面包放到盘子上。'),
    step('lettuce','Add the lettuce.','加上生菜。'),
    step('tomato','Add the tomato slices.','加上番茄片。'),
    step('cucumber','Add the cucumber slices.','加上黄瓜片。'),
    step('cover','Put another slice of bread on top.','再盖上一片面包。'),
    step('cut','Cut the sandwich.','切开三明治。'),
    step('serve','Serve the garden sandwich.','把花园三明治端给顾客。'),
  ]},
  {id:'cheese-toast',name:'番茄芝士吐司',english:'Cheese toast',customer:'Ava',vessel:'toast',steps:[
    step('bread','Put the bread on the plate.','把面包放到盘子上。'),
    step('toast','Toast the bread.','用烤面包机烤面包。'),
    step('cheese','Add the cheese.','加上奶酪。'),
    step('tomato','Add the tomato slices.','加上番茄片。'),
    step('serve','Serve the cheese toast.','把芝士吐司端给顾客。'),
  ]},
  {id:'banana-toast',name:'蜂蜜香蕉吐司',english:'Banana toast',customer:'Sam',vessel:'toast',steps:[
    step('bread','Put the bread on the plate.','把面包放到盘子上。'),
    step('toast','Toast the bread.','烤一片面包。'),
    step('banana','Add the banana slices.','加上香蕉片。'),
    step('honey','Drizzle honey over the banana.','在香蕉上淋一点蜂蜜。'),
    step('serve','Serve the banana toast.','把香蕉吐司端给顾客。'),
  ]},
  {id:'garden-salad',name:'田园蔬菜沙拉',english:'Garden salad',customer:'Mia',vessel:'bowl',steps:[
    step('lettuce','Put the lettuce in the bowl.','把生菜放进碗里。'),
    step('tomato','Add the tomato slices.','加上番茄片。'),
    step('cucumber','Add the cucumber slices.','加上黄瓜片。'),
    step('cheese','Add the cheese.','加上奶酪。'),
    step('mix','Mix the salad.','拌一拌沙拉。'),
    step('serve','Serve the salad.','把沙拉端给顾客。'),
  ]},
  {id:'citrus-cup',name:'香橙水果杯',english:'Orange fruit cup',customer:'Leo',vessel:'cup',steps:[
    step('orange','Put the orange pieces in the cup.','把橙子块放进杯子里。'),
    step('pear','Add the pear pieces.','加上梨块。'),
    step('strawberry','Add the strawberries.','加上草莓。'),
    step('mix','Mix the fruit.','搅拌水果。'),
    step('serve','Serve the orange fruit cup.','把香橙水果杯端给顾客。'),
  ]},
  {id:'fruit-skewers',name:'彩色水果串',english:'Fruit skewers',customer:'Nora',vessel:'skewer',steps:[
    step('banana','Put the banana slices on the plate.','把香蕉片放到盘子上。'),
    step('strawberry','Add the strawberries.','加上草莓。'),
    step('apple','Add the apple pieces.','加上苹果块。'),
    step('skewer','Slide the fruit onto the skewer.','把水果穿到竹签上。'),
    step('serve','Serve the fruit skewers.','把水果串端给顾客。'),
  ]},
  {id:'lettuce-wrap',name:'生菜鸡蛋卷',english:'Lettuce wrap',customer:'Ben',vessel:'wrap',steps:[
    step('lettuce','Put the lettuce on the plate.','把生菜放到盘子上。'),
    step('egg','Add the cooked egg.','加上熟鸡蛋。'),
    step('tomato','Add the tomato slices.','加上番茄片。'),
    step('wrap','Wrap the lettuce around the filling.','用生菜包住馅料。'),
    step('cut','Cut the wrap in half.','把生菜卷切成两半。'),
    step('serve','Serve the lettuce wrap.','把生菜卷端给顾客。'),
  ]},
  {id:'lemon-water',name:'草莓柠檬水',english:'Lemon water',customer:'Ava',vessel:'cup',steps:[
    step('lemon','Put the lemon pieces in the cup.','把柠檬块放进杯子。'),
    step('squeeze','Squeeze the lemon.','挤一挤柠檬。'),
    step('pour-water','Pour water into the cup.','把水倒进杯子里。'),
    step('strawberry','Add the strawberries.','加上草莓。'),
    step('mix','Stir the drink.','搅拌饮品。'),
    step('serve','Serve the lemon water.','把柠檬水端给顾客。'),
  ]},
  {id:'fruit-milk',name:'香蕉苹果牛奶杯',english:'Fruit milk cup',customer:'Sam',vessel:'cup',steps:[
    step('apple','Put the apple pieces in the cup.','把苹果块放进杯子里。'),
    step('banana','Add the banana slices.','加上香蕉片。'),
    step('pour-milk','Pour milk into the cup.','把牛奶倒进杯子里。'),
    step('mix','Mix gently.','轻轻搅拌。'),
    step('serve','Serve the fruit milk cup.','把水果牛奶杯端给顾客。'),
  ]},
]
export const kitchenModes:{id:KitchenMode;name:string;description:string}[] = [
  {id:'guide',name:'图文入门',description:'看英语、中文和操作图片，认识食材与动作。'},
  {id:'reading',name:'阅读下厨',description:'读一句英语，在食材和工具里找出下一步。'},
  {id:'listening',name:'听力下厨',description:'听一句英语再动手；可重复听，也可主动查看提示。'},
]
export const kitchenActions:{id:KitchenAction;word:string;name:string;product?:string}[] = [
  {id:'bread',word:'bread',name:'面包',product:'bread'},
  {id:'egg',word:'cooked egg',name:'熟鸡蛋'},
  {id:'cheese',word:'cheese',name:'奶酪',product:'cheese'},
  {id:'apple',word:'apple',name:'苹果',product:'apple'},
  {id:'banana',word:'banana',name:'香蕉',product:'banana'},
  {id:'strawberry',word:'strawberries',name:'草莓',product:'strawberry'},
  {id:'cover',word:'cover',name:'盖一片面包'},
  {id:'cut',word:'cut',name:'切开'},
  {id:'mix',word:'mix',name:'搅拌'},
  {id:'pour-milk',word:'pour milk',name:'倒牛奶'},
  {id:'lettuce',word:'lettuce',name:'生菜',product:'lettuce'},
  {id:'tomato',word:'tomato slices',name:'番茄片',product:'tomato'},
  {id:'cucumber',word:'cucumber slices',name:'黄瓜片',product:'cucumber'},
  {id:'orange',word:'orange pieces',name:'橙子块',product:'orange'},
  {id:'pear',word:'pear pieces',name:'梨块',product:'pear'},
  {id:'lemon',word:'lemon pieces',name:'柠檬块',product:'lemon'},
  {id:'honey',word:'drizzle honey',name:'淋蜂蜜'},
  {id:'toast',word:'toast',name:'烤面包'},
  {id:'skewer',word:'skewer',name:'穿水果串'},
  {id:'wrap',word:'wrap',name:'包起来'},
  {id:'squeeze',word:'squeeze',name:'挤柠檬'},
  {id:'pour-water',word:'pour water',name:'倒水'},
]
export interface KitchenState {
  contentFrom:number; round:number; step:number; served:boolean; mode:KitchenMode; helped:boolean; hintOpen:boolean
  independent:number; assisted:number; mistakes:number; completed:string[]
}
export function newKitchen():KitchenState {
  return {contentFrom:0,round:1,step:0,served:false,mode:'reading',helped:false,hintOpen:false,independent:0,assisted:0,mistakes:0,completed:[]}
}
export function currentRecipe(k:KitchenState) { return kitchenRecipes[scheduledIndex(k.round,k.contentFrom,3,kitchenRecipes.length)]! }
export function currentKitchenStep(k:KitchenState) { return currentRecipe(k).steps[k.step] }
export function setKitchenMode(k:KitchenState, mode:KitchenMode) {
  if (k.mode === mode || !kitchenModes.some(m => m.id === mode)) return false
  // Any previously visible instruction belongs to this attempt, including before the first tap.
  if (!k.served) k.helped = true
  k.mode = mode; k.hintOpen = false; return true
}
export function toggleKitchenHint(k:KitchenState) {
  k.hintOpen = !k.hintOpen
  if (k.hintOpen && !k.served) k.helped = true
}
type KitchenHost = {kitchen:KitchenState;coins:number;deliveries:number;progress:{xp:number}}
export function actKitchen(state:KitchenHost, action:string):{ok:boolean;served:boolean;reward:number} {
  const k = state.kitchen
  if (k.served) return {ok:false,served:false,reward:0}
  if (currentKitchenStep(k)?.action !== action) { k.mistakes++; return {ok:false,served:false,reward:0} }
  if (k.mode === 'guide') k.helped = true
  k.step++
  if (action !== 'serve') return {ok:true,served:false,reward:0}
  k.served = true; k[k.helped ? 'assisted' : 'independent']++
  const recipe = currentRecipe(k)
  if (!k.completed.includes(recipe.id)) k.completed.push(recipe.id)
  const reward = 20
  state.coins += reward; state.progress.xp += 12; state.deliveries++
  return {ok:true,served:true,reward}
}
export function nextKitchenRound(k:KitchenState) {
  if (!k.served || k.round >= 1000000) return false
  k.round++; k.step = 0; k.served = false; k.helped = k.mode === 'guide'; k.hintOpen = false
  return true
}
export function validKitchen(value:unknown): value is KitchenState {
  if (!value || typeof value !== 'object') return false
  const k = value as KitchenState
  const count = (n:unknown) => Number.isSafeInteger(n) && (n as number) >= 0
  if (![k.round,k.step,k.independent,k.assisted,k.mistakes].every(count) || k.round < 1 || k.round > 1000000 || !validContentSchedule(k.contentFrom,k.round)
    || !kitchenModes.some(m => m.id === k.mode) || typeof k.served !== 'boolean' || typeof k.helped !== 'boolean' || typeof k.hintOpen !== 'boolean'
    || !Array.isArray(k.completed) || new Set(k.completed).size !== k.completed.length || !k.completed.every(id => kitchenRecipes.some(r => r.id === id))) return false
  const expectedCompleted = kitchenRecipes.filter((_,i) => completedLessonCounts(k.round-1+Number(k.served),k.contentFrom,3,kitchenRecipes.length)[i]!>0).map(r => r.id)
  return k.step <= currentRecipe(k).steps.length && k.served === (k.step === currentRecipe(k).steps.length)
    && k.independent+k.assisted === k.round-1+Number(k.served)
    && (!k.hintOpen || k.helped || k.served)
    && expectedCompleted.length === k.completed.length && expectedCompleted.every(id => k.completed.includes(id))
}

export function kitchenChoices(k:KitchenState) {
  if(scheduledIndex(k.round,k.contentFrom,3,kitchenRecipes.length)<3) return kitchenActions.slice(0,10)
  const needed=new Set(currentRecipe(k).steps.map(s => s.action))
  const ingredients=kitchenActions.filter(a => a.product || a.id==='egg')
  const tools=kitchenActions.filter(a => !a.product && a.id!=='egg')
  const choose=(items:typeof kitchenActions,extra:number) => items.filter(a => needed.has(a.id) || items.filter(x => !needed.has(x.id)).slice(0,extra).includes(a))
  // All ingredients for this whole recipe stay available, alongside distractors.
  return [...choose(ingredients,2),...choose(tools,1)]
}
export function migrateKitchenV8(value:unknown):KitchenState|null {
  if(!value || typeof value!=='object') return null
  const old=value as KitchenState
  const migrated={...old,contentFrom:old.round+1}
  return validKitchen(migrated) ? migrated : null
}
