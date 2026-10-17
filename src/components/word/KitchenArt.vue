<script setup lang="ts">
withDefaults(defineProps<{kind:string;stage?:number}>(),{stage:6})
</script>
<template>
  <svg class="kitchen-art" viewBox="0 0 220 150" fill="none" aria-hidden="true">
    <g stroke="#765e45" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="['sandwich','fruit-cup','breakfast'].includes(kind)">
        <ellipse cx="110" cy="131" rx="84" ry="8" fill="#6d6048" opacity=".1" stroke="none"/>
        <template v-if="kind === 'fruit-cup'">
          <path d="M67 59H153L143 128Q110 140 77 128Z" fill="#e7ece0"/><ellipse cx="110" cy="59" rx="43" ry="10" fill="#f8f3e5"/>
          <g v-if="stage >= 1" fill="#cc8268"><path d="M80 95L100 83L112 105L90 113Z"/><path d="M109 114L126 103L138 120L117 128Z"/></g>
          <g v-if="stage >= 2" fill="#e5cb75"><path d="M96 63Q118 87 134 65L140 78Q118 105 92 77Z"/><path d="M81 111L98 103L104 119L87 124Z"/></g>
          <g v-if="stage >= 3" fill="#ca8280"><path d="M80 65Q93 52 105 65L94 86Z"/><path d="M116 52Q131 43 144 58L131 77Z"/></g>
          <g v-if="stage >= 4"><path d="M161 28L137 85" stroke="#9ba68d" stroke-width="8"/><ellipse cx="135" cy="87" rx="10" ry="14" fill="#b8c2a7" transform="rotate(20 135 87)"/></g>
        </template>
        <template v-else>
          <ellipse cx="110" cy="111" rx="91" ry="24" fill="#e7ecdf"/><ellipse cx="110" cy="108" rx="74" ry="14" stroke="#c4cfb8"/>
          <template v-if="kind === 'sandwich'">
            <g v-if="stage >= 1"><path d="M52 90L100 62L163 87L112 121Z" fill="#ce9e5f"/><path d="M57 85L100 60L157 82L111 111Z" fill="#efdbb3"/></g>
            <g v-if="stage >= 2"><ellipse cx="107" cy="82" rx="31" ry="16" fill="#fff7df"/><ellipse cx="107" cy="81" rx="13" ry="9" fill="#e8bd5d"/></g>
            <path v-if="stage >= 3" d="M54 77L100 50L160 75L112 105Z" fill="#e9ca70"/>
            <g v-if="stage >= 4"><path d="M51 65L100 36L164 62V74L112 107L51 80Z" fill="#d1a264"/><path d="M51 65L100 36L164 62L112 94Z" fill="#efdbb3"/><path d="M73 64L101 48L142 64" stroke="#f7e9cc" stroke-width="5"/></g>
            <path v-if="stage >= 5" d="M100 37L113 93V107" stroke="#8b6e4e" stroke-width="5"/>
          </template>
          <template v-else>
            <g v-if="stage >= 1"><path d="M43 79Q35 56 56 58Q69 49 81 59Q99 56 94 77V111H43Z" fill="#cfa16a"/><path d="M51 80Q44 65 59 66Q70 59 79 67Q90 65 85 80V103H51Z" fill="#f0dcb7"/></g>
            <g v-if="stage >= 2"><ellipse cx="123" cy="99" rx="26" ry="16" fill="#fff8e1"/><ellipse cx="123" cy="98" rx="11" ry="9" fill="#e7bd5e"/></g>
            <g v-if="stage >= 3"><path d="M147 73Q133 55 145 51Q156 47 166 61L167 79Z" fill="#cc8268"/><path d="M147 73L166 61" stroke="#f0d6ae" stroke-width="5"/></g>
            <g v-if="stage >= 4"><path d="M153 35H186L182 88Q170 97 157 88Z" fill="#fdf9e9"/><ellipse cx="170" cy="35" rx="16" ry="5" fill="#fffdf3"/><path d="M158 46H182" stroke="#dbdfd1"/></g>
          </template>
        </template>
        <g v-if="stage === 0" stroke="#c3c5ad" stroke-dasharray="3 7"><path d="M100 68H121M111 58V79"/></g>
      </template>
      <g v-else-if="kind === 'egg'"><path d="M92 24C65 24 46 92 70 113Q91 134 117 113C142 90 117 24 92 24Z" fill="#f9f1d9"/><path d="M143 73Q121 74 117 104Q121 128 146 129Q173 124 176 105Q172 76 143 73Z" fill="#fff9e3"/><ellipse cx="145" cy="104" rx="15" ry="18" fill="#e9bd57"/></g>
      <g v-else-if="kind === 'cover'"><path d="M55 96L108 66L165 91L113 124Z" fill="#d6aa70"/><path d="M55 48L108 18L165 43L113 76Z" fill="#eddbb6"/><path d="M113 82V103M103 93L113 103L123 93" stroke="#7e9674" stroke-width="5"/></g>
      <g v-else-if="kind === 'cut'"><path d="M69 106L136 39Q148 28 154 34L165 45L90 120Z" fill="#bec7bf"/><path d="M134 41L157 18Q167 12 176 23Q184 33 175 42L155 60Z" fill="#9d7c58"/><path d="M65 126L119 126" stroke="#d5b78b" stroke-width="8"/></g>
      <g v-else-if="kind === 'mix'"><path d="M61 82H163Q154 126 112 127Q69 124 61 82Z" fill="#bfccaf"/><ellipse cx="111" cy="82" rx="51" ry="13" fill="#f4ead0"/><path d="M143 26L117 86" stroke="#b28b61" stroke-width="10"/><ellipse cx="114" cy="90" rx="12" ry="17" fill="#c9a578" transform="rotate(23 114 90)"/><path d="M71 47Q86 26 111 37M101 24L113 37L97 43" stroke="#7e9674" stroke-width="4"/></g>
      <g v-else-if="kind === 'pour-milk'"><path d="M45 25H95L99 79Q78 94 49 81Z" fill="#a8c4c2" transform="rotate(-20 70 55)"/><path d="M89 39Q117 39 127 81" stroke="#f7f1dc" stroke-width="10"/><path d="M108 81H155L151 123Q131 132 112 123Z" fill="#fdf7e6"/><path d="M113 98H151" stroke="#c2cbb8"/></g>
      <g v-else-if="kind === 'honey'"><rect x="49" y="44" width="65" height="78" rx="12" fill="#dbb56a"/><rect x="48" y="31" width="67" height="17" rx="5" fill="#aa8861"/><path d="M64 71H100V103H64Z" fill="#f7e3aa"/><path d="M147 25L121 68" stroke="#ac885a" stroke-width="8"/><ellipse cx="144" cy="29" rx="17" ry="10" transform="rotate(30 144 29)" fill="#d2b17b"/><path d="M127 64V89" stroke="#d4aa4f" stroke-width="7"/></g>
      <g v-else-if="kind === 'toast'"><rect x="52" y="61" width="117" height="67" rx="17" fill="#a9beb6"/><path d="M66 61V47Q57 23 80 25Q96 15 108 26Q129 22 121 47V61" fill="#dfbc81"/><path d="M74 59V42Q69 30 84 33Q96 25 105 34Q116 30 113 44V59" fill="#f3d99f"/><path d="M72 73H135" stroke="#758f87" stroke-width="5"/><circle cx="149" cy="91" r="7" fill="#eed7ac"/><path d="M135 50L147 38M130 27V15M54 34L44 25" stroke="#cfb16f"/></g>
      <g v-else-if="kind === 'skewer'"><path d="M40 125L171 24" stroke="#b99567" stroke-width="6"/><path d="M54 98L75 80L97 100L75 116Z" fill="#d38d79"/><circle cx="110" cy="73" r="19" fill="#e7d080"/><path d="M124 46Q146 27 161 45L148 68Z" fill="#d58d8a"/></g>
      <g v-else-if="kind === 'wrap'"><path d="M45 92Q26 46 64 40Q80 17 106 43Q139 22 158 56Q184 70 156 101Z" fill="#aec488"/><ellipse cx="104" cy="72" rx="35" ry="17" fill="#f8e7b0"/><path d="M47 80Q77 101 105 119Q135 99 159 79L142 119Q105 142 67 119Z" fill="#8fa96f"/><path d="M45 37L65 51M174 42L154 55" stroke="#9da98b" stroke-width="5"/></g>
      <g v-else-if="kind === 'squeeze'"><path d="M59 44Q79 11 111 34L132 59Q102 94 70 72Z" fill="#e5cb6d"/><path d="M71 51L120 56M77 40L114 46" stroke="#f8e9a6" stroke-width="4"/><path d="M86 88L80 102M108 89V108M128 78L137 96" stroke="#d2ba60" stroke-width="5"/><path d="M57 117H158" stroke="#b9c4ae" stroke-width="6"/></g>
      <g v-else-if="kind === 'pour-water'"><path d="M48 25H88V40L98 46V85Q72 97 47 85V46L48 40Z" fill="#a6c9d5" transform="rotate(-18 70 55)"/><path d="M89 48Q119 49 127 83" stroke="#b8d8dd" stroke-width="8"/><path d="M109 81H157L152 125Q133 134 114 125Z" fill="#deeddf"/><path d="M115 100H151" stroke="#98bbc3" stroke-width="6"/></g>
      <g v-else-if="kind === 'serve'"><path d="M37 110H184" stroke-width="6"/><path d="M52 102Q55 45 109 45Q165 46 170 102Z" fill="#bac8ad"/><path d="M102 43V33H117V43"/><path d="M78 65Q66 73 63 88" stroke="#e3e9d8" stroke-width="6"/></g>
    </g>
  </svg>
</template>
