// A migrated player finishes the current classic lesson before entering new content.
// Zero means a fresh profile following the expanded catalogue from its first lesson.
export interface ContentSchedule { contentFrom:number }
export function validContentSchedule(contentFrom:number,round:number) {
  return Number.isSafeInteger(contentFrom) && (contentFrom===0 || contentFrom>=2 && contentFrom<=round+1)
}
export function scheduledIndex(round:number,contentFrom:number,legacyCount:number,totalCount:number) {
  if (contentFrom===0) return (round-1)%totalCount
  if (round<contentFrom) return (round-1)%legacyCount
  return (legacyCount+round-contentFrom)%totalCount
}
export function completedLessonCounts(completedCount:number,contentFrom:number,legacyCount:number,totalCount:number):number[] {
  const counts=Array<number>(totalCount).fill(0)
  function distribute(count:number,period:number,start:number) {
    const cycles=Math.floor(count/period), remainder=count%period
    for(let i=0;i<period;i++) counts[(start+i)%totalCount]! += cycles+Number(i<remainder)
  }
  if(contentFrom===0) distribute(completedCount,totalCount,0)
  else {
    const classic=Math.min(completedCount,contentFrom-1)
    distribute(classic,legacyCount,0)
    distribute(completedCount-classic,totalCount,legacyCount)
  }
  return counts
}
