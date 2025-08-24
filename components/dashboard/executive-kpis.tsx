
'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPI {
  label: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

interface ExecutiveKPIsProps {
  kpis: KPI[]
}

export function ExecutiveKPIs({ kpis }: ExecutiveKPIsProps) {
  if (!kpis || kpis.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="kpi-card"
        >
          <div className="kpi-value">{kpi.value}</div>
          <div className="kpi-label">{kpi.label}</div>
          
          {kpi.change && (
            <div className={`kpi-change ${kpi.changeType || 'neutral'}`}>
              <div className="flex items-center justify-center gap-1">
                {kpi.changeType === 'positive' && <TrendingUp className="w-3 h-3" />}
                {kpi.changeType === 'negative' && <TrendingDown className="w-3 h-3" />}
                {kpi.changeType === 'neutral' && <Minus className="w-3 h-3" />}
                {kpi.change}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
