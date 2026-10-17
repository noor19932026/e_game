import { changeActivityMode, newActivityProgress, recordActivityCompletion, resetActivityAttempt, toggleActivityHint, validActivityProgress, type ActivityMode, type ActivityProgress } from './activity'
import { completedLessonCounts, scheduledIndex, validContentSchedule, type ContentSchedule } from './content'

export type FarmCrop = 'carrot' | 'tomato' | 'sunflower' | 'strawberry' | 'corn' | 'pumpkin' | 'cucumber' | 'pea'
export type FarmTool = FarmCrop | 'water' | 'sun' | 'basket'
export type PlotStage = 'empty' | 'seed' | 'watered' | 'ready' | 'harvested'
export type FarmStage = 'plant' | 'water' | 'grow' | 'harvest' | 'deliver' | 'complete'
export interface FarmPlot { crop:FarmCrop|null;stage:PlotStage }
export interface FarmCropInfo { id:FarmCrop;name:string;single:string;plural:string }
export interface FarmQuest { id:string;crop:FarmCrop;name:string;word:string;quantity:number;customer:string;title:string;request?:string }
export const farmCrops:FarmCropInfo[] = [
  {id:'carrot',name:'胡萝卜',single:'carrot',plural:'carrots'},
  {id:'tomato',name:'番茄',single:'tomato',plural:'tomatoes'},
  {id:'sunflower',name:'向日葵',single:'sunflower',plural:'sunflowers'},
  {id:'strawberry',name:'草莓',single:'strawberry',plural:'strawberries'},
  {id:'corn',name:'玉米',single:'ear of corn',plural:'ears of corn'},
  {id:'pumpkin',name:'南瓜',single:'pumpkin',plural:'pumpkins'},
  {id:'cucumber',name:'黄瓜',single:'cucumber',plural:'cucumbers'},
  {id:'pea',name:'豌豆荚',single:'pea pod',plural:'pea pods'},
]
export const farmQuests:FarmQuest[] = [
  {id:'carrot',crop:'carrot',name:'胡萝卜',word:'carrots',quantity:2,customer:'Mia',title:'给厨房的新鲜蔬菜'},
  {id:'tomato',crop:'tomato',name:'番茄',word:'tomatoes',quantity:3,customer:'Leo',title:'阳光番茄订单'},
  {id:'sunflower',crop:'sunflower',name:'向日葵',word:'sunflowers',quantity:2,customer:'Nora',title:'送给小店的花束'},
  {id:'berry-cup',crop:'strawberry',name:'草莓',word:'strawberries',quantity:3,customer:'Ava',title:'野餐水果杯',request:'I need three strawberries for our picnic cups.'},
  {id:'corn-lunch',crop:'corn',name:'玉米',word:'ear of corn',quantity:1,customer:'Ben',title:'一人份午餐',request:'One ear of corn for my lunch, please.'},
  {id:'pumpkin-soup',crop:'pumpkin',name:'南瓜',word:'pumpkins',quantity:2,customer:'Mia',title:'厨房的大汤锅',request:'Bring two pumpkins for the soup, please.'},
  {id:'cucumber-picnic',crop:'cucumber',name:'黄瓜',word:'cucumbers',quantity:3,customer:'Leo',title:'公园分享篮',request:'Three cucumbers for our picnic basket, please.'},
  {id:'pea-market',crop:'pea',name:'豌豆荚',word:'pea pods',quantity:2,customer:'Ruby',title:'市场的小摊位',request:'I need two pea pods for my market stall.'},
  {id:'sunflower-desk',crop:'sunflower',name:'向日葵',word:'sunflower',quantity:1,customer:'Sam',title:'书桌上的小礼物',request:'One sunflower for my desk, please.'},
  {id:'carrot-lunch',crop:'carrot',name:'胡萝卜',word:'carrots',quantity:3,customer:'Ava',title:'学校午餐准备',request:'Bring three carrots for the school lunch, please.'},
  {id:'tomato-sandwich',crop:'tomato',name:'番茄',word:'tomato',quantity:1,customer:'Ben',title:'三明治里的新鲜味道',request:'I need one tomato for my sandwich.'},
  {id:'berry-gift',crop:'strawberry',name:'草莓',word:'strawberries',quantity:2,customer:'Nora',title:'送给朋友的礼物',request:'Two strawberries for my friend, please.'},
  {id:'corn-party',crop:'corn',name:'玉米',word:'ears of corn',quantity:3,customer:'Ruby',title:'花园聚会准备',request:'We need three ears of corn for our garden party.'},
  {id:'pumpkin-window',crop:'pumpkin',name:'南瓜',word:'pumpkin',quantity:1,customer:'Sam',title:'小店橱窗布置',request:'One pumpkin for my shop window, please.'},
  {id:'cucumber-lunch',crop:'cucumber',name:'黄瓜',word:'cucumbers',quantity:2,customer:'Mia',title:'两份清爽便当',request:'Bring two cucumbers for our lunch boxes.'},
  {id:'pea-kitchen',crop:'pea',name:'豌豆荚',word:'pea pods',quantity:3,customer:'Leo',title:'今天的厨房补货',request:'Three pea pods for the kitchen, please.'},
  {id:'carrot-snack',crop:'carrot',name:'胡萝卜',word:'carrot',quantity:1,customer:'Ruby',title:'下午的小点心',request:'I would like one carrot for my snack.'},
  {id:'berry-cafe',crop:'strawberry',name:'草莓',word:'strawberry',quantity:1,customer:'Sam',title:'小咖啡馆的点缀',request:'One strawberry for my fruit cup, please.'},
]
export const farmTools:{id:FarmTool;english:string;chinese:string}[] = [
  ...farmCrops.map(crop=>({id:crop.id,english:`${crop.id} seeds`,chinese:`${crop.name}种子`})),
  {id:'water',english:'water',chinese:'浇水'},
  {id:'sun',english:'sunshine',chinese:'阳光'},{id:'basket',english:'pick',chinese:'采收'},
]
export interface FarmState extends ActivityProgress, ContentSchedule {
  round:number;stage:FarmStage;plots:FarmPlot[];selected:FarmTool|null;harvested:number;complete:boolean;mistakes:number
  produce:Record<FarmCrop,number>;completed:string[]
}
const emptyPlots=():FarmPlot[]=>Array.from({length:3},()=>({crop:null,stage:'empty'}))
const emptyProduce=():Record<FarmCrop,number>=>({carrot:0,tomato:0,sunflower:0,strawberry:0,corn:0,pumpkin:0,cucumber:0,pea:0})
export function newFarm():FarmState { return {...newActivityProgress(),contentFrom:0,round:1,stage:'plant',plots:emptyPlots(),selected:null,harvested:0,complete:false,mistakes:0,produce:emptyProduce(),completed:[]} }
export function currentFarmQuest(f:FarmState) { return farmQuests[scheduledIndex(f.round,f.contentFrom,3,farmQuests.length)]! }
export function currentFarmCommand(f:FarmState):{english:string;chinese:string;tool:FarmTool|null} {
  const q=currentFarmQuest(f),count=['','one','two','three'][q.quantity]!
  switch (f.stage) {
    case 'plant':return {english:`Plant ${count} ${q.crop} ${q.quantity===1?'seed':'seeds'}.`,chinese:`选择${q.name}种子，在 ${q.quantity} 块空地各播一颗。`,tool:q.crop}
    case 'water':return {english:'Water each plant, please.',chinese:'选择水壶，给每一棵植物浇水。',tool:'water'}
    case 'grow':return {english:'Give each plant some sunshine.',chinese:'选择阳光，点每棵植物，看看它们长大。',tool:'sun'}
    case 'harvest':return {english:`Pick ${count} ${q.word}.`,chinese:`选择篮子，采收 ${q.quantity} 份${q.name}。`,tool:'basket'}
    case 'deliver':return {english:q.request||`Bring me ${count} ${q.word}, please.`,chinese:`把篮子里的 ${q.quantity} 份${q.name}交给 ${q.customer}。`,tool:null}
    default:return {english:'Thank you for the fresh harvest!',chinese:'新鲜收获已经送到顾客手中。',tool:null}
  }
}
export function setFarmMode(f:FarmState,mode:ActivityMode) { return changeActivityMode(f,mode) }
export function toggleFarmHint(f:FarmState) { toggleActivityHint(f) }
export function chooseFarmTool(f:FarmState,tool:string) {
  if (f.complete || f.stage==='deliver' || !farmTools.some(t=>t.id===tool)) return false
  f.selected=f.selected===tool ? null : tool as FarmTool;return true
}
type FarmHost = {farm:FarmState;coins:number;progress:{xp:number};deliveries?:number}
export function actFarmPlot(host:FarmHost,index:number):{ok:boolean;stage:FarmStage;reward:number} {
  const f=host.farm,q=currentFarmQuest(f),plot=f.plots[index]
  if (f.complete || f.stage==='deliver' || !Number.isInteger(index) || !plot) return {ok:false,stage:f.stage,reward:0}
  const stages:{[K in Exclude<FarmStage,'deliver'|'complete'>]:[FarmTool,PlotStage,PlotStage,FarmStage]}={
    plant:[q.crop,'empty','seed','water'],water:['water','seed','watered','grow'],grow:['sun','watered','ready','harvest'],harvest:['basket','ready','harvested','deliver'],
  }
  const [tool,before,after,next]=stages[f.stage as keyof typeof stages]
  if (f.selected!==tool || plot.stage!==before || f.stage==='plant' && f.plots.filter(p=>p.crop!==null).length>=q.quantity) {
    f.mistakes++;return {ok:false,stage:f.stage,reward:0}
  }
  if (f.mode==='guide') f.helped=true
  plot.stage=after;plot.crop=q.crop
  if (after==='harvested') f.harvested++
  if (f.plots.filter(p=>p.stage===after).length===q.quantity) { f.stage=next;f.selected=null;f.hintOpen=false }
  return {ok:true,stage:f.stage,reward:0}
}
export function deliverFarm(host:FarmHost):{ok:boolean;reward:number} {
  const f=host.farm,q=currentFarmQuest(f)
  if (f.complete || f.stage!=='deliver' || f.harvested!==q.quantity) return {ok:false,reward:0}
  f.complete=true;f.stage='complete';f.selected=null;f.produce[q.crop]+=q.quantity
  if (!f.completed.includes(q.id)) f.completed.push(q.id)
  recordActivityCompletion(f);host.coins+=24;host.progress.xp+=15
  if (typeof host.deliveries==='number') host.deliveries++
  return {ok:true,reward:24}
}
export function nextFarmRound(f:FarmState) {
  if (!f.complete || f.round>=1000000) return false
  f.round++;f.stage='plant';f.plots=emptyPlots();f.selected=null;f.harvested=0;f.complete=false;resetActivityAttempt(f);return true
}
export function validFarm(value:unknown):value is FarmState {
  if (!validActivityProgress(value)) return false
  const f=value as FarmState,count=(n:unknown)=>Number.isSafeInteger(n)&&(n as number)>=0
  if (![f.round,f.harvested,f.mistakes].every(count)||f.round<1||f.round>1000000||typeof f.complete!=='boolean'
    || !validContentSchedule(f.contentFrom,f.round)
    || !['plant','water','grow','harvest','deliver','complete'].includes(f.stage)||f.complete!==(f.stage==='complete')
    || !Array.isArray(f.plots)||f.plots.length!==3||!f.produce||typeof f.produce!=='object'
    || Array.isArray(f.produce) || !farmCrops.every(crop=>count(f.produce[crop.id]))||!Array.isArray(f.completed)||new Set(f.completed).size!==f.completed.length
    || !f.completed.every(id=>farmQuests.some(q=>q.id===id))
    || f.selected!==null&&(!farmTools.some(t=>t.id===f.selected)||f.complete||f.stage==='deliver')) return false
  const q=currentFarmQuest(f),active=f.plots.filter(p=>p && p.crop!==null)
  if (active.length>q.quantity||!f.plots.every(p=>p&&['empty','seed','watered','ready','harvested'].includes(p.stage)&&(p.stage==='empty'?p.crop===null:p.crop===q.crop))
    ||f.harvested!==f.plots.filter(p=>p.stage==='harvested').length) return false
  if (f.stage==='plant' && (active.length===q.quantity||active.some(p=>p.stage!=='seed'))) return false
  if (f.stage!=='plant'&&active.length!==q.quantity) return false
  const allowed:Record<FarmStage,PlotStage[]>={plant:['seed'],water:['seed','watered'],grow:['watered','ready'],harvest:['ready','harvested'],deliver:['harvested'],complete:['harvested']}
  if (active.some(p=>!allowed[f.stage].includes(p.stage))) return false
  if ((f.stage==='water'&&active.every(p=>p.stage==='watered'))||(f.stage==='grow'&&active.every(p=>p.stage==='ready'))||(f.stage==='harvest'&&active.every(p=>p.stage==='harvested'))) return false
  const runs=f.round-1+Number(f.complete),counts=completedLessonCounts(runs,f.contentFrom,3,farmQuests.length)
  const expected=farmQuests.filter((_,i)=>counts[i]!>0).map(q=>q.id),produce=emptyProduce()
  farmQuests.forEach((quest,index)=>{produce[quest.crop]+=counts[index]!*quest.quantity})
  return f.independent+f.assisted===runs && f.completed.length===expected.length && expected.every(id=>f.completed.includes(id))
    && farmCrops.every(crop=>f.produce[crop.id]===produce[crop.id])
}

export function migrateFarmV8(value:unknown):FarmState|null {
  if (!value || typeof value!=='object') return null
  const legacy=value as FarmState
  if (!legacy.produce || typeof legacy.produce!=='object' || Array.isArray(legacy.produce)
    || !['carrot','tomato','sunflower'].every(key=>Object.hasOwn(legacy.produce,key))) return null
  const migrated={...legacy,contentFrom:legacy.round+1,produce:{...emptyProduce(),...legacy.produce}}
  return validFarm(migrated)?migrated:null
}
