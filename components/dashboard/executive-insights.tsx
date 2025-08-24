
'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Target, CheckCircle, AlertCircle, Info } from 'lucide-react'
import type { TrendAnalysis, Anomaly, TopDriver, ExecutiveRecommendation } from '@/lib/advanced-analysis'

interface ExecutiveInsightsProps {
  trends: TrendAnalysis | null
  anomalies: Anomaly[]
  drivers: TopDriver[]
  recommendations: ExecutiveRecommendation[]
}

export function ExecutiveInsights({ 
  trends, 
  anomalies, 
  drivers, 
  recommendations 
}: ExecutiveInsightsProps) {
  return (
    <div className="space-y-6">
      {/* Trend Analysis */}
      {trends && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ceo-card p-6"
        >
          <div className="flex items-center mb-4">
            <TrendingUp className={`w-6 h-6 mr-3 ${
              trends.direction === 'up' ? 'text-green-600' :
              trends.direction === 'down' ? 'text-red-600' : 'text-gray-600'
            }`} />
            <h3 className="text-h2">Trend Analysis</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-3xl font-bold ${
              trends.direction === 'up' ? 'text-green-600' :
              trends.direction === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trends.direction === 'up' ? '+' : trends.direction === 'down' ? '-' : ''}
              {trends.percentage.toFixed(1)}%
            </div>
            <div>
              <p className="text-body">{trends.description}</p>
              <p className="text-sm text-gray-500">Over {trends.period}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Top Drivers */}
      {drivers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ceo-card p-6"
        >
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 mr-3 text-thompson-blue" />
            <h3 className="text-h2">Key Performance Drivers</h3>
          </div>
          <div className="space-y-3">
            {drivers.map((driver, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-thompson-navy">{driver.value}</p>
                  <p className="text-sm text-gray-600">{driver.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-thompson-navy">
                    {driver.impact.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">Contribution</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="ceo-card p-6"
        >
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 mr-3 text-orange-600" />
            <h3 className="text-h2">Data Anomalies</h3>
          </div>
          <div className="space-y-3">
            {anomalies.map((anomaly, index) => (
              <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                anomaly.severity === 'high' ? 'bg-red-50 border-l-4 border-red-400' :
                anomaly.severity === 'medium' ? 'bg-orange-50 border-l-4 border-orange-400' :
                'bg-yellow-50 border-l-4 border-yellow-400'
              }`}>
                <AlertCircle className={`w-5 h-5 mt-0.5 ${
                  anomaly.severity === 'high' ? 'text-red-600' :
                  anomaly.severity === 'medium' ? 'text-orange-600' :
                  'text-yellow-600'
                }`} />
                <div>
                  <p className="font-medium">{anomaly.field}: {anomaly.value}</p>
                  <p className="text-sm text-gray-600">{anomaly.description}</p>
                  <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
                    anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                    anomaly.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {anomaly.severity.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Executive Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="ceo-card p-6"
        >
          <div className="flex items-center mb-4">
            <CheckCircle className="w-6 h-6 mr-3 text-thompson-lime" />
            <h3 className="text-h2">Executive Recommendations</h3>
          </div>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border-l-4 border-thompson-lime pl-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-thompson-navy">{rec.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                <div className="bg-slate-50 p-3 rounded">
                  <div className="flex items-center mb-1">
                    <Info className="w-4 h-4 mr-2 text-thompson-blue" />
                    <span className="text-sm font-medium">Recommended Action:</span>
                  </div>
                  <p className="text-sm text-gray-700 ml-6">{rec.action}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
