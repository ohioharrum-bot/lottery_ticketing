'use client'

import { useState } from 'react'

export type DataPoint = {
  label: string
  value: number
}

interface SalesChartProps {
  data?: DataPoint[]
}

export function SalesChart({ data = [] }: SalesChartProps) {
  const [range, setRange] = useState<'Today' | 'This Week' | 'Month'>('This Week')

  const hasData = data && data.length > 0 && data.some((d) => d.value > 0)
  const maxVal = hasData ? Math.max(...data.map((d) => d.value)) : 100

  // Calculate SVG path points dynamically
  const svgWidth = 600
  const svgHeight = 160
  const points = (data.length > 0 ? data : [
    { label: 'Mon', value: 0 },
    { label: 'Tue', value: 0 },
    { label: 'Wed', value: 0 },
    { label: 'Thu', value: 0 },
    { label: 'Fri', value: 0 },
    { label: 'Sat', value: 0 },
    { label: 'Sun', value: 0 },
  ]).map((item, index, arr) => {
    const x = (index / Math.max(arr.length - 1, 1)) * svgWidth
    const y = hasData ? svgHeight - (item.value / maxVal) * (svgHeight - 40) - 20 : svgHeight - 20
    return { x, y }
  })

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ')
  const areaStr = `M0,${svgHeight} ` + points.map((p) => `L${p.x},${p.y}`).join(' ') + ` L${svgWidth},${svgHeight} Z`

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Sales Overview</span>
        <div className="range-toggle">
          <span
            className={range === 'Today' ? 'active' : ''}
            onClick={() => setRange('Today')}
          >
            Today
          </span>
          <span
            className={range === 'This Week' ? 'active' : ''}
            onClick={() => setRange('This Week')}
          >
            This Week
          </span>
          <span
            className={range === 'Month' ? 'active' : ''}
            onClick={() => setRange('Month')}
          >
            Month
          </span>
        </div>
      </div>
      <div className="chart-wrap">
        {!hasData ? (
          <div className="empty-state" style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No sales data recorded yet.
          </div>
        ) : (
          <>
            <svg width="100%" height="170" viewBox="0 0 600 170" preserveAspectRatio="none">
              <line className="chart-grid-line" x1="0" y1="20" x2="600" y2="20" />
              <line className="chart-grid-line" x1="0" y1="60" x2="600" y2="60" />
              <line className="chart-grid-line" x1="0" y1="100" x2="600" y2="100" />
              <line className="chart-grid-line" x1="0" y1="140" x2="600" y2="140" />
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2F6FED" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#2F6FED" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaStr} fill="url(#areaFill)" />
              <polyline
                points={polylineStr}
                fill="none"
                stroke="#2F6FED"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill="#2F6FED" />
              ))}
            </svg>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10.5px',
                color: 'var(--text-faint)',
                marginTop: '4px',
              }}
              className="mono"
            >
              {(data.length > 0 ? data : [
                { label: 'Mon' },
                { label: 'Tue' },
                { label: 'Wed' },
                { label: 'Thu' },
                { label: 'Fri' },
                { label: 'Sat' },
                { label: 'Sun' },
              ]).map((d, i) => (
                <span key={i}>{d.label}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
