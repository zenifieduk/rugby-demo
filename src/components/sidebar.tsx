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
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo/Header */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img 
            src="/images/club-badges/wigan-warriors-logo.svg" 
            alt="Wigan Warriors" 
            className="h-8 w-8"
          />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Wigan Warriors</h1>
            <p className="text-xs text-gray-500">AI Intelligence</p>
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
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5',
                      isActive ? 'text-blue-600' : 'text-gray-400'
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
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="h-2 w-2 bg-green-400 rounded-full"></div>
          <span className="text-sm text-gray-600">System Online</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Last updated: 00:15:35</p>
      </div>
    </div>
  )
}