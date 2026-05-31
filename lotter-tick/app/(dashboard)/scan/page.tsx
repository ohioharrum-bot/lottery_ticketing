'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Book, Shift, ShiftEntry } from '@/types'

export default function ScanPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [entries, setEntries] = useState<ShiftEntry[]>([])
  const [mode, setMode] = useState<'start' | 'end'>('start')
  const [input, setInput] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBookNum, setNewBookNum] = useState('')
  const [newGameName, setNewGameName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  async function fetchData() {
    const { data: bookData } = await supabase.from('books').select('*')
    setBooks(bookData || [])

    const { data: shiftData } = await supabase
      .from('shifts').select('*').eq('is_active', true).single()
    setActiveShift(shiftData)

    if (shiftData) {
      const { data: entryData } = await supabase
        .from('shift_entries').select('*').eq('shift_id', shiftData.id)
      setEntries(entryData || [])
    }
  }

  useEffect(() => { fetchData() }, [])

  // keep input focused always
  useEffect(() => {
    inputRef.current?.focus()
  }, [entries, showAddForm])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function handleSubmit(rawInput?: string) {
    const val = rawInput || input
    if (!activeShift) { showToast('Start a shift first'); return }
    if (!val.trim()) { showToast('Scan or enter barcode'); return }

    // strip dashes, take first 14 characters
    const barcode = val.trim().replace(/-/g, '').substring(0, 14)
    const bookNum = barcode.substring(0, 4)
    const ticketNum = parseInt(barcode.substring(11, 14))

    if (!bookNum || isNaN(ticketNum)) {
      showToast('Invalid barcode')
      setInput('')
      return
    }

    const book = books.find(b => b.book_number === bookNum)

    if (!book) {
      setNewBookNum(bookNum)
      setShowAddForm(true)
      setInput('')
      return
    }

    const existingEntry = entries.find(e => e.book_id === book.id)
    setLoading(true)

    if (mode === 'start') {
      if (existingEntry) {
        showToast(`${book.game_name} already started`)
        setInput('')
        setLoading(false)
        return
      }
      const { error } = await supabase.from('shift_entries').insert({
        shift_id: activeShift.id,
        book_id: book.id,
        start_ticket: ticketNum,
      })
      if (!error) {
        showToast(`✓ Start ticket ${ticketNum} saved — ${book.game_name}`)
        setInput('')
        fetchData()
      } else {
        showToast('Error saving')
      }
    } else {
      if (!existingEntry) {
        showToast(`Log start ticket for ${book.game_name} first`)
        setInput('')
        setLoading(false)
        return
      }
      if (ticketNum <= existingEntry.start_ticket) {
        showToast('End ticket must be higher than start')
        setInput('')
        setLoading(false)
        return
      }
      const { error } = await supabase.from('shift_entries')
        .update({ end_ticket: ticketNum })
        .eq('id', existingEntry.id)
      if (!error) {
        const sold = ticketNum - existingEntry.start_ticket
        const cash = sold * book.ticket_price
        showToast(`✓ ${sold} tickets sold — $${cash.toFixed(2)}`)
        setInput('')
        fetchData()
      } else {
        showToast('Error saving')
      }
    }
    setLoading(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/-/g, '').substring(0, 14)
    setInput(val)
    if (val.length === 14) {
      setTimeout(() => handleSubmit(val), 100)
    }
  }

  async function addBook() {
    if (!newBookNum || !newGameName || !newPrice) {
      showToast('Fill all fields')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('books').insert({
      user_id: user!.id,
      book_number: newBookNum,
      game_name: newGameName,
      ticket_price: parseFloat(newPrice),
      total_tickets: 300,
    })
    if (!error) {
      showToast(`Book ${newBookNum} added — scan again`)
      setShowAddForm(false)
      setNewBookNum('')
      setNewGameName('')
      setNewPrice('')
      fetchData()
    } else {
      showToast('Error adding book')
    }
    setLoading(false)
  }

  const totalCash = entries.reduce((sum, e) => {
    const book = books.find(b => b.id === e.book_id)
    if (!book || !e.end_ticket) return sum
    return sum + (e.end_ticket - e.start_ticket) * book.ticket_price
  }, 0)

  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="text-xl font-semibold mb-4">Scan</h1>

      {!activeShift && (
        <div className="bg-amber-50 text-amber-700 text-sm px-3 py-2.5 rounded-lg mb-4">
          Go to History and start a shift first.
        </div>
      )}

      {activeShift && (
        <div className="bg-green-50 text-green-700 text-sm px-3 py-2.5 rounded-lg mb-4">
          Shift active · Cash so far:{' '}
          <span className="font-semibold">${totalCash.toFixed(2)}</span>
        </div>
      )}

      {/* mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('start')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${
            mode === 'start'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200'
          }`}
        >
          Start of shift
        </button>
        <button
          onClick={() => setMode('end')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${
            mode === 'end'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200'
          }`}
        >
          End of shift
        </button>
      </div>

      {/* scan input */}
      {!showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <p className="text-xs text-gray-400 mb-2">
            Scan barcode or type manually
          </p>
          <input
            ref={inputRef}
            type="text"
            placeholder="Scan or type barcode..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 mb-3"
            autoFocus
          />
          <button
            onClick={() => inputRef.current?.focus()}
            disabled={!activeShift}
            className="w-full py-4 bg-gray-900 text-white rounded-xl text-base font-medium disabled:opacity-50 mb-3"
          >
            📷 Tap to Scan
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !activeShift}
            className="w-full py-3 bg-gray-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : mode === 'start' ? 'Log Start Ticket' : 'Log End Ticket'}
          </button>
        </div>
      )}

      {/* add book form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-amber-200 p-4 mb-4">
          <p className="text-sm font-medium mb-1">Book {newBookNum} not found</p>
          <p className="text-xs text-gray-400 mb-3">Add it to continue</p>
          <div className="flex flex-col gap-2 mb-3">
            <input
              type="text"
              placeholder="Game name (e.g. MONOPOLY 2)"
              value={newGameName}
              onChange={e => setNewGameName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
            />
            <input
              type="number"
              placeholder="Ticket price ($)"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAddForm(false); setInput('') }}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={addBook}
              disabled={loading}
              className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Book'}
            </button>
          </div>
        </div>
      )}

      {/* this shift entries */}
      {entries.length > 0 && (
        <>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            This shift
          </p>
          <div className="flex flex-col gap-2">
            {entries.map(entry => {
              const book = books.find(b => b.id === entry.book_id)
              if (!book) return null
              const sold = entry.end_ticket
                ? entry.end_ticket - entry.start_ticket
                : null
              const cash = sold !== null ? sold * book.ticket_price : null
              return (
                <div key={entry.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{book.game_name}</p>
                      <p className="text-xs text-gray-400">
                        #{book.book_number} · {entry.start_ticket} → {entry.end_ticket ?? 'pending'}
                      </p>
                    </div>
                    <div className="text-right">
                      {sold !== null ? (
                        <>
                          <p className="text-sm font-semibold text-green-600">
                            ${cash!.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">{sold} sold</p>
                        </>
                      ) : (
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
                          waiting end
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-full whitespace-nowrap z-50">
          {toast}
        </div>
      )}
    </div>
  )
}