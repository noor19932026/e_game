<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ArrowRight, Check, House, PackageOpen, Sparkles, Volume2 } from 'lucide-vue-next'
import type { GameState } from '@/features/wordMerge/game'
import { roomChapters, roomDestinations, roomItemById, currentRoomTask, chooseRoomItem, placeRoomItem, enterRoom, setRoomMode, toggleRoomHint, unpackRoom, roomUnlocked, type RoomChapterId, type RoomItemId, type RoomDestination, type RoomMode } from '@/features/wordMerge/room'
import RoomArt from './RoomArt.vue'

const props=defineProps<{game:GameState}>()
const room=computed(()=>props.game.room)
const chapter=computed(()=>roomChapters.find(c=>c.id===room.value.selected)!)
const session=computed(()=>room.value.sessions[room.value.selected])
const task=computed(()=>currentRoomTask(room.value))
const helped=computed(()=>room.value.mode==='guide' || session.value.hintOpen)
const showWords=computed(()=>room.value.mode!=='listening' || session.value.hintOpen)
const remaining=computed(()=>chapter.value.goods.filter(id=>!chapter.value.tasks.some(t=>t.item===id && session.value.placed.includes(t.id))))
const completed=computed(()=>roomChapters.filter(c=>room.value.sessions[c.id].rewarded).length)
const nextChapter=computed(()=>roomChapters[roomChapters.findIndex(c=>c.id===chapter.value.id)+1])
const message=ref('先打开纸箱，选一件物品，再点房间里合适的位置。')
const modes:{id:RoomMode;label:string;description:string}[]=[
  {id:'guide',label:'图文入门',description:'看图片和中文帮助，把物品安顿好。'},
  {id:'reading',label:'阅读整理',description:'读英文指令，选物品，再找正确的位置。'},
  {id:'listening',label:'听力整理',description:'点击喇叭听指令，文字和目标提示默认隐藏。'},
]
function cancelSpeech(){ if('speechSynthesis' in window) window.speechSynthesis.cancel() }
function changeMode(mode:RoomMode){ if(setRoomMode(room.value,mode)){ cancelSpeech(); message.value='已切换难度。本次已看过其他形式的指令，按提示后操作记录。' } }
function enter(id:RoomChapterId){ if(enterRoom(room.value,id)){ cancelSpeech(); message.value=session.value.rewarded?'这些物品都留在了你布置的位置，来看看自己的小屋吧。':'新的一箱物品，等你来安顿。' } }
function pick(id:RoomItemId){ if(chooseRoomItem(room.value,id)) message.value=session.value.selected?'拿好啦。再点房间里要放的位置。':'已放回纸箱，可以重新选择。' }
function place(destination:RoomDestination){
  if(!session.value.selected){message.value='先从纸箱里选一件物品，再点放置位置。';return}
  const result=placeRoomItem(props.game,destination)
  message.value=result.ok?(result.complete?'小屋布置好啦！+30 星币 · +16 成长，收下这枚小屋纪念章。':'放对啦！物品留下来了，继续安顿下一件吧。'):'再听听或读读指令：物品和位置都要对应。拿错了随时换，不会扣分。'
}
function hint(){toggleRoomHint(room.value); if(session.value.hintOpen) message.value='已打开帮助，本次按提示后操作记录。'}
function speak(){
  if(!task.value)return
  if(!('speechSynthesis' in window)){message.value='浏览器暂不支持朗读，可主动打开提示，或切换阅读整理。';return}
  cancelSpeech(); const utterance=new SpeechSynthesisUtterance(task.value.instruction);utterance.lang='en-GB';utterance.rate=.8
  utterance.onerror=event=>{if(!['canceled','interrupted'].includes(event.error))message.value='朗读暂时不可用，可主动打开提示，或切换阅读整理。'}
  window.speechSynthesis.speak(utterance)
}
function placedAt(destination:RoomDestination){return chapter.value.tasks.filter(t=>t.destination===destination && session.value.placed.includes(t.id))}
onBeforeUnmount(cancelSpeech)
</script>

