<script setup lang="ts">
import type { PondFish } from '@/features/wordMerge/fishing'
defineProps<{fish:PondFish}>()
</script>
<template>
  <svg class="pond-fish-art" viewBox="0 0 120 80" fill="none" aria-hidden="true">
    <g stroke="#6c7d75" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
      <path d="M84 38L110 18L107 41L111 62L84 47Z" :fill="fish.color"/>
      <path d="M37 22Q43 5 65 9L73 25M44 54L63 69L77 53" :fill="fish.color"/>
      <ellipse cx="54" cy="39" rx="39" ry="23" :fill="fish.color"/>
      <path d="M47 35L60 47L43 51Z" fill="#faf0cf" opacity=".55" stroke="none"/>
      <path v-if="fish.striped" d="M46 18Q38 37 47 59M62 18Q54 39 63 61M78 23Q71 41 78 55" stroke="#816f94" stroke-width="5"/>
      <g v-if="fish.spotted" fill="#655f71" opacity=".7" stroke="none"><circle cx="43" cy="28" r="4"/><circle cx="60" cy="26" r="4"/><circle cx="76" cy="35" r="4"/><circle cx="48" cy="48" r="4"/><circle cx="65" cy="49" r="4"/></g>
      <path d="M29 26Q40 37 30 50" stroke="#fff5d7" opacity=".65"/>
      <circle cx="27" cy="33" r="4" fill="#faf4df" stroke="none"/><circle cx="26" cy="33" r="2" fill="#465b56" stroke="none"/>
      <path d="M16 43L21 44"/>
      <path d="M92 34L104 25M94 43L106 49" opacity=".5"/>
    </g>
  </svg>
</template>
