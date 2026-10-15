<script setup lang="ts">
import type { FoodId } from '@/features/wordMerge/journey'
defineProps<{ food: FoodId; alternate?: boolean }>()
</script>

<template>
  <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" class="picnic-art">
    <ellipse cx="50" cy="85" rx="31" ry="5" fill="#453b2b" opacity=".1" />
    <g stroke="#66503a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="food === 'apple'">
        <template v-if="alternate"><path d="M20 48Q50 20 80 48Q76 86 50 86Q24 86 20 48Z" fill="#d78368" /><path d="M26 48Q50 31 74 48Q70 77 50 78Q30 77 26 48Z" fill="#fff1ce" /><path d="M46 53L44 61M56 53L58 61" stroke="#7c563d" /></template>
        <template v-else><path d="M50 32C15 12 12 64 32 80Q42 89 50 80Q63 90 75 72C94 40 74 17 50 32Z" fill="#ce765d" /><path d="M28 42Q23 53 28 62" stroke="#f1b59a" stroke-width="5" /></template>
        <path d="M50 32L54 17M53 23Q60 7 75 15Q70 29 53 23" fill="#8baf78" />
      </template>
      <template v-else-if="food === 'bread'">
        <template v-if="alternate"><path d="M23 39Q14 20 36 17H66Q88 20 78 40L75 81H26Z" fill="#ce985c" /><path d="M31 39Q24 26 38 26H64Q78 28 70 40L68 73H33Z" fill="#f6dba4" /><circle cx="45" cy="46" r="2" /><circle cx="58" cy="59" r="2" /></template>
        <template v-else><path d="M15 61Q16 30 49 26Q82 22 87 55L83 76H20Z" fill="#d3a069" /><path d="M34 38L29 52M51 33L46 49M69 35L64 50" stroke="#f9dfae" stroke-width="6" /><path d="M20 67H81" stroke="#ab774b" /></template>
      </template>
      <template v-else-if="food === 'milk'">
        <template v-if="alternate"><path d="M28 29H72L67 81H33Z" fill="#e9f0e1" /><path d="M31 44H70L66 79H34Z" fill="#fffaf0" /><ellipse cx="50" cy="29" rx="22" ry="5" fill="#f9fcf1" /></template>
        <template v-else><path d="M29 32L40 14H66L77 32V82H29Z" fill="#fdf7e6" /><path d="M29 32H77M40 14L50 32V82" /><path d="M30 48H76V67H30Z" fill="#a3bcbd" stroke="none" /><path d="M39 15H66V22H39Z" fill="#a3bcbd" /><path d="M59 49Q46 63 59 64Q72 63 59 49Z" fill="#fffcf4" stroke="none" /></template>
      </template>
      <template v-else>
        <template v-if="alternate"><path d="M25 27H75L69 82H31Z" fill="#d6e7e3" /><path d="M29 47Q40 40 50 47T72 46L68 80H32Z" fill="#9fc7cc" /><path d="M36 34L39 72" stroke="#f6fcf8" stroke-width="4" /></template>
        <template v-else><path d="M40 24H60V33Q72 40 72 51V78Q72 85 50 85Q28 85 28 78V51Q28 40 40 33Z" fill="#c3dedc" /><rect x="39" y="14" width="22" height="12" rx="3" fill="#80a9b0" /><path d="M29 51H71V70H29Z" fill="#f7f4df" /><path d="M50 53Q39 65 50 66Q61 65 50 53Z" fill="#80a9b0" stroke="none" /></template>
      </template>
    </g>
  </svg>
</template>

<style scoped>.picnic-art { display:block; width:100%; height:100%; }</style>
