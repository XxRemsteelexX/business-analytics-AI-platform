// Forecasting utilities for predictive analysis
// Frontend-only implementation using Simple Exponential Smoothing (SES)

export interface ForecastPoint {
  t: string | number
  y: number
  isForecast?: boolean
  upperBound?: number
  lowerBound?: number
}

export interface ForecastResult {
  forecast: ForecastPoint[]
  confidence: number
  methodology: string
  accuracy: number
}

// Holt's Linear Trend forecast (Double Exponential Smoothing)
export function generateHoltForecast(
  timeSeries: Array<{ t: string | number; y: number }>,
  periodsAhead: number = 3,
  alpha: number = 0.3,
  beta: number = 0.1
): ForecastResult {
  // Validation
  if (!timeSeries || timeSeries.length < 8) {
    throw new Error('Insufficient data for forecasting (minimum 8 points required)')
  }

  const values = timeSeries.map(p => p.y).filter(v => !isNaN(v))
  if (values.length < 8) {
    throw new Error('Insufficient valid numeric data for forecasting')
  }

  // Initialize Holt's method
  let level = values[0]
  let trend = values.length > 1 ? values[1] - values[0] : 0
  const fitted: number[] = [level]
  const residuals: number[] = [0]

  // Fit the model
  for (let i = 1; i < values.length; i++) {
    const actual = values[i]
    const prevLevel = level
    
    // Update level and trend
    level = alpha * actual + (1 - alpha) * (level + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
    
    fitted.push(level + trend)
    residuals.push(actual - (level + trend))
  }

  // Calculate forecast accuracy (MAPE)
  const mape = residuals.slice(1).reduce((sum, residual, i) => {
    const actual = values[i + 1]
    return sum + Math.abs(residual / actual)
  }, 0) / (values.length - 1)
  
  const accuracy = Math.max(0, Math.min(100, (1 - mape) * 100))

  // Calculate confidence interval from residuals
  const residualStd = calculateStandardDeviation(residuals.slice(1))
  const confidence = residualStd / (values.reduce((a, b) => a + b, 0) / values.length)
  
  // Generate forecast points with trend
  const lastTime = timeSeries[timeSeries.length - 1].t
  const forecast: ForecastPoint[] = []
  
  for (let i = 1; i <= periodsAhead; i++) {
    const forecastValue = level + (i * trend) // Holt's trend forecast
    const margin = 1.96 * residualStd * Math.sqrt(i) // Expanding confidence interval
    
    forecast.push({
      t: generateNextTimePoint(lastTime, i),
      y: Math.round(forecastValue * 100) / 100,
      isForecast: true,
      upperBound: Math.round((forecastValue + margin) * 100) / 100,
      lowerBound: Math.round((forecastValue - margin) * 100) / 100
    })
  }

  return {
    forecast,
    confidence: Math.round((1 - confidence) * 100),
    methodology: 'Holt Linear Trend',
    accuracy: Math.round(accuracy)
  }
}

// Simple Exponential Smoothing forecast (fallback for non-trending data)
export function generateSESForecast(
  timeSeries: Array<{ t: string | number; y: number }>,
  periodsAhead: number = 3,
  alpha: number = 0.3
): ForecastResult {
  // Validation
  if (!timeSeries || timeSeries.length < 8) {
    throw new Error('Insufficient data for forecasting (minimum 8 points required)')
  }

  const values = timeSeries.map(p => p.y).filter(v => !isNaN(v))
  if (values.length < 8) {
    throw new Error('Insufficient valid numeric data for forecasting')
  }

  // Initialize SES
  let level = values[0]
  const fitted: number[] = [level]
  const residuals: number[] = [0]

  // Fit the model
  for (let i = 1; i < values.length; i++) {
    const actual = values[i]
    level = alpha * actual + (1 - alpha) * level
    fitted.push(level)
    residuals.push(actual - level)
  }

  // Calculate forecast accuracy (MAPE)
  const mape = residuals.slice(1).reduce((sum, residual, i) => {
    const actual = values[i + 1]
    return sum + Math.abs(residual / actual)
  }, 0) / (values.length - 1)
  
  const accuracy = Math.max(0, Math.min(100, (1 - mape) * 100))

  // Calculate confidence interval from residuals
  const residualStd = calculateStandardDeviation(residuals.slice(1))
  const confidence = residualStd / (values.reduce((a, b) => a + b, 0) / values.length)
  
  // Generate forecast points
  const lastTime = timeSeries[timeSeries.length - 1].t
  const forecast: ForecastPoint[] = []
  
  for (let i = 1; i <= periodsAhead; i++) {
    const forecastValue = level // SES flat forecast
    const margin = 1.96 * residualStd // 95% confidence interval
    
    forecast.push({
      t: generateNextTimePoint(lastTime, i),
      y: Math.round(forecastValue * 100) / 100,
      isForecast: true,
      upperBound: Math.round((forecastValue + margin) * 100) / 100,
      lowerBound: Math.round((forecastValue - margin) * 100) / 100
    })
  }

  return {
    forecast,
    confidence: Math.round((1 - confidence) * 100),
    methodology: 'Simple Exponential Smoothing',
    accuracy: Math.round(accuracy)
  }
}

// Detect if a chart is suitable for forecasting
export function canForecast(chart: any): boolean {
  if (!chart || chart.type !== 'line') return false
  if (!chart.data || chart.data.length < 8) return false
  if (!chart.xField) return false
  
  // Check if x-axis looks like time/date
  const xField = chart.xField.toLowerCase()
  const isTimeField = xField.includes('date') || 
                     xField.includes('time') || 
                     xField.includes('month') || 
                     xField.includes('year') || 
                     xField.includes('quarter') ||
                     xField.includes('period') ||
                     xField.includes('week')
  
  if (isTimeField) return true
  
  // Check if data values look like dates
  const firstValue = String(chart.data[0]?.[chart.xField] || '')
  const looksLikeDate = /\d{4}/.test(firstValue) || // Contains year
                       /\d{1,2}\/\d{1,2}/.test(firstValue) || // MM/DD format
                       /\d{4}-\d{2}/.test(firstValue) // YYYY-MM format
  
  return looksLikeDate
}

// Generate business-friendly next time point
function generateNextTimePoint(lastTime: string | number, periodsAhead: number): string {
  const timeStr = String(lastTime)

  // Try to infer cadence from last two points if possible
  // We expect the caller to pass in sequential series; if not available, fall back to sensible defaults
  try {
    const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(timeStr)
    const isYearMonth = /^\d{4}-\d{2}$/.test(timeStr)
    const isYearOnly = /^\d{4}$/.test(timeStr)

    // YYYY-MM-DD: add months by periodsAhead, preserve format
    if (isIsoDate) {
      const [y, m, d] = timeStr.split('-').map(Number)
      const base = new Date(Date.UTC(y, m - 1, d))
      const next = new Date(base)
      next.setUTCMonth(base.getUTCMonth() + periodsAhead)
      const ny = next.getUTCFullYear()
      const nm = String(next.getUTCMonth() + 1).padStart(2, '0')
      const nd = String(next.getUTCDate()).padStart(2, '0')
      return `${ny}-${nm}-${nd}`
    }

    // YYYY-MM: add months
    if (isYearMonth) {
      const [y, m] = timeStr.split('-').map(Number)
      const base = new Date(Date.UTC(y, m - 1, 1))
      const next = new Date(base)
      next.setUTCMonth(base.getUTCMonth() + periodsAhead)
      const ny = next.getUTCFullYear()
      const nm = String(next.getUTCMonth() + 1).padStart(2, '0')
      return `${ny}-${nm}`
    }

    // YYYY: add years
    if (isYearOnly) {
      const year = parseInt(timeStr) + periodsAhead
      return year.toString()
    }

    // Fallback: if it's a number-like index, just increment
    if (!isNaN(Number(timeStr))) {
      return String(Number(timeStr) + periodsAhead)
    }
  } catch (_) {
    // ignore and fall back
  }

  // Last resort: keep original label without adding suffixes
  return timeStr
}

// Utility: Calculate standard deviation
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2))
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  
  return Math.sqrt(avgSquaredDiff)
}

