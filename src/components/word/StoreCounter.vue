<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowRight, Check, ShoppingBasket, Volume2, Undo2, Sparkles } from 'lucide-vue-next'
import type { GameState } from '@/features/wordMerge/game'
import { storeList, storeOrders, productById, TRAY_SIZE, STORE_MODE_KEY, storeRequestModes, takeProduct, returnProduct, canServe, serveStore, nextStoreRound, inTray, type StoreId, type StoreRequestMode } from '@/features/wordMerge/stores'
import StoreProductArt from './StoreProductArt.vue'

const props = defineProps<{ game:GameState }>()
const store = computed(() => storeList.find(s => s.id === props.game.stores.selected)!)
const session = computed(() => props.game.stores.sessions[store.value.id])
const orders = computed(() => storeOrders(store.value.id,session.value.round,session.value.contentFrom))
const served = computed(() => session.value.served.filter(Boolean).length)
const ready = computed(() => orders.value.findIndex((_,i) => canServe(session.value,store.value.id,i)))
const nextOrder = computed(() => orders.value[ready.value >= 0 ? ready.value : session.value.served.findIndex(done => !done)])
const feedback = ref('从商品堆里找货，配齐顾客要的一套，再一起交付。')
const translation = ref(false)
function savedMode(): StoreRequestMode {
  try { const id = localStorage.getItem(STORE_MODE_KEY); return storeRequestModes.find(m => m.id === id)?.id || 'reading' }
  catch { return 'reading' }
}
const mode = ref<StoreRequestMode>(savedMode())
const modeDescription = computed(() => storeRequestModes.find(m => m.id === mode.value)!.description)
const showPictures = computed(() => mode.value === 'guide' || translation.value)
const showRequest = computed(() => mode.value !== 'listening' || translation.value)
watch(mode, id => { try { localStorage.setItem(STORE_MODE_KEY,id) } catch { /* The game still works without saved preferences. */ } })
function changeMode(id:StoreRequestMode) {
  if (id === mode.value) return
  // Existing orders have already been presented in another mode. Do not call this an unassisted attempt.
  session.value.helped = true
  mode.value = id; translation.value = false
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  feedback.value = '已切换玩法。本轮按提示后交付记录，下一轮使用所选难度开始。'
}
function enter(id:StoreId) { props.game.stores.selected = id; translation.value = false; feedback.value = '三位顾客已经到店。看看或听听他们想买什么吧！' }
function pick(id:string,index:number) {
  if (takeProduct(session.value,id,index)) feedback.value = `已放入购物篮。${ready.value >= 0 ? '有一套配齐了，可以交付！' : '购物篮里的商品点一下就能放回。'}`
}
function putBack(index:number) { if (returnProduct(session.value,index)) feedback.value = '已放回商品堆，继续找找吧。' }
function checkout() {
  const index = ready.value
  if (index < 0) return
  const name = orders.value[index]!.name
  const reward = serveStore(props.game,store.value.id,index)
  if (reward) feedback.value = `${name}：Thank you! 整套送达，+${reward} 星币 · +8 成长。`
}
function next() { if (nextStoreRound(props.game.stores,store.value.id)) { translation.value = false; feedback.value = '新一轮开店啦！商品重新混排，顾客带来了新的购物清单。' } }
function toggleHelp() {
  translation.value = !translation.value
  if (translation.value) session.value.helped = true
}
function speak(text:string) {
  if (!('speechSynthesis' in window)) { feedback.value = '此浏览器暂不支持朗读，请打开图文提示，或切换阅读接单。'; return }
  window.speechSynthesis.cancel()
  const voice = new SpeechSynthesisUtterance(text); voice.lang = 'en-GB'; voice.rate = .82
  voice.onerror = event => {
    if (event.error === 'canceled' || event.error === 'interrupted') return
    feedback.value = '朗读暂时不可用，请打开图文提示，或切换阅读接单。'
  }
  window.speechSynthesis.speak(voice)
}
</script>

