
/**
 * components/dashboard/ChartExplanation.tsx
 * Renders two styles of explanations: Executive (plain language) and Analyst (detailed).
 */
'use client'
import React from 'react'

export function ChartExplanation(props: {
  mode: 'executive' | 'analyst',
  summary: { title: string, plain: string, technical: string }
}) {
  const { mode, summary } = props
  console.log('ChartExplanation rendering with:', { mode, summary })
  return (
    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="font-semibold text-blue-800 text-sm mb-2">📊 {summary.title}</div>
      {mode === 'executive' ? (
        <p className="text-sm text-blue-700">{summary.plain}</p>
      ) : (
        <p className="text-xs text-blue-600">{summary.technical}</p>
      )}
    </div>
  )
}
