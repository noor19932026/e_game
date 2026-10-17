import { extraRows, extraActions, extraPhrases } from './expansion'

export type ThemeId = 'coffee' | 'garden' | 'bakery' | 'juice' | 'clothes' | 'paper' | 'pottery' | 'kitchen' | 'fruit' | 'breakfast' | 'school'
export type DistrictId = 'cafe' | 'workshop' | 'market'
export const districts: { id: DistrictId; name: string; description: string; themes: ThemeId[] }[] = [
  { id: 'cafe', name: '花园小店', description: '咖啡 · 花园 · 烘焙 · 早餐', themes: ['coffee', 'garden', 'bakery', 'breakfast'] },
  { id: 'workshop', name: '手作街角', description: '衣物 · 纸艺 · 陶艺', themes: ['clothes', 'paper', 'pottery', 'school'] },
  { id: 'market', name: '阳光集市', description: '果汁 · 薯片厨房', themes: ['juice', 'kitchen', 'fruit'] },
]
export function themeDistrict(id: ThemeId): DistrictId { return districts.find(d => d.themes.includes(id))!.id }
export interface MergeWord {
  id: string
  theme: ThemeId
  level: number
  word: string
  meaning: string
  phonetic: string
  sentence: string
  translation: string
  relation: string
}
export const themes = [
  { id: 'coffee' as const, name: '咖啡时光', english: 'Coffee corner', color: '#bd7750', note: '场景关联：原料 → 包装 → 工具 → 饮品 → 容器。合并是游戏规则，不是真实制作配方。' },
  { id: 'garden' as const, name: '窗边花园', english: 'Little garden', color: '#658c60', note: '生长关联：种子 → 幼苗 → 植物 → 花 → 花束。两件合一是游戏规则，帮助串起生长与使用场景。' },
  { id: 'bakery' as const, name: '暖心烘焙', english: 'Happy bakery', color: '#c6963f', note: '制作关联：面粉 → 面团 → 面包 → 吐司 → 三明治。实际制作还需要其他原料与步骤。' },
  { id: 'juice' as const, name: '鲜榨果汁', english: 'Juice bar', color: '#d19843', note: '制作关联：橙子 → 橙瓣 → 果汁 → 玻璃杯。榨汁会留下果渣，倒入杯子表示饮品与容器的关联。' },
  { id: 'clothes' as const, name: '衣物工坊', english: 'Cotton studio', color: '#879aad', note: '制作关联：棉花 → 纱线 → 布料 → 衬衫。每一步还需要工具与实际制作工序，合并是游戏规则。' },
  { id: 'paper' as const, name: '纸艺工坊', english: 'Paper studio', color: '#b78385', note: '制作关联：纸 → 画作 → 卡片 → 贺卡。在纸上画画，把画纸折成卡片，再写上祝福。' },
  { id: 'pottery' as const, name: '陶艺工坊', english: 'Clay studio', color: '#b68565', note: '制作关联：黏土 → 黏土罐 → 干燥的罐坯 → 陶罐。成形、干燥和烧制是不同步骤，通常还涉及其他工序。' },
  { id: 'kitchen' as const, name: '薯片厨房', english: 'Crispy kitchen', color: '#b39b4d', note: '制作关联：土豆 → 去皮土豆 → 土豆薄片 → 薯片。这里只学习制作过程的英语，不是实际烹饪操作教程。' },
  { id: 'fruit' as const, name: '水果小铺', english: 'Fresh fruit', color: '#b88062', note: '苹果切片、组合水果、分装打包。合并是游戏规则，学习食物、容器与动作的关联。' },
  { id: 'breakfast' as const, name: '早安厨房', english: 'Breakfast club', color: '#c5a361', note: '从鸡蛋到早餐套餐。可以把面包和熟鸡蛋直接组合成三明治；游戏不是烹饪配方。' },
  { id: 'school' as const, name: '上学时光', english: 'School day', color: '#7f9a98', note: '文具、收纳与教室的场景关联；不是物品真的变成房间。' },
]
type WordRow = [string, string, string, string, string, string]
const baseRows: Partial<Record<ThemeId, WordRow[]>> = {
  coffee: [
    ['coffee bean', '咖啡豆', '/ˈkɒfi biːn/', 'A coffee bean is a seed.', '一颗咖啡豆是一粒种子。', 'bean 是豆；coffee bean 指咖啡豆。多颗咖啡豆是 coffee beans。'],
    ['bag', '袋子', '/bæɡ/', 'The bag is full of coffee beans.', '袋子里装满了咖啡豆。', 'a bag of coffee beans = 一袋咖啡豆。bag 是容器，bean 是里面的东西。'],
    ['coffee maker', '咖啡机', '/ˈkɒfi ˌmeɪkə(r)/', 'We use a coffee maker to make coffee.', '我们用咖啡机煮咖啡。', 'make 是制作；maker 是制作东西的人或机器。coffee maker 是咖啡机。'],
    ['coffee', '咖啡', '/ˈkɒfi/', 'There is coffee in the paper cup.', '纸杯里有咖啡。', 'coffee 是饮品，cup 是容器。coffee 通常不可数：a cup of coffee = 一杯咖啡。'],
    ['cup', '杯子', '/kʌp/', 'This cup has a handle.', '这个杯子有一个把手。', 'cup 指杯子；a cup of coffee 指一杯咖啡。图中是带把手的瓷杯。'],
  ],
  garden: [
    ['seed', '种子', '/siːd/', 'Put the seed in the soil.', '把种子放进土壤里。', 'seed 是种子。它可以长成 seedling（幼苗）。'],
    ['seedling', '幼苗', '/ˈsiːdlɪŋ/', 'The seedling needs water.', '这株幼苗需要水。', 'seed → seedling。两个单词的 seed 部分相同，帮助记忆。'],
    ['plant', '植物', '/plɑːnt/', 'The plant grows in the sun.', '这株植物在阳光下生长。', 'plant 作名词是植物，也可以作动词表示种植。'],
    ['flower', '花', '/ˈflaʊə(r)/', 'The flower smells sweet.', '这朵花闻起来很香。', 'flower 是植物的一部分；有些 plants 会开 flowers。'],
    ['bouquet', '花束', '/buˈkeɪ/', 'She gives me a bouquet of flowers.', '她送给我一束花。', 'a bouquet of flowers = 一束花。几朵 flowers 可以组成一束 bouquet。'],
  ],
  bakery: [
    ['flour', '面粉', '/ˈflaʊə(r)/', 'We need flour to make bread.', '我们需要面粉来做面包。', 'flour 和 flower 发音相同，意义不同：面粉和花。'],
    ['dough', '面团', '/dəʊ/', 'Mix flour and water to make dough.', '把面粉和水混合做成面团。', 'flour 加水等原料成为 dough；dough 烘烤后可以成为 bread。'],
    ['bread', '面包', '/bred/', 'The bread is warm and soft.', '这块面包温热又柔软。', 'bread 通常不可数：a slice of bread = 一片面包。'],
    ['toast', '吐司', '/təʊst/', 'I like toast for breakfast.', '我喜欢早餐吃吐司。', 'toast 是烤过的面包；bread → toast。这里的 toast 通常不可数。'],
    ['sandwich', '三明治', '/ˈsænwɪtʃ/', 'My sandwich has cheese in it.', '我的三明治里有奶酪。', '面包夹入馅料成为 sandwich。可数：a sandwich / two sandwiches。'],
  ],
  juice: [
    ['orange', '橙子', '/ˈɒrɪndʒ/', 'This orange is sweet.', '这个橙子很甜。', 'orange 作名词指橙子，也可表示橙色。an orange = 一个橙子。'],
    ['orange segment', '橙瓣', '/ˈɒrɪndʒ ˌseɡmənt/', 'This orange segment is sweet.', '这瓣橙子很甜。', 'segment 表示一个部分。剥掉果皮后，可以把橙子分成 orange segments。'],
    ['juice', '果汁', '/dʒuːs/', 'The juice comes from oranges.', '这果汁来自橙子。', 'juice 通常不可数。orange juice 是橙汁，a glass of juice 是一杯果汁。'],
    ['glass', '玻璃杯', '/ɡlɑːs/', 'Pour the juice into a glass.', '把果汁倒进玻璃杯。', 'glass 指玻璃杯时可数，指玻璃材料时通常不可数。'],
  ],
  clothes: [
    ['cotton', '棉花', '/ˈkɒtn/', 'Cotton feels soft.', '棉花摸起来很柔软。', 'cotton 指棉花，也可以表示棉这种材料。a cotton shirt = 一件棉衬衫。'],
    ['yarn', '纱线', '/jɑːn/', 'We make yarn from cotton.', '我们用棉花制成纱线。', 'yarn 是用来织布、针织的纱线，常见表达有 cotton yarn（棉纱）。'],
    ['cloth', '布料', '/klɒθ/', 'This cloth is blue.', '这块布料是蓝色的。', 'cloth 表示布料，clothes 表示衣服；它们不是同一个单词。'],
    ['shirt', '衬衫', '/ʃɜːt/', 'My shirt has buttons.', '我的衬衫有纽扣。', 'shirt 是衬衫，T-shirt 是 T 恤。a cotton shirt 表示棉衬衫。'],
  ],
  paper: [
    ['paper', '纸', '/ˈpeɪpə(r)/', 'I draw on a piece of paper.', '我在一张纸上画画。', 'paper 表示纸时通常不可数：a piece of paper = 一张纸。'],
    ['drawing', '画作', '/ˈdrɔːɪŋ/', 'This drawing shows a flower.', '这幅画画的是一朵花。', 'draw 是画画的动作，drawing 可以表示一幅画或绘画这个活动。'],
    ['card', '卡片', '/kɑːd/', 'Fold the paper to make a card.', '把纸折起来做成卡片。', 'card 是卡片；写上祝福后，可以用作 greeting card（贺卡）。'],
    ['greeting card', '贺卡', '/ˈɡriːtɪŋ kɑːd/', 'I write a message in the greeting card.', '我在贺卡里写了一段留言。', 'greeting 是问候。a greeting card 是一张表达问候或祝福的贺卡。'],
  ],
  pottery: [
    ['clay', '黏土', '/kleɪ/', 'The clay is soft and wet.', '这块黏土柔软而湿润。', 'clay 是可以塑形的黏土，与 soil（土壤）的含义不同。'],
    ['clay pot', '黏土罐', '/kleɪ pɒt/', 'This clay pot is still wet.', '这个黏土罐还是湿的。', '这里的 clay pot 是尚未干燥和烧制的罐坯，不是已经完成的陶罐。'],
    ['dry pot', '干燥的罐坯', '/draɪ pɒt/', 'The dry pot is ready for the kiln.', '这个干燥的罐坯可以放进窑里了。', 'dry 表示干燥的。干燥的黏土罐还需要烧制，才会成为陶器。'],
    ['ceramic pot', '陶罐', '/səˈræmɪk pɒt/', 'The ceramic pot holds a plant.', '这个陶罐里种着一株植物。', 'ceramic 表示陶瓷的。罐坯经过窑中的烧制，成为坚硬的陶罐。'],
  ],
  kitchen: [
    ['potato', '土豆', '/pəˈteɪtəʊ/', 'Wash the potato before cooking.', '烹饪前先洗土豆。', 'potato 的复数是 potatoes。sweet potato 则是红薯。'],
    ['peeled potato', '去皮土豆', '/piːld pəˈteɪtəʊ/', 'The peeled potato has no skin.', '这个去皮土豆没有外皮。', 'peel 是去皮，peeled 表示已经去皮的。'],
    ['potato slice', '土豆薄片', '/pəˈteɪtəʊ slaɪs/', 'This potato slice is thin.', '这片土豆片很薄。', 'slice 作名词是薄片，作动词是切成片。potato slices 是多片土豆片。'],
    ['crisps', '薯片', '/krɪsps/', 'These crisps are crunchy.', '这些薯片很脆。', '英式英语 crisps 指薄而脆的薯片；美式英语常称 potato chips。英式 chips 常指薯条。'],
  ],
}
const rows = Object.fromEntries(themes.map(t => [t.id, [...(baseRows[t.id] || []), ...(extraRows[t.id] || [])]])) as Record<ThemeId, WordRow[]>
export const words: MergeWord[] = themes.flatMap(theme => rows[theme.id].map((row, level) => ({
  id: `${theme.id}-${level}`, theme: theme.id, level,
  word: row[0], meaning: row[1], phonetic: row[2], sentence: row[3], translation: row[4], relation: row[5],
})))
export const wordById = Object.fromEntries(words.map(word => [word.id, word])) as Record<string, MergeWord>
export function themeWords(theme: ThemeId) { return words.filter(word => word.theme === theme) }

