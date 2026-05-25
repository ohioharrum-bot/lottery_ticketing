'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Book, Shift, ShiftEntry } from '@/types'
import dynamic from 'next/dynamic'

const Scanner = dynamic<{ onScan: (decoded: string) => Promise<void>; onClose: () => void }>(
  () => import('@/components/ui/Scanner'),
  { ssr: false }
)

export default function ScanPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [entries, setEntries] = useState<ShiftEntry[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [scanMode, setScanMode] = useState<'start' | 'end'>('start')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)

  // manual entry state
  const [manualBook, setManualBook] = useState('')
  const [manualTicket, setManualTicket] = useState('')
  const [manualMode, setManualMode] = useState<'start' | 'end'>('start')

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: bookData } = await supabase.from('books').select('*')
    setBooks(bookData || [])

    const { data: shiftData } = await supabase
      .from('shifts').select('*').eq('is_active', true).maybeSingle()
    setActiveShift(shiftData)

    if (shiftData) {
      const { data: entryData } = await supabase
        .from('shift_entries').select('*').eq('shift_id', shiftData.id)
      setEntries(entryData || [])
    }
  }, [supabase])

  useEffect(() => {
    const load = async () => {
      await fetchData()
    }
    load()
  }, [fetchData])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])

  function parseBarcode(decoded: string) {
  // format: 1092-0018660-002-3
  const parts = decoded.split('-')
  const bookNum = parts[0]
  const ticketNum = parseInt(parts[parts.length - 2])
  return { bookNum, ticketNum }
}

  const logEntry = useCallback(async (book: Book, ticketNum: number, mode: 'start' | 'end') => {
    if (!activeShift) return
    setLoading(true)
    const existingEntry = entries.find(e => e.book_id === book.id)

    if (mode === 'start') {
      if (existingEntry) {
        showToast(`Book ${book.book_number} already has a start ticket`)
        setLoading(false)
        return
      }
      const { error } = await supabase.from('shift_entries').insert({
        shift_id: activeShift.id,
        book_id: book.id,
        start_ticket: ticketNum,
      })
      if (!error) showToast(`Start ticket ${ticketNum} logged for ${book.game_name}`)
      else showToast('Error saving')
    } else {
      if (!existingEntry) {
        showToast(`Scan start ticket for ${book.game_name} first`)
        setLoading(false)
        return
      }
      if (ticketNum <= existingEntry.start_ticket) {
        showToast('End ticket must be greater than start ticket')
        setLoading(false)
        return
      }
      const { error } = await supabase.from('shift_entries')
        .update({ end_ticket: ticketNum })
        .eq('id', existingEntry.id)
      if (!error) {
        const sold = ticketNum - existingEntry.start_ticket
        const cash = sold * book.ticket_price
        showToast(`${sold} tickets sold — $${cash.toFixed(2)}`)
      } else showToast('Error saving')
    }

    fetchData()
    setLoading(false)
  }, [activeShift, entries, fetchData, showToast, supabase])

  async function handleScan(decoded: string) {
  setShowScanner(false)
  showToast(decoded) 
}

function handleManual() {
  if (!activeShift) { showToast('Start a shift first'); return }
  if (!manualBook) { showToast('Enter barcode or book number'); return }

  // handle full barcode input like 1092-0018660-002-3
  // OR just book number like 1092
  let bookNum = ''
  let ticketNum = 0

  if (manualBook.includes('-')) {
    const parts = manualBook.split('-')
    bookNum = parts[0]
    ticketNum = parseInt(parts[parts.length - 2])
  } else {
    bookNum = manualBook
    ticketNum = parseInt(manualTicket)
  }

  const book = books.find(b => b.book_number === bookNum)
  if (!book) { showToast(`Book ${bookNum} not found`); return }

  logEntry(book, ticketNum, manualMode)
  setManualBook('')
  setManualTicket('')
}

  const getEntrySummary = useCallback((entry: ShiftEntry) => {
    const book = books.find(b => b.id === entry.book_id)
    if (!book) return null
    const sold = entry.end_ticket ? entry.end_ticket - entry.start_ticket : null
    const cash = sold !== null ? sold * book.ticket_price : null
    return { book, sold, cash }
  }, [books])

  const totalCash = entries.reduce((sum, e) => {
    const s = getEntrySummary(e)
    return sum + (s?.cash || 0)
  }, 0)

  return (
    <div className="px-4 pt-6">
      {showScanner && (
        <Scanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <h1 className="text-xl font-semibold mb-2">Scan</h1>

      {!activeShift && (
        <div className="bg-amber-50 text-amber-700 text-sm px-3 py-2 rounded-lg mb-4">
          Start a shift first from the History tab.
        </div>
      )}

      {activeShift && (
        <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg mb-4">
          Shift active · Cash so far: <span className="font-semibold">${totalCash.toFixed(2)}</span>
        </div>
      )}

      {/* scan mode toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Scan mode</p>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setScanMode('start')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              scanMode === 'start'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            Start of shift
          </button>
          <button
            onClick={() => setScanMode('end')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              scanMode === 'end'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            End of shift
          </button>
        </div>

        <button
          onClick={() => setShowScanner(true)}
          disabled={!activeShift}
          className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          📷 Scan barcode — {scanMode === 'start' ? 'Start ticket' : 'End ticket'}
        </button>
      </div>

      {/* manual entry */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Manual entry</p>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setManualMode('start')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
              manualMode === 'start'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            Start
          </button>
          <button
            onClick={() => setManualMode('end')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
              manualMode === 'end'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            End
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <input
            type="text"
            placeholder="Book # (e.g. 1092)"
            value={manualBook}
            onChange={e => setManualBook(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
          />
          <input
            type="number"
            placeholder="Ticket # (e.g. 002)"
            value={manualTicket}
            onChange={e => setManualTicket(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
          />
        </div>
        <button
          onClick={handleManual}
          disabled={loading || !activeShift}
          className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Log Entry'}
        </button>
      </div>

      {/* current shift entries */}
      {entries.length > 0 && (
        <>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">This shift</p>
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
                        {entry.end_ticket ? ` · End: ${entry.end_ticket}` : ' · waiting for end scan'}
                      </p>
                    </div>
                    <div className="text-right">
                      {s.sold !== null ? (
                        <>
                          <p className="text-sm font-semibold text-green-600">${s.cash!.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{s.sold} sold</p>
                        </>
                      ) : (
                        <p className="text-xs text-amber-500">pending</p>
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
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-full whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}