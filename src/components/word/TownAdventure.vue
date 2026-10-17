<script setup lang="ts">
import { computed, ref } from 'vue'
import ActivityPrompt from './ActivityPrompt.vue'
import AdventureScenery from './AdventureScenery.vue'
import AdventureObjectArt from './AdventureObjectArt.vue'
import { adventureScenes, activeAdventure, adventureSession, currentAdventureStep, selectAdventure, setAdventureMode, toggleAdventureHint, interactAdventure, type AdventureHost, type AdventureObject } from '../../features/wordMerge/adventure'
import type { ActivityMode } from '../../features/wordMerge/activity'
import '../../styles/town-adventure.css'
const props=defineProps<{game:AdventureHost}>()
const state=computed(()=>props.game.adventure)
const scene=computed(()=>activeAdventure(state.value))
const session=computed(()=>adventureSession(state.value))
const step=computed(()=>currentAdventureStep(state.value))
const category=ref<'treasure'|'puzzle'>(scene.value.kind)
const feedback=ref('')
const choices=computed(()=>adventureScenes.filter(a=>a.kind===category.value))
const target=computed(()=>scene.value.objects.find(o=>o.id===step.value?.target))
const completed=computed(()=>Object.values(state.value.sessions).filter(a=>a.complete).length)
const instructionVisible=computed(()=>state.value.mode==='guide'||state.value.hintOpen)
function choose(id:string){selectAdventure(state.value,id);feedback.value=''}
function chooseKind(kind:'treasure'|'puzzle'){category.value=kind;const next=adventureScenes.find(a=>a.kind===kind&&!state.value.sessions[a.id]?.complete)??adventureScenes.find(a=>a.kind===kind)!;choose(next.id)}
function changeMode(mode:ActivityMode){setAdventureMode(state.value,mode);feedback.value=''}
function visible(o:AdventureObject){return (o.hiddenUntil??0)<=session.value.step&&!session.value.found.includes(o.id)}
function changed(id:string){const index=scene.value.steps.findIndex(a=>a.target===id);return index>=0&&index<session.value.step}
function interact(id:string){const result=interactAdventure(props.game,id);feedback.value=result==='wrong'?'这里暂时用不上，再看一看或听一遍任务。':result==='collected'?'收到！它已经放进探险口袋。':result==='changed'?'场景发生了变化，继续下一步吧。':result==='complete'?'探险完成，奖励已经放进小店！':''}
function next(){const index=adventureScenes.findIndex(a=>a.id===scene.value.id);const next=adventureScenes.slice(index+1).concat(adventureScenes.slice(0,index)).find(a=>!state.value.sessions[a.id]?.complete);if(next){category.value=next.kind;choose(next.id)}}
</script>
<template>
  <section class="town-adventure" aria-label="探险乐园">
    <header class="adventure-header"><div><span class="adventure-eyebrow">THE LITTLE EXPLORERS' CLUB</span><h2>探险乐园<span aria-hidden="true">✦</span></h2><p>听线索、找物品，让小小世界发生变化。</p></div><div class="adventure-passport"><strong>{{completed}}<small>/ {{adventureScenes.length}}</small></strong><span>探险印章</span></div></header>
    <div class="adventure-mode-tabs" role="group" aria-label="探险玩法"><button :aria-pressed="category==='treasure'" @click="chooseKind('treasure')">场景寻宝 <small>找齐线索 · 开宝箱</small></button><button :aria-pressed="category==='puzzle'" @click="chooseKind('puzzle')">小小解谜 <small>收集工具 · 改变场景</small></button></div>
    <nav class="adventure-scenes adventure-scene-picker" aria-label="探险场景"><label for="adventure-choice">{{category==='treasure'?'寻宝手册':'解谜手册'}} <small>{{choices.filter(a=>state.sessions[a.id]?.complete).length}} / {{choices.length}} 已收藏</small></label><select id="adventure-choice" aria-label="选择探险场景" :value="scene.id" @change="choose(($event.target as HTMLSelectElement).value)"><option v-for="(a,i) in choices" :key="a.id" :value="a.id">{{String(i+1).padStart(2,'0')}} · {{state.mode==='listening'?'场景 '+(i+1):a.title}}{{state.sessions[a.id]?.complete?' · ✓ 已完成':''}}</option></select></nav>
    <div class="adventure-workspace">
      <div class="adventure-play-column">
        <ActivityPrompt v-if="step" :mode="state.mode" :command="step.command" :translation="step.translation" :hint-open="state.hintOpen" title="探险指令" @mode="changeMode" @hint="toggleAdventureHint(state)"><template #hint><div v-if="target" class="adventure-hint"><AdventureObjectArt :art="target.art"/><span><strong>{{target.name}}</strong><small>{{target.meaning}}</small></span></div></template></ActivityPrompt>
        <div class="adventure-scene-label"><h3>{{state.mode==='listening'?'听听这一段探险':scene.title}}</h3><span>{{Math.min(session.step,scene.steps.length)}} / {{scene.steps.length}}</span></div>
        <div class="adventure-scene" :class="[scene.setting,{'bridge-story':scene.id==='stream-bridge','tent-is-lit':scene.id==='camp-map'&&session.step>=2}]" :data-scene="scene.id" role="group" aria-label="可探索的场景">
          <svg class="adventure-landscape" viewBox="0 0 600 400" aria-hidden="true">
            <defs><linearGradient id="adventureSky" x2="0" y2="1"><stop stop-color="#b9d8d2"/><stop offset="1" stop-color="#ecedcf"/></linearGradient><pattern id="adventureFloor" width="75" height="60" patternUnits="userSpaceOnUse"><path d="M0 59H75M74 0v60" fill="none" stroke="#e0cba3" stroke-width="1.5"/></pattern></defs>
            <g v-if="scene.setting!=='classroom'"><rect width="600" height="400" fill="url(#adventureSky)"/><circle cx="73" cy="63" r="27" fill="#f8dd91"/><path d="M125 71q-9-16 8-23 7-21 24-6 19-8 27 14 20 1 16 15ZM365 56q-6-16 10-18 8-15 24-6 18-4 25 10 16-1 20 14Z" fill="#f7f5dd"/><path d="M0 205Q110 150 229 208T600 187V400H0" fill="#b2c797"/><path d="M0 264Q148 225 288 272T600 249V400H0" fill="#c4d2a0"/><path d="M218 400Q220 290 320 225l40 8q-78 83-47 167" fill="#e7d9ae"/><path d="m35 308 7-10 6 10m390 15 8-11 8 11m-82 56 7-10 7 10m-338-3 5-7 6 7" fill="none" stroke="#91ae7f" stroke-width="3"/></g>
            <g v-if="scene.setting==='park'">
              <g :transform="scene.id==='stream-bridge'?'translate(-310 80)':'translate(0 0)'"><path d="M466 200v88m-3-64-28-22m33 37 22-24" stroke="#927654" stroke-width="16" stroke-linecap="round"/><path d="M421 115q-31 14-23 51-19 26 13 45 9 28 42 17 29 14 50-8 40-2 35-38 21-28-13-47 2-34-31-31-27-21-49 8Z" fill="#85ab85"/><path d="m437 138 11-9m41 48 12 2" stroke="#a4c29b" stroke-width="7" stroke-linecap="round"/></g>
              <g v-if="scene.id!=='stream-bridge'" stroke="#7c7659" stroke-width="7" stroke-linejoin="round"><path d="M144 136h49v60h-49Z" fill="#c8ad77"/><path d="M142 199h55m-47 0-6 49m47-49 6 49"/><path d="M239 164h94v17h-94Z" fill="#caa97a"/><path d="M250 180v64m72-64v64"/></g>
              <g v-else><path d="M349 154q-79 65-23 121 52 53-18 125h104q47-72 4-136-33-51 22-110Z" fill="#94c5c9"/><path d="m346 188 26-3m-27 145 26 7m22-67 21-2m-60 108 19-5" stroke="#d9ece0" stroke-width="5" stroke-linecap="round"/></g>
            </g>
            <g v-if="scene.setting==='classroom'"><rect width="600" height="400" fill="#eee6cc"/><path d="M0 233H600V400H0Z" fill="#ead7b2"/><path d="M0 233H600V400H0Z" fill="url(#adventureFloor)"/><path d="M0 232H600" stroke="#b6b99a" stroke-width="10"/><rect x="39" y="35" width="130" height="109" rx="10" fill="#9dbaab" stroke="#bdc7aa" stroke-width="10"/><path d="M49 46h110v88H49Z" fill="#d7e5d0"/><path d="M104 44v91m-55-46h111" stroke="#f8efce" stroke-width="8"/><path d="M54 103q22-30 44-8t62-16v55H49Z" fill="#a4be93"/><rect x="234" y="34" width="151" height="67" rx="6" fill="#79948a"/><path d="M254 67h43m15 0h48M254 82h75" stroke="#e7e9cd" stroke-width="4" stroke-linecap="round"/><g stroke="#8a8062" stroke-width="7"><path d="M146 170h49v57h-49Z" fill="#c9ae7e"/><path d="M142 229h58m-48 0-6 59m44-59 8 59"/><path d="M229 179h113v18H229Z" fill="#ccaa79"/><path d="M242 199v92m86-92v92"/><path d="M353 206h41v47h-41Z" fill="#c9ae7e"/><path d="M348 255h50m-42 0-3 42m36-42 5 42"/></g><path d="M465 96h84v154h-84Z" fill="#d2c5a3" v-if="scene.id!=='garden-door'"/><path d="M474 109h66v129h-66Z" fill="#abbd9b" v-if="scene.id!=='garden-door'"/></g>
            <g v-if="scene.setting==='camp'"><path d="M500 198v95m-1-57-26-24" stroke="#927654" stroke-width="15" stroke-linecap="round"/><path d="m500 70-64 104h31l-44 69h151l-43-69h29Z" fill="#7d9e79"/><path d="m488 148-17 27m44 24 12 20" stroke="#a7bb8e" stroke-width="7" stroke-linecap="round"/><g stroke="#8a8062" stroke-width="7"><path d="M322 189h98v15h-98Z" fill="#c9a573"/><path d="M336 204v61m69-61v61"/></g><g v-if="scene.id!=='camp-map'" stroke="#8c7959" stroke-width="4" stroke-linejoin="round"><path d="m45 265 101-152 103 152Z" fill="#dfaf77"/><path d="m146 113 42 152H45Z" fill="#efce92"/><path d="m141 166 29 99H80Z" fill="#738d79"/><path d="m45 265-12 18m216-18 12 18"/></g></g>
            <AdventureScenery :setting="scene.setting" :scene-id="scene.id"/>
            <g v-if="session.complete" fill="#f8e096" stroke="#caa46a" stroke-width="2"><path d="m85 210 5-12 5 12 12 5-12 5-5 12-5-12-12-5Z"/><path d="m470 65 4-10 5 10 10 5-10 4-5 11-4-11-11-4Z"/></g>
          </svg>
          <template v-for="(o,index) in scene.objects" :key="o.id"><component :is="changed(o.id)||session.complete?'div':'button'" v-if="visible(o)" class="adventure-scene-object" :class="changed(o.id)||session.complete?'adventure-scenery':'adventure-hotspot'" :data-object="o.id" :aria-label="changed(o.id)||session.complete?undefined:'场景物品 '+(index+1)" :aria-hidden="changed(o.id)||session.complete?true:undefined" :style="{left:o.x+'%',top:o.y+'%',width:(o.size??14)+'%'}" @click="!changed(o.id)&&!session.complete&&interact(o.id)"><AdventureObjectArt :art="o.art" :changed="changed(o.id)"/><span v-if="state.mode==='guide'" class="adventure-object-name">{{o.name}}</span></component></template>
          <span class="adventure-scene-stamp" aria-hidden="true">{{({park:'GREEN PARK',camp:'SUNNY CAMP',classroom:'LITTLE CLASSROOM',library:'LITTLE LIBRARY',beach:'SHELL BEACH',garden:'GREEN GARDEN',kitchen:'SUNNY KITCHEN'})[scene.setting]}}</span>
        </div>
        <p class="adventure-feedback" role="status" aria-live="polite">{{feedback||'点击场景里的物品。点错也没关系，再试一次。'}}</p>
      </div>
      <aside class="adventure-pocket" aria-label="探险口袋"><div class="adventure-pocket-heading"><span aria-hidden="true">✦</span><h3>探险口袋</h3></div><p>{{session.complete?'把这段小小冒险收藏起来。':'收集到的物品会出现在这里。'}}</p><div class="adventure-inventory"><div v-for="id in session.inventory" :key="id" class="adventure-inventory-item"><AdventureObjectArt :art="scene.objects.find(o=>o.id===id)!.art"/><span v-if="instructionVisible">{{scene.objects.find(o=>o.id===id)!.name}}</span></div><span v-if="!session.inventory.length" class="adventure-empty">{{session.step?'工具已经用到场景里啦':'还空着，出发吧！'}}</span></div><div v-if="session.complete" class="adventure-completion" role="status"><span class="adventure-medal" aria-hidden="true">✦</span><h3>探险完成！</h3><p>星币 +{{scene.coins}} · 成长 +{{scene.xp}}</p><small>{{session.helped?'在提示帮助下完成':'独立完成，太棒了！'}}</small><button v-if="completed<adventureScenes.length" @click="next">出发，下个场景 →</button><p v-else>{{adventureScenes.length}} 枚探险印章集齐了！<br>可以回到场景看看自己的成果。</p></div><div v-else class="adventure-reward"><strong>本次探险奖励</strong><span>星币 +{{scene.coins}} · 成长 +{{scene.xp}}</span></div></aside>
    </div>
  </section>
</template>
