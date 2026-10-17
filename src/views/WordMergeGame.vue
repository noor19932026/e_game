<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowRight, BookOpen, Coffee, HelpCircle, Leaf, Plus, RotateCcw, Sparkles, Trash2, Volume2, Wheat, X, Scissors, Palette, Shirt, GlassWater, CookingPot, ShoppingBag } from 'lucide-vue-next'
import WordMergeArt from '@/components/word/WordMergeArt.vue'
import PicnicJourney from '@/components/word/PicnicJourney.vue'
import VisitorCafe from '@/components/word/VisitorCafe.vue'
import StoreCounter from '@/components/word/StoreCounter.vue'
import LifeTown from '@/components/word/LifeTown.vue'
import LittleKitchen from '@/components/word/LittleKitchen.vue'
import TidyRoom from '@/components/word/TidyRoom.vue'
import TownDelivery from '@/components/word/TownDelivery.vue'
import EnglishFishing from '@/components/word/EnglishFishing.vue'
import PetCare from '@/components/word/PetCare.vue'
import LittleFarm from '@/components/word/LittleFarm.vue'
import TownAdventure from '@/components/word/TownAdventure.vue'
import AnimalArt from '@/components/word/AnimalArt.vue'
import { animals, arrive, localDay } from '@/features/wordMerge/visitors'
import { shopGoals, shopLevel, nextLevelXp } from '@/features/wordMerge/progress'
import { townPlaces, type TownPage } from '@/features/wordMerge/town'
import { useDialogAccessibility } from '@/composables/useDialogAccessibility'
import { chainActions, combinationRecipes, districts, isTerminal, meaningChoices, shuffledChoices, themePhrases, themes, themeWords, vocabularyStats, words, wordById, type ChainAction, type DistrictId, type MergeWord, type PhraseEntry, type ThemeId } from '@/features/wordMerge/catalog'
import { BOARD_COLUMNS, BOARD_ROWS, currentBoard, claimShopGoal, goalProgress, deliver, mergeResult, mergeTiles, newGame, orderWord, parseSave, SAVE_KEY, supply, supplyWord, supplyLevel, switchDistrict } from '@/features/wordMerge/game'

