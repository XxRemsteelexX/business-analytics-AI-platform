'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Download, 
  Share2, 
  Expand, 
  Minimize2,
  FileText,
  BarChart3,
  TrendingUp,
  Eye,
  Printer
} from 'lucide-react'
import { motion } from 'framer-motion'
import { ExecutiveKPIs } from './executive-kpis'
import { ExecutiveInsights } from './executive-insights'
import dynamic from 'next/dynamic'

// Dynamic import for charts to avoid SSR issues
const EnhancedCharts = dynamic(() => import('./enhanced-charts'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 chart-skeleton rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-thompson-blue"></div>
    </div>
  )
})

interface ComprehensiveDashboardProps {
  analysisData: any
  fileData: any
  customCharts?: any[]
}

export function ComprehensiveDashboard({ analysisData, fileData, customCharts = [] }: ComprehensiveDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  if (!analysisData) {
    return null
  }

  const allCharts = [...(analysisData.charts || []), ...customCharts]
  
  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Create a comprehensive dashboard export
      const dashboardData = {
        fileName: fileData.originalName,
        timestamp: new Date().toISOString(),
        kpis: analysisData.kpis,
        insights: analysisData.enhancedInsights || analysisData.summary,
        executiveAnalysis: analysisData.executiveAnalysis,
        chartCount: allCharts.length,
        dataRows: analysisData.data?.length || 0
      }

      // Create a downloadable JSON file with the dashboard data
      const blob = new Blob([JSON.stringify(dashboardData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `executive-dashboard-${fileData.originalName}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Executive Dashboard - ${fileData.originalName}`,
          text: `Comprehensive analysis dashboard with ${allCharts.length} charts and key insights`,
          url: window.location.href
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const DashboardContent = ({ compact = false }) => (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-thompson-navy mb-2">
          Executive Dashboard
        </h1>
        <p className="text-gray-600">
          Comprehensive analysis for {fileData.originalName}
        </p>
        <div className="flex justify-center gap-4 mt-4 text-sm text-gray-500">
          <span>Generated: {new Date().toLocaleDateString()}</span>
          <span>•</span>
          <span>{allCharts.length} Charts</span>
          <span>•</span>
          <span>{analysisData.data?.length || 0} Data Points</span>
        </div>
      </div>

      {/* Key Performance Indicators */}
      {analysisData?.kpis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ceo-card p-6"
        >
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-thompson-lime mr-3" />
            <h2 className="text-2xl font-bold text-thompson-navy">Key Performance Indicators</h2>
          </div>
          <ExecutiveKPIs kpis={analysisData.kpis} />
        </motion.div>
      )}

      {/* Executive Insights */}
      {analysisData?.executiveAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
            <h2 className="text-2xl font-bold text-thompson-navy">Executive Summary</h2>
          </div>
          <div className="prose max-w-none text-gray-700">
            <p className="text-lg leading-relaxed">
              {analysisData?.enhancedInsights || analysisData?.summary}
            </p>
          </div>
        </motion.div>
      )}

      {/* All Charts */}
      {allCharts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="ceo-card p-6"
        >
          <div className="flex items-center mb-6">
            <BarChart3 className="w-6 h-6 text-thompson-blue mr-3" />
            <h2 className="text-2xl font-bold text-thompson-navy">Visual Analytics</h2>
          </div>
          <EnhancedCharts charts={allCharts} mode="executive" />
        </motion.div>
      )}

      {/* Data Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="ceo-card p-6"
      >
        <h2 className="text-2xl font-bold text-thompson-navy mb-4">Data Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-thompson-blue mb-2">
                  {analysisData.data?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-thompson-lime mb-2">
                  {analysisData.columns?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Data Columns</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-thompson-blue mb-2">
                  {allCharts.length}
                </div>
                <div className="text-sm text-gray-600">Visualizations</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )

  return (
    <div>
      {/* Compact Dashboard Card */}
      <div className="ceo-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-thompson-navy mb-2">
              Executive Dashboard
            </h2>
            <p className="text-gray-600">
              Comprehensive analysis with {allCharts.length} charts and executive insights
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsExpanded(true)}
              className="ceo-button-secondary"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Full Dashboard
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="ceo-button-primary"
            >
              {isExporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {analysisData?.kpis?.slice(0, 3).map((kpi: any, index: number) => (
            <Card key={index} className="bg-gradient-to-r from-thompson-blue to-thompson-lime text-white">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">
                    {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                  </div>
                  <div className="text-sm opacity-90">{kpi.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 text-center">
            Dashboard includes: Executive Summary, {allCharts.length} Professional Charts, Key Performance Indicators, and Strategic Recommendations
          </div>
        </div>
      </div>

      {/* Expanded Dashboard Modal */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="text-2xl font-bold text-thompson-navy">
                Executive Dashboard
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  size="sm"
                  className="ceo-button-primary"
                >
                  {isExporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export
                </Button>
                <Button
                  onClick={handleShare}
                  size="sm"
                  variant="outline"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  onClick={() => window.print()}
                  size="sm"
                  variant="outline"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6">
            <DashboardContent />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}