export interface ChainAction {
  verb: string
  meaning: string
  phonetic: string
  sentence: string
  translation: string
  explanation: string
}

// Each entry describes the relationship from one item to the next, rather than
// suggesting that ingredients literally turn into a container or a machine.
const baseActions: Partial<Record<ThemeId, ChainAction[]>> = {
  coffee: [
    { verb: 'pack', meaning: '装袋', phonetic: '/pæk/', sentence: 'Pack the coffee beans in a bag.', translation: '把咖啡豆装进袋子里。', explanation: 'pack 表示包装、装好。咖啡豆被装进袋子，豆子没有变成袋子。' },
    { verb: 'load', meaning: '装入', phonetic: '/ləʊd/', sentence: 'Load the ground coffee into the coffee maker.', translation: '把磨好的咖啡粉装入咖啡机。', explanation: 'load 表示装入。先磨豆，再把咖啡粉装入咖啡机；袋子和机器是原料包装与工具的关联。' },
    { verb: 'brew', meaning: '冲煮', phonetic: '/bruː/', sentence: 'Brew coffee with a coffee maker.', translation: '用咖啡机冲煮咖啡。', explanation: 'brew 表示冲煮咖啡或茶。咖啡机是工具，咖啡是用它制作的饮品。' },
    { verb: 'pour', meaning: '倒入', phonetic: '/pɔː(r)/', sentence: 'Pour the coffee into a cup.', translation: '把咖啡倒进杯子里。', explanation: 'pour 表示倒、倾倒。饮品被倒入容器，咖啡没有变成杯子。' },
  ],
  garden: [
    { verb: 'plant', meaning: '播种', phonetic: '/plɑːnt/', sentence: 'Plant a seed in the soil.', translation: '在土壤里种下一粒种子。', explanation: 'plant 作动词表示种植。种下种子后，它在适宜的水分和温度下发芽，长成幼苗。' },
    { verb: 'grow', meaning: '生长', phonetic: '/ɡrəʊ/', sentence: 'The seedling grows into a larger plant.', translation: '幼苗长成更大的植物。', explanation: 'grow 表示生长。幼苗本来也是植物，这一段表示它逐渐长大。' },
    { verb: 'bloom', meaning: '开花', phonetic: '/bluːm/', sentence: 'The plant blooms in spring.', translation: '这株植物在春天开花。', explanation: 'bloom 表示开花。开花植物长出花朵，花是植物的一部分。' },
    { verb: 'tie', meaning: '扎束', phonetic: '/taɪ/', sentence: 'Tie the flowers together to make a bouquet.', translation: '把花扎在一起，做成花束。', explanation: 'tie 表示系、扎。把几朵花扎在一起，就能组成一束花。' },
  ],
  bakery: [
    { verb: 'mix', meaning: '和面', phonetic: '/mɪks/', sentence: 'Mix flour and water to make dough.', translation: '把面粉和水混合，做成面团。', explanation: 'mix 的基本意思是混合。这里指加水混合成团这一步；揉面这个动作则叫 knead。实际面包制作还可能需要酵母等原料。' },
    { verb: 'bake', meaning: '烘烤', phonetic: '/beɪk/', sentence: 'Bake the dough to make bread.', translation: '烘烤面团，做成面包。', explanation: 'bake 表示在烤箱里烘烤。面团经过合适的制作步骤和烘烤，成为面包。' },
    { verb: 'toast', meaning: '烤脆', phonetic: '/təʊst/', sentence: 'Toast a slice of bread.', translation: '把一片面包烤脆。', explanation: 'toast 作动词表示把面包烤至金黄酥脆；作名词时指烤过的面包。' },
    { verb: 'add', meaning: '加馅', phonetic: '/æd/', sentence: 'Add cheese between two slices of toast to make a sandwich.', translation: '在两片吐司之间加上奶酪，做成三明治。', explanation: 'add 的基本意思是添加。在两片面包之间添加奶酪等馅料，就能做成三明治。' },
  ],
  juice: [
    { verb: 'peel', meaning: '剥皮', phonetic: '/piːl/', sentence: 'Peel the orange and separate the segments.', translation: '剥掉橙子皮，并把橙瓣分开。', explanation: 'peel 表示剥皮。橙子剥皮后再分瓣，得到橙瓣。' },
    { verb: 'squeeze', meaning: '榨汁', phonetic: '/skwiːz/', sentence: 'Squeeze the orange segments to get juice.', translation: '挤压橙瓣，得到果汁。', explanation: 'squeeze 的基本意思是挤压；挤压水果可以榨出果汁，但也会留下果渣。' },
    { verb: 'pour', meaning: '倒入', phonetic: '/pɔː(r)/', sentence: 'Pour the juice into a glass.', translation: '把果汁倒进玻璃杯。', explanation: 'pour 表示倒入。glass 是装果汁的容器，果汁没有变成玻璃杯。' },
  ],
  clothes: [
    { verb: 'spin', meaning: '纺纱', phonetic: '/spɪn/', sentence: 'Spin cotton into yarn.', translation: '把棉花纺成纱线。', explanation: 'spin 可表示旋转；这里表示把纤维纺成纱线。' },
    { verb: 'weave', meaning: '织布', phonetic: '/wiːv/', sentence: 'Weave the yarn into cloth.', translation: '把纱线织成布料。', explanation: 'weave 表示把线交织成布料，与 knit（针织）的工艺不同。' },
    { verb: 'sew', meaning: '缝制', phonetic: '/səʊ/', sentence: 'Sew the cloth to make a shirt.', translation: '把布料缝制成衬衫。', explanation: 'sew 表示缝制。制作衬衫还涉及剪裁等步骤。' },
  ],
  paper: [
    { verb: 'draw', meaning: '画画', phonetic: '/drɔː/', sentence: 'Draw a flower on the paper.', translation: '在纸上画一朵花。', explanation: 'draw 表示画画。画出的作品可以叫 drawing。' },
    { verb: 'fold', meaning: '折叠', phonetic: '/fəʊld/', sentence: 'Fold the drawing to make a card.', translation: '把画纸折起来做成卡片。', explanation: 'fold 表示折叠。在这条链里，画纸折成卡片，画面成为卡片的装饰。' },
    { verb: 'write', meaning: '写字', phonetic: '/raɪt/', sentence: 'Write a greeting in the card.', translation: '在卡片里写上一句问候。', explanation: 'write 表示写。给卡片加上问候或祝福，就能用它表达心意。' },
  ],
  pottery: [
    { verb: 'shape', meaning: '塑形', phonetic: '/ʃeɪp/', sentence: 'Shape the clay into a pot.', translation: '把黏土塑成一个罐子。', explanation: 'shape 作动词表示塑造形状，作名词则表示形状。' },
    { verb: 'dry', meaning: '晾干', phonetic: '/draɪ/', sentence: 'Dry the clay pot before firing it.', translation: '烧制之前，先让黏土罐干燥。', explanation: 'dry 可作动词表示弄干、使干燥，也可作形容词表示干燥的。' },
    { verb: 'fire', meaning: '烧制', phonetic: '/ˈfaɪə(r)/', sentence: 'Fire the dry pot in a kiln.', translation: '在窑里烧制干燥的罐坯。', explanation: 'fire 在陶艺场景中表示在窑里烧制，不是让罐子燃烧。' },
  ],
  kitchen: [
    { verb: 'peel', meaning: '去皮', phonetic: '/piːl/', sentence: 'Peel the potato.', translation: '给土豆去皮。', explanation: 'peel 表示去皮，可以用于土豆、橙子等食物。' },
    { verb: 'slice', meaning: '切片', phonetic: '/slaɪs/', sentence: 'Slice the potato thinly.', translation: '把土豆切成薄片。', explanation: 'slice 作动词表示切成薄片，与作名词时的薄片意思相连。' },
    { verb: 'fry', meaning: '油炸', phonetic: '/fraɪ/', sentence: 'Fry the potato slices to make crisps.', translation: '把土豆薄片炸成薯片。', explanation: 'fry 表示用油煎或炸；这里只学习词义和制作关系。' },
  ],
}

