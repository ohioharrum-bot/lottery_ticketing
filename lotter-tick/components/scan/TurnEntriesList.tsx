'use client'

import React from 'react'

export type TurnEntryDisplay = {
  id: string
  bookNumber: string
  gameName: string
  startTicket: number
  endTicket?: number | null
  paymentType?: string | null
  soldCount?: number | null
  amount?: number | null
}

interface TurnEntriesListProps {
  entries: TurnEntryDisplay[]
}

export function TurnEntriesList({ entries }: TurnEntriesListProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">This Turn</span>
      </div>
      {entries.length === 0 ? (
        <div className="empty-state">
          No entries yet.
          <br />
          Scan a barcode to begin.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                background: 'var(--panel-2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{entry.gameName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                  <span className="mono">{entry.bookNumber}</span> · Ticket{' '}
                  <span className="mono">{entry.startTicket}</span>
                  {entry.endTicket !== undefined && entry.endTicket !== null ? (
                    <>
                      {' '}to <span className="mono">{entry.endTicket}</span>
                      {entry.paymentType ? ` · ${entry.paymentType}` : ''}
                    </>
                  ) : (
                    ' to pending'
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {entry.amount !== undefined && entry.amount !== null ? (
                  <>
                    <div className="mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blue-soft)' }}>
                      ${entry.amount.toFixed(2)}
                    </div>
                    <div className="mono" style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>
                      {entry.soldCount} sold
                    </div>
                  </>
                ) : (
                  <span className="status status-low">
                    Pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
