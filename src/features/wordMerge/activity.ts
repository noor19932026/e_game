export type ActivityMode = 'guide' | 'reading' | 'listening'
export interface ActivityProgress { mode:ActivityMode; helped:boolean; hintOpen:boolean; independent:number; assisted:number }
export function newActivityProgress():ActivityProgress { return {mode:'reading',helped:false,hintOpen:false,independent:0,assisted:0} }
export function validActivityProgress(value:unknown):value is ActivityProgress {
  if (!value || typeof value !== 'object') return false
  const s = value as ActivityProgress
  return ['guide','reading','listening'].includes(s.mode) && typeof s.helped === 'boolean' && typeof s.hintOpen === 'boolean'
    && [s.independent,s.assisted].every(n => Number.isSafeInteger(n) && n >= 0) && (!s.hintOpen || s.helped)
}
export function changeActivityMode(s:ActivityProgress, mode:ActivityMode) {
  if (!['guide','reading','listening'].includes(mode) || mode === s.mode) return false
  s.mode = mode; s.helped = true; s.hintOpen = false; return true
}
export function toggleActivityHint(s:ActivityProgress) { s.hintOpen = !s.hintOpen; if (s.hintOpen) s.helped = true }
export function recordActivityCompletion(s:ActivityProgress) { s[s.helped || s.mode === 'guide' ? 'assisted' : 'independent']++; s.hintOpen = false }
export function resetActivityAttempt(s:ActivityProgress) { s.helped = s.mode === 'guide'; s.hintOpen = false }
