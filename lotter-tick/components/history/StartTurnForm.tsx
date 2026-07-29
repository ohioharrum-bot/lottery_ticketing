'use client'

import React from 'react'

interface StartTurnFormProps {
  personName: string
  onChangePersonName: (val: string) => void
  onStartTurn: (e?: React.FormEvent) => void
  loading?: boolean
}

export function StartTurnForm({
  personName,
  onChangePersonName,
  onStartTurn,
  loading = false,
}: StartTurnFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loading) {
      onStartTurn(e)
    }
  }

  return (
    <div className="panel" style={{ marginBottom: '14px' }}>
      <div className="panel-head">
        <span className="panel-title">Start New Turn</span>
      </div>
      <form onSubmit={handleSubmit} className="inline-form">
        <div className="field">
          <label>Person</label>
          <input
            type="text"
            placeholder="Person name"
            value={personName}
            onChange={(e) => onChangePersonName(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '11px 20px' }}
          disabled={loading}
        >
          {loading ? 'Starting' : 'Start Turn'}
        </button>
      </form>
    </div>
  )
}
