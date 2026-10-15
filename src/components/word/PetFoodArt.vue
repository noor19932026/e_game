<script setup lang="ts">
import type { PetRoute } from '@/features/wordMerge/visitors'
defineProps<{ route: PetRoute; level: number; color: string }>()
</script>

<template>
  <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" class="pet-food-art">
    <ellipse cx="50" cy="86" rx="32" ry="4" fill="#66543b" opacity=".1" />
    <g stroke="#79634a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="route === 'care'"><rect x="21" y="28" width="59" height="50" :rx="level === 2 ? 18 : 5" :fill="color" /><path d="M29 39H71M29 67H71" stroke="#f4eadc" /><path v-if="level === 0" d="M34 28V78M64 28V78" stroke="#e9dbe4" /><path v-else-if="level === 1" d="M29 26H65Q74 26 73 37V57Q56 65 29 57Z" fill="#efe7db" /><g v-else fill="#eee4da" stroke="none"><ellipse cx="50" cy="57" rx="10" ry="8" /><circle cx="38" cy="46" r="4" /><circle cx="49" cy="42" r="4" /><circle cx="60" cy="46" r="4" /></g></template>
      <template v-else>
        <path v-if="level === 2" d="M13 27H86V82H13ZM13 48H86M35 27V82" :fill="color" opacity=".65" />
        <template v-if="route === 'rabbit'"><path v-if="level > 0" d="M22 54H81L75 82H28Z" :fill="color" /><path d="M25 64L42 25M35 66L57 23M44 65L66 29M48 69L79 36M40 57L29 30M57 63L53 27M62 68L75 26" stroke="#b9ac69" stroke-width="4" /><path d="M28 64L36 36M45 66L59 35M57 67L72 47" stroke="#d8ca8f" stroke-width="3" /></template>
        <template v-else>
          <path v-if="level === 0" d="M28 19H72L77 80H23Z" :fill="color" /><path v-else d="M19 55H82L74 80Q50 88 27 80Z" :fill="color" />
          <ellipse v-if="level > 0" cx="50" cy="55" rx="31" ry="8" fill="#ac895e" />
          <g v-if="level > 0" fill="#d7b580" stroke="none"><ellipse v-for="(pos, i) in [[30,53],[43,57],[54,51],[66,56]]" :key="i" :cx="pos[0]" :cy="pos[1]" rx="5" ry="3" /></g>
          <rect v-if="level === 0" x="34" y="36" width="32" height="28" rx="5" fill="#fff3d6" />
          <g v-if="route === 'cat'" fill="#f0e3c9"><path d="M45 44L41 39L40 53Q50 61 60 53L59 39L55 44Z" /></g>
          <path v-else-if="route === 'dog'" d="M40 45Q34 37 37 33Q43 31 45 39L55 48Q63 45 65 51Q64 58 57 55L46 46Q39 50 37 45Z" fill="#f5e7c7" />
          <path v-else d="M39 54Q36 39 49 40Q62 39 60 52L52 60L44 57Z" fill="#f3e7c9" />
        </template>
        <path v-if="level === 2" d="M17 28L25 16H76L84 28M43 18V12H59V18" />
      </template>
    </g>
  </svg>
</template>

<style scoped>.pet-food-art { width:100%; height:100%; display:block; }</style>