const storageNotice = ref('进度自动保存在当前浏览器')
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    const saved = raw ? parseSave(raw) : null
    if (raw && !saved) storageNotice.value = '旧存档无法读取，已开启新的一局'
    if (saved && JSON.parse(raw!).version < 5) storageNotice.value = '旧进度已保留，棋盘已扩展到 48 格'
    return saved || newGame()
  } catch { storageNotice.value = '浏览器未允许保存，离开后进度会丢失'; return newGame() }
}
const game = ref(loadGame())
arrive(game.value.visitors)
const visitingAnimal = computed(() => animals.find(a => a.id === game.value.visitors.current?.animal)!)
function checkNewDay() { if (document.visibilityState === 'visible' && game.value.visitors.day !== localDay()) arrive(game.value.visitors) }
document.addEventListener('visibilitychange', checkNewDay)
const visitDayTimer = setInterval(checkNewDay, 60000)
const journeyEpoch = ref(0)
type PageId = 'today' | 'visitors' | 'merge' | 'review' | 'book' | 'practice' | 'shop' | 'town' | TownPage
const pageIds:PageId[] = ['today', 'visitors', 'merge', 'review', 'book', 'practice', 'shop', 'town', ...townPlaces.map(p => p.id)]
const initialPage = window.location.hash.slice(1) as PageId
const page = ref<PageId>(pageIds.includes(initialPage) ? initialPage : game.value.journey.step === 5 ? 'visitors' : 'today')
const townPage = computed(() => page.value === 'town' || townPlaces.some(p => p.id === page.value))
const activityDone = computed(() => Object.fromEntries(['delivery','fishing','care','farm','adventure'].map(id => { const s = game.value[id as 'delivery'|'fishing'|'care'|'farm'|'adventure']; return [id,s.independent+s.assisted] })))
const learningPage = computed(() => ['review', 'book', 'practice'].includes(page.value))
const showJourney = computed(() => ['today', 'review', 'shop'].includes(page.value))
const journeyView = computed(() => page.value === 'shop' ? 'shop' : page.value === 'review' ? 'review' : 'story')
function goPage(id: PageId) {
  page.value = id
  if (id === 'merge') message.value = '免费领两份材料，合一合；有顾客需要的物品就能直接交付。'
  window.history.replaceState(null, '', '#' + id)
  window.scrollTo({ top:0, left:0, behavior:'instant' })
  pointerCancel()
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
function syncPageHash() {
  const id = window.location.hash.slice(1) as PageId
  if (pageIds.includes(id) && id !== page.value) goPage(id)
}
function changeTownActivity(event:Event) { const id=(event.target as HTMLSelectElement).value; if (townPlaces.some(p => p.id === id)) goPage(id as TownPage) }
window.addEventListener('hashchange',syncPageHash)
function navigateJourney(view: 'story' | 'review' | 'shop' | 'merge') { goPage(view === 'story' ? 'today' : view) }

const lessonTotal = ref(0)
const lessonDone = ref(0)
const lessonIndependent = ref(0)
const roundSummary = ref('')
let lessonQueue: (() => void)[] = []
const board = computed(() => currentBoard(game.value))
const districtThemes = computed(() => themes.filter(t => districts.find(d => d.id === game.value.district)!.themes.includes(t.id)))
const startingTheme = districts.find(d => d.id === game.value.district)!.themes[0]!
const selected = ref<number | null>(null)
const basicSupply = ref(false)
const focusedWord = ref(`${startingTheme}-0`)
const theme = ref<ThemeId>(startingTheme)
const tab = ref<'play' | 'book' | 'practice'>('play')
watch(page, id => { if (id === 'merge') tab.value = 'play'; else if (id === 'book' || id === 'practice') tab.value = id }, { immediate: true })
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
function closeDialog() { help.value = false; resetOpen.value = false; challenge.value = null; answerFeedback.value = ''; lessonQueue = []; lessonTotal.value = 0 }
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
const mobileOrder = computed(() => orders.value.find(o => o.ready) || orders.value.find(o => o.theme.id === detail.value.theme) || orders.value[0]!)
const chain = computed(() => themeWords(theme.value))
const activeActionIndex = ref<number | null>(null)
const activeAction = computed(() => activeActionIndex.value === null ? null : chainActions[theme.value][activeActionIndex.value])
watch(theme, id => { activeActionIndex.value = null; if (wordById[focusedWord.value]!.theme !== id) focusedWord.value = `${id}-0` })
const icons = { coffee: Coffee, garden: Leaf, bakery: Wheat, juice: GlassWater, clothes: Shirt, paper: Scissors, pottery: Palette, kitchen: CookingPot, fruit: Leaf, breakfast: CookingPot, school: BookOpen }
const actionPracticed = computed(() => Object.values(game.value.actionRecall).filter(n => n > 0).length)
const phrasePracticed = computed(() => Object.values(game.value.phraseRecall).filter(n => n > 0).length)
const collectionWords = computed(() => themeWords(theme.value))
const phrases = computed(() => themePhrases[theme.value])
const canMerge = computed(() => board.value.some((_, i) => board.value.some((_, k) => k > i && mergeResult(board.value, i, k))))
const goal = computed(() => shopGoals.find(g => !game.value.progress.claimed.includes(g.id)))
const goalValue = computed(() => goal.value ? Math.min(goal.value.target, goalProgress(game.value, goal.value.kind)) : 0)
const districtRecipes = computed(() => combinationRecipes.filter(r => wordById[r.result] && districtThemes.value.some(t => t.id === wordById[r.result]!.theme)))
function claimGoal() { if (goal.value && claimShopGoal(game.value, goal.value.id)) message.value = '开店目标达成！奖励已经放进你的星币口袋。' }
function deliverOrder(id: ThemeId) {
  const word = wordById[orderWord(game.value, id)]!
  if (!deliver(game.value, id)) return
  selected.value = null
  message.value = `送达 ${word.word}！+20 星币，+12 成长。${game.value.orderStep[id] % 3 === 0 && supplyLevel(game.value, id) > 0 ? '这一组补给升级了，现在可以直接领取中级材料！' : ''}`
  if (sound.value) speak(`Thank you for the ${word.word}.`)
}
const compatible = (index: number) => selected.value !== null && !!mergeResult(board.value, selected.value, index)

function enterDistrict(id: DistrictId) {
  switchDistrict(game.value, id); selected.value = null; lastMerged.value = null; pointerCancel()
  basicSupply.value = false
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
    prompt: kind === 'order' ? `Please bring the ${word.word} to my table.` : undefined,
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
  lessonDone.value = 0; lessonIndependent.value = 0; roundSummary.value = ''
  if (kind === 'word') {
    const candidates = discovered.value.slice().sort((a, b) => Number(b.theme === theme.value) - Number(a.theme === theme.value) || (game.value.recall[a.id] || 0) - (game.value.recall[b.id] || 0)).slice(0, 3)
    lessonQueue = candidates.map(word => () => showChallenge(word, 'review'))
  } else {
    const pool = kind === 'action' ? chainActions[theme.value] : themePhrases[theme.value]
    const records = kind === 'action' ? game.value.actionRecall : game.value.phraseRecall
    const id = theme.value
    const indices = pool.map((_, i) => i).sort((a, b) => (records[`${id}-${a}`] || 0) - (records[`${id}-${b}`] || 0)).slice(0, 3)
    lessonQueue = indices.map(index => () => kind === 'action' ? showActionQuiz(id, index) : showPhraseQuiz(id, index))
    if (lessonQueue.length < 3) lessonQueue.push(() => showActionQuiz(id, 0))
  }
  lessonTotal.value = lessonQueue.length
  lessonQueue.shift()?.()
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
  if (lessonTotal.value) {
    lessonDone.value++; if (!quiz.attempted) lessonIndependent.value++
    const next = lessonQueue.shift()
    if (next) next()
    else {
      roundSummary.value = `这一轮完成 ${lessonDone.value} 题，独立答对 ${lessonIndependent.value} 题。今天练了${theme.value === 'coffee' ? '咖啡' : themes.find(t => t.id === theme.value)!.name}相关表达；下次再换一组。`
      closeDialog()
    }
  } else closeDialog()
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
    const combination = source !== target
    mergeTiles(game.value, from, index)
    selected.value = null; focusedWord.value = result; theme.value = wordById[result]!.theme
    lastMerged.value = index
    if (animationTimer) clearTimeout(animationTimer)
    animationTimer = setTimeout(() => { lastMerged.value = null }, 600)
    message.value = `${combination ? '组合成功' : '合成成功'}：${wordById[result]!.word} · ${wordById[result]!.meaning}，+${combination ? 5 : 2} 星币${isNew ? '，发现新物品！' : '。'}`
    if (isNew) message.value += ' 新朋友已收入图鉴，点小喇叭认识它；合成可以继续。'
    if (sound.value) speak(wordById[result]!.word)
  } else {
    selected.value = index; focusedWord.value = target
    message.value = source === target ? '这是本条链的终点，可以交付对应订单或收入图鉴。' : '要合并两个相同物品哦。已选中这个物品。'
  }
}
function addItem(id: ThemeId) {
  const first = supply(game.value, id, basicSupply.value)
  if (first < 0) { message.value = canMerge.value ? '棋盘满了，先合并一对，或交付订单。' : '棋盘满了，可以交付订单或退回选中的物品。'; return }
  const second = supply(game.value, id, basicSupply.value)
  const supplied = supplyWord(game.value, id, basicSupply.value)
  focusedWord.value = supplied; theme.value = id
  message.value = `领取了 ${second < 0 ? 1 : 2} 份 ${wordById[supplied]!.word}，直接合一合吧。`
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
  game.value = newGame(); arrive(game.value.visitors); journeyEpoch.value++; selected.value = null; focusedWord.value = 'coffee-0'; theme.value = 'coffee'; tab.value = 'play'; goPage('today')
  message.value = '新的一天开店啦！从合并两颗咖啡豆开始。'; closeDialog()
}
function inspect(word: MergeWord) { focusedWord.value = word.id; theme.value = word.theme }

