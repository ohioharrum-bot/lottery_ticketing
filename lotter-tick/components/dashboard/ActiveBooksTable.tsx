import Link from 'next/link'

export type ActiveBookRow = {
  id: string
  bookCode: string
  gameName: string
  status: 'Active' | 'Low Stock' | 'Closed'
  sold: number
  remainingText: string
}

interface ActiveBooksTableProps {
  books?: ActiveBookRow[]
}

export function ActiveBooksTable({ books = [] }: ActiveBooksTableProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Active Books</span>
        <Link href="/setup" className="panel-link">
          Manage
        </Link>
      </div>
      {!books || books.length === 0 ? (
        <div className="empty-state">No active books yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Book</th>
              <th>Game</th>
              <th>Status</th>
              <th>Sold</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => {
              const statusClass =
                b.status === 'Active'
                  ? 'status-active'
                  : b.status === 'Low Stock'
                  ? 'status-low'
                  : 'status-closed'

              return (
                <tr key={b.id}>
                  <td className="cell-mono">{b.bookCode}</td>
                  <td>{b.gameName}</td>
                  <td>
                    <span className={`status ${statusClass}`}>{b.status}</span>
                  </td>
                  <td className="cell-mono">{b.sold}</td>
                  <td className="cell-mono cell-dim">{b.remainingText}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
