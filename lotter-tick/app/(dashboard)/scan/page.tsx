'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Book, Shift, ShiftEntry } from '@/types'
import dynamic from 'next/dynamic'

const Scanner = dynamic(() => import('@/components/Scanner'), { ssr: false })

export default function ScanPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [entries, setEntries] = useState<ShiftEntry[]>([])
  const [mode, setMode] = useState<'start' | 'end'>('start')
  const [showScanner, setShowScanner] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [scannedBook, setScannedBook] = useState<Book | null>(null)
  const [ticketNum, setTicketNum] = useState('')
  const [manualBookNum, setManualBookNum] = useState('')
  const [manualGame, setManualGame] = useState('')
  const [manualPrice, setManualPrice] = useState('')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)

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

  async function handleScan(decoded: string) {
    setShowScanner(false)
    const bookNum = decoded.trim()
    const book = books.find(b => b.book_number === bookNum)
    if (!book) {
      setManualBookNum(bookNum)
      setShowManual(true)
      showToast(`Book ${bookNum} not found — add it below`)
      return
    }
    setScannedBook(book)
  }

  async function logTicket() {
    if (!activeShift || !scannedBook) return
    if (!ticketNum) { showToast('Enter ticket number'); return }

    const ticket = parseInt(ticketNum)
    const existingEntry = entries.find(e => e.book_id === scannedBook.id)

    setLoading(true)

    if (mode === 'start') {
      if (existingEntry) {
        showToast(`${scannedBook.game_name} already has a start ticket`)
        setLoading(false)
        return
      }
      const { error } = await supabase.from('shift_entries').insert({
        shift_id: activeShift.id,
        book_id: scannedBook.id,
        start_ticket: ticket,
      })
      if (!error) {
        showToast(`✓ Start ticket saved for ${scannedBook.game_name}`)
        setScannedBook(null)
        setTicketNum('')
        fetchData()
      }
    } else {
      if (!existingEntry) {
        showToast(`Log start ticket for ${scannedBook.game_name} first`)
        setLoading(false)
        return
      }
      if (ticket <= existingEntry.start_ticket) {
        showToast('End ticket must be higher than start')
        setLoading(false)
        return
      }
      const { error } = await supabase.from('shift_entries')
        .update({ end_ticket: ticket })
        .eq('id', existingEntry.id)
      if (!error) {
        const sold = ticket - existingEntry.start_ticket
        showToast(`✓ ${sold} tickets sold — $${(sold * scannedBook.ticket_price).toFixed(2)}`)
        setScannedBook(null)
        setTicketNum('')
        fetchData()
      }
    }
    setLoading(false)
  }

  async function addBookAndLog() {
    if (!manualBookNum || !manualGame || !manualPrice) {
      showToast('Fill all fields')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('books').insert({
      user_id: user!.id,
      book_number: manualBookNum,
      game_name: manualGame,
      ticket_price: parseFloat(manualPrice),
      total_tickets: 300,
    }).select().single()

    if (!error && data) {
      showToast(`Book ${manualBookNum} added`)
      setShowManual(false)
      setScannedBook(data)
      setManualBookNum('')
      setManualGame('')
      setManualPrice('')
      fetchData()
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
      {showScanner && (
        <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      <h1 className="text-xl font-semibold mb-4">Scan</h1>

      {!activeShift && (
        <div className="bg-amber-50 text-amber-700 text-sm px-3 py-2.5 rounded-lg mb-4">
          Go to History and start a shift first.
        </div>
      )}

      {activeShift && (
        <div className="bg-green-50 text-green-700 text-sm px-3 py-2.5 rounded-lg mb-4">
          Shift active · Cash: <span className="font-semibold">${totalCash.toFixed(2)}</span>
        </div>
      )}

      {/* mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('start')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${
            mode === 'start' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
          }`}
        >
          Start of shift
        </button>
        <button
          onClick={() => setMode('end')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${
            mode === 'end' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
          }`}
        >
          End of shift
        </button>
      </div>

      {/* scan button */}
      {!scannedBook && (
        <button
          onClick={() => setShowScanner(true)}
          disabled={!activeShift}
          className="w-full py-4 bg-gray-900 text-white rounded-xl text-sm font-medium disabled:opacity-50 mb-4"
        >
          📷 Scan QR Code
        </button>
      )}

      {/* scanned book — enter ticket number */}
      {scannedBook && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="font-medium">{scannedBook.game_name}</p>
              <p className="text-xs text-gray-400">Book #{scannedBook.book_number} · ${scannedBook.ticket_price}/ticket</p>
            </div>
            <button onClick={() => setScannedBook(null)} className="text-xs text-gray-400">✕</button>
          </div>
          <input
            type="number"
            placeholder="Enter ticket number (e.g. 002)"
            value={ticketNum}
            onChange={e => setTicketNum(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && logTicket()}
            autoFocus
            className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 mb-3"
          />
          <button
            onClick={logTicket}
            disabled={loading}
            className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : mode === 'start' ? 'Log Start Ticket' : 'Log End Ticket'}
          </button>
        </div>
      )}

      {/* manual add book form */}
      {showManual && (
        <div className="bg-white rounded-xl border border-amber-200 p-4 mb-4">
          <p className="text-sm font-medium mb-3">Book not found — add it</p>
          <div className="flex flex-col gap-2 mb-3">
            <input
              type="text"
              placeholder="Book number"
              value={manualBookNum}
              onChange={e => setManualBookNum(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
            />
            <input
              type="text"
              placeholder="Game name"
              value={manualGame}
              onChange={e => setManualGame(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
            />
            <input
              type="number"
              placeholder="Ticket price ($)"
              value={manualPrice}
              onChange={e => setManualPrice(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
            />
          </div>
          <button
            onClick={addBookAndLog}
            disabled={loading}
            className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Book'}
          </button>
        </div>
      )}

      {/* entries this shift */}
      {entries.length > 0 && (
        <>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">This shift</p>
          <div className="flex flex-col gap-2">
            {entries.map(entry => {
              const book = books.find(b => b.id === entry.book_id)
              if (!book) return null
              const sold = entry.end_ticket ? entry.end_ticket - entry.start_ticket : null
              const cash = sold !== null ? sold * book.ticket_price : null
              return (
                <div key={entry.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{book.game_name}</p>
                      <p className="text-xs text-gray-400">
                        #{book.book_number} · {entry.start_ticket} → {entry.end_ticket ?? '?'}
                      </p>
                    </div>
                    <div className="text-right">
                      {sold !== null ? (
                        <>
                          <p className="text-sm font-semibold text-green-600">${cash!.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{sold} sold</p>
                        </>
                      ) : (
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-full">pending</span>
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