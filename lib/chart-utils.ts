
// Utility functions for CEO-friendly charts and data formatting

export const THOMPSON_BRAND = {
  navy: '#0b1642',
  blue: '#17296f',
  lime: '#a7ff03',
  text: '#282828',
  paper: '#ffffff',
  panel: '#fafafa',
  gray: '#6c757d'
}

export const CHART_COLORS = [
  THOMPSON_BRAND.lime,
  THOMPSON_BRAND.navy,
  THOMPSON_BRAND.blue,
  '#21759b',
  '#3a3a3a',
  '#60B5FF',
  '#FF9149',
  '#FF9898'
]

// Thompson PMC business-friendly label mapping (from tpmc_helpers.py)
const SUGGESTED_MAP: Record<string, string> = {
  'amt': 'Amount ($)',
  'amount': 'Amount ($)',
  'amount_usd': 'Amount ($)',
  'rev': 'Revenue ($)',
  'revenue': 'Revenue ($)',
  'cost': 'Cost ($)',
  'expense': 'Expense ($)',
  'profit': 'Profit ($)',
  'fy': 'Fiscal Year',
  'qtr': 'Quarter',
  'fiscal_qtr': 'Quarter',
  'dt': 'Date',
  'date': 'Date',
  'transaction_date': 'Transaction Date',
  'created_at': 'Created Date',
  'updated_at': 'Updated Date',
  'rate': 'Rate',
  'rate_per_hour': 'Rate per Hour',
  'occupancy': 'Occupancy (%)',
  'region': 'Region',
  'category': 'Category',
  'product': 'Product',
  'customer': 'Customer',
  'client': 'Client',
  'count': 'Count',
  'total': 'Total',
  'sum': 'Total',
  'avg': 'Average',
  'mean': 'Average',
  'pct': 'Percentage (%)',
  'percentage': 'Percentage (%)',
  'growth': 'Growth (%)',
  'change': 'Change (%)',
  'yoy': 'Year-over-Year (%)',
  'qoq': 'Quarter-over-Quarter (%)',
  'mom': 'Month-over-Month (%)'
}

// Convert technical column names to business-friendly labels
export function friendlyLabel(name: string): string {
  const cleanName = name.trim().replace(/_/g, ' ').replace(/-/g, ' ')
  const key = cleanName.toLowerCase()
  return SUGGESTED_MAP[key] || toTitleCase(cleanName)
}

// Convert string to Title Case
function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

// Format numbers for executive display
export function formatNumber(value: number, type: 'currency' | 'percentage' | 'number' = 'number'): string {
  if (type === 'currency') {
    if (Math.abs(value) >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`
    } else if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    } else {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    }
  }
  
  if (type === 'percentage') {
    return `${(value * 100).toFixed(1)}%`
  }
  
  if (Math.abs(value) >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`
  } else if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  } else {
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }
}

// Generate executive-friendly chart titles
export function generateChartTitle(data: any[], xField: string, yField: string, chartType: 'bar' | 'line' | 'pie'): {
  title: string
  subtitle: string
} {
  const xLabel = friendlyLabel(xField)
  const yLabel = friendlyLabel(yField)
  
  let title = ''
  let subtitle = ''
  
  switch (chartType) {
    case 'bar':
      title = `${yLabel} by ${xLabel}`
      const topItem = data.sort((a, b) => (b[yField] || 0) - (a[yField] || 0))[0]
      if (topItem) {
        subtitle = `${topItem[xField]} leads with ${formatNumber(topItem[yField])}`
      }
      break
      
    case 'line':
      title = `${yLabel} Trend Over Time`
      const firstValue = data[0]?.[yField] || 0
      const lastValue = data[data.length - 1]?.[yField] || 0
      const change = ((lastValue - firstValue) / firstValue * 100).toFixed(1)
      subtitle = `${Number(change) > 0 ? '+' : ''}${change}% change over period`
      break
      
    case 'pie':
      title = `${yLabel} Distribution by ${xLabel}`
      const total = data.reduce((sum, item) => sum + (item[yField] || 0), 0)
      const topShare = Math.max(...data.map(item => item[yField] || 0)) / total * 100
      subtitle = `Top segment: ${topShare.toFixed(1)}% of total`
      break
  }
  
  return { title, subtitle }
}

