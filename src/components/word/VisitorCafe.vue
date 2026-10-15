<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Volume2, Plus, ArrowRight, Heart, Sparkles } from 'lucide-vue-next'
import type { GameState } from '@/features/wordMerge/game'
import { animals, petRecipes, supplyPet, mergePet, feedVisitor, greetVisitor, waterVisitor, type PetRoute } from '@/features/wordMerge/visitors'
import AnimalArt from './AnimalArt.vue'
import PetFoodArt from './PetFoodArt.vue'
import PicnicArt from './PicnicArt.vue'

const props = defineProps<{ game: GameState }>()
const v = computed(() => props.game.visitors)
const guest = computed(() => v.value.current)
const animal = computed(() => animals.find(a => a.id === guest.value?.animal)!)
const route = ref<PetRoute>(guest.value?.animal || 'cat')
const recipe = computed(() => petRecipes[route.value])
const selected = ref<number | null>(null)
const message = ref('免费领两份原料，依次点击相同卡片合成，再把餐点送给小伙伴。')
const expanded = ref(false)
const request = computed(() => guest.value ? `May I have ${guest.value.wants === 2 ? 'a ' : ''}${petRecipes[guest.value.animal].words[guest.value.wants]}, please?` : '')
const maxLevel = computed(() => route.value === 'care' || v.value.upgraded.includes(route.value) ? 2 : 1)
const canFeed = computed(() => selected.value !== null && !guest.value?.served && v.value.board[selected.value]?.route === guest.value?.animal && v.value.board[selected.value]?.level === guest.value?.wants)
watch(() => guest.value?.number, () => { route.value = guest.value?.animal || 'cat'; selected.value = null; expanded.value = false; message.value = '新朋友到了，备餐台上的物品会保留。看看它想要什么吧。' })
function speak(text: string) {
  if (!('speechSynthesis' in window)) { message.value = '当前设备无法朗读，可以看英语请求和中文提示继续。'; return }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-GB'; utterance.rate = .8
  utterance.onerror = () => { message.value = '语音暂时不可用，可以看英语请求继续。' }
  window.speechSynthesis.speak(utterance)
}
function collect() {
  message.value = supplyPet(v.value, route.value) ? `领取了 ${recipe.value.words[0]} · ${recipe.value.meanings[0]}，再领一份就可以合成。` : '备餐台满了，先合并、招待小伙伴，或退回选中的物品。'
}
function select(index: number) {
  if (!v.value.board[index]) return
  if (selected.value === index) { selected.value = null; return }
  if (selected.value === null) { selected.value = index; return }
  const tile = v.value.board[index]!
  if (mergePet(v.value, selected.value, index)) {
    selected.value = index
    message.value = `备餐完成：${petRecipes[tile.route].words[tile.level + 1]}！选中它，就可以尝试招待。`
  } else { selected.value = index; message.value = '已选中这张卡片。相同食物、相同等级才能合成；金色卡片已经到达当前路线终点。' }
}
function serve() {
  if (selected.value === null) return
  const result = feedVisitor(props.game, selected.value)
  if (!result.ok) { message.value = '看看英语请求，选中对应的小动物餐点再招待。'; return }
  selected.value = null
  message.value = `${animal.value.name} 吃得很开心！友好积分 +1${result.coins ? `，星币 +${result.coins}` : '，今天的星币谢礼已经领过了'}。${result.unlocked ? `新路线已展开：${petRecipes[animal.value.id].words[2]}。` : ''} 它还没有走，试着点点它。`
}
function greet() {
  if (greetVisitor(v.value)) message.value = '发现隐藏委托！小伙伴还想要一碗清水，听听它的请求。'
  else { message.value = guest.value?.served ? '它轻轻蹭了蹭你。谢谢你的照顾！' : animal.value.greeting; speak(animal.value.greeting) }
}
function giveWater(choice: string) {
  const result = waterVisitor(props.game, choice)
  if (!result.ok) { message.value = '它想要的是清水。听听 water 的发音，再试试；物品和星币都不会丢失。'; return }
  message.value = `隐藏委托完成！友好积分 +1${result.coins ? `，星币 +${result.coins}` : ''}。${result.unlocked ? '收到新路线「温柔照料」：cloth → soft towel → pet cushion，已经可以免费合成。' : '它把一枚小小的感谢印章留在了来访簿上。'}`
}
</script>

