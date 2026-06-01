'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/scan',
    label: 'Scan',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3M15 5h3a1 1 0 011 1v3M15 19h3a1 1 0 001-1v-3M7 12h10" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 3.5" />
      </svg>
    ),
  },
  {
    href: '/setup',
    label: 'Setup',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
      </svg>
    ),
  },
]

function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-[64px] bg-[#141414] border-r border-white/[0.05] flex flex-col items-center py-5 z-50">
      {/* Logo */}
      <div className="w-9 h-9 rounded-xl bg-[#c6f135] flex items-center justify-center mb-8 flex-shrink-0">
        <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`
                group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                ${isActive
                  ? 'bg-[#c6f135] text-black'
                  : 'text-[#3a3a3a] hover:text-[#888] hover:bg-white/[0.04]'
                }
              `}
            >
              <span className="w-[18px] h-[18px]">{item.icon}</span>

              {/* Tooltip */}
              <span className="
                absolute left-[calc(100%+10px)] px-2.5 py-1.5 bg-[#1e1e1e] border border-white/[0.08]
                text-white text-[11px] font-medium rounded-lg whitespace-nowrap
                opacity-0 pointer-events-none translate-x-[-4px]
                group-hover:opacity-100 group-hover:translate-x-0
                transition-all duration-150 z-50
              ">
                {item.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <span className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#c6f135] rounded-l-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom avatar placeholder */}
      <div className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-white/10 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-[#555]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    </aside>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex">
      <SidebarNav />
      <main className="flex-1 ml-[64px] overflow-y-auto">
        {children}
      </main>
    </div>
  )
}