import React from 'react'

interface StatCardProps {
  label: string
  value: string
  iconBg: string
  iconSvg: React.ReactNode
  deltaText: string
  deltaType: 'up' | 'down' | 'flat'
}

export function StatCard({
  label,
  value,
  iconBg,
  iconSvg,
  deltaText,
  deltaType,
}: StatCardProps) {
  const deltaClass =
    deltaType === 'up'
      ? 'delta-up'
      : deltaType === 'down'
      ? 'delta-down'
      : 'delta-flat'

  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={{ background: iconBg }}>
          {iconSvg}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className={`stat-delta ${deltaClass}`}>{deltaText}</div>
    </div>
  )
}
