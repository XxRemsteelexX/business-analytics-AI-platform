
import { User } from '@prisma/client'

export interface ThompsonUser extends User {
  fullName?: string
}

export interface UploadedFileData {
  id: string
  filename: string
  originalName: string
  size: number
  createdAt: Date
}

export interface AnalysisResult {
  summary: string
  insights: string
  charts: ChartData[]
  executiveSummary: string
}

export interface ChartData {
  id: string
  title: string
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap'
  data: any
  config: any
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  chartData?: ChartData
}

export interface ExcelSheetData {
  sheetName: string
  data: any[]
  columns: string[]
  rowCount: number
}

export interface ProcessedData {
  sheets: ExcelSheetData[]
  summary: {
    totalRows: number
    totalSheets: number
    columns: string[]
    dataTypes: Record<string, string>
  }
}
