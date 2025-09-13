import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileId, sheetName } = body

    if (!fileId) {
      return NextResponse.json({ error: 'No file ID provided' }, { status: 400 })
    }

    // Read file from uploads directory
    const uploadsDir = join(process.cwd(), 'uploads')
    const filePath = join(uploadsDir, fileId)
    
    try {
      const fileBuffer = await readFile(filePath)
      
      // Parse Excel file
      const workbook = XLSX.read(fileBuffer)
      const sheets = workbook.SheetNames
      
      // Use provided sheetName or first sheet
      const targetSheet = sheetName || sheets[0]
      
      if (!targetSheet) {
        return NextResponse.json({ error: 'No sheets found' }, { status: 400 })
      }

      const worksheet = workbook.Sheets[targetSheet]
      
      // Get raw data as array of arrays 
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      console.log(`Parsed ${targetSheet}: ${rawData.length} raw rows`)
      
      // Always send to AI for analysis - let GPT-3.5 Turbo decide the best approach
      return NextResponse.json({
        rawData: rawData,
        sheetName: targetSheet,
        availableSheets: sheets,
        totalRows: rawData.length,
        needsAIHelp: true
      })

    } catch (fileError) {
      console.error('Error reading file:', fileError)
      return NextResponse.json({ error: 'Failed to read file' }, { status: 404 })
    }

  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}