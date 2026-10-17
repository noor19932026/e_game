import { newActivityProgress, validActivityProgress, recordActivityCompletion, resetActivityAttempt, type ActivityProgress } from './activity'
import { completedLessonCounts, scheduledIndex, validContentSchedule, type ContentSchedule } from './content'

export interface PondFish { id:string; color:string; colorName:string; size:'small'|'big'; striped?:boolean; spotted?:boolean; english:string; chinese:string }
export const pondFish:PondFish[] = [
  {id:'small-yellow',color:'#ddbc61',colorName:'yellow',size:'small',english:'small yellow fish',chinese:'小黄鱼'},
  {id:'big-yellow',color:'#ddbc61',colorName:'yellow',size:'big',english:'big yellow fish',chinese:'大黄鱼'},
  {id:'small-blue',color:'#83a8bd',colorName:'blue',size:'small',english:'small blue fish',chinese:'小蓝鱼'},
  {id:'big-blue',color:'#83a8bd',colorName:'blue',size:'big',english:'big blue fish',chinese:'大蓝鱼'},
  {id:'small-red',color:'#cd897a',colorName:'red',size:'small',english:'small red fish',chinese:'小红鱼'},
  {id:'big-red',color:'#cd897a',colorName:'red',size:'big',english:'big red fish',chinese:'大红鱼'},
  {id:'small-green',color:'#98b48b',colorName:'green',size:'small',english:'small green fish',chinese:'小绿鱼'},
  {id:'big-green',color:'#98b48b',colorName:'green',size:'big',english:'big green fish',chinese:'大绿鱼'},
  {id:'small-striped',color:'#c3a5bd',colorName:'purple',size:'small',striped:true,english:'small striped fish',chinese:'有条纹的小鱼'},
  {id:'small-orange',color:'#dfaa6d',colorName:'orange',size:'small',english:'small orange fish',chinese:'小橙鱼'},
  {id:'big-orange',color:'#dfaa6d',colorName:'orange',size:'big',english:'big orange fish',chinese:'大橙鱼'},
  {id:'small-purple',color:'#c3a5bd',colorName:'purple',size:'small',english:'small purple fish',chinese:'小紫鱼'},
  {id:'big-purple',color:'#c3a5bd',colorName:'purple',size:'big',english:'big purple fish',chinese:'大紫鱼'},
  {id:'small-pink',color:'#e5b7c1',colorName:'pink',size:'small',english:'small pink fish',chinese:'小粉鱼'},
  {id:'big-pink',color:'#e5b7c1',colorName:'pink',size:'big',english:'big pink fish',chinese:'大粉鱼'},
  {id:'small-white',color:'#f4f2df',colorName:'white',size:'small',english:'small white fish',chinese:'小白鱼'},
  {id:'big-white',color:'#f4f2df',colorName:'white',size:'big',english:'big white fish',chinese:'大白鱼'},
  {id:'small-black',color:'#697173',colorName:'black',size:'small',english:'small black fish',chinese:'小黑鱼'},
  {id:'big-black',color:'#697173',colorName:'black',size:'big',english:'big black fish',chinese:'大黑鱼'},
  {id:'small-brown',color:'#ad8869',colorName:'brown',size:'small',english:'small brown fish',chinese:'小棕鱼'},
  {id:'big-brown',color:'#ad8869',colorName:'brown',size:'big',english:'big brown fish',chinese:'大棕鱼'},
  {id:'big-blue-striped',color:'#83a8bd',colorName:'blue',size:'big',striped:true,english:'big blue striped fish',chinese:'有条纹的大蓝鱼'},
  {id:'big-orange-striped',color:'#dfaa6d',colorName:'orange',size:'big',striped:true,english:'big orange striped fish',chinese:'有条纹的大橙鱼'},
  {id:'small-red-spotted',color:'#cd897a',colorName:'red',size:'small',spotted:true,english:'small red spotted fish',chinese:'有斑点的小红鱼'},
  {id:'big-yellow-spotted',color:'#ddbc61',colorName:'yellow',size:'big',spotted:true,english:'big yellow spotted fish',chinese:'有斑点的大黄鱼'},
  {id:'small-green-spotted',color:'#98b48b',colorName:'green',size:'small',spotted:true,english:'small green spotted fish',chinese:'有斑点的小绿鱼'},
  {id:'big-purple-spotted',color:'#c3a5bd',colorName:'purple',size:'big',spotted:true,english:'big purple spotted fish',chinese:'有斑点的大紫鱼'},
]
export const pondFishById:Record<string,PondFish> = Object.fromEntries(pondFish.map(f=>[f.id,f]))
export const fishingSets = [
  ['small-yellow','big-blue','small-red'],
  ['big-yellow','small-blue','big-green'],
  ['small-striped','big-red','small-green'],
  ['small-orange','big-orange','small-purple'],
  ['big-purple','small-pink','big-pink'],
  ['small-white','big-white','small-black'],
  ['big-black','small-brown','big-brown'],
  ['big-blue-striped','big-orange-striped','small-red-spotted'],
  ['big-yellow-spotted','small-green-spotted','big-purple-spotted'],
  ['small-red','small-red-spotted','big-red'],
  ['big-blue','big-blue-striped','small-blue'],
  ['small-purple','small-striped','big-purple'],
  ['small-green-spotted','big-green','small-green'],
  ['big-orange-striped','small-orange','big-orange'],
  ['big-purple-spotted','big-purple','small-purple'],
  ['small-yellow','big-yellow-spotted','big-yellow'],
  ['small-white','small-black','small-brown'],
  ['big-pink','big-red','big-orange'],
  ['small-blue','small-green-spotted','small-striped'],
  ['big-yellow-spotted','big-orange-striped','big-blue-striped'],
  ['big-black','small-pink','big-purple-spotted'],
]
export interface FishingState extends ActivityProgress, ContentSchedule {
  round:number; caught:string[]; completed:boolean; misses:number; collection:string[]
}
export function newFishing():FishingState { return {...newActivityProgress(),contentFrom:0,round:1,caught:[],completed:false,misses:0,collection:[]} }
export function currentFishingSet(f:FishingState) { return fishingSets[scheduledIndex(f.round,f.contentFrom,3,fishingSets.length)]! }
// Keep nine generous touch targets, even as the catalogue grows. Similar looking
// neighbours teach size/pattern discrimination without ever hiding a needed fish.
export function visiblePondFish(f:FishingState):PondFish[] {
  const set=currentFishingSet(f)
  const index=scheduledIndex(f.round,f.contentFrom,3,fishingSets.length)
  const seed=f.round*31+index*17
  const rank=(fish:PondFish)=>((pondFish.indexOf(fish)+1)*73+seed*19)%107
  const pool=index<3 ? pondFish.slice(0,9) : pondFish
  const selected=set.map(id=>pondFishById[id]!)
  const candidates=pool.filter(fish=>!set.includes(fish.id)).sort((a,b)=>{
    const relevance=(fish:PondFish)=>selected.some(target=>target.colorName===fish.colorName)?100:0
    return relevance(b)-relevance(a) || rank(a)-rank(b)
  })
  const choices=[...selected,...candidates.slice(0,9-selected.length)]
  return choices.sort((a,b)=>rank(a)-rank(b))
}
export function currentFishingTarget(f:FishingState) { const id=currentFishingSet(f)[f.caught.length]; return id ? pondFishById[id] : undefined }
export function fishingDescription(f:FishingState,fish:PondFish) {
  const patternedNeighbour=!fish.striped&&!fish.spotted&&visiblePondFish(f).some(other=>other.size===fish.size&&other.colorName===fish.colorName&&(other.striped||other.spotted))
  return patternedNeighbour ? {english:`${fish.size} plain ${fish.colorName} fish`,chinese:`没有花纹的${fish.chinese}`} : fish
}
export function fishingCommand(f:FishingState) {
  const target=currentFishingTarget(f)
  const description=target&&fishingDescription(f,target)
  return description ? {english:`Catch the ${description.english}.`,chinese:`试着钓到${description.chinese}。点水面上的小鱼下钩。`} : {english:'A lovely catch! Let the fish swim free.',chinese:'今天的观察完成啦！让小鱼回到池塘，留下图鉴和回忆。'}
}
type FishingHost={fishing:FishingState;coins:number;progress:{xp:number}}
export function catchFish(host:FishingHost,id:string):{ok:boolean;completed:boolean;reward:number} {
  const f=host.fishing
  if (f.completed) return {ok:false,completed:false,reward:0}
  if (currentFishingTarget(f)?.id !== id) { f.misses++; return {ok:false,completed:false,reward:0} }
  if (f.mode==='guide') f.helped=true
  f.caught.push(id)
  if(!f.collection.includes(id)) f.collection.push(id)
  if(f.caught.length<currentFishingSet(f).length) return {ok:true,completed:false,reward:0}
  f.completed=true; recordActivityCompletion(f); host.coins+=20; host.progress.xp+=12
  return {ok:true,completed:true,reward:20}
}
export function nextFishingRound(f:FishingState) {
  if(!f.completed || f.round>=1000000) return false
  f.round++;f.caught=[];f.completed=false;resetActivityAttempt(f);return true
}
export function validFishing(value:unknown):value is FishingState {
  if(!value||typeof value!=='object') return false
  const f=value as FishingState
  if(!validActivityProgress(f)||!validContentSchedule(f.contentFrom,f.round)||![f.round,f.misses].every(n=>Number.isSafeInteger(n)&&n>=0)||f.round<1||f.round>1000000
    ||typeof f.completed!=='boolean'||!Array.isArray(f.caught)||!Array.isArray(f.collection)
    ||new Set(f.collection).size!==f.collection.length) return false
  const set=currentFishingSet(f)
  if(f.caught.length>set.length || !f.caught.every((id,i)=>id===set[i]) || f.completed!==(f.caught.length===set.length)
    ||f.independent+f.assisted!==f.round-1+Number(f.completed)) return false
  const counts=completedLessonCounts(f.round-1,f.contentFrom,3,fishingSets.length)
  const expected=new Set(fishingSets.filter((_,i)=>counts[i]!>0).flat().concat(f.caught))
  return f.collection.length===expected.size&&f.collection.every(id=>expected.has(id))
}
