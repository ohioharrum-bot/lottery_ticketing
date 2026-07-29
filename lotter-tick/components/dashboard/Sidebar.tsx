'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  activeItem?: 'Dashboard' | 'Scan' | 'History' | 'Setup' | 'Settings' | string
}

export function Sidebar({ activeItem = 'Dashboard' }: SidebarProps) {
  const normalizedActive = activeItem.toLowerCase()
  const [userName, setUserName] = useState<string>('Store Clerk')
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Store Clerk'
        setUserName(name)
        setUserEmail(user.email || '')
      }
    }
    loadUser()
  }, [])

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">🎟</div>
        <div>
          <div className="brand-name">TicketOps</div>
          <div className="brand-sub">Lottery POS</div>
        </div>
      </div>

      <div className="nav-group">
        <Link
          href="/dashboard"
          className={`nav-item ${normalizedActive === 'dashboard' ? 'active' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
          Dashboard
        </Link>
        <Link
          href="/scan"
          className={`nav-item ${normalizedActive === 'scan' ? 'active' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          Scan
        </Link>
        <Link
          href="/history"
          className={`nav-item ${normalizedActive === 'history' ? 'active' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
          History
        </Link>
        <Link
          href="/setup"
          className={`nav-item ${normalizedActive === 'setup' ? 'active' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16v4H4zM4 10h16v10H4z" />
            <path d="M9 14h6" />
          </svg>
          Setup
        </Link>
        <Link
          href="/settings"
          className={`nav-item ${normalizedActive === 'settings' ? 'active' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H9a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V9a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z" />
          </svg>
          Settings
        </Link>
      </div>

      <div className="sidebar-foot">
        <div className="avatar"></div>
        <div>
          <div className="foot-name">{userName}</div>
          <div className="foot-role">{userEmail ? userEmail : 'Store Clerk'}</div>
        </div>
      </div>
      <div className="powered-by">
        Powered by <b>Gizmo Design</b>
      </div>
    </aside>
  )
}
