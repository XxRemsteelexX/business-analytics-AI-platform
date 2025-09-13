
/**
 * api/upload/route.ts (drop‑in example)
 * Saves the uploaded file with original extension; returns sheet names for Excel.
 */
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file') as unknown as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
    const arrayBuf = await file.arrayBuffer()
    const buf = Buffer.from(arrayBuf)

    const uploadsDir = join(process.cwd(), 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const original = file.name || 'upload.xlsx'
    const ext = (original.includes('.') ? original.split('.').pop() : 'bin')
    const id = `${randomUUID()}_${original}`
    const full = join(uploadsDir, id)

    await writeFile(full, buf)

    let sheetNames: string[] = []
    if ((file.type && file.type.includes('spreadsheet')) || (ext && /xlsx|xlsm|xlsb|xls/i.test(ext))) {
      try {
        const wb = XLSX.read(buf)
        sheetNames = wb.SheetNames || []
      } catch { /* ignore */ }
    }

    return NextResponse.json({
      id,
      originalName: original,
      mimeType: file.type || 'application/octet-stream',
      size: buf.length,
      createdAt: new Date(),
      sheetNames,
      hasMultipleSheets: sheetNames.length > 1
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
