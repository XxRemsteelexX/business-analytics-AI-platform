
/**
 * lib/sheet-scoring.ts
 * Score candidate tables; higher = more "relational" (good for charts).
 */
export function scoreTable(rows: Record<string, any>[]): number {
  if (!rows || rows.length === 0) return 0
  const cols = Object.keys(rows[0] ?? {})
  if (cols.length === 0) return 0

  const sample = rows.slice(0, Math.min(200, rows.length))
  const numericScore = cols.reduce((acc, k) => {
    const nums = sample.map(r => r[k]).filter(v => typeof v === "number")
    return acc + (nums.length >= sample.length * 0.3 ? 1 : 0)
  }, 0)

  const widthBonus = cols.length >= 5 ? 1 : 0
  const lengthBonus = rows.length >= 20 ? 1 : 0

  return widthBonus * 10 + lengthBonus * 10 + numericScore
}
