
/**
 * components/dashboard/ProjectionsButton.tsx
 * Simple button that runs Holt‑Winters on a selected measure and renders projections.
 */
'use client'
import React, { useState } from 'react'
import { holtWintersAdditive } from '@/lib/forecast'

export function ProjectionsButton(props: {
  series: { t: string | Date, y: number }[]
  periods?: number
  onProjected?: (forecast: number[]) => void
}) {
  const [loading, setLoading] = useState(false)
  const periods = props.periods ?? 6
  return (
    <button
      className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
      onClick={() => {
        setLoading(true)
        try {
          const y = props.series.map(p => p.y)
          const r = holtWintersAdditive(y, 0, 0.3, 0.1, 0.1, periods)
          props.onProjected?.(r.forecast)
        } finally {
          setLoading(false)
        }
      }}
    >
      {loading ? 'Projecting…' : `⚡ Projections (${periods})`}
    </button>
  )
}
