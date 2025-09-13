
/**
 * lib/table-inference.ts
 * Robust table detection for messy Excel sheets.
 * - infers header row
 * - prunes empty columns
 * - trims trailing footers (e.g., totals/notes)
 * - returns clean rows + header metadata
 */
export type InferredTable = {
  headers: string[]
  rows: any[][]
  headerRowIndex: number
  trimmedFooterRows: number
}

export function inferTableFromGrid(grid: any[][], opts?: { maxHeaderScan?: number }): InferredTable {
  const maxHeaderScan = opts?.maxHeaderScan ?? 30
  if (!grid || grid.length === 0) {
    return { headers: [], rows: [], headerRowIndex: 0, trimmedFooterRows: 0 }
  }

  // 1) pick header row
  let bestIdx = 0
  let bestScore = -1
  for (let i = 0; i < Math.min(grid.length, maxHeaderScan); i++) {
    const row = grid[i] || []
    const vals = row.filter((v: any) => v !== null && v !== "")
    if (vals.length === 0) continue
    const distinct = new Set(vals.map((v: any) => String(v).trim().toLowerCase())).size
    const strings = vals.filter((v: any) => typeof v === "string" && String(v).length < 128).length
    const numeric = vals.filter((v: any) => typeof v === "number").length
    const mostlyStrings = strings >= vals.length * 0.6
    const score = (mostlyStrings ? 1000 : 0) + distinct - numeric * 0.2
    if (score > bestScore) { bestScore = score; bestIdx = i }
  }
  const headerRowIndex = bestIdx
  const headerRow = grid[headerRowIndex] || []

  // 2) identify non-empty columns (in body) to keep
  const body = grid.slice(headerRowIndex + 1)
  const colCount = Math.max(...grid.map(r => (r ? r.length : 0)), 0)
  const keepCols: number[] = []
  for (let c = 0; c < colCount; c++) {
    const hasAny = body.some(r => r && r[c] !== null && r[c] !== "")
    if (hasAny) keepCols.push(c)
  }
  const headers = keepCols.map((c, i) => {
    const raw = headerRow[c]
    const name = String(raw ?? "").trim()
    return name || `column_${i+1}`
  })

  // 3) trim footers: stop when we hit 3 consecutive empty rows
  let trimmedFooterRows = 0
  const pruned: any[][] = []
  let consecutiveEmpties = 0
  for (const r of body) {
    const row = keepCols.map(c => (r ? r[c] : null))
    const allEmpty = row.every(v => v === null || v === "")
    if (allEmpty) consecutiveEmpties += 1
    else consecutiveEmpties = 0
    if (consecutiveEmpties >= 3) break
    pruned.push(row)
  }
  // count how many original body rows we didn't include
  trimmedFooterRows = Math.max(0, body.length - pruned.length)

  return { headers, rows: pruned, headerRowIndex, trimmedFooterRows }
}
