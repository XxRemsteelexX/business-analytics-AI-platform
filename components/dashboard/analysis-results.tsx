
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { 
  FileText, 
  BarChart3, 
  TrendingUp,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  Settings
} from 'lucide-react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import CustomChartBuilder from '@/components/charts/custom-chart-builder'
import { ExecutiveKPIs } from './executive-kpis'
import { ViewModeToggle } from './view-mode-toggle'
import { ColumnEditor } from './column-editor'
import { ExecutiveInsights } from './executive-insights'
import { InteractiveDataSelector } from './InteractiveDataSelector'
import { calculateKPIs, generateInsights } from '@/lib/chart-utils'
import { performExecutiveAnalysis } from '@/lib/advanced-analysis'

// Dynamic import for charts to avoid SSR issues
const EnhancedCharts = dynamic(() => import('./enhanced-charts'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 chart-skeleton rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin text-thompson-blue" />
    </div>
  )
})

interface AnalysisResultsProps {
  fileData: any
  onAnalysisComplete?: (data: any) => void
  onCustomChartsUpdate?: (charts: any[]) => void
}

export function AnalysisResults({ fileData, onAnalysisComplete, onCustomChartsUpdate }: AnalysisResultsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'executive' | 'analyst'>('executive')
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [customCharts, setCustomCharts] = useState<any[]>([])
  const [showDataSelector, setShowDataSelector] = useState(true)
  const [selectedData, setSelectedData] = useState<any>(null)
  const { toast } = useToast()

  console.log('DEBUG: showDataSelector=', showDataSelector, 'analysisData=', analysisData, 'fileData=', fileData)

  // Auto-analysis is now disabled - user must select data first
  // useEffect(() => {
  //   if (fileData && !analysisData) {
  //     analyzeFile()
  //   }
  // }, [fileData])

  const analyzeFile = async () => {
    if (!fileData) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fileId: fileData.id || fileData.filename,
          sheetName: fileData.selectedSheet,
          originalName: fileData.originalName,
          mimeType: fileData.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Enhance analysis with CEO-friendly KPIs and advanced insights
        if (result.data && result.columns) {
          result.kpis = calculateKPIs(result.data, result.columns)
          result.enhancedInsights = generateInsights(result.data, result.columns)
          
          // Perform advanced executive analysis
          const executiveAnalysis = performExecutiveAnalysis(result.data, result.columns)
          result.executiveAnalysis = executiveAnalysis
          
          // Override summary with executive analysis if available
          if (executiveAnalysis.summary) {
            result.enhancedInsights = executiveAnalysis.summary
          }
        }
        
        setAnalysisData(result)
        onAnalysisComplete?.(result)
        
        toast({
          title: 'Analysis Complete',
          description: 'Your data has been analyzed and executive insights are ready.',
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Analysis failed')
        toast({
          title: 'Analysis Failed',
          description: 'Failed to analyze the uploaded file.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      setError('An unexpected error occurred during analysis')
      toast({
        title: 'Analysis Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleColumnMappingChange = (mapping: Record<string, string>) => {
    setColumnMappings(mapping)
    // Could save to localStorage or backend here
    localStorage.setItem('columnMappings', JSON.stringify(mapping))
    
    toast({
      title: 'Column Names Updated',
      description: 'Your custom column names have been saved.',
    })
  }

  const handleCreateCustomChart = (chartConfig: any) => {
    const updatedCharts = [...customCharts, chartConfig]
    setCustomCharts(updatedCharts)
    onCustomChartsUpdate?.(updatedCharts)
    toast({
      title: 'Custom Chart Created',
      description: `Created "${chartConfig.title}" chart successfully.`,
    })
  }

  const handleDataSelected = async (selection: any) => {
    setSelectedData(selection)
    // Keep data selector visible for real-time changes
    // setShowDataSelector(false)
    
    // Create a modified fileData with selected data
    const modifiedFileData = {
      ...fileData,
      parsedData: { [selection.sheetName]: selection.data },
      selectedSheet: selection.sheetName,
      selectedColumns: selection.selectedColumns
    }
    
    // Now analyze with the selected data
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fileId: fileData.id || fileData.filename,
          sheetName: selection.sheetName,
          originalName: fileData.originalName,
          mimeType: fileData.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          selectedData: selection.data,
          xColumns: selection.xColumns,
          yColumns: selection.yColumns
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Enhance analysis with CEO-friendly KPIs and advanced insights
        if (result.data && result.columns) {
          result.kpis = calculateKPIs(result.data, result.columns)
          result.enhancedInsights = generateInsights(result.data, result.columns)
          
          // Perform advanced executive analysis
          const executiveAnalysis = performExecutiveAnalysis(result.data, result.columns)
          result.executiveAnalysis = executiveAnalysis
          
          // Override summary with executive analysis if available
          if (executiveAnalysis.summary) {
            result.enhancedInsights = executiveAnalysis.summary
          }
        }
        
        setAnalysisData(result)
        onAnalysisComplete?.(result)
        
        toast({
          title: 'Analysis Complete',
          description: `Successfully analyzed X: ${selection.xColumns[0]} and Y: ${selection.yColumns[0]} from ${selection.sheetName}.`,
        })
      } else {
        throw new Error('Analysis failed')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze the selected data')
      toast({
        title: 'Analysis Failed',
        description: 'There was an error analyzing your data.',
        variant: 'destructive'
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleStartOver = () => {
    setAnalysisData(null)
    setShowDataSelector(true)
    setSelectedData(null)
    setError(null)
    toast({
      title: 'Reset Complete',
      description: 'You can now select different data to analyze.',
    })
  }

  if (!fileData) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No File Selected
        </h3>
        <p className="text-gray-500">
          Please upload a file first to begin analysis.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          Analysis Failed
        </h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button 
          onClick={analyzeFile}
          className="ceo-button-primary"
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (isAnalyzing) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-16 h-16 mx-auto text-thompson-blue animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-thompson-navy mb-2">
          Analyzing Your Data...
        </h3>
        <p className="text-gray-600">
          Please wait while we process "{fileData.originalName}" and generate insights.
        </p>
        <div className="mt-6 bg-slate-100 rounded-full h-2 max-w-md mx-auto">
          <div className="bg-thompson-lime h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Show Data Selector - always visible for real-time changes */}
      {showDataSelector && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <InteractiveDataSelector
            fileData={fileData}
            onDataSelected={handleDataSelected}
          />
        </motion.div>
      )}

      {/* File Info Header - only show when analysis is done */}
      {analysisData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">
                Analysis Complete: {fileData.originalName}
              </h3>
              <p className="text-sm text-green-600">
                {selectedData ? `Analyzed X: ${selectedData.xColumns.join(', ')} • Y: ${selectedData.yColumns.join(', ')} from ${selectedData.sheetName}` : 
                `File size: ${(fileData.size / 1024).toFixed(1)} KB • Uploaded: ${new Date(fileData.createdAt).toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleStartOver}
              className="bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <Settings className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            {analysisData?.columns && (
              <ColumnEditor 
                columns={analysisData.columns} 
                onMappingChange={handleColumnMappingChange}
              />
            )}
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button size="sm" variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Present Mode
            </Button>
          </div>
        </motion.div>
      )}

      {/* View Mode Toggle */}
      {analysisData && (
        <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />
      )}

      {/* Executive KPIs - Only in Executive Mode */}
      {analysisData?.kpis && viewMode === 'executive' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ceo-card p-6"
        >
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-thompson-lime mr-3" />
            <h3 className="text-h2">Key Performance Indicators</h3>
          </div>
          <ExecutiveKPIs kpis={analysisData.kpis} />
        </motion.div>
      )}

      {/* Advanced Executive Insights - Only in Executive Mode */}
      {analysisData?.executiveAnalysis && viewMode === 'executive' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <ExecutiveInsights 
            trends={analysisData.executiveAnalysis.trends}
            anomalies={analysisData.executiveAnalysis.anomalies}
            drivers={analysisData.executiveAnalysis.drivers}
            recommendations={analysisData.executiveAnalysis.recommendations}
          />
        </motion.div>
      )}

      {/* Executive Summary */}
      {(analysisData?.summary || analysisData?.enhancedInsights) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="ceo-card p-6"
        >
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-thompson-blue mr-3" />
            <h3 className="text-h2">Executive Summary</h3>
          </div>
          <div className="prose max-w-none text-gray-700">
            <p className="text-body leading-relaxed">
              {analysisData?.enhancedInsights || analysisData?.summary}
            </p>
          </div>
        </motion.div>
      )}

      {/* Professional Charts */}
      {analysisData?.charts && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="ceo-card p-6"
        >
          <div className="flex items-center mb-6">
            <BarChart3 className="w-6 h-6 text-thompson-blue mr-3" />
            <h3 className="text-h2">
              {viewMode === 'executive' ? 'Key Visualizations' : 'Detailed Analytics'}
            </h3>
          </div>
          <EnhancedCharts charts={analysisData.charts} mode={viewMode} />
        </motion.div>
      )}

      {/* Custom Chart Builder - Show when we have data */}
      {analysisData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <CustomChartBuilder 
            columns={analysisData.columns || []}
            numericColumns={analysisData.dataInfo?.numericColumns || analysisData.columns || []}
            categoricalColumns={analysisData.dataInfo?.categoricalColumns || analysisData.columns || []}
            data={analysisData.data || []}
            onCreateChart={handleCreateCustomChart}
          />
        </motion.div>
      )}

      {/* Custom Charts Display */}
      {customCharts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="ceo-card p-6"
        >
          <div className="flex items-center mb-6">
            <BarChart3 className="w-6 h-6 text-thompson-lime mr-3" />
            <h3 className="text-h2">Custom Charts</h3>
          </div>
          <EnhancedCharts charts={customCharts} mode={viewMode} />
        </motion.div>
      )}

      {/* Data Table - Only in Analyst Mode */}
      {viewMode === 'analyst' && analysisData?.data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="ceo-card p-6"
        >
          <div className="flex items-center mb-6">
            <Settings className="w-6 h-6 text-thompson-blue mr-3" />
            <h3 className="text-h2">Data Table</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="professional-table">
              <thead>
                <tr>
                  {analysisData.columns?.slice(0, 10).map((col: string) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysisData.data?.slice(0, 100).map((row: any, index: number) => (
                  <tr key={index}>
                    {analysisData.columns?.slice(0, 10).map((col: string) => (
                      <td key={col}>{String(row[col] || '-')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {analysisData.data?.length > 100 && (
            <p className="text-sm text-gray-500 mt-4">
              Showing first 100 rows of {analysisData.data.length} total records.
            </p>
          )}
        </motion.div>
      )}

      {/* No analysis data yet - show placeholder */}
      {!analysisData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-slate-50 rounded-lg"
        >
          <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Ready for Analysis
          </h3>
          <p className="text-gray-500 mb-6">
            File "{fileData.originalName}" is uploaded and ready to be analyzed.
          </p>
          <Button 
            onClick={analyzeFile}
            className="ceo-button-primary"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Analyze Data
          </Button>
        </motion.div>
      )}
    </div>
  )
}
