import { newActivityProgress, validActivityProgress, type ActivityMode, type ActivityProgress } from './activity'

export interface AdventureObject { id:string; art:string; name:string; meaning:string; x:number; y:number; size?:number; hiddenUntil?:number }
export interface AdventureStep { target:string; command:string; translation:string; take?:boolean; use?:string }
export interface AdventureScene {
  id:string; title:string; kind:'treasure'|'puzzle'; setting:'park'|'classroom'|'camp'|'library'|'beach'|'garden'|'kitchen'; caption:string;
  objects:AdventureObject[]; steps:AdventureStep[]; coins:number; xp:number
}
const object = (id:string, art:string, name:string, meaning:string, x:number, y:number, size=14, hiddenUntil=0):AdventureObject => ({id,art,name,meaning,x,y,size,hiddenUntil})
export const adventureScenes:AdventureScene[] = [
  {id:'park-treasure',title:'公园寻宝',kind:'treasure',setting:'park',caption:'沿着英文线索找齐三件物品，再打开宝箱。',coins:24,xp:18,
    objects:[object('bag','bag','red bag','红色书包',28,67),object('ball','ball','yellow ball','黄色皮球',69,67),object('bottle','bottle','blue bottle','蓝色水瓶',48,34),object('apple','apple','apple','苹果',11,36),object('hat','hat','hat','帽子',50,84),object('book','book','book','书',88,40),object('chest','chest','treasure chest','宝箱',87,85,18)],
    steps:[{target:'bag',command:'Find the red bag under the chair.',translation:'找到椅子下面的红色书包。',take:true},{target:'ball',command:'Find the yellow ball beside the tree.',translation:'找到树旁的黄色皮球。',take:true},{target:'bottle',command:'Find the blue bottle on the table.',translation:'找到桌上的蓝色水瓶。',take:true},{target:'chest',command:'Open the treasure chest.',translation:'打开宝箱。'}]},
  {id:'class-treasure',title:'教室寻宝',kind:'treasure',setting:'classroom',caption:'课后教室藏着三条线索，仔细看位置。',coins:24,xp:18,
    objects:[object('book','book','green book','绿色的书',47,39),object('bag','blue-bag','blue bag','蓝色书包',71,70),object('pencil','pencil','red pencil','红色铅笔',45,76),object('ball','ball','ball','皮球',12,78),object('bottle','bottle','bottle','水瓶',89,40),object('hat','hat','hat','帽子',15,39),object('chest','chest','treasure chest','宝箱',88,85,18)],
    steps:[{target:'book',command:'Find the green book on the desk.',translation:'找到书桌上的绿色书。',take:true},{target:'bag',command:'Find the blue bag beside the chair.',translation:'找到椅子旁边的蓝色书包。',take:true},{target:'pencil',command:'Find the red pencil under the desk.',translation:'找到书桌下面的红色铅笔。',take:true},{target:'chest',command:'Open the treasure chest.',translation:'打开宝箱。'}]},
  {id:'camp-treasure',title:'营地寻宝',kind:'treasure',setting:'camp',caption:'阳光营地里藏着一份探险礼物。',coins:24,xp:18,
    objects:[object('lantern','lantern','lantern','提灯',45,61),object('map','map','map','地图',61,42),object('boots','boots','boots','靴子',73,76),object('apple','apple','apple','苹果',14,80),object('ball','ball','ball','皮球',48,86),object('bottle','bottle','bottle','水瓶',12,40),object('chest','chest','treasure chest','宝箱',89,86,16)],
    steps:[{target:'lantern',command:'Find the lantern beside the tent.',translation:'找到帐篷旁边的提灯。',take:true},{target:'map',command:'Find the map on the table.',translation:'找到桌上的地图。',take:true},{target:'boots',command:'Find the boots under the tree.',translation:'找到树下的靴子。',take:true},{target:'chest',command:'Open the treasure chest.',translation:'打开宝箱。'}]},
  {id:'garden-door',title:'花园小门',kind:'puzzle',setting:'classroom',caption:'花园的小门关着，寻找工具，让阳光走进来。',coins:30,xp:22,
    objects:[object('key','key','key','钥匙',29,73),object('door','door','garden door','花园门',85,47,25),object('book','book','book','书',48,39),object('bag','bag','bag','书包',61,76),object('hat','hat','hat','帽子',12,43),object('ball','ball','ball','皮球',13,81)],
    steps:[{target:'key',command:'Pick up the key under the chair.',translation:'捡起椅子下面的钥匙。',take:true},{target:'door',command:'Use the key to open the door.',translation:'用钥匙打开门。',use:'key'}]},
  {id:'stream-bridge',title:'小溪另一边',kind:'puzzle',setting:'park',caption:'帮探险队修好小桥，抵达小溪对岸。',coins:30,xp:22,
    objects:[object('plank','plank','wooden plank','木板',21,78,20),object('bridge','bridge','bridge','桥',56,68,24),object('flag','flag','flag','旗帜',86,45,17),object('apple','apple','apple','苹果',15,36),object('bag','bag','bag','书包',36,39),object('bottle','bottle','bottle','水瓶',89,79)],
    steps:[{target:'plank',command:'Pick up the wooden plank beside the tree.',translation:'捡起树旁的木板。',take:true},{target:'bridge',command:'Use the plank to fix the bridge.',translation:'用木板修好小桥。',use:'plank'},{target:'flag',command:'Cross the bridge and collect the flag.',translation:'走过小桥，拿到旗帜。',take:true}]},
  {id:'camp-map',title:'帐篷里的地图',kind:'puzzle',setting:'camp',caption:'准备好探险工具，寻找下一段旅途的地图。',coins:30,xp:22,
    objects:[object('flashlight','flashlight','flashlight','手电筒',62,42),object('tent','tent','tent','帐篷',25,56,32),object('map','map','map','地图',26,63,15,2),object('hat','hat','hat','帽子',83,74),object('boots','boots','boots','靴子',54,83),object('bottle','bottle','bottle','水瓶',87,36)],
    steps:[{target:'flashlight',command:'Take the flashlight from the table.',translation:'从桌上拿起手电筒。',take:true},{target:'tent',command:'Use the flashlight to light up the tent.',translation:'用手电筒照亮帐篷。',use:'flashlight'},{target:'map',command:'Find the map inside the tent.',translation:'找到帐篷里面的地图。',take:true}]},
  {id:'library-treasure',title:'图书馆的书签',kind:'treasure',setting:'library',caption:'在安静的阅读角找齐借书用的小物件。',coins:26,xp:18,
    objects:[object('book','blue-book','blue book','蓝色的书',17,20),object('pencil','pencil','red pencil','红色铅笔',50,52),object('cup','cup','cup','杯子',83,20),object('bag','bag','red bag','红色书包',17,84),object('clock','clock','clock','时钟',50,20),object('hat','hat','hat','帽子',83,52),object('chest','chest','treasure chest','宝箱',83,84,18)],
    steps:[{target:'book',command:'Find the blue book on the shelf.',translation:'找到搁板上的蓝色书。',take:true},{target:'pencil',command:'Find the red pencil on the table.',translation:'找到桌上的红色铅笔。',take:true},{target:'bag',command:'Find the red bag under the shelf.',translation:'找到搁板下面的红色书包。',take:true},{target:'chest',command:'Open the treasure chest.',translation:'打开宝箱。'}]},
  {id:'beach-treasure',title:'海边贝壳盒',kind:'treasure',setting:'beach',caption:'沙滩上的足迹通向一只小小收藏盒。',coins:26,xp:18,
    objects:[object('shell','shell','pink shell','粉色贝壳',17,84),object('hat','hat','hat','帽子',50,20),object('bucket','bucket','bucket','水桶',83,52),object('ball','red-ball','red ball','红色皮球',17,52),object('bottle','green-bottle','green bottle','绿色水瓶',50,84),object('flag','flag','flag','旗帜',83,20),object('chest','chest','treasure chest','宝箱',83,84,18)],
    steps:[{target:'hat',command:'Find the hat under the umbrella.',translation:'找到遮阳伞下面的帽子。',take:true},{target:'ball',command:'Find the red ball beside the boat.',translation:'找到小船旁的红色皮球。',take:true},{target:'shell',command:'Find the pink shell on the sand.',translation:'找到沙子上的粉色贝壳。',take:true},{target:'chest',command:'Open the treasure chest.',translation:'打开宝箱。'}]},
  {id:'garden-treasure',title:'花园里的小秘密',kind:'treasure',setting:'garden',caption:'花盆和花架之间，有园丁留下的小礼物。',coins:26,xp:18,
    objects:[object('flower','flower','pink flower','粉色的花',17,20),object('wateringcan','wateringcan','watering can','洒水壶',17,84),object('leaf','leaf','green leaf','绿色叶子',50,52),object('cup','cup','cup','杯子',50,20),object('boots','boots','boots','靴子',83,52),object('bottle','bottle','blue bottle','蓝色水瓶',50,84),object('chest','chest','treasure chest','宝箱',83,84,18)],
    steps:[{target:'flower',command:'Find the pink flower on the flower stand.',translation:'找到花架上的粉色花。',take:true},{target:'leaf',command:'Find the green leaf on the path.',translation:'找到小路上的绿色叶子。',take:true},{target:'wateringcan',command:'Find the watering can under the flower stand.',translation:'找到花架下面的洒水壶。',take:true},{target:'chest',command:'Open the treasure chest.',translation:'打开宝箱。'}]},
  {id:'kitchen-treasure',title:'早餐厨房寻宝',kind:'treasure',setting:'kitchen',caption:'早餐后，找回散落在厨房里的餐具。',coins:26,xp:18,
    objects:[object('cup','cup','cup','杯子',17,20),object('spoon','spoon','spoon','勺子',50,52),object('bowl','bowl','green bowl','绿色的碗',83,20),object('towel','towel','towel','毛巾',17,84),object('apple','apple','apple','苹果',83,52),object('bottle','bottle','bottle','水瓶',50,84),object('chest','chest','treasure chest','宝箱',83,84,18)],
    steps:[{target:'cup',command:'Find the cup on the left shelf.',translation:'找到左边搁板上的杯子。',take:true},{target:'spoon',command:'Find the spoon on the table.',translation:'找到桌上的勺子。',take:true},{target:'bowl',command:'Find the green bowl on the right shelf.',translation:'找到右边搁板上的绿色碗。',take:true},{target:'chest',command:'Open the treasure chest.',translation:'打开宝箱。'}]},
  {id:'library-lost-things',title:'阅读角失物招领',kind:'treasure',setting:'library',caption:'整理公共阅读角，把失物交回给主人。',coins:28,xp:20,
    objects:[object('hat','hat','hat','帽子',17,20),object('clock','clock','clock','时钟',50,20),object('book','book','green book','绿色书',83,20),object('bag','blue-bag','blue bag','蓝色书包',17,52),object('picture','picture','picture','画框',50,52),object('cup','cup','cup','杯子',83,52),object('chest','chest','treasure chest','宝箱',83,84,18)],
    steps:[{target:'hat',command:'Find the hat above the blue bag.',translation:'找到蓝色书包上方的帽子。',take:true},{target:'picture',command:'Find the picture between the bag and the cup.',translation:'找到书包和杯子之间的画框。',take:true},{target:'book',command:'Find the green book on the right shelf.',translation:'找到右边搁板上的绿色书。',take:true},{target:'chest',command:'Open the treasure chest.',translation:'打开宝箱。'}]},
  {id:'beach-picnic',title:'海边野餐寻宝',kind:'treasure',setting:'beach',caption:'野餐前，沿着沙滩找回大家的物品。',coins:28,xp:20,
    objects:[object('bottle','green-bottle','green bottle','绿色水瓶',50,20),object('ball','ball','yellow ball','黄色皮球',17,52),object('shell','shell','pink shell','粉色贝壳',17,84),object('hat','hat','hat','帽子',83,20),object('bucket','bucket','bucket','水桶',83,52),object('bag','bag','red bag','红色书包',50,84),object('chest','chest','treasure chest','宝箱',83,84,18)],
    steps:[{target:'bottle',command:'Find the green bottle under the umbrella.',translation:'找到遮阳伞下面的绿色水瓶。',take:true},{target:'ball',command:'Find the yellow ball on the left.',translation:'找到左边的黄色皮球。',take:true},{target:'bag',command:'Find the red bag between the shell and the chest.',translation:'找到贝壳和宝箱之间的红色书包。',take:true},{target:'chest',command:'Open the treasure chest.',translation:'打开宝箱。'}]},
  {id:'library-cupboard',title:'借书柜的钥匙',kind:'puzzle',setting:'library',caption:'借书柜锁上了，里面藏着一张新的阅读地图。',coins:32,xp:24,
    objects:[object('key','key','key','钥匙',17,84),object('cupboard','cupboard','cupboard','柜子',83,52,20),object('map','map','map','地图',83,52,16,2),object('book','book','book','书',17,20),object('cup','cup','cup','杯子',50,52),object('clock','clock','clock','时钟',50,20)],
    steps:[{target:'key',command:'Pick up the key under the shelf.',translation:'捡起搁板下面的钥匙。',take:true},{target:'cupboard',command:'Use the key to open the cupboard.',translation:'用钥匙打开柜子。',use:'key'},{target:'map',command:'Take the map from the cupboard.',translation:'从柜子里拿出地图。',take:true}]},
  {id:'garden-flower',title:'给小花喝水',kind:'puzzle',setting:'garden',caption:'小花有点渴。找到工具，给花园添上一点颜色。',coins:32,xp:24,
    objects:[object('wateringcan','wateringcan','watering can','洒水壶',17,84),object('plant','plant','plant','盆栽',83,52,18),object('flower','flower','flower','花',83,52,16,2),object('leaf','leaf','leaf','叶子',50,52),object('boots','boots','boots','靴子',17,20),object('bottle','bottle','bottle','水瓶',50,20)],
    steps:[{target:'wateringcan',command:'Pick up the watering can on the left.',translation:'拿起左边的洒水壶。',take:true},{target:'plant',command:'Use the watering can to water the plant.',translation:'用洒水壶给盆栽浇水。',use:'wateringcan'},{target:'flower',command:'Look at the new flower and collect it.',translation:'看看新开的花，再把它收下。',take:true}]},
  {id:'beach-boat',title:'把小船拉上岸',kind:'puzzle',setting:'beach',caption:'小船靠岸了。把它系好，取回船上的小旗。',coins:32,xp:24,
    objects:[object('rope','rope','rope','绳子',17,84),object('boat','boat','boat','小船',50,52,20),object('flag','flag','flag','旗帜',50,52,16,2),object('shell','shell','shell','贝壳',17,20),object('bucket','bucket','bucket','水桶',83,52),object('hat','hat','hat','帽子',83,20)],
    steps:[{target:'rope',command:'Pick up the rope on the sand.',translation:'捡起沙子上的绳子。',take:true},{target:'boat',command:'Use the rope to pull the boat to the shore.',translation:'用绳子把小船拉到岸边。',use:'rope'},{target:'flag',command:'Take the flag from the boat.',translation:'从船上拿起旗帜。',take:true}]},
  {id:'kitchen-snack',title:'搅一碗水果沙拉',kind:'puzzle',setting:'kitchen',caption:'水果准备好了，还缺一把搅拌的小勺。',coins:32,xp:24,
    objects:[object('spoon','spoon','spoon','勺子',17,20),object('bowl','bowl','bowl','碗',50,52,20),object('salad','salad','fruit salad','水果沙拉',50,52,16,2),object('cup','cup','cup','杯子',83,20),object('towel','towel','towel','毛巾',17,84),object('apple','apple','apple','苹果',83,52)],
    steps:[{target:'spoon',command:'Take the spoon from the left shelf.',translation:'从左边搁板上拿起勺子。',take:true},{target:'bowl',command:'Use the spoon to mix the fruit in the bowl.',translation:'用勺子搅拌碗里的水果。',use:'spoon'},{target:'salad',command:'Take the fruit salad to the picnic.',translation:'拿上水果沙拉去野餐。',take:true}]},
  {id:'garden-window',title:'擦亮花房玻璃',kind:'puzzle',setting:'garden',caption:'擦去玻璃上的水雾，寻找藏起来的小钥匙。',coins:36,xp:26,
    objects:[object('towel','towel','towel','毛巾',17,84),object('window','window','window','窗户',50,20,20),object('key','key','key','钥匙',50,20,16,2),object('door','door','garden door','花园门',83,52,20),object('flower','flower','flower','花',17,20),object('wateringcan','wateringcan','watering can','洒水壶',50,84)],
    steps:[{target:'towel',command:'Pick up the towel on the left.',translation:'拿起左边的毛巾。',take:true},{target:'window',command:'Use the towel to clean the window.',translation:'用毛巾擦干净窗户。',use:'towel'},{target:'key',command:'Take the key behind the clean window.',translation:'拿起干净窗户后面的钥匙。',take:true},{target:'door',command:'Use the key to open the garden door.',translation:'用钥匙打开花园门。',use:'key'}]},
  {id:'library-light',title:'点亮阅读灯',kind:'puzzle',setting:'library',caption:'给阅读灯装上电池，再把读完的书放回原位。',coins:36,xp:26,
    objects:[object('battery','battery','battery','电池',17,84),object('lamp','lamp','lamp','台灯',50,52,18),object('book','blue-book','blue book','蓝色书',17,52,16,2),object('shelf','shelf','shelf','书架',83,20,20),object('clock','clock','clock','时钟',17,20),object('cup','cup','cup','杯子',83,84)],
    steps:[{target:'battery',command:'Pick up the battery under the shelf.',translation:'捡起搁板下面的电池。',take:true},{target:'lamp',command:'Use the battery to turn on the lamp.',translation:'装上电池，打开台灯。',use:'battery'},{target:'book',command:'Take the blue book beside the lamp.',translation:'拿起台灯旁的蓝色书。',take:true},{target:'shelf',command:'Put the blue book back on the shelf.',translation:'把蓝色书放回书架。',use:'book'}]},
]
export interface AdventureSession { step:number; inventory:string[]; found:string[]; complete:boolean; helped:boolean; hintOpen:boolean; exposed:boolean }
export interface AdventureState extends ActivityProgress { selected:string; sessions:Record<string,AdventureSession> }
export interface AdventureHost { adventure:AdventureState; coins:number; progress:{xp:number} }
const session = ():AdventureSession => ({step:0,inventory:[],found:[],complete:false,helped:false,hintOpen:false,exposed:false})
export function newAdventure():AdventureState {
  const s:AdventureState = {...newActivityProgress(),selected:adventureScenes[0]!.id,sessions:Object.fromEntries(adventureScenes.map(a=>[a.id,session()]))}
  s.sessions[s.selected]!.exposed = true; return s
}
export function activeAdventure(s:AdventureState) { return adventureScenes.find(a=>a.id===s.selected)! }
export function adventureSession(s:AdventureState) { return s.sessions[s.selected]! }
export function currentAdventureStep(s:AdventureState) { return activeAdventure(s).steps[adventureSession(s).step] }
function sync(s:AdventureState) { const a=adventureSession(s);s.helped=a.helped;s.hintOpen=a.hintOpen }
export function selectAdventure(s:AdventureState,id:string) {
  if (!adventureScenes.some(a=>a.id===id)) return false
  s.selected=id;const a=adventureSession(s);a.exposed=true;if(s.mode==='guide'&&!a.complete)a.helped=true;sync(s);return true
}
export function setAdventureMode(s:AdventureState,mode:ActivityMode) {
  if(!['guide','reading','listening'].includes(mode)||mode===s.mode)return false
  s.mode=mode
  for(const a of Object.values(s.sessions)){if(a.exposed&&!a.complete)a.helped=true;a.hintOpen=false}
  sync(s);return true
}
export function toggleAdventureHint(s:AdventureState) { const a=adventureSession(s);if(a.complete)return;a.hintOpen=!a.hintOpen;if(a.hintOpen)a.helped=true;sync(s) }
export type AdventureResult = 'wrong'|'collected'|'changed'|'complete'|'finished'
export function interactAdventure(host:AdventureHost,id:string):AdventureResult {
  const s=host.adventure,a=adventureSession(s),scene=activeAdventure(s),step=scene.steps[a.step]
  if(a.complete)return 'finished'
  a.exposed=true
  if(!step||step.target!==id||!scene.objects.some(o=>o.id===id&&(o.hiddenUntil??0)<=a.step))return 'wrong'
  if(step.use&&!a.inventory.includes(step.use))return 'wrong'
  if(step.take){a.found.push(id);a.inventory.push(id)}
  if(step.use)a.inventory=a.inventory.filter(item=>item!==step.use)
  a.step++;a.hintOpen=false
  if(a.step===scene.steps.length){a.complete=true;host.coins+=scene.coins;host.progress.xp+=scene.xp;s[a.helped||s.mode==='guide'?'assisted':'independent']++;sync(s);return 'complete'}
  sync(s);return step.take?'collected':'changed'
}
export function validAdventure(value:unknown):value is AdventureState {
  if(!validActivityProgress(value))return false
  const s=value as AdventureState
  if(!adventureScenes.some(a=>a.id===s.selected)||!s.sessions||typeof s.sessions!=='object'||Object.keys(s.sessions).length!==adventureScenes.length)return false
  let independent=0,assisted=0
  for(const scene of adventureScenes){
    const a=s.sessions[scene.id]
    if(!a||!Number.isInteger(a.step)||a.step<0||a.step>scene.steps.length||!Array.isArray(a.inventory)||!Array.isArray(a.found)||['complete','helped','hintOpen','exposed'].some(k=>typeof a[k as keyof AdventureSession]!=='boolean'))return false
    if(a.complete!==(a.step===scene.steps.length)||a.hintOpen&&!a.helped||(!a.exposed&&(a.step>0||a.helped||a.hintOpen))||a.complete&&a.hintOpen)return false
    const found:string[]=[],inventory:string[]=[]
    for(const step of scene.steps.slice(0,a.step)){if(step.take){found.push(step.target);inventory.push(step.target)}if(step.use)inventory.splice(inventory.indexOf(step.use),1)}
    if(JSON.stringify(found)!==JSON.stringify(a.found)||JSON.stringify(inventory)!==JSON.stringify(a.inventory))return false
    if(a.complete){if(a.helped)assisted++;else independent++}
  }
  const a=s.sessions[s.selected]!
  return a.exposed&&s.helped===a.helped&&s.hintOpen===a.hintOpen&&s.independent===independent&&s.assisted===assisted
}

/** Keep the six v8 adventures intact and add untouched new destinations. */
export function migrateAdventureV8(value:unknown):AdventureState|null {
  if(!value||typeof value!=='object'||Array.isArray(value))return null
  const old=value as AdventureState
  if(!old.sessions||typeof old.sessions!=='object'||Array.isArray(old.sessions)||!adventureScenes.slice(0,6).every(scene=>Object.hasOwn(old.sessions,scene.id)))return null
  const sessions={...old.sessions}
  for(const scene of adventureScenes.slice(6))if(!Object.hasOwn(sessions,scene.id))sessions[scene.id]=session()
  const candidate={...old,sessions}
  return validAdventure(candidate)?candidate:null
}
