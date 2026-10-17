<script setup lang="ts">
import type { Product } from '@/features/wordMerge/stores'
defineProps<{ product:Product }>()
</script>
<template>
  <svg class="store-product-art" viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <ellipse cx="50" cy="86" rx="30" ry="4" fill="#64503a" opacity=".1" />
    <g stroke="#70563f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <g v-if="product.kind === 'milk'"><path d="M30 31L40 15H63L72 31V81H30Z" :fill="product.color"/><path d="M30 31H72M40 15L49 31V80M49 31L63 15"/><path d="M51 44H68V69H51Z" fill="#fff7dd"/><path d="M54 53H65M54 59H65"/></g>
      <g v-else-if="product.kind === 'bread'"><path d="M22 42Q14 15 38 18Q51 9 65 19Q88 16 79 42V79H22Z" :fill="product.color"/><path d="M31 44Q27 27 42 28Q51 21 62 29Q75 27 70 44V71H31Z" fill="#f1dcb2"/></g>
      <g v-else-if="product.kind === 'egg'"><path d="M50 17C30 17 16 65 31 78Q50 89 69 78C84 65 70 17 50 17Z" :fill="product.color"/><path d="M37 37Q28 52 31 63" stroke="#fff9e6" stroke-width="5"/></g>
      <g v-else-if="product.kind === 'water'"><path d="M40 23H61V35L69 43V78Q50 86 31 78V43L40 35Z" :fill="product.color"/><rect x="38" y="14" width="25" height="10" rx="3" fill="#9baea0"/><path d="M32 51H68V67H32Z" fill="#eaf0dd"/><path d="M51 54Q41 65 51 65Q60 65 51 54Z" fill="#91bac9"/></g>
      <g v-else-if="product.kind === 'carrot'"><path d="M30 37Q45 27 65 43L30 85Z" :fill="product.color"/><path d="M50 35Q38 9 52 15L59 33Q68 9 76 21L64 40M41 47L49 53M35 60L42 64" stroke="#809a68" stroke-width="4"/></g>
      <g v-else-if="product.kind === 'cheese'"><path d="M19 48L70 24L83 56V79H19Z" :fill="product.color"/><path d="M19 48L83 56"/><g fill="#b89b48" stroke="none"><circle cx="36" cy="63" r="5"/><circle cx="67" cy="68" r="6"/><ellipse cx="61" cy="43" rx="5" ry="3"/></g></g>
      <g v-else-if="product.kind === 'apple'"><path d="M49 32C18 16 14 62 30 77Q43 87 50 79Q64 86 77 72C91 43 75 17 49 32Z" :fill="product.color"/><path d="M49 31V18M50 24Q67 8 76 20Q68 31 50 24" fill="#8daa76"/><path d="M32 40Q24 50 28 60" stroke="#f0c0a3" stroke-width="4"/></g>
      <g v-else-if="product.kind === 'orange'"><circle cx="50" cy="54" r="30" :fill="product.color"/><path d="M49 25V18Q66 11 73 23Q61 31 49 25" fill="#91a971"/><path d="M31 42Q25 52 29 62" stroke="#f7d693" stroke-width="4"/></g>
      <g v-else-if="product.kind === 'banana'"><path d="M23 29Q37 82 78 35L82 41Q61 95 29 76Q12 63 18 33Z" :fill="product.color"/><path d="M23 29L20 20M78 35L84 29M27 40Q40 80 73 49"/></g>
      <g v-else-if="product.kind === 'pear'"><path d="M48 24Q61 20 64 43Q89 67 73 80Q49 94 27 79Q14 65 36 43Q36 26 48 24Z" :fill="product.color"/><path d="M49 24L54 13M52 21Q68 10 73 23Q63 31 52 21" fill="#8ba16c"/><path d="M33 59L30 68" stroke="#e9e5ad" stroke-width="5"/></g>
      <g v-else-if="product.kind === 'strawberry'"><path d="M26 36Q50 21 76 36Q83 59 52 85Q20 61 26 36Z" :fill="product.color"/><path d="M25 33L40 23L49 31L62 22L76 34L59 38L51 47L42 37Z" fill="#8fa476"/><path d="M36 48L38 52M54 51L53 55M66 46L64 50M45 66L47 70M59 64L57 68" stroke="#f4dfad"/></g>
      <g v-else-if="product.kind === 'grapes'"><g :fill="product.color"><circle v-for="(pos,i) in [[34,40],[53,37],[70,43],[43,55],[62,58],[50,74]]" :key="i" :cx="pos[0]" :cy="pos[1]" r="12"/></g><path d="M51 27V15Q68 12 77 23Q63 34 51 27" fill="#9aaf7c"/></g>
      <g v-else-if="product.kind === 'tomato'"><path d="M48 30C19 20 15 57 25 73Q50 93 76 73C89 49 78 20 48 30Z" :fill="product.color"/><path d="M50 35L32 27L46 24L51 15L57 26L72 29L57 36Z" fill="#8ba371"/><path d="M31 45Q24 53 29 62" stroke="#efb393" stroke-width="5"/></g>
      <g v-else-if="product.kind === 'cucumber'"><rect x="34" y="15" width="31" height="70" rx="15" transform="rotate(30 50 50)" :fill="product.color"/><path d="M60 25L37 67M68 34L45 76" stroke="#aec28e"/><circle cx="73" cy="74" r="13" fill="#dce6bb"/><path d="M71 67L71 71M77 72L75 76M69 77L67 74" stroke="#91a56d"/></g>
      <g v-else-if="product.kind === 'lettuce'"><path d="M49 80Q19 82 18 59Q7 40 28 35Q23 13 44 21Q60 6 70 26Q95 25 82 48Q97 69 71 76Z" :fill="product.color"/><path d="M49 80L49 39M49 67L31 49M49 56L67 36M49 73L72 58" stroke="#7f996a" stroke-width="4"/></g>
      <g v-else-if="product.kind === 'corn'"><ellipse cx="51" cy="47" rx="19" ry="33" :fill="product.color"/><path d="M42 20V72M51 16V77M60 20V71M34 31H67M33 42H69M33 53H69M35 64H66" stroke="#c4a552" stroke-width="2"/><path d="M50 85Q19 72 20 39Q41 51 50 85ZM50 85Q83 74 82 39Q61 51 50 85Z" fill="#8fa874"/></g>
      <g v-else-if="product.kind === 'watermelon'"><ellipse cx="50" cy="48" rx="34" ry="29" :fill="product.color"/><path d="M31 25Q15 47 31 72M48 20Q32 47 48 76M65 24Q51 48 64 73" stroke="#617e59" stroke-width="5"/><path d="M42 61L84 43Q93 72 64 85Z" fill="#e8d4aa"/><path d="M46 64L80 49Q86 69 65 80Z" fill="#d58b80"/><path d="M63 61L65 65M70 68L72 72"/></g>
      <g v-else-if="product.kind === 'peach'"><path d="M50 31Q22 16 18 48Q18 74 50 85Q83 73 83 48Q77 19 50 31Z" :fill="product.color"/><path d="M50 32Q41 50 50 69M49 30L54 18Q73 11 77 25Q64 34 54 26" fill="#97af79"/><path d="M31 42Q25 51 29 60" stroke="#f4d2af" stroke-width="4"/></g>
      <g v-else-if="product.kind === 'blueberry'"><path d="M20 43H80L74 82H26Z" fill="#d5be95"/><g :fill="product.color"><circle v-for="(pos,i) in [[29,41],[44,36],[61,38],[74,45],[38,52],[57,53]]" :key="i" :cx="pos[0]" :cy="pos[1]" r="11"/></g><path d="M26 60H75M28 70H73M38 59V80M57 60V81" stroke="#ae956e"/><path d="M27 37L31 40L34 36M56 35L61 39L65 35M51 51L56 55L60 50" stroke="#68728e" stroke-width="2"/></g>
      <g v-else-if="product.kind === 'lemon'"><path d="M20 63Q11 59 22 50Q24 23 52 23Q64 11 70 26Q95 40 79 65Q65 86 40 78Q23 88 25 72Z" :fill="product.color"/><path d="M35 38Q25 49 30 57" stroke="#f7e7a0" stroke-width="5"/><path d="M64 24Q77 8 86 22Q79 33 64 24" fill="#92a773"/></g>
      <g v-else-if="product.kind === 'shirt'"><path d="M35 22L19 32L8 53L25 61L32 48V81H70V48L77 60L93 52L82 31L65 22Q51 35 35 22Z" :fill="product.color"/><path d="M37 24Q51 42 64 24M50 36V80M40 53H32"/><g fill="#f7ebd3"><circle cx="55" cy="48" r="2"/><circle cx="55" cy="61" r="2"/></g></g>
      <g v-else-if="product.kind === 'hat'"><path d="M29 58L35 28Q51 17 67 28L72 58Z" :fill="product.color"/><ellipse cx="50" cy="63" rx="38" ry="12" :fill="product.color"/><path d="M32 47H69V56H32Z" fill="#f4e5bf"/></g>
      <g v-else-if="product.kind === 'shoes'"><path d="M20 34H40L47 59Q60 64 56 79H13V59ZM63 29H81L87 55Q99 61 94 74H57V51Z" :fill="product.color"/><path d="M14 71H55M58 66H94M25 46L38 50M24 55L40 59M67 41L79 45M66 50L81 54" stroke="#f3e9cf" stroke-width="4"/></g>
    </g>
  </svg>
</template>
