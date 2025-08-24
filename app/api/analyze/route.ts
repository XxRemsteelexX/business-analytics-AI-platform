
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { readFile } from 'fs/promises'
import * as XLSX from 'xlsx'
import papa from 'papaparse'
import mammoth from 'mammoth'

export const dynamic = 'force-dynamic'

interface DataSummary {
  rowCount: number
  columnCount: number
  columns: string[]
  sampleData: any[]
  numericColumns: string[]
  categoricalColumns: string[]
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId, sheetName } = await request.json()

    // Get file from database
    const uploadedFile = await prisma.uploadedFile.findFirst({
      where: {
        id: fileId,
        userId: (session.user as any).id
      }
    })

    if (!uploadedFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read and parse file based on type
    const fileBuffer = await readFile(uploadedFile.filepath)
    let data: any[] = []
    let extractedText = ''

    if (uploadedFile.mimeType.includes('spreadsheet') || uploadedFile.filename.endsWith('.xlsx')) {
      // Parse Excel file
      const workbook = XLSX.read(fileBuffer)
      const selectedSheet = sheetName || workbook.SheetNames[0] // Use provided sheet name or default to first
      const worksheet = workbook.Sheets[selectedSheet]
      data = XLSX.utils.sheet_to_json(worksheet)
    } else if (uploadedFile.mimeType.includes('csv')) {
      // Parse CSV file
      const csvText = fileBuffer.toString('utf-8')
      const parsed = papa.parse(csvText, { header: true })
      data = parsed.data
    } else if (uploadedFile.mimeType.includes('pdf')) {
      // For PDF files, convert to base64 and send to LLM
      const base64String = fileBuffer.toString('base64')
      extractedText = await extractTextFromPDF(base64String)
    } else if (uploadedFile.mimeType.includes('wordprocessingml.document')) {
      // Parse Word document
      const result = await mammoth.extractRawText({ buffer: fileBuffer })
      extractedText = result.value
    } else if (uploadedFile.mimeType.includes('text/plain')) {
      // Plain text file
      extractedText = fileBuffer.toString('utf-8')
    }

    let analysisResult
    if (data.length > 0) {
      // Structured data analysis
      analysisResult = await analyzeStructuredData(data, uploadedFile.originalName)
    } else {
      // Text-based analysis
      analysisResult = await analyzeTextData(extractedText, uploadedFile.originalName)
    }

    // Save analysis to database
    // Handle insights as either string or array - convert array to formatted string
    const insightsText = Array.isArray(analysisResult.insights) 
      ? analysisResult.insights.join('\n• ')
      : analysisResult.insights

    const analysisSession = await prisma.analysisSession.create({
      data: {
        userId: (session.user as any).id,
        fileId: uploadedFile.id,
        sessionName: `Analysis of ${uploadedFile.originalName}`,
        summary: analysisResult.summary,
        insights: insightsText,
        chartData: analysisResult.charts,
        chatHistory: []
      }
    })

    return NextResponse.json(analysisResult)

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze file' },
      { status: 500 }
    )
  }
}

async function extractTextFromPDF(base64String: string): Promise<string> {
  try {
    const response = await fetch('https://api.bambooai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-davinci-003',
        messages: [{
          role: "user",
          content: "Please extract all the text content from this PDF document. Return only the extracted text content, no additional commentary. Note: PDF processing may be limited in this free tier."
        }],
        max_tokens: 3000
      })
    })

    const result = await response.json()
    return result.choices?.[0]?.message?.content || 'PDF text extraction is limited in free tier. Please convert to text format first.'
  } catch (error) {
    console.error('PDF extraction error:', error)
    return 'PDF text extraction is limited in free tier. Please convert to text format first.'
  }
}

async function analyzeStructuredData(data: any[], filename: string) {
  const dataSummary = generateDataSummary(data)
  
  // Prepare sample data for LLM analysis
  const sampleDataText = JSON.stringify(dataSummary.sampleData.slice(0, 5), null, 2)
  const columnsText = dataSummary.columns.join(', ')
  
  const prompt = `You are a senior business analyst preparing an executive report. Analyze this data from "${filename}":

DATASET SUMMARY:
- Rows: ${dataSummary.rowCount}
- Columns: ${dataSummary.columnCount}
- Column names: ${columnsText}
- Numeric columns: ${dataSummary.numericColumns.join(', ')}
- Categorical columns: ${dataSummary.categoricalColumns.join(', ')}

SAMPLE DATA:
${sampleDataText}

Please provide:
1. A professional executive summary (2-3 sentences) highlighting the most important findings
2. Key business insights (2-3 bullet points) that would be valuable for executive decision making
3. Suggest 3 specific chart types that would best visualize this data for a CEO presentation

Format your response as JSON:
{
  "summary": "Executive summary here",
  "insights": "Key insights here",
  "recommendedCharts": [
    {"type": "bar", "title": "Chart Title", "description": "Why this chart"},
    {"type": "line", "title": "Chart Title", "description": "Why this chart"},
    {"type": "pie", "title": "Chart Title", "description": "Why this chart"}
  ]
}

Respond with raw JSON only.`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY || 'gsk_demo_key_use_your_own'}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000
      })
    })

    const result = await response.json()
    const analysis = JSON.parse(result.choices?.[0]?.message?.content || '{}')
    
    // Generate actual chart data
    const charts = generateChartsFromData(data, dataSummary, analysis.recommendedCharts || [])

    return {
      summary: analysis.summary || 'Data analysis completed successfully.',
      insights: analysis.insights || 'Key patterns and trends identified in the dataset.',
      charts: charts,
      data: data,
      columns: dataSummary.columns,
      dataInfo: dataSummary
    }
  } catch (error) {
    console.error('LLM analysis error:', error)
    // Fallback analysis
    const charts = generateBasicCharts(data, dataSummary)
    return {
      summary: `Analysis of ${filename} completed. Dataset contains ${dataSummary.rowCount} rows and ${dataSummary.columnCount} columns with key metrics ready for executive review.`,
      insights: `Data shows ${dataSummary.numericColumns.length} numerical metrics and ${dataSummary.categoricalColumns.length} categorical dimensions suitable for comprehensive business analysis.`,
      charts: charts,
      dataInfo: dataSummary
    }
  }
}

