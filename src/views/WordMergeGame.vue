<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowLeft, ArrowRight, BookOpen, Check, Coffee, HelpCircle, Leaf, Plus, RotateCcw, Sparkles, Trash2, Volume2, Wheat, X, Scissors, Palette, Shirt, GlassWater, CookingPot } from 'lucide-vue-next'
import WordMergeArt from '@/components/word/WordMergeArt.vue'
import { useDialogAccessibility } from '@/composables/useDialogAccessibility'
import { chainActions, districts, isTerminal, meaningChoices, shuffledChoices, themePhrases, themes, themeWords, vocabularyStats, words, wordById, type ChainAction, type DistrictId, type MergeWord, type PhraseEntry, type ThemeId } from '@/features/wordMerge/catalog'
import { currentBoard, deliver, mergeResult, mergeTiles, newGame, orderWord, parseSave, SAVE_KEY, supply, switchDistrict } from '@/features/wordMerge/game'

const storageNotice = ref('进度自动保存在当前浏览器')
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    const saved = raw ? parseSave(raw) : null
    if (raw && !saved) storageNotice.value = '旧存档无法读取，已开启新的一局'
    if (saved && JSON.parse(raw!).version === 1) storageNotice.value = '旧版进度已保留，并升级为三个街区'
    return saved || newGame()
  } catch { storageNotice.value = '浏览器未允许保存，离开后进度会丢失'; return newGame() }
}
const game = ref(loadGame())
const board = computed(() => currentBoard(game.value))
const districtThemes = computed(() => themes.filter(t => districts.find(d => d.id === game.value.district)!.themes.includes(t.id)))
const startingTheme = districts.find(d => d.id === game.value.district)!.themes[0]!
const selected = ref<number | null>(null)
const focusedWord = ref(`${startingTheme}-0`)
const theme = ref<ThemeId>(startingTheme)
const tab = ref<'play' | 'book' | 'practice'>('play')
const message = ref('开店啦！先点一个物品，再点另一个相同物品，把它们合在一起。')
const lastMerged = ref<number | null>(null)
const sound = ref(false)
const help = ref(false)
const resetOpen = ref(false)
const dialogPanel = ref<HTMLElement | null>(null)
type Challenge = { kind: 'unlock' | 'order' | 'review' | 'action' | 'phrase'; word: MergeWord; options: string[]; correct: string; theme?: ThemeId; attempted: boolean; prompt?: string; hint?: string; recordKey?: string; action?: ChainAction; phrase?: PhraseEntry; from?: MergeWord }
const challenge = ref<Challenge | null>(null)
const answerFeedback = ref('')
const dialogOpen = computed(() => help.value || resetOpen.value || challenge.value !== null)
function closeDialog() { help.value = false; resetOpen.value = false; challenge.value = null; answerFeedback.value = '' }
useDialogAccessibility(() => dialogOpen.value, dialogPanel, closeDialog)

watch(game, state => {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)) }
  catch { storageNotice.value = '浏览器未允许保存，离开后进度会丢失' }
}, { deep: true, immediate: true })
const detail = computed(() => wordById[focusedWord.value]!)
const slots = computed(() => board.value.filter(id => id === null).length)
const discovered = computed(() => words.filter(w => game.value.discovered.includes(w.id)))
const recalled = computed(() => discovered.value.filter(w => (game.value.recall[w.id] || 0) > 0).length)
const orders = computed(() => districtThemes.value.map(t => ({ theme: t, word: wordById[orderWord(game.value, t.id)]!, ready: board.value.includes(orderWord(game.value, t.id)) })))
const chain = computed(() => themeWords(theme.value))
const activeActionIndex = ref<number | null>(null)
const activeAction = computed(() => activeActionIndex.value === null ? null : chainActions[theme.value][activeActionIndex.value])
watch(theme, id => { activeActionIndex.value = null; if (wordById[focusedWord.value]!.theme !== id) focusedWord.value = `${id}-0` })
const icons = { coffee: Coffee, garden: Leaf, bakery: Wheat, juice: GlassWater, clothes: Shirt, paper: Scissors, pottery: Palette, kitchen: CookingPot }
const actionPracticed = computed(() => Object.values(game.value.actionRecall).filter(n => n > 0).length)
const phrasePracticed = computed(() => Object.values(game.value.phraseRecall).filter(n => n > 0).length)
const collectionWords = computed(() => themeWords(theme.value))
const phrases = computed(() => themePhrases[theme.value])
const canMerge = computed(() => {
  const counts: Record<string, number> = {}
  return board.value.some(id => id && !isTerminal(id) && (counts[id] = (counts[id] || 0) + 1) >= 2)
})
const compatible = (index: number) => selected.value !== null && !!mergeResult(board.value, selected.value, index)

