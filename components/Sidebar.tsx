'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',         label: 'Dashboard',    icon: '⊞' },
  { href: '/log',      label: 'Log Workout',  icon: '＋' },
  { href: '/history',  label: 'History',      icon: '☰' },
  { href: '/progress', label: 'Progress',     icon: '↑' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🏋️</span>
        <span className="logo-text">Workout</span>
      </div>
      <nav>
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-btn${pathname === link.href ? ' active' : ''}`}
          >
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
