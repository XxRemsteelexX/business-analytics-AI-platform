
/**
 * lib/chart-explanations.ts
 * Auto-generates Executive and Analyst explanations for common chart types.
 * Uses lightweight stats: deltas, slope, top segments, outliers (IQR).
 */

export type SeriesPoint = { t: Date | string, y: number }

function toNumber(x: any): number | null {
  if (x === null || x === undefined) return null
  const n = typeof x === 'number' ? x : Number(x)
  return Number.isFinite(n) ? n : null
}

function pct(a: number, b: number): number | null {
  if (b === 0) return null
  return ((a - b) / Math.abs(b)) * 100
}

function linearSlope(y: number[]): number {
  const n = y.length
  if (n < 2) return 0
  const xs = Array.from({ length: n }, (_, i) => i + 1)
  const xbar = xs.reduce((a,b)=>a+b,0)/n
  const ybar = y.reduce((a,b)=>a+b,0)/n
  let num=0, den=0
  for (let i=0;i<n;i++){
    num += (xs[i]-xbar)*(y[i]-ybar)
    den += (xs[i]-xbar)*(xs[i]-xbar)
  }
  return den === 0 ? 0 : num/den
}

function iqrOutliers(vals: number[]) {
  const arr = vals.slice().sort((a,b)=>a-b)
  if (arr.length < 4) return { low: null, high: null, indices: [] as number[] }
  const q1 = arr[Math.floor(arr.length*0.25)]
  const q3 = arr[Math.floor(arr.length*0.75)]
  const iqr = q3 - q1
  const low = q1 - 1.5*iqr
  const high = q3 + 1.5*iqr
  const indices: number[] = []
  vals.forEach((v, i) => { if (v < low || v > high) indices.push(i) })
  return { low, high, indices }
}

/**
 * Time series explanation
 * Input: series [{t, y}]
 */
export function explainTimeSeries(title: string, series: SeriesPoint[]) {
  const y = series.map(p => toNumber(p.y)).filter((v): v is number => v !== null)
  const n = y.length
  const last = n ? y[n-1] : null
  const prev = n>1 ? y[n-2] : null
  const delta = (last !== null && prev !== null) ? pct(last, prev) : null
  const slope = linearSlope(y)
  const out = iqrOutliers(y)

  const plain = [
    delta !== null ? (delta >= 0 ? `Up ${delta.toFixed(1)}% vs last period` : `Down ${Math.abs(delta).toFixed(1)}% vs last period`) : `Steady vs last period`,
    Math.abs(slope) > 0.01 ? (slope > 0 ? `overall upward trend` : `overall downward trend`) : `little overall trend`,
    out.indices.length ? `${out.indices.length} outlier${out.indices.length>1?'s':''} detected` : `no material outliers`
  ].join('; ') + '.'

  const technical = [
    `Time series of ${title}; last=${last ?? 'n/a'}; prior=${prev ?? 'n/a'}.`,
    `Δ(last, prior)=${delta !== null ? delta.toFixed(2)+'%' : 'n/a'}; linear slope=${slope.toFixed(4)} (index units).`,
    out.indices.length ? `Outliers (IQR) at indices: [${out.indices.slice(0,10).join(', ')}${out.indices.length>10?'…':''}].` : `No IQR outliers.`
  ].join(' ')

  return {
    title,
    plain,
    technical
  }
}

/**
 * Category bar explanation
 * Input: data rows with category + value (already aggregated)
 */
export function explainCategoryBar(title: string, rows: { category: string, value: any }[]) {
  const vals = rows.map(r => toNumber(r.value)).filter((v): v is number => v !== null)
  if (rows.length === 0 || vals.length === 0) {
    return { title, plain: 'No data available.', technical: 'No rows or numeric values found.' }
  }
  const total = vals.reduce((a,b)=>a+b,0)
  const sorted = rows
    .map(r => ({ name: r.category, value: toNumber(r.value) }))
    .filter((r): r is {name: string, value: number} => r.value !== null)
    .sort((a,b)=>b.value-a.value)
  const top = sorted[0]
  const pctTop = total ? (top.value/total)*100 : null

  const plain = `Top segment: ${top.name} (${top.value.toLocaleString()})` +
    (pctTop !== null ? ` contributing ${pctTop.toFixed(1)}% of total.` : '.')

  const technical = `Bar chart of ${title}; total=${total.toLocaleString()}. ` +
    `Top=${top.name} (${top.value}); next=${sorted[1]?.name ?? 'n/a'} (${sorted[1]?.value ?? 'n/a'}).`

  return { title, plain, technical }
}

/**
 * Scatter explanation
 * Input: data rows with x and y numeric
 */
export function explainScatter(title: string, rows: { x: any, y: any }[]) {
  const xs = rows.map(r => toNumber(r.x)).filter((v): v is number => v !== null)
  const ys = rows.map(r => toNumber(r.y)).filter((v): v is number => v !== null)
  const n = Math.min(xs.length, ys.length)
  if (n < 3) return { title, plain: 'Not enough points to assess relationship.', technical: 'Need at least 3 points for correlation.' }

  const xbar = xs.reduce((a,b)=>a+b,0)/n
  const ybar = ys.reduce((a,b)=>a+b,0)/n
  let num=0, denx=0, deny=0
  for (let i=0;i<n;i++){
    const dx = xs[i]-xbar, dy = ys[i]-ybar
    num += dx*dy; denx += dx*dx; deny += dy*dy
  }
  const corr = (denx===0 || deny===0) ? 0 : num/Math.sqrt(denx*deny)

  const plain = Math.abs(corr) < 0.2
    ? 'Little to no linear relationship.'
    : (corr > 0 ? 'Positive relationship: higher X tends to align with higher Y.'
                : 'Negative relationship: higher X tends to align with lower Y.')

  const technical = `Scatter of ${title}; Pearson r=${corr.toFixed(3)}; meanX=${xbar.toFixed(2)}; meanY=${ybar.toFixed(2)}; n=${n}.`
  return { title, plain, technical }
}