function enterDistrict(id: DistrictId) {
  switchDistrict(game.value, id); selected.value = null; lastMerged.value = null; pointerCancel()
  const first = districts.find(d => d.id === id)!.themes[0]!
  focusedWord.value = `${first}-0`; theme.value = first; tab.value = 'play'
  message.value = '欢迎来到' + districts.find(d => d.id === id)!.name + '！各街区的棋盘分别保存，图鉴与练习记录共用。'
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) { message.value = '当前浏览器不支持朗读，可以参考单词卡上的音标。'; return }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-GB'; utterance.rate = 0.82
  const voice = window.speechSynthesis.getVoices().find(v => v.lang === 'en-GB') || window.speechSynthesis.getVoices().find(v => v.lang.startsWith('en'))
  if (voice) utterance.voice = voice
  utterance.onerror = () => { message.value = '朗读暂时不可用，可以参考单词卡上的音标。' }
  window.speechSynthesis.speak(utterance)
}
function showChallenge(word: MergeWord, kind: Challenge['kind'], orderTheme?: ThemeId) {
  answerFeedback.value = ''
  challenge.value = {
    kind, word, theme: orderTheme, attempted: false,
    options: kind === 'order' ? themeWords(word.theme).filter(w => w.id !== word.id).slice(0, 2).map(w => w.word).concat(word.word).sort((a, b) => a.localeCompare(b)) : meaningChoices(word),
    correct: kind === 'order' ? word.word : word.meaning,
    prompt: kind === 'order' ? word.sentence.replace(new RegExp(word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '_____') : undefined,
  }
}
function showActionQuiz(id: ThemeId, index: number) {
  const action = chainActions[id][index]!
  answerFeedback.value = ''
  challenge.value = { kind: 'action', word: themeWords(id)[index + 1]!, from: themeWords(id)[index]!, action,
    attempted: false, correct: action.verb, recordKey: `${id}-${index}`, hint: action.explanation,
    options: shuffledChoices(action.verb, Object.values(chainActions).flat().map(a => a.verb), index + themes.findIndex(t => t.id === id)) }
}
function showPhraseQuiz(id: ThemeId, index: number) {
  const phrase = themePhrases[id][index]!
  answerFeedback.value = ''
  challenge.value = { kind: 'phrase', word: themeWords(id)[0]!, phrase, attempted: false,
    prompt: phrase.prompt, correct: phrase.answer, recordKey: `${id}-${index}`, hint: phrase.explanation,
    options: shuffledChoices(phrase.answer, phrase.options, index + themes.findIndex(t => t.id === id)) }
}
function practice(kind: 'word' | 'action' | 'phrase') {
  if (kind === 'word') {
    const candidates = themeWords(theme.value).filter(w => game.value.discovered.includes(w.id)).sort((a, b) => (game.value.recall[a.id] || 0) - (game.value.recall[b.id] || 0))
    if (candidates[0]) showChallenge(candidates[0], 'review')
  } else {
    const pool = kind === 'action' ? chainActions[theme.value] : themePhrases[theme.value]
    const records = kind === 'action' ? game.value.actionRecall : game.value.phraseRecall
    const index = pool.map((_, i) => i).sort((a, b) => (records[`${theme.value}-${a}`] || 0) - (records[`${theme.value}-${b}`] || 0))[0]!
    if (kind === 'action') showActionQuiz(theme.value, index); else showPhraseQuiz(theme.value, index)
  }
}
function answer(option: string) {
  const quiz = challenge.value
  if (!quiz) return
  if (option !== quiz.correct) {
    quiz.attempted = true
    answerFeedback.value = quiz.hint || (quiz.kind === 'order' ? `再想一想：句子要表达“${quiz.word.translation}”。` : `再想一想：${quiz.word.relation}`)
    return
  }
  // Only an independent first-try answer counts toward recall; a corrected answer still progresses the game.
  if (!quiz.attempted) {
    const record = quiz.kind === 'action' ? game.value.actionRecall : quiz.kind === 'phrase' ? game.value.phraseRecall : game.value.recall
    const key = quiz.recordKey || quiz.word.id
    record[key] = (record[key] || 0) + 1
  }
  if (quiz.kind === 'order' && quiz.theme) {
    if (deliver(game.value, quiz.theme)) {
      selected.value = null
      message.value = `订单完成！${quiz.word.sentence} 获得 20 枚星币。`
    } else message.value = '棋盘上的订单物品已不存在，请重新合成。'
  } else if (quiz.action || quiz.phrase) {
    message.value = `答对了！${quiz.phrase ? quiz.phrase.phrase + ' · ' + quiz.phrase.meaning : quiz.action!.verb + ' · ' + quiz.action!.meaning}。${quiz.attempted ? '下次试着独立回忆。' : '已记录一次独立答对。'}`
  } else {
    message.value = `答对了！${quiz.word.word} · ${quiz.word.meaning}。${quiz.attempted ? '下次试着独立回忆。' : '已记录一次独立答对。'}`
  }
  closeDialog()
  if (sound.value) speak(quiz.phrase?.phrase || quiz.action?.verb || quiz.word.word)
}
let animationTimer: ReturnType<typeof setTimeout> | undefined
function actOnSlot(index: number) {
  if (dialogOpen.value) return
  const target = board.value[index]
  const from = selected.value
  if (from === null) {
    if (target) { selected.value = index; focusedWord.value = target; if (sound.value) speak(wordById[target]!.word) }
    return
  }
  if (from === index) { selected.value = null; return }
  const source = board.value[from]
  if (!source) { selected.value = null; return }
  if (!target) {
    board.value[index] = source; board.value[from] = null; selected.value = index
    message.value = '已移动。点另一个相同物品就能合并。'; return
  }
  const result = mergeResult(board.value, from, index)
  if (result) {
    const isNew = !game.value.discovered.includes(result)
    mergeTiles(game.value, from, index)
    selected.value = null; focusedWord.value = result; theme.value = wordById[result]!.theme
    lastMerged.value = index
    if (animationTimer) clearTimeout(animationTimer)
    animationTimer = setTimeout(() => { lastMerged.value = null }, 600)
    message.value = `合成成功：${wordById[result]!.word} · ${wordById[result]!.meaning}，+2 星币。`
    if (isNew) showChallenge(wordById[result]!, 'unlock')
    else if (sound.value) speak(wordById[result]!.word)
  } else {
    selected.value = index; focusedWord.value = target
    message.value = source === target ? '这是本条链的终点，可以交付对应订单或收入图鉴。' : '要合并两个相同物品哦。已选中这个物品。'
  }
}
function addItem(id: ThemeId) {
  const index = supply(game.value, id)
  if (index < 0) { message.value = canMerge.value ? '棋盘满了，先合并一对相同物品，或交付订单。' : '棋盘满了，可以交付订单或回收选中的物品腾出位置。'; return }
  focusedWord.value = `${id}-0`; theme.value = id
  message.value = `补给到啦：${wordById[`${id}-0`]!.word}。补给免费，随时可以领。`
}
function recycle() {
  if (selected.value === null) return
  board.value[selected.value] = null; selected.value = null
  message.value = '已回收选中的物品，图鉴记录保留。可以免费领取新的原料。'
}
function hint() {
  const slots = board.value
  for (let from = 0; from < slots.length; from++) {
    for (let to = from + 1; to < slots.length; to++) {
      if (mergeResult(slots, from, to)) {
        selected.value = from; focusedWord.value = slots[from]!; tab.value = 'play'
        message.value = `找到一对 ${wordById[slots[from]!]!.word}！点发光的同类物品合并。`; return
      }
    }
  }
  message.value = '暂时没有能合并的物品。领取相同原料，或先交付订单、回收腾出位置。'
}
function reset() {
  game.value = newGame(); selected.value = null; focusedWord.value = 'coffee-0'; theme.value = 'coffee'; tab.value = 'play'
  message.value = '新的一天开店啦！从合并两颗咖啡豆开始。'; closeDialog()
}
function inspect(word: MergeWord) { focusedWord.value = word.id; theme.value = word.theme }

// Pointer events work for mouse and touch. Keep tap-to-select as an accessible alternative to dragging.
const dragging = ref(false)
let pointerStart: { index: number; x: number; y: number; id: number } | null = null
let ignoreClick = false
function pointerDown(event: PointerEvent, index: number) {
  if (event.button !== 0 || !board.value[index] || dialogOpen.value) return
  pointerStart = { index, x: event.clientX, y: event.clientY, id: event.pointerId }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function pointerMove(event: PointerEvent) {
  if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 10) dragging.value = true
}
function pointerUp(event: PointerEvent) {
  const start = pointerStart
  if (!start) return
  if (dragging.value) {
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-slot]')
    selected.value = start.index; focusedWord.value = board.value[start.index]!
    if (target) {
      const index = Number(target.dataset.slot)
      if (index !== start.index) actOnSlot(index)
    }
    ignoreClick = true
    setTimeout(() => { ignoreClick = false }, 0)
  }
  pointerStart = null; dragging.value = false
}
function pointerCancel() { pointerStart = null; dragging.value = false }
function clickSlot(index: number) { if (!ignoreClick) actOnSlot(index) }
onBeforeUnmount(() => { if (animationTimer) clearTimeout(animationTimer); if ('speechSynthesis' in window) window.speechSynthesis.cancel() })
</script>

