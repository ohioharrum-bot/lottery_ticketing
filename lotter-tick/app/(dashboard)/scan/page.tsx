'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { AlertBanner } from '@/components/scan/AlertBanner'
import { TurnToggle } from '@/components/scan/TurnToggle'
import { BarcodeForm } from '@/components/scan/BarcodeForm'
import { TurnEntriesList, TurnEntryDisplay } from '@/components/scan/TurnEntriesList'
import { createClient } from '@/lib/supabase/client'
import { Book } from '@/types'
import { fetchActiveTurn, fetchTurnEntries, createTurnEntry } from '@/lib/supabase/dbHelpers'

const supabase = createClient()

export default function ScanPage() {
  const [activeTurn, setActiveTurn] = useState<any | null>(null)
  const [mode, setMode] = useState<'start' | 'end'>('start')
  const [barcode, setBarcode] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [entries, setEntries] = useState<TurnEntryDisplay[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }, [])

  const loadData = useCallback(async () => {
    try {
      const { turn } = await fetchActiveTurn(supabase)
      setActiveTurn(turn)

      const { data: bookData } = await supabase.from('books').select('*')
      const currentBooks: Book[] = bookData || []
      setBooks(currentBooks)

      if (turn) {
        const rawEntries = await fetchTurnEntries(supabase, turn.id)
        const formatted: TurnEntryDisplay[] = rawEntries.map((e: any) => {
          const book = currentBooks.find((b) => b.id === e.book_id)
          const sold = e.end_ticket ? e.end_ticket - e.start_ticket : null
          const price = book?.ticket_price || 0
          return {
            id: e.id,
            bookNumber: book ? book.book_number : e.book_id,
            gameName: book ? book.game_name : 'Lottery Game',
            startTicket: e.start_ticket,
            endTicket: e.end_ticket,
            paymentType: e.payment_type,
            soldCount: sold,
            amount: sold !== null ? sold * price : null,
          }
        })
        setEntries(formatted)
      } else {
        setEntries([])
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleBarcodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!activeTurn) {
      showToast('No active turn. Start a turn first in History.', false)
      return
    }
    if (!barcode.trim()) {
      showToast('Please scan or type a barcode', false)
      return
    }

    const cleanCode = barcode.trim().replace(/\D/g, '')
    if (!cleanCode) {
      showToast('Invalid barcode format', false)
      return
    }

    const bookNum = cleanCode.substring(0, 4)
    const ticketNum = parseInt(cleanCode.substring(cleanCode.length - 3) || '1', 10)

    const book = books.find((b) => b.book_number === bookNum)
    if (!book) {
      showToast(`Book ${bookNum} not found in inventory. Add it in Setup first.`, false)
      setBarcode('')
      return
    }

    setLoading(true)
    if (mode === 'start') {
      const { error } = await createTurnEntry(supabase, activeTurn.id, book.id, ticketNum, 'cash')
      if (!error) {
        showToast(`Start ticket logged for Book ${book.book_number} (${book.game_name})`)
        setBarcode('')
        loadData()
      } else {
        showToast('Error logging turn entry', false)
      }
    } else {
      // End of turn scan update
      const existing = entries.find((item) => item.bookNumber === book.book_number)
      if (existing) {
        const { error } = await supabase
          .from('turn_entries')
          .update({ end_ticket: ticketNum })
          .eq('id', existing.id)

        if (error) {
          await supabase
            .from('shift_entries')
            .update({ end_ticket: ticketNum })
            .eq('id', existing.id)
        }

        showToast(`End ticket logged for Book ${book.book_number}`)
        setBarcode('')
        loadData()
      } else {
        showToast(`Scan start ticket for Book ${book.book_number} first`, false)
      }
    }
    setLoading(false)
  }

  return (
    <div className="app">
      <Sidebar activeItem="Scan" />
      <main className="main">
        <div className="topbar">
          <div>
            <div className="page-eyebrow">Barcode Entry</div>
            <h1>Scan</h1>
          </div>
          <div className="topbar-right">
            <div className="shift-label">
              Status{' '}
              <b style={{ color: activeTurn ? 'var(--blue)' : 'var(--text-faint)' }}>
                {activeTurn ? 'Active Turn' : 'No Turn'}
              </b>
            </div>
          </div>
        </div>

        {/* Amber alert banner: only shows when there is no active turn */}
        <AlertBanner show={!activeTurn} />

        {/* Start / End of turn toggle */}
        <TurnToggle
          mode={mode}
          onToggle={(m) => setMode(m)}
          hasActiveTurn={!!activeTurn}
        />

        <div className="grid-2">
          {/* Barcode scanner form */}
          <BarcodeForm
            mode={mode}
            barcode={barcode}
            onChangeBarcode={setBarcode}
            onSubmit={handleBarcodeSubmit}
            disabled={!activeTurn}
            loading={loading}
          />

          {/* Open turn entries list */}
          <TurnEntriesList entries={entries} />
        </div>
      </main>

      {toast ? (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.ok ? 'var(--blue)' : 'var(--red)',
            color: '#fff',
            fontSize: '12.5px',
            fontWeight: 600,
            padding: '10px 20px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 100,
          }}
        >
          {toast.msg}
        </div>
      ) : null}
    </div>
  )
}