'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Book } from '@/types'

export default function QRGenerator({ books }: { books: Book[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {books.map(book => (
        <div key={book.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2">
          <QRCodeSVG value={book.book_number} size={120} />
          <p className="text-sm font-semibold text-center">{book.game_name}</p>
          <p className="text-xs text-gray-400">#{book.book_number} · ${book.ticket_price}</p>
        </div>
      ))}
    </div>
  )
}
