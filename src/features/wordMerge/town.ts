export type TownPage = 'stores'|'kitchen'|'room'|'delivery'|'fishing'|'care'|'farm'|'adventure'
export const townPlaces: { id:TownPage; title:string; english:string; verb:string; description:string; color:string; lesson:string; content:string; group:'life'|'outdoor' }[] = [
  {id:'stores',content:'54 组清单 · 8 种衣物颜色',title:'开店接客',english:'CORNER MARKET',verb:'找货配套',description:'在三家店里找齐顾客要的商品，配套交付。',color:'#78947c',lesson:'物品 · 颜色 · 数量',group:'life'},
  {id:'kitchen',content:'12 道菜谱 · 多种制作动作',title:'小小厨房',english:'LITTLE KITCHEN',verb:'动手下厨',description:'跟着英语步骤，把食材做成餐点送上桌。',color:'#c29563',lesson:'动作 · 食物 · 顺序',group:'life'},
  {id:'room',content:'9 间小屋 · 36 个摆放任务',title:'整理小屋',english:'A COSY ROOM',verb:'布置新家',description:'打开纸箱，按指令把物品安顿在房间里。',color:'#909eac',lesson:'物品 · 方位 · 指令',group:'life'},
  {id:'delivery',content:'3 张地图 · 18 条送货路线',title:'小镇送货员',english:'SPECIAL DELIVERY',verb:'走一走，送到家',description:'认清方向，沿着小镇道路把包裹送达。',color:'#b58c69',lesson:'方向 · 路线 · 地点',group:'outdoor'},
  {id:'fishing',content:'27 种小鱼 · 21 组观察任务',title:'英语钓鱼',english:'A DAY BY THE POND',verb:'听一听，钓一条',description:'观察游动的鱼，找出描述中的目标。',color:'#7e9faa',lesson:'颜色 · 大小 · 描述',group:'outdoor'},
  {id:'care',content:'15 段故事 · 8 种照料工具',title:'宠物照料站',english:'PAWS & LITTLE NEEDS',verb:'照顾小伙伴',description:'听懂动物的需要，添水、清洁和陪伴。',color:'#aa9587',lesson:'需要 · 感受 · 动作',group:'life'},
  {id:'farm',content:'8 种作物 · 18 张采收订单',title:'农场花园',english:'THE LITTLE GARDEN',verb:'种一片好时光',description:'选择种子，浇水照料，再完成采收任务。',color:'#91a377',lesson:'种植 · 数量 · 阶段',group:'outdoor'},
  {id:'adventure',content:'9 次寻宝 · 9 个道具谜题',title:'寻宝与解谜',english:'CLUES & SMALL WONDERS',verb:'发现藏起来的故事',description:'在场景里寻宝，收集道具，完成小小谜题。',color:'#a99b7d',lesson:'描述 · 位置 · 两步指令',group:'outdoor'},
]
