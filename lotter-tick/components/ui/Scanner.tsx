'use client'

import { useState } from 'react'

interface ScannerProps {
  onScan: (value: string) => void
  onClose: () => void
}

export default function Scanner({ onScan, onClose }: ScannerProps) {
  const [manualCode, setManualCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      onScan(manualCode.trim())
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 h-full">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-slate-900">Manual Entry</h2>
          <p className="text-sm text-slate-500 mt-2">Enter the code from the book</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
              Book / Ticket Code
            </label>
            <input
              type="text"
              autoFocus
              placeholder="Enter code here..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-600 font-semibold text-sm hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