<template>
  <section class="store-game" :style="{ '--store-color':store.color }" aria-label="开店接客游戏">
    <header class="store-intro"><div><span class="store-eyebrow">FIND IT. PACK IT. MAKE SOMEONE'S DAY.</span><h1>今天，开哪家店？</h1><p>从一堆商品里找对物品，把顾客要的一套交到手里。</p></div><span class="store-sign"><ShoppingBasket :size="28" /> LITTLE SHOPS</span></header>
    <nav class="store-selector" aria-label="店铺选择"><button v-for="shop in storeList" :key="shop.id" :aria-pressed="store.id === shop.id" @click="enter(shop.id)"><StoreProductArt :product="productById[shop.goods[0]!]!" /><span><b>{{ shop.name }}</b><small>{{ shop.english }}</small></span><ArrowRight :size="16" /></button></nav>
    <div class="store-difficulty"><nav aria-label="接单难度"><button v-for="choice in storeRequestModes" :key="choice.id" :aria-pressed="mode === choice.id" @click="changeMode(choice.id)">{{ choice.name }}</button></nav><p>{{ modeDescription }}</p></div>
    <div class="store-round-heading"><div><span class="store-eyebrow">{{ store.english }} · ROUND {{ session.round }}</span><h2>{{ store.tagline }}</h2></div><span class="store-round-count"><b>{{ served }}</b> / 3 位顾客</span></div>
    <div class="store-instructions"><span><b>1</b> {{ mode === 'listening' ? '听需求' : '看需求' }} <i>→</i> <b>2</b> 点商品 <i>→</i> <b>3</b> 成套交付</span><button :aria-pressed="translation" @click="toggleHelp">{{ translation ? '收起图文提示' : '查看图文提示' }}</button></div>
    <div class="store-customers" aria-label="顾客购物清单">
      <article v-for="(order,i) in orders" :key="`${store.id}-${session.round}-${i}`" class="store-customer" :class="{ 'customer-served':session.served[i], 'customer-ready':canServe(session,store.id,i) }">
        <header><span class="store-avatar" :class="`avatar-${i}`">{{ order.name[0] }}</span><div><b>{{ order.name }}</b><small>{{ session.served[i] ? '买到啦，谢谢！' : translation ? order.title : 'Shopping list' }}</small></div><Check v-if="session.served[i]" :size="20" /><button v-else class="store-speak" :aria-label="`听 ${order.name} 的购物需求`" @click="speak(order.request)"><Volume2 :size="18" /></button></header>
        <p v-if="showRequest" lang="en" class="store-request">“{{ order.request }}”</p><p v-else class="store-audio-request"><Volume2 :size="25" /><span>听听 {{ order.name }} 想买什么</span><small>点击右上方喇叭，可重复播放</small></p><p v-if="translation" class="store-translation">{{ order.translation }}</p>
        <div v-if="showRequest" class="store-needs" :class="{ 'text-needs':!showPictures }"><div v-for="need in order.lines" :key="need.product" :data-need="need.product" :data-count="need.count" :class="{ 'need-ready':session.served[i] || inTray(session,need.product) >= need.count }"><StoreProductArt v-if="showPictures" :product="productById[need.product]!" /><span lang="en">{{ productById[need.product]!.word }}<small v-if="translation">{{ productById[need.product]!.meaning }}</small></span><b>{{ session.served[i] ? need.count : Math.min(need.count,inTray(session,need.product)) }}/{{ need.count }}</b></div></div>
        <span class="customer-state">{{ session.served[i] ? '✓ 已交付' : canServe(session,store.id,i) ? '✦ 配齐了，可以交付' : '配齐整套，一起出售' }}</span>
      </article>
    </div>
    <section v-if="served === 3" class="store-receipt" aria-label="本轮经营结算"><Sparkles :size="28" /><div><span class="store-eyebrow">A LOVELY DAY AT THE SHOP</span><h2>三位顾客，都满载而归！</h2><p>今天用英语完成了 {{ orders.reduce((n,o) => n+o.lines.reduce((sum,l) => sum+l.count,0),0) }} 件商品的配套。换一轮，接待新清单吧。</p></div><button @click="next">继续开店 · 第 {{ session.round+1 }} 轮 <ArrowRight :size="16" /></button></section>
    <section v-else class="store-stockroom" aria-label="混排商品堆"><header><div><h2>在这堆商品里，找一找</h2><p>同样的商品会分散出现 · 拿错了随时放回</p></div><span>{{ session.shelf.length }} 件待挑选</span></header>
      <div class="store-pile"><button v-for="(id,index) in session.shelf" :key="`${store.id}-${session.round}-${index}-${id}`" :data-product="id" :aria-label="`拿取 ${productById[id]!.word}`" :disabled="session.tray.length === TRAY_SIZE" :style="{ '--tilt':`${(index*7%5)-2}deg`, '--item-color':productById[id]!.color }" @click="pick(id,index)"><StoreProductArt :product="productById[id]!" /><span v-if="showPictures" lang="en">{{ productById[id]!.word }}</span><small v-if="translation">{{ productById[id]!.meaning }}</small></button></div>
    </section>
    <section class="store-basket" aria-label="配套购物篮"><header><span><ShoppingBasket :size="17" /><b>配套购物篮</b> {{ session.tray.length }} / {{ TRAY_SIZE }}</span><small>{{ session.tray.length === TRAY_SIZE ? '篮子满了：交付一套，或点商品放回' : '点篮子里的商品可放回' }}</small></header><p v-if="nextOrder && showRequest" class="basket-request"><b>{{ nextOrder.name }} 想买：</b><span v-for="need in nextOrder.lines" :key="need.product" lang="en">{{ productById[need.product]!.word }} ×{{ need.count }}</span></p><button v-else-if="nextOrder" class="basket-audio" :aria-label="`重听 ${nextOrder.name} 的购物需求`" @click="speak(nextOrder.request)"><Volume2 :size="15" /> 重听 {{ nextOrder.name }} 的需求</button><div class="store-tray"><template v-for="(_,index) in TRAY_SIZE" :key="index"><button v-if="session.tray[index]" :data-tray="index" :aria-label="`放回 ${productById[session.tray[index]!]!.word}`" @click="putBack(index)"><StoreProductArt :product="productById[session.tray[index]!]!" /><Undo2 :size="10" /></button><span v-else class="store-tray-empty">·</span></template></div><div class="store-checkout"><p role="status" aria-live="polite">{{ feedback }}</p><button :disabled="ready < 0" @click="checkout">{{ ready >= 0 ? `交付给 ${orders[ready]!.name}` : served === 3 ? '本轮已完成' : '配齐一套再交付' }}<ArrowRight :size="16" /></button></div></section>
    <p class="store-learning-note">本店累计：未打开额外提示交付 {{ session.independent }} 单 · 提示后交付 {{ session.assisted }} 单。中途切换难度也按提示后记录；配套记录不代表已经记住单词。星币可在“我的小店”购买装扮。</p>
  </section>
</template>

<style scoped src="@/styles/store-counter.css"></style>
