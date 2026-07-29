import React from 'react'

interface TurnToggleProps {
  mode: 'start' | 'end'
  onToggle: (mode: 'start' | 'end') => void
  hasActiveTurn: boolean
}

export function TurnToggle({ mode, onToggle, hasActiveTurn }: TurnToggleProps) {
  return (
    <div className="toggle-row">
      <div
        className={`toggle-btn ${mode === 'start' ? 'is-primary' : ''}`}
        onClick={() => onToggle('start')}
      >
        Start of Turn
      </div>
      <div
        className={`toggle-btn ${
          mode === 'end' ? 'is-primary' : !hasActiveTurn ? 'is-disabled' : ''
        }`}
        onClick={() => {
          if (hasActiveTurn) onToggle('end')
        }}
      >
        End of Turn
      </div>
    </div>
  )
}
