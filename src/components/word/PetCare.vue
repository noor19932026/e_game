<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Check, Heart } from 'lucide-vue-next'
import type { GameState } from '@/features/wordMerge/game'
import { actCare, careFriends, careStories, careTools, chooseCareTool, currentCareStep, currentCareStory, nextCareRound, setCareMode, toggleCareHint } from '@/features/wordMerge/care'
import ActivityPrompt from './ActivityPrompt.vue'
import AnimalArt from './AnimalArt.vue'
import CareToolArt from './CareToolArt.vue'

const props=defineProps<{game:GameState}>()
const c=computed(()=>props.game.care)
const story=computed(()=>currentCareStory(c.value))
const step=computed(()=>currentCareStep(c.value))
const reveal=computed(()=>c.value.mode==='guide'||c.value.hintOpen)
const doneTools=computed(()=>story.value.steps.slice(0,c.value.step).map(s=>s.tool))
const selected=computed(()=>careTools.find(t=>t.id===c.value.selected))
const message=ref('先选一件照料工具，再点小动物。听懂它的需要，陪它度过舒服的一天。')
function act() {
  const result=actCare(props.game)
  message.value=result.complete ? `${story.value.name}：Thank you! 这段陪伴已记入故事相册，+18 星币 · +12 成长。` : result.ok ? '小动物很舒服！看看它接下来需要什么。' : '工具还在。再读读或听听小动物的话，然后选一件工具试试。'
}
function next() { if (nextCareRound(c.value)) message.value='另一位小伙伴来了。选工具，再点小动物来照料它。' }
</script>
<template>
  <section class="pet-care" aria-label="宠物照料站游戏">
    <header class="care-heading"><div><span>A LITTLE CARE. A LITTLE FRIENDSHIP.</span><h1>宠物照料站</h1><p>{{ careStories.length }} 段生活小故事 · {{ careTools.length }} 件照料与游戏工具，陪朋友度过不同的一天。</p></div><div class="care-seal"><Heart :size="23"/> KIND<br>HEARTS</div></header>
    <ActivityPrompt v-if="!c.complete" :mode="c.mode" :command="step!.english" :translation="step!.chinese" :hint-open="c.hintOpen" :title="`${story.name} 的悄悄话`" @mode="setCareMode(c,$event)" @hint="toggleCareHint(c)"><template #hint><CareToolArt :kind="step!.tool" /></template></ActivityPrompt>
    <div class="care-play-space">
      <section class="care-garden" aria-label="小动物休息区">
        <div class="care-visit"><span>VISIT {{ String(c.round).padStart(2,'0') }}</span><strong>{{ story.name }}</strong><span>{{ c.step }} / {{ story.steps.length }} 个温柔小动作</span></div>
        <p class="care-story-title">{{ story.title }} <span>故事 {{ c.memories.length }} / {{ careStories.length }}</span></p>
        <div class="care-progress"><span v-for="(_,index) in story.steps" :key="index" :class="{done:index<c.step}"><Check v-if="index<c.step" :size="12" /></span></div>
        <div class="care-scene" :class="{'care-finished':c.complete,'care-sleeping':doneTools.includes('bed')}">
          <div class="care-window"><span></span><span></span></div><div class="care-leaves" aria-hidden="true"></div>
          <CareToolArt v-if="doneTools.includes('bed')" class="care-visible-bed" kind="bed" />
          <CareToolArt v-if="doneTools.includes('blanket')" class="care-visible-blanket" kind="blanket" />
          <CareToolArt v-if="doneTools.includes('tunnel')" class="care-visible-tunnel" kind="tunnel" />
          <button class="care-pet" :disabled="c.complete" aria-label="照料小动物" @click="act"><AnimalArt :animal="story.animal" :color="story.color" :happy="c.complete || doneTools.length>0" /><svg v-if="story.steps.some(s=>s.english.includes('mud'))&&!doneTools.includes('towel')" class="care-mud" viewBox="0 0 180 160" aria-hidden="true"><g fill="#a78e6c"><ellipse cx="62" cy="139" rx="11" ry="5"/><ellipse cx="110" cy="139" rx="11" ry="5"/><circle cx="113" cy="130" r="3"/></g></svg><svg v-if="doneTools.includes('brush')||doneTools.includes('towel')" class="care-clean" viewBox="0 0 180 160" aria-hidden="true"><path d="M28 59L31 67L39 70L31 73L28 81L25 73L17 70L25 67ZM146 85L149 92L156 95L149 98L146 105L143 98L136 95L143 92Z" fill="#d9b46c"/></svg><span v-if="doneTools.includes('bed')" class="care-snooze" aria-hidden="true">z z Z</span></button>
          <CareToolArt v-if="doneTools.includes('water')" class="care-visible-water" kind="water" />
          <CareToolArt v-if="doneTools.includes('ball')" class="care-visible-ball" kind="ball" />
          <CareToolArt v-if="doneTools.includes('feather')" class="care-visible-feather" kind="feather" />
        </div>
        <p class="care-feedback" role="status" aria-live="polite">{{ message }}</p>
        <div v-if="c.complete" class="care-receipt"><Heart :size="20" /><strong>友谊 +1，照料完成！</strong><span>{{ c.helped ? '提示帮助你完成了这次照料。' : '这次没有打开额外提示。' }}</span><button @click="next">迎接下一位朋友 <ArrowRight :size="16" /></button></div>
      </section>
      <section v-if="!c.complete" class="care-toolbox" aria-label="照料工具架"><header><h2>温柔小工具</h2><p>① 选一件工具　② 点小动物</p></header><div class="care-tools"><button v-for="tool in careTools" :key="tool.id" :data-care-tool="tool.id" :aria-label="`选择 ${tool.english}`" :aria-pressed="c.selected===tool.id" @click="chooseCareTool(c,tool.id)"><CareToolArt :kind="tool.id"/><span v-if="reveal" lang="en">{{ tool.english }}</span><small v-if="reveal">{{ tool.chinese }}</small></button></div><div class="care-selected"><CareToolArt v-if="selected" :kind="selected.id"/><span>{{ selected ? '工具已拿好，点一下小动物。' : '选好工具，再去照料小伙伴。' }}</span></div></section>
    </div>
    <section class="care-album" aria-label="友谊相册"><header><h2>我们的友谊相册</h2><span>{{ c.friends.length }} / {{ careFriends.length }} 位小伙伴</span></header><div><article v-for="friend in careFriends" :key="friend.id" :class="{'care-friend-met':c.friends.includes(friend.animal)}"><AnimalArt :animal="friend.animal" :color="c.friends.includes(friend.animal)?friend.color:'#dfd7c7'" :happy="c.friends.includes(friend.animal)"/><span>{{ c.friends.includes(friend.animal)?friend.name:'等待认识' }}</span><Check v-if="c.friends.includes(friend.animal)" :size="13"/></article></div></section>
    <details class="care-memories"><summary>陪伴故事相册 · {{ c.memories.length }} / {{ careStories.length }}</summary><div><article v-for="memory in careStories" :key="memory.id" :class="{'care-memory-done':c.memories.includes(memory.id)}"><AnimalArt :animal="memory.animal" :color="c.memories.includes(memory.id)?memory.color:'#ded7c8'" :happy="c.memories.includes(memory.id)"/><span>{{ memory.title }}</span><Check v-if="c.memories.includes(memory.id)" :size="12"/><small v-else>等待一起经历</small></article></div></details>
    <p class="care-learning">未打开额外提示完成 {{ c.independent }} 次 · 提示后完成 {{ c.assisted }} 次。每个新朋友都可以慢慢认识；选错工具不会失去星币。</p>
  </section>
</template>
<style scoped src="@/styles/pet-care.css"></style>
