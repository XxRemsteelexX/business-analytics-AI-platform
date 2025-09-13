
# Auto-Explanations Wiring Guide

## Time Series
```tsx
import { explainTimeSeries } from '@/lib/chart-explanations'
import { ChartExplanation } from '@/components/dashboard/ChartExplanation'

const series = data.map((d:any) => ({ t: d.Date, y: d.Revenue }))
const summary = explainTimeSeries('Revenue', series)

<ChartExplanation mode={viewMode} summary={summary} />
```

## Category Bar
```tsx
import { explainCategoryBar } from '@/lib/chart-explanations'
const aggregated = groupByCategory(data, 'Product', 'Revenue') // your own aggregator
const rows = aggregated.map(a => ({ category: a.name, value: a.sum }))
const summary = explainCategoryBar('Revenue by Product', rows)
<ChartExplanation mode={viewMode} summary={summary} />
```

## Scatter
```tsx
import { explainScatter } from '@/lib/chart-explanations'
const points = data.map((d:any) => ({ x: d.Ad_Spend, y: d.Revenue }))
const summary = explainScatter('Revenue vs Ad Spend', points)
<ChartExplanation mode={viewMode} summary={summary} />
```