export const chainActions = Object.fromEntries(themes.map(t => [t.id, [...(baseActions[t.id] || []), ...(extraActions[t.id] || [])]])) as Record<ThemeId, ChainAction[]>

export interface PhraseEntry {
  phrase: string
  meaning: string
  prompt: string
  answer: string
  options: string[]
  sentence: string
  translation: string
  explanation: string
}
const basePhrases: Partial<Record<ThemeId, PhraseEntry[]>> = {
  coffee: [
    { phrase: 'a cup of coffee', meaning: '一杯咖啡', prompt: 'a _____ of coffee', answer: 'cup', options: ['cup', 'slice', 'bouquet'], sentence: 'I would like a cup of coffee.', translation: '我想要一杯咖啡。', explanation: 'coffee 通常不可数，用 a cup of 表示一杯。' },
    { phrase: 'make coffee', meaning: '煮咖啡', prompt: '_____ coffee', answer: 'make', options: ['make', 'sew', 'fold'], sentence: 'We make coffee in the morning.', translation: '我们在早上煮咖啡。', explanation: 'make coffee 是制作咖啡的常见搭配。' },
  ],
  garden: [
    { phrase: 'plant a seed', meaning: '种下一粒种子', prompt: '_____ a seed', answer: 'plant', options: ['plant', 'pour', 'sew'], sentence: 'Plant a seed in the soil.', translation: '在土壤里种下一粒种子。', explanation: 'plant 在这里作动词，表示种植。' },
    { phrase: 'a bouquet of flowers', meaning: '一束花', prompt: 'a _____ of flowers', answer: 'bouquet', options: ['bouquet', 'slice', 'cup'], sentence: 'She gives me a bouquet of flowers.', translation: '她送给我一束花。', explanation: 'bouquet 后用 of 连接花朵：a bouquet of flowers。' },
  ],
  bakery: [
    { phrase: 'a slice of bread', meaning: '一片面包', prompt: 'a _____ of bread', answer: 'slice', options: ['slice', 'glass', 'bouquet'], sentence: 'I eat a slice of bread.', translation: '我吃一片面包。', explanation: 'bread 通常不可数，a slice of 表示一片。' },
    { phrase: 'bake bread', meaning: '烤面包', prompt: '_____ bread', answer: 'bake', options: ['bake', 'weave', 'write'], sentence: 'We bake bread in the oven.', translation: '我们在烤箱里烤面包。', explanation: 'bake bread 指制作并烘烤面包；toast bread 则指烤已有的面包片。' },
  ],
  juice: [
    { phrase: 'a glass of juice', meaning: '一杯果汁', prompt: 'a _____ of juice', answer: 'glass', options: ['glass', 'slice', 'bouquet'], sentence: 'I drink a glass of juice.', translation: '我喝一杯果汁。', explanation: 'glass 在这里是玻璃杯，a glass of juice 是一杯果汁。' },
    { phrase: 'squeeze an orange', meaning: '给橙子榨汁', prompt: '_____ an orange', answer: 'squeeze', options: ['squeeze', 'sew', 'weave'], sentence: 'Squeeze an orange to get juice.', translation: '挤压橙子来榨汁。', explanation: 'squeeze 是挤压，常与 orange、lemon 等水果搭配。' },
  ],
  clothes: [
    { phrase: 'a cotton shirt', meaning: '一件棉衬衫', prompt: 'a _____ shirt', answer: 'cotton', options: ['cotton', 'coffee', 'potato'], sentence: 'I wear a cotton shirt.', translation: '我穿一件棉衬衫。', explanation: 'cotton 放在 shirt 前面说明材料。' },
    { phrase: 'sew a shirt', meaning: '缝制一件衬衫', prompt: '_____ a shirt', answer: 'sew', options: ['sew', 'brew', 'squeeze'], sentence: 'She can sew a shirt.', translation: '她会缝制衬衫。', explanation: 'sew 是缝制衣物的动作，可与 shirt、dress 等搭配。' },
  ],
  paper: [
    { phrase: 'a piece of paper', meaning: '一张纸', prompt: 'a _____ of paper', answer: 'piece', options: ['piece', 'cup', 'bouquet'], sentence: 'I need a piece of paper.', translation: '我需要一张纸。', explanation: 'paper 表示纸时通常不可数，用 a piece of 表示一张。' },
    { phrase: 'draw a picture', meaning: '画一幅画', prompt: '_____ a picture', answer: 'draw', options: ['draw', 'peel', 'brew'], sentence: 'Draw a picture for your friend.', translation: '给你的朋友画一幅画。', explanation: 'draw a picture 是画一幅画；drawing 可以表示画出的作品。' },
  ],
  pottery: [
    { phrase: 'a clay pot', meaning: '一个黏土罐', prompt: 'a _____ pot', answer: 'clay', options: ['clay', 'juice', 'bread'], sentence: 'We make a clay pot.', translation: '我们做一个黏土罐。', explanation: 'clay 在 pot 前面说明罐子的材料。' },
    { phrase: 'shape the clay', meaning: '给黏土塑形', prompt: '_____ the clay', answer: 'shape', options: ['shape', 'pour', 'write'], sentence: 'Shape the clay with your hands.', translation: '用手给黏土塑形。', explanation: 'shape 在这里作动词，表示塑造形状。' },
  ],
  kitchen: [
    { phrase: 'peel a potato', meaning: '给一个土豆去皮', prompt: '_____ a potato', answer: 'peel', options: ['peel', 'sew', 'write'], sentence: 'Peel a potato before slicing it.', translation: '切片前先给土豆去皮。', explanation: 'peel 是去皮，slice 是切片，是两个不同的动作。' },
    { phrase: 'fry potato slices', meaning: '炸土豆薄片', prompt: '_____ potato slices', answer: 'fry', options: ['fry', 'plant', 'weave'], sentence: 'Fry potato slices to make crisps.', translation: '把土豆薄片炸成薯片。', explanation: 'slice 是一片，slices 是多片；fry 在这里表示油炸。' },
  ],
}
export const themePhrases = { ...basePhrases, ...extraPhrases } as Record<ThemeId, PhraseEntry[]>

