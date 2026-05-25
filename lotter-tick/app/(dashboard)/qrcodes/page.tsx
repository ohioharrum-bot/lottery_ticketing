'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import QRGenerator from '@/components/QRGenerator'
import { Book } from '@/types'

export default function QRCodesPage() {
  const [books, setBooks] = useState<Book[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchBooks = async () => {
      const { data } = await supabase.from('books').select('*').order('book_number')
      setBooks(data || [])
    }
    fetchBooks()
  }, [supabase])

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex justify-between items-center mb-2 print:hidden">
        <h1 className="text-xl font-semibold">QR Codes</h1>
        <button 
          onClick={() => window.print()}
          className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
        >
          Print
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-6 print:hidden">Print and stick on each book</p>
      
      <style>{`
        @media print {
          .print\:hidden { display: none !important; }
          nav { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; max-width: none !important; }
        }
      `}</style>

      <QRGenerator books={books} />
    </div>
  )
}
