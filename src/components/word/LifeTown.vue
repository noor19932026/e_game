<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, BookOpen, Volume2, Sparkles } from 'lucide-vue-next'
import { townPlaces, type TownPage } from '@/features/wordMerge/town'
import TownPlaceArt from './TownPlaceArt.vue'
const props=defineProps<{ kitchenDone:number; roomDone:number; storeDone:number; activityDone:Record<string,number> }>()
const emit=defineEmits<{navigate:[destination:TownPage]}>()
const filter=ref('all')
const shown=computed(()=>townPlaces.filter(p=>filter.value==='all'||p.group===filter.value))
const completed=(id:TownPage)=>id==='kitchen'?props.kitchenDone:id==='room'?props.roomDone:id==='stores'?props.storeDone:props.activityDone[id]||0
</script>
<template>
  <section class="life-town" aria-label="生活小镇地图">
    <header class="town-welcome"><div><span class="town-eyebrow">SMALL ADVENTURES, EVERYDAY ENGLISH</span><h1>英语，让小镇动起来。</h1><p>在日常里做点事，也到小镇外面找点新鲜事。</p></div><span class="town-postmark"><Sparkles :size="25" /><span>Welcome<br />to our town</span></span></header>
    <nav class="town-filters" aria-label="小镇玩法分类"><button :aria-pressed="filter==='all'" @click="filter='all'">全部活动 <small>{{townPlaces.length}}</small></button><button :aria-pressed="filter==='life'" @click="filter='life'">生活日常</button><button :aria-pressed="filter==='outdoor'" @click="filter='outdoor'">户外探索</button></nav>
    <div class="town-places"><button v-for="place in shown" :key="place.id" class="town-place" :style="{'--place-color':place.color}" :aria-label="`进入${place.title}`" @click="emit('navigate',place.id)"><div class="town-postcard"><span class="town-card-stamp">{{place.english}}</span><TownPlaceArt :kind="place.id" :color="place.color" /><span class="town-sticker">{{place.verb}}</span></div><div class="town-card-copy"><div class="town-card-heading"><h2>{{place.title}}</h2><span>{{completed(place.id)}} 次完成</span></div><p>{{place.description}}</p><small class="town-content">{{place.content}}</small><small>{{place.lesson}}</small><span class="town-enter">去玩一会儿 <ArrowRight :size="16" /></span></div></button></div>
    <p class="town-learning"><BookOpen :size="15" /><span>每个地方都可以选择图文、阅读或听力。<Volume2 :size="13" /> 听不清就再听一次，需要帮助时随时查看提示。</span></p>
  </section>
</template>
<style scoped>
.life-town { max-width:1000px; margin:auto; padding:4px 0 24px; }
.town-welcome { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:17px 0 22px; }
.town-eyebrow { font-size:9px; letter-spacing:1.5px; color:#9a8b71; }.town-welcome h1 { font-size:30px; margin:12px 0; letter-spacing:.5px; }.town-welcome p { color:#8f7e64; font-size:12px; line-height:1.8; }
.town-postmark { display:flex; gap:10px; align-items:center; padding:17px; border:1px dashed #bfc5a6; border-radius:50%; color:#869878; font:italic 15px/1.4 Georgia,serif; transform:rotate(-8deg); }
.town-filters { display:flex; gap:6px; margin-bottom:17px; }.town-filters button { min-height:44px; padding:9px 14px; background:#f1eee3; border:1px solid #e1dac7; border-radius:20px; color:#958369; font:inherit; font-size:12px; cursor:pointer; }.town-filters button[aria-pressed=true] { background:#e7ecdb; border-color:#a9bc91; color:#6c8554; }.town-filters small { margin-left:5px; color:#9ca17e; }
.town-places { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:17px; }
.town-place { font:inherit; cursor:pointer; transition:border-color .18s,transform .18s; min-width:0; text-align:left; color:inherit; border:1px solid #e1dac7; border-radius:14px; background:#fffcf4; padding:0; overflow:hidden; box-shadow:0 4px 0 #e6dfcf66; }.town-place:hover { border-color:var(--place-color); transform:translateY(-2px); }.town-place:focus-visible,.town-filters button:focus-visible { outline:3px solid #a67c46; outline-offset:3px; }
.town-postcard { position:relative; padding:24px 5px 14px; background:#eeecdf; border-bottom:1px solid #e5ddc8; }.town-postcard>svg { display:block; width:100%; height:145px; }.town-card-stamp { position:absolute; top:12px; left:15px; font:8px Georgia,serif; letter-spacing:1px; color:#928569; }.town-sticker { position:absolute; bottom:9px; right:12px; padding:5px 7px; border-radius:3px; background:#fff9e8; color:var(--place-color); box-shadow:0 2px 3px #7663450c; transform:rotate(-3deg); font-size:10px; }
.town-card-copy { padding:16px; }.town-card-heading { display:flex; gap:5px; justify-content:space-between; align-items:center; }.town-card-heading h2 { font-size:19px; }.town-card-heading>span { color:#a28d69; font-size:9px; white-space:nowrap; }.town-card-copy p { font-size:12px; line-height:1.8; color:#8e806b; margin:10px 0; }.town-content{display:block;margin:0 0 7px;font-weight:600;color:var(--place-color)!important}.town-card-copy small { color:#a59477; font-size:10px; }.town-enter { display:flex; justify-content:space-between; align-items:center; color:var(--place-color); font-size:11px; font-weight:bold; margin-top:15px; }
.town-learning { display:flex; align-items:flex-start; gap:8px; color:#9c8d73; font-size:11px; line-height:1.9; margin:25px 0 0!important; }.town-learning>svg { flex-shrink:0; margin-top:2px; }.town-learning span>svg { vertical-align:middle; }
@media(max-width:760px) {
  .town-welcome { padding:5px 3px 15px; }.town-welcome h1 { font-size:23px; margin:9px 0; }.town-eyebrow { font-size:7px; letter-spacing:.7px; }.town-welcome p { font-size:11px; }.town-postmark { display:none; }.town-filters { gap:5px; margin-bottom:13px; }.town-filters button { font-size:11px; padding:8px 11px; }
  .town-places { grid-template-columns:repeat(2,minmax(0,1fr)); gap:11px; }.town-postcard { padding:20px 2px 12px; }.town-postcard>svg { height:92px; }.town-card-stamp { top:8px; left:9px; font-size:6px; letter-spacing:.1px; }.town-sticker { font-size:8px; padding:3px 4px; bottom:6px; right:8px; }.town-card-copy { padding:10px; }.town-card-heading { flex-wrap:wrap; gap:4px; }.town-card-heading h2 { font-size:16px; }.town-card-heading>span { font-size:8px; }.town-card-copy p { font-size:10px; line-height:1.7; margin:7px 0; min-height:34px; }.town-content{display:block;margin:0 0 7px;font-weight:600;color:var(--place-color)!important}.town-card-copy small { font-size:8px; }.town-enter { font-size:10px; margin-top:10px; }.town-learning { font-size:10px; margin-top:20px!important; }
}
@media(prefers-reduced-motion:reduce) { .town-place { transition:none; }.town-place:hover { transform:none; } }
</style>
