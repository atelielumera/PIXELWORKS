'use client'

import { Bell, Search } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface HeaderProps { title: string; subtitle?: string }

export function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession()
  const user = session?.user as any

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="font-semibold text-gray-900 text-lg leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Buscar..."
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
        </div>
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-gray-900 leading-tight">{user?.name ?? 'Usuário'}</div>
            <div className="text-xs text-gray-500">{user?.role ?? 'MEMBER'}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
