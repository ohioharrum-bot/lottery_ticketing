'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Book, Shift, ShiftEntry } from '@/types'

const supabase = createClient()

export default function ScanPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [entries, setEntries] = useState<ShiftEntry[]>([])
  const [mode, setMode] = useState<'start' | 'end'>('start')
  const [input, setInput] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [pendingEntry, setPendingEntry] = useState<{ book: Book, ticketNum: number } | null>(null)
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'online'>('cash')
  const [newBookNum, setNewBookNum] = useState('')
  const [newGameName, setNewGameName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string, ok: boolean } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function fetchData() {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return
    const { data: bookData } = await supabase.from('books').select('*')
    setBooks(bookData || [])
    const { data: shiftData } = await supabase.from('shifts').select('*').eq('is_active', true).order('started_at', { ascending: false })
    const active = shiftData && shiftData.length > 0 ? shiftData[0] : null
    setActiveShift(active)
    if (active) {
      const { data: entryData } = await supabase.from('shift_entries').select('*').eq('shift_id', active.id)
      setEntries(entryData || [])
    } else {
      setEntries([])
    }
  }

  useEffect(() => { fetchData() }, [])
  useEffect(() => { if (!showAddForm && !showPayment) inputRef.current?.focus() }, [entries, showAddForm, showPayment])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  async function handleSubmit(rawInput?: string) {
    const val = rawInput || input
    if (!activeShift) { showToast('Start a turn first', false); return }
    if (!val.trim()) { showToast('Scan or enter barcode', false); return }
    const barcode = val.trim().replace(/-/g, '').substring(0, 14)
    const bookNum = barcode.substring(0, 4)
    const ticketNum = parseInt(barcode.substring(11, 14))
    if (!bookNum || isNaN(ticketNum)) { showToast('Invalid barcode', false); setInput(''); return }
    const book = books.find(b => b.book_number === bookNum)
    if (!book) { setNewBookNum(bookNum); setShowAddForm(true); setInput(''); return }
    const existingEntry = entries.find(e => e.book_id === book.id)
    if (mode === 'start') {
      if (existingEntry) { showToast(`${book.game_name} already scanned`, false); setInput(''); return }
      setLoading(true)
      const { error } = await supabase.from('shift_entries').insert({ shift_id: activeShift.id, book_id: book.id, start_ticket: ticketNum, payment_type: 'cash' })
      if (!error) { showToast(`Start saved — ${book.game_name}`); setInput(''); fetchData() }
      else showToast('Error saving', false)
      setLoading(false)
    } else {
      if (!existingEntry) { showToast(`Scan start ticket for ${book.game_name} first`, false); setInput(''); return }
      if (existingEntry.end_ticket) { showToast(`${book.game_name} already done`, false); setInput(''); return }
      if (ticketNum <= existingEntry.start_ticket) { showToast('End ticket must be higher', false); setInput(''); return }
      setPendingEntry({ book, ticketNum }); setShowPayment(true); setInput('')
    }
  }

  async function confirmWithPayment() {
    if (!pendingEntry || !activeShift) return
    const { book, ticketNum } = pendingEntry
    const existingEntry = entries.find(e => e.book_id === book.id)
    if (!existingEntry) return
    setLoading(true)
    const { error } = await supabase.from('shift_entries').update({ end_ticket: ticketNum, payment_type: paymentType }).eq('id', existingEntry.id)
    if (!error) {
      const sold = ticketNum - existingEntry.start_ticket
      showToast(`${sold} tickets · $${(sold * book.ticket_price).toFixed(2)} · ${paymentType}`)
      setShowPayment(false); setPendingEntry(null); setPaymentType('cash'); fetchData()
    } else showToast('Error saving', false)
    setLoading(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/-/g, '').substring(0, 14)
    setInput(val)
    if (val.length === 14) setTimeout(() => handleSubmit(val), 100)
  }

  async function addBook() {
    if (!newBookNum || !newGameName || !newPrice) { showToast('Fill all fields', false); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('books').insert({ user_id: user!.id, book_number: newBookNum, game_name: newGameName, ticket_price: parseFloat(newPrice), total_tickets: 300 })
    if (!error) { showToast(`Book ${newBookNum} added`); setShowAddForm(false); setNewBookNum(''); setNewGameName(''); setNewPrice(''); fetchData() }
    else showToast('Error adding book', false)
    setLoading(false)
  }

  const cashTotal = entries.reduce((sum, e) => { const b = books.find(x => x.id === e.book_id); return (!b || !e.end_ticket || e.payment_type !== 'cash') ? sum : sum + (e.end_ticket - e.start_ticket) * b.ticket_price }, 0)
  const cardTotal = entries.reduce((sum, e) => { const b = books.find(x => x.id === e.book_id); return (!b || !e.end_ticket || e.payment_type !== 'card') ? sum : sum + (e.end_ticket - e.start_ticket) * b.ticket_price }, 0)
  const onlineTotal = entries.reduce((sum, e) => { const b = books.find(x => x.id === e.book_id); return (!b || !e.end_ticket || e.payment_type !== 'online') ? sum : sum + (e.end_ticket - e.start_ticket) * b.ticket_price }, 0)
  const totalCash = cashTotal + cardTotal + onlineTotal

  return (
    <div className="p-6 max-w-4xl">
      <style>{`
        @keyframes slide-up { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes toast-in { from { opacity:0; transform:translateX(-50%) translateY(8px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
        .ani-up { animation: slide-up 0.3s ease both }
        .ani-toast { animation: toast-in 0.2s ease both }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 ani-up">
        <div>
          <p className="text-[10px] text-[#444] uppercase tracking-[0.15em] mb-0.5">Barcode Entry</p>
          <h1 className="text-xl font-bold text-white tracking-tight">Scan</h1>
        </div>
        {activeShift && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#c6f135] bg-[#c6f135]/10 border border-[#c6f135]/25 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c6f135]" />
            {activeShift.person_name} · Turn {activeShift.turn_number}
          </span>
        )}
      </div>

      {!activeShift && (
        <div className="ani-up bg-orange-500/8 border border-orange-500/20 text-orange-400 text-xs px-4 py-3 rounded-xl mb-5">
          No active turn — go to History and start a turn first.
        </div>
      )}

      <div className="grid grid-cols-[1fr_280px] gap-4">
        {/* LEFT: Scanner */}
        <div className="flex flex-col gap-4">

          {/* Cash summary strip */}
          {activeShift && (
            <div className="ani-up grid grid-cols-3 gap-2" style={{ animationDelay: '60ms' }}>
              {[
                { label: 'Cash', value: cashTotal },
                { label: 'Card', value: cardTotal },
                { label: 'Online', value: onlineTotal },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#141414] border border-white/[0.05] rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-[#444] uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-sm font-bold text-white">${value.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Mode toggle */}
          <div className="ani-up bg-[#141414] border border-white/[0.05] rounded-xl p-1 flex gap-1" style={{ animationDelay: '90ms' }}>
            {(['start', 'end'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  mode === m ? 'bg-[#c6f135] text-black' : 'text-[#444] hover:text-[#888]'
                }`}
              >
                {m === 'start' ? 'Start of Turn' : 'End of Turn'}
              </button>
            ))}
          </div>

          {/* Scan input */}
          {!showAddForm && !showPayment && (
            <div className="ani-up bg-[#141414] border border-white/[0.05] rounded-xl p-4" style={{ animationDelay: '120ms' }}>
              <p className="text-[10px] text-[#444] uppercase tracking-[0.12em] mb-3">
                {mode === 'start' ? 'Scan start ticket' : 'Scan end ticket'}
              </p>
              <input
                ref={inputRef}
                type="text"
                placeholder="Scan or type barcode..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full px-3 py-2.5 bg-black/30 border border-white/[0.08] rounded-lg text-xs text-white placeholder-[#333] outline-none focus:border-[#c6f135]/30 transition-colors mb-3"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => inputRef.current?.focus()}
                  disabled={!activeShift}
                  className="flex-1 py-2.5 bg-[#c6f135] hover:bg-[#d4ff3a] disabled:opacity-30 text-black text-xs font-bold rounded-lg transition-colors"
                >
                  Tap to Scan
                </button>
                <button
                  onClick={() => handleSubmit()}
                  disabled={loading || !activeShift}
                  className="flex-1 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] disabled:opacity-30 text-white text-xs font-medium rounded-lg border border-white/[0.08] transition-colors"
                >
                  {loading ? 'Saving...' : mode === 'start' ? 'Log Start' : 'Log End'}
                </button>
              </div>
            </div>
          )}

          {/* Payment modal */}
          {showPayment && pendingEntry && (
            <div className="ani-up bg-[#141414] border border-white/[0.05] rounded-xl p-4" style={{ animationDelay: '0ms' }}>
              <p className="text-[10px] text-[#444] uppercase tracking-wider mb-1">Payment Method</p>
              <p className="text-sm font-bold text-white mb-0.5">{pendingEntry.book.game_name}</p>
              <p className="text-[11px] text-[#444] mb-4">Ticket #{pendingEntry.ticketNum}</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(['cash', 'card', 'online'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setPaymentType(type)}
                    className={`py-2.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                      paymentType === type
                        ? 'bg-[#c6f135] text-black border-[#c6f135]'
                        : 'bg-black/20 text-[#555] border-white/[0.07] hover:border-white/20'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowPayment(false); setPendingEntry(null) }} className="flex-1 py-2 border border-white/[0.07] rounded-lg text-xs text-[#555] hover:text-white transition-colors">Cancel</button>
                <button onClick={confirmWithPayment} disabled={loading} className="flex-1 py-2 bg-[#c6f135] hover:bg-[#d4ff3a] disabled:opacity-40 text-black text-xs font-bold rounded-lg transition-colors">
                  {loading ? '...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}

          {/* Add book form */}
          {showAddForm && (
            <div className="ani-up bg-[#141414] border border-orange-500/20 rounded-xl p-4">
              <p className="text-[10px] text-orange-400 uppercase tracking-wider mb-1">Unknown Book</p>
              <p className="text-sm font-bold text-white mb-0.5">Book #{newBookNum}</p>
              <p className="text-[11px] text-[#444] mb-4">Register this book to continue</p>
              <div className="flex flex-col gap-2 mb-3">
                <input type="text" placeholder="Game name" value={newGameName} onChange={e => setNewGameName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/30 border border-white/[0.08] rounded-lg text-xs text-white placeholder-[#333] outline-none focus:border-[#c6f135]/30 transition-colors" />
                <input type="number" placeholder="Ticket price ($)" value={newPrice} onChange={e => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/30 border border-white/[0.08] rounded-lg text-xs text-white placeholder-[#333] outline-none focus:border-[#c6f135]/30 transition-colors" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowAddForm(false); setInput('') }} className="flex-1 py-2 border border-white/[0.07] rounded-lg text-xs text-[#555] hover:text-white transition-colors">Cancel</button>
                <button onClick={addBook} disabled={loading} className="flex-1 py-2 bg-[#c6f135] hover:bg-[#d4ff3a] disabled:opacity-40 text-black text-xs font-bold rounded-lg transition-colors">
                  {loading ? '...' : 'Add Book'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: This turn entries */}
        <div className="ani-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-[#444] uppercase tracking-[0.15em]">This Turn</p>
            {activeShift && (
              <p className="text-[11px] font-bold text-[#c6f135]">${totalCash.toFixed(2)}</p>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="bg-[#141414] border border-white/[0.05] rounded-xl p-6 text-center text-[#333] text-xs">
              No entries yet.<br />Scan a barcode to begin.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry, i) => {
                const book = books.find(b => b.id === entry.book_id)
                if (!book) return null
                const sold = entry.end_ticket ? entry.end_ticket - entry.start_ticket : null
                const cash = sold !== null ? sold * book.ticket_price : null
                return (
                  <div key={entry.id} className="ani-up bg-[#141414] border border-white/[0.05] rounded-xl px-3 py-2.5" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white">{book.game_name}</p>
                        <p className="text-[11px] text-[#444] mt-0.5">
                          #{book.book_number} · {entry.start_ticket} → {entry.end_ticket ?? '?'}
                          {entry.end_ticket ? ` · ${entry.payment_type}` : ''}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        {sold !== null ? (
                          <>
                            <p className="text-xs font-bold text-[#c6f135]">${cash!.toFixed(2)}</p>
                            <p className="text-[10px] text-[#444]">{sold} sold</p>
                          </>
                        ) : (
                          <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`ani-toast fixed bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-2 rounded-full shadow-lg whitespace-nowrap z-50 ${
          toast.ok ? 'bg-[#c6f135] text-black' : 'bg-red-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}