<template>
  <section class="tidy-game" aria-label="整理小屋游戏" :style="{'--room-accent':chapter.color}">
    <header class="tidy-intro"><div><span class="tidy-eyebrow">A ROOM OF YOUR OWN</span><h1>把生活，安顿成喜欢的样子。</h1><p>一箱小物件，一句英语，让小屋慢慢有了家的样子。</p></div><span class="tidy-seal"><House :size="26"/><span>home,<br/>sweet home</span></span></header>
    <nav class="tidy-chapters tidy-chapter-picker" aria-label="小屋章节"><label for="tidy-chapter">生活章节 <span>{{completed}} / {{roomChapters.length}} 已布置</span></label><select id="tidy-chapter" aria-label="选择小屋章节" :value="chapter.id" @change="enter(($event.target as HTMLSelectElement).value as RoomChapterId)"><option v-for="(c,i) in roomChapters" :key="c.id" :value="c.id" :disabled="!roomUnlocked(room,c.id)">{{String(i+1).padStart(2,'0')}} · {{c.title}} {{room.sessions[c.id].rewarded?'✓ 已布置':!roomUnlocked(room,c.id)?'· 完成前一章解锁':`· ${room.sessions[c.id].placed.length}/${c.tasks.length}`}}</option></select></nav>
    <div class="tidy-difficulty"><nav aria-label="整理难度"><button v-for="mode in modes" :key="mode.id" :aria-pressed="room.mode===mode.id" @click="changeMode(mode.id)">{{mode.label}}</button></nav><p>{{modes.find(m=>m.id===room.mode)!.description}}</p></div>
    <div class="tidy-layout">
      <div class="tidy-workspace">
        <div class="tidy-scene-title"><div><span class="tidy-eyebrow">{{chapter.english}}</span><h2>{{chapter.title}}</h2></div><span>{{session.placed.length}} / {{chapter.tasks.length}} 件安顿好</span></div>
        <div class="tidy-room" aria-label="可以摆放物品的小屋">
          <svg class="tidy-furniture" viewBox="0 0 600 430" fill="none" aria-hidden="true">
            <path d="M0 0H600V329H0Z" fill="#ecebdb"/><path d="M0 329H600V430H0Z" fill="#d9c6a5"/><path d="M0 329H600M0 345H600M130 345L65 430M300 345V430M460 345L530 430" stroke="#b6a17f" stroke-width="2" opacity=".5"/>
            <path d="M24 329V22H574V329" stroke="#f8f3e2" stroke-width="9"/><path d="M274 74H339V165H274Z" fill="#bad1cd" stroke="#9aae9f" stroke-width="4"/><path d="M306 74V164M275 121H339" stroke="#f8f3df" stroke-width="5"/><path d="M264 70H350L340 99L330 145M274 70L279 142" stroke="#c7c4aa" stroke-width="10" stroke-linecap="round"/>
            <ellipse cx="304" cy="373" rx="124" ry="26" fill="#b5bd9c" opacity=".8"/><ellipse cx="304" cy="373" rx="103" ry="18" stroke="#e3e2c8" stroke-width="2"/>
            <g stroke="#8e785a" stroke-width="3" stroke-linejoin="round"><path d="M49 240H244V255H49Z" fill="#c09a70"/><path d="M65 255V339M226 255V339" stroke-width="9"/><path d="M69 260H222V282H69Z" fill="#d1b68e"/><path d="M140 269H155"/>
            <path d="M301 254H560V348H301Z" fill="#afbcac"/><path d="M295 277H567V299H295Z" fill="#e9e1c9"/><path d="M322 266H551V322H322Z" :fill="chapter.color"/><path d="M432 266V322" stroke="#f0e8d2" stroke-width="3"/><path d="M310 248Q335 234 370 249L375 273H310Z" fill="#f1e9d2"/><path d="M306 344V393M554 344V393" stroke-width="8"/>
            <path d="M339 173H562V184H339Z" fill="#b99771"/><path d="M365 185V196M541 185V196" stroke-width="5"/>
            <path d="M46 351L177 349L174 406H52Z" fill="#bca179"/><path d="M43 349H181V365H43Z" fill="#d5b88d"/><path d="M89 383H135"/>
            <path d="M47 78L174 78L166 140H57Z" fill="#c7ad80"/><path d="M64 78Q105 28 156 78"/><path d="M48 92H173M51 105H170M53 120H168M72 78L79 139M97 78L100 140M122 78L122 140M147 78L144 140" stroke="#a98f65" stroke-width="2"/>
            <path d="M472 20V48Q472 58 486 48M514 20V48Q514 58 528 48" stroke-width="5"/><path d="M549 48V86"/><circle cx="549" cy="35" r="21" fill="#f7edd2"/><path d="M549 25V35L559 39"/>
            </g>
          </svg>
          <button v-for="destination in roomDestinations" :key="destination.id" class="tidy-destination" :class="{'tidy-destination-filled':placedAt(destination.id).length,'tidy-destination-ready':session.selected && !session.rewarded}" :data-destination="destination.id" :aria-label="`放置到${destination.meaning}`" :disabled="session.rewarded" :style="{left:`${destination.x}%`,top:`${destination.y}%`,width:`${destination.width}%`,height:`${destination.height}%`}" @click="place(destination.id)"><RoomArt v-for="placed in placedAt(destination.id)" :key="placed.id" :item="placed.item"/><span v-if="!placedAt(destination.id).length && session.selected" class="tidy-place-dot">+</span><small v-if="helped && !session.rewarded">{{destination.meaning}}</small></button>
          <span class="tidy-scene-label">MIA'S LITTLE ROOM</span>
        </div>
      </div>
      <aside class="tidy-task-panel">
        <section v-if="task" class="tidy-instruction" aria-label="当前整理指令"><header><span class="tidy-eyebrow">ONE LITTLE THING AT A TIME</span><button :aria-label="'听整理指令'" @click="speak"><Volume2 :size="19"/></button></header><p v-if="showWords" lang="en" class="tidy-request">{{task.instruction}}</p><div v-else class="tidy-audio"><Volume2 :size="28"/><b>听听这件物品放哪里</b><small>点击喇叭，可以重复听</small></div><div v-if="helped" class="tidy-hint"><RoomArt :item="task.item"/><p>{{task.translation}}</p></div><button class="tidy-help" :aria-pressed="session.hintOpen" @click="hint">{{session.hintOpen?'收起图文提示':'查看图文提示'}}</button></section>
        <section v-else class="tidy-complete" aria-label="小屋布置完成"><span class="tidy-complete-badge"><House :size="34"/><Check :size="17"/></span><span class="tidy-eyebrow">A PLACE FOR EVERYTHING</span><h2>这间小屋，布置好啦！</h2><p>获得「{{chapter.badge}}」纪念章<br/>30 星币 · 16 成长已存入小店</p><button v-if="nextChapter" @click="enter(nextChapter.id)">去{{nextChapter.title}} <ArrowRight :size="16"/></button><p v-else class="tidy-all-done">每个生活角落，都留下了你的布置。<br/>可以点上方章节，回来看看。</p></section>
        <section v-if="!session.rewarded" class="tidy-carton" aria-label="搬家纸箱"><header><PackageOpen :size="18"/><b>搬家纸箱</b><small>{{session.unpacked?'点物品，再点位置':'里面装着新生活'}}</small></header><button v-if="!session.unpacked" class="tidy-open-box" @click="unpackRoom(room);message='纸箱打开啦！看懂或听懂指令，再挑一件物品。'"><svg viewBox="0 0 160 110" aria-hidden="true"><g stroke="#937552" stroke-width="2.5" stroke-linejoin="round"><path d="M32 43L80 29L127 43V91L80 107L32 91Z" fill="#c7a67b"/><path d="M32 43L80 59L127 43M80 59V107" fill="none"/><path d="M32 43L19 27L66 15L80 29L96 14L144 29L127 43" fill="#e0c197"/><path d="M68 65L88 72L88 83L68 76Z" fill="#f3e7c9"/></g></svg><span>打开搬家纸箱 <ArrowRight :size="16"/></span></button><div v-else class="tidy-items"><button v-for="id in remaining" :key="id" :data-room-item="id" :aria-label="`拿取${roomItemById[id].meaning}`" :aria-pressed="session.selected===id" @click="pick(id)"><RoomArt :item="id"/><span v-if="helped" lang="en">{{roomItemById[id].word}}</span><Check v-if="session.selected===id" :size="14"/></button></div></section>
      </aside>
    </div>
    <p class="tidy-feedback" role="status" aria-live="polite">{{message}}</p>
    <section class="tidy-collection" aria-label="我的小屋纪念章"><span><Sparkles :size="16"/> 小屋纪念册 {{completed}} / {{roomChapters.length}}</span><span v-for="c in roomChapters" :key="c.id" :class="{'tidy-earned':room.sessions[c.id].rewarded}"><House :size="15"/> {{room.sessions[c.id].rewarded?c.badge:'待布置'}}</span></section>
    <p class="tidy-note">本章未打开额外提示操作 {{session.independent}} 次 · 提示后操作 {{session.assisted}} 次。图文入门和中途切换难度也按提示后记录；完成布置不代表已经记住单词。纪念章和奖励每章领取一次。</p>
  </section>
</template>

<style scoped src="@/styles/tidy-room.css"></style>
