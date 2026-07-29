import React from 'react'

interface AlertBannerProps {
  show?: boolean
  message?: string
}

export function AlertBanner({
  show = true,
  message = 'No active turn. Go to History and start a turn first.',
}: AlertBannerProps) {
  if (!show) return null

  return (
    <div className="alert-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      {message}
    </div>
  )
}
