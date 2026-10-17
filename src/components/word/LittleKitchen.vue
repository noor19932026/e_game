<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ArrowRight, Check, ChefHat, Sparkles, Volume2 } from 'lucide-vue-next'
import type { GameState } from '@/features/wordMerge/game'
import { actKitchen, currentKitchenStep, currentRecipe, kitchenChoices, kitchenModes, kitchenRecipes, nextKitchenRound, setKitchenMode, toggleKitchenHint, type KitchenMode } from '@/features/wordMerge/kitchen'
import { productById } from '@/features/wordMerge/stores'
import StoreProductArt from './StoreProductArt.vue'
import KitchenArt from './KitchenArt.vue'
import KitchenDish from './KitchenDish.vue'

const props = defineProps<{game:GameState}>()
const k = computed(() => props.game.kitchen)
const recipe = computed(() => currentRecipe(k.value))
const step = computed(() => currentKitchenStep(k.value))
const reveal = computed(() => k.value.mode === 'guide' || k.value.hintOpen)
const showText = computed(() => k.value.mode !== 'listening' || k.value.hintOpen)
const message = ref('跟着一句英语做一步。点食材或工具，让餐点慢慢变出来。')
const animation = ref(0)
const ingredients = computed(() => kitchenChoices(k.value).filter(a => a.product || a.id === 'egg'))
const tools = computed(() => kitchenChoices(k.value).filter(a => !a.product && a.id !== 'egg'))
function stopSpeech() { if ('speechSynthesis' in window) window.speechSynthesis.cancel() }
onBeforeUnmount(stopSpeech)
function speak() {
  const text = step.value?.english || 'Thank you! That was delicious.'
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') { message.value = '此浏览器暂不支持朗读。可以主动查看图文提示，或切换阅读下厨。'; return }
  stopSpeech()
  const voice = new SpeechSynthesisUtterance(text); voice.lang = 'en-GB'; voice.rate = .82
  voice.onerror = e => { if (!['canceled','interrupted'].includes(e.error)) message.value = '朗读暂时不可用。可以主动查看图文提示，或切换阅读下厨。' }
  window.speechSynthesis.speak(voice)
}
function mode(id:KitchenMode) {
  if (setKitchenMode(k.value,id)) { stopSpeech(); message.value = '难度已切换，本份餐点记作提示后完成；下一份按所选难度开始。' }
}
function act(id:string) {
  const result = actKitchen(props.game,id)
  if (!result.ok) { message.value = k.value.served ? '餐点已经送达。接下一单，再继续下厨吧。' : '再听听或读读这一步。食材还在，可以再试一次。'; return }
  stopSpeech(); animation.value++
  message.value = result.served ? `${recipe.value.customer}：Thank you! 餐点送到桌上啦，+20 星币 · +12 成长。` : '这一步完成啦！看看下一句，再继续动手。'
}
function next() {
  if (nextKitchenRound(k.value)) { stopSpeech(); animation.value++; message.value = '新顾客入座了！读一句、做一步，做出今天的另一道餐点。' }
}
</script>

