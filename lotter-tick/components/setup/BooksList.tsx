'use client'

import React from 'react'
import { Book } from '@/types'

interface BooksListProps {
  books: Book[]
  onDeleteBook?: (id: string) => void
}

export function BooksList({ books, onDeleteBook }: BooksListProps) {
  return (
    <>
      <div className="section-head">
        <h2>All Books</h2>
        <span className="section-count mono">{books.length} total</span>
      </div>

      {books.length === 0 ? (
        <div className="empty-state">No books yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {books.map((book) => (
            <div key={book.id} className="book-card">
              <div>
                <div className="book-id">
                  Book <span className="mono">{book.book_number}</span>
                </div>
                <div className="book-game">{book.game_name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="book-progress">
                  <div className="book-count mono">${book.ticket_price}</div>
                  <div className="book-left mono">{book.total_tickets} tickets</div>
                </div>
                {onDeleteBook ? (
                  <button
                    type="button"
                    onClick={() => onDeleteBook(book.id)}
                    className="btn"
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      color: 'var(--red)',
                      borderColor: 'rgba(255,92,92,0.25)',
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
