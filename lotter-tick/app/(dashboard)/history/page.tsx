'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shift, ShiftEntry, Book } from '@/types'

export default function HistoryPage() {
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [history, setHistory] = useState<Shift[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [allEntries, setAllEntries] = useState<{ [shiftId: string]: ShiftEntry[] }>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: bookData } = await supabase.from('books').select('*')
    setBooks(bookData || [])

    const { data: activeData } = await supabase
      .from('shifts').select('*').eq('is_active', true).maybeSingle()
    setActiveShift(activeData)

    const { data: historyData } = await supabase
      .from('shifts')
      .select('*')
      .eq('is_active', false)
      .order('started_at', { ascending: false })
    setHistory(historyData || [])

    const allShifts = [...(historyData || []), ...(activeData ? [activeData] : [])]
    const shiftIds = allShifts.map(s => s.id)
    
    const { data: allEntriesData } = await supabase
      .from('shift_entries')
      .select('*')
      .in('shift_id', shiftIds)

    const entriesMap: { [shiftId: string]: ShiftEntry[] } = {}
    allShifts.forEach(shift => {
      entriesMap[shift.id] = (allEntriesData || []).filter(e => e.shift_id === shift.id)
    })

    setAllEntries(entriesMap)
  }, [supabase])

  useEffect(() => {
    const load = async () => {
      await fetchData()
    }
    load()
  }, [fetchData])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }, [])

  const cashForShift = useCallback((shiftId: string) => {
    return (allEntries[shiftId] || []).reduce((sum, e) => {
      const book = books.find(b => b.id === e.book_id)
      if (!book || !e.end_ticket) return sum
      return sum + (e.end_ticket - e.start_ticket) * book.ticket_price
    }, 0)
  }, [allEntries, books])

  const soldForShift = useCallback((shiftId: string) => {
    return (allEntries[shiftId] || []).reduce((sum, e) => {
      if (!e.end_ticket) return sum
      return sum + (e.end_ticket - e.start_ticket)
    }, 0)
  }, [allEntries])

  const startShift = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('shifts').insert({ user_id: user!.id, is_active: true })
    showToast('Shift started')
    fetchData()
    setLoading(false)
  }, [supabase, showToast, fetchData])

  const endShift = useCallback(async () => {
    if (!activeShift) return
    setLoading(true)
    await supabase.from('shifts').update({
      is_active: false,
      ended_at: new Date().toISOString(),
    }).eq('id', activeShift.id)
    showToast('Shift ended')
    fetchData()
    setLoading(false)
  }, [activeShift, supabase, showToast, fetchData])

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold mb-6">History</h1>

      {activeShift ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-sm font-medium">Current shift</p>
              <p className="text-xs text-gray-400" suppressHydrationWarning>
                Started {new Date(activeShift.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-green-600">
                ${cashForShift(activeShift.id).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">{soldForShift(activeShift.id)} tickets</p>
            </div>
          </div>
          <button
            onClick={endShift}
            disabled={loading}
            className="w-full py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Ending...' : 'End Shift'}
          </button>
        </div>
      ) : (
        <button
          onClick={startShift}
          disabled={loading}
          className="w-full py-3 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 mb-6"
        >
          {loading ? 'Starting...' : 'Start New Shift'}
        </button>
      )}

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Past shifts</p>

      {history.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No completed shifts yet.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map(shift => {
            const cash = cashForShift(shift.id)
            const sold = soldForShift(shift.id)
            const entries = allEntries[shift.id] || []
            return (
              <div key={shift.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-sm font-medium" suppressHydrationWarning>
                      {new Date(shift.started_at).toLocaleDateString()} · {new Date(shift.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-400" suppressHydrationWarning>
                      {sold} tickets · {entries.length} books · Ended {new Date(shift.ended_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-green-600">${cash.toFixed(2)}</p>
                </div>
                {entries.length > 0 && (
                  <div className="border-t border-gray-100 pt-2 mt-1 flex flex-col gap-1">
                    {entries.map(e => {
                      const book = books.find(b => b.id === e.book_id)
                      if (!book) return null
                      const sold = e.end_ticket ? e.end_ticket - e.start_ticket : 0
                      const cash = sold * book.ticket_price
                      return (
                        <div key={e.id} className="flex justify-between text-xs text-gray-500">
                          <span>{book.game_name} (#{book.book_number})</span>
                          <span>{sold} sold · ${cash.toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
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