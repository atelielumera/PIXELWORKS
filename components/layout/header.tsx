'use client'

import { Bell, Search, Menu, AlertCircle, Clock, UserPlus, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSidebar } from './app-shell'
import { useNotifications, type Notif } from '@/components/notifications/notifications-provider'
import { formatDate } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
}

const TYPE_CFG = {
  overdue:       { icon: AlertCircle, color: '#ef4444', label: 'Vencida' },
  dueSoon:       { icon: Clock,       color: '#f59e0b', label: 'Vence em breve' },
  newAssignment: { icon: UserPlus,    color: '#3b82f6', label: 'Designada para você' },
}

function NotifRow({ n, onClose }: { n: Notif; onClose: () => void }) {
  const cfg = TYPE_CFG[n.type]
  const Icon = cfg.icon
  return (
    <Link href={`/projects/${n.projectId}`} onClick={onClose}
      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/5"
      style={{ borderBottom: '1px solid #2c2e33' }}>
      <Icon size={14} style={{ color: cfg.color }} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: '#f3f4f6' }}>{n.title}</p>
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
          {n.projectName}{n.dueDate ? ` · ${formatDate(n.dueDate)}` : ''}
        </p>
        <p className="text-[10px] mt-0.5 font-medium" style={{ color: cfg.color }}>{cfg.label}</p>
      </div>
    </Link>
  )
}

export function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession()
  const user = session?.user as any
  const { toggle } = useSidebar()
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!panelOpen) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setPanelOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelOpen])

  return (
    <header className="h-14 md:h-16 border-b flex items-center justify-between px-4 md:px-6 shrink-0 gap-3"
      style={{ backgroundColor: '#1e1f21', borderColor: '#3d3f44' }}>
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={toggle} className="md:hidden p-1.5 rounded-lg shrink-0" style={{ color: '#6b7280' }}>
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="font-semibold text-base md:text-lg leading-tight truncate" style={{ color: '#f3f4f6' }}>{title}</h1>
          {subtitle && <p className="text-xs md:text-sm truncate" style={{ color: '#6b7280' }}>{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative hidden lg:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4b5563' }} />
          <input
            placeholder="Buscar..."
            className="pl-9 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
            style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44', color: '#f3f4f6' }}
          />
        </div>

        {/* Bell with notifications panel */}
        <div ref={panelRef} className="relative">
          <button onClick={() => { setPanelOpen(o => !o); if (!panelOpen && unreadCount > 0) {} }}
            className="relative p-2 rounded-lg transition-colors"
            style={{ color: '#6b7280' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {panelOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44', width: 320 }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #3d3f44' }}>
                <span className="text-sm font-semibold" style={{ color: '#f3f4f6' }}>Notificações</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs" style={{ color: '#3b82f6' }}>
                      Marcar todas como lidas
                    </button>
                  )}
                  <button onClick={() => setPanelOpen(false)} style={{ color: '#4b5563' }}><X size={14} /></button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-sm text-center" style={{ color: '#4b5563' }}>Nenhuma notificação</p>
                ) : (
                  notifications.map(n => <NotifRow key={n.id} n={n} onClose={() => setPanelOpen(false)} />)
                )}
              </div>
            </div>
          )}
        </div>

        <Link href="/settings" className="flex items-center gap-2 pl-2 md:pl-3 hover:opacity-80 transition-opacity"
          style={{ borderLeft: '1px solid #3d3f44' }}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.charAt(0) ?? 'U'}
            </div>
          )}
          <div className="hidden md:block">
            <div className="text-sm font-medium leading-tight" style={{ color: '#f3f4f6' }}>{user?.name ?? 'Usuário'}</div>
            <div className="text-xs" style={{ color: '#6b7280' }}>{user?.role ?? 'MEMBER'}</div>
          </div>
        </Link>
      </div>
    </header>
  )
}
