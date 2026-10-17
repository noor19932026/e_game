<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Check, Leaf } from 'lucide-vue-next'
import type { GameState } from '@/features/wordMerge/game'
import { actFarmPlot, chooseFarmTool, currentFarmCommand, currentFarmQuest, deliverFarm, farmCrops, farmQuests, farmTools, nextFarmRound, setFarmMode, toggleFarmHint } from '@/features/wordMerge/farm'
import ActivityPrompt from './ActivityPrompt.vue'
import FarmArt from './FarmArt.vue'

const props=defineProps<{game:GameState}>()
const f=computed(()=>props.game.farm)
const quest=computed(()=>currentFarmQuest(f.value))
const command=computed(()=>currentFarmCommand(f.value))
const reveal=computed(()=>f.value.mode==='guide'||f.value.hintOpen)
const selected=computed(()=>farmTools.find(t=>t.id===f.value.selected))
const steps=['播种','浇水','阳光','采收','送出']
const stageIndex=computed(()=>['plant','water','grow','harvest','deliver','complete'].indexOf(f.value.stage))
const message=ref('先选种子或工具，再点一块土地。每个动作都会让花园发生变化。')
function act(index:number) {
  const before=f.value.stage,result=actFarmPlot(props.game,index)
  message.value=result.ok ? before!==f.value.stage ? '这一轮操作完成！读读下一句，再换一件工具。' : '这块土地完成啦，继续照顾另一棵植物吧。' : '再看看指令、工具和土地。种子还在，可以放心再试。'
}
function deliver() { const result=deliverFarm(props.game);message.value=result.ok ? `${quest.value.customer}：Thank you! 新鲜收获已送达，+24 星币 · +15 成长。` : '先完成播种、浇水、阳光和采收，再把收获送出。' }
function next() { if (nextFarmRound(f.value)) message.value='新的花园委托来了。读懂数量，选好种子，再让它们慢慢长大。' }
</script>
<template>
  <section class="little-farm" aria-label="农场花园游戏">
    <header class="farm-heading"><div><span>FROM ONE LITTLE SEED TO SOMETHING LOVELY.</span><h1>农场与花园</h1><p>{{ farmCrops.length }} 种熟悉作物 · {{ farmQuests.length }} 份生活委托，亲手种出新鲜的一篮收获。</p></div><div class="farm-stamp"><Leaf :size="24"/> GROWN<br>WITH LOVE</div></header>
    <ActivityPrompt v-if="!f.complete" :mode="f.mode" :command="command.english" :translation="command.chinese" :hint-open="f.hintOpen" :title="`${quest.customer} 的花园委托 · 第 ${f.round} 单`" @mode="setFarmMode(f,$event)" @hint="toggleFarmHint(f)"><template #hint><FarmArt v-if="command.tool" :kind="command.tool" /><FarmArt v-else :kind="quest.crop" stage="produce" /></template></ActivityPrompt>
    <p class="farm-quest-title"><span>{{ reveal||f.complete?quest.title:'每份收获，都有一位等待它的朋友。' }}</span><span>委托 {{ f.completed.length }} / {{ farmQuests.length }}</span></p>
    <div class="farm-stage-strip" aria-label="种植阶段"><span v-for="(name,index) in steps" :key="name" :class="{done:index<stageIndex,current:index===stageIndex}"><Check v-if="index<stageIndex" :size="12"/><b v-else>{{ index+1 }}</b>{{ reveal?name:'STEP '+(index+1) }}</span></div>
    <section class="farm-garden" aria-label="三块种植土地"><div class="farm-horizon" aria-hidden="true"><span></span><span></span><i></i></div><div class="farm-fence" aria-hidden="true"></div><div class="farm-plots"><button v-for="(plot,index) in f.plots" :key="index" :data-farm-plot="index" :data-stage="plot.stage" :disabled="f.complete||f.stage==='deliver'" :aria-label="`操作第 ${index+1} 块土地`" @click="act(index)"><span class="farm-plot-number">{{ String(index+1).padStart(2,'0') }}</span><FarmArt :kind="plot.crop||'carrot'" :stage="plot.stage"/><span class="farm-soil" aria-hidden="true"></span><small>{{ ({empty:'空地',seed:'已播种',watered:'已浇水',ready:'已长大',harvested:'已采收'})[plot.stage] }}</small></button></div><p class="farm-feedback" role="status" aria-live="polite">{{ message }}</p></section>
    <section v-if="!f.complete&&f.stage!=='deliver'" class="farm-toolbox" aria-label="种子与园艺工具"><header><h2>种子和小工具</h2><span>① 选种子或工具　② 点土地</span></header><div class="farm-tools"><button v-for="tool in farmTools" :key="tool.id" :data-farm-tool="tool.id" :aria-label="`选择 ${tool.english}`" :aria-pressed="f.selected===tool.id" @click="chooseFarmTool(f,tool.id)"><FarmArt :kind="tool.id"/><span v-if="reveal" lang="en">{{ tool.english }}</span><small v-if="reveal">{{ tool.chinese }}</small></button></div><p class="farm-selected"><FarmArt v-if="selected" :kind="selected.id"/><span>{{ selected?'工具已拿好，点一块土地试试。':'选种子或工具，开始动手吧。' }}</span></p></section>
    <section class="farm-basket" :class="{'farm-delivered':f.complete}" aria-label="本单收获篮"><FarmArt kind="basket"/><div><strong>{{ f.complete?'新鲜收获，送达！':'我的收获篮' }}</strong><p v-if="f.harvested||f.complete"><span class="farm-basket-produce"><FarmArt :kind="quest.crop" stage="produce"/></span><b>{{ f.harvested }}</b><span>{{ f.complete?'份已送给 '+quest.customer:'份已采收' }}</span></p><p v-else>还空着，等你亲手收获。</p></div><button v-if="f.stage==='deliver'" class="farm-deliver" @click="deliver">把收获送给 {{ quest.customer }} <ArrowRight :size="15"/></button><button v-if="f.complete" class="farm-next" @click="next">接下一份花园委托 <ArrowRight :size="15"/></button></section>
    <section class="farm-collection" aria-label="花园收获图鉴"><header><h2>花园的成长日记</h2><span>不需要等待，动手就会长大</span></header><div><article v-for="crop in farmCrops" :key="crop.id" :class="{'farm-crop-known':f.produce[crop.id]>0}"><FarmArt :kind="crop.id" stage="produce"/><strong>{{ f.produce[crop.id]>0?crop.name:'等待收获' }}</strong><span>累计送出 {{ f.produce[crop.id] }} 份</span><Check v-if="f.produce[crop.id]>0" :size="13"/></article></div></section>
    <p class="farm-learning">未打开额外提示完成 {{ f.independent }} 单 · 提示后完成 {{ f.assisted }} 单。选错不会损失种子；一块地种一颗，读懂数量再动手。</p>
  </section>
</template>
<style scoped src="@/styles/little-farm.css"></style>
