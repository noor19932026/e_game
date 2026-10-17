export type RoomMode = 'guide' | 'reading' | 'listening'
export type RoomChapterId = 'welcome' | 'school' | 'evening' | 'rainy' | 'wash' | 'breakfast' | 'creative' | 'playtime' | 'garden'
export type RoomDestination = 'desk' | 'box' | 'bed' | 'side' | 'shelf' | 'basket' | 'bedtop' | 'hook'
export type RoomItemId = 'book' | 'bear' | 'shoes' | 'bag' | 'pen' | 'ball' | 'hat' | 'shirt' | 'lamp' | 'pillow' | 'plant' | 'blanket' | 'coat' | 'socks' | 'umbrella' | 'towel' | 'cup' | 'toothbrush' | 'plate' | 'spoon' | 'bowl' | 'crayons' | 'picture' | 'robot' | 'car' | 'flower' | 'wateringcan' | 'clock'
export interface RoomItem { id:RoomItemId; word:string; meaning:string; color:string }
export const roomItems: RoomItem[] = [
  {id:'book',word:'book',meaning:'书',color:'#97ac88'}, {id:'bear',word:'teddy bear',meaning:'玩具熊',color:'#c69c74'},
  {id:'shoes',word:'shoes',meaning:'鞋子',color:'#a0adbd'}, {id:'bag',word:'bag',meaning:'书包',color:'#d0a079'},
  {id:'pen',word:'pen',meaning:'笔',color:'#879eaa'}, {id:'ball',word:'ball',meaning:'球',color:'#c79c91'},
  {id:'hat',word:'hat',meaning:'帽子',color:'#c8b781'}, {id:'shirt',word:'shirt',meaning:'衬衫',color:'#a3bca6'},
  {id:'lamp',word:'lamp',meaning:'台灯',color:'#c6b383'}, {id:'pillow',word:'pillow',meaning:'枕头',color:'#b2b6c7'},
  {id:'plant',word:'plant',meaning:'盆栽',color:'#9cae7c'}, {id:'blanket',word:'blanket',meaning:'毯子',color:'#ba9a8a'},
  {id:'coat',word:'coat',meaning:'外套',color:'#b6908e'},
  {id:'socks',word:'socks',meaning:'袜子',color:'#e1b589'},
  {id:'umbrella',word:'umbrella',meaning:'雨伞',color:'#86b7c1'},
  {id:'towel',word:'towel',meaning:'毛巾',color:'#abc9bf'},
  {id:'cup',word:'cup',meaning:'杯子',color:'#dab18e'},
  {id:'toothbrush',word:'toothbrush',meaning:'牙刷',color:'#a4bdd0'},
  {id:'plate',word:'plate',meaning:'盘子',color:'#c1cab0'},
  {id:'spoon',word:'spoon',meaning:'勺子',color:'#aebdc4'},
  {id:'bowl',word:'bowl',meaning:'碗',color:'#b2c6a5'},
  {id:'crayons',word:'crayons',meaning:'蜡笔',color:'#dda28b'},
  {id:'picture',word:'picture',meaning:'画框',color:'#cca67c'},
  {id:'robot',word:'robot',meaning:'机器人玩具',color:'#99b4c5'},
  {id:'car',word:'toy car',meaning:'玩具车',color:'#d99987'},
  {id:'flower',word:'flower',meaning:'花',color:'#e0a3a0'},
  {id:'wateringcan',word:'watering can',meaning:'洒水壶',color:'#8eb8aa'},
  {id:'clock',word:'clock',meaning:'时钟',color:'#e1c48e'},
]
export const roomItemById = Object.fromEntries(roomItems.map(item=>[item.id,item])) as Record<RoomItemId,RoomItem>
export const roomDestinations: {id:RoomDestination; english:string; meaning:string; x:number; y:number; width:number; height:number}[] = [
  {id:'desk',english:'on the desk',meaning:'桌上',x:9,y:45,width:31,height:13},
  {id:'box',english:'in the toy box',meaning:'玩具盒里',x:7,y:75,width:24,height:20},
  {id:'bed',english:'under the bed',meaning:'床下',x:49,y:81,width:45,height:14},
  {id:'side',english:'beside the desk',meaning:'桌子旁',x:33,y:65,width:16,height:29},
  {id:'shelf',english:'on the shelf',meaning:'搁板上',x:57,y:28,width:35,height:14},
  {id:'basket',english:'in the basket',meaning:'收纳篮里',x:7,y:10,width:25,height:24},
  {id:'bedtop',english:'on the bed',meaning:'床上',x:55,y:55,width:38,height:18},
  {id:'hook',english:'on the hook',meaning:'挂钩上',x:78,y:3,width:16,height:20},
]
export interface RoomTask { id:string; item:RoomItemId; destination:RoomDestination; instruction:string; translation:string }
export interface RoomChapter { id:RoomChapterId; title:string; english:string; story:string; badge:string; color:string; goods:RoomItemId[]; tasks:RoomTask[] }
const task = (id:string,item:RoomItemId,destination:RoomDestination,instruction:string,translation:string):RoomTask=>({id,item,destination,instruction,translation})
export const roomChapters: RoomChapter[] = [
  { id:'welcome',title:'搬进新家',english:'A little place of my own',story:'Mia 的纸箱到了。帮她把常用物品安顿好，留出一块玩耍的地方。',badge:'安家小屋',color:'#9aaf92',goods:['book','bear','shoes','bag','hat','plant'],tasks:[
    task('welcome-book','book','desk','Put the book on the desk.','把书放在桌上。'),
    task('welcome-bear','bear','box','Put the teddy bear in the toy box.','把玩具熊放进玩具盒。'),
    task('welcome-shoes','shoes','bed','Put the shoes under the bed.','把鞋子放在床下。'),
    task('welcome-bag','bag','side','Put the bag beside the desk.','把书包放在桌子旁。'),
  ]},
  { id:'school',title:'准备上学啦',english:'Ready for a school day',story:'整理学习角，也给课后的游戏留个位置。找好物品，再听清放在哪里。',badge:'学习角',color:'#a1b8be',goods:['pen','book','ball','hat','shirt','lamp'],tasks:[
    task('school-pen','pen','desk','Put the pen on the desk.','把笔放在桌上。'),
    task('school-book','book','shelf','Put the book on the shelf.','把书放在搁板上。'),
    task('school-ball','ball','box','Put the ball in the toy box.','把球放进玩具盒。'),
    task('school-hat','hat','basket','Put the hat in the basket.','把帽子放进收纳篮。'),
  ]},
  { id:'evening',title:'温暖的夜晚',english:'A cosy evening at home',story:'天色渐晚。收好衣物，摆上台灯和绿植，完成今晚的小小整理。',badge:'晚安小屋',color:'#c0ad93',goods:['shirt','lamp','plant','blanket','pillow','bear'],tasks:[
    task('evening-shirt','shirt','basket','Put the shirt in the basket.','把衬衫放进收纳篮。'),
    task('evening-lamp','lamp','desk','Put the lamp on the desk.','把台灯放在桌上。'),
    task('evening-plant','plant','shelf','Put the plant on the shelf.','把盆栽放在搁板上。'),
    task('evening-blanket','blanket','box','Put the blanket in the toy box.','把毯子收进玩具盒。'),
  ]},
  {id:'rainy',title:'雨天回家',english:'Back home in the rain',story:'雨停了。把外套和雨伞挂好，干爽的袜子与毯子也找个家。',badge:'雨天收纳',color:'#97b5bd',goods:['coat', 'umbrella', 'socks', 'blanket', 'hat', 'shoes'],tasks:[
    task('rainy-coat','coat','hook','Hang the coat on the hook.','把外套挂在挂钩上。'),
    task('rainy-umbrella','umbrella','side','Put the umbrella beside the desk.','把雨伞放在桌旁。'),
    task('rainy-socks','socks','basket','Put the socks in the basket.','把袜子放进篮子。'),
    task('rainy-blanket','blanket','bedtop','Put the blanket on the bed.','把毯子放在床上。'),
  ]},
  {id:'wash',title:'清新的早晨',english:'A fresh start',story:'准备好洗漱用品，喝杯水，然后开启清爽的一天。',badge:'清晨准备',color:'#a4c5bf',goods:['toothbrush', 'cup', 'towel', 'clock', 'bowl', 'lamp'],tasks:[
    task('wash-toothbrush','toothbrush','basket','Put the toothbrush in the basket.','把牙刷放进篮子。'),
    task('wash-cup','cup','desk','Put the cup on the desk.','把杯子放在桌上。'),
    task('wash-towel','towel','hook','Hang the towel on the hook.','把毛巾挂在挂钩上。'),
    task('wash-clock','clock','shelf','Put the clock on the shelf.','把时钟放在搁板上。'),
  ]},
  {id:'breakfast',title:'早餐小角落',english:'A table for breakfast',story:'早餐快好了。布置餐具和小花，再收好身边的围裙衬衫。',badge:'早餐角',color:'#d5b58a',goods:['plate', 'spoon', 'bowl', 'flower', 'cup', 'shirt'],tasks:[
    task('breakfast-plate','plate','desk','Put the plate on the desk.','把盘子放在桌上。'),
    task('breakfast-spoon','spoon','basket','Put the spoon in the basket.','把勺子放进篮子。'),
    task('breakfast-bowl','bowl','shelf','Put the bowl on the shelf.','把碗放在搁板上。'),
    task('breakfast-flower','flower','side','Put the flower beside the desk.','把花放在桌旁。'),
  ]},
  {id:'creative',title:'我的画画角',english:'Make a little art corner',story:'给作品腾出空间。蜡笔、画框和书都有自己的位置。',badge:'小小画家',color:'#c9a19a',goods:['crayons', 'picture', 'book', 'shirt', 'pen', 'flower'],tasks:[
    task('creative-crayons','crayons','desk','Put the crayons on the desk.','把蜡笔放在桌上。'),
    task('creative-picture','picture','shelf','Put the picture on the shelf.','把画框放在搁板上。'),
    task('creative-book','book','side','Put the book beside the desk.','把书放在桌旁。'),
    task('creative-shirt','shirt','hook','Hang the shirt on the hook.','把衬衫挂在挂钩上。'),
  ]},
  {id:'playtime',title:'游戏结束啦',english:'After a lovely playtime',story:'今天的游戏结束了。让玩具回家，把枕头摆好，空出柔软的地毯。',badge:'玩具之家',color:'#b1b3cc',goods:['robot', 'car', 'ball', 'pillow', 'bear', 'bag'],tasks:[
    task('playtime-robot','robot','shelf','Put the robot on the shelf.','把机器人玩具放在搁板上。'),
    task('playtime-car','car','box','Put the toy car in the toy box.','把玩具车放进玩具盒。'),
    task('playtime-ball','ball','bed','Put the ball under the bed.','把球放在床下。'),
    task('playtime-pillow','pillow','bedtop','Put the pillow on the bed.','把枕头放在床上。'),
  ]},
  {id:'garden',title:'窗边小花园',english:'A little indoor garden',story:'在窗边布置一个绿色角落。收好洒水壶，让花和盆栽陪你长大。',badge:'绿色小屋',color:'#a7ba86',goods:['wateringcan', 'plant', 'flower', 'hat', 'cup', 'towel'],tasks:[
    task('garden-wateringcan','wateringcan','side','Put the watering can beside the desk.','把洒水壶放在桌旁。'),
    task('garden-plant','plant','shelf','Put the plant on the shelf.','把盆栽放在搁板上。'),
    task('garden-flower','flower','desk','Put the flower on the desk.','把花放在桌上。'),
    task('garden-hat','hat','hook','Hang the hat on the hook.','把帽子挂在挂钩上。'),
  ]},
]
export interface RoomSession { placed:string[]; selected:RoomItemId|null; unpacked:boolean; helped:boolean; hintOpen:boolean; independent:number; assisted:number; rewarded:boolean }
export interface RoomState { mode:RoomMode; selected:RoomChapterId; sessions:Record<RoomChapterId,RoomSession> }
function newRoomSession():RoomSession { return {placed:[],selected:null,unpacked:false,helped:false,hintOpen:false,independent:0,assisted:0,rewarded:false} }
export function newRoom():RoomState {
  return { mode:'reading',selected:'welcome',sessions:Object.fromEntries(roomChapters.map(chapter=>[chapter.id,newRoomSession()])) as Record<RoomChapterId,RoomSession> }
}
export function currentRoomTask(room:RoomState) { return roomChapters.find(c=>c.id===room.selected)!.tasks[room.sessions[room.selected].placed.length] }
export function roomUnlocked(room:RoomState,id:RoomChapterId) { const index=roomChapters.findIndex(c=>c.id===id); return index>=0 && (index===0 || room.sessions[roomChapters[index-1]!.id].rewarded) }
export function enterRoom(room:RoomState,id:RoomChapterId) { if (!roomChapters.some(c=>c.id===id) || !roomUnlocked(room,id)) return false; room.selected=id; return true }
export function unpackRoom(room:RoomState) { const session=room.sessions[room.selected]; if (session.rewarded) return false; session.unpacked=true; return true }
export function setRoomMode(room:RoomState,mode:RoomMode) {
  if (!['guide','reading','listening'].includes(mode) || mode===room.mode) return false
  for(const chapter of roomChapters) {
    const attempt=room.sessions[chapter.id]
    // Instructions are visible before unpacking. Mark every unlocked unfinished
    // task, including one visited before a detour through a completed room.
    if (!attempt.rewarded && roomUnlocked(room,chapter.id)) attempt.helped=true
    attempt.hintOpen=false
  }
  room.mode=mode; return true
}
export function toggleRoomHint(room:RoomState) { const session=room.sessions[room.selected]; session.hintOpen=!session.hintOpen; if (session.hintOpen && !session.rewarded) session.helped=true }
export function chooseRoomItem(room:RoomState,id:RoomItemId) {
  const chapter=roomChapters.find(c=>c.id===room.selected)!,session=room.sessions[room.selected]
  if (!session.unpacked || session.rewarded || !chapter.goods.includes(id) || chapter.tasks.some(t=>t.item===id && session.placed.includes(t.id))) return false
  session.selected=session.selected===id ? null : id; return true
}
export function placeRoomItem(state:{room:RoomState;coins:number;progress:{xp:number}},destination:RoomDestination):{ok:boolean;complete:boolean;reward:number} {
  const {room}=state,session=room.sessions[room.selected],task=currentRoomTask(room)
  if (!task || !session.unpacked || !session.selected || session.selected!==task.item || destination!==task.destination) return {ok:false,complete:false,reward:0}
  session.placed.push(task.id)
  session[session.helped || room.mode==='guide' ? 'assisted':'independent']++
  session.selected=null; session.helped=room.mode==='guide'; session.hintOpen=false
  const complete=!currentRoomTask(room)
  let reward=0
  if (complete && !session.rewarded) { session.rewarded=true; reward=30; state.coins+=reward; state.progress.xp+=16 }
  return {ok:true,complete,reward}
}
export function validRoom(value:unknown):value is RoomState {
  if (!value || typeof value!=='object') return false
  const room=value as RoomState
  if (!['guide','reading','listening'].includes(room.mode) || !roomChapters.some(c=>c.id===room.selected) || !room.sessions || typeof room.sessions!=='object' || Array.isArray(room.sessions) || Object.keys(room.sessions).length!==roomChapters.length) return false
  if (!roomChapters.every(chapter=>{
    const session=room.sessions[chapter.id]
    if (!session || !Array.isArray(session.placed) || session.placed.length>chapter.tasks.length || !session.placed.every((id,i)=>chapter.tasks[i]!.id===id)
      || ![session.unpacked,session.helped,session.hintOpen,session.rewarded].every(v=>typeof v==='boolean')
      || ![session.independent,session.assisted].every(n=>Number.isSafeInteger(n) && n>=0)
      || session.independent+session.assisted!==session.placed.length || session.rewarded!==(session.placed.length===chapter.tasks.length)
      || (session.placed.length>0 && !session.unpacked) || (session.hintOpen && !session.helped && !session.rewarded)
      || (session.selected!==null && (!chapter.goods.includes(session.selected) || !session.unpacked || session.rewarded || chapter.tasks.some(t=>t.item===session.selected && session.placed.includes(t.id))))) return false
    return true
  })) return false
  return roomChapters.every((chapter,index)=>index===0 || (!room.sessions[chapter.id].unpacked && room.sessions[chapter.id].placed.length===0) || room.sessions[roomChapters[index-1]!.id].rewarded) && roomUnlocked(room,room.selected)
}

/** Extend the original three rooms without changing a saved placement or its rewards. */
export function migrateRoomV8(value:unknown):RoomState|null {
  if (!value || typeof value!=='object' || Array.isArray(value)) return null
  const old=value as RoomState
  if (!old.sessions || typeof old.sessions!=='object' || Array.isArray(old.sessions) || !['welcome','school','evening'].every(id=>Object.hasOwn(old.sessions,id))) return null
  const sessions={...old.sessions}
  for(const chapter of roomChapters.slice(3)) if(!Object.hasOwn(sessions,chapter.id)) sessions[chapter.id]=newRoomSession()
  const candidate={...old,sessions}
  return validRoom(candidate)?candidate:null
}
