<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowRight, Check, Volume2, Plus, ShoppingBag, X } from 'lucide-vue-next'
import type { GameState } from '@/features/wordMerge/game'
import { buyDecoration, collectFood, decorations, dueFoods, equipDecoration, finishPicnicTask, foods, markHelp, packFood, picnicTasks, recordAnswer, studyFood, type DecorationId, type FoodId } from '@/features/wordMerge/journey'
import PicnicArt from './PicnicArt.vue'
import ShopFront from './ShopFront.vue'
import DecorationArt from './DecorationArt.vue'

const props = defineProps<{ game: GameState; view: 'story' | 'review' | 'shop'; visible: boolean }>()
const emit = defineEmits<{ navigate: [view: 'story' | 'review' | 'shop'] }>()
const j = computed(() => props.game.journey)
const section = computed(() => props.view)
const selected = ref<number | null>(null)
const previewPanel = ref<HTMLElement | null>(null)
const purchaseNotice = ref('已购买的装饰可以随时切换，预览会立即更新。')
const notice = ref(props.game.journey.step === 5 ? '今天的野餐准备完成了。可以装扮小店，到了复习时间再来认认这些食物。' : '先领两份相同食物，再依次点击它们，打包成两份备餐。')
const active = ref(false)
const questionPanel = ref<HTMLElement | null>(null)
const chosenFood = ref<FoodId | null>(null)
const quantity = ref(1)
const destination = ref('')
const helpShown = ref(false)
const textShown = ref(false)
const feedback = ref('')
const reviewQueue = ref<FoodId[]>([])
const reviewIndex = ref(0)
const reviewComplete = ref(false)
const clock = ref(Date.now())
const timer = setInterval(() => { clock.value = Date.now() }, 60000)
onBeforeUnmount(() => { clearInterval(timer); if ('speechSynthesis' in window) window.speechSynthesis.cancel() })
const task = computed(() => picnicTasks[j.value.step])
const due = computed(() => dueFoods(j.value, clock.value))
const reviewFood = computed(() => reviewQueue.value[reviewIndex.value])
const target = computed(() => section.value === 'review' ? reviewFood.value : task.value?.food)
const reviewing = computed(() => section.value === 'review' && active.value)
const instruction = computed(() => {
  if (!reviewing.value) return task.value?.sentence || ''
  return { bread: 'For breakfast, I would like some bread.', apple: 'Can you bring an apple to the picnic?', milk: 'Please put some milk on the table.', water: 'I am thirsty. May I have some water?' }[reviewFood.value!]
})
const choices = computed(() => {
  const offset = (j.value.step + reviewIndex.value + 1) % foods.length
  return [...foods.slice(offset), ...foods.slice(0, offset)]
})
const totals = computed(() => Object.values(j.value.memory).reduce((all, r) => ({ helped: all.helped + r!.helped, independent: all.independent + r!.independent, retained: all.retained + r!.retained }), { helped: 0, independent: 0, retained: 0 }))
const nextReview = computed(() => {
  const times = Object.values(j.value.memory).map(r => r!.due)
  return times.length ? new Date(Math.min(...times)).toLocaleString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '认识第一个食物后安排'
})
function say(text: string) {
  if (!('speechSynthesis' in window)) { feedback.value = '这台设备暂不支持朗读。可以点“查看英文文字”继续，会记录为提示后完成。'; return }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-GB'; utterance.rate = .8
  utterance.onerror = () => { feedback.value = '语音播放失败，可以查看英文文字继续。' }
  window.speechSynthesis.speak(utterance)
}
function clearQuestion() { chosenFood.value = null; quantity.value = 1; destination.value = ''; helpShown.value = false; textShown.value = false; feedback.value = '' }
function openTask() { clearQuestion(); active.value = true; nextTick(() => questionPanel.value?.focus({ preventScroll: true })); if (j.value.mode === 'listen') say(instruction.value) }
function switchSection(value: typeof section.value) {
  emit('navigate', value)
}
watch(() => [props.view, props.visible], () => {
  active.value = false; reviewComplete.value = false; clearQuestion()
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
})
function assist(textOnly = false) {
  if (target.value) markHelp(j.value, target.value)
  if (textOnly) textShown.value = true
  else helpShown.value = true
}
function changeMode() { if (active.value) { if (target.value) markHelp(j.value, target.value); textShown.value = false } }
function collect(id: FoodId) {
  if (!collectFood(j.value, id)) { notice.value = '备餐台满了，先点击两份相同的食物打包，或退回选中的食物。'; return }
  const food = foods.find(f => f.id === id)!
  notice.value = `${food.word} ${food.phonetic} · ${food.meaning}。点击小喇叭，听听它的名字。`
}
function study(id: FoodId) { studyFood(j.value, id); say(id) }
function pack(index: number) {
  if (!j.value.pantry[index]) return
  if (selected.value === null) { selected.value = index; return }
  if (selected.value === index) { selected.value = null; return }
  const food = j.value.pantry[index]!
  if (packFood(j.value, selected.value, index)) notice.value = `打包好啦！备餐增加 2 份 ${food}。两份食物放在一起，仍然是同一种食物。`
  else notice.value = '选两份相同的食物，放在一起打包。'
  selected.value = null
}
function submit() {
  if (!target.value || !chosenFood.value || (!reviewing.value && j.value.step === 4 && !destination.value)) return
  const correct = chosenFood.value === target.value && (reviewing.value || quantity.value === task.value!.quantity && (j.value.step !== 4 || destination.value === 'bag'))
  if (!correct) {
    markHelp(j.value, target.value); helpShown.value = true
    feedback.value = '再听读一次，看看食物、数量和位置。可以再试，备餐和星币都保留。'; return
  }
  if (reviewing.value) {
    recordAnswer(j.value, target.value)
    reviewIndex.value++
    if (reviewIndex.value >= reviewQueue.value.length) { active.value = false; reviewComplete.value = true }
    else { clearQuestion(); if (j.value.mode === 'listen') say(instruction.value) }
  } else if (finishPicnicTask(props.game, chosenFood.value, quantity.value, destination.value)) {
    active.value = false; selected.value = null
    notice.value = j.value.step === 5 ? 'Mia 的野餐准备好啦！+12 星币，章节完成再得 20 星币。去看看你的小店装扮吧。' : 'Mia 收到了！+12 星币。下一份心意，也用英语送达。'
  } else feedback.value = `还没有足够的备餐。先收起订单，领取并打包 ${target.value}，再回来交付。`
  clock.value = Date.now()
}
function startReview() {
  clock.value = Date.now(); reviewQueue.value = dueFoods(j.value, clock.value).slice(0, 4); reviewIndex.value = 0
  if (!reviewQueue.value.length) return
  reviewComplete.value = false; openTask()
}
function buy(id: DecorationId) {
  const bought = buyDecoration(props.game, id)
  purchaseNotice.value = bought ? '新装饰已摆上小店，预览就是现在的样子。' : '星币不足或尚未解锁，继续完成订单就能获得星币。'
  if (bought) revealPreview()
}
function revealPreview() {
  if (window.matchMedia('(max-width:700px)').matches) nextTick(() => previewPanel.value?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth', block: 'start' }))
}
function equip(id: DecorationId) {
  if (equipDecoration(j.value, id)) { purchaseNotice.value = '装饰已更换，预览就是现在的样子。'; revealPreview() }
}
</script>

<template>
  <section class="picnic-journey" :class="[`journey-${section}`, { 'is-complete': j.step === 5 }]" aria-labelledby="picnic-title">
    <div class="journey-heading"><div><span class="eyebrow">{{ section === 'story' ? 'CHAPTER 01' : section === 'shop' ? 'MAKE IT YOURS' : 'A LITTLE EVERY DAY' }}</span><h2 id="picnic-title">{{ section === 'story' ? '帮 Mia 准备野餐' : section === 'shop' ? '装扮我的小店' : '隔天，再认一次' }}</h2></div><span v-if="section === 'story'" class="chapter-stamp">{{ j.step === 5 ? '已完成 ✓' : `${j.step} / 5 完成` }}</span></div>
    <div v-if="section === 'story'" class="journey-progress" aria-label="章节进度"><span v-for="n in 5" :key="n" :aria-label="`第 ${n} 步${j.step >= n ? '已完成' : ''}`" :class="{ done: j.step >= n, current: j.step === n - 1 }"><Check v-if="j.step >= n" :size="13" /><b v-else>{{ n }}</b></span><small>{{ active ? '读懂请求，选择食物' : j.step === 5 ? '野餐准备好了' : '领食物 → 合并打包 → 完成订单' }}</small></div>
    <div class="journey-layout">
      <div class="journey-work">
        <template v-if="section !== 'shop'">
          <div class="order-settings"><span>{{ section === 'review' ? '每次最多 4 题' : active ? 'Mia 的订单' : '准备好，再打开订单' }}</span><label>练习方式<select v-model="j.mode" aria-label="订单练习方式" @change="changeMode"><option value="picture">图文 · 读英语选图片</option><option value="listen">听力 · 听英语选图片</option></select></label></div>
          <section v-if="active" ref="questionPanel" class="picnic-question" aria-label="野餐英语练习" tabindex="-1">
            <div class="question-heading"><b>{{ reviewing ? `连续复习 ${reviewIndex + 1} / ${reviewQueue.length}` : `Mia 的第 ${j.step + 1} 个请求` }}</b><button class="icon-button" aria-label="收起订单" @click="active = false"><X :size="17" /></button></div>
            <p v-if="j.mode === 'picture' || textShown" lang="en" class="picnic-sentence">{{ instruction }}</p><p v-else class="picnic-sentence">听听 Mia 说了什么</p>
            <div class="question-aids"><button class="soft-button" aria-label="朗读野餐订单" @click="say(instruction)"><Volume2 :size="16" /> 再听一遍</button><button v-if="j.mode === 'listen' && !textShown" class="text-button" @click="assist(true)">查看英文文字</button><button class="text-button" @click="assist()">需要中文提示</button></div>
            <p v-if="helpShown" class="picnic-help">{{ reviewing ? `找一找：${foods.find(f => f.id === target)!.meaning}` : task!.translation }}</p>
            <div class="food-choices"><button v-for="food in choices" :key="food.id" :aria-label="`选择 ${food.word}`" :aria-pressed="chosenFood === food.id" @click="chosenFood = food.id"><PicnicArt :food="food.id" :alternate="reviewing" /></button></div>
            <fieldset v-if="!reviewing && j.step !== 4" class="quantity-picker"><legend>选择数量</legend><button v-for="n in 3" :key="n" :aria-pressed="quantity === n" :aria-label="`数量 ${n}`" @click="quantity = n">{{ n }}</button></fieldset>
            <fieldset v-if="!reviewing && j.step === 4" class="destination-picker"><legend>放在哪里？</legend><button v-for="place in [{ id: 'bag', name: 'bag', icon: '▱' }, { id: 'table', name: 'table', icon: '⊤' }]" :key="place.id" :aria-pressed="destination === place.id" @click="destination = place.id"><span>{{ place.icon }}</span>{{ place.name }}</button></fieldset>
            <p v-if="feedback" role="status" class="picnic-help">{{ feedback }}</p>
            <button class="primary-button" :disabled="!chosenFood || (!reviewing && j.step === 4 && !destination)" @click="submit">{{ reviewing ? '确认，下一题' : '确认交付' }} <ArrowRight :size="16" /></button>
            <small class="learning-note">中文提示、查看听力文字或重试后完成，会单独记录。听不清可以重复播放。</small>
          </section>
          <template v-else-if="section === 'story'">
            <div v-if="j.step === 5" class="chapter-finished"><span>✦</span><h3>谢谢你！我们出发吧。</h3><p>今天帮 Mia 准备了 bread、apple、milk 和 water，还把面包装进了 bag。下一次，换句话再认认它们。</p><button class="soft-button" @click="switchSection('shop')">用星币装扮小店 <ShoppingBag :size="16" /></button></div>
            <div v-else class="mission-brief"><span class="mia-avatar">M</span><div><b>{{ j.step === 4 ? '最后一步，整理野餐包' : '今天的小目标' }}</b><p>{{ j.step === 4 ? '食物齐了！听懂最后一个指令，把面包放对位置。' : '领取两份食物，点击它们打包，再去接订单。' }}</p></div><button class="primary-button" @click="openTask">{{ j.step === 4 ? '整理野餐包' : '打开订单' }} <ArrowRight :size="16" /></button></div>
            <template v-if="j.step < 5"><div class="prep-heading"><b>领取食物</b><small>免费补给 · 随时可领</small></div>
            <div class="picnic-supplies"><div v-for="food in foods" :key="food.id"><button :aria-label="`领取 ${food.word}`" @click="collect(food.id)"><PicnicArt :food="food.id" /><b lang="en">{{ food.word }}</b><small>{{ food.meaning }}</small><Plus :size="14" /></button><button class="text-button" :aria-label="`认识 ${food.word} 发音`" @click="study(food.id)"><Volume2 :size="14" /> 听发音</button></div></div>
            <div class="prep-heading"><b>备餐台 · 点击两份相同食物</b><button class="text-button" :disabled="selected === null" @click="j.pantry[selected!] = null; selected = null">退回选中食物</button></div>
            <div class="prep-board" aria-label="野餐备餐台"><button v-for="(food, index) in j.pantry" :key="index" :aria-label="`备餐格 ${index + 1}${food ? ' ' + food : ' 空'}`" :aria-pressed="selected === index" :class="{ selected: selected === index }" @click="pack(index)"><PicnicArt v-if="food" :food="food" /><span v-else>+</span></button></div>
            <div class="packed-foods" aria-label="已打包备餐"><span v-for="food in foods" :key="food.id">{{ food.word }} <b>×{{ j.packed[food.id] }}</b></span></div></template>
          </template>
          <div v-else class="review-desk"><span class="review-symbol">↻</span><h3>{{ reviewComplete ? '这一轮，复习完成！' : due.length ? `${due.length} 个食物，到了再见面的时间` : '给记忆留一点时间' }}</h3><p>{{ reviewComplete ? '本轮换了食物画法和英语句子。答题表现已保存，下次按间隔继续。' : '认识后的 24 小时再复习；独立答对后延长到 3 天。每次最多连续做 4 题。' }}</p><button v-if="due.length" class="primary-button" @click="startReview">开始隔天复习 <ArrowRight :size="16" /></button><small v-else>下次复习：{{ nextReview }}</small></div>
        </template>
        <div v-else class="decoration-shop"><div class="shop-balance">✦ {{ game.coins }} <small>可用星币</small></div><p>完成第一份订单解锁雨棚，完成野餐章节解锁招牌和花盆。答错也不影响解锁。</p><div class="decoration-grid"><article v-for="item in decorations" :key="item.id"><DecorationArt :decoration="item.id" :color="item.color" /><b>{{ item.name }}</b><small>{{ item.price }} 星币</small><button v-if="j.owned.includes(item.id)" class="soft-button" :disabled="j.equipped[item.category] === item.id" @click="equip(item.id)">{{ j.equipped[item.category] === item.id ? '已摆上小店' : '摆上小店' }}</button><button v-else class="soft-button" :disabled="j.step < item.unlock || game.coins < item.price" @click="buy(item.id)">{{ j.step < item.unlock ? (item.unlock === 1 ? '完成首单解锁' : '完成野餐解锁') : `购买 · ${item.price} ✦` }}</button></article></div></div>
        <p v-if="!active && section !== 'review'" class="journey-notice" role="status">{{ section === 'shop' ? purchaseNotice : notice }}</p>
      </div>
      <aside ref="previewPanel" class="picnic-scene-panel"><ShopFront v-if="section === 'shop'" :journey="j" :visitor="game.visitors.current?.animal" /><div v-if="section === 'story'" class="picnic-postcard"><span class="postcard-label">MIA’S PICNIC CLUB</span><div class="picnic-sun" /><svg class="picnic-tree" viewBox="0 0 130 160" aria-hidden="true"><path d="M65 83V156M65 115L39 91M65 109L89 80" stroke="#9b805b" stroke-width="8" /><path d="M65 5C10 2 7 51 22 62C-7 102 40 132 65 112C107 135 144 94 112 65C134 32 101 3 65 5" fill="#a9bb88" /></svg><div class="picnic-blanket"><div v-for="(food, index) in foods" :key="food.id" class="picnic-place" :class="{ filled: j.step > index }"><PicnicArt v-if="j.step > index" :food="food.id" /><span v-else>·</span><small v-if="j.step > index">{{ food.id === 'apple' ? '×2' : '×1' }}</small></div></div><div class="picnic-bag" :class="{ filled: j.step === 5 }"><ShoppingBag :size="45" /><PicnicArt v-if="j.step === 5" food="bread" /></div><p>{{ j.step === 5 ? 'Good food. Good friends.' : 'A little kindness, packed with care.' }}</p></div><div v-if="section === 'review'" class="memory-summary"><span class="eyebrow">A MEMORY THAT GROWS</span><h3>发现之后，慢慢记住</h3><div><span><b>{{ totals.helped }}</b>提示后答对</span><span><b>{{ totals.independent }}</b>独立答对</span><span><b>{{ totals.retained }}</b>隔天仍答对</span></div><p>这些是野餐词汇的练习记录，不代表已经掌握。隔天复习会换句子和图片，不提前显示中文答案。</p><small>下次复习：{{ nextReview }}</small></div></aside>
    </div>
  </section>
</template>

<style scoped src="@/styles/picnic-journey.css"></style>
