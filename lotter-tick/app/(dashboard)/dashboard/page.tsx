import { createClient } from '@/lib/supabase/server'
import { Book, ShiftEntry } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: books } = await supabase
    .from('books').select('*').order('created_at', { ascending: false })

  const { data: shifts } = await supabase
    .from('shifts')
    .select('*')
    .eq('is_active', true)
    .order('started_at', { ascending: false })

  const activeShift = shifts && shifts.length > 0 ? shifts[0] : null

  let entries: ShiftEntry[] = []
  if (activeShift) {
    const { data } = await supabase
      .from('shift_entries').select('*').eq('shift_id', activeShift.id)
    entries = data || []
  }

  function getSold(entry: ShiftEntry) {
    if (!entry.end_ticket) return 0
    return entry.end_ticket - entry.start_ticket
  }

  function getCash(entry: ShiftEntry, book: Book) {
    return getSold(entry) * book.ticket_price
  }

  const totalCash = entries.reduce((sum, e) => {
    const book = (books || []).find(b => b.id === e.book_id)
    return sum + (book ? getCash(e, book) : 0)
  }, 0)

  const totalSold = entries.reduce((sum, e) => sum + getSold(e), 0)
  const pendingBooks = entries.filter(e => !e.end_ticket).length

  const stats = [
    { label: 'Cash This Shift', value: `$${totalCash.toFixed(2)}`, accent: true },
    { label: 'Tickets Sold', value: `${totalSold}`, accent: false },
    { label: 'Total Books', value: `${(books || []).length}`, accent: false },
    { label: 'Pending Scan', value: `${pendingBooks}`, accent: false, warn: pendingBooks > 0 },
  ]

  return (
    <div className="p-6 max-w-5xl">
      <style>{`
        @keyframes fade-in { from { opacity:0 } to { opacity:1 } }
        @keyframes slide-up { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        .ani-fade { animation: fade-in 0.35s ease both }
        .ani-up { animation: slide-up 0.35s ease both }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 ani-fade">
        <div>
          <p className="text-[10px] text-[#444] uppercase tracking-[0.15em] mb-0.5">Overview</p>
          <h1 className="text-xl font-bold text-white tracking-tight">Dashboard</h1>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold ${
          activeShift
            ? 'bg-[#c6f135]/10 text-[#c6f135] border-[#c6f135]/25'
            : 'bg-white/[0.03] text-[#444] border-white/[0.06]'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${activeShift ? 'bg-[#c6f135]' : 'bg-[#333]'}`} />
          {activeShift ? 'Shift Active' : 'No Active Shift'}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="ani-up bg-[#141414] border border-white/[0.05] rounded-xl p-3.5"
            style={{ animationDelay: `${i * 55}ms` }}
          >
            <p className="text-[10px] text-[#444] uppercase tracking-[0.12em] mb-2">{stat.label}</p>
            <p className={`text-xl font-bold ${
              stat.accent ? 'text-[#c6f135]' : stat.warn ? 'text-orange-400' : 'text-white'
            }`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Active shift banner */}
      {activeShift && (
        <div className="ani-up bg-[#141414] border border-[#c6f135]/15 rounded-xl px-4 py-3 mb-5 flex items-center justify-between" style={{ animationDelay: '230ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-[#c6f135] rounded-full" />
            <div>
              <p className="text-xs font-semibold text-white">Turn {activeShift.turn_number} — {activeShift.person_name}</p>
              <p className="text-[11px] text-[#444]">
                Since {new Date(activeShift.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <p className="text-sm font-bold text-[#c6f135]">${totalCash.toFixed(2)}</p>
        </div>
      )}

      {/* Books table */}
      {entries.length > 0 && (
        <div className="ani-up" style={{ animationDelay: '290ms' }}>
          <p className="text-[10px] text-[#444] uppercase tracking-[0.15em] mb-3">Books This Shift</p>
          <div className="bg-[#141414] border border-white/[0.05] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Game', 'Book #', 'Price', 'Tickets', 'Revenue', 'Status'].map(h => (
                    <th key={h} className="text-left text-[10px] text-[#444] uppercase tracking-[0.1em] px-4 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const book = (books || []).find(b => b.id === entry.book_id)
                  if (!book) return null
                  const sold = getSold(entry)
                  const cash = getCash(entry, book)
                  return (
                    <tr key={entry.id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2.5 text-sm font-medium text-white">{book.game_name}</td>
                      <td className="px-4 py-2.5 text-xs text-[#555]">#{book.book_number}</td>
                      <td className="px-4 py-2.5 text-xs text-[#555]">${book.ticket_price}</td>
                      <td className="px-4 py-2.5 text-xs text-[#555]">{entry.start_ticket} → {entry.end_ticket ?? '?'}</td>
                      <td className="px-4 py-2.5 text-sm font-semibold text-[#c6f135]">
                        {entry.end_ticket ? `$${cash.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        {entry.end_ticket
                          ? <span className="text-[10px] bg-[#c6f135]/10 text-[#c6f135] border border-[#c6f135]/20 px-2 py-0.5 rounded-full">Done</span>
                          : <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">Pending</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!books || books.length === 0) && (
        <div className="text-center py-20 text-[#333] text-sm">
          No books yet — go to Setup to add books.
        </div>
      )}
    </div>
  )
}