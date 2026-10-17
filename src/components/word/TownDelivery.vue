<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GameState } from '@/features/wordMerge/game'
import { actDelivery, currentDeliveryCommand, currentDeliveryMap, currentDeliveryRoute, deliveryMaps, deliveryRoutes, nextDeliveryRound } from '@/features/wordMerge/delivery'
import { changeActivityMode, toggleActivityHint, type ActivityMode } from '@/features/wordMerge/activity'
import ActivityPrompt from './ActivityPrompt.vue'
import '@/styles/town-delivery.css'
const props=defineProps<{game:GameState}>()
const d=computed(()=>props.game.delivery)
const command=computed(()=>currentDeliveryCommand(d.value))
const map=computed(()=>currentDeliveryMap(d.value))
const route=computed(()=>currentDeliveryRoute(d.value))
const cells=Array.from({length:25},(_,i)=>({x:i%5,y:Math.floor(i/5)}))
const controls=[{id:'north',arrow:'↑',name:'向上移动'},{id:'west',arrow:'←',name:'向左移动'},{id:'south',arrow:'↓',name:'向下移动'},{id:'east',arrow:'→',name:'向右移动'}]
const status=ref('先领取包裹，再跟随英语指路。地图始终上北下南。走错也可以再试。')
const marker=(x:number,y:number)=>map.value.landmarks.find(l=>l.x===x&&l.y===y)
const blocked=(x:number,y:number)=>map.value.obstacles.some(v=>v[0]===x&&v[1]===y)
function act(action:string) {
  const result=actDelivery(props.game,action)
  status.value=result.completed ? '包裹送到啦！收下一枚小镇邮戳，+20 星币 · +12 成长。' : result.ok ? '这一步完成了，听听下一句，再继续走。' : d.value.delivered ? '这次配送已经完成，接下一份包裹吧。' : '先留在这里，再听听或读读这一步。包裹和星币都还在。'
}
function mode(value:ActivityMode) { if(changeActivityMode(d.value,value)) status.value='难度已切换，这次配送记作提示后完成。下一次按新难度开始。' }
function next() {if(nextDeliveryRound(d.value)) status.value='新的包裹准备好了！去探索小镇的另一条路线。'}
</script>
<template>
  <section class="town-delivery" aria-label="小镇送货员游戏">
    <header class="delivery-heading"><div><span class="delivery-eyebrow">A PARCEL. A PATH. A LITTLE HELLO.</span><h1>小镇送货员</h1><p>背上包裹，穿过街角、河畔与山丘，收集每个地方的问候。</p></div><span class="delivery-round">配送 {{ d.round }}<small>{{ d.stamps.length }} / {{ deliveryRoutes.length }} 枚邮戳</small></span></header>
    <ActivityPrompt :mode="d.mode" :command="command.english" :translation="command.chinese" :hint-open="d.hintOpen" title="POST OFFICE · 今日路线" @mode="mode" @hint="toggleActivityHint(d)"><template #hint><span class="delivery-hint-arrow" aria-hidden="true">{{ ({north:'↑',east:'→',south:'↓',west:'←',pickup:'□',deliver:'✓'} as Record<string,string>)[command.action || 'deliver'] }}</span></template></ActivityPrompt>
    <div class="delivery-play">
      <div class="delivery-map-wrap"><div class="delivery-map-caption"><span>{{ map.english }}</span><span>↑ N · 北</span></div><div class="delivery-map" :class="`terrain-${map.terrain}`" :data-delivery-map="map.id" :aria-label="`${map.name}地图，始终上北下南`">
        <div v-for="cell in cells" :key="`${cell.x}-${cell.y}`" class="delivery-cell" :class="{'is-garden':blocked(cell.x,cell.y),'has-landmark':marker(cell.x,cell.y)}">
          <svg v-if="blocked(cell.x,cell.y)" viewBox="0 0 64 64" aria-hidden="true"><g v-if="map.terrain==='water'" fill="none" stroke="#8aafa9" stroke-width="3"><path d="M5 22Q14 14 23 22T41 22T59 22M5 35Q14 27 23 35T41 35T59 35M5 48Q14 40 23 48T41 48T59 48"/></g><g v-else-if="map.terrain==='hill'"><path d="M4 50L23 11L40 50Z" fill="#a1b28b"/><path d="M24 50L43 20L61 50Z" fill="#7f9c7e"/><path d="M17 24L23 11L29 24L23 21Z" fill="#e7ebd9"/></g><g v-else><path d="M31 47V59" stroke="#8b7453" stroke-width="4"/><path d="M31 7L11 36H20L8 48H54L42 36H51Z" fill="#96ae81" stroke="#78946b" stroke-width="1.5"/></g></svg>
          <template v-else-if="marker(cell.x,cell.y)"><svg viewBox="0 0 64 64" aria-hidden="true">
            <g v-if="['park','garden','meadow'].includes(marker(cell.x,cell.y)?.kind||'')" stroke="#78946b" stroke-width="2"><path d="M20 44V58M44 39V58"/><circle cx="20" cy="28" r="17" fill="#a9be8e"/><circle cx="44" cy="26" r="14" fill="#88a47a"/><path d="M20 29V44M44 27V40"/></g>
            <g v-else-if="marker(cell.x,cell.y)?.kind==='fountain'" stroke="#7b9a9d" stroke-width="2"><ellipse cx="32" cy="49" rx="27" ry="10" fill="#bbd5cf"/><path d="M32 46V17M15 31Q14 12 32 24Q50 12 49 31" fill="none"/><path d="M25 37H39L44 48H20Z" fill="#e2e1ce"/></g>
            <g v-else-if="marker(cell.x,cell.y)?.kind==='bridge'" stroke="#8e795e" stroke-width="2" fill="none"><path d="M3 49Q12 42 21 49T39 49T60 49" stroke="#93b8b3"/><path d="M5 44Q32 10 59 44L59 51Q32 22 5 51Z" fill="#dec19b"/><path d="M11 37V24M24 25V15M40 25V15M53 37V24M9 24Q32 2 55 24"/></g>
            <g v-else-if="marker(cell.x,cell.y)?.kind==='harbor'" stroke="#7b9a9d" stroke-width="2" fill="none"><path d="M5 52Q13 45 21 52T38 52T59 52"/><path d="M11 36H53L43 49H22Z" fill="#be9670"/><path d="M31 35V6L49 29H32Z" fill="#f8edce"/><path d="M28 10L12 31H28Z" fill="#aac3be"/></g>
            <g v-else-if="marker(cell.x,cell.y)?.kind==='lookout'" stroke="#8e795e" stroke-width="2" fill="#dec7a0"><path d="M18 57L23 17H41L46 57M14 17L32 5L50 17ZM24 28H40M22 40H42M19 53H45M26 57L38 17M38 57L26 17"/></g>
            <g v-else-if="marker(cell.x,cell.y)?.kind==='station'" stroke="#7d8a7c" stroke-width="2"><rect x="16" y="9" width="34" height="42" rx="8" fill="#b3c7b2"/><rect x="21" y="17" width="24" height="16" rx="3" fill="#eaf0dc"/><circle cx="23" cy="42" r="3" fill="#f0d78f"/><circle cx="42" cy="42" r="3" fill="#f0d78f"/><path d="M21 52L16 59M43 52L49 59M14 59H51"/></g>
            <g v-else stroke="#8e795e" stroke-width="2" stroke-linejoin="round"><path d="M10 27L32 10L54 27" :fill="marker(cell.x,cell.y)?.kind==='depot'?'#c08c74':'#a5ad85'"/><path d="M14 27H50V57H14Z" fill="#f5e3bc"/><path d="M27 41H38V57" fill="#ae8d67"/><path d="M19 32H25V39H19ZM40 32H46V39H40Z" fill="#c5d7ce"/><path v-if="marker(cell.x,cell.y)?.kind==='depot'" d="M24 23H40V34H24ZM24 23L32 29L40 23" fill="#faf1d7"/></g>
          </svg><span>{{ marker(cell.x,cell.y)?.word }}</span></template>
        </div>
        <div class="delivery-courier" :style="{left:`${(d.x+.5)*20}%`,top:`${(d.y+.5)*20}%`}" :class="{'is-delivered':d.delivered}" aria-label="你的位置"><svg viewBox="0 0 72 82" aria-hidden="true"><ellipse cx="36" cy="73" rx="22" ry="6" fill="#6e6559" opacity=".16"/><path d="M27 53L24 70M44 53L48 70" stroke="#6c7461" stroke-width="8" stroke-linecap="round"/><path d="M20 54Q16 31 36 31Q56 31 53 54Z" fill="#b98b68" stroke="#735d47" stroke-width="2"/><circle cx="36" cy="24" r="13" fill="#f3d4af" stroke="#735d47" stroke-width="2"/><path d="M21 20Q20 6 36 7Q52 7 51 20Z" fill="#7d9978" stroke="#627e60" stroke-width="2"/><path d="M21 20H56" stroke="#627e60" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="24" r="1.3" fill="#735d47"/><circle cx="41" cy="24" r="1.3" fill="#735d47"/><path d="M33 30Q37 33 40 29" stroke="#9a6d53" fill="none"/><g v-if="d.parcel"><path d="M34 40H62V63H34Z" fill="#e8c28d" stroke="#8a6949" stroke-width="2"/><path d="M46 41V62M34 48H62" stroke="#bc9066" stroke-width="3"/></g></svg></div>
      </div><div class="delivery-route-meta"><span>{{ map.name }}</span><span>{{ Math.min(d.step,route.directions.length+2) }} / {{ route.directions.length+2 }} 步</span></div></div>
      <div class="delivery-actions"><div class="delivery-action-label"><span>YOUR NEXT LITTLE STEP</span><small>地图上方是北方</small></div><div class="delivery-direction-pad"><button v-for="control in controls" :key="control.id" :class="`direction-${control.id}`" :aria-label="control.name" :data-delivery-action="control.id" :disabled="d.delivered" @click="act(control.id)">{{ control.arrow }}</button><span class="delivery-pad-center" aria-hidden="true">N</span></div><div v-if="!d.delivered" class="delivery-package-actions"><button data-delivery-action="pickup" @click="act('pickup')">领取包裹</button><button data-delivery-action="deliver" @click="act('deliver')">交付包裹</button></div><div v-else class="delivery-receipt"><strong>一份问候，顺利送达。</strong><p>+20 星币 · +12 成长</p><button @click="next">接下一份包裹 →</button></div></div>
    </div>
    <p class="delivery-status" role="status">{{ status }}</p>
    <details class="delivery-passport"><summary>小镇邮戳册 <span>{{ d.stamps.length }} / {{ deliveryRoutes.length }} · 三个街区</span></summary><div v-for="area in deliveryMaps" :key="area.id" class="delivery-stamp-area"><h2>{{ area.name }}</h2><div class="delivery-stamps" :aria-label="`${area.name}邮戳收藏`"><span v-for="place in deliveryRoutes.filter(item=>item.map===area.id)" :key="place.id" :class="{collected:d.stamps.includes(place.id)}"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/><path d="M11 17L20 10L29 17V29H11ZM17 29V21H23V29" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>{{ place.name }}<small>{{ d.stamps.includes(place.id)?'已送达':'等待拜访' }}</small></span></div></div></details>
    <p class="delivery-record">独立完成 {{ d.independent }} 次 · 提示后完成 {{ d.assisted }} 次</p>
  </section>
</template>
