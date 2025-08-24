
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    // Create unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${randomUUID()}.${fileExtension}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Save file
    const filePath = join(uploadsDir, uniqueFilename)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Detect Excel sheets if it's a spreadsheet
    let sheetNames: string[] = []
    if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      try {
        const fileBuffer = await readFile(filePath)
        const workbook = XLSX.read(fileBuffer)
        sheetNames = workbook.SheetNames
      } catch (error) {
        console.error('Error reading Excel sheets:', error)
      }
    }

    // Return file info without database
    return NextResponse.json({
      id: uniqueFilename,
      filename: uniqueFilename,
      originalName: file.name,
      size: file.size,
      createdAt: new Date(),
      sheetNames: sheetNames,
      hasMultipleSheets: sheetNames.length > 1
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