<template>
  <main class="word-cafe">
    <header class="cafe-header">
      <a href="#game" class="back-link"><ArrowLeft :size="17" /> 回到小店</a>
      <a class="cafe-brand" href="#game"><span class="brand-mark"><Coffee :size="22" /></span><span>Word & Co.<small>一间会说英语的小店</small></span></a>
      <div class="header-actions"><span class="demo-badge">网页试玩版</span><button class="icon-button" aria-label="玩法说明" @click="help = true"><HelpCircle :size="21" /></button></div>
    </header>

    <section class="cafe-intro">
      <div class="intro-copy"><span class="eyebrow"><span /> MERGE A LITTLE. LEARN A LITTLE.</span><h1>合在一起，<br />记住一个<span>新世界。</span></h1><p>从一颗豆子，到一杯温暖。<br />在你的小店里，让英语单词慢慢生长。</p><div class="intro-tags"><span><Check :size="14" /> 相同物品合成</span><span><Check :size="14" /> 场景关联记忆</span><span><Check :size="14" /> 英语订单挑战</span></div></div>
      <div class="shop-scene" aria-hidden="true"><div class="scene-sun" /><div class="scene-note">a little place to grow</div><div class="shop"><div class="shop-sign">WORD & CO.</div><div class="awning"><i v-for="n in 7" :key="n" /></div><div class="shop-interior"><div class="shop-window"><span>coffee<br />& kindness</span><WordMergeArt :word="wordById['coffee-4']!" /></div><div class="shop-door"><span>OPEN</span><i /></div></div><div class="shop-step" /></div><div class="scene-plant"><WordMergeArt :word="wordById['garden-2']!" /></div><div class="scene-bread"><WordMergeArt :word="wordById['bakery-2']!" /></div><span class="scene-spark">✦</span></div>
    </section>

    <section id="game" class="game-area">
      <div class="catalog-summary">{{ themes.length }} 个主题 · {{ vocabularyStats.objects }} 个物品词 · {{ vocabularyStats.actionEntries }} 条动作关联 · {{ vocabularyStats.phrases }} 个短语 <span>共 {{ vocabularyStats.unique }} 个不同单词／短语</span></div>
      <nav class="district-switch" aria-label="街区选择"><button v-for="district in districts" :key="district.id" :class="{ active: game.district === district.id }" :aria-pressed="game.district === district.id" @click="enterDistrict(district.id)"><b>{{ district.name }}</b><small>{{ district.description }}</small><span>{{ game.district === district.id ? '正在营业' : '进入街区 →' }}</span></button></nav>
      <div class="game-topline"><div class="view-switch" aria-label="游戏视图"><button :class="{ active: tab === 'play' }" :aria-pressed="tab === 'play'" @click="tab = 'play'"><Coffee :size="16" /> 我的小店</button><button :class="{ active: tab === 'book' }" :aria-pressed="tab === 'book'" @click="tab = 'book'"><BookOpen :size="16" /> 单词图鉴 <span>{{ discovered.length }}</span></button><button :class="{ active: tab === 'practice' }" :aria-pressed="tab === 'practice'" @click="tab = 'practice'"><Sparkles :size="16" /> 小店课堂</button></div><div class="game-stats"><span class="coin">✦</span><b>{{ game.coins }}</b><span class="stats-label">星币</span><span class="stat-divider" /><span>{{ game.deliveries }} 笔订单</span></div></div>

      <div class="game-layout">
        <section class="workbench">
          <div v-if="tab === 'play'" class="board-heading"><div><span class="eyebrow">YOUR LITTLE WORKBENCH</span><h2>今天，也学一点点</h2></div><button class="soft-button" @click="hint"><Sparkles :size="15" /> 找一对</button></div>
          <div v-else class="board-heading"><div><span class="eyebrow">{{ tab === 'book' ? 'YOUR WORD COLLECTION' : 'A LITTLE MORE EACH DAY' }}</span><h2>{{ tab === 'book' ? '每个单词，都有故事' : '认物、懂动作、会搭配' }}</h2></div><span class="book-count">{{ discovered.length }} / {{ words.length }} 已发现</span></div>
          <label v-if="tab !== 'play'" class="study-theme-picker">今天学哪一组？<select v-model="theme" aria-label="学习主题"><option v-for="group in themes" :key="group.id" :value="group.id">{{ group.name }} · {{ group.english }}</option></select></label>
          <div v-if="tab === 'play'" class="board" :class="{ dragging }" aria-label="合并棋盘，5 行 5 列">
            <button v-for="(id, index) in board" :key="index" :data-slot="index" class="board-slot" :class="{ occupied: id, selected: selected === index, compatible: compatible(index), pop: lastMerged === index, [id ? wordById[id]!.theme : 'empty']: true }" :aria-label="`第${Math.floor(index / 5) + 1}行第${index % 5 + 1}列，${id ? wordById[id]!.word + '，' + wordById[id]!.meaning : '空格'}`" :aria-pressed="selected === index" @click="clickSlot(index)" @pointerdown="pointerDown($event, index)" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerCancel">
              <template v-if="id"><span class="tile-level">{{ wordById[id]!.level + 1 }}<span v-if="isTerminal(id)"> ✦</span></span><WordMergeArt :word="wordById[id]!" /><span class="tile-word">{{ wordById[id]!.word }}</span></template><span v-else class="empty-dot" />
            </button>
          </div>
          <div v-else-if="tab === 'book'" class="collection">
            <section><h3><component :is="icons[theme]" :size="17" /> {{ themes.find(t => t.id === theme)!.name }} <small>{{ themes.find(t => t.id === theme)!.english }}</small></h3><div class="collection-row" :style="{ gridTemplateColumns: `repeat(${collectionWords.length}, minmax(0, 1fr))` }"><button v-for="word in collectionWords" :key="word.id" :disabled="!game.discovered.includes(word.id)" :class="{ locked: !game.discovered.includes(word.id), current: detail.id === word.id }" @click="inspect(word)"><WordMergeArt :word="word" /><b>{{ game.discovered.includes(word.id) ? word.word : '？' }}</b><span>{{ game.discovered.includes(word.id) ? word.meaning : '等待合成' }}</span><small v-if="game.recall[word.id]">独立答对 {{ game.recall[word.id] }} 次</small></button></div></section>
            <p class="collection-note">发现不等于记住。{{ recalled }} 个单词有独立答对记录；点击单词卡，再做一次回忆练习。</p>
            <div class="book-actions"><button v-for="(action, index) in chainActions[theme]" :key="index" @click="showActionQuiz(theme, index)"><span><b>{{ action.verb }}</b> · {{ action.meaning }}</span><small>独立答对 {{ game.actionRecall[`${theme}-${index}`] || 0 }} 次</small><ArrowRight :size="14" /></button></div>
          </div>
          <div v-else class="practice-studio">
            <p class="studio-intro">同一组词，换三种方式记。优先练习独立答对次数较少的内容；动作和短语可提前尝试。</p>
            <div class="practice-modes"><button @click="practice('word')"><BookOpen :size="23" /><b>认物品</b><span>看图选词义</span><small>{{ recalled }} / {{ words.length }} 有答对记录</small></button><button @click="practice('action')"><Sparkles :size="23" /><b>懂动作</b><span>这一步该做什么？</span><small>{{ actionPracticed }} / {{ vocabularyStats.actionEntries }} 有答对记录</small></button><button @click="practice('phrase')"><Coffee :size="23" /><b>会搭配</b><span>补全常用英语短语</span><small>{{ phrasePracticed }} / {{ vocabularyStats.phrases }} 有答对记录</small></button></div>
            <div class="phrase-lessons"><h3>把词放在一起用 <span>{{ phrases.length }} 个常用搭配</span></h3><article v-for="(phrase, index) in phrases" :key="phrase.phrase"><div><b lang="en">{{ phrase.phrase }}</b><span>{{ phrase.meaning }}</span></div><button class="icon-button" :aria-label="`朗读短语 ${phrase.phrase}`" @click="speak(phrase.phrase)"><Volume2 :size="18" /></button><p lang="en">{{ phrase.sentence }}</p><small>{{ phrase.translation }}</small><p class="phrase-explanation">{{ phrase.explanation }}</p><button class="soft-button" @click="showPhraseQuiz(theme, index)">练习这个搭配 <ArrowRight :size="14" /></button><span class="phrase-record">独立答对 {{ game.phraseRecall[`${theme}-${index}`] || 0 }} 次</span></article></div>
          </div>
          <div class="board-tip" role="status" aria-live="polite"><span>✦</span><p>{{ message }}</p></div>
          <template v-if="tab === 'play'">
            <div class="supply-heading"><span>原料补给 <small>免费 · 点击领取</small></span><span>{{ slots }} 个空位</span></div>
            <div class="supplies"><button v-for="group in districtThemes" :key="group.id" class="supply-button" :style="{ '--theme-color': group.color }" @click="addItem(group.id)"><span class="supply-art"><WordMergeArt :word="wordById[`${group.id}-0`]!" /></span><span><b>{{ wordById[`${group.id}-0`]!.word }}</b><small>{{ group.name }}</small></span><Plus :size="18" /></button></div>
            <div class="board-tools"><span>拖动合并，或先后点击两个相同物品</span><button :disabled="selected === null" @click="recycle"><Trash2 :size="14" /> 回收选中</button></div>
          </template>
        </section>

        <aside class="learning-side">
          <section class="orders-panel"><div class="panel-heading"><h2>小店订单</h2><span>答对句子 · +20 ✦</span></div><div v-for="(order, index) in orders" :key="order.theme.id" class="customer-order"><span class="customer-avatar" :class="order.theme.id">{{ ['M', 'L', 'O'][index] }}</span><div class="order-copy"><b>{{ ['Mia', 'Leo', 'Oliver'][index] }} 想要</b><span lang="en">{{ order.word.word }}</span></div><span class="order-art"><WordMergeArt :word="order.word" /></span><button :disabled="!order.ready" :aria-label="`交付 ${order.word.word} 订单`" @click="showChallenge(order.word, 'order', order.theme.id)">{{ order.ready ? '交付' : '待合成' }}<ArrowRight v-if="order.ready" :size="13" /></button></div><p>读懂一句英语，把物品送到需要它的人手中。</p></section>
          <section class="word-panel" :class="detail.theme"><div class="panel-heading"><span class="eyebrow">A WORD TO KEEP</span><button class="icon-button" :aria-label="`朗读单词 ${detail.word}`" @click="speak(detail.word)"><Volume2 :size="18" /></button></div><div class="word-showcase"><WordMergeArt :word="detail" /></div><div class="word-title"><h2 lang="en">{{ detail.word }}</h2><span>{{ detail.phonetic }}</span></div><p class="word-meaning">{{ detail.meaning }} <small>· {{ detail.level + 1 }} 级物品</small></p><div class="example"><button class="icon-button" aria-label="朗读例句" @click="speak(detail.sentence)"><Volume2 :size="16" /></button><p lang="en">{{ detail.sentence }}</p><small>{{ detail.translation }}</small></div><div class="connection"><span><Leaf :size="14" /> 这样连起来记</span><p>{{ detail.relation }}</p></div><button class="recall-button" @click="showChallenge(detail, 'review')"><BookOpen :size="15" /> 遮住释义，考考自己 <ArrowRight :size="15" /></button></section>
        </aside>
      </div>

      <section class="chain-panel">
        <div class="chain-heading">
          <div><span class="eyebrow">WORDS BELONG TOGETHER</span><h2>顺着一条线，记住一组词</h2><p class="chain-instruction">点一下中间的动作，听发音、看它们如何关联。</p></div>
          <div class="theme-switch"><button v-for="group in themes" :key="group.id" :class="{ active: theme === group.id }" :aria-pressed="theme === group.id" @click="theme = group.id"><component :is="icons[group.id]" :size="15" /> {{ group.name }}</button></div>
        </div>
        <div class="chain-scroll" tabindex="0" role="region" aria-label="单词与动作关联链，可左右滑动">
          <div class="word-chain">
            <template v-for="(word, index) in chain" :key="word.id">
              <div v-if="index" class="action-connector">
                <button class="chain-action" :class="{ active: activeActionIndex === index - 1 }" :aria-label="`${chain[index - 1]!.word} 到 ${word.word}：${chainActions[theme][index - 1]!.verb}，${chainActions[theme][index - 1]!.meaning}，查看动作说明`" :aria-expanded="activeActionIndex === index - 1" aria-controls="chain-action-detail" @click="activeActionIndex = activeActionIndex === index - 1 ? null : index - 1">
                  <b lang="en">{{ chainActions[theme][index - 1]!.verb }}</b>
                  <small>{{ chainActions[theme][index - 1]!.meaning }}</small>
                  <ArrowRight :size="24" />
                </button>
              </div>
              <button :disabled="!game.discovered.includes(word.id)" :class="{ locked: !game.discovered.includes(word.id), current: detail.id === word.id }" @click="inspect(word)"><span><WordMergeArt :word="word" /></span><b>{{ word.word }}</b><small>{{ word.meaning }}</small><em>{{ game.discovered.includes(word.id) ? '已发现' : '待解锁' }}</em></button>
            </template>
          </div>
        </div>
        <span class="chain-swipe-note">左右滑动，看看完整的动作链 →</span>
        <div v-if="activeAction" id="chain-action-detail" class="action-detail" aria-live="polite">
          <div class="action-detail-heading"><span class="action-label">把动作也记住</span><h3 lang="en">{{ activeAction.verb }}</h3><span class="action-phonetic">{{ activeAction.phonetic }}</span><b>{{ activeAction.meaning }}</b><button class="icon-button" :aria-label="`朗读动作 ${activeAction.verb}`" @click="speak(activeAction.verb)"><Volume2 :size="18" /></button></div>
          <div class="action-example"><p lang="en">{{ activeAction.sentence }}</p><button class="icon-button" aria-label="朗读动作例句" @click="speak(activeAction.sentence)"><Volume2 :size="16" /></button><small>{{ activeAction.translation }}</small></div>
          <p class="action-explanation">{{ activeAction.explanation }}</p>
          <button class="soft-button action-practice" @click="showActionQuiz(theme, activeActionIndex!)">考考这个动作 <ArrowRight :size="14" /></button>
        </div>
        <p class="chain-note">{{ themes.find(t => t.id === theme)!.note }}</p>
      </section>
      <footer class="cafe-footer"><span>{{ storageNotice }} · 本地试玩，不计入正式学习记录</span><div><button :aria-label="sound ? '关闭自动朗读' : '开启自动朗读'" :aria-pressed="sound" @click="sound = !sound; if (sound) speak(detail.word)"><Volume2 :size="15" /> 自动朗读{{ sound ? '开' : '关' }}</button><button @click="resetOpen = true"><RotateCcw :size="15" /> 重新开店</button></div></footer>
    </section>

    <Teleport to="body"><div v-if="dialogOpen" class="cafe-modal-backdrop" @click.self="closeDialog"><section ref="dialogPanel" class="cafe-modal" role="dialog" aria-modal="true" aria-labelledby="merge-dialog-title" tabindex="-1"><button class="modal-close" aria-label="关闭弹窗" @click="closeDialog"><X :size="20" /></button>
      <template v-if="challenge">
        <span class="eyebrow">{{ challenge.kind === 'unlock' ? 'NEW WORD, NEW STORY' : 'A LITTLE MORE EACH DAY' }}</span>
        <h2 id="merge-dialog-title">{{ challenge.kind === 'action' ? '这一步，该做什么？' : challenge.kind === 'phrase' ? '把词放在一起用' : challenge.kind === 'unlock' ? '新单词，见面啦！' : challenge.kind === 'order' ? '读懂订单，再交付' : '它是什么意思？' }}</h2>
        <template v-if="challenge.kind === 'action'">
          <div class="action-quiz-pair"><div><WordMergeArt :word="challenge.from!" /><b lang="en">{{ challenge.from!.word }}</b><small>{{ challenge.from!.meaning }}</small></div><ArrowRight :size="27" /><div><WordMergeArt :word="challenge.word" /><b lang="en">{{ challenge.word.word }}</b><small>{{ challenge.word.meaning }}</small></div></div>
          <p>从左边到右边，选择表示“{{ challenge.action!.meaning }}”的英文动作。</p>
        </template>
        <template v-else-if="challenge.kind === 'phrase'"><div class="order-quiz-sentence" lang="en">{{ challenge.prompt }}</div><p>{{ challenge.phrase!.meaning }}<br />选一个词，补全这个常用搭配。</p></template>
        <template v-else-if="challenge.kind === 'order'"><div class="order-quiz-sentence" lang="en">{{ challenge.prompt }}</div><p>{{ challenge.word.translation }}<br />哪个单词能补全这句话？</p></template>
        <template v-else><div class="quiz-art"><WordMergeArt :word="challenge.word" /></div><div class="quiz-word" lang="en">{{ challenge.word.word }}<button class="icon-button" aria-label="朗读题目单词" @click="speak(challenge.word.word)"><Volume2 :size="19" /></button></div><p>选出这个单词的中文意思</p></template>
        <div class="quiz-options"><button v-for="option in challenge.options" :key="option" @click="answer(option)">{{ option }}</button></div>
        <p v-if="answerFeedback" class="quiz-feedback" role="status">{{ answerFeedback }}</p><small class="quiz-note">答错可以再试，物品不会丢失。只有首次作答正确才计为独立答对。</small>
      </template>
      <template v-else-if="help"><span class="eyebrow">WELCOME TO WORD & CO.</span><h2 id="merge-dialog-title">你的小店，这样玩</h2><ol class="help-list"><li><b>领原料，合一合</b><span>点击下方补给。先点一个物品，再点相同物品；也可以直接拖过去。点空格可以移动。</span></li><li><b>见新词，想一想</b><span>第一次合出新物品，选择英文对应的中文意思。点小喇叭听发音，读例句、看关联。</span></li><li><b>做订单，用一用</b><span>合出顾客需要的物品，点击交付，补全英语句子。订单交付后消耗一个物品，奖励 20 星币。</span></li><li><b>翻图鉴，再记一遍</b><span>查看已发现的单词，从单词卡发起回忆练习。棋盘满时，可以合并、交付或回收选中的物品。</span></li></ol><p class="quiz-note">本版有 {{ themes.length }} 条主题链、{{ vocabularyStats.unique }} 个不同单词和短语。三个街区分别保留棋盘。小店课堂可练习词义、动作和搭配。星币是游戏奖励；独立答对次数只是练习记录，不代表已经掌握。发音使用浏览器英语语音。</p><button class="primary-button" @click="closeDialog">开始我的小店 <ArrowRight :size="17" /></button></template>
      <template v-else><span class="eyebrow">A FRESH LITTLE START</span><h2 id="merge-dialog-title">重新开一家小店？</h2><p>将清空本浏览器三个街区的棋盘、图鉴、星币和所有练习记录，从第一颗豆子开始。</p><div class="reset-actions"><button class="soft-button" @click="closeDialog">继续这家店</button><button class="primary-button" @click="reset">确认重新开店</button></div></template>
    </section></div></Teleport>
  </main>
</template>

<style scoped src="@/styles/word-merge.css"></style>
