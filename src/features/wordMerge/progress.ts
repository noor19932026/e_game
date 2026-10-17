export interface ShopProgress { xp: number; claimed: string[]; combinations: number }
export const shopGoals = [
  { id: 'first-merge', title: '第一次合成', description: '合成 1 次，领取开店礼', target: 1, reward: 10, kind: 'merges' },
  { id: 'first-order', title: '迎来第一位顾客', description: '交付 1 笔订单', target: 1, reward: 20, kind: 'deliveries' },
  { id: 'little-collector', title: '发现新世界', description: '发现 10 个新物品', target: 10, reward: 25, kind: 'discoveries' },
  { id: 'first-recipe', title: '试试不同材料', description: '完成 1 次组合配方', target: 1, reward: 20, kind: 'combinations' },
  { id: 'regulars', title: '小店有人气', description: '完成 6 笔订单', target: 6, reward: 40, kind: 'deliveries' },
  { id: 'town-collector', title: '街区收藏家', description: '发现 30 个新物品', target: 30, reward: 50, kind: 'discoveries' },
] as const
export function newProgress(): ShopProgress { return { xp: 0, claimed: [], combinations: 0 } }
export function validProgress(value: unknown): value is ShopProgress {
  if (!value || typeof value !== 'object') return false
  const p = value as ShopProgress
  return [p.xp, p.combinations].every(n => Number.isSafeInteger(n) && n >= 0) && Array.isArray(p.claimed)
    && new Set(p.claimed).size === p.claimed.length && p.claimed.every(id => shopGoals.some(g => g.id === id))
}
export function shopLevel(xp: number) { return 1 + Math.floor(Math.sqrt(xp / 15)) }
export function nextLevelXp(xp: number) { return shopLevel(xp) ** 2 * 15 }
