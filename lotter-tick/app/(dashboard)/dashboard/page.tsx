import { createClient } from '@/lib/supabase/server'
import { Book, ShiftEntry } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: books } = await supabase
    .from('books').select('*').order('created_at', { ascending: false })

  const { data: activeShift } = await supabase
    .from('shifts').select('*').eq('is_active', true).maybeSingle()

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

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
          activeShift ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {activeShift ? 'Shift Active' : 'No Shift'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Cash this shift</p>
          <p className="text-2xl font-semibold text-green-600">${totalCash.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Tickets sold</p>
          <p className="text-2xl font-semibold text-blue-600">{totalSold}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total books</p>
          <p className="text-2xl font-semibold">{(books || []).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Pending end scan</p>
          <p className={`text-2xl font-semibold ${pendingBooks > 0 ? 'text-amber-500' : 'text-gray-900'}`}>
            {pendingBooks}
          </p>
        </div>
      </div>

      {entries.length > 0 && (
        <>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Books this shift</p>
          <div className="flex flex-col gap-2">
            {entries.map(entry => {
              const book = (books || []).find(b => b.id === entry.book_id)
              if (!book) return null
              const sold = getSold(entry)
              const cash = getCash(entry, book)
              return (
                <div key={entry.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{book.game_name}</p>
                      <p className="text-xs text-gray-400">
                        Book #{book.book_number} · ${book.ticket_price}/ticket
                      </p>
                      <p className="text-xs text-gray-400">
                        Tickets: {entry.start_ticket} → {entry.end_ticket ?? '?'}
                      </p>
                    </div>
                    <div className="text-right">
                      {entry.end_ticket ? (
                        <>
                          <p className="text-sm font-semibold text-green-600">${cash.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{sold} sold</p>
                        </>
                      ) : (
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
                          needs end scan
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

      {(!books || books.length === 0) && (
        <div className="text-center py-16 text-gray-400 text-sm">
          No books yet. Go to Setup to add books.
        </div>
      )}
    </div>
  )
}