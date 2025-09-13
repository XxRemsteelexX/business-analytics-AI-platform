
/**
 * lib/forecast.ts
 * Simple Holt‑Winters (additive) for quick projections.
 * NOTE: This is intentionally tiny and dependency‑free.
 */
export type SeriesPoint = { t: Date | string, y: number }
export type ForecastResult = { fitted: number[], forecast: number[], alpha: number, beta: number, gamma: number }

export function holtWintersAdditive(series: number[], season: number = 0, alpha = 0.3, beta = 0.1, gamma = 0.1, periods = 6): ForecastResult {
  const n = series.length
  if (n === 0) return { fitted: [], forecast: [], alpha, beta, gamma }

  let level = series[0]
  let trend = n >= 2 ? series[1] - series[0] : 0
  const seasonals = new Array(season).fill(0)

  const fitted: number[] = []
  for (let i = 0; i < n; i++) {
    const s = season > 0 ? seasonals[i % season] : 0
    const y = series[i]
    const yhat = level + trend + s
    fitted.push(yhat)
    const lastLevel = level
    level = alpha * (y - s) + (1 - alpha) * (level + trend)
    trend = beta * (level - lastLevel) + (1 - beta) * trend
    if (season > 0) {
      seasonals[i % season] = gamma * (y - level) + (1 - gamma) * s
    }
  }

  const forecast: number[] = []
  for (let h = 1; h <= periods; h++) {
    const s = season > 0 ? seasonals[(n + h - 1) % season] : 0
    forecast.push(level + h * trend + s)
  }
  return { fitted, forecast, alpha, beta, gamma }
}
