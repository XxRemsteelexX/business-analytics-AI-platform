
// Advanced analysis utilities for CEO-grade insights
import { formatNumber, friendlyLabel } from './chart-utils'

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable'
  percentage: number
  period: string
  description: string
}

export interface Anomaly {
  field: string
  value: any
  type: 'outlier' | 'spike' | 'drop'
  severity: 'low' | 'medium' | 'high'
  description: string
}

export interface TopDriver {
  field: string
  value: any
  impact: number
  description: string
}

export interface ExecutiveRecommendation {
  type: 'opportunity' | 'concern' | 'action'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action: string
}

export interface ChartIntent {
  chart: 'bar' | 'line' | 'pie' | 'table'
  title: string
  x: string
  y: string
  filter?: Record<string, any>
  insight: string
  description: string
}

// Analyze trends in time-series data
export function analyzeTrends(data: any[], dateColumn?: string, valueColumn?: string): TrendAnalysis | null {
  if (!dateColumn || !valueColumn || data.length < 2) {
    return null
  }

  const sortedData = data
    .filter(row => row[dateColumn] && row[valueColumn])
    .sort((a, b) => new Date(a[dateColumn]).getTime() - new Date(b[dateColumn]).getTime())

  if (sortedData.length < 2) return null

  const firstValue = Number(sortedData[0][valueColumn]) || 0
  const lastValue = Number(sortedData[sortedData.length - 1][valueColumn]) || 0
  
  if (firstValue === 0) return null

  const change = ((lastValue - firstValue) / Math.abs(firstValue)) * 100
  const absChange = Math.abs(change)

  let direction: 'up' | 'down' | 'stable' = 'stable'
  if (absChange > 5) {
    direction = change > 0 ? 'up' : 'down'
  }

  const friendlyValueCol = friendlyLabel(valueColumn)
  const trendWord = direction === 'up' ? 'increased' : direction === 'down' ? 'decreased' : 'remained stable'
  
  return {
    direction,
    percentage: absChange,
    period: `${sortedData.length} periods`,
    description: `${friendlyValueCol} has ${trendWord} by ${absChange.toFixed(1)}% over the analyzed period`
  }
}

// Detect anomalies in the data
export function detectAnomalies(data: any[], columns: string[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  // Analyze numeric columns for statistical outliers
  const numericColumns = columns.filter(col => {
    const sampleValue = data[0]?.[col]
    return typeof sampleValue === 'number' || !isNaN(parseFloat(String(sampleValue)))
  })

  numericColumns.forEach(col => {
    const values = data.map(row => Number(row[col])).filter(val => !isNaN(val))
    if (values.length < 10) return // Need sufficient data

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    )

    // Find values more than 2 standard deviations from mean
    values.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev)
      if (zScore > 2) {
        const severity = zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low'
        const type = value > mean ? 'spike' : 'drop'
        
        anomalies.push({
          field: friendlyLabel(col),
          value: formatNumber(value),
          type,
          severity,
          description: `${friendlyLabel(col)} shows an unusual ${type} of ${formatNumber(value)} (${zScore.toFixed(1)}σ from average)`
        })
      }
    })
  })

  return anomalies.slice(0, 3) // Return top 3 anomalies
}

// Identify top drivers/contributors
export function identifyTopDrivers(data: any[], columns: string[]): TopDriver[] {
  const drivers: TopDriver[] = []

  // Find categorical columns and their top contributors
  const categoricalColumns = columns.filter(col => {
    const uniqueValues = new Set(data.map(row => row[col]))
    return uniqueValues.size > 1 && uniqueValues.size < data.length * 0.5
  })

  const numericColumns = columns.filter(col => {
    const sampleValue = data[0]?.[col]
    return typeof sampleValue === 'number' || !isNaN(parseFloat(String(sampleValue)))
  })

  if (categoricalColumns.length > 0 && numericColumns.length > 0) {
    const catCol = categoricalColumns[0]
    const numCol = numericColumns[0]

    // Aggregate by category
    const aggregated: Record<string, number> = {}
    data.forEach(row => {
      const category = row[catCol]
      const value = Number(row[numCol]) || 0
      aggregated[category] = (aggregated[category] || 0) + value
    })

    const total = Object.values(aggregated).reduce((sum, val) => sum + val, 0)
    
    // Get top 3 contributors
    const sortedEntries = Object.entries(aggregated)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)

    sortedEntries.forEach(([category, value]) => {
      const impact = (value / total) * 100
      drivers.push({
        field: friendlyLabel(catCol),
        value: category,
        impact,
        description: `${category} contributes ${impact.toFixed(1)}% of total ${friendlyLabel(numCol)}`
      })
    })
  }

  return drivers
}

