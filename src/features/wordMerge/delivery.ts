import { newActivityProgress, validActivityProgress, recordActivityCompletion, resetActivityAttempt, type ActivityProgress } from './activity'
import { completedLessonCounts, scheduledIndex, validContentSchedule, type ContentSchedule } from './content'

export type DeliveryAction = 'pickup' | 'north' | 'east' | 'south' | 'west' | 'deliver'
export interface DeliveryRoute { id:string; name:string; english:string; map:string; destination:[number,number]; directions:DeliveryAction[] }
export const deliveryRoutes:DeliveryRoute[] = [
  { id:'park', map:'town', name:'公园', english:'park', destination:[3,1], directions:['north','north','east','east','north','east'] },
  { id:'bakery', map:'town', name:'面包店', english:'bakery', destination:[4,3], directions:['north','east','east','south','east','east','north'] },
  { id:'school', map:'town', name:'学校', english:'school', destination:[3,0], directions:['east','east','north','north','west','north','east','north','east'] },
  { id:'library', map:'town', name:'图书馆', english:'library', destination:[1,1], directions:['north','north','north','east'] },
  { id:'home', map:'town', name:'邻居家', english:'house', destination:[2,4], directions:['north','east','east','south'] },
  { id:'fountain', map:'town', name:'喷泉广场', english:'fountain', destination:[2,2], directions:['east','north','north','east'] },
  { id:'river-market', map:'river', name:'河畔市场', english:'market', destination:[2,3], directions:['east','east','north'] },
  { id:'river-pet-shop', map:'river', name:'宠物店', english:'pet shop', destination:[1,1], directions:['north','north','north','east'] },
  { id:'river-cafe', map:'river', name:'河畔咖啡馆', english:'café', destination:[4,3], directions:['east','east','north','east','east'] },
  { id:'river-garden', map:'river', name:'花园', english:'garden', destination:[0,0], directions:['east','north','north','west','north','north'] },
  { id:'river-harbor', map:'river', name:'小码头', english:'harbor', destination:[4,0], directions:['north','north','east','east','east','east','north','north'] },
  { id:'river-bridge', map:'river', name:'小桥', english:'bridge', destination:[2,2], directions:['east','east','north','east','north','west'] },
  { id:'hill-clinic', map:'hill', name:'诊所', english:'clinic', destination:[0,2], directions:['north','north'] },
  { id:'hill-station', map:'hill', name:'车站', english:'station', destination:[4,4], directions:['north','east','east','south','east','east'] },
  { id:'hill-museum', map:'hill', name:'博物馆', english:'museum', destination:[1,0], directions:['north','east','north','north','north'] },
  { id:'hill-meadow', map:'hill', name:'草地', english:'meadow', destination:[3,3], directions:['east','east','east','north'] },
  { id:'hill-sports', map:'hill', name:'运动场', english:'sports center', destination:[4,2], directions:['east','north','east','east','east','north'] },
  { id:'hill-lookout', map:'hill', name:'观景台', english:'lookout', destination:[4,0], directions:['north','east','north','north','north','east','east','east'] },
]
export const deliveryLandmarks = [
  {x:0,y:4,kind:'depot',word:'Depot'}, {x:2,y:2,kind:'fountain',word:'Fountain'},
  {x:1,y:1,kind:'library',word:'Library'}, {x:3,y:1,kind:'park',word:'Park'},
  {x:4,y:3,kind:'bakery',word:'Bakery'}, {x:3,y:0,kind:'school',word:'School'},
  {x:2,y:4,kind:'house',word:'Home'},
]
export const deliveryObstacles = [[0,0],[4,0],[4,1],[3,2],[4,2]]
export interface DeliveryMap { id:string; name:string; english:string; terrain:'garden'|'water'|'hill'; landmarks:typeof deliveryLandmarks; obstacles:number[][] }
export const deliveryMaps:DeliveryMap[] = [
  {id:'town',name:'街角小镇',english:'THE LITTLE TOWN',terrain:'garden',landmarks:deliveryLandmarks,obstacles:deliveryObstacles},
  {id:'river',name:'河畔街区',english:'THE RIVERSIDE',terrain:'water',obstacles:[[2,0],[2,1],[3,0],[4,4]],landmarks:[
    {x:0,y:4,kind:'depot',word:'Depot'},{x:2,y:3,kind:'market',word:'Market'},
    {x:1,y:1,kind:'pet-shop',word:'Pet shop'},{x:4,y:3,kind:'cafe',word:'Café'},
    {x:0,y:0,kind:'garden',word:'Garden'},{x:4,y:0,kind:'harbor',word:'Harbor'},
    {x:2,y:2,kind:'bridge',word:'Bridge'},
  ]},
  {id:'hill',name:'山丘新城',english:'THE GREEN HILLS',terrain:'hill',obstacles:[[0,0],[0,1],[2,1],[3,1],[3,2]],landmarks:[
    {x:0,y:4,kind:'depot',word:'Depot'},{x:0,y:2,kind:'clinic',word:'Clinic'},
    {x:4,y:4,kind:'station',word:'Station'},{x:1,y:0,kind:'museum',word:'Museum'},
    {x:3,y:3,kind:'meadow',word:'Meadow'},{x:4,y:2,kind:'sports',word:'Sports'},
    {x:4,y:0,kind:'lookout',word:'Lookout'},
  ]},
]
export const deliveryVector:Record<'north'|'east'|'south'|'west',[number,number]> = { north:[0,-1], east:[1,0], south:[0,1], west:[-1,0] }
export interface DeliveryState extends ActivityProgress, ContentSchedule {
  round:number; step:number; x:number; y:number; parcel:boolean; delivered:boolean; mistakes:number; stamps:string[]
}
export function newDelivery():DeliveryState {
  return {...newActivityProgress(),contentFrom:0,round:1,step:0,x:0,y:4,parcel:false,delivered:false,mistakes:0,stamps:[]}
}
export function currentDeliveryRoute(d:DeliveryState) { return deliveryRoutes[scheduledIndex(d.round,d.contentFrom,3,deliveryRoutes.length)]! }
export function currentDeliveryMap(d:DeliveryState) { return deliveryMaps.find(map=>map.id===currentDeliveryRoute(d).map)! }
export function deliveryActions(d:DeliveryState):DeliveryAction[] { return ['pickup',...currentDeliveryRoute(d).directions,'deliver'] }
export function currentDeliveryCommand(d:DeliveryState):{action:DeliveryAction|undefined;english:string;chinese:string} {
  const action = deliveryActions(d)[d.step]
  if (action === 'pickup') return {action,english:'Pick up the parcel.',chinese:'先在邮局领取包裹。'}
  if (action === 'deliver') return {action,english:`Deliver the parcel to the ${currentDeliveryRoute(d).english}.`,chinese:`把包裹交给${currentDeliveryRoute(d).name}。`}
  const meanings = {north:'向北（上）',east:'向东（右）',south:'向南（下）',west:'向西（左）'}
  if (action) return {action,english:`Go one block ${action}.`,chinese:`${meanings[action]}走一格。地图始终上北下南。`}
  return {action:undefined,english:'Delivery complete. Thank you!',chinese:'包裹送达了，谢谢你！'}
}
type DeliveryHost = { delivery:DeliveryState; coins:number; progress:{xp:number} }
export function actDelivery(host:DeliveryHost, action:string):{ok:boolean;completed:boolean;reward:number} {
  const d = host.delivery
  if (d.delivered) return {ok:false,completed:false,reward:0}
  if (currentDeliveryCommand(d).action !== action) { d.mistakes++; return {ok:false,completed:false,reward:0} }
  if (d.mode === 'guide') d.helped = true
  if (action === 'pickup') d.parcel = true
  else if (action === 'deliver') {
    d.parcel = false; d.delivered = true; d.step++
    const route = currentDeliveryRoute(d)
    if (!d.stamps.includes(route.id)) d.stamps.push(route.id)
    recordActivityCompletion(d); host.coins += 20; host.progress.xp += 12
    return {ok:true,completed:true,reward:20}
  } else {
    const vector = deliveryVector[action as keyof typeof deliveryVector]
    if (!vector) return {ok:false,completed:false,reward:0}
    d.x += vector[0]; d.y += vector[1]
  }
  d.step++
  return {ok:true,completed:false,reward:0}
}
export function nextDeliveryRound(d:DeliveryState) {
  if (!d.delivered || d.round >= 1000000) return false
  d.round++; d.step=0; d.x=0; d.y=4; d.parcel=false; d.delivered=false; resetActivityAttempt(d); return true
}
export function validDelivery(value:unknown):value is DeliveryState {
  if (!value || typeof value !== 'object') return false
  const d=value as DeliveryState
  if (!validActivityProgress(d) || !validContentSchedule(d.contentFrom,d.round) || ![d.round,d.step,d.x,d.y,d.mistakes].every(n=>Number.isSafeInteger(n)&&n>=0)
    || d.round < 1 || d.round > 1000000 || typeof d.parcel !== 'boolean' || typeof d.delivered !== 'boolean'
    || !Array.isArray(d.stamps) || new Set(d.stamps).size !== d.stamps.length) return false
  const actions=deliveryActions(d)
  if (d.step > actions.length || d.delivered !== (d.step===actions.length)
    || d.parcel !== (d.step>0&&!d.delivered) || d.independent+d.assisted !== d.round-1+Number(d.delivered)) return false
  let x=0,y=4
  for (const action of actions.slice(0,d.step)) if (action in deliveryVector) {const v=deliveryVector[action as keyof typeof deliveryVector]; x+=v[0]; y+=v[1]}
  const counts=completedLessonCounts(d.round-1+Number(d.delivered),d.contentFrom,3,deliveryRoutes.length)
  const expected=deliveryRoutes.filter((_,i)=>counts[i]!>0).map(r=>r.id)
  return d.x===x && d.y===y && expected.length===d.stamps.length && expected.every(id=>d.stamps.includes(id))
}
