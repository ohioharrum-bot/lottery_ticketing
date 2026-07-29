import Link from 'next/link'

export type GameItem = {
  rank: string
  name: string
  price: string
  percentage: number
  value: string
}

interface TopGamesPanelProps {
  games?: GameItem[]
}

export function TopGamesPanel({ games = [] }: TopGamesPanelProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Top Games by Revenue</span>
        <Link href="/setup" className="panel-link">
          View all
        </Link>
      </div>
      {!games || games.length === 0 ? (
        <div className="empty-state">No sales data yet.</div>
      ) : (
        games.map((g, idx) => (
          <div key={g.rank || idx} className="game-row">
            <span className="game-rank">{g.rank}</span>
            <span className="game-name">
              {g.name} <span className="price">{g.price}</span>
            </span>
            <div className="game-bar-wrap">
              <div className="game-bar" style={{ width: `${g.percentage}%` }}></div>
            </div>
            <span className="game-value">{g.value}</span>
          </div>
        ))
      )}
    </div>
  )
}