// Clean column headers on data upload
export function cleanHeaders(columns: string[]): string[] {
  return columns.map(col => {
    // Remove "Unnamed" prefixes
    if (col.startsWith('Unnamed:') || col.startsWith('Unnamed ')) {
      return `Column ${col.split(':')[1] || col.split(' ')[1] || '1'}`
    }
    
    return friendlyLabel(col)
  })
}

// Calculate executive KPIs from data
export function calculateKPIs(data: any[], columns: string[]): Array<{
  label: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}> {
  const kpis: Array<{
    label: string
    value: string
    change?: string
    changeType?: 'positive' | 'negative' | 'neutral'
  }> = []
  
  if (data.length === 0) return kpis
  
  // Total rows
  kpis.push({
    label: 'Total Records',
    value: formatNumber(data.length),
  })
  
  // Find numeric columns
  const numericColumns = columns.filter(col => {
    const sampleValue = data[0]?.[col]
    return typeof sampleValue === 'number' || !isNaN(parseFloat(sampleValue))
  })
  
  // Calculate totals for numeric columns
  numericColumns.slice(0, 3).forEach(col => {
    const total = data.reduce((sum, row) => {
      const value = parseFloat(row[col]) || 0
      return sum + value
    }, 0)
    
    const isCurrency = col.toLowerCase().includes('amount') || 
                      col.toLowerCase().includes('revenue') || 
                      col.toLowerCase().includes('cost') ||
                      col.toLowerCase().includes('price')
    
    kpis.push({
      label: friendlyLabel(col),
      value: formatNumber(total, isCurrency ? 'currency' : 'number'),
    })
  })
  
  return kpis.slice(0, 4) // Limit to 4 KPIs for executive view
}

// Generate insights from data
export function generateInsights(data: any[], columns: string[]): string {
  if (data.length === 0) return 'No data available for analysis.'
  
  const insights = []
  
  // Data completeness
  const totalCells = data.length * columns.length
  let completeCells = 0
  
  data.forEach(row => {
    columns.forEach(col => {
      if (row[col] !== null && row[col] !== undefined && row[col] !== '') {
        completeCells++
      }
    })
  })
  
  const completeness = (completeCells / totalCells * 100).toFixed(1)
  insights.push(`Dataset is ${completeness}% complete with ${formatNumber(data.length)} records across ${columns.length} fields.`)
  
  // Find numeric trends if there's a date column
  const dateColumns = columns.filter(col => 
    col.toLowerCase().includes('date') || 
    col.toLowerCase().includes('time') ||
    col.toLowerCase().includes('created')
  )
  
  const numericColumns = columns.filter(col => {
    const sampleValue = data[0]?.[col]
    return typeof sampleValue === 'number' || !isNaN(parseFloat(sampleValue))
  })
  
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    insights.push(`Time-series data detected - suitable for trend analysis and forecasting.`)
  }
  
  // Identify key categories
  const categoryColumns = columns.filter(col => {
    const uniqueValues = new Set(data.map(row => row[col]))
    return uniqueValues.size > 1 && uniqueValues.size < data.length * 0.5
  })
  
  if (categoryColumns.length > 0) {
    const topCategoryCol = categoryColumns[0]
    const categoryStats: Record<string, number> = {}
    data.forEach(row => {
      const cat = row[topCategoryCol]
      if (cat) {
        categoryStats[cat] = (categoryStats[cat] || 0) + 1
      }
    })
    
    const topCategory = Object.entries(categoryStats).sort(([,a], [,b]) => (b as number) - (a as number))[0]
    if (topCategory) {
      const percentage = ((topCategory[1] as number) / data.length * 100).toFixed(1)
      insights.push(`"${topCategory[0]}" is the most frequent ${friendlyLabel(topCategoryCol).toLowerCase()} (${percentage}% of records).`)
    }
  }
  
  return insights.join(' ')
}
