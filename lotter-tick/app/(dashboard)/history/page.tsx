'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shift, ShiftEntry, Book } from '@/types'

const supabase = createClient()

export default function HistoryPage() {
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [history, setHistory] = useState<Shift[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [allEntries, setAllEntries] = useState<{ [shiftId: string]: ShiftEntry[] }>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [ticketsCashed, setTicketsCashed] = useState('')
  const [personName, setPersonName] = useState('')
  const [expandedShift, setExpandedShift] = useState<string | null>(null)

  async function fetchData() {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return
    const { data: bookData } = await supabase.from('books').select('*')
    setBooks(bookData || [])
    const { data: shiftData } = await supabase.from('shifts').select('*').eq('is_active', true).order('started_at', { ascending: false })
    const activeData = shiftData && shiftData.length > 0 ? shiftData[0] : null
    setActiveShift(activeData)
    const { data: historyData } = await supabase.from('shifts').select('*').eq('is_active', false).order('started_at', { ascending: false })
    setHistory(historyData || [])
    const allShifts = [...(historyData || []), ...(activeData ? [activeData] : [])]
    const entriesMap: { [shiftId: string]: ShiftEntry[] } = {}
    await Promise.all(allShifts.map(async shift => {
      const { data } = await supabase.from('shift_entries').select('*').eq('shift_id', shift.id)
      entriesMap[shift.id] = data || []
    }))
    setAllEntries(entriesMap)
  }

  useEffect(() => { fetchData() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  function getShiftTotals(shiftId: string) {
    const entries = allEntries[shiftId] || []
    const ticketSales = entries.reduce((sum, e) => {
      const book = books.find(b => b.id === e.book_id)
      if (!book || !e.end_ticket || e.payment_type === 'online') return sum
      return sum + (e.end_ticket - e.start_ticket) * book.ticket_price
    }, 0)
    const onlineSales = entries.reduce((sum, e) => {
      const book = books.find(b => b.id === e.book_id)
      if (!book || !e.end_ticket || e.payment_type !== 'online') return sum
      return sum + (e.end_ticket - e.start_ticket) * book.ticket_price
    }, 0)
    const creditCard = entries.reduce((sum, e) => {
      const book = books.find(b => b.id === e.book_id)
      if (!book || !e.end_ticket || e.payment_type !== 'card') return sum
      return sum + (e.end_ticket - e.start_ticket) * book.ticket_price
    }, 0)
    const shift = [...history, ...(activeShift ? [activeShift] : [])].find(s => s.id === shiftId)
    const cashed = shift?.tickets_cashed || 0
    const total = ticketSales + onlineSales
    const total2 = total - creditCard
    const total3 = total2 - cashed
    return { ticketSales, onlineSales, creditCard, cashed, total, total2, total3 }
  }

  const todayShifts = history.filter(s => new Date(s.started_at).toDateString() === new Date().toDateString())
  const activeIsToday = activeShift && new Date(activeShift.started_at).toDateString() === new Date().toDateString()

  const fullDayTicket = todayShifts.reduce((sum, s) => sum + getShiftTotals(s.id).ticketSales, 0) + (activeIsToday ? getShiftTotals(activeShift!.id).ticketSales : 0)
  const fullDayOnline = todayShifts.reduce((sum, s) => sum + getShiftTotals(s.id).onlineSales, 0) + (activeIsToday ? getShiftTotals(activeShift!.id).onlineSales : 0)
  const fullDayCard = todayShifts.reduce((sum, s) => sum + getShiftTotals(s.id).creditCard, 0) + (activeIsToday ? getShiftTotals(activeShift!.id).creditCard : 0)
  const fullDayCashed = todayShifts.reduce((sum, s) => sum + getShiftTotals(s.id).cashed, 0) + (activeIsToday ? getShiftTotals(activeShift!.id).cashed : 0)
  const fullDayTotal = todayShifts.reduce((sum, s) => sum + getShiftTotals(s.id).total3, 0) + (activeIsToday ? getShiftTotals(activeShift!.id).total3 : 0)

  async function startTurn() {
    if (!personName.trim()) { showToast('Enter person name'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const todayTurns = [...todayShifts, ...(activeShift ? [activeShift] : [])]
    const { error } = await supabase.from('shifts').insert({
      user_id: user!.id, is_active: true, tickets_cashed: 0,
      turn_number: todayTurns.length + 1, person_name: personName.trim(),
    }).select()
    if (error) showToast('Error starting turn')
    else { showToast('Turn started'); setPersonName(''); fetchData() }
    setLoading(false)
  }

  async function endTurn() {
    if (!activeShift) return
    setLoading(true)
    await supabase.from('shifts').update({
      is_active: false, ended_at: new Date().toISOString(),
      tickets_cashed: parseFloat(ticketsCashed || '0'),
    }).eq('id', activeShift.id)
    showToast('Turn ended')
    setTicketsCashed('')
    fetchData()
    setLoading(false)
  }

  const Row = ({ label, value, bold, accent, neg }: { label: string, value: string, bold?: boolean, accent?: boolean, neg?: boolean }) => (
    <div className={`flex justify-between items-center py-1.5 ${bold ? 'border-t border-white/[0.05] mt-1 pt-2' : ''}`}>
      <span className={`text-xs ${bold ? 'text-white font-medium' : 'text-[#555]'}`}>{label}</span>
      <span className={`text-xs font-semibold ${accent ? 'text-[#c6f135]' : neg ? 'text-red-400' : 'text-white'}`}>{value}</span>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl">
      <style>{`
        @keyframes slide-up { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .ani-up { animation: slide-up 0.3s ease both }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 ani-up">
        <div>
          <p className="text-[10px] text-[#444] uppercase tracking-[0.15em] mb-0.5">Manage Turns</p>
          <h1 className="text-xl font-bold text-white tracking-tight">History</h1>
        </div>
        {activeShift && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#c6f135] bg-[#c6f135]/10 border border-[#c6f135]/25 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c6f135]" />
            Turn {activeShift.turn_number} Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* LEFT: Start/End turn + Past turns */}
        <div className="flex flex-col gap-4">

          {/* Active turn card */}
          {activeShift ? (
            <div className="ani-up bg-[#141414] border border-[#c6f135]/20 rounded-xl p-4" style={{ animationDelay: '60ms' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-white">Turn {activeShift.turn_number} — {activeShift.person_name}</p>
                  <p className="text-[11px] text-[#444] mt-0.5">
                    Started {new Date(activeShift.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-[10px] bg-[#c6f135]/10 text-[#c6f135] border border-[#c6f135]/25 px-2 py-0.5 rounded-full font-medium">Active</span>
              </div>
              {(() => {
                const t = getShiftTotals(activeShift.id)
                return (
                  <div className="bg-black/20 rounded-lg px-3 py-2 mb-3">
                    <Row label="Ticket Sales" value={`$${t.ticketSales.toFixed(2)}`} />
                    <Row label="Online Sales" value={`$${t.onlineSales.toFixed(2)}`} />
                    <Row label="Total" value={`$${t.total.toFixed(2)}`} bold />
                    <Row label="− Credit Card" value={`-$${t.creditCard.toFixed(2)}`} neg />
                    <Row label="Total 2" value={`$${t.total2.toFixed(2)}`} bold />
                    <Row label="− Tickets Cashed" value={`-$${t.cashed.toFixed(2)}`} neg />
                    <Row label="Cash in Hand" value={`$${t.total3.toFixed(2)}`} bold accent />
                  </div>
                )
              })()}
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Tickets cashed ($)"
                  value={ticketsCashed}
                  onChange={e => setTicketsCashed(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/30 border border-white/[0.08] rounded-lg text-xs text-white placeholder-[#333] outline-none focus:border-[#c6f135]/30 transition-colors"
                />
                <button
                  onClick={endTurn} disabled={loading}
                  className="px-4 py-2 bg-red-500/80 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  {loading ? 'Ending...' : 'End Turn'}
                </button>
              </div>
            </div>
          ) : (
            <div className="ani-up bg-[#141414] border border-white/[0.05] rounded-xl p-4" style={{ animationDelay: '60ms' }}>
              <p className="text-[10px] text-[#444] uppercase tracking-[0.12em] mb-3">Start New Turn</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Person name"
                  value={personName}
                  onChange={e => setPersonName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && startTurn()}
                  className="flex-1 px-3 py-2 bg-black/30 border border-white/[0.08] rounded-lg text-xs text-white placeholder-[#333] outline-none focus:border-[#c6f135]/30 transition-colors"
                />
                <button
                  onClick={startTurn} disabled={loading}
                  className="px-4 py-2 bg-[#c6f135] hover:bg-[#d4ff3a] disabled:opacity-40 text-black text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                >
                  {loading ? '...' : 'Start Turn'}
                </button>
              </div>
            </div>
          )}

          {/* Past turns */}
          <div className="ani-up" style={{ animationDelay: '120ms' }}>
            <p className="text-[10px] text-[#444] uppercase tracking-[0.15em] mb-3">Past Turns</p>
            {history.length === 0 ? (
              <div className="bg-[#141414] border border-white/[0.05] rounded-xl p-8 text-center text-[#333] text-sm">
                No completed turns yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((shift, i) => {
                  const t = getShiftTotals(shift.id)
                  const isExpanded = expandedShift === shift.id
                  return (
                    <div key={shift.id} className="bg-[#141414] border border-white/[0.05] rounded-xl overflow-hidden ani-up" style={{ animationDelay: `${140 + i * 40}ms` }}>
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                        onClick={() => setExpandedShift(isExpanded ? null : shift.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-6 bg-[#222] rounded-full" />
                          <div>
                            <p className="text-xs font-semibold text-white">Turn {shift.turn_number} — {shift.person_name}</p>
                            <p className="text-[11px] text-[#444]">
                              {new Date(shift.started_at).toLocaleDateString()} · {new Date(shift.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(shift.ended_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-[#c6f135]">${t.total3.toFixed(2)}</p>
                            <p className="text-[10px] text-[#444]">cash in hand</p>
                          </div>
                          <svg className={`w-3.5 h-3.5 text-[#333] transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-3 border-t border-white/[0.04]">
                          <div className="bg-black/20 rounded-lg px-3 py-2 mt-3">
                            <Row label="Ticket Sales" value={`$${t.ticketSales.toFixed(2)}`} />
                            <Row label="Online Sales" value={`$${t.onlineSales.toFixed(2)}`} />
                            <Row label="Total" value={`$${t.total.toFixed(2)}`} bold />
                            <Row label="− Credit Card" value={`-$${t.creditCard.toFixed(2)}`} neg />
                            <Row label="Total 2" value={`$${t.total2.toFixed(2)}`} bold />
                            <Row label="− Tickets Cashed" value={`-$${t.cashed.toFixed(2)}`} neg />
                            <Row label="Cash in Hand" value={`$${t.total3.toFixed(2)}`} bold accent />
                            {(allEntries[shift.id] || []).length > 0 && (
                              <div className="border-t border-white/[0.05] mt-2 pt-2">
                                <p className="text-[10px] text-[#444] uppercase tracking-wider mb-1.5">Books</p>
                                {(allEntries[shift.id] || []).map(e => {
                                  const book = books.find(b => b.id === e.book_id)
                                  if (!book) return null
                                  const sold = e.end_ticket ? e.end_ticket - e.start_ticket : 0
                                  return (
                                    <div key={e.id} className="flex justify-between text-[11px] py-0.5">
                                      <span className="text-[#444]">{book.game_name} · {e.payment_type}</span>
                                      <span className="text-[#555]">{sold} sold · ${(sold * book.ticket_price).toFixed(2)}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Day total sidebar */}
        {(todayShifts.length > 0 || activeIsToday) && (
          <div className="ani-up" style={{ animationDelay: '180ms' }}>
            <p className="text-[10px] text-[#444] uppercase tracking-[0.15em] mb-3">Today's Total</p>
            <div className="bg-[#141414] border border-white/[0.05] rounded-xl p-4 sticky top-6">
              <p className="text-[11px] text-[#444] mb-3">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              <p className="text-2xl font-bold text-[#c6f135] mb-4">${fullDayTotal.toFixed(2)}</p>
              <div className="bg-black/20 rounded-lg px-3 py-2">
                <Row label="Ticket Sales" value={`$${fullDayTicket.toFixed(2)}`} />
                <Row label="Online Sales" value={`$${fullDayOnline.toFixed(2)}`} />
                <Row label="Total" value={`$${(fullDayTicket + fullDayOnline).toFixed(2)}`} bold />
                <Row label="− Credit Card" value={`-$${fullDayCard.toFixed(2)}`} neg />
                <Row label="Total 2" value={`$${(fullDayTicket + fullDayOnline - fullDayCard).toFixed(2)}`} bold />
                <Row label="− Tickets Cashed" value={`-$${fullDayCashed.toFixed(2)}`} neg />
                <Row label="Cash in Hand" value={`$${fullDayTotal.toFixed(2)}`} bold accent />
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#c6f135] text-black text-xs font-bold px-4 py-2 rounded-full shadow-lg whitespace-nowrap z-50">
          {toast}
        </div>
      )}
    </div>
  )
}