<template>
  <section class="little-kitchen" aria-label="小小厨房游戏">
    <header class="kitchen-heading"><div><span class="kitchen-eyebrow">ONE LITTLE STEP. ONE LOVELY MEAL.</span><h1>小小厨房</h1><p>听懂一句，动手一步。把你做的餐点端上桌。</p></div><span class="kitchen-badge"><ChefHat :size="27" /> LITTLE KITCHEN</span></header>
    <nav class="kitchen-modes" aria-label="厨房难度"><button v-for="choice in kitchenModes" :key="choice.id" :aria-pressed="k.mode === choice.id" @click="mode(choice.id)">{{ choice.name }}</button></nav>
    <p class="kitchen-mode-note">{{ kitchenModes.find(m => m.id === k.mode)!.description }}</p>
        <div v-if="!k.served" class="kitchen-command">
          <span class="kitchen-command-label">{{ recipe.customer }} 的制作小纸条</span>
          <p v-if="showText" class="kitchen-english" lang="en">{{ step?.english }}</p>
          <p v-else class="kitchen-audio-only"><Volume2 :size="24" /> 听听这一步怎么做</p>
          <div class="kitchen-command-controls"><button class="kitchen-hear" aria-label="朗读厨房指令" @click="speak"><Volume2 :size="17" /> 听这一步</button><button class="kitchen-help" :aria-pressed="k.hintOpen" @click="toggleKitchenHint(k)">{{ k.hintOpen ? '收起图文提示' : '查看图文提示' }}</button></div>
          <div v-if="reveal && step" class="kitchen-step-hint"><StoreProductArt v-if="productById[step.action] && step.action !== 'egg'" :product="productById[step.action]!" /><KitchenArt v-else :kind="step.action" /><span>{{ step.chinese }}</span></div>
        </div>
    <p class="kitchen-recipe-name"><b lang="en">{{ recipe.english }}</b><span>12 道小镇菜谱 · 已完成 {{ k.completed.length }} 道</span></p>
    <div class="kitchen-layout">
      <section class="kitchen-counter" aria-label="厨房操作台">
        <header class="kitchen-counter-heading"><span class="kitchen-eyebrow">ORDER {{ String(k.round).padStart(2,'0') }}</span><span>第 {{ Math.min(k.step+1,recipe.steps.length) }} / {{ recipe.steps.length }} 步</span></header>
        <div class="kitchen-step-dots" aria-label="制作进度"><span v-for="(_,i) in recipe.steps" :key="i" :class="{done:i<k.step,current:i===k.step}"><Check v-if="i<k.step" :size="10" /></span></div>
        <div :key="`${k.round}-${animation}`" class="kitchen-dish-stage" :class="{'dish-delivered':k.served}">
          <KitchenDish :recipe="recipe" :stage="k.served ? 0 : k.step" />
          <span>{{ k.served ? '餐点已送到顾客桌上' : k.step ? '你的餐点正在慢慢完成' : '盘子准备好了，开始吧' }}</span>
        </div>
        <p class="kitchen-feedback" role="status" aria-live="polite">{{ message }}</p>
      </section>
      <section class="kitchen-table" aria-label="顾客餐桌" :class="{'table-happy':k.served}">
        <div class="kitchen-window"><span></span><span></span><span></span></div>
        <div class="kitchen-guest"><span class="kitchen-guest-hair"></span><span class="kitchen-guest-face"><i></i><i></i><b :class="{'guest-smile':k.served}"></b></span><span class="kitchen-guest-shirt"></span></div>
        <div class="kitchen-tabletop"><KitchenDish v-if="k.served" class="kitchen-served-dish" :recipe="recipe" :stage="recipe.steps.length" /><span v-else class="kitchen-empty-table">{{ recipe.customer }} 在等你的餐点</span></div>
        <div class="kitchen-guest-speech"><b>{{ recipe.customer }}</b><p lang="en">{{ k.served ? 'Thank you! That was delicious.' : 'Hello, chef!' }}</p></div>
        <div v-if="k.served" class="kitchen-receipt"><Sparkles :size="19" /><strong>{{ recipe.name }}，送达！</strong><span>{{ k.helped ? '这次使用了提示，继续练习就好。' : '这次没有打开额外提示。' }}</span><button @click="next">接下一单 <ArrowRight :size="16" /></button></div>
      </section>
    </div>
    <section v-if="!k.served" class="kitchen-pantry" aria-label="食材与工具">
      <header><h2>食材架</h2><span>水果已洗净切块，鸡蛋已煮熟 · 点一下使用</span></header>
      <div class="kitchen-ingredients"><button v-for="item in ingredients" :key="item.id" :data-kitchen-action="item.id" :aria-label="`使用 ${item.word}`" @click="act(item.id)"><StoreProductArt v-if="item.product" :product="productById[item.product]!" /><KitchenArt v-else :kind="item.id" /><span v-if="reveal" lang="en">{{ item.word }}</span><small v-if="reveal">{{ item.name }}</small></button></div>
      <header class="kitchen-tools-heading"><h2>操作工具</h2><span>看懂动作，再选择工具</span></header>
      <div class="kitchen-tools"><button v-for="item in tools" :key="item.id" :data-kitchen-action="item.id" :aria-label="`操作 ${item.word}`" @click="act(item.id)"><KitchenArt :kind="item.id" /><span v-if="reveal" lang="en">{{ item.word }}</span><small v-if="reveal">{{ item.name }}</small></button><button class="kitchen-serve" data-kitchen-action="serve" aria-label="端给顾客" @click="act('serve')"><KitchenArt kind="serve" /><span>端给顾客</span></button></div>
    </section>
    <details class="kitchen-collection" aria-label="菜谱收藏"><summary>我的拿手菜 · {{ k.completed.length }} / {{ kitchenRecipes.length }} 道已做过</summary><div><span v-for="r in kitchenRecipes" :key="r.id" :class="{'recipe-collected':k.completed.includes(r.id)}"><Check v-if="k.completed.includes(r.id)" :size="13" />{{ k.completed.includes(r.id) ? r.name : '待发现菜谱' }}</span></div></details>
    <p class="kitchen-learning-note">累计：未打开额外提示完成 {{ k.independent }} 份 · 提示后完成 {{ k.assisted }} 份。图文入门和中途切换难度按提示后记录；做过一道菜不代表已记住单词。</p>
  </section>
</template>

<style scoped src="@/styles/little-kitchen.css"></style>
