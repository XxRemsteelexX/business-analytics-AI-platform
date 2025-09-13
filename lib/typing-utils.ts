
/**
 * lib/typing-utils.ts
 * Lightweight type inference for data columns.
 */
export type ColumnRole = "id" | "category" | "metric" | "date" | "text"

export function inferColumnRoles(rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return {}
  const cols = Object.keys(rows[0])
  const roles: Record<string, ColumnRole> = {}

  const isDateLike = (v: any) => v instanceof Date || (typeof v === "string" && /\d{4}-\d{2}-\d{2}/.test(v))

  for (const c of cols) {
    const sample = rows.map(r => r[c]).filter(v => v !== null && v !== undefined)
    const strCount = sample.filter(v => typeof v === "string").length
    const numCount = sample.filter(v => typeof v === "number").length
    const dateCount = sample.filter(isDateLike).length

    if (dateCount >= sample.length * 0.5) { roles[c] = "date"; continue }
    if (numCount >= sample.length * 0.7) { roles[c] = "metric"; continue }
    if (strCount >= sample.length * 0.7) { roles[c] = "category"; continue }
    roles[c] = "text"
  }

  // heuristic id
  for (const c of cols) {
    if (/^(id|.*_id|customerid)$/i.test(c)) roles[c] = "id"
  }
  return roles
}
