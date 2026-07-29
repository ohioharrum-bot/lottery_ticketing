'use client'

import React from 'react'

interface AddBookFormProps {
  bookNumber: string
  gameName: string
  ticketPrice: string
  totalTickets: string
  onChangeBookNumber: (val: string) => void
  onChangeGameName: (val: string) => void
  onChangeTicketPrice: (val: string) => void
  onChangeTotalTickets: (val: string) => void
  onAddBook: (e?: React.FormEvent) => void
  loading?: boolean
  error?: string
}

export function AddBookForm({
  bookNumber,
  gameName,
  ticketPrice,
  totalTickets,
  onChangeBookNumber,
  onChangeGameName,
  onChangeTicketPrice,
  onChangeTotalTickets,
  onAddBook,
  loading = false,
  error,
}: AddBookFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loading) {
      onAddBook(e)
    }
  }

  return (
    <div className="panel" style={{ marginBottom: '8px' }}>
      <div className="panel-head">
        <span className="panel-title">Add Book</span>
      </div>
      {error ? (
        <div style={{ color: 'var(--red)', fontSize: '12px', marginBottom: '10px' }}>
          {error}
        </div>
      ) : null}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Book Number</label>
          <input
            type="text"
            placeholder="e.g. 1092"
            value={bookNumber}
            onChange={(e) => onChangeBookNumber(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Game Name</label>
          <input
            type="text"
            placeholder="e.g. Monopoly 2"
            value={gameName}
            onChange={(e) => onChangeGameName(e.target.value)}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Ticket Price</label>
            <input
              type="text"
              placeholder="e.g. 10"
              value={ticketPrice}
              onChange={(e) => onChangeTicketPrice(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Total Tickets</label>
            <input
              type="text"
              placeholder="e.g. 300"
              value={totalTickets}
              onChange={(e) => onChangeTotalTickets(e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '14px', padding: '12px' }}
          disabled={loading}
        >
          {loading ? 'Adding Book' : 'Add Book'}
        </button>
      </form>
    </div>
  )
}