// Convert chart data to time series format
export function chartDataToTimeSeries(chart: any): Array<{ t: string | number; y: number }> {
  if (!chart.data || !chart.xField || !chart.yField) return []
  
  return chart.data.map((point: any) => ({
    t: point[chart.xField],
    y: Number(point[chart.yField]) || 0
  })).filter((point: any) => !isNaN(point.y))
}

// Smart forecast that detects trends and chooses appropriate method
export function generateSmartForecast(
  timeSeries: Array<{ t: string | number; y: number }>,
  periodsAhead: number = 3
): ForecastResult {
  // Detect if there's a significant trend
  const hasTrend = detectTrend(timeSeries)
  
  try {
    if (hasTrend) {
      console.log('Using Holt linear trend forecast for trending data')
      return generateHoltForecast(timeSeries, periodsAhead)
    } else {
      console.log('Using SES forecast for non-trending data')
      return generateSESForecast(timeSeries, periodsAhead)
    }
  } catch (error) {
    console.log('Forecast failed, falling back to SES:', error)
    return generateSESForecast(timeSeries, periodsAhead)
  }
}

// Detect if data has a significant trend
function detectTrend(timeSeries: Array<{ t: string | number; y: number }>): boolean {
  if (timeSeries.length < 8) return false
  
  const values = timeSeries.map(p => p.y).filter(v => !isNaN(v))
  if (values.length < 8) return false
  
  // Calculate linear regression slope
  const n = values.length
  const x = Array.from({length: n}, (_, i) => i)
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const avgY = sumY / n
  
  // Consider trend significant if slope is > 1% of average value (more sensitive)
  const trendThreshold = Math.abs(avgY * 0.01)
  
  console.log(`Trend detection: slope=${slope.toFixed(4)}, avgY=${avgY.toFixed(2)}, threshold=${trendThreshold.toFixed(4)}, hasTrend=${Math.abs(slope) > trendThreshold}`)
  
  return Math.abs(slope) > trendThreshold
}

// Business-friendly forecast summary
export function generateForecastSummary(result: ForecastResult, metricName: string): string {
  const trend = result.forecast[result.forecast.length - 1].y > result.forecast[0].y ? 'increasing' : 'decreasing'
  const confidenceLevel = result.confidence > 70 ? 'high' : result.confidence > 50 ? 'moderate' : 'low'
  
  return `${metricName} forecast shows ${trend} trend with ${confidenceLevel} confidence (${result.confidence}% accuracy)`
}
