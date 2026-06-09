'use client'

import { Bell, Search, Menu } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useSidebar } from './app-shell'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession()
  const user = session?.user as any
  const { toggle } = useSidebar()

  return (
    <header className="h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button onClick={toggle} className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 shrink-0">
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="font-semibold text-gray-900 text-base md:text-lg leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-gray-500 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative hidden lg:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Buscar..."
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
        </div>
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <Link href="/settings" className="flex items-center gap-2 pl-2 md:pl-3 border-l border-gray-200 hover:opacity-80 transition-opacity">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.charAt(0) ?? 'U'}
            </div>
          )}
          <div className="hidden md:block">
            <div className="text-sm font-medium text-gray-900 leading-tight">{user?.name ?? 'Usuário'}</div>
            <div className="text-xs text-gray-500">{user?.role ?? 'MEMBER'}</div>
          </div>
        </Link>
      </div>
    </header>
  )
}
