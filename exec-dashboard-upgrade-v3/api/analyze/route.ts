
/**
 * api/analyze/route.ts (drop‑in example)
 * Demonstrates robust Excel parsing with header inference and sheet scoring.
 * You must adapt imports to your project's path aliases for '@/lib/*' etc.
 */
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import * as XLSX from 'xlsx'
import { inferTableFromGrid } from '@/lib/table-inference'
import { scoreTable } from '@/lib/sheet-scoring'
import { inferColumnRoles } from '@/lib/typing-utils'

export const dynamic = 'force-dynamic'

function rowsToObjects(headers: string[], matrix: any[][]) {
  return matrix.map(r => {
    const obj: Record<string, any> = {}
    headers.forEach((h, i) => { obj[h] = r[i] ?? null })
    return obj
  })
}

export async function POST(request: NextRequest) {
  try {
    const { fileId, sheetName, originalName, mimeType } = await request.json()
    const uploadsDir = join(process.cwd(), 'uploads')
    const filepath = join(uploadsDir, fileId)

    const fileBuffer = await readFile(filepath)

    const workbook = XLSX.read(fileBuffer)
    const candidateSheets = sheetName ? [sheetName] : workbook.SheetNames.slice(0, 8)

    let best = { name: '', score: -1, payload: null as null | any }
    for (const s of candidateSheets) {
      const ws = workbook.Sheets[s]
      const grid = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: null }) as any[][]
      const inferred = inferTableFromGrid(grid)
      const rows = rowsToObjects(inferred.headers, inferred.rows)
      const score = scoreTable(rows)
      if (score > best.score) {
        best = {
          name: s,
          score,
          payload: { inferred, rows }
        }
      }
    }

    const chosen = best.payload
    if (!chosen) {
      return NextResponse.json({ error: 'No tabular data found.' }, { status: 400 })
    }

    const roles = inferColumnRoles(chosen.rows)

    return NextResponse.json({
      status: 'ok',
      sheetChosen: best.name,
      columns: Object.keys(chosen.rows[0] ?? {}),
      data: chosen.rows,
      roles,
      parser: {
        headerRow: chosen.inferred.headerRowIndex,
        trimmedFooters: chosen.inferred.trimmedFooterRows,
      }
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
