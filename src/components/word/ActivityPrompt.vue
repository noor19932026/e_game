<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Volume2 } from 'lucide-vue-next'
import type { ActivityMode } from '@/features/wordMerge/activity'
const props = defineProps<{ title?:string; mode:ActivityMode; command:string; translation:string; hintOpen:boolean }>()
const emit = defineEmits<{ mode:[mode:ActivityMode]; hint:[] }>()
const showText = computed(() => props.mode !== 'listening' || props.hintOpen)
const showHelp = computed(() => props.mode === 'guide' || props.hintOpen)
const notice = ref('')
const choices:{id:ActivityMode;name:string}[] = [{id:'guide',name:'图文入门'},{id:'reading',name:'阅读挑战'},{id:'listening',name:'听力挑战'}]
function stop() { if ('speechSynthesis' in window) window.speechSynthesis.cancel() }
function speak() {
  notice.value = ''
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') { notice.value = '此设备暂不支持朗读，可以主动查看图文提示或选择阅读挑战。'; return }
  stop()
  const voice = new SpeechSynthesisUtterance(props.command); voice.lang='en-GB'; voice.rate=.82
  voice.onerror = event => { if (!['canceled','interrupted'].includes(event.error)) notice.value='朗读暂时不可用，可以主动查看图文提示或选择阅读挑战。' }
  try { window.speechSynthesis.speak(voice) } catch { notice.value='朗读暂时不可用，可以主动查看图文提示或选择阅读挑战。' }
}
watch(() => [props.command,props.mode], () => { stop(); notice.value='' })
onBeforeUnmount(stop)
</script>
<template>
  <section class="activity-prompt" aria-label="当前任务指令">
    <nav class="activity-modes" aria-label="活动难度"><button v-for="choice in choices" :key="choice.id" :aria-pressed="mode === choice.id" @click="emit('mode',choice.id)">{{ choice.name }}</button></nav>
    <div class="activity-paper"><span class="activity-paper-label">{{ title || 'ONE LITTLE ADVENTURE AT A TIME' }}</span><p v-if="showText" class="activity-command" lang="en">{{ command }}</p><p v-else class="activity-audio"><Volume2 :size="22" /> 听听接下来要做什么</p><div v-if="showHelp" class="activity-hint"><slot name="hint" /><p>{{ translation }}</p></div><div class="activity-controls"><button class="activity-listen" aria-label="朗读任务指令" @click="speak"><Volume2 :size="17" /> 听这一步</button><button class="activity-help" :aria-pressed="hintOpen" @click="emit('hint')">{{ hintOpen ? '收起图文提示' : '查看图文提示' }}</button></div><p v-if="notice" class="activity-speech-notice" role="status">{{ notice }}</p></div>
  </section>
</template>
<style scoped>
.activity-prompt { margin-bottom:13px; color:#75634c; }
.activity-modes { display:flex; gap:6px; margin-bottom:10px; }
.activity-modes button { flex:1; min-width:0; min-height:44px; border:1px solid #dfd7c4; border-radius:8px; background:#f4f0e5; color:#948266; padding:9px 12px; font:inherit; font-size:12px; cursor:pointer; }
.activity-modes button[aria-pressed=true] { background:#7b9477; border-color:#7b9477; color:#fffbed; }
.activity-paper { border:1px dashed #d7cbae; border-radius:12px; padding:14px 17px; background:#fffcf4; box-shadow:0 2px 0 #ded5bf33; }
.activity-paper-label { font:9px Georgia,serif; letter-spacing:1px; color:#a58e6e; }
.activity-command { font:20px/1.5 Georgia,serif; color:#6e5a41; margin:8px 0!important; overflow-wrap:anywhere; }
.activity-audio { display:flex; align-items:center; gap:9px; font-size:14px; margin:12px 0!important; color:#82966e; }
.activity-hint { display:flex; align-items:center; gap:9px; border-top:1px solid #ece4d2; padding-top:9px; margin:9px 0; }
.activity-hint p { font-size:12px; line-height:1.8; color:#a08764; margin:0; }.activity-hint :deep(svg) { width:43px; height:43px; flex-shrink:0; }
.activity-controls { display:flex; align-items:center; justify-content:space-between; gap:6px; }
.activity-controls button { display:flex; align-items:center; justify-content:center; gap:6px; min-height:44px; border:0; border-radius:7px; padding:8px 11px; font:inherit; font-size:11px; color:#7d926a; cursor:pointer; background:#eef0e0; }
.activity-controls .activity-help { background:transparent; color:#a08b6a; text-decoration:underline; text-underline-offset:4px; }
.activity-speech-notice { font-size:11px; line-height:1.7; color:#a08560; margin:6px 0 0!important; }
button:focus-visible { outline:3px solid #a97c44; outline-offset:3px; }
@media(max-width:760px) { .activity-prompt { position:sticky; top:env(safe-area-inset-top,0px); z-index:5; background:#f6f3eaf5; padding:3px 0; backdrop-filter:blur(8px); }.activity-modes { gap:5px; margin-bottom:7px; }.activity-modes button { padding:8px 5px; font-size:11px; }.activity-paper { padding:9px 11px; }.activity-command { font-size:17px; margin:5px 0!important; }.activity-paper-label { font-size:8px; letter-spacing:.5px; }.activity-controls button { font-size:10px; }.activity-audio { font-size:12px; margin:8px 0!important; }.activity-hint { margin:5px 0; padding-top:5px; }.activity-hint p { font-size:11px; }.activity-speech-notice { font-size:10px; } }
</style>