// Pointer events work for mouse and touch. Keep tap-to-select as an accessible alternative to dragging.
const dragging = ref(false)
let pointerStart: { index: number; x: number; y: number; id: number } | null = null
let ignoreClick = false
function pointerDown(event: PointerEvent, index: number) {
  // Phones scroll through the board; two taps merge without a precision drag.
  if (event.pointerType === 'touch') return
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
onBeforeUnmount(() => { clearInterval(visitDayTimer); document.removeEventListener('visibilitychange', checkNewDay); window.removeEventListener('hashchange',syncPageHash); if (animationTimer) clearTimeout(animationTimer); if ('speechSynthesis' in window) window.speechSynthesis.cancel() })
</script>

<template>
  <main class="word-cafe">
    <header class="cafe-header">
      <a class="cafe-brand" href="#today" @click.prevent="goPage('today')"><span class="brand-mark"><Coffee :size="22" /></span><span>Word & Co.<small>用英语，经营小小日常</small></span></a>
      <div class="header-actions"><span class="shop-level-badge">Lv.{{ shopLevel(game.progress.xp) }}</span><span class="header-wallet" aria-label="星币余额">✦ <b>{{ game.coins }}</b></span><button class="icon-button" aria-label="玩法说明" @click="help = true"><HelpCircle :size="21" /></button></div>
    </header>
    <nav class="main-navigation" aria-label="主要功能">
      <button :aria-pressed="page === 'today' || page === 'visitors'" @click="goPage('today')"><Coffee :size="18" /><span>今日任务</span></button>
      <button :aria-pressed="page === 'merge'" @click="goPage('merge')"><Plus :size="18" /><span>自由合成</span></button>
      <button :aria-pressed="townPage" @click="goPage('town')"><ShoppingBag :size="18" /><span>生活小镇</span></button>
      <button :aria-pressed="learningPage" @click="goPage('review')"><BookOpen :size="18" /><span>学习</span></button>
      <button :aria-pressed="page === 'shop'" @click="goPage('shop')"><ShoppingBag :size="18" /><span>我的小店</span></button>
    </nav>
    <section id="game" class="game-area">
      <nav v-if="townPage && page !== 'town'" class="town-navigation" aria-label="小镇活动"><button @click="goPage('town')">小镇地图</button><div class="town-desktop-links"><button v-for="place in townPlaces" :key="place.id" :aria-pressed="page === place.id" @click="goPage(place.id)">{{ place.title }}</button></div><select class="town-activity-select" aria-label="切换小镇活动" :value="page" @change="changeTownActivity"><option v-for="place in townPlaces" :key="place.id" :value="place.id">{{ place.title }}</option></select></nav>
      <LifeTown v-if="page === 'town'" :kitchen-done="game.kitchen.independent + game.kitchen.assisted" :room-done="Object.values(game.room.sessions).filter(s => s.rewarded).length" :activity-done="activityDone" :store-done="Object.values(game.stores.sessions).reduce((sum,s) => sum+s.independent+s.assisted,0)" @navigate="goPage" />
      <LittleKitchen v-if="page === 'kitchen'" :game="game" />
      <TidyRoom v-if="page === 'room'" :game="game" />
      <TownDelivery v-if="page === 'delivery'" :game="game" />
      <EnglishFishing v-if="page === 'fishing'" :game="game" />
      <PetCare v-if="page === 'care'" :game="game" />
      <LittleFarm v-if="page === 'farm'" :game="game" />
      <TownAdventure v-if="page === 'adventure'" :game="game" />
      <StoreCounter v-if="page === 'stores'" :game="game" />
      <nav v-if="page === 'today' || page === 'visitors'" class="today-navigation" aria-label="今日活动">
        <button :aria-pressed="page === 'today'" @click="goPage('today')">野餐故事 <span>{{ game.journey.step }} / 5</span></button>
        <button class="visitor-entry" :aria-pressed="page === 'visitors'" aria-label="动物来访" @click="goPage('visitors')"><AnimalArt :animal="visitingAnimal.id" :color="visitingAnimal.color" /><span>{{ visitingAnimal.name }} 来做客<small>免费招待小伙伴</small></span><b v-if="!game.visitors.current?.served">新</b></button>
      </nav>
      <VisitorCafe v-show="page === 'visitors'" :key="`visitors-${journeyEpoch}`" :game="game" />
      <nav v-if="learningPage" class="view-switch study-navigation" aria-label="学习内容">
        <button :class="{ active: page === 'review' }" :aria-pressed="page === 'review'" @click="goPage('review')">隔天复习</button>
        <button :class="{ active: page === 'book' }" :aria-pressed="page === 'book'" @click="goPage('book')">单词图鉴 <span>{{ discovered.length }}</span></button>
        <button :class="{ active: page === 'practice' }" :aria-pressed="page === 'practice'" @click="goPage('practice')">小店课堂</button>
      </nav>
      <PicnicJourney v-show="showJourney" :key="journeyEpoch" :game="game" :view="journeyView" :visible="showJourney" @navigate="navigateJourney" />
      <div v-show="['merge', 'book', 'practice'].includes(page)" class="free-play">
      <div v-if="page === 'merge'" class="merge-topline"><h1>把小店，一点点做大</h1><span>48 格工坊 · {{ words.length }} 个物品 · {{ game.deliveries }} 笔订单</span></div>
      <section v-if="page === 'merge'" class="shop-growth" aria-label="小店成长目标"><div class="growth-level"><b>Lv.{{ shopLevel(game.progress.xp) }}</b><span>小店成长<small>{{ game.progress.xp }} / {{ nextLevelXp(game.progress.xp) }} XP</small></span></div><div class="growth-goal" v-if="goal"><b>{{ goal.title }}</b><span>{{ goal.description }} · {{ goalValue }} / {{ goal.target }}</span><progress :value="goalValue" :max="goal.target" /></div><div v-else class="growth-goal"><b>小店经营家</b><span>开店目标全部完成，继续收集和招待顾客吧。</span></div><button v-if="goal" class="soft-button" :disabled="goalValue < goal.target" @click="claimGoal">{{ goalValue >= goal.target ? '领取奖励' : '目标奖励' }} · {{ goal.reward }} ✦</button></section>
      <nav v-if="page === 'merge'" class="district-switch" aria-label="街区选择"><button v-for="district in districts" :key="district.id" :class="{ active: game.district === district.id }" :aria-pressed="game.district === district.id" @click="enterDistrict(district.id)"><b>{{ district.name }}</b></button></nav>
      <div class="game-layout" :class="{ 'studio-layout': tab === 'practice', 'merge-layout': page === 'merge' }">
        <section class="workbench">
          <div v-if="tab === 'play'" class="board-heading"><div><span class="eyebrow">YOUR LITTLE WORKBENCH</span><h2>{{ selected === null ? '48 格小工坊，慢慢做大' : detail.word + ' · ' + detail.meaning }}</h2></div><button class="soft-button" @click="hint"><Sparkles :size="15" /> 找一对</button></div>
          <div v-else class="board-heading"><div><span class="eyebrow">{{ tab === 'book' ? 'YOUR WORD COLLECTION' : 'A LITTLE MORE EACH DAY' }}</span><h2>{{ tab === 'book' ? '每个单词，都有故事' : '认物、懂动作、会搭配' }}</h2></div><span class="book-count">{{ discovered.length }} / {{ words.length }} 已发现</span></div>
          <label v-if="tab !== 'play'" class="study-theme-picker">今天学哪一组？<select v-model="theme" aria-label="学习主题"><option v-for="group in themes" :key="group.id" :value="group.id">{{ group.name }} · {{ group.english }}</option></select></label>
<div v-if="tab === 'play' && districtThemes.some(t => supplyLevel(game, t.id) > 0)" class="supply-mode"><span>补给可直接领取中级材料</span><button class="soft-button" :aria-pressed="basicSupply" @click="basicSupply = !basicSupply">{{ basicSupply ? '切换升级补给' : '领取基础材料' }}</button></div>
          <div v-if="tab === 'play'" class="supplies compact-supplies"><button v-for="group in districtThemes" :key="group.id" :data-supply="group.id" class="supply-button" :style="{ '--theme-color': group.color }" @click="addItem(group.id)"><span class="supply-art"><WordMergeArt :word="wordById[supplyWord(game, group.id, basicSupply)]!" /></span><span><b>{{ wordById[supplyWord(game, group.id, basicSupply)]!.word }}</b><small>{{ basicSupply ? '基础材料' : supplyLevel(game, group.id) ? '补给已升级' : group.name }} · 免费领 2 份</small></span><Plus :size="16" /></button></div>
          <p v-if="tab === 'play'" class="touch-board-help">点一个物品，再点同类合成 · 上下滑动查看棋盘</p>
          <div v-if="tab === 'play'" class="board" :class="{ dragging }" :aria-label="`合并棋盘，${BOARD_ROWS} 行 ${BOARD_COLUMNS} 列`">
            <button v-for="(id, index) in board" :key="index" :data-slot="index" class="board-slot" :class="{ occupied: id, selected: selected === index, compatible: compatible(index), pop: lastMerged === index, [id ? wordById[id]!.theme : 'empty']: true }" :aria-label="`第${Math.floor(index / BOARD_COLUMNS) + 1}行第${index % BOARD_COLUMNS + 1}列，${id ? wordById[id]!.word + '，' + wordById[id]!.meaning : '空格'}`" :aria-pressed="selected === index" @click="clickSlot(index)" @pointerdown="pointerDown($event, index)" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerCancel">
              <template v-if="id"><span class="tile-level">{{ wordById[id]!.level + 1 }}<span v-if="isTerminal(id)"> ✦</span></span><WordMergeArt :word="wordById[id]!" /><span class="tile-word">{{ wordById[id]!.word }}</span><span v-if="lastMerged === index" class="merge-reward">+ {{ game.progress.combinations && message.startsWith('组合') ? 5 : 2 }} ✦</span></template><span v-else class="empty-dot" />
            </button>
          </div>
          <div v-else-if="tab === 'book'" class="collection">
            <section><h3><component :is="icons[theme]" :size="17" /> {{ themes.find(t => t.id === theme)!.name }} <small>{{ themes.find(t => t.id === theme)!.english }}</small></h3><div class="collection-row" :style="{ gridTemplateColumns: `repeat(${collectionWords.length}, minmax(0, 1fr))` }"><button v-for="word in collectionWords" :key="word.id" :disabled="!game.discovered.includes(word.id)" :class="{ locked: !game.discovered.includes(word.id), current: detail.id === word.id }" @click="inspect(word)"><WordMergeArt :word="word" /><b>{{ game.discovered.includes(word.id) ? word.word : '？' }}</b><span>{{ game.discovered.includes(word.id) ? word.meaning : '等待合成' }}</span><small v-if="game.recall[word.id]">独立答对 {{ game.recall[word.id] }} 次</small></button></div></section>
            <p class="collection-note">发现不等于记住。{{ recalled }} 个单词有独立答对记录；点击单词卡，再做一次回忆练习。</p>
            <div class="book-actions"><button v-for="(action, index) in chainActions[theme]" :key="index" @click="showActionQuiz(theme, index)"><span><b>{{ action.verb }}</b> · {{ action.meaning }}</span><small>独立答对 {{ game.actionRecall[`${theme}-${index}`] || 0 }} 次</small><ArrowRight :size="14" /></button></div>
          </div>
          <div v-else class="practice-studio">
            <p class="studio-intro">每轮连续练习 3 题，再休息一下。优先练习独立答对次数较少的内容；动作和短语可提前尝试。</p><p v-if="roundSummary" class="round-summary" role="status">{{ roundSummary }}</p>
            <div class="practice-modes"><button @click="practice('word')"><BookOpen :size="23" /><b>认物品</b><span>看图选词义</span><small>{{ recalled }} / {{ words.length }} 有答对记录</small></button><button @click="practice('action')"><Sparkles :size="23" /><b>懂动作</b><span>这一步该做什么？</span><small>{{ actionPracticed }} / {{ vocabularyStats.actionEntries }} 有答对记录</small></button><button @click="practice('phrase')"><Coffee :size="23" /><b>会搭配</b><span>补全常用英语短语</span><small>{{ phrasePracticed }} / {{ vocabularyStats.phrases }} 有答对记录</small></button></div>
            <div class="phrase-lessons"><h3>把词放在一起用 <span>{{ phrases.length }} 个常用搭配</span></h3><article v-for="(phrase, index) in phrases" :key="phrase.phrase"><div><b lang="en">{{ phrase.phrase }}</b><span>{{ phrase.meaning }}</span></div><button class="icon-button" :aria-label="`朗读短语 ${phrase.phrase}`" @click="speak(phrase.phrase)"><Volume2 :size="18" /></button><p lang="en">{{ phrase.sentence }}</p><small>{{ phrase.translation }}</small><p class="phrase-explanation">{{ phrase.explanation }}</p><button class="soft-button" @click="showPhraseQuiz(theme, index)">练习这个搭配 <ArrowRight :size="14" /></button><span class="phrase-record">独立答对 {{ game.phraseRecall[`${theme}-${index}`] || 0 }} 次</span></article></div>
          </div>
          <div v-if="tab === 'play'" class="board-tip" role="status" aria-live="polite"><span>✦</span><p>{{ message }}</p></div>
          <template v-if="tab === 'play'">
            <div class="board-tools"><span>{{ slots }} 个空位 · 同类升级，也能尝试组合配方</span><button :disabled="selected === null" @click="recycle"><Trash2 :size="14" /> 回收选中</button></div>
          </template>
        </section>

        <aside v-if="tab !== 'practice'" class="learning-side">
          <section v-if="tab === 'play'" class="orders-panel"><div class="panel-heading"><h2>小店订单</h2><span>直接送达 · +20 ✦</span></div><div v-for="(order, index) in orders" :key="order.theme.id" class="customer-order"><span class="customer-avatar" :class="order.theme.id">{{ ['M', 'L', 'O', 'N'][index] }}</span><div class="order-copy"><b>{{ ['Mia', 'Leo', 'Oliver', 'Nora'][index] }} 想要</b><span lang="en">{{ order.word.word }}</span></div><span class="order-art"><WordMergeArt :word="order.word" /></span><button :disabled="!order.ready" :aria-label="`交付 ${order.word.word} 订单`" @click="deliverOrder(order.theme.id)">{{ order.ready ? '交付' : '待合成' }}<ArrowRight v-if="order.ready" :size="13" /></button></div><p>合出需要的物品就能直接交付。每组完成 3／6 单后，补给会升级。</p></section><details v-if="tab === 'play'" class="recipe-book"><summary>发现不同材料的组合配方 · {{ districtRecipes.length }} 个</summary><article v-for="recipe in districtRecipes" :key="recipe.id"><div><WordMergeArt :word="wordById[recipe.ingredients[0]]!" /><span>+</span><WordMergeArt :word="wordById[recipe.ingredients[1]]!" /><span>→</span><WordMergeArt :word="wordById[recipe.result]!" /></div><b>{{ recipe.name }}</b><small>{{ recipe.explanation }}，直接拖到一起试试。</small></article></details>
          <section v-if="tab === 'book'" class="word-panel" :class="detail.theme"><div class="panel-heading"><span class="eyebrow">A WORD TO KEEP</span><button class="icon-button" :aria-label="`朗读单词 ${detail.word}`" @click="speak(detail.word)"><Volume2 :size="18" /></button></div><div class="word-showcase"><WordMergeArt :word="detail" /></div><div class="word-title"><h2 lang="en">{{ detail.word }}</h2><span>{{ detail.phonetic }}</span></div><p class="word-meaning">{{ detail.meaning }} <small>· {{ detail.level + 1 }} 级物品</small></p><div class="example"><button class="icon-button" aria-label="朗读例句" @click="speak(detail.sentence)"><Volume2 :size="16" /></button><p lang="en">{{ detail.sentence }}</p><small>{{ detail.translation }}</small></div><div class="connection"><span><Leaf :size="14" /> 这样连起来记</span><p>{{ detail.relation }}</p></div><button class="recall-button" @click="showChallenge(detail, 'review')"><BookOpen :size="15" /> 遮住释义，考考自己 <ArrowRight :size="15" /></button></section>
        </aside>
      </div>

      <section v-if="page === 'merge'" class="quick-delivery" aria-label="当前顾客订单"><WordMergeArt :word="mobileOrder.word" /><div><small>{{ mobileOrder.ready ? '顾客的餐点准备好啦' : '当前小店订单' }}</small><b lang="en">{{ mobileOrder.word.word }}</b></div><button class="primary-button" :disabled="!mobileOrder.ready" :aria-label="`交付 ${mobileOrder.word.word} 订单`" @click="deliverOrder(mobileOrder.theme.id)">{{ mobileOrder.ready ? '交付 +20 ✦' : '等你合成' }}</button></section>
      <details v-if="page === 'book'" class="chain-disclosure"><summary>看看单词与动作如何关联</summary><section class="chain-panel">
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
      </details>
      </div>
      <footer class="cafe-footer"><span>{{ storageNotice }}</span><div><button :aria-label="sound ? '关闭自动朗读' : '开启自动朗读'" :aria-pressed="sound" @click="sound = !sound; if (sound) speak(detail.word)"><Volume2 :size="15" /> 自动朗读{{ sound ? '开' : '关' }}</button><button @click="resetOpen = true"><RotateCcw :size="15" /> 重新开店</button></div></footer>
    </section>

    <Teleport to="body"><div v-if="dialogOpen" class="cafe-modal-backdrop" @click.self="closeDialog"><section ref="dialogPanel" class="cafe-modal" role="dialog" aria-modal="true" aria-labelledby="merge-dialog-title" tabindex="-1"><button class="modal-close" aria-label="关闭弹窗" @click="closeDialog"><X :size="20" /></button>
      <template v-if="challenge">
        <span class="eyebrow">{{ challenge.kind === 'unlock' ? 'NEW WORD, NEW STORY' : 'A LITTLE MORE EACH DAY' }}</span>
        <p v-if="lessonTotal" class="lesson-progress">连续练习 {{ lessonDone + 1 }} / {{ lessonTotal }}</p>
        <h2 id="merge-dialog-title">{{ challenge.kind === 'action' ? '这一步，该做什么？' : challenge.kind === 'phrase' ? '把词放在一起用' : challenge.kind === 'unlock' ? '新单词，见面啦！' : challenge.kind === 'order' ? '读懂订单，再交付' : '它是什么意思？' }}</h2>
        <template v-if="challenge.kind === 'action'">
          <div class="action-quiz-pair"><div><WordMergeArt :word="challenge.from!" /><b lang="en">{{ challenge.from!.word }}</b><small>{{ challenge.from!.meaning }}</small></div><ArrowRight :size="27" /><div><WordMergeArt :word="challenge.word" /><b lang="en">{{ challenge.word.word }}</b><small>{{ challenge.word.meaning }}</small></div></div>
          <p>从左边到右边，选择表示“{{ challenge.action!.meaning }}”的英文动作。</p>
        </template>
        <template v-else-if="challenge.kind === 'phrase'"><div class="order-quiz-sentence" lang="en">{{ challenge.prompt }}</div><p>{{ challenge.phrase!.meaning }}<br />选一个词，补全这个常用搭配。</p></template>
        <template v-else-if="challenge.kind === 'order'"><div class="order-quiz-sentence" lang="en">{{ challenge.prompt }}</div><p>读懂顾客的新请求，选择对应物品。答对后消耗一件物品并交付。</p></template>
        <template v-else><div class="quiz-art"><WordMergeArt :word="challenge.word" /></div><div class="quiz-word" lang="en">{{ challenge.word.word }}<button class="icon-button" aria-label="朗读题目单词" @click="speak(challenge.word.word)"><Volume2 :size="19" /></button></div><p>选出这个单词的中文意思</p></template>
        <div class="quiz-options" :class="{ 'image-options': challenge.kind === 'order' }"><button v-for="option in challenge.options" :key="option" :aria-label="challenge.kind === 'order' ? `选择 ${option}` : option" @click="answer(option)"><WordMergeArt v-if="challenge.kind === 'order'" :word="themeWords(challenge.word.theme).find(w => w.word === option)!" /><template v-else>{{ option }}</template></button></div>
        <p v-if="answerFeedback" class="quiz-feedback" role="status">{{ answerFeedback }}</p><small class="quiz-note">答错可以再试，物品不会丢失。只有首次作答正确才计为独立答对。</small>
      </template>
      <template v-else-if="help"><span class="eyebrow">WELCOME TO WORD & CO.</span><h2 id="merge-dialog-title">你的小店，这样玩</h2><ol class="help-list"><li><b>领原料，合一合</b><span>点击棋盘上方补给。先点一个物品，再点相同物品；也可以直接拖过去。点空格可以移动。</span></li><li><b>见新词，想一想</b><span>第一次合出新物品，用轻提示介绍，不打断合成。点小喇叭听发音，读例句、看关联。</span></li><li><b>做订单，用一用</b><span>合出顾客需要的物品，点击交付，直接把需要的物品送给顾客。订单交付后消耗一个物品，奖励 20 星币。</span></li><li><b>开店接客，配齐一套</b><span>在超市、水果市场、服装店的混排商品堆里，找出顾客要的商品。凑齐数量和搭配后一起交付；拿错可从购物篮放回，每轮接待三位顾客。</span></li><li><b>在生活小镇，用英语做事情</b><span>小小厨房制作餐点，小屋练习方位；还可以送货、钓鱼、照料宠物、种植采收，在场景里寻宝解谜。可以选择图文、阅读和听力，提示后完成会单独记录。</span></li><li><b>翻图鉴，再记一遍</b><span>查看已发现的单词，从单词卡发起回忆练习。棋盘满时，可以合并、交付或回收选中的物品。</span></li></ol><p class="quiz-note">本版有 {{ themes.length }} 条主题链、{{ vocabularyStats.unique }} 个不同单词和短语。三个街区分别保留棋盘。小店课堂可练习词义、动作和搭配。“今日任务”中还会有免费的小动物来访，合成专属餐点招待它，点它互动可发现隐藏委托。星币是游戏奖励；独立答对次数只是练习记录，不代表已经掌握。发音使用浏览器英语语音。</p><button class="primary-button" @click="closeDialog">开始我的小店 <ArrowRight :size="17" /></button></template>
      <template v-else><span class="eyebrow">A FRESH LITTLE START</span><h2 id="merge-dialog-title">重新开一家小店？</h2><p>将清空本浏览器的野餐章节、装饰、复习计划、三个街区的棋盘、三家店的接客进度、全部小镇活动、菜谱与布置、图鉴、星币和所有练习记录。</p><div class="reset-actions"><button class="soft-button" @click="closeDialog">继续这家店</button><button class="primary-button" @click="reset">确认重新开店</button></div></template>
    </section></div></Teleport>
  </main>
</template>

<style scoped src="@/styles/word-merge.css"></style>
