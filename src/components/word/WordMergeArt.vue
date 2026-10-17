<script setup lang="ts">
import ExpandedWordArt from './ExpandedWordArt.vue'
import type { MergeWord } from '@/features/wordMerge/catalog'
defineProps<{ word: MergeWord }>()
const originalLengths: Record<string, number> = { coffee: 5, garden: 5, bakery: 5, juice: 4, clothes: 4, paper: 4, pottery: 4, kitchen: 4 }
</script>

<template>
  <ExpandedWordArt v-if="word.level >= (originalLengths[word.theme] || 0)" :word="word" />
  <svg v-else viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="merge-art">
    <ellipse cx="50" cy="84" rx="29" ry="5" fill="#60472F" opacity=".1" />
    <g stroke="#624633" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="word.theme === 'coffee'">
        <g v-if="word.level === 0" transform="rotate(-28 50 50)">
          <ellipse cx="50" cy="51" rx="20" ry="29" fill="#9C6345" />
          <path d="M53 24C35 45 63 54 47 78" stroke="#F5CD9C" stroke-width="4" />
          <path d="M40 30C29 45 33 59 39 67" stroke="#BD8D63" />
        </g>
        <g v-else-if="word.level === 1">
          <path d="M30 20H70L67 32L74 78Q50 88 26 78L33 32Z" fill="#D8AA72" />
          <path d="M30 20H70V28H30Z" fill="#8D6348" />
          <path d="M33 33H67M32 72H68" stroke="#B18453" />
          <rect x="33" y="43" width="34" height="22" rx="5" fill="#FFF3DC" />
          <ellipse cx="50" cy="54" rx="6" ry="8" fill="#9C6345" transform="rotate(30 50 54)" />
          <path d="M52 48L48 60" stroke="#FFF3DC" stroke-width="2" />
        </g>
        <g v-else-if="word.level === 2">
          <rect x="26" y="22" width="48" height="57" rx="8" fill="#86AEA0" />
          <path d="M28 41H72V65H28" fill="#D9E6D5" />
          <path d="M44 42V48H56V42M39 72H62" />
          <circle cx="61" cy="32" r="3" fill="#E7C57D" />
          <path d="M40 53H57V61Q48 70 40 61Z" fill="#FFF6E5" />
          <path d="M57 54H62Q66 61 57 61M22 80H78" />
        </g>
        <g v-else-if="word.level === 3">
          <path d="M30 34H70L64 78Q50 83 36 78Z" fill="#F1D2A1" />
          <path d="M33 50H67L65 67H35Z" fill="#AB7353" />
          <path d="M26 32H74V39H26Z" fill="#F9F2E5" />
          <path d="M32 25H68L72 32H28Z" fill="#F9F2E5" />
          <path d="M44 14Q40 9 44 5M57 15Q61 10 57 5" stroke="#BBA88D" />
          <circle cx="50" cy="59" r="5" fill="#F1D2A1" stroke="none" />
        </g>
        <g v-else>
          <ellipse cx="49" cy="79" rx="32" ry="6" fill="#CFDCCF" />
          <path d="M69 44H77C93 44 86 66 67 64" stroke="#729C8B" stroke-width="7" />
          <path d="M25 39H71V59Q69 78 48 78Q27 76 25 59Z" fill="#A8C9B9" />
          <ellipse cx="48" cy="40" rx="23" ry="6" fill="#7A4F38" />
          <path d="M36 22Q29 14 36 7M50 24Q43 15 50 6M63 22Q57 15 63 10" stroke="#BBA88D" />
          <path d="M35 51V61" stroke="#DCE9D9" stroke-width="4" />
        </g>
      </template>
      <template v-else-if="word.theme === 'garden'">
        <g v-if="word.level === 0">
          <path d="M50 26C75 40 74 74 50 79C26 74 26 40 50 26Z" fill="#B48A56" />
          <path d="M49 38Q40 58 50 71" stroke="#EDD2A4" stroke-width="4" />
          <path d="M65 25L68 17M75 34L84 31" stroke="#95B481" />
        </g>
        <g v-else-if="word.level < 3">
          <path d="M28 59H73L67 81H34Z" fill="#CD906C" />
          <path d="M25 57H76V64H25Z" fill="#E7B090" />
          <path d="M50 56V28" stroke="#6D8C4D" stroke-width="4" />
          <path d="M49 43C29 45 26 27 27 27C44 25 51 32 49 43Z" fill="#91B879" />
          <path d="M51 34C72 36 76 15 75 15C57 15 49 25 51 34Z" fill="#658F5E" />
          <template v-if="word.level === 2">
            <path d="M51 54C72 58 80 40 79 40C60 36 52 42 51 54Z" fill="#91B879" />
            <path d="M50 28C33 24 37 10 38 10C50 12 54 16 50 28Z" fill="#91B879" />
          </template>
        </g>
        <g v-else-if="word.level === 3">
          <path d="M49 79V42M49 66Q64 51 76 57Q74 72 49 70M49 73Q32 54 24 63Q24 77 49 78" fill="#8CB47A" stroke="#658F5E" />
          <path d="M49 40C22 49 20 28 35 25C23 9 48 7 50 23C54 6 78 14 67 28C84 39 66 55 53 41Z" fill="#F2B38F" />
          <circle cx="50" cy="33" r="9" fill="#E6BF5E" />
        </g>
        <g v-else>
          <path d="M50 81L31 40M50 81L69 37M50 81V31" stroke="#71965F" stroke-width="4" />
          <path d="M22 51L50 83L78 51L50 64Z" fill="#EBD5AA" />
          <g fill="#F2B38F"><circle cx="29" cy="30" r="14" /><circle cx="69" cy="30" r="14" /></g>
          <circle cx="50" cy="23" r="15" fill="#EACA73" />
          <g fill="#CF855D" stroke="none"><circle cx="29" cy="30" r="5" /><circle cx="69" cy="30" r="5" /><circle cx="50" cy="23" r="5" /></g>
          <path d="M38 74H62L56 83H44Z" fill="#B27753" />
        </g>
      </template>
      <template v-else-if="word.theme === 'bakery'">
        <g v-if="word.level === 0">
          <path d="M31 20H69L65 32L73 80H27L35 32Z" fill="#E8D9B3" />
          <path d="M31 20H69V29H31Z" fill="#E7C279" />
          <rect x="34" y="43" width="32" height="25" rx="4" fill="#FFFAE9" />
          <path d="M50 62V48M50 52L43 47M50 57L43 52M50 52L57 47M50 57L57 52" stroke="#BC9458" />
        </g>
        <g v-else-if="word.level === 1">
          <path d="M21 64C17 40 36 33 50 35C69 28 84 48 78 65Q55 82 21 64Z" fill="#F2D6A6" />
          <path d="M26 61Q39 67 47 64M59 46Q67 44 71 53" stroke="#D1AB76" />
          <path d="M18 78H81" stroke="#AA8E6A" />
        </g>
        <g v-else-if="word.level === 2">
          <path d="M20 62C13 43 33 25 59 29C80 31 87 48 79 67Q47 88 20 62Z" fill="#DBA25B" />
          <path d="M32 39L41 54M48 34L57 50M64 37L72 51" stroke="#FFDE9B" stroke-width="6" />
          <path d="M27 68Q51 78 73 64" stroke="#BC8348" />
        </g>
        <g v-else-if="word.level === 3">
          <path d="M28 77V48C14 30 28 19 50 21C72 19 87 30 73 48V77Z" fill="#D9A163" />
          <path d="M35 69V44C23 32 34 28 50 29C67 28 77 33 66 44V69Z" fill="#F7DAA3" />
          <rect x="43" y="43" width="18" height="14" rx="3" fill="#EFBD51" stroke="#DDA449" />
        </g>
        <g v-else>
          <path d="M19 64L51 25L82 63L51 81Z" fill="#DEAD72" />
          <path d="M19 56L51 20L82 55L51 70Z" fill="#F2D09A" />
          <path d="M22 59L30 57L36 65L43 63L51 71L60 65L67 67L78 59" stroke="#86A363" stroke-width="6" />
          <path d="M26 68L51 82L75 68" stroke="#E8B560" stroke-width="5" />
          <path d="M35 46L39 45M51 36L53 37M58 54L62 52" stroke="#BE905A" />
        </g>
      </template>
      <template v-else-if="word.theme === 'juice'">
        <g v-if="word.level === 0"><circle cx="50" cy="54" r="27" fill="#EBA54F" /><path d="M50 26Q47 15 54 12M52 23Q70 8 75 20Q67 31 52 23" fill="#91AC6E" /><path d="M31 48Q28 60 36 68" stroke="#F9CC82" stroke-width="4" /><g stroke="none" fill="#C58D45"><circle cx="61" cy="56" r="1.5" /><circle cx="58" cy="67" r="1.5" /><circle cx="70" cy="49" r="1.5" /></g></g>
        <g v-else-if="word.level === 1"><path d="M19 34C34 15 70 20 80 43L29 79C19 70 14 48 19 34Z" fill="#F3BE68" /><path d="M24 36C39 25 62 26 73 41L29 71C20 59 20 46 24 36Z" fill="#F6D693" /><path d="M26 37L33 68M37 30L42 61M49 29L53 53M62 33L63 46" stroke="#FFF1D4" stroke-width="3" /></g>
        <g v-else-if="word.level === 2"><path d="M28 28H65L71 78H24Z" fill="#F1BB61" /><path d="M65 37H74Q87 37 81 59L69 63" stroke="#C89859" stroke-width="5" /><ellipse cx="47" cy="28" rx="19" ry="5" fill="#E2A246" /><path d="M31 40L29 67" stroke="#FFDC9A" stroke-width="5" /><circle cx="51" cy="56" r="10" fill="#F7D698" /><path d="M43 57H59M51 48V65" stroke="#EAB15C" /></g>
        <g v-else><path d="M27 23H74L67 78Q50 86 34 78Z" fill="#E3E9DF" /><path d="M31 49H70L65 75Q51 81 36 75Z" fill="#EFC36C" stroke="#C8A064" /><path d="M38 30L40 43M38 53L42 71" stroke="#FFF9E6" stroke-width="4" /><path d="M58 48L65 12H72" stroke="#719080" stroke-width="4" /></g>
      </template>
      <template v-else-if="word.theme === 'clothes'">
        <g v-if="word.level === 0"><path d="M51 81V50M51 72L28 57M51 62L72 45" stroke="#9C7954" stroke-width="4" /><path d="M26 58L20 49H40L36 59M48 51L39 43H63L59 51M69 46L62 39H82L78 47" fill="#9FAD79" /><g fill="#F9F4E5"><path d="M22 49C8 45 12 28 23 29C22 15 43 18 39 31C52 39 41 52 33 49Z" /><path d="M41 42C31 32 42 22 48 25C47 10 68 14 65 27C76 30 70 47 59 43Z" /><path d="M62 37C56 22 71 19 74 24C83 14 96 32 83 37C89 48 73 52 69 42Z" /></g></g>
        <g v-else-if="word.level === 1"><circle cx="48" cy="49" r="28" fill="#A9BBC5" /><path d="M25 36Q44 35 66 62M20 48Q45 45 59 74M31 27Q56 31 74 51M36 22Q33 45 69 67M56 22Q39 43 47 77M71 34Q48 41 32 71M75 55Q86 56 78 79H92" stroke="#728D9D" /></g>
        <g v-else-if="word.level === 2"><path d="M23 25H70L78 75H28Z" fill="#A9BBC5" /><path d="M31 25L35 73M45 25L49 74M59 25L63 75M24 39H72M26 52H74M28 65H76" stroke="#DCE5E1" stroke-width="4" /><path d="M28 76L31 83M40 76L43 83M53 76L55 83M66 76L69 83" stroke="#728D9D" /></g>
        <g v-else><path d="M37 23L24 29L13 50L27 58L33 46V81H69V46L75 58L88 50L77 29L64 23Z" fill="#B2C8CD" /><path d="M37 23L50 36L64 23M50 36V80M38 27L43 40L50 36L58 40L64 27" fill="#E9EEE7" /><path d="M58 46H65V56H58Z" fill="#D3DFDA" /><g fill="#647E86" stroke="none"><circle cx="51" cy="48" r="1.5" /><circle cx="51" cy="59" r="1.5" /><circle cx="51" cy="70" r="1.5" /></g></g>
      </template>
      <template v-else-if="word.theme === 'paper'">
        <g v-if="word.level < 2"><path d="M28 16H62L77 31V80H28Z" fill="#FFF6E0" /><path d="M62 16V31H77" fill="#E3CDAA" /><template v-if="word.level === 0"><path d="M38 42H65M38 54H65M38 66H55" stroke="#C5B7A0" /></template><template v-else><path d="M53 68V46M53 61L41 54M53 57L63 49" stroke="#88A273" /><path d="M53 47C37 49 34 37 44 33C37 21 55 20 57 32C69 27 76 41 64 47Z" fill="#E6A98A" /><circle cx="53" cy="37" r="5" fill="#E7C176" /></template></g>
        <g v-else><path d="M24 29L49 19L77 29V79H24Z" fill="#F3DDC5" /><path d="M24 29H77V79H24Z" fill="#FFF2DB" /><path d="M49 29V79" stroke="#C4A184" /><path d="M32 42H41M32 52H41M32 62H41" stroke="#B89677" /><template v-if="word.level === 3"><path d="M55 46C54 35 65 37 65 42C73 35 78 47 65 56Z" fill="#D99588" /><path d="M56 65H70" stroke="#A78371" /></template><template v-else><circle cx="64" cy="47" r="8" fill="#E6BD72" /><path d="M57 65H70" stroke="#A78371" /></template></g>
      </template>
      <template v-else-if="word.theme === 'pottery'">
        <g v-if="word.level === 0"><path d="M23 64L29 39L47 27L72 39L79 66L54 79Z" fill="#BF967C" /><path d="M29 39L50 49L72 39M50 49L54 79M23 64L50 49" stroke="#996F58" /></g>
        <g v-else><path d="M36 28H65V40C84 45 83 73 67 80H34C17 73 17 46 36 40Z" :fill="word.level === 1 ? '#C79978' : word.level === 2 ? '#E1C59D' : '#98B6A5'" /><ellipse cx="50" cy="28" rx="16" ry="5" :fill="word.level === 3 ? '#6D8D7C' : '#A17C59'" /><path d="M33 48Q28 59 33 69" stroke="#F3DEC0" stroke-width="4" /><path v-if="word.level === 3" d="M28 59H73M32 71H69M32 54L40 65L49 54L58 65L67 54" stroke="#E4EBDC" /><path v-else-if="word.level === 2" d="M38 49H66M38 61H67" stroke="#C4A780" /></g>
      </template>
      <template v-else-if="word.theme === 'kitchen'">
        <g v-if="word.level < 2"><path d="M27 37C31 22 58 19 68 35C86 45 78 72 59 77C38 88 15 69 23 49Z" :fill="word.level === 0 ? '#C3A174' : '#F1D68E'" /><path d="M33 35Q28 46 30 55" stroke="#FAE5AF" stroke-width="4" /><g v-if="word.level === 0" stroke="none" fill="#97744D"><ellipse cx="53" cy="40" rx="3" ry="2" /><ellipse cx="43" cy="62" rx="3" ry="2" /><ellipse cx="66" cy="57" rx="3" ry="2" /></g></g>
        <g v-else-if="word.level === 2"><ellipse cx="57" cy="59" rx="23" ry="27" fill="#E1BD7D" transform="rotate(30 57 59)" /><ellipse cx="48" cy="49" rx="23" ry="27" fill="#F6DD9A" transform="rotate(30 48 49)" /><ellipse cx="47" cy="47" rx="17" ry="20" stroke="#ECD08C" transform="rotate(30 47 47)" /></g>
        <g v-else><path d="M28 24H73L69 39L77 79H22L30 39Z" fill="#DCC083" /><path d="M28 24H73V32H28Z" fill="#A98A58" /><rect x="28" y="44" width="41" height="26" rx="5" fill="#FFF0C7" /><ellipse cx="43" cy="56" rx="10" ry="13" fill="#E7BC60" transform="rotate(-24 43 56)" /><ellipse cx="55" cy="59" rx="9" ry="11" fill="#F0CD7D" transform="rotate(27 55 59)" /><path d="M40 50L47 61M53 53L58 62" stroke="#D4A650" /></g>
      </template>
    </g>
  </svg>
</template>

<style scoped>
.merge-art { width: 100%; height: 100%; display: block; overflow: visible; }
</style>
