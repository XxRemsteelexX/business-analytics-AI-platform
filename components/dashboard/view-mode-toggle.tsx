
'use client'

interface ViewModeToggleProps {
  mode: 'executive' | 'analyst'
  onModeChange: (mode: 'executive' | 'analyst') => void
}

export function ViewModeToggle({ mode, onModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="mode-toggle">
        <button
          className={`mode-toggle-button ${mode === 'executive' ? 'active' : ''}`}
          onClick={() => onModeChange('executive')}
        >
          Executive View
        </button>
        <button
          className={`mode-toggle-button ${mode === 'analyst' ? 'active' : ''}`}
          onClick={() => onModeChange('analyst')}
        >
          Analyst View
        </button>
      </div>
    </div>
  )
}
