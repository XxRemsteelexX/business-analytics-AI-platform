
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
  return (
    <div className="mt-2 text-sm text-slate-700">
      <div className="font-semibold">{summary.title}</div>
      {mode === 'executive' ? (
        <p>{summary.plain}</p>
      ) : (
        <p>{summary.technical}</p>
      )}
    </div>
  )
}
