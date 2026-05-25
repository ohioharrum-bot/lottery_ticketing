'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Book } from '@/types'
import dynamic from 'next/dynamic'

const Scanner = dynamic<{ onScan: (decoded: string) => void; onClose: () => void }>(
  () => import('@/components/ui/Scanner'),
  { ssr: false }
)

export default function SetupPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [bookNumber, setBookNumber] = useState('')
  const [gameName, setGameName] = useState('')
  const [ticketPrice, setTicketPrice] = useState('')
  const [totalTickets, setTotalTickets] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  const supabase = createClient()

  const fetchBooks = useCallback(async () => {
    const { data } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
    setBooks(data || [])
  }, [supabase])

  useEffect(() => {
    const load = async () => {
      await fetchBooks()
    }
    load()
  }, [fetchBooks])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }, [])

  const handleScan = useCallback((decoded: string) => {
    setShowScanner(false)
    // barcode format: 1092-0018660-002
    // first 4 digits = book number
    const clean = decoded.replace(/\D/g, '')
    const bookNum = clean.substring(0, 4)
    setBookNumber(bookNum)
    showToast(`Book ${bookNum} scanned`)
  }, [showToast])

  const addBook = useCallback(async () => {
    setError('')
    if (!bookNumber || !gameName || !ticketPrice || !totalTickets) {
      setError('Fill in all fields')
      return
    }
    if (books.find(b => b.book_number === bookNumber)) {
      setError(`Book ${bookNumber} already exists`)
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('books').insert({
      user_id: user!.id,
      book_number: bookNumber,
      game_name: gameName,
      ticket_price: parseFloat(ticketPrice),
      total_tickets: parseInt(totalTickets),
    })

    if (error) { setError(error.message) }
    else {
      setBookNumber('')
      setGameName('')
      setTicketPrice('')
      setTotalTickets('')
      showToast('Book added')
      fetchBooks()
    }
    setLoading(false)
  }, [bookNumber, gameName, ticketPrice, totalTickets, books, supabase, showToast, fetchBooks])

  const deleteBook = useCallback(async (id: string) => {
    await supabase.from('books').delete().eq('id', id)
    fetchBooks()
  }, [supabase, fetchBooks])

  return (
    <div className="px-4 pt-6">
      {showScanner && (
        <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      <h1 className="text-xl font-semibold mb-6">Setup</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Add book</p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>
        )}

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Book number (e.g. 1092)"
            value={bookNumber}
            onChange={e => setBookNumber(e.target.value)}
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
          />
          <button
            onClick={() => setShowScanner(true)}
            className="px-3 py-2.5 bg-gray-900 text-white rounded-lg text-sm"
          >
            📷
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-3">
          <input
            type="text"
            placeholder="Game name (e.g. MONOPOLY 2)"
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Ticket price ($)</label>
              <input
                type="number"
                placeholder="e.g. 10"
                value={ticketPrice}
                onChange={e => setTicketPrice(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Total tickets</label>
              <input
                type="number"
                placeholder="e.g. 300"
                value={totalTickets}
                onChange={e => setTotalTickets(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
              />
            </div>
          </div>
        </div>

        <button
          onClick={addBook}
          disabled={loading}
          className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Book'}
        </button>
      </div>

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
        All books ({books.length})
      </p>

      {books.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No books yet.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {books.map(book => (
            <div key={book.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{book.game_name}</p>
                <p className="text-xs text-gray-400">
                  Book #{book.book_number} · ${book.ticket_price} · {book.total_tickets} tickets
                </p>
              </div>
              <button
                onClick={() => deleteBook(book.id)}
                className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-full">
          {toast}
        </div>
      )}
    </div>
  )
}