export const combinationRecipes = [
  { id: 'coffee-breakfast', ingredients: ['coffee-3', 'bakery-2'], result: 'coffee-6', name: '咖啡早餐盘', explanation: '咖啡＋面包，一起装进托盘' },
  { id: 'egg-sandwich', ingredients: ['bakery-2', 'breakfast-1'], result: 'breakfast-2', name: '鸡蛋三明治', explanation: '面包＋水煮蛋，组合成三明治' },
  { id: 'mixed-fruit', ingredients: ['fruit-0', 'juice-0'], result: 'fruit-2', name: '缤纷水果碗', explanation: '苹果＋橙子，一起放进水果碗' },
  { id: 'pencil-drawing', ingredients: ['school-0', 'paper-0'], result: 'paper-1', name: '铅笔画', explanation: '铅笔＋纸，画一幅小画' },
] as const

export const vocabularyStats = {
  objects: words.length,
  actionEntries: Object.values(chainActions).flat().length,
  phrases: Object.values(themePhrases).flat().length,
  unique: new Set([...words.map(w => w.word), ...Object.values(chainActions).flat().map(a => a.verb), ...Object.values(themePhrases).flat().map(p => p.phrase)]).size,
}
export function isTerminal(id: string) { const word = wordById[id]; return !!word && word.level === themeWords(word.theme).length - 1 }

export function shuffledChoices(correct: string, alternatives: string[], offset: number): string[] {
  const choices = [correct, ...new Set(alternatives.filter(choice => choice !== correct))].slice(0, 3)
  const shift = offset % choices.length
  return [...choices.slice(shift), ...choices.slice(0, shift)]
}

export function meaningChoices(word: MergeWord): string[] {
  const alternatives = words.filter(item => item.meaning !== word.meaning)
  const start = (word.level * 3 + themes.findIndex(t => t.id === word.theme) * 2) % alternatives.length
  const result = [word.meaning, alternatives[start]!.meaning, alternatives[(start + 5) % alternatives.length]!.meaning]
  // Stable per-word shuffle, so the answer is not always in the same position.
  const shift = (word.level + themes.findIndex(t => t.id === word.theme)) % 3
  return [...result.slice(shift), ...result.slice(0, shift)]
}
