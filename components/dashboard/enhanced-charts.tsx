
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Expand, Download, TrendingUp } from 'lucide-react'
import { CHART_COLORS, formatNumber, friendlyLabel, generateChartTitle } from '@/lib/chart-utils'

interface ChartData {
  id: string
  type: 'bar' | 'line' | 'pie'
  title: string
  data: any[]
  xField?: string
  yField?: string
}

interface EnhancedChartsProps {
  charts: ChartData[]
  mode?: 'executive' | 'analyst'
}

export default function EnhancedCharts({ charts, mode = 'executive' }: EnhancedChartsProps) {
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null)

  if (!charts || charts.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg">
        <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No charts available for this dataset.</p>
      </div>
    )
  }

  const renderChart = (chart: ChartData, height = 350, showTitle = true) => {
    const chartProps = {
      width: '100%',
      height,
      data: chart.data,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    }

    // Generate executive-friendly titles
    const { title, subtitle } = chart.xField && chart.yField 
      ? generateChartTitle(chart.data, chart.xField, chart.yField, chart.type)
      : { title: chart.title, subtitle: '' }

    const ChartComponent = () => {
      switch (chart.type) {
        case 'bar':
          return (
            <ResponsiveContainer {...chartProps}>
              <BarChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey={chart.xField || 'name'}
                  tick={{ fontSize: 12, fontFamily: 'Catamaran' }}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickFormatter={(value) => friendlyLabel(String(value))}
                />
                <YAxis 
                  tick={{ fontSize: 12, fontFamily: 'Catamaran' }}
                  tickLine={false}
                  tickFormatter={(value) => formatNumber(Number(value))}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #0b1642',
                    borderRadius: '8px',
                    fontSize: 14,
                    fontFamily: 'Catamaran'
                  }}
                  formatter={(value: any, name) => [formatNumber(Number(value)), friendlyLabel(String(name))]}
                  labelFormatter={(label) => friendlyLabel(String(label))}
                />
                <Legend 
                  verticalAlign="top" 
                  wrapperStyle={{ fontSize: 12, fontFamily: 'Montserrat' }} 
                />
                <Bar 
                  dataKey={chart.yField || 'value'}
                  fill={CHART_COLORS[0]} 
                  radius={[4, 4, 0, 0]}
                  name={friendlyLabel(chart.yField || 'Value')}
                />
              </BarChart>
            </ResponsiveContainer>
          )

        case 'line':
          const lineKeys = chart.data.length > 0 
            ? Object.keys(chart.data[0]).filter(key => key !== 'index' && key !== 'name' && key !== chart.xField)
            : []

          return (
            <ResponsiveContainer {...chartProps}>
              <LineChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey={chart.xField || 'index'}
                  tick={{ fontSize: 12, fontFamily: 'Catamaran' }}
                  tickLine={false}
                  tickFormatter={(value) => friendlyLabel(String(value))}
                />
                <YAxis 
                  tick={{ fontSize: 12, fontFamily: 'Catamaran' }}
                  tickLine={false}
                  tickFormatter={(value) => formatNumber(Number(value))}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #0b1642',
                    borderRadius: '8px',
                    fontSize: 14,
                    fontFamily: 'Catamaran'
                  }}
                  formatter={(value: any, name) => [formatNumber(Number(value)), friendlyLabel(String(name))]}
                  labelFormatter={(label) => friendlyLabel(String(label))}
                />
                <Legend 
                  verticalAlign="top" 
                  wrapperStyle={{ fontSize: 12, fontFamily: 'Montserrat' }} 
                />
                {lineKeys.map((key, keyIndex) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={CHART_COLORS[keyIndex % CHART_COLORS.length]}
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS[keyIndex % CHART_COLORS.length], strokeWidth: 2, r: 4 }}
                    name={friendlyLabel(key)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )

        case 'pie':
          return (
            <ResponsiveContainer {...chartProps}>
              <PieChart>
                <Pie
                  data={chart.data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${friendlyLabel(entry.name)}: ${formatNumber(entry.value)}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey={chart.yField || 'value'}
                >
                  {chart.data.map((entry: any, entryIndex: number) => (
                    <Cell 
                      key={`cell-${entryIndex}`} 
                      fill={CHART_COLORS[entryIndex % CHART_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #0b1642',
                    borderRadius: '8px',
                    fontSize: 14,
                    fontFamily: 'Catamaran'
                  }}
                  formatter={(value: any, name) => [formatNumber(Number(value)), friendlyLabel(String(name))]}
                />
                <Legend 
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 12, fontFamily: 'Montserrat' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          )

        default:
          return <div className="text-gray-500">Unsupported chart type: {chart.type}</div>
      }
    }

    return (
      <div>
        {showTitle && (
          <div className="mb-4">
            <h4 className="text-h2 mb-2">{title}</h4>
            {subtitle && (
              <p className="text-sm text-gray-600 font-medium">{subtitle}</p>
            )}
          </div>
        )}
        <ChartComponent />
      </div>
    )
  }

  const chartsToShow = mode === 'executive' ? charts.slice(0, 3) : charts

  return (
    <div className="space-y-8">
      {chartsToShow.map((chart, index) => (
        <div key={chart.id || index} className="chart-container">
          {/* Chart expand button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="chart-expand-button"
                onClick={() => setSelectedChart(chart)}
              >
                <Expand className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle className="text-h2">
                  {chart.title}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4" style={{ height: '600px' }}>
                {renderChart(chart, 600, false)}
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Chart
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Main chart */}
          <div className="h-[400px]">
            {renderChart(chart)}
          </div>
        </div>
      ))}

      {mode === 'executive' && charts.length > 3 && (
        <div className="text-center py-6">
          <p className="text-gray-600 mb-4">
            {charts.length - 3} additional charts available in Analyst Mode
          </p>
          <Button variant="outline">
            Switch to Analyst Mode
          </Button>
        </div>
      )}
    </div>
  )
}
