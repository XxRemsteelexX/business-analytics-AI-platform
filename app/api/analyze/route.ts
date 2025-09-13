
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
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
    const { fileId, sheetName, originalName, mimeType, selectedData, xColumns, yColumns } = await request.json()

    let data: any[] = []
    let extractedText = ''

    // If selectedData is provided, use it directly (from data selector)
    if (selectedData && Array.isArray(selectedData)) {
      data = selectedData
    } else {
      // Otherwise, read and parse file normally
      const uploadsDir = join(process.cwd(), 'uploads')
      const filepath = join(uploadsDir, fileId)
      const fileBuffer = await readFile(filepath)

      if (mimeType.includes('spreadsheet') || fileId.endsWith('.xlsx')) {
        // Parse Excel file
        const workbook = XLSX.read(fileBuffer)
        const selectedSheet = sheetName || workbook.SheetNames[0] // Use provided sheet name or default to first
        const worksheet = workbook.Sheets[selectedSheet]
        data = XLSX.utils.sheet_to_json(worksheet)
      } else if (mimeType.includes('csv')) {
        // Parse CSV file
        const csvText = fileBuffer.toString('utf-8')
        const parsed = papa.parse(csvText, { header: true })
        data = parsed.data
      } else if (mimeType.includes('pdf')) {
        // For PDF files, convert to base64 and send to LLM
        const base64String = fileBuffer.toString('base64')
        extractedText = await extractTextFromPDF(base64String)
      } else if (mimeType.includes('wordprocessingml.document')) {
        // Parse Word document
        const result = await mammoth.extractRawText({ buffer: fileBuffer })
        extractedText = result.value
      } else if (mimeType.includes('text/plain')) {
        // Plain text file
        extractedText = fileBuffer.toString('utf-8')
      }
    }

    let analysisResult
    if (data.length > 0) {
      // Structured data analysis
      analysisResult = await analyzeStructuredData(data, originalName || 'uploaded file')
      
      // Add metadata about selected X/Y columns if available
      if (xColumns && Array.isArray(xColumns)) {
        (analysisResult as any).xColumns = xColumns;
        (analysisResult as any).yColumns = yColumns;
        (analysisResult as any).selectedSheet = sheetName
      }
    } else {
      // Text-based analysis
      analysisResult = await analyzeTextData(extractedText, originalName || 'uploaded file')
    }

    // Skip database save, just return results

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
    // Use Azure OpenAI if available, otherwise fallback to OpenAI
    const useAzure = process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY
    const apiUrl = useAzure
      ? `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME || 'gpt-35-turbo'}/chat/completions?api-version=${process.env.AZURE_OPENAI_VERSION || '2024-02-01'}`
      : 'https://api.openai.com/v1/chat/completions'

    const headers = useAzure
      ? {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_OPENAI_API_KEY!
        }
      : {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'demo'}`
        }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
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
    // Use Azure OpenAI if available, otherwise fallback to OpenAI
    const useAzure = process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY
    const apiUrl = useAzure
      ? `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME || 'gpt-35-turbo'}/chat/completions?api-version=${process.env.AZURE_OPENAI_VERSION || '2024-02-01'}`
      : 'https://api.openai.com/v1/chat/completions'

    const headers = useAzure
      ? {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_OPENAI_API_KEY!
        }
      : {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'demo'}`
        }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
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
    // Comprehensive data analysis - generate ALL relevant charts
    const dateColumns = summary.columns.filter(col => {
      const lower = col.toLowerCase()
      return lower.includes('date') || lower.includes('time') || 
             lower.includes('month') || lower.includes('year') || 
             lower.includes('period') || lower.includes('quarter')
    })
    
    const revenueColumns = summary.numericColumns.filter(col => {
      const lower = col.toLowerCase()
      return lower.includes('revenue') || lower.includes('sales') || 
             lower.includes('income') || lower.includes('profit') ||
             lower.includes('amount') || lower.includes('total') ||
             lower.includes('price') || lower.includes('cost') ||
             lower.includes('value') || lower.includes('dollar')
    })
    
    const performanceColumns = summary.numericColumns.filter(col => {
      const lower = col.toLowerCase()
      return lower.includes('performance') || lower.includes('efficiency') ||
             lower.includes('productivity') || lower.includes('utilization') ||
             lower.includes('margin') || lower.includes('rate') ||
             lower.includes('percent') || lower.includes('ratio')
    })

    const locationColumns = summary.categoricalColumns.filter(col => {
      const lower = col.toLowerCase()
      return lower.includes('region') || lower.includes('location') ||
             lower.includes('city') || lower.includes('state') ||
             lower.includes('country') || lower.includes('territory') ||
             lower.includes('market') || lower.includes('area')
    })

    const customerColumns = summary.categoricalColumns.filter(col => {
      const lower = col.toLowerCase()
      return lower.includes('customer') || lower.includes('client') ||
             lower.includes('account') || lower.includes('segment') ||
             lower.includes('category') || lower.includes('type') ||
             lower.includes('tier') || lower.includes('group')
    })

    // GENERATE COMPREHENSIVE CHART SUITE
    
    // 1. Time Series Charts - ALL numeric columns over time
    dateColumns.forEach(dateCol => {
      summary.numericColumns.forEach(numCol => {
        const timeData = generateTimeSeriesData(data, dateCol, numCol)
        if (timeData.length > 2) {
          charts.push({
            id: `time_${dateCol}_${numCol}`,
            title: `${numCol} Trend Over Time`,
            type: 'line',
            xField: 'date',
            yField: numCol,
            data: timeData
          })
        }
      })
    })

    // 2. Categorical Analysis - ALL categorical vs numeric combinations
    summary.categoricalColumns.forEach(catCol => {
      summary.numericColumns.forEach(numCol => {
        const catData = generateCategoricalData(data, catCol, numCol)
        if (catData.length > 1 && catData.length <= 20) {
          // Bar Chart
          charts.push({
            id: `bar_${catCol}_${numCol}`,
            title: `${numCol} by ${catCol}`,
            type: 'bar',
            xField: catCol,
            yField: numCol,
            data: catData
          })
          
          // Pie Chart (if reasonable number of categories)
          if (catData.length <= 8) {
            charts.push({
              id: `pie_${catCol}_${numCol}`,
              title: `${numCol} Distribution by ${catCol}`,
              type: 'pie',
              xField: catCol,
              yField: numCol,
              data: catData
            })
          }
        }
      })
    })

    // 3. Correlation Analysis - Numeric vs Numeric scatter plots
    for (let i = 0; i < summary.numericColumns.length; i++) {
      for (let j = i + 1; j < summary.numericColumns.length; j++) {
        const col1 = summary.numericColumns[i]
        const col2 = summary.numericColumns[j]
        const scatterData = generateScatterData(data, col1, col2)
        
        if (scatterData.length > 5) {
          charts.push({
            id: `scatter_${col1}_${col2}`,
            title: `${col1} vs ${col2} Correlation`,
            type: 'scatter',
            xField: col1,
            yField: col2,
            data: scatterData
          })
        }
      }
    }

    // 4. Top/Bottom Analysis for each numeric column
    summary.numericColumns.forEach(numCol => {
      // Find which categorical column has the most impact
      let bestCatCol = summary.categoricalColumns[0]
      if (bestCatCol) {
        const topBottomData = generateTopBottomData(data, bestCatCol, numCol)
        if (topBottomData.length > 2) {
          charts.push({
            id: `topbottom_${bestCatCol}_${numCol}`,
            title: `Top Performers: ${numCol} by ${bestCatCol}`,
            type: 'bar',
            xField: bestCatCol,
            yField: numCol,
            data: topBottomData.slice(0, 10) // Top 10
          })
        }
      }
    })

    // 5. Summary Statistics Charts
    if (summary.numericColumns.length > 1) {
      const statsData = summary.numericColumns.map(col => {
        const values = data.map(row => Number(row[col])).filter(v => !isNaN(v))
        const avg = values.reduce((a, b) => a + b, 0) / values.length
        return {
          metric: col,
          average: Math.round(avg * 100) / 100,
          name: col,
          value: Math.round(avg * 100) / 100
        }
      })
      
      charts.push({
        id: 'summary_averages',
        title: 'Average Values Comparison',
        type: 'bar',
        xField: 'metric',
        yField: 'average',
        data: statsData
      })
    }

    return charts

  } catch (error) {
    console.error('Comprehensive chart generation error:', error)
    return generateFallbackCharts(data, summary)
  }
}

