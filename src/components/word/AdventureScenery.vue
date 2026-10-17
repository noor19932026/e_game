<script setup lang="ts">
defineProps<{setting:string;sceneId:string}>()
</script>
<template>
  <g v-if="setting==='library'">
    <rect width="600" height="400" fill="#e8e3cc"/><path d="M0 275H600V400H0Z" fill="#d7c09c"/><path d="M0 295H600M0 345H600M120 275 60 400M440 275l60 125" stroke="#bfa57e" opacity=".5"/>
    <rect x="40" y="32" width="127" height="222" rx="5" fill="#c49f70"/><rect x="432" y="32" width="127" height="222" rx="5" fill="#c49f70"/><path d="M50 116h107M50 183h107M442 116h107M442 183h107" stroke="#eccb99" stroke-width="10"/>
    <path d="M57 137h15v36H57Zm20-7h14v43H77Zm22 9h17v34H99Zm22-5h14v39h-14M450 138h14v35h-14m21-43h15v43h-15m23-36h20v36h-20m27-42h13v42h-13" fill="#91aa91" stroke="#728d80" stroke-width="2"/>
    <path d="M239 26h122v69H239Z" fill="#b5cdbe" stroke="#f3ecd2" stroke-width="9"/><path d="M300 29v62m-56-30h112" stroke="#f6edd2" stroke-width="5"/><path d="M217 250h166v15H217Z" fill="#bf976b"/><path d="M235 265v87m130-87v87" stroke="#997d5b" stroke-width="9"/>
    <ellipse cx="300" cy="372" rx="100" ry="17" :fill="sceneId==='library-lost-things'?'#b6bca0':'#b4b5a3'"/><path d="M274 141h50v55h-50m-8 7h65m-57 0v32m50-32v32" fill="#b99c75" stroke="#977b5c" stroke-width="6"/>
  </g>
  <g v-else-if="setting==='beach'">
    <rect width="600" height="400" fill="#c3e0dc"/><circle cx="67" cy="48" r="26" fill="#f6d584"/><path d="M0 126Q120 108 250 130T600 118V292H0Z" fill="#92c8ca"/><path d="M0 208Q180 194 300 221T600 207V400H0Z" fill="#edd7ad"/>
    <path d="M0 187q68-19 144 2t149 0 149 0 158 0M32 153h65m256 0h56m97 17h54" fill="none" stroke="#d8eee0" stroke-width="5"/>
    <path d="M300 39V164" stroke="#b7936b" stroke-width="6"/><path d="M229 43q71-81 142 0Z" :fill="sceneId==='beach-picnic'?'#d9a59b':'#9fbcad'"/><path d="M300 1v42" stroke="#f8edcb" stroke-width="5"/>
    <path d="M167 245h98l-22 28h-57Z" fill="#c29a71"/><path d="M213 245v-61l39 48h-39" fill="#f7edcf" stroke="#a99170" stroke-width="3"/>
    <path d="m52 348 7-8 9 9m290 15 10-6 12 5m-11-72 7-5 7 5m125 55 9-6 7 6" fill="none" stroke="#cfb588" stroke-width="3"/><path v-if="sceneId==='beach-picnic'" d="M232 302h132l25 67H208Z" fill="#e4bb9a" opacity=".7"/>
  </g>
  <g v-else-if="setting==='garden'">
    <rect width="600" height="400" fill="#d5dfbd"/><path d="M20 235V25h560v210M20 25l280 100L580 25M300 125v110M20 125h560" fill="none" stroke="#f1f0d5" stroke-width="10"/>
    <path d="M0 270Q150 240 300 268T600 264V400H0Z" fill="#b3c594"/><path d="M215 400 267 231h68l60 169Z" fill="#e1d4ad"/>
    <path d="M41 120h123v12H41Z" fill="#b89568"/><path d="M53 132v126m100-126v126" stroke="#9f835c" stroke-width="8"/>
    <path d="M40 262h126v16H40Zm395-13h118v16H435Z" fill="#c39f72"/><path d="M51 276v38m103-38v38m293-49v46m94-46v46" stroke="#9d805a" stroke-width="7"/>
    <path d="M432 79h30l-5 29h-20Z" fill="#cda47d"/><path d="M447 80V49m0 13q-26 0-22-19 18 0 22 19m0 4q23 0 25-18-23-1-25 18" fill="#8bab7c" stroke="#87a477" stroke-width="3"/>
    <path d="M25 350h136M444 350h137" stroke="#93ad7a" stroke-width="8" stroke-linecap="round"/>
  </g>
  <g v-else-if="setting==='kitchen'">
    <rect width="600" height="400" fill="#e9e5d2"/><path d="M0 277H600V400H0Z" fill="#dfc8a6"/><path d="M0 300H600m-600 49H600M80 277l-35 123m200-123-10 123m200-123 25 123" stroke="#c9b18d" opacity=".6"/>
    <path d="M40 123h125v13H40Zm394 0h125v13H434Z" fill="#b69871"/><path d="M58 138v15m87-15v15m306-15v15m89-15v15" stroke="#a58a67" stroke-width="6"/>
    <path d="M0 202h170v66H0Zm431 0h169v66H431Z" fill="#a8baa4"/><path d="M0 202h170m261 0h169" stroke="#e3d7b6" stroke-width="10"/><path d="M84 212v47m430-47v47" stroke="#7f997d" stroke-width="3"/>
    <path d="M210 250h180v18H210Z" fill="#c8a575"/><path d="M229 268v90m142-90v90" stroke="#a8885f" stroke-width="9"/>
    <rect x="239" y="28" width="122" height="87" rx="3" fill="#b8d1c6" stroke="#f5edcf" stroke-width="9"/><path d="M300 30v81m-57-40h115" stroke="#f5edcf" stroke-width="5"/>
    <path d="M23 36h113v100" fill="none" stroke="#cbb68f" stroke-width="4"/><path d="M27 38v16m25-16v16m25-16v16" stroke="#94ac8b" stroke-width="4"/>
  </g>
</template>
