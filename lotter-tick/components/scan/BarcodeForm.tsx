'use client'

import React, { useRef } from 'react'

interface BarcodeFormProps {
  mode: 'start' | 'end'
  barcode: string
  onChangeBarcode: (val: string) => void
  onSubmit: (e?: React.FormEvent) => void
  onTapScan?: () => void
  disabled?: boolean
  loading?: boolean
}

export function BarcodeForm({
  mode,
  barcode,
  onChangeBarcode,
  onSubmit,
  onTapScan,
  disabled = false,
  loading = false,
}: BarcodeFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!disabled && !loading) {
      onSubmit(e)
    }
  }

  const handleTap = () => {
    if (onTapScan) {
      onTapScan()
    } else {
      inputRef.current?.focus()
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">
          {mode === 'start' ? 'Scan Start Ticket' : 'Scan End Ticket'}
        </span>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Barcode</label>
          <input
            ref={inputRef}
            type="text"
            placeholder="Scan or type barcode"
            value={barcode}
            onChange={(e) => onChangeBarcode(e.target.value)}
            disabled={disabled}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleTap}
            disabled={disabled}
          >
            Tap to Scan
          </button>
          <button
            type="submit"
            className="btn"
            style={{ flex: 1 }}
            disabled={disabled || loading}
          >
            {loading ? 'Saving' : mode === 'start' ? 'Log Start' : 'Log End'}
          </button>
        </div>
      </form>
    </div>
  )
}