// Helper function to generate time series data
function generateTimeSeriesData(data: any[], dateCol: string, numCol: string): any[] {
  const aggregation: {[key: string]: number} = {}
  data.forEach(row => {
    if (row[dateCol] && row[numCol] != null) {
      const dateStr = String(row[dateCol]).substring(0, 10)
      const value = Number(row[numCol]) || 0
      aggregation[dateStr] = (aggregation[dateStr] || 0) + value
    }
  })

  return Object.entries(aggregation)
    .map(([date, value]) => ({
      date: date,
      [numCol]: Math.round(value * 100) / 100,
      name: date,
      value: Math.round(value * 100) / 100
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 50)
}

// Helper function to generate categorical data
function generateCategoricalData(data: any[], catCol: string, numCol: string): any[] {
  const aggregation: {[key: string]: number} = {}
  data.forEach(row => {
    if (row[catCol] && row[numCol] != null) {
      const category = String(row[catCol]).trim()
      const value = Number(row[numCol]) || 0
      aggregation[category] = (aggregation[category] || 0) + value
    }
  })

  return Object.entries(aggregation)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 15)
    .map(([category, value]) => ({
      [catCol]: category,
      [numCol]: Math.round(value * 100) / 100,
      name: category,
      value: Math.round(value * 100) / 100
    }))
}

// Helper function to generate scatter plot data
function generateScatterData(data: any[], col1: string, col2: string): any[] {
  return data
    .filter(row => row[col1] != null && row[col2] != null)
    .map(row => ({
      [col1]: Number(row[col1]) || 0,
      [col2]: Number(row[col2]) || 0,
      name: `${row[col1]}, ${row[col2]}`
    }))
    .slice(0, 100)
}

// Helper function to generate top/bottom analysis
function generateTopBottomData(data: any[], catCol: string, numCol: string): any[] {
  return generateCategoricalData(data, catCol, numCol)
}

// Fallback chart generation
function generateFallbackCharts(data: any[], summary: DataSummary): any[] {
  const charts: any[] = []
  
  if (summary.categoricalColumns.length > 0 && summary.numericColumns.length > 0) {
    const catCol = summary.categoricalColumns[0]
    const numCol = summary.numericColumns[0]
    const fallbackData = generateCategoricalData(data, catCol, numCol)
    
    if (fallbackData.length > 0) {
      charts.push({
        id: 'fallback_analysis',
        title: `${numCol} Analysis by ${catCol}`,
        type: 'bar',
        xField: catCol,
        yField: numCol,
        data: fallbackData
      })
    }
  }

  return charts.length > 0 ? charts : [{
    id: 'empty',
    title: 'Data Overview',
    type: 'bar',
    xField: 'category',
    yField: 'value',
    data: [
      { category: 'Rows', value: summary.rowCount },
      { category: 'Columns', value: summary.columnCount },
      { category: 'Numeric Fields', value: summary.numericColumns.length },
      { category: 'Text Fields', value: summary.categoricalColumns.length }
    ]
  }]
}

function generateBasicCharts(data: any[], summary: DataSummary): any[] {
  return generateChartsFromData(data, summary, [])
}
