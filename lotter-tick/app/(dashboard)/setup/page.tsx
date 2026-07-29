'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { AddBookForm } from '@/components/setup/AddBookForm'
import { BooksList } from '@/components/setup/BooksList'
import { createClient } from '@/lib/supabase/client'
import { Book } from '@/types'

const supabase = createClient()

export default function SetupPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [bookNumber, setBookNumber] = useState('')
  const [gameName, setGameName] = useState('')
  const [ticketPrice, setTicketPrice] = useState('')
  const [totalTickets, setTotalTickets] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const fetchBooks = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })
      setBooks(data || [])
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleAddBook = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError('')

    if (!bookNumber.trim() || !gameName.trim() || !ticketPrice.trim() || !totalTickets.trim()) {
      setError('Please fill in all fields')
      return
    }

    const cleanBookNum = bookNumber.trim().replace(/\D/g, '') || bookNumber.trim()

    if (books.find((b) => b.book_number === cleanBookNum)) {
      setError(`Book ${cleanBookNum} already exists in inventory`)
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user ? user.id : 'anonymous'

    const { error: insertErr } = await supabase.from('books').insert({
      user_id: userId,
      book_number: cleanBookNum,
      game_name: gameName.trim(),
      ticket_price: parseFloat(ticketPrice),
      total_tickets: parseInt(totalTickets, 10),
    })

    if (insertErr) {
      setError(insertErr.message)
    } else {
      setBookNumber('')
      setGameName('')
      setTicketPrice('')
      setTotalTickets('')
      showToast(`Book ${cleanBookNum} added`)
      fetchBooks()
    }
    setLoading(false)
  }

  const handleDeleteBook = async (id: string) => {
    try {
      await supabase.from('books').delete().eq('id', id)
      showToast('Book removed')
      fetchBooks()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="app">
      <Sidebar activeItem="Setup" />
      <main className="main">
        <div className="topbar">
          <div>
            <div className="page-eyebrow">Inventory</div>
            <h1>Setup</h1>
          </div>
        </div>

        {/* Add Book Form */}
        <AddBookForm
          bookNumber={bookNumber}
          gameName={gameName}
          ticketPrice={ticketPrice}
          totalTickets={totalTickets}
          onChangeBookNumber={setBookNumber}
          onChangeGameName={setGameName}
          onChangeTicketPrice={setTicketPrice}
          onChangeTotalTickets={setTotalTickets}
          onAddBook={handleAddBook}
          loading={loading}
          error={error}
        />

        {/* All Books List */}
        <BooksList books={books} onDeleteBook={handleDeleteBook} />
      </main>

      {toast ? (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--blue)',
            color: '#fff',
            fontSize: '12.5px',
            fontWeight: 600,
            padding: '10px 20px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 100,
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}