'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, X, BarChart3, LineChart, PieChart, ScatterChart } from 'lucide-react'

interface CustomChartBuilderProps {
  columns: string[]
  numericColumns: string[]
  categoricalColumns: string[]
  data: any[]
  onCreateChart: (chartConfig: any) => void
}

const chartTypes = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'scatter', label: 'Scatter Plot', icon: ScatterChart },
]

export default function CustomChartBuilder({ 
  columns, 
  numericColumns, 
  categoricalColumns, 
  data,
  onCreateChart 
}: CustomChartBuilderProps) {
  const [chartType, setChartType] = useState<string>('')
  const [xAxis, setXAxis] = useState<string>('')
  const [yAxis, setYAxis] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [createdCharts, setCreatedCharts] = useState<any[]>([])

  const createChart = () => {
    if (!chartType || !xAxis || (!yAxis && chartType !== 'pie')) {
      return
    }

    // Generate chart data based on selections
    let chartData: any[] = []
    const chartTitle = title || `${yAxis || 'Distribution'} by ${xAxis}`

    if (chartType === 'pie') {
      // For pie charts, count occurrences of categorical variable
      const distribution = data.reduce((acc: any, row) => {
        const key = row[xAxis]
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

      chartData = Object.entries(distribution)
        .slice(0, 10) // Limit to top 10 for readability
        .map(([key, value]) => ({
          [xAxis]: key,
          count: value,
          name: key,
          value: value
        }))
    } else if (chartType === 'bar') {
      // For bar charts, aggregate numeric values by categorical variable
      if (categoricalColumns.includes(xAxis) && numericColumns.includes(yAxis)) {
        const aggregated = data.reduce((acc: any, row) => {
          const key = row[xAxis]
          if (!acc[key]) acc[key] = { sum: 0, count: 0 }
          acc[key].sum += Number(row[yAxis]) || 0
          acc[key].count += 1
          return acc
        }, {})

        chartData = Object.entries(aggregated).map(([key, stats]: [string, any]) => ({
          [xAxis]: key,
          [yAxis]: stats.sum / stats.count, // Average
          name: key,
          value: stats.sum / stats.count
        }))
      } else {
        // Direct mapping for numeric data
        chartData = data.slice(0, 20).map(row => ({
          [xAxis]: row[xAxis],
          [yAxis]: Number(row[yAxis]) || 0,
          name: row[xAxis],
          value: Number(row[yAxis]) || 0
        }))
      }
    } else if (chartType === 'line') {
      chartData = data.slice(0, 50).map((row, index) => ({
        index: index + 1,
        [xAxis]: row[xAxis],
        [yAxis]: Number(row[yAxis]) || 0,
        name: row[xAxis] || index + 1,
        value: Number(row[yAxis]) || 0
      }))
    } else if (chartType === 'scatter') {
      chartData = data.slice(0, 100).map(row => ({
        [xAxis]: Number(row[xAxis]) || 0,
        [yAxis]: Number(row[yAxis]) || 0,
        x: Number(row[xAxis]) || 0,
        y: Number(row[yAxis]) || 0
      }))
    }

    const newChart = {
      id: `custom-${Date.now()}`,
      title: chartTitle,
      type: chartType,
      xField: xAxis,
      yField: chartType === 'pie' ? 'count' : yAxis,
      data: chartData
    }

    setCreatedCharts([...createdCharts, newChart])
    onCreateChart(newChart)

    // Reset form
    setChartType('')
    setXAxis('')
    setYAxis('')
    setTitle('')
  }

  const removeChart = (chartId: string) => {
    setCreatedCharts(createdCharts.filter(chart => chart.id !== chartId))
  }

  const getAvailableXColumns = () => {
    if (chartType === 'pie') return categoricalColumns
    if (chartType === 'scatter') return numericColumns
    return columns
  }

  const getAvailableYColumns = () => {
    if (chartType === 'pie') return []
    if (chartType === 'scatter') return numericColumns
    return numericColumns
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Custom Charts
        </CardTitle>
        <CardDescription>
          Build additional visualizations by selecting variables and chart types
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="chart-type">Chart Type</Label>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger>
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                {chartTypes.map(type => {
                  const Icon = type.icon
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="x-axis">
              {chartType === 'pie' ? 'Category' : 'X-Axis'}
            </Label>
            <Select value={xAxis} onValueChange={setXAxis} disabled={!chartType}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${chartType === 'pie' ? 'category' : 'X-axis'}`} />
              </SelectTrigger>
              <SelectContent>
                {getAvailableXColumns().map(col => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {chartType !== 'pie' && (
            <div className="space-y-2">
              <Label htmlFor="y-axis">Y-Axis</Label>
              <Select value={yAxis} onValueChange={setYAxis} disabled={!chartType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Y-axis" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableYColumns().map(col => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Chart Title (Optional)</Label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Custom chart title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button 
            onClick={createChart}
            disabled={!chartType || !xAxis || (!yAxis && chartType !== 'pie')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Chart
          </Button>
          
          {createdCharts.length > 0 && (
            <Badge variant="secondary">
              {createdCharts.length} custom chart{createdCharts.length !== 1 ? 's' : ''} created
            </Badge>
          )}
        </div>

        {createdCharts.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Created Charts:</h4>
            <div className="flex flex-wrap gap-2">
              {createdCharts.map(chart => (
                <Badge key={chart.id} variant="outline" className="flex items-center gap-2">
                  {chart.title}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-red-500" 
                    onClick={() => removeChart(chart.id)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <p><strong>Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Pie charts work best with categorical data</li>
            <li>Bar charts are great for comparing categories against numeric values</li>
            <li>Line charts show trends over time or continuous data</li>
            <li>Scatter plots reveal relationships between two numeric variables</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
