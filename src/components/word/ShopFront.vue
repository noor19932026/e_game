<script setup lang="ts">
import { computed } from 'vue'
import AnimalArt from './AnimalArt.vue'
import { animals, type AnimalId } from '@/features/wordMerge/visitors'
import type { JourneyState } from '@/features/wordMerge/journey'
import { decorations } from '@/features/wordMerge/journey'
import WordMergeArt from './WordMergeArt.vue'
import { wordById } from '@/features/wordMerge/catalog'

const props = defineProps<{ journey: JourneyState; visitor?: AnimalId }>()
const guest = computed(() => animals.find(a => a.id === props.visitor))
const awning = computed(() => decorations.find(d => d.id === props.journey.equipped.awning))
</script>

<template>
  <section class="shop-preview" aria-label="我的小店实时预览" :style="{ '--awning-color': awning?.color || '#b79a73' }">
    <div class="preview-caption"><span>我的小店</span><small>购买后立即展示在这里</small></div>
    <div class="storefront" role="img" :aria-label="`小店外观，${awning?.name || '原木色默认雨棚'}${journey.equipped.sign ? '，野餐小馆招牌' : ''}${journey.equipped.plant ? '，窗边小花盆' : ''}`">
      <div class="shop-sign">{{ journey.equipped.sign ? 'MIA’S PICNIC' : 'WORD & CO.' }}</div>
      <div class="awning"><i v-for="n in 7" :key="n" /></div>
      <div class="store-interior"><div class="store-window"><span>coffee & kindness</span><WordMergeArt :word="wordById['coffee-4']!" /></div><div class="store-door"><span>OPEN</span><i /></div></div>
      <div class="store-step" /><div class="store-plant"><WordMergeArt :word="wordById[journey.equipped.plant ? 'garden-3' : 'garden-2']!" /></div>
      <div v-if="guest" class="store-guest"><AnimalArt :animal="guest.id" :color="guest.color" /></div>
    </div>
    <p class="equipped-label"><span :style="{ background: awning?.color || '#b79a73' }" />{{ awning?.name || '原木色默认雨棚' }}</p>
  </section>
</template>

<style scoped>
.shop-preview { background:#edf0df; border:1px solid #dce0ca; border-radius:14px; padding:22px 16px; text-align:center; }
.preview-caption>span { display:block; color:#496653; font-size:15px; font-weight:bold; }
.preview-caption small { display:block; color:#898974; margin:7px 0 22px; font-size:11px; }
.store-guest { position:absolute; width:77px; height:77px; bottom:0; right:-23px; z-index:2; }
.storefront { width:220px; position:relative; margin:0 auto; padding-bottom:15px; }
.shop-sign { padding:11px 0; margin:0 9px; border:3px solid #a88662; border-bottom:0; border-radius:13px 13px 0 0; background:#f5ead3; font:bold 15px Georgia,serif; letter-spacing:3px; color:#70533e; }
.awning { display:flex; height:33px; position:relative; z-index:1; filter:drop-shadow(0 3px 1px #56402d28); }
.awning i { flex:1; background:var(--awning-color); border-radius:0 0 9px 9px; border-top:2px solid #705b43; }
.awning i:nth-child(even) { background:#f6efd8; }
.store-interior { margin:-8px 10px 0; padding:22px 13px 13px; background:#e3bf93; border:3px solid #a88662; display:flex; gap:12px; }
.store-window { width:103px; height:109px; background:#f7e8cb; border:5px solid #9b7955; border-radius:30px 30px 2px 2px; }
.store-window>span { display:block; font:italic 11px Georgia,serif; padding:14px 8px 0; color:#85674f; }
.store-window svg { width:64px; height:64px; }
.store-door { width:57px; height:109px; border:5px solid #9b7955; background:#9cad8d; position:relative; }
.store-door span { position:absolute; top:24px; left:3px; right:3px; padding:6px 0; background:#f3e8ce; font:9px Georgia,serif; transform:rotate(-8deg); color:#624b36; }
.store-door i { position:absolute; right:3px; top:69px; width:5px; height:5px; border-radius:50%; background:#715337; }
.store-step { height:9px; border-radius:3px; background:#b19370; margin-top:-2px; }
.store-plant { position:absolute; width:69px; height:69px; bottom:7px; left:-20px; }
.equipped-label { display:flex; align-items:center; justify-content:center; gap:6px; font-size:12px; margin:12px 0 0; color:#617050; }
.equipped-label>span { width:9px; height:9px; border-radius:50%; }
@media(max-width:700px) { .shop-preview { padding:15px 12px; }.preview-caption small { margin-bottom:14px; }.store-guest { position:absolute; width:77px; height:77px; bottom:0; right:-23px; z-index:2; }
.storefront { width:200px; }.store-interior { padding:20px 10px 10px; gap:8px; }.store-window { width:96px; height:96px; }.store-door { height:96px; }.shop-sign { font-size:13px; } }
</style>
