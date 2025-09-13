
/**
 * components/dashboard/ParserDecisionsChip.tsx
 * Displays parser decisions and sheet choice to build user trust.
 */
'use client'
import React from 'react'

export function ParserDecisionsChip(props: {
  headerRow: number
  trimmedFooters: number
  sheetChosen: string
}) {
  const { headerRow, trimmedFooters, sheetChosen } = props
  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
      <span className="font-semibold mr-1">Parser:</span>
      Header row {headerRow + 1} • Trimmed {trimmedFooters} footer rows • Sheet: {sheetChosen}
    </div>
  )
}
