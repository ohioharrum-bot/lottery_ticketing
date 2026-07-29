'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { StartTurnForm } from '@/components/history/StartTurnForm'
import { PastTurnsTable, PastTurnRow } from '@/components/history/PastTurnsTable'
import { createClient } from '@/lib/supabase/client'
import {
  fetchActiveTurn,
  fetchPastTurns,
  createTurn,
  closeTurn,
} from '@/lib/supabase/dbHelpers'

const supabase = createClient()

export default function HistoryPage() {
  const [activeTurn, setActiveTurn] = useState<any | null>(null)
  const [pastTurns, setPastTurns] = useState<PastTurnRow[]>([])
  const [personName, setPersonName] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const loadData = useCallback(async () => {
    try {
      const { turn } = await fetchActiveTurn(supabase)
      setActiveTurn(turn)

      const historyData = await fetchPastTurns(supabase)
      const formatted: PastTurnRow[] = (historyData || []).map((t: any, index: number) => ({
        id: t.id,
        personName: t.person_name || 'Store Clerk',
        startedAt: t.started_at,
        endedAt: t.ended_at,
        totalAmount: t.tickets_cashed || 0,
        turnNumber: t.turn_number || (historyData.length - index),
      }))

      setPastTurns(formatted)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleStartTurn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!personName.trim()) {
      showToast('Please enter person name')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user ? user.id : 'anonymous'

    const { data, error } = await createTurn(supabase, userId, personName.trim())
    if (!error && data) {
      showToast(`Turn started for ${personName.trim()}`)
      setPersonName('')
      loadData()
    } else {
      showToast('Error starting turn')
    }
    setLoading(false)
  }

  const handleEndActiveTurn = async () => {
    if (!activeTurn) return
    setLoading(true)
    const { error } = await closeTurn(supabase, activeTurn.id)
    if (!error) {
      showToast('Active turn closed')
      loadData()
    } else {
      showToast('Error closing turn')
    }
    setLoading(false)
  }

  return (
    <div className="app">
      <Sidebar activeItem="History" />
      <main className="main">
        <div className="topbar">
          <div>
            <div className="page-eyebrow">Manage Turns</div>
            <h1>History</h1>
          </div>
          {activeTurn ? (
            <div className="topbar-right">
              <div className="shift-label">
                Active Turn: <b>{activeTurn.person_name || 'Clerk'}</b>
              </div>
              <button
                className="btn"
                onClick={handleEndActiveTurn}
                disabled={loading}
              >
                {loading ? 'Closing' : 'Close Active Turn'}
              </button>
            </div>
          ) : null}
        </div>

        {/* Start New Turn Form */}
        <StartTurnForm
          personName={personName}
          onChangePersonName={setPersonName}
          onStartTurn={handleStartTurn}
          loading={loading}
        />

        {/* Past Turns Table */}
        <PastTurnsTable turns={pastTurns} />
      </main>

      {toast ? (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--blue)',
            color: '#fff',
            fontSize: '12.5px',
            fontWeight: 600,
            padding: '10px 20px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 100,
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}