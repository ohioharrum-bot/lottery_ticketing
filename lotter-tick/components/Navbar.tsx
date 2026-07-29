'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/scan', label: 'Scan', icon: '⊞' },
  { href: '/history', label: 'History', icon: '🕘' },
  { href: '/setup', label: 'Setup', icon: '📦' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 pb-safe pt-2 z-50 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] md:hidden">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-1 min-w-[64px] transition-all
                ${isActive 
                  ? 'text-blue-600' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                {link.icon}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider
                ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {link.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}