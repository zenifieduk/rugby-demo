'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Users, Calendar, Trophy } from 'lucide-react'

const navigation = [
  {
    name: 'Squad',
    href: '/squad',
    icon: Users,
  },
  {
    name: 'Fixtures',
    href: '/fixtures',
    icon: Calendar,
  },
  {
    name: 'Tables',
    href: '/tables',
    icon: Trophy,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-[#862633] border-r border-[#862633]">
      {/* Logo/Header */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <img 
            src="/images/club-badges/wigan-warriors-logo.svg" 
            alt="Wigan Warriors" 
            className="h-8 w-8"
          />
          <div>
            <h1 className="text-lg font-semibold text-white">Wigan Warriors</h1>
            <p className="text-xs text-white/70">AI Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5',
                      isActive ? 'text-white' : 'text-white/50'
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* System Status */}
      <div className="border-t border-white/20 p-4">
        <div className="flex items-center space-x-3">
          <div className="h-2 w-2 bg-green-400 rounded-full"></div>
          <span className="text-sm text-white/70">System Online</span>
        </div>
        <p className="text-xs text-white/50 mt-1">Last updated: 00:15:35</p>
      </div>
    </div>
  )
}