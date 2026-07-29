'use client'

import React from 'react'

export type PastTurnRow = {
  id: string
  personName: string
  startedAt: string
  endedAt: string | null
  totalAmount?: number | null
  turnNumber?: number
}

interface PastTurnsTableProps {
  turns: PastTurnRow[]
}

export function PastTurnsTable({ turns }: PastTurnsTableProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Past Turns</span>
      </div>
      {turns.length === 0 ? (
        <div className="empty-state">No completed turns yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Person</th>
              <th>Started</th>
              <th>Ended</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {turns.map((turn) => {
              const startStr = turn.startedAt
                ? new Date(turn.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''
              const endStr = turn.endedAt
                ? new Date(turn.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Active'
              const dateStr = turn.startedAt
                ? new Date(turn.startedAt).toLocaleDateString()
                : ''

              return (
                <tr key={turn.id}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{turn.personName}</span>
                    {turn.turnNumber ? (
                      <span className="cell-dim" style={{ marginLeft: '6px', fontSize: '11px' }}>
                        Turn {turn.turnNumber}
                      </span>
                    ) : null}
                    <div className="cell-dim" style={{ fontSize: '10.5px' }}>{dateStr}</div>
                  </td>
                  <td className="cell-mono cell-dim">{startStr}</td>
                  <td className="cell-mono cell-dim">{endStr}</td>
                  <td className="cell-mono" style={{ fontWeight: 600 }}>
                    {turn.totalAmount !== undefined && turn.totalAmount !== null
                      ? `$${turn.totalAmount.toFixed(2)}`
                      : '$0.00'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
