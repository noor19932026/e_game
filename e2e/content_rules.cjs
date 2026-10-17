const {readFileSync}=require('node:fs')
const path=require('node:path')
const ts=require('typescript')
const assert=require('node:assert/strict')
const test=require('node:test')
const mod={exports:{}}
new Function('module','exports',ts.transpileModule(readFileSync(path.join(__dirname,'../src/features/wordMerge/content.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod,mod.exports)
const c=mod.exports
test('expanded scheduling preserves a migrated current lesson at every old round and introduces new content next',()=>{
 for(const legacy of [2,3]) for(const round of [1,2,3,4,7,27,1000000]) {
  const from=round+1,total=18
  assert.ok(c.validContentSchedule(from,round))
  assert.equal(c.scheduledIndex(round,from,legacy,total),(round-1)%legacy)
  assert.equal(c.scheduledIndex(round+1,from,legacy,total),legacy)
  for(const completed of [round-1,round,round+1,round+23]) {
   const counts=c.completedLessonCounts(completed,from,legacy,total)
   assert.equal(counts.reduce((sum,n)=>sum+n,0),completed)
   for(let i=0;i<total;i++) assert.ok(Number.isSafeInteger(counts[i])&&counts[i]>=0)
   const expected=Array(total).fill(0)
   if(completed<100) for(let i=1;i<=completed;i++) expected[c.scheduledIndex(i,from,legacy,total)]++
   if(completed<100) assert.deepEqual(counts,expected)
  }
 }
})
test('new profiles traverse all expanded lessons with exact historical counts, including long-running saves',()=>{
 for(const total of [12,18,24]) for(const completed of [0,1,3,total,total+7,1000000]) {
  const counts=c.completedLessonCounts(completed,0,3,total)
  assert.equal(counts.reduce((sum,n)=>sum+n,0),completed)
  assert.equal(c.scheduledIndex(total+1,0,3,total),0)
  for(let i=0;i<total;i++) assert.equal(counts[i],Math.floor(completed/total)+Number(i<completed%total))
 }
 for(const from of [-1,1,1.5,NaN,Infinity,9]) assert.equal(c.validContentSchedule(from,3),false)
})
