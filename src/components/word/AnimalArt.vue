<script setup lang="ts">
import type { AnimalId } from '@/features/wordMerge/visitors'
defineProps<{ animal: AnimalId; color: string; happy?: boolean }>()
</script>

<template>
  <svg viewBox="0 0 180 160" fill="none" aria-hidden="true" class="animal-art">
    <ellipse cx="90" cy="145" rx="57" ry="6" fill="#766047" opacity=".1" />
    <g stroke="#725b46" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="animal === 'bird'">
        <path d="M66 119L63 144M98 123L101 144M56 144H70M95 144H110" /><path d="M53 95Q34 55 65 31Q95 8 119 42Q141 72 110 121Q87 143 61 122L39 131Z" :fill="color" /><path d="M63 75Q85 56 102 81Q106 107 68 116Z" fill="#c6d4b3" /><path d="M118 56L140 65L119 74" fill="#dbb26f" /><circle cx="106" cy="49" r="4" fill="#725b46" stroke="none" /><path d="M75 28L67 16M86 23L84 12" /><path d="M55 122L38 141L67 132" fill="#829e9c" />
      </template>
      <template v-else>
        <path v-if="animal === 'cat'" d="M123 117Q166 98 150 78Q138 63 132 78" stroke="#c99a70" stroke-width="14" />
        <path v-if="animal === 'dog'" d="M125 115Q153 108 145 86" :stroke="color" stroke-width="13" />
        <ellipse cx="91" cy="112" rx="37" ry="31" :fill="color" /><ellipse cx="90" cy="116" rx="24" ry="22" fill="#f2e7d5" />
        <g v-if="animal === 'rabbit'"><path d="M64 58Q35 -8 62 8Q80 27 78 55M98 53Q102 -7 122 9Q135 24 114 62" :fill="color" /><path d="M64 44L57 19M111 44L119 19" stroke="#dbb4ad" stroke-width="7" /></g>
        <path v-else-if="animal === 'cat'" d="M55 61L49 20L79 40M104 39L133 20L128 64" :fill="color" />
        <g v-else><path d="M59 43Q29 42 35 83Q40 105 58 79M117 43Q147 42 145 81Q140 105 121 79" fill="#9b765c" /></g>
        <path d="M48 72Q43 35 88 33Q134 33 134 73Q139 110 91 111Q43 111 48 72Z" :fill="color" /><ellipse cx="91" cy="85" rx="24" ry="20" fill="#f7eddb" />
        <g v-if="happy"><path d="M65 70Q71 63 76 70M105 70Q111 63 116 70" /></g><g v-else fill="#725b46" stroke="none"><ellipse cx="71" cy="68" rx="3.3" ry="4.7" /><ellipse cx="110" cy="68" rx="3.3" ry="4.7" /></g>
        <path d="M84 79Q91 75 98 79L91 85Z" fill="#a36d65" /><path d="M91 85V90M81 90Q91 98 101 90" />
        <path v-if="animal === 'cat'" d="M60 80L38 75M60 87L37 91M121 80L143 75M121 87L145 91M81 37L83 48M94 35V47M106 38L103 49" stroke="#9d7659" />
        <ellipse cx="67" cy="138" rx="17" ry="8" :fill="color" /><ellipse cx="111" cy="138" rx="17" ry="8" :fill="color" />
        <path d="M61 105Q91 120 121 105L117 119Q90 129 65 118Z" fill="#829d8c" /><path d="M90 120L99 132L104 117" fill="#abc1ac" />
      </template>
      <g v-if="happy" fill="#c98573" stroke="none"><path d="M148 27C136 12 126 34 148 43C170 32 160 13 148 27Z" /><path d="M28 48C21 39 14 51 28 57C42 49 35 39 28 48Z" /></g>
    </g>
  </svg>
</template>

<style scoped>.animal-art { width:100%; height:100%; display:block; }</style>
