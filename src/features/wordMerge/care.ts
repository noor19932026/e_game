import { changeActivityMode, newActivityProgress, recordActivityCompletion, resetActivityAttempt, toggleActivityHint, validActivityProgress, type ActivityMode, type ActivityProgress } from './activity'
import { completedLessonCounts, scheduledIndex, validContentSchedule, type ContentSchedule } from './content'

export type CareTool = 'water' | 'towel' | 'brush' | 'bed' | 'ball' | 'feather' | 'tunnel' | 'blanket'
export type CareAnimal = 'cat' | 'dog' | 'rabbit'
export interface CareStep { tool:CareTool; english:string; chinese:string }
export interface CareStory { id:string; animal:CareAnimal; name:string; title:string; color:string; steps:CareStep[] }
export const careTools:{id:CareTool;english:string;chinese:string}[] = [
  {id:'water',english:'water',chinese:'清水'}, {id:'towel',english:'soft towel',chinese:'柔软毛巾'},
  {id:'brush',english:'brush',chinese:'梳子'}, {id:'bed',english:'pet bed',chinese:'小床'}, {id:'ball',english:'ball',chinese:'玩具球'},
  {id:'feather',english:'feather toy',chinese:'羽毛玩具'}, {id:'tunnel',english:'play tunnel',chinese:'游戏隧道'}, {id:'blanket',english:'blanket',chinese:'小毯子'},
]
export const careStories:CareStory[] = [
  {id:'cat',animal:'cat',name:'Mochi',title:'猫咪的午后',color:'#d3a077',steps:[
    {tool:'water',english:"I'm thirsty. Give me some water, please.",chinese:'我渴了，请给我一些清水。'},
    {tool:'brush',english:'Brush my fur gently, please.',chinese:'请轻轻梳理我的毛。'},
    {tool:'bed',english:"I'm sleepy. Help me rest in my bed.",chinese:'我困了，帮我在小床里休息。'},
  ]},
  {id:'dog',animal:'dog',name:'Biscuit',title:'散步回来啦',color:'#bc9472',steps:[
    {tool:'towel',english:'My paws are muddy. Wipe them with the towel.',chinese:'我的爪子沾上泥了，用毛巾帮我擦干净。'},
    {tool:'water',english:"I'm thirsty. Give me some water, please.",chinese:'我渴了，请给我一些清水。'},
    {tool:'ball',english:"Let's play! Roll the ball to me.",chinese:'一起玩吧，把球滚给我。'},
  ]},
  {id:'rabbit',animal:'rabbit',name:'Clover',title:'花园里的新朋友',color:'#c6b7a4',steps:[
    {tool:'water',english:"I'm thirsty. Give me some water, please.",chinese:'我渴了，请给我一些清水。'},
    {tool:'brush',english:'Brush my fur gently, please.',chinese:'请轻轻梳理我的毛。'},
    {tool:'bed',english:"I'm tired. Help me rest in my bed.",chinese:'我累了，帮我在小床里休息。'},
  ]},
  {id:'cat-play',animal:'cat',name:'Mochi',title:'窗边游戏时间',color:'#d3a077',steps:[
    {tool:'feather',english:'Wave the feather toy for me, please.',chinese:'请挥一挥羽毛玩具，陪我玩。'},
    {tool:'water',english:'After playing, I need some water.',chinese:'玩过之后，我想喝一些清水。'},
    {tool:'blanket',english:'Put a blanket in my quiet corner.',chinese:'在我安静的小角落铺一条毯子。'},
  ]},
  {id:'dog-rain',animal:'dog',name:'Biscuit',title:'雨后的门廊',color:'#bc9472',steps:[
    {tool:'towel',english:'My fur is wet. Dry it with the soft towel.',chinese:'我的毛湿了，请用柔软毛巾擦干。'},
    {tool:'blanket',english:'Make a soft spot with the blanket.',chinese:'用毯子铺一个柔软的位置。'},
    {tool:'bed',english:'I want to rest. Bring my pet bed, please.',chinese:'我想休息了，请拿来我的小床。'},
  ]},
  {id:'rabbit-explore',animal:'rabbit',name:'Clover',title:'好奇的小探险家',color:'#c6b7a4',steps:[
    {tool:'tunnel',english:'I want to explore. Set out my play tunnel.',chinese:'我想探索一下，请放好游戏隧道。'},
    {tool:'ball',english:'Roll the ball beside the tunnel.',chinese:'把小球滚到隧道旁边。'},
    {tool:'water',english:'A little water after my adventure, please.',chinese:'探险以后，请给我一些清水。'},
  ]},
  {id:'cat-garden',animal:'cat',name:'Mochi',title:'花园归来的脚印',color:'#d3a077',steps:[
    {tool:'towel',english:'Wipe the mud off my paws with the towel.',chinese:'用毛巾把我爪子上的泥擦掉。'},
    {tool:'brush',english:'Please brush my fur gently.',chinese:'请轻轻梳理我的毛。'},
    {tool:'feather',english:'Now let us play with the feather toy.',chinese:'现在一起玩羽毛玩具吧。'},
  ]},
  {id:'dog-fetch',animal:'dog',name:'Biscuit',title:'小球运动会',color:'#bc9472',steps:[
    {tool:'ball',english:'I am ready to play. Roll me the ball!',chinese:'我准备好玩了，把球滚给我吧！'},
    {tool:'water',english:'I am thirsty after our game.',chinese:'游戏过后，我有点渴了。'},
    {tool:'towel',english:'Wipe my paws before I go inside.',chinese:'进屋之前，请帮我擦擦爪子。'},
    {tool:'bed',english:'Put my bed in the quiet corner.',chinese:'把我的小床放到安静的角落。'},
  ]},
  {id:'rabbit-morning',animal:'rabbit',name:'Clover',title:'柔软的早晨',color:'#c6b7a4',steps:[
    {tool:'brush',english:'Good morning! Brush my fur gently.',chinese:'早上好！请轻轻梳理我的毛。'},
    {tool:'water',english:'Fill my bowl with water, please.',chinese:'请在我的碗里装上清水。'},
    {tool:'tunnel',english:'Let me hop through my play tunnel.',chinese:'让我钻过游戏隧道玩一玩。'},
  ]},
  {id:'cat-hide',animal:'cat',name:'Mochi',title:'小小捉迷藏',color:'#d3a077',steps:[
    {tool:'tunnel',english:'Set out the tunnel. I want to hide!',chinese:'放好隧道，我想玩躲猫猫！'},
    {tool:'feather',english:'Wave the feather toy near the tunnel.',chinese:'在隧道附近挥一挥羽毛玩具。'},
    {tool:'bed',english:'The game is over. Bring my bed, please.',chinese:'游戏结束啦，请拿来我的小床。'},
  ]},
  {id:'dog-cozy',animal:'dog',name:'Biscuit',title:'舒舒服服的傍晚',color:'#bc9472',steps:[
    {tool:'brush',english:'Brush my fur before our quiet evening.',chinese:'安静的傍晚开始前，帮我梳梳毛。'},
    {tool:'blanket',english:'Lay the blanket beside my bed.',chinese:'把毯子铺在我的小床旁边。'},
    {tool:'water',english:'Leave a bowl of water nearby, please.',chinese:'请在旁边放一碗清水。'},
  ]},
  {id:'rabbit-rain',animal:'rabbit',name:'Clover',title:'门边的小雨点',color:'#c6b7a4',steps:[
    {tool:'towel',english:'Wipe the water from my paws gently.',chinese:'轻轻擦掉我爪子上的水。'},
    {tool:'blanket',english:'Spread a soft blanket for me.',chinese:'请为我铺一条柔软的毯子。'},
    {tool:'tunnel',english:'I feel like exploring my tunnel now.',chinese:'现在我想去隧道里探索一下。'},
    {tool:'bed',english:'After exploring, I want to rest in my bed.',chinese:'探索之后，我想在小床里休息。'},
  ]},
  {id:'cat-evening',animal:'cat',name:'Mochi',title:'晚安前的小仪式',color:'#d3a077',steps:[
    {tool:'water',english:'A bowl of water before bedtime, please.',chinese:'睡觉前，请给我一碗清水。'},
    {tool:'blanket',english:'Put my blanket in the quiet corner.',chinese:'把我的毯子放在安静的角落。'},
    {tool:'bed',english:'I am sleepy now. Bring my bed.',chinese:'我现在困了，拿来我的小床吧。'},
  ]},
  {id:'dog-park',animal:'dog',name:'Biscuit',title:'公园游玩归来',color:'#bc9472',steps:[
    {tool:'water',english:'I need some water after my walk.',chinese:'散步之后，我需要喝点清水。'},
    {tool:'towel',english:'Use the soft towel on my muddy paws.',chinese:'用柔软毛巾擦擦我沾泥的爪子。'},
    {tool:'brush',english:'Brush my fur gently, then we can play.',chinese:'轻轻梳理我的毛，然后我们就可以玩了。'},
    {tool:'ball',english:'Roll the ball to finish our afternoon.',chinese:'最后把球滚给我，度过愉快的下午。'},
  ]},
  {id:'rabbit-cozy',animal:'rabbit',name:'Clover',title:'属于我的小角落',color:'#c6b7a4',steps:[
    {tool:'blanket',english:'Put a blanket in my little corner.',chinese:'在我的小角落铺一条毯子。'},
    {tool:'tunnel',english:'Add my play tunnel beside the blanket.',chinese:'把游戏隧道放在毯子旁边。'},
    {tool:'brush',english:'Please brush my fur before I rest.',chinese:'休息之前，请帮我轻轻梳毛。'},
  ]},
]
export const careFriends=careStories.slice(0,3)
export interface CareState extends ActivityProgress, ContentSchedule { round:number;step:number;complete:boolean;selected:CareTool|null;mistakes:number;friends:CareAnimal[];memories:string[] }
export function newCare():CareState { return {...newActivityProgress(),contentFrom:0,round:1,step:0,complete:false,selected:null,mistakes:0,friends:[],memories:[]} }
export function currentCareStory(c:CareState) { return careStories[scheduledIndex(c.round,c.contentFrom,3,careStories.length)]! }
export function currentCareStep(c:CareState) { return currentCareStory(c).steps[c.step] }
export function setCareMode(c:CareState,mode:ActivityMode) { return changeActivityMode(c,mode) }
export function toggleCareHint(c:CareState) { toggleActivityHint(c) }
export function chooseCareTool(c:CareState,tool:string) {
  if (c.complete || !careTools.some(t=>t.id===tool)) return false
  c.selected=c.selected===tool ? null : tool as CareTool; return true
}
type CareHost = {care:CareState;coins:number;progress:{xp:number}}
export function actCare(host:CareHost):{ok:boolean;complete:boolean;reward:number} {
  const c=host.care
  if (c.complete) return {ok:false,complete:false,reward:0}
  if (!c.selected || c.selected!==currentCareStep(c)?.tool) { c.mistakes++; return {ok:false,complete:false,reward:0} }
  if (c.mode==='guide') c.helped=true
  c.step++;c.selected=null;c.hintOpen=false
  if (c.step<currentCareStory(c).steps.length) return {ok:true,complete:false,reward:0}
  c.complete=true;recordActivityCompletion(c)
  const story=currentCareStory(c)
  if (!c.friends.includes(story.animal)) c.friends.push(story.animal)
  if (!c.memories.includes(story.id)) c.memories.push(story.id)
  host.coins+=18;host.progress.xp+=12
  return {ok:true,complete:true,reward:18}
}
export function nextCareRound(c:CareState) {
  if (!c.complete || c.round>=1000000) return false
  c.round++;c.step=0;c.complete=false;c.selected=null;resetActivityAttempt(c);return true
}
export function validCare(value:unknown):value is CareState {
  if (!validActivityProgress(value)) return false
  const c=value as CareState
  if (![c.round,c.step,c.mistakes].every(n=>Number.isSafeInteger(n)&&n>=0) || c.round<1 || c.round>1000000
    || !validContentSchedule(c.contentFrom,c.round) || typeof c.complete!=='boolean'
    || !Array.isArray(c.friends) || new Set(c.friends).size!==c.friends.length
    || !c.friends.every(id=>careFriends.some(story=>story.animal===id))
    || !Array.isArray(c.memories) || new Set(c.memories).size!==c.memories.length
    || c.selected!==null && (!careTools.some(t=>t.id===c.selected)||c.complete)) return false
  const counts=completedLessonCounts(c.round-1+Number(c.complete),c.contentFrom,3,careStories.length)
  const completed=careStories.filter((_,i)=>counts[i]!>0),expected=[...new Set(completed.map(story=>story.animal))]
  return c.step<=currentCareStory(c).steps.length && c.complete===(c.step===currentCareStory(c).steps.length)
    && c.independent+c.assisted===c.round-1+Number(c.complete)
    && c.friends.length===expected.length && expected.every(id=>c.friends.includes(id))
    && c.memories.length===completed.length && completed.every(story=>c.memories.includes(story.id))
}

export function migrateCareV8(value:unknown):CareState|null {
  if (!value || typeof value!=='object') return null
  const legacy=value as CareState
  const memories=careStories.slice(0,Math.min(3,legacy.round-1+Number(legacy.complete))).map(story=>story.id)
  const migrated={...legacy,contentFrom:legacy.round+1,memories}
  return validCare(migrated)?migrated:null
}
