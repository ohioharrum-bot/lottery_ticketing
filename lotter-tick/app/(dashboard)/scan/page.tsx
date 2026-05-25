'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Book, Shift, ShiftEntry } from '@/types'

export default function ScanPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [entries, setEntries] = useState<ShiftEntry[]>([])
  const [mode, setMode] = useState<'start' | 'end'>('start')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

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

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function parseInput(raw: string) {
    const cleaned = raw.trim()
    if (cleaned.includes('-')) {
      const parts = cleaned.split('-')
      const bookNum = parts[0]
      const ticketNum = parseInt(parts[parts.length - 2])
      return { bookNum, ticketNum }
    }
    return { bookNum: cleaned, ticketNum: 0 }
  }

  async function logEntry() {
    if (!activeShift) { showToast('Start a shift first'); return }
    if (!input) { showToast('Enter barcode number'); return }

    const { bookNum, ticketNum } = parseInput(input)
    const book = books.find(b => b.book_number === bookNum)

    if (!book) { showToast(`Book ${bookNum} not found — add in Setup`); return }

    const existingEntry = entries.find(e => e.book_id === book.id)

    if (mode === 'start') {
      if (existingEntry) {
        showToast(`Book ${bookNum} already has a start ticket`)
        return
      }
      setLoading(true)
      const { error } = await supabase.from('shift_entries').insert({
        shift_id: activeShift.id,
        book_id: book.id,
        start_ticket: ticketNum,
      })
      if (!error) {
        showToast(`✓ Start ticket ${ticketNum} saved for ${book.game_name}`)
        setInput('')
        fetchData()
      }
    } else {
      if (!existingEntry) {
        showToast(`Log start ticket for ${book.game_name} first`)
        return
      }
      if (ticketNum <= existingEntry.start_ticket) {
        showToast('End ticket must be higher than start ticket')
        return
      }
      setLoading(true)
      const { error } = await supabase.from('shift_entries')
        .update({ end_ticket: ticketNum })
        .eq('id', existingEntry.id)
      if (!error) {
        const sold = ticketNum - existingEntry.start_ticket
        const cash = sold * book.ticket_price
        showToast(`✓ ${sold} tickets sold — $${cash.toFixed(2)}`)
        setInput('')
        fetchData()
      }
    }
    setLoading(false)
  }

  function getEntrySummary(entry: ShiftEntry) {
    const book = books.find(b => b.id === entry.book_id)
    if (!book) return null
    const sold = entry.end_ticket ? entry.end_ticket - entry.start_ticket : null
    const cash = sold !== null ? sold * book.ticket_price : null
    return { book, sold, cash }
  }

  const totalCash = entries.reduce((sum, e) => {
    const s = getEntrySummary(e)
    return sum + (s?.cash || 0)
  }, 0)

  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="text-xl font-semibold mb-4">Scan</h1>

      {!activeShift && (
        <div className="bg-amber-50 text-amber-700 text-sm px-3 py-2.5 rounded-lg mb-4">
          Go to History tab and start a shift first.
        </div>
      )}

      {activeShift && (
        <div className="bg-green-50 text-green-700 text-sm px-3 py-2.5 rounded-lg mb-4">
          Shift active · Cash so far: <span className="font-semibold">${totalCash.toFixed(2)}</span>
        </div>
      )}

      {/* mode toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          What are you scanning?
        </p>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('start')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              mode === 'start'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            Start of shift
          </button>
          <button
            onClick={() => setMode('end')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              mode === 'end'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            End of shift
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-2">
          {mode === 'start'
            ? 'Enter the barcode of the first unsold ticket in each book'
            : 'Enter the barcode of the current unsold ticket — app calculates what was sold'
          }
        </p>

        <input
          type="text"
          placeholder="e.g. 1092-0018660-002-3"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && logEntry()}
          className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 mb-3"
        />

        <button
          onClick={logEntry}
          disabled={loading || !activeShift}
          className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : mode === 'start' ? 'Log Start Ticket' : 'Log End Ticket'}
        </button>
      </div>

      {/* entries this shift */}
      {entries.length > 0 && (
        <>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            This shift
          </p>
          <div className="flex flex-col gap-2">
            {entries.map(entry => {
              const s = getEntrySummary(entry)
              if (!s) return null
              return (
                <div key={entry.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{s.book.game_name}</p>
                      <p className="text-xs text-gray-400">
                        Book #{s.book.book_number} · Start: {entry.start_ticket}
                        {entry.end_ticket ? ` → End: ${entry.end_ticket}` : ' · waiting for end'}
                      </p>
                    </div>
                    <div className="text-right">
                      {s.sold !== null ? (
                        <>
                          <p className="text-sm font-semibold text-green-600">${s.cash!.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{s.sold} sold</p>
                        </>
                      ) : (
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
                          pending
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