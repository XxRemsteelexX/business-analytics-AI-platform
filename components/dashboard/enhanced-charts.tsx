
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts'
import { Expand, Download, TrendingUp } from 'lucide-react'
import { CHART_COLORS, formatNumber, friendlyLabel, generateChartTitle } from '@/lib/chart-utils'
import { ChartExplanation } from './ChartExplanation'
import { ProjectionsButton } from './ProjectionsButton'
import { DataFilterControls } from './data-filter-controls'
import { explainTimeSeries, explainCategoryBar, explainScatter } from '@/lib/chart-explanations'

interface ChartData {
  id: string
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram'
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
  const [filteredData, setFilteredData] = useState<Record<string, any[]>>({})
  const [dataRange, setDataRange] = useState<{start: number, end: number} | null>(null)
  
  console.log('EnhancedCharts received:', { charts, mode })

  // Generate chart explanation
  const generateExplanation = (chart: ChartData) => {
    console.log('Generating explanation for chart:', chart)
    try {
      // Use filtered data if available, otherwise use original data
      const chartData = filteredData[chart.id] || chart.data
      
      if (chart.type === 'line' && chart.xField && chart.yField) {
        // For line charts, try time series explanation
        const series = chartData.map(item => ({
          t: item[chart.xField!],
          y: item[chart.yField!]
        }))
        return explainTimeSeries(chart.title, series)
      } else if (chart.type === 'bar' && chart.xField && chart.yField) {
        // For bar charts, use category explanation
        const rows = chartData.map(item => ({
          category: item[chart.xField!],
          value: item[chart.yField!]
        }))
        return explainCategoryBar(chart.title, rows)
      } else if (chart.type === 'scatter' && chart.xField && chart.yField) {
        // For scatter charts, use scatter explanation
        const rows = chartData.map(item => ({
          x: item[chart.xField!],
          y: item[chart.yField!]
        }))
        return explainScatter(chart.title, rows)
      }
      return {
        title: chart.title,
        plain: "Chart analysis not available for this chart type.",
        technical: "Advanced analysis features not implemented for this visualization."
      }
    } catch (error) {
      return {
        title: chart.title,
        plain: "Chart shows data relationships and trends.",
        technical: "Statistical analysis unavailable due to data format."
      }
    }
  }

  // Handle data range changes from slider
  const handleDataRangeChange = (start: number, end: number) => {
    setDataRange({ start, end })
    
    // Update filtered data for each chart
    const newFilteredData: Record<string, any[]> = {}
    charts.forEach(chart => {
      newFilteredData[chart.id] = chart.data.slice(start, end + 1)
    })
    setFilteredData(newFilteredData)
  }

  // Reset to show all data
  const handleReset = () => {
    setDataRange(null)
    setFilteredData({})
  }

  if (!charts || charts.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg">
        <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No charts available for this dataset.</p>
      </div>
    )
  }

  // Get the first chart's data to determine total data size for slider
  const firstChart = charts[0]
  const totalDataSize = firstChart?.data?.length || 0

  const renderChart = (chart: ChartData, height = 350, showTitle = true) => {
    // Use filtered data if available, otherwise use original data
    const chartData = filteredData[chart.id] || chart.data
    
    const chartProps = {
      width: '100%',
      height,
      data: chartData,
      margin: { top: 80, right: 50, left: 80, bottom: 100 }
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
              <BarChart data={chartData} >
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

        case 'histogram':
          return (
            <ResponsiveContainer {...chartProps}>
              <BarChart data={chartData} >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey={chart.xField || 'range'}
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
                  dataKey={chart.yField || 'count'}
                  fill={CHART_COLORS[0]} 
                  radius={[4, 4, 0, 0]}
                  name={friendlyLabel(chart.yField || 'Count')}
                />
              </BarChart>
            </ResponsiveContainer>
          )

        case 'line':
          const lineKeys = chartData.length > 0 
            ? Object.keys(chartData[0]).filter(key => key !== 'index' && key !== 'name' && key !== chart.xField)
            : []

          return (
            <ResponsiveContainer {...chartProps}>
              <LineChart data={chartData} >
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
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${friendlyLabel(entry.name)}: ${formatNumber(entry.value)}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey={chart.yField || 'value'}
                >
                  {chartData.map((entry: any, entryIndex: number) => (
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

        case 'scatter':
          return (
            <ResponsiveContainer {...chartProps}>
              <ScatterChart data={chartData} >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey={chart.xField || 'x'}
                  tick={{ fontSize: 12, fontFamily: 'Catamaran' }}
                  tickLine={false}
                  type="number"
                />
                <YAxis 
                  dataKey={chart.yField || 'y'}
                  tick={{ fontSize: 12, fontFamily: 'Catamaran' }}
                  tickLine={false}
                  type="number"
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
                  labelFormatter={(label) => `Data Point: ${label}`}
                />
                <Legend 
                  verticalAlign="top"
                  wrapperStyle={{ fontSize: 12, fontFamily: 'Montserrat' }} 
                />
                <Scatter 
                  dataKey={chart.yField || 'y'}
                  fill={CHART_COLORS[0]}
                  name="Data Points"
                />
              </ScatterChart>
            </ResponsiveContainer>
          )

        default:
          return <div className="text-gray-500">Unsupported chart type: {chart.type}</div>
      }
    }

    return (
      <div style={{ overflow: 'visible' }}>
        {showTitle && (
          <div className="mb-4">
            <h4 className="text-h2 mb-2">{title}</h4>
            {subtitle && (
              <p className="text-sm text-gray-600 font-medium">{subtitle}</p>
            )}
          </div>
        )}
        <div style={{ overflow: 'visible', position: 'relative' }}>
          <ChartComponent />
        </div>
      </div>
    )
  }

  // Limit charts and ensure diversity
  const chartsToShow = (() => {
    if (mode === 'executive') {
      // For executive mode, show max 3 charts with diversity
      const seenTypes = new Set();
      const uniqueCharts: ChartData[] = [];
      
      for (const chart of charts) {
        if (uniqueCharts.length >= 3) break;
        if (!seenTypes.has(chart.type)) {
          seenTypes.add(chart.type);
          uniqueCharts.push(chart);
        }
      }
      
      // If we don't have 3 unique types, fill with remaining charts
      if (uniqueCharts.length < 3) {
        const remaining = charts.filter(chart => 
          !uniqueCharts.some(c => c.id === chart.id)
        ).slice(0, 3 - uniqueCharts.length);
        uniqueCharts.push(...remaining);
      }
      
      return uniqueCharts;
    }
    return charts;
  })();

  return (
    <div className="space-y-8">
      {/* Data Filter Controls - show for all datasets with data */}
      {totalDataSize > 0 && (
        <div className="mb-6">
          <DataFilterControls 
            data={firstChart.data} 
            onDataRangeChange={handleDataRangeChange}
            onReset={handleReset}
          />
        </div>
      )}
      
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
          <div className="h-[450px] mb-6">
            {renderChart(chart)}
          </div>
          
          {/* Chart Explanation */}
          <ChartExplanation mode={mode} summary={generateExplanation(chart)} />
          
          {/* Projections Button for time series */}
          <ProjectionsButton series={(filteredData[chart.id] || chart.data).map((item) => ({
            t: chart.xField ? item[chart.xField] : item.index || item.name,
            y: chart.yField ? item[chart.yField] : item.value
          }))} />
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
