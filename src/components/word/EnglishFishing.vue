<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { GameState } from '@/features/wordMerge/game'
import { catchFish, currentFishingTarget, fishingCommand, fishingDescription, fishingSets, nextFishingRound, pondFish, pondFishById, visiblePondFish } from '@/features/wordMerge/fishing'
import { changeActivityMode, toggleActivityHint, type ActivityMode } from '@/features/wordMerge/activity'
import ActivityPrompt from './ActivityPrompt.vue'
import PondFishArt from './PondFishArt.vue'
import '@/styles/english-fishing.css'
const props=defineProps<{game:GameState}>()
const f=computed(()=>props.game.fishing)
const command=computed(()=>fishingCommand(f.value))
const target=computed(()=>currentFishingTarget(f.value))
const reveal=computed(()=>f.value.mode==='guide'||f.value.hintOpen)
const status=ref('观察颜色、大小和花纹。点一条小鱼下钩，每次认识三位池塘朋友。')
const cast=ref(''),castKey=ref(0)
let timer:ReturnType<typeof setTimeout>|undefined
onBeforeUnmount(()=>clearTimeout(timer))
// Every choice is pictured; the target is never highlighted before a catch.
const swimming=computed(()=>visiblePondFish(f.value))
function catchOne(id:string) {
  const result=catchFish(props.game,id)
  if(f.value.completed&&!result.ok) return
  cast.value=id;castKey.value++;clearTimeout(timer);timer=setTimeout(()=>cast.value='',950)
  status.value=result.completed?'三位池塘朋友都认识啦！已放回池塘，+20 星币 · +12 成长。':result.ok?'钓到啦，图鉴留下了它的样子。再听听下一位朋友的特征。':'这位朋友先游回去。再听一遍，看看颜色、大小或花纹，随时可以重试。'
}
function mode(value:ActivityMode) {if(changeActivityMode(f.value,value)) status.value='难度已切换，这轮记作提示后完成。下一轮按新难度开始。'}
function next() {if(nextFishingRound(f.value)) {cast.value='';status.value='小鱼重新游回了池塘。下一轮，留意英语里的颜色、大小和花纹。'}}
</script>
<template>
  <section class="english-fishing" aria-label="英语钓鱼游戏">
    <header class="fishing-heading"><div><span class="fishing-eyebrow">SLOW WATER. SHINY LITTLE DISCOVERIES.</span><h1>英语钓鱼</h1><p>十种颜色、大小与花纹，{{ fishingSets.length }} 组观察慢慢发现。每轮只有九位朋友。</p></div><span class="fishing-round">池塘观察 {{ f.round }}<small>本轮 {{ f.caught.length }} / 3</small></span></header>
    <ActivityPrompt :mode="f.mode" :command="command.english" :translation="command.chinese" :hint-open="f.hintOpen" title="POND NOTES · 池塘观察手记" @mode="mode" @hint="toggleActivityHint(f)"><template #hint><PondFishArt v-if="target" :fish="target" /></template></ActivityPrompt>
    <div class="fishing-pond" :class="{'is-complete':f.completed}" aria-label="九条不同颜色、大小与花纹的小鱼">
      <div class="fishing-shore" aria-hidden="true"><svg viewBox="0 0 700 75" preserveAspectRatio="none"><path d="M0 0H700V25Q610 47 511 29Q430 20 352 42Q265 55 175 29Q90 4 0 34Z" fill="#c7cfaa"/><path d="M0 5Q125 34 217 18Q362 4 455 27Q570 45 700 15" stroke="#a8b78d" fill="none" stroke-width="2"/><path d="M589 31L578 5M594 34L603 5M601 35L614 18M80 21L76 2M87 22L93 0" stroke="#8da073" stroke-width="3" stroke-linecap="round"/></svg><span>Catch, learn &amp; release.</span></div>
      <div class="fishing-water-lines" aria-hidden="true"><i/><i/><i/><i/><i/></div>
      <div class="fishing-fish-grid"><button v-for="(fish,i) in swimming" :key="fish.id" class="fishing-choice" :class="[`fish-size-${fish.size}`,{'is-caught':f.caught.includes(fish.id),'is-casting':cast===fish.id}]" :style="{'--swim-delay':`${-i*1.17}s`,'--swim-duration':`${4.5+i%3}s`}" :data-fish="fish.id" :aria-label="reveal ? `${fishingDescription(f,fish).chinese}，点击下钩` : `池塘里的第 ${i+1} 条小鱼，点击下钩`" :disabled="f.completed||f.caught.includes(fish.id)" @click="catchOne(fish.id)"><PondFishArt :fish="fish" /><span v-if="reveal">{{ fishingDescription(f,fish).english }}</span><span v-if="f.caught.includes(fish.id)" class="fishing-observed" aria-label="已经观察">✓</span></button></div>
      <div v-if="cast" :key="castKey" class="fishing-cast" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M51 0Q36 36 50 68" stroke="#fbf1d9" stroke-width="1.5" fill="none"/><ellipse cx="50" cy="74" rx="15" ry="5" fill="none" stroke="#eff6de" stroke-width="2"/><ellipse cx="50" cy="74" rx="24" ry="8" fill="none" stroke="#eff6de" stroke-width="1" opacity=".5"/><path d="M45 63A5 5 0 0 1 55 63V72H45Z" fill="#d79e7a"/><path d="M45 68H55V73H45Z" fill="#fff5d8"/></svg></div>
    </div>
    <div class="fishing-basket" aria-label="本轮观察记录"><span>观察记录</span><div v-for="n in 3" :key="n" class="fishing-note" :class="{'has-fish':f.caught[n-1]}"><PondFishArt v-if="f.caught[n-1]" :fish="pondFishById[f.caught[n-1]!]!" /><span v-else>{{ n }}</span></div><button v-if="f.completed" @click="next">再去钓一轮 →</button><small v-else>点小鱼即可下钩</small></div>
    <p class="fishing-status" role="status">{{ status }}</p>
    <details class="fishing-collection" aria-label="池塘朋友图鉴"><summary>波光里的朋友 <span>{{ f.collection.length }} / {{ pondFish.length }} · 展开图鉴</span></summary><div class="fishing-collection-grid"><div v-for="fish in pondFish" :key="fish.id" :class="{'is-known':f.collection.includes(fish.id)}"><PondFishArt :fish="fish" /><span>{{ f.collection.includes(fish.id)?'已认识':'未观察' }}</span></div></div></details>
    <p class="fishing-record">独立完成 {{ f.independent }} 轮 · 提示后完成 {{ f.assisted }} 轮 · 小鱼每轮都会回到池塘</p>
  </section>
</template>
