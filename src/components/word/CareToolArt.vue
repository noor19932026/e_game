<script setup lang="ts">
defineProps<{kind:string}>()
</script>
<template>
  <svg class="care-tool-art" viewBox="0 0 100 86" fill="none" aria-hidden="true">
    <ellipse cx="50" cy="76" rx="31" ry="4" fill="#745f48" opacity=".09" />
    <g stroke="#7d674d" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
      <g v-if="kind==='water'"><path d="M21 48H79L72 70Q50 80 28 70Z" fill="#a3bcb3"/><ellipse cx="50" cy="48" rx="29" ry="9" fill="#d1e2df"/><ellipse cx="50" cy="49" rx="23" ry="5" fill="#8fb6c5" stroke="none"/><path d="M51 13Q37 31 47 35Q61 38 57 26Z" fill="#b3d2db"/><path d="M36 50Q48 46 60 50" stroke="#e5f2ee"/></g>
      <g v-else-if="kind==='towel'"><path d="M22 28L68 21L81 61L34 73Z" fill="#e5baac"/><path d="M22 28L17 60L34 73L38 40Z" fill="#d29e90"/><path d="M31 34L70 28M33 41L72 35M40 62L73 54" stroke="#f8e7d6"/><path d="M35 72L81 61L80 66L36 77Z" fill="#f0d1bd"/></g>
      <g v-else-if="kind==='brush'"><path d="M51 48L38 74Q33 82 28 76Q25 73 29 65L43 42Z" fill="#b99b72"/><rect x="34" y="12" width="43" height="41" rx="15" transform="rotate(22 34 12)" fill="#dfba88"/><path d="M39 26L64 36M35 34L61 43M35 42L54 48" stroke="#9b7956" stroke-width="4"/></g>
      <g v-else-if="kind==='bed'"><ellipse cx="50" cy="55" rx="37" ry="22" fill="#9eaf91"/><path d="M15 45Q15 22 34 25Q50 31 68 25Q85 20 86 45" stroke="#81916f" stroke-width="10"/><ellipse cx="50" cy="55" rx="26" ry="13" fill="#e7ddc4"/><path d="M25 65Q51 75 76 63" stroke="#b8c5a5"/></g>
      <g v-else-if="kind==='ball'"><circle cx="50" cy="45" r="29" fill="#e0b16f"/><path d="M24 33Q50 57 76 33M26 63Q52 45 72 65" stroke="#f7e1ac" stroke-width="9"/><path d="M36 19Q49 45 36 71" stroke="#9b9e78" stroke-width="9"/></g>
      <g v-else-if="kind==='feather'"><path d="M24 73L59 28" stroke="#b1946c" stroke-width="6"/><path d="M58 29Q44 9 64 8Q91 7 83 30Q74 44 58 29Z" fill="#b4bfce"/><path d="M59 30Q78 26 82 13M67 25L64 15M72 23L80 24" stroke="#8f9eb5"/><path d="M57 32Q58 50 77 48" stroke="#adba99"/></g>
      <g v-else-if="kind==='tunnel'"><path d="M19 29Q33 11 51 21L85 35L76 71L31 69Z" fill="#b1bca0"/><ellipse cx="30" cy="48" rx="19" ry="25" fill="#8c9f84"/><ellipse cx="30" cy="49" rx="13" ry="19" fill="#657960"/><path d="M47 23Q59 45 45 70M64 28Q76 48 62 70M78 34Q88 48 76 70" stroke="#e5e6c8" stroke-width="4"/></g>
      <g v-else-if="kind==='blanket'"><path d="M17 29L69 19L85 62L32 76Z" fill="#b9b3cd"/><path d="M20 41L74 31M26 57L80 47M35 25L50 71M53 22L68 67" stroke="#e7def0" stroke-width="4"/><path d="M32 76L35 82M42 73L44 79M54 70L56 76M66 67L68 73M78 64L80 70" stroke="#a79ebf"/></g>
      <g v-else><path d="M32 62L41 18H69L79 62" fill="#c5ad86"/><path d="M33 36H75M36 25H72M29 63H82"/></g>
    </g>
  </svg>
</template>
