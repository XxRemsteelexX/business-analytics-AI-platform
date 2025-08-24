
'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

// Thompson PMC brand colors for charts
const CHART_COLORS = ['#a7ff03', '#0b1642', '#17296f', '#282828', '#60B5FF', '#FF9149', '#FF9898', '#FF90BB']

interface ChartProps {
  charts: any[]
}

export default function ProfessionalCharts({ charts }: ChartProps) {
  if (!charts || charts.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg">
        <p className="text-gray-500">No charts available for this dataset.</p>
      </div>
    )
  }

  const renderChart = (chart: any, index: number) => {
    const chartProps = {
      width: '100%',
      height: 350,
      data: chart.data,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    }

    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer {...chartProps}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #0b1642',
                  borderRadius: '8px',
                  fontSize: 12
                }}
              />
              <Legend 
                verticalAlign="top" 
                wrapperStyle={{ fontSize: 11 }} 
              />
              <Bar 
                dataKey="value" 
                fill={CHART_COLORS[0]} 
                radius={[4, 4, 0, 0]}
                name="Value"
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        const lineKeys = Object.keys(chart.data[0] || {}).filter(key => key !== 'index' && key !== 'name')
        return (
          <ResponsiveContainer {...chartProps}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="index" 
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #0b1642',
                  borderRadius: '8px',
                  fontSize: 12
                }}
              />
              <Legend 
                verticalAlign="top" 
                wrapperStyle={{ fontSize: 11 }} 
              />
              {lineKeys.map((key, keyIndex) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[keyIndex % CHART_COLORS.length]}
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS[keyIndex % CHART_COLORS.length], strokeWidth: 2, r: 4 }}
                  name={key}
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
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
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
                  fontSize: 12
                }}
              />
              <Legend 
                verticalAlign="top" 
                wrapperStyle={{ fontSize: 11 }} 
              />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="text-gray-500">Unsupported chart type: {chart.type}</div>
    }
  }

  return (
    <div className="space-y-8">
      {charts.map((chart, index) => (
        <div key={chart.id || index} className="chart-container">
          <h4 className="text-lg font-semibold text-thompson-navy mb-4">
            {chart.title}
          </h4>
          <div className="h-[350px]">
            {renderChart(chart, index)}
          </div>
        </div>
      ))}
    </div>
  )
}
