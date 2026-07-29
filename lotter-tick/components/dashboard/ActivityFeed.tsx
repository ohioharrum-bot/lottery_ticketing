import React from 'react'

export type FeedItem = {
  id: string
  text: React.ReactNode
  time: string
}

interface ActivityFeedProps {
  items?: FeedItem[]
}

export function ActivityFeed({ items = [] }: ActivityFeedProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Activity Feed</span>
      </div>
      {!items || items.length === 0 ? (
        <div className="empty-state">No recent activity.</div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="feed-item">
            <div>
              <div className="feed-text">{item.text}</div>
              <div className="feed-time">{item.time}</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
