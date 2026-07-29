import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { StatCard } from '@/components/dashboard/StatCard'
import { SalesChart, DataPoint } from '@/components/dashboard/SalesChart'
import { TopGamesPanel, GameItem } from '@/components/dashboard/TopGamesPanel'
import { ActiveBooksTable, ActiveBookRow } from '@/components/dashboard/ActiveBooksTable'
import { ActivityFeed, FeedItem } from '@/components/dashboard/ActivityFeed'
import { createClient } from '@/lib/supabase/server'
import { fetchActiveTurn, fetchTurnEntries } from '@/lib/supabase/dbHelpers'

export default async function DashboardPage() {
  let activeTurn: any = null
  let booksCount = 0
  let cashThisShift = 0
  let ticketsSold = 0
  let pendingScan = 0
  let lowStockCount = 0

  let activeBooksRows: ActiveBookRow[] = []
  let topGames: GameItem[] = []
  let activityFeed: FeedItem[] = []
  let chartData: DataPoint[] = []

  try {
    const supabase = await createClient()
    const { turn } = await fetchActiveTurn(supabase)
    activeTurn = turn

    // Fetch all books
    const { data: booksData } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })

    const books = booksData || []
    booksCount = books.length

    // Fetch entries for active turn if exists
    let activeEntries: any[] = []
    if (activeTurn) {
      activeEntries = await fetchTurnEntries(supabase, activeTurn.id)
    }

    // Fetch all turn entries across all turns to calculate book sales & top games
    let allEntries: any[] = []
    try {
      const { data: eData } = await supabase.from('turn_entries').select('*')
      allEntries = eData || []
    } catch (e) {
      // Fallback
    }

    // Process active turn numbers
    activeEntries.forEach((e) => {
      const book = books.find((b: any) => b.id === e.book_id)
      const price = book ? Number(book.ticket_price || 0) : 0

      if (e.end_ticket !== null && e.end_ticket !== undefined) {
        const sold = Math.max(0, e.end_ticket - e.start_ticket)
        ticketsSold += sold
        cashThisShift += sold * price
      } else {
        pendingScan += 1
      }
    })

    // Process books remaining and active book list
    books.forEach((book: any) => {
      const bookEntries = allEntries.filter((e) => e.book_id === book.id)
      let soldForBook = 0
      bookEntries.forEach((e) => {
        if (e.end_ticket !== null && e.end_ticket !== undefined) {
          soldForBook += Math.max(0, e.end_ticket - e.start_ticket)
        }
      })

      const total = Number(book.total_tickets || 100)
      const remaining = Math.max(0, total - soldForBook)

      let status: 'Active' | 'Low Stock' | 'Closed' = 'Active'
      if (remaining <= 0) {
        status = 'Closed'
      } else if (remaining <= total * 0.15) {
        status = 'Low Stock'
        lowStockCount += 1
      }

      activeBooksRows.push({
        id: book.id,
        bookCode: book.book_number,
        gameName: book.game_name,
        status,
        sold: soldForBook,
        remainingText: `${remaining} / ${total}`,
      })
    })

    // Process Top Games by Revenue
    const gameMap: Record<string, { price: number; revenue: number }> = {}
    allEntries.forEach((e) => {
      if (e.end_ticket !== null && e.end_ticket !== undefined) {
        const book = books.find((b: any) => b.id === e.book_id)
        if (book) {
          const game = book.game_name || 'Lottery Game'
          const price = Number(book.ticket_price || 0)
          const sold = Math.max(0, e.end_ticket - e.start_ticket)
          const rev = sold * price

          if (!gameMap[game]) {
            gameMap[game] = { price, revenue: 0 }
          }
          gameMap[game].revenue += rev
        }
      }
    })

    const sortedGames = Object.entries(gameMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)

    const maxRev = sortedGames.length > 0 ? sortedGames[0].revenue : 1
    topGames = sortedGames.map((g, idx) => ({
      rank: String(idx + 1).padStart(2, '0'),
      name: g.name,
      price: `$${g.price.toFixed(2)}`,
      percentage: Math.round((g.revenue / (maxRev || 1)) * 100),
      value: `$${g.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    }))

    // Build Activity Feed from recent books and turns
    const activityList: FeedItem[] = []
    if (activeTurn) {
      activityList.push({
        id: `turn-${activeTurn.id}`,
        text: (
          <>
            Turn active for <b>{activeTurn.person_name || 'Clerk'}</b>
          </>
        ),
        time: activeTurn.started_at
          ? new Date(activeTurn.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Active',
      })
    }

    books.slice(0, 3).forEach((b: any) => {
      activityList.push({
        id: `book-${b.id}`,
        text: (
          <>
            Book <b>{b.book_number}</b> registered ({b.game_name})
          </>
        ),
        time: b.created_at
          ? new Date(b.created_at).toLocaleDateString()
          : 'Recent',
      })
    })

    activityFeed = activityList
  } catch (e) {
    console.error(e)
  }

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="app">
      <Sidebar activeItem="Dashboard" />
      <main className="main">
        <div className="topbar">
          <div>
            <h1>Dashboard</h1>
            <div className="sub">{currentDateStr}</div>
          </div>
          <div className="topbar-right">
            <div className="shift-label">
              Status <b>{activeTurn ? 'Active' : 'No Turn'}</b>
            </div>
            <Link href="/history" className="btn">
              Manage Turns
            </Link>
            <Link href="/setup" className="btn btn-primary">
              + New Book
            </Link>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="stat-grid">
          <StatCard
            label="Cash This Shift"
            value={`$${cashThisShift.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            iconBg="rgba(47,111,237,.12)"
            iconSvg={
              <svg viewBox="0 0 24 24" fill="none" stroke="#2F6FED" strokeWidth="2">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            }
            deltaText={activeTurn ? "Active shift cash" : "No active shift"}
            deltaType="up"
          />

          <StatCard
            label="Tickets Sold"
            value={`${ticketsSold}`}
            iconBg="rgba(111,161,255,.12)"
            iconSvg={
              <svg viewBox="0 0 24 24" fill="none" stroke="#6FA1FF" strokeWidth="2">
                <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4z" />
              </svg>
            }
            deltaText={activeTurn ? "Shift ticket total" : "No active shift"}
            deltaType="up"
          />

          <StatCard
            label="Total Books"
            value={`${booksCount}`}
            iconBg="rgba(255,185,61,.12)"
            iconSvg={
              <svg viewBox="0 0 24 24" fill="none" stroke="#FFB93D" strokeWidth="2">
                <path d="M4 4h16v16H4zM4 9h16" />
              </svg>
            }
            deltaText={`${lowStockCount} low stock`}
            deltaType="flat"
          />

          <StatCard
            label="Pending Scan"
            value={`${pendingScan}`}
            iconBg="rgba(255,92,92,.12)"
            iconSvg={
              <svg viewBox="0 0 24 24" fill="none" stroke="#FF5C5C" strokeWidth="2">
                <rect x="3" y="3" width="18" height="14" rx="2" />
                <path d="M8 21h8" />
              </svg>
            }
            deltaText={pendingScan > 0 ? "Needs end scan" : "All scans clear"}
            deltaType={pendingScan > 0 ? "down" : "flat"}
          />
        </div>

        {/* SALES CHART + TOP GAMES */}
        <div className="grid-2">
          <SalesChart data={chartData} />
          <TopGamesPanel games={topGames} />
        </div>

        {/* BOOKS + ACTIVITY Feed */}
        <div className="grid-3">
          <ActiveBooksTable books={activeBooksRows} />
          <ActivityFeed items={activityFeed} />
        </div>
      </main>
    </div>
  )
}