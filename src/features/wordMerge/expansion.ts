// New IDs are appended to existing chains. Established words never change meaning.
type Row = [string, string, string, string, string, string]
const row = (word: string, meaning: string, sentence: string, translation: string, relation: string, phonetic = ''): Row => [word, meaning, phonetic, sentence, translation, relation]
export const extraRows: Record<string, Row[]> = {
  coffee: [
    row('coffee pot', '咖啡壶', 'The coffee pot is on the table.', '咖啡壶在桌上。', 'pot 是壶或锅；coffee pot 用来盛咖啡。杯子和壶是同一场景的不同容器。'),
    row('coffee tray', '咖啡托盘', 'Put the bread on the coffee tray.', '把面包放在咖啡托盘上。', 'tray 是托盘。咖啡和面包可以一起放在托盘上。'),
    row('cafe', '咖啡馆', 'Mia works in the cafe.', 'Mia 在咖啡馆工作。', 'cafe 是可以喝咖啡、吃点心的小店。后半段是经营场景关联。', '/ˈkæfeɪ/'),
  ],
  garden: [
    row('flower basket', '花篮', 'The flower basket is by the door.', '花篮放在门边。', 'basket 是篮子，flower basket 是盛花的篮子。'),
    row('flower stand', '花架', 'Put the flower basket on the flower stand.', '把花篮放在花架上。', 'stand 在这里表示架子，可以摆放花篮。'),
    row('garden', '花园', 'We sit in the garden.', '我们坐在花园里。', '从一粒种子到一座花园，后半段表示种植与布置场景。', '/ˈɡɑːdn/'),
  ],
  bakery: [
    row('bread basket', '面包篮', 'The bread basket is full.', '面包篮装满了。', 'basket 是篮子。面包篮用来盛面包，不是面包变成了篮子。'),
    row('lunch box', '午餐盒', 'Put the sandwich in the lunch box.', '把三明治放进午餐盒。', 'lunch 是午餐，box 是盒子；lunch box 用来装午餐。'),
    row('picnic basket', '野餐篮', 'Take the picnic basket to the park.', '带上野餐篮去公园。', 'picnic 是野餐。篮子里可以放午餐盒和饮料。'),
  ],
  juice: [
    row('juice bottle', '果汁瓶', 'The juice bottle is on the table.', '果汁瓶在桌上。', 'bottle 是瓶子；juice bottle 是装果汁的瓶子。'),
    row('juice box', '盒装果汁', 'Put the juice box in the bag.', '把盒装果汁放进包里。', 'box 是盒子，juice box 是盒装果汁。'),
    row('drink tray', '饮料托盘', 'Carry the cups on the drink tray.', '用饮料托盘端杯子。', 'drink 是饮料，tray 是托盘。这些是摆放和端送饮料的场景。'),
  ],
  clothes: [
    row('hat', '帽子', 'I wear a hat in the sun.', '我在阳光下戴着帽子。', 'hat 是帽子。衬衫与帽子是穿搭场景关联。', '/hæt/'),
    row('shoes', '鞋子', 'My shoes are by the door.', '我的鞋子放在门边。', '一双鞋是 a pair of shoes。', '/ʃuːz/'),
    row('coat', '外套', 'Put on your coat.', '穿上你的外套。', 'coat 是外套；put on 表示穿上。', '/kəʊt/'),
    row('wardrobe', '衣柜', 'My coat is in the wardrobe.', '我的外套在衣柜里。', 'wardrobe 是放衣物的柜子；这些词通过穿衣与收纳场景相连。', '/ˈwɔːdrəʊb/'),
  ],
  paper: [
    row('notebook', '笔记本', 'Write your name in the notebook.', '在笔记本上写下你的名字。', 'note 是笔记；notebook 是用来写笔记的本子。', '/ˈnəʊtbʊk/'),
    row('storybook', '故事书', 'Read the storybook with Mia.', '和 Mia 一起读故事书。', 'story 是故事；storybook 是故事书。', '/ˈstɔːribʊk/'),
    row('bookshelf', '书架', 'Put the storybook on the bookshelf.', '把故事书放在书架上。', 'book + shelf 组成 bookshelf，表示书架。', '/ˈbʊkʃelf/'),
  ],
  pottery: [
    row('flowerpot', '花盆', 'A flower grows in the flowerpot.', '一朵花长在花盆里。', 'flowerpot 是种花的盆；陶罐可以用来种花。', '/ˈflaʊəpɒt/'),
    row('plant stand', '植物架', 'The plant stand is by the window.', '植物架放在窗边。', 'stand 是架子，plant stand 用来摆放盆栽。'),
  ],
  kitchen: [
    row('baked potato', '烤土豆', 'The baked potato is warm.', '烤土豆是热的。', 'baked 表示烘烤过的。这是土豆的另一种吃法，不是薯片变成了土豆。'),
    row('potato salad', '土豆沙拉', 'We share the potato salad.', '我们分享土豆沙拉。', 'salad 是沙拉；potato salad 使用熟土豆和其他原料制作。'),
    row('dinner plate', '餐盘', 'Put the food on the dinner plate.', '把食物放在餐盘上。', 'plate 是盘子，用来盛食物。'),
    row('dinner table', '餐桌', 'We eat at the dinner table.', '我们在餐桌边吃饭。', 'table 是桌子；后半段从食物转向用餐场景。'),
  ],
  fruit: [
    row('apple', '苹果', 'The apple is red.', '这个苹果是红色的。', 'apple 是苹果；an apple 是一个苹果。', '/ˈæpəl/'),
    row('apple slice', '苹果片', 'This apple slice is sweet.', '这片苹果很甜。', 'slice 是薄片，apple slice 是切好的苹果片。'),
    row('fruit bowl', '水果碗', 'The fruit bowl has apples and oranges.', '水果碗里有苹果和橙子。', 'fruit 是水果，bowl 是碗。苹果与橙子可以放在一起。'),
    row('fruit salad', '水果沙拉', 'We share the fruit salad.', '我们分享水果沙拉。', '不同水果切好后可以一起做成 fruit salad。'),
    row('fruit cup', '水果杯', 'Take a fruit cup to the picnic.', '带一杯水果去野餐。', '把准备好的水果分装到杯子里，便于携带。'),
    row('fruit box', '水果盒', 'Put the fruit box in the bag.', '把水果盒放进包里。', 'box 是盒子，水果也可以装在盒子里带走。'),
  ],
  breakfast: [
    row('egg', '鸡蛋', 'I have an egg for breakfast.', '我早餐吃一个鸡蛋。', 'egg 是鸡蛋；复数是 eggs。', '/eɡ/'),
    row('boiled egg', '水煮蛋', 'The boiled egg is on the plate.', '水煮蛋放在盘子上。', 'boil 是煮；boiled egg 是煮熟的鸡蛋。'),
    row('egg sandwich', '鸡蛋三明治', 'I would like an egg sandwich.', '我想要一个鸡蛋三明治。', '把熟鸡蛋与面包组合，可以做成鸡蛋三明治。'),
    row('breakfast plate', '早餐餐盘', 'The breakfast plate has bread and an egg.', '早餐餐盘里有面包和鸡蛋。', 'plate 是盘子；这里把早餐摆在一个盘子里。'),
    row('breakfast tray', '早餐托盘', 'Carry the breakfast tray to the table.', '把早餐托盘端到桌子上。', 'tray 是托盘，可以放餐盘和杯子。'),
    row('breakfast set', '早餐套餐', 'The breakfast set is ready.', '早餐套餐准备好了。', 'set 表示一套，早餐套餐包含几样早餐食物。'),
  ],
  school: [
    row('pencil', '铅笔', 'I draw with a pencil.', '我用铅笔画画。', 'pencil 是铅笔，pen 是钢笔或圆珠笔。', '/ˈpensl/'),
    row('colored pencil', '彩色铅笔', 'Use a colored pencil to draw a flower.', '用彩色铅笔画一朵花。', 'colored pencil 是彩色铅笔，英式拼写也作 coloured pencil。'),
    row('pencil case', '笔袋', 'Put the pencil in the pencil case.', '把铅笔放进笔袋。', 'case 在这里表示盒或袋，pencil case 可以装文具。'),
    row('school bag', '书包', 'My school bag has a notebook in it.', '我的书包里有一本笔记本。', 'school bag 是书包；bag 与之前咖啡袋的 bag 是同一个常用词。'),
    row('desk', '书桌', 'My notebook is on the desk.', '我的笔记本在书桌上。', 'desk 是读书或工作的桌子，属于学习场景。', '/desk/'),
    row('classroom', '教室', 'We read in the classroom.', '我们在教室里读书。', 'classroom 是教室。后半段通过上学场景关联，不表示物品真的变成房间。', '/ˈklɑːsruːm/'),
  ],
}
type Action = { verb: string; meaning: string; phonetic: string; sentence: string; translation: string; explanation: string }
const action = (verb: string, meaning: string, sentence: string, translation: string, explanation: string): Action => ({ verb, meaning, phonetic: '', sentence, translation, explanation })
export const extraActions: Record<string, Action[]> = {
  coffee: [action('fill', '装满', 'Fill the coffee pot.', '装满咖啡壶。', '从杯子到壶是容器关联。'), action('serve', '端送', 'Serve coffee and bread on a tray.', '用托盘端送咖啡和面包。', 'serve 表示端送食物或饮品。'), action('open', '开店', 'Open a little cafe.', '开一家小咖啡馆。', '物品与店铺通过经营场景相连。')],
  garden: [action('arrange', '摆放', 'Arrange flowers in a basket.', '把花摆在篮子里。', 'arrange 是整理、摆放。'), action('place', '放置', 'Place the basket on the stand.', '把篮子放在架子上。', 'place 作动词表示放置。'), action('grow', '种植', 'Grow flowers in the garden.', '在花园里种花。', '从花架到花园是场景扩展。')],
  bakery: [action('pack', '装好', 'Pack bread in a basket.', '把面包装进篮子。', 'pack 表示装好，篮子是容器。'), action('prepare', '准备', 'Prepare a lunch box.', '准备一个午餐盒。', 'prepare 表示准备。'), action('carry', '携带', 'Carry the picnic basket.', '提着野餐篮。', 'carry 是携带、搬运。')],
  juice: [action('fill', '灌装', 'Fill the bottle with juice.', '把果汁装入瓶中。', 'bottle 是另一种容器。'), action('pack', '打包', 'Pack a juice box in the bag.', '把盒装果汁放进包里。', '这里关联不同的饮品包装。'), action('serve', '端送', 'Serve the drinks on a tray.', '用托盘端送饮料。', 'tray 用来端送饮品。')],
  clothes: [action('wear', '穿戴', 'Wear a shirt and a hat.', '穿上衬衫，戴上帽子。', '这里是穿搭关联。'), action('match', '搭配', 'Match your hat and shoes.', '搭配你的帽子和鞋子。', 'match 表示搭配。'), action('put on', '穿上', 'Put on your coat.', '穿上外套。', 'put on 表示穿上衣物。'), action('store', '收纳', 'Store the coat in the wardrobe.', '把外套收进衣柜。', 'store 是存放。')],
  paper: [action('write', '写', 'Write in a notebook.', '在笔记本上写字。', '卡片与笔记本都是纸张的用途。'), action('read', '阅读', 'Read a storybook.', '读一本故事书。', 'read 表示阅读。'), action('tidy', '整理', 'Tidy the books on the shelf.', '整理书架上的书。', 'tidy 是整理。')],
  pottery: [action('plant', '栽种', 'Plant a flower in the pot.', '在盆里种花。', '容器可以用于种植。'), action('place', '放置', 'Place the pot on the stand.', '把花盆放在架子上。', '从花盆到架子是布置场景。')],
  kitchen: [action('bake', '烘烤', 'Bake a potato.', '烘烤一个土豆。', '这是土豆的另一种做法，不是把薯片还原。'), action('mix', '混合', 'Mix cooked potatoes into a salad.', '把熟土豆混合成沙拉。', 'mix 是混合。'), action('serve', '盛放', 'Serve the salad on a plate.', '把沙拉盛到盘子上。', 'plate 是盛食物的盘子。'), action('set', '摆好', 'Set the table for dinner.', '摆好餐桌准备吃饭。', 'set the table 表示摆好餐具。')],
  fruit: [action('slice', '切片', 'Slice the apple.', '给苹果切片。', 'slice 是切成薄片。'), action('put', '放', 'Put fruit in a bowl.', '把水果放进碗里。', 'bowl 是碗。'), action('mix', '混合', 'Mix the fruit to make a salad.', '把水果混合成沙拉。', '不同水果可以组合。'), action('fill', '装满', 'Fill a cup with fruit.', '把水果装进杯子。', '这里是分装。'), action('pack', '打包', 'Pack the fruit in a box.', '把水果装进盒子。', '这里是携带水果的场景。')],
  breakfast: [action('boil', '煮', 'Boil an egg.', '煮一个鸡蛋。', 'boil 表示在水里煮。'), action('add', '加入', 'Add the egg to the bread.', '把熟鸡蛋加到面包里。', '不同材料组合成三明治。'), action('serve', '摆盘', 'Serve breakfast on a plate.', '把早餐摆在盘子上。', '从单品到一份早餐。'), action('carry', '端送', 'Carry the breakfast tray.', '端着早餐托盘。', 'carry 表示搬运、携带。'), action('prepare', '准备', 'Prepare a breakfast set.', '准备一份早餐套餐。', 'set 是一套。')],
  school: [action('color', '涂色', 'Color the picture with a pencil.', '用铅笔给画涂色。', '从铅笔到彩铅是用途关联。'), action('pack', '收好', 'Pack the pencils in a case.', '把铅笔装进笔袋。', '笔袋是容器。'), action('put', '放', 'Put the pencil case in the bag.', '把笔袋放进书包。', '同一上学场景。'), action('place', '放置', 'Place the bag by the desk.', '把书包放在书桌旁。', '书包和桌子是场景关联。'), action('learn', '学习', 'Learn in the classroom.', '在教室里学习。', 'learn 是学习。')],
}
const phrase = (text: string, meaning: string, answer: string, sentence: string, translation: string, alternatives: string[]) => ({ phrase: text, meaning, prompt: text.replace(answer, '_____'), answer, options: [answer, ...alternatives], sentence, translation, explanation: `在生活场景中使用 ${text}。` })
export const extraPhrases = {
  fruit: [phrase('a bowl of fruit', '一碗水果', 'bowl', 'We share a bowl of fruit.', '我们分享一碗水果。', ['hat', 'coat']), phrase('slice an apple', '给一个苹果切片', 'slice', 'Slice an apple for the picnic.', '给野餐准备苹果片。', ['wear', 'read'])],
  breakfast: [phrase('boil an egg', '煮一个鸡蛋', 'boil', 'Boil an egg for breakfast.', '早餐煮一个鸡蛋。', ['read', 'wear']), phrase('have breakfast', '吃早餐', 'breakfast', 'We have breakfast together.', '我们一起吃早餐。', ['pencil', 'wardrobe'])],
  school: [phrase('a school bag', '一个书包', 'school', 'I have a school bag.', '我有一个书包。', ['coffee', 'potato']), phrase('read a book', '读一本书', 'read', 'Read a book with Mia.', '和 Mia 一起读书。', ['pour', 'fry'])],
}