// Generate executive recommendations based on analysis
export function generateRecommendations(
  trends: TrendAnalysis | null,
  anomalies: Anomaly[],
  drivers: TopDriver[]
): ExecutiveRecommendation[] {
  const recommendations: ExecutiveRecommendation[] = []

  // Trend-based recommendations
  if (trends) {
    if (trends.direction === 'down' && trends.percentage > 10) {
      recommendations.push({
        type: 'concern',
        priority: 'high',
        title: 'Declining Performance Trend',
        description: `${trends.description}. This negative trend requires immediate attention.`,
        action: 'Investigate root causes and implement corrective measures within 30 days'
      })
    } else if (trends.direction === 'up' && trends.percentage > 15) {
      recommendations.push({
        type: 'opportunity',
        priority: 'medium',
        title: 'Strong Growth Momentum',
        description: `${trends.description}. This positive trend presents expansion opportunities.`,
        action: 'Scale successful strategies and allocate additional resources to maintain growth'
      })
    }
  }

  // Anomaly-based recommendations
  const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high')
  if (highSeverityAnomalies.length > 0) {
    recommendations.push({
      type: 'concern',
      priority: 'high',
      title: 'Data Anomalies Detected',
      description: `Found ${highSeverityAnomalies.length} significant anomalies in the data that may indicate operational issues.`,
      action: 'Review data quality and investigate unusual patterns immediately'
    })
  }

  // Driver-based recommendations
  if (drivers.length > 0) {
    const topDriver = drivers[0]
    if (topDriver.impact > 50) {
      recommendations.push({
        type: 'concern',
        priority: 'medium',
        title: 'High Concentration Risk',
        description: `${topDriver.description}, creating concentration risk.`,
        action: 'Diversify portfolio to reduce dependency on single drivers'
      })
    }
  }

  // Default recommendation if no specific issues found
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'action',
      priority: 'low',
      title: 'Performance Monitoring',
      description: 'Data shows stable performance with no immediate concerns.',
      action: 'Continue monitoring key metrics and maintain current operational strategies'
    })
  }

  return recommendations.slice(0, 3) // Return top 3 recommendations
}

// Comprehensive CEO-grade analysis
export function performExecutiveAnalysis(data: any[], columns: string[]): {
  trends: TrendAnalysis | null
  anomalies: Anomaly[]
  drivers: TopDriver[]
  recommendations: ExecutiveRecommendation[]
  summary: string
} {
  // Detect potential date and value columns for trend analysis
  const dateColumns = columns.filter(col => 
    col.toLowerCase().includes('date') || 
    col.toLowerCase().includes('time') ||
    col.toLowerCase().includes('created')
  )
  
  const numericColumns = columns.filter(col => {
    const sampleValue = data[0]?.[col]
    return typeof sampleValue === 'number' || !isNaN(parseFloat(String(sampleValue)))
  })

  const trends = dateColumns.length > 0 && numericColumns.length > 0
    ? analyzeTrends(data, dateColumns[0], numericColumns[0])
    : null

  const anomalies = detectAnomalies(data, columns)
  const drivers = identifyTopDrivers(data, columns)
  const recommendations = generateRecommendations(trends, anomalies, drivers)

  // Generate executive summary
  const summaryParts: string[] = []
  
  if (trends) {
    summaryParts.push(trends.description)
  }
  
  if (drivers.length > 0) {
    summaryParts.push(`Top contributor: ${drivers[0].description}`)
  }
  
  if (anomalies.length > 0) {
    summaryParts.push(`${anomalies.length} data anomalies detected requiring attention`)
  }

  const summary = summaryParts.length > 0 
    ? summaryParts.join('. ') + '.'
    : `Dataset contains ${data.length} records across ${columns.length} fields with stable performance indicators.`

  return {
    trends,
    anomalies,
    drivers,
    recommendations,
    summary
  }
}
