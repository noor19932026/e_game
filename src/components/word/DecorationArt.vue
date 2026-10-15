<script setup lang="ts">
import type { DecorationId } from '@/features/wordMerge/journey'
defineProps<{ decoration: DecorationId; color: string }>()
</script>

<template>
  <svg viewBox="0 0 180 110" fill="none" aria-hidden="true" class="decoration-art">
    <ellipse cx="90" cy="101" rx="64" ry="4" fill="#65543c" opacity=".09" />
    <g stroke="#79634a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="decoration === 'sage' || decoration === 'peach'">
        <path d="M36 49H144V98H36Z" fill="#f4e6c9" /><rect x="53" y="56" width="48" height="38" rx="13" fill="#dce5d2" /><path d="M76 57V94M54 75H100" stroke="#b4b99d" />
        <rect x="112" y="60" width="20" height="38" rx="2" fill="#b79a73" /><circle cx="126" cy="82" r="1.5" fill="#f9ecd1" stroke="none" />
        <path d="M35 25H145L155 51H25Z" :fill="color" /><path d="M51 25H67L63 51H44ZM83 25H98L100 51H81ZM114 25H130L138 51H119Z" fill="#fcf3db" stroke="none" />
        <path d="M25 51H155V58Q145 71 136 58Q127 71 118 58Q109 71 100 58Q91 71 82 58Q73 71 64 58Q55 71 46 58Q35 71 25 58Z" :fill="color" /><path d="M44 52H63V59Q54 69 45 59ZM81 52H100V59Q91 69 82 59ZM118 52H137V59Q127 69 118 59Z" fill="#fcf3db" stroke="none" />
        <path d="M31 19H149" stroke="#bba586" stroke-width="4" />
        <path v-if="decoration === 'sage'" d="M26 96V76M26 85Q10 84 14 72Q27 72 26 85M26 91Q42 87 37 77Q25 79 26 91" fill="#94ae80" />
        <g v-else fill="#e6ae99"><circle cx="27" cy="83" r="5" /><circle cx="36" cy="83" r="5" /><circle cx="31" cy="76" r="5" /><circle cx="31" cy="88" r="5" /><circle cx="31" cy="83" r="3" fill="#f9da8a" /><path d="M31 92V99" /></g>
      </template>
      <template v-else-if="decoration === 'bistro'">
        <path d="M51 15L55 33M129 15L125 33" /><rect x="28" y="30" width="124" height="61" rx="12" fill="#d3ad6b" /><rect x="35" y="37" width="110" height="47" rx="8" fill="#faf0d3" /><path d="M53 59H67M113 59H127" stroke="#b7a068" /><text x="90" y="57" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#76613f" stroke="none">MIA’S</text><text x="90" y="73" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#76613f" stroke="none">PICNIC</text>
      </template>
      <template v-else>
        <path d="M90 74V37M90 61L67 43M90 63L116 43" stroke="#7f9567" stroke-width="3" /><path d="M86 56Q61 62 60 48Q80 45 86 56M97 56Q120 62 122 48Q102 45 97 56" fill="#a6b286" />
        <g :fill="color"><circle v-for="(pos, i) in [[65, 34], [91, 25], [116, 33]]" :key="i" :cx="pos[0]" :cy="pos[1]" r="11" /><circle cx="65" cy="34" r="4" fill="#efd294" /><circle cx="91" cy="25" r="4" fill="#efd294" /><circle cx="116" cy="33" r="4" fill="#efd294" /></g>
        <path d="M65 71H116L110 98H71Z" fill="#d0a087" /><rect x="61" y="66" width="59" height="10" rx="3" fill="#e6bda1" />
      </template>
    </g>
  </svg>
</template>

<style scoped>.decoration-art { width:100%; height:110px; display:block; border-radius:8px; background:#f6f2e6; }</style>
