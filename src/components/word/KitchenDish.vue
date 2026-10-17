<script setup lang="ts">
import { computed } from 'vue'
import type { KitchenRecipe } from '@/features/wordMerge/kitchen'
import KitchenArt from './KitchenArt.vue'
const props=defineProps<{recipe:KitchenRecipe;stage:number}>()
const actions=computed(() => props.recipe.steps.slice(0,props.stage).map(s => s.action))
const has=(id:string) => actions.value.some(a => a===id)
const foods=computed(() => actions.value.filter(a => ['egg','cheese','apple','banana','strawberry','lettuce','tomato','cucumber','orange','pear','lemon'].includes(a)))
function position(index:number) {
  if(props.recipe.vessel==='skewer' && has('skewer')) return `translate(${61+index*43} ${88-index*12})`
  if(props.recipe.vessel==='sandwich' || props.recipe.vessel==='toast') return `translate(${85+(index%2)*45} ${68+Math.floor(index/2)*16})`
  if(props.recipe.vessel==='cup') return `translate(${85+(index%2)*45} ${109-Math.floor(index/2)*24})`
  return `translate(${68+(index%3)*41} ${76+Math.floor(index/3)*30})`
}
</script>
<template>
  <KitchenArt v-if="!recipe.vessel" :kind="recipe.id" :stage="stage" />
  <svg v-else class="kitchen-art" viewBox="0 0 220 150" fill="none" aria-hidden="true" :data-dish="recipe.id" :data-dish-stage="stage">
    <g stroke="#765e45" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="110" cy="135" rx="83" ry="7" fill="#6d6048" opacity=".1" stroke="none"/>
      <template v-if="recipe.vessel==='cup'">
        <path d="M64 38H156L146 125Q110 139 74 125Z" fill="#e1eadb"/><ellipse cx="110" cy="38" rx="46" ry="9" fill="#f8f3e5"/>
        <path v-if="has('pour-milk') || has('pour-water')" d="M69 70Q110 80 151 70L146 125Q110 139 74 125Z" :fill="has('pour-milk') ? '#fff5dc' : '#b7d8d7'" stroke="none"/>
      </template>
      <template v-else-if="recipe.vessel==='bowl'"><path d="M32 81H188Q175 133 110 133Q46 133 32 81Z" fill="#b6c7a5"/><ellipse cx="110" cy="81" rx="78" ry="24" fill="#f5eed8"/></template>
      <template v-else><ellipse cx="110" cy="110" rx="91" ry="25" fill="#e5eadc"/><ellipse cx="110" cy="107" rx="75" ry="15" stroke="#c2cbb4"/></template>
      <g v-if="has('bread')"><path d="M52 81L102 49L168 78L114 115Z" :fill="has('toast') ? '#c59154' : '#d4ad75'"/><path d="M61 80L103 56L157 79L113 105Z" :fill="has('toast') ? '#e3bc77' : '#f3dfb9'"/><path v-if="has('toast')" d="M88 76L124 93M101 67L141 85" stroke="#b18248" stroke-width="3"/></g>
      <path v-if="has('skewer')" d="M36 111L181 57" stroke="#b99567" stroke-width="5"/>
      <g v-for="(food,i) in foods" :key="`${food}-${i}`" :transform="position(i)">
        <g v-if="food==='lettuce'"><path d="M-24 2Q-33-13-18-17Q-7-30 4-16Q22-24 27-8Q37 7 17 15Q0 26-18 16Z" fill="#adc586"/><path d="M-20 4L23 0M-4 1L-10-12M8 1L13 11" stroke="#7f9f68"/></g>
        <g v-else-if="food==='egg'"><ellipse rx="25" ry="15" fill="#fff7de"/><ellipse rx="11" ry="9" fill="#e6bb58"/></g>
        <g v-else-if="food==='cheese'"><path d="M-26-10L20-16L28 12L-19 18Z" fill="#e9cb73"/><circle cx="8" cy="1" r="3" fill="#c5a44d" stroke="none"/></g>
        <g v-else-if="food==='tomato'"><ellipse rx="24" ry="13" fill="#d8856e"/><ellipse rx="16" ry="8" fill="#edba95"/><path d="M-10-3L-6 3M3-5L7 1M12 3L8 7" stroke="#b96e55"/></g>
        <g v-else-if="food==='cucumber'"><ellipse rx="22" ry="13" fill="#84a36f"/><ellipse rx="17" ry="9" fill="#d9e3b4"/><path d="M-7-3L-5 1M3-3L5 1M-1 3L0 6" stroke="#95ad76"/></g>
        <g v-else-if="food==='banana'"><ellipse cx="-7" rx="14" ry="10" fill="#edda96"/><ellipse cx="12" cy="5" rx="14" ry="10" fill="#f3df9f"/><path d="M-7-4L-7 3M9 3L15 6" stroke="#cbb477"/></g>
        <g v-else-if="food==='strawberry'"><path d="M-20-8Q-5-20 11-6L-2 18Z" fill="#d88b88"/><path d="M-18-10L-8-15L-3-9L8-15L11-6L-2-3Z" fill="#8ea676"/><path d="M-10 0L-9 3M1 1L0 5M-4 9L-3 11" stroke="#f1d7aa"/></g>
        <g v-else-if="food==='orange' || food==='lemon'"><path d="M-25-9H24Q19 22-3 19Q-22 18-25-9Z" :fill="food==='orange' ? '#e4b160' : '#e5cf74'"/><path d="M-19-4H18Q13 14-3 13Q-16 13-19-4Z" fill="#f7dfab"/><path d="M-2-3L-2 10M-1-3L10 6M-3-3L-13 6" stroke="#cead67"/></g>
        <g v-else><path d="M-24 0L-5-18L20 2L7 21Z" :fill="food==='apple' ? '#d48e78' : '#bac783'"/><path d="M-19 1L-4-11L13 3L6 14Z" fill="#f3dfb5"/></g>
      </g>
      <path v-if="has('honey')" d="M62 69Q82 54 98 70T137 71T166 81M72 87Q95 73 120 88T152 93" stroke="#d6ad4e" stroke-width="5"/>
      <g v-if="has('cover')"><path d="M51 57L101 26L168 55V67L114 104L51 78Z" fill="#d1a264"/><path d="M51 57L101 26L168 55L114 91Z" fill="#f0dbb0"/></g>
      <g v-if="has('wrap')"><path d="M49 67Q82 101 111 103Q143 92 172 67L152 116Q111 139 69 115Z" fill="#8eaa6e"/><path d="M68 99L104 115M126 106L149 95" stroke="#bdd194" stroke-width="4"/></g>
      <path v-if="has('cut')" d="M105 33L115 105" stroke="#8b6e4e" stroke-width="5"/>
      <g v-if="has('mix')"><path d="M170 24L143 84" stroke="#ad895f" stroke-width="7"/><ellipse cx="141" cy="88" rx="9" ry="13" fill="#cab084" transform="rotate(22 141 88)"/></g>
      <path v-if="has('squeeze')" d="M88 20L84 30M110 17V29M131 22L137 31" stroke="#d9bf67" stroke-width="4"/>
      <path v-if="stage===0" d="M101 73H121M111 63V83" stroke="#b6bba1" stroke-dasharray="3 5"/>
    </g>
  </svg>
</template>