<template>
  <section v-if="guest" class="visitor-cafe" aria-labelledby="visitor-title">
    <header class="visitor-heading"><div><span class="visitor-eyebrow">LITTLE GUESTS, LITTLE STORIES</span><h1 id="visitor-title">今天，有小伙伴来做客</h1></div><span class="friendship"><Heart :size="15" /> {{ v.points }} <small>友好积分</small></span></header>
    <div class="guest-layout">
      <div class="guest-portrait"><button class="animal-button" :aria-label="`和 ${animal.name} 互动`" @click="greet"><AnimalArt :animal="animal.id" :color="animal.color" :happy="guest.served" /></button><span>{{ animal.label }} · {{ animal.name }}</span><small>第 {{ guest.number }} 次来访 · 免费小伙伴</small></div>
      <div class="guest-story"><span class="guest-label">{{ guest.served ? '吃饱了，还想陪你坐一会儿' : '小伙伴的英语请求' }}</span><p class="guest-request" lang="en">{{ guest.served ? 'Thank you! You are so kind.' : request }}</p><button class="visitor-text-button" aria-label="朗读动物请求" @click="speak(guest.served ? 'Thank you! You are so kind.' : request)"><Volume2 :size="15" /> 听它说</button><details class="animal-preferences"><summary>它喜欢什么？看看备餐建议</summary><p>{{ animal.hint }}</p><span>今天需要：{{ petRecipes[animal.id].meanings[guest.wants] }}</span><a :href="animal.source" target="_blank" rel="noopener noreferrer">饲养内容参考：RSPCA ↗</a></details><button v-if="guest.served && guest.secret === 'locked'" class="visitor-secondary" @click="greet"><Sparkles :size="15" /> 它似乎还有话想说…</button><span v-if="guest.secret === 'done'" class="secret-finished">✓ 隐藏委托完成 · 谢谢你的清水</span></div>
    </div>
    <section v-if="guest.secret === 'found'" class="hidden-quest" aria-label="隐藏添水任务"><div><span>✦ 发现隐藏委托</span><h2 lang="en">A bowl of water, please.</h2><button class="visitor-text-button" aria-label="朗读隐藏委托" @click="speak('A bowl of water, please.')"><Volume2 :size="15" /> 听一听</button></div><div class="drink-choices"><button v-for="food in ['water', 'milk'] as const" :key="food" :aria-label="`给动物 ${food}`" @click="giveWater(food)"><PicnicArt :food="food" /><small lang="en">{{ food }}</small></button></div></section>
    <div class="pet-prep-heading"><div><h2>小伙伴备餐台</h2><small>合并表示份量、装盘与打包升级</small></div><label>合成路线<select v-model="route" aria-label="动物合成路线" @change="selected = null"><option v-for="pet in animals" :key="pet.id" :value="pet.id">{{ petRecipes[pet.id].name }}</option><option v-if="v.careUnlocked" value="care">温柔照料 · 隐藏路线</option></select></label></div>
    <div class="pet-recipe" aria-label="动物小食合成路线"><template v-for="level in 3" :key="level"><ArrowRight v-if="level > 1" :size="16" /><div :class="{ locked: level - 1 > maxLevel }"><PetFoodArt :route="route" :level="level - 1" :color="recipe.color" /><b lang="en">{{ recipe.words[level - 1] }}</b><small>{{ level - 1 > maxLevel ? '招待后展开新路线' : recipe.meanings[level - 1] }}</small></div></template></div>
    <div class="pet-toolbar"><button class="visitor-primary" :aria-label="`领取 ${recipe.words[0]}`" @click="collect"><Plus :size="16" /> 免费领取 {{ recipe.words[0] }}</button><button class="visitor-text-button" :disabled="selected === null" @click="v.board[selected!] = null; selected = null; message = '已退回选中物品，免费补给随时可领。'">退回选中</button></div>
    <div class="pet-board" aria-label="动物食物合成棋盘"><button v-for="(tile, index) in v.board" :key="index" :data-pet-slot="index" :aria-label="`动物备餐格 ${index + 1}${tile ? ' ' + petRecipes[tile.route].words[tile.level] : ' 空'}`" :aria-pressed="selected === index" :class="{ selected: selected === index, terminal: tile && (tile.level === 2 || tile.level === 1 && tile.route !== 'care' && !v.upgraded.includes(tile.route)) }" @click="select(index)"><template v-if="tile"><span class="pet-tile-level">{{ tile.level + 1 }}</span><PetFoodArt :route="tile.route" :level="tile.level" :color="petRecipes[tile.route].color" /><small lang="en">{{ petRecipes[tile.route].words[tile.level] }}</small></template><span v-else class="pet-empty">+</span></button></div>
    <div class="pet-delivery"><span>{{ guest.served ? '餐点已送达，点点小伙伴，也许有惊喜。' : '先点选备好的餐点，再招待小伙伴。' }}</span><button class="visitor-primary" :disabled="!canFeed" @click="serve">{{ guest.served ? '已经招待过啦' : `招待 ${animal.name}` }} <ArrowRight :size="15" /></button></div>
    <p class="visitor-message" role="status" aria-live="polite">{{ message }}</p>
    <details class="guest-notebook" :open="expanded" @toggle="expanded = ($event.target as HTMLDetailsElement).open"><summary>来访簿 · 认识了 {{ v.met.length }} 位小伙伴</summary><div class="met-animals"><span v-for="pet in animals" :key="pet.id" :class="{ unmet: !v.met.includes(pet.id) }"><AnimalArt :animal="pet.id" :color="pet.color" /><b>{{ v.met.includes(pet.id) ? pet.name : '等待来访' }}</b></span></div><p>每次重新打开游戏都会换一位来访者；已经准备的餐点、积分与解锁路线会保留。每种动物每天留下 1 份餐点谢礼和 1 份隐藏委托谢礼，陪伴与合成不设次数限制。</p></details>
  </section>
</template>

<style scoped src="@/styles/visitor-cafe.css"></style>