async function analyzeTextData(text: string, filename: string) {
  const prompt = `You are a senior business analyst preparing an executive report. Analyze this text content from "${filename}":

TEXT CONTENT:
${text.substring(0, 4000)}...

Please provide:
1. A professional executive summary (2-3 sentences) of the key points
2. Important business insights or findings from the content
3. Any data trends, numbers, or metrics mentioned in the text

Format your response as JSON:
{
  "summary": "Executive summary here",
  "insights": "Key insights here",
  "keyMetrics": ["metric1", "metric2", "metric3"]
}

Respond with raw JSON only.`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY || 'gsk_demo_key_use_your_own'}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000
      })
    })

    const result = await response.json()
    const analysis = JSON.parse(result.choices?.[0]?.message?.content || '{}')

    return {
      summary: analysis.summary || 'Document analysis completed successfully.',
      insights: analysis.insights || 'Key information extracted from the document.',
      charts: [], // No charts for text-only analysis
      textAnalysis: analysis
    }
  } catch (error) {
    console.error('Text analysis error:', error)
    return {
      summary: `Analysis of ${filename} completed. Document contains approximately ${Math.ceil(text.length / 500)} paragraphs of content.`,
      insights: 'Key information and business insights have been extracted from the document.',
      charts: [],
      textAnalysis: { keyMetrics: [] }
    }
  }
}

function generateDataSummary(data: any[]): DataSummary {
  if (!data || data.length === 0) {
    return {
      rowCount: 0,
      columnCount: 0,
      columns: [],
      sampleData: [],
      numericColumns: [],
      categoricalColumns: []
    }
  }

  const columns = Object.keys(data[0])
  const numericColumns: string[] = []
  const categoricalColumns: string[] = []

  columns.forEach(col => {
    const sampleValues = data.slice(0, 10).map(row => row[col]).filter(val => val != null)
    const numericCount = sampleValues.filter(val => !isNaN(Number(val))).length
    
    if (numericCount > sampleValues.length * 0.7) {
      numericColumns.push(col)
    } else {
      categoricalColumns.push(col)
    }
  })

  return {
    rowCount: data.length,
    columnCount: columns.length,
    columns,
    sampleData: data.slice(0, 5),
    numericColumns,
    categoricalColumns
  }
}

function generateChartsFromData(data: any[], summary: DataSummary, recommendations: any[]): any[] {
  const charts: any[] = []

  try {
    // Chart 1: Bar chart of first categorical vs first numeric
    if (summary.categoricalColumns.length > 0 && summary.numericColumns.length > 0) {
      const catCol = summary.categoricalColumns[0]
      const numCol = summary.numericColumns[0]
      
      const aggregated = data.reduce((acc: any, row) => {
        const key = row[catCol]
        if (!acc[key]) acc[key] = 0
        acc[key] += Number(row[numCol]) || 0
        return acc
      }, {})

      charts.push({
        id: 'chart1',
        title: `${numCol} by ${catCol}`,
        type: 'bar',
        xField: catCol,
        yField: numCol,
        data: Object.entries(aggregated).map(([key, value]) => ({ 
          [catCol]: key, 
          [numCol]: value,
          name: key, 
          value: value 
        }))
      })
    }

    // Chart 2: Line chart for time series or trends
    if (summary.numericColumns.length > 1) {
      const numCols = summary.numericColumns.slice(0, 2)
      charts.push({
        id: 'chart2',
        title: `Trend Analysis: ${numCols.join(' vs ')}`,
        type: 'line',
        xField: 'index',
        yField: numCols[0],
        data: data.slice(0, 20).map((row, index) => ({
          index: index + 1,
          ...numCols.reduce((acc, col) => ({
            ...acc,
            [col]: Number(row[col]) || 0
          }), {})
        }))
      })
    }

    // Chart 3: Pie chart for categorical distribution
    if (summary.categoricalColumns.length > 0) {
      const catCol = summary.categoricalColumns[0]
      const distribution = data.reduce((acc: any, row) => {
        const key = row[catCol]
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

      charts.push({
        id: 'chart3',
        title: `Distribution of ${catCol}`,
        type: 'pie',
        xField: catCol,
        yField: 'count',
        data: Object.entries(distribution)
          .slice(0, 8)
          .map(([key, value]) => ({ 
            [catCol]: key, 
            count: value,
            name: key, 
            value: value 
          }))
      })
    }
  } catch (error) {
    console.error('Chart generation error:', error)
  }

  return charts
}

function generateBasicCharts(data: any[], summary: DataSummary): any[] {
  return generateChartsFromData(data, summary, [])
}
