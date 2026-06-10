'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { X, AlertCircle, Clock, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export type Notif = {
  id: string
  type: 'overdue' | 'dueSoon' | 'newAssignment'
  title: string
  projectId: string
  projectName: string
  dueDate?: string | null
}

type CtxType = {
  notifications: Notif[]
  unreadCount: number
  markAllRead: () => void
}

const Ctx = createContext<CtxType>({ notifications: [], unreadCount: 0, markAllRead: () => {} })
export const useNotifications = () => useContext(Ctx)

const STORAGE_KEY = 'pixelsav_dismissed_notifs'

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function addDismissed(id: string) {
  const prev = getDismissed()
  if (!prev.includes(id)) localStorage.setItem(STORAGE_KEY, JSON.stringify([...prev, id]))
}

const TYPE_CFG = {
  overdue: { icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', label: 'Tarefa vencida' },
  dueSoon: { icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', label: 'Vence em breve' },
  newAssignment: { icon: UserPlus, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', label: 'Nova designação' },
}

function Toast({ n, onDismiss }: { n: Notif; onDismiss: () => void }) {
  const cfg = TYPE_CFG[n.type]
  const Icon = cfg.icon
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl"
      style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, minWidth: 290, maxWidth: 340, backdropFilter: 'blur(8px)' }}>
      <Icon size={15} style={{ color: cfg.color }} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold mb-0.5" style={{ color: cfg.color }}>{cfg.label}</p>
        <Link href={`/projects/${n.projectId}`} onClick={onDismiss}
          className="text-sm font-medium truncate block hover:underline" style={{ color: '#f3f4f6' }}>
          {n.title}
        </Link>
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
          {n.projectName}{n.dueDate ? ` · ${formatDate(n.dueDate)}` : ''}
        </p>
      </div>
      <button onClick={onDismiss} className="shrink-0 mt-0.5 p-0.5 rounded hover:bg-white/10 transition-colors" style={{ color: '#4b5563' }}>
        <X size={13} />
      </button>
    </div>
  )
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [all, setAll] = useState<Notif[]>([])
  const [toasts, setToasts] = useState<Notif[]>([])

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        const dismissed = getDismissed()
        const items: Notif[] = [
          ...(data.overdue ?? []).map((t: any) => ({
            id: `overdue_${t.id}`, type: 'overdue' as const,
            title: t.title, projectId: t.project?.id ?? '', projectName: t.project?.name ?? '', dueDate: t.dueDate,
          })),
          ...(data.dueSoon ?? []).map((t: any) => ({
            id: `dueSoon_${t.id}`, type: 'dueSoon' as const,
            title: t.title, projectId: t.project?.id ?? '', projectName: t.project?.name ?? '', dueDate: t.dueDate,
          })),
          ...(data.newAssignments ?? []).map((t: any) => ({
            id: `assigned_${t.id}`, type: 'newAssignment' as const,
            title: t.title, projectId: t.project?.id ?? '', projectName: t.project?.name ?? '',
          })),
        ]
        setAll(items)
        const fresh = items.filter(n => !dismissed.includes(n.id))
        // Show up to 3 toasts staggered
        fresh.slice(0, 3).forEach((n, i) => {
          setTimeout(() => setToasts(v => [...v, n]), i * 700)
        })
      })
      .catch(() => {})
  }, [])

  function dismissToast(id: string) {
    setToasts(v => v.filter(n => n.id !== id))
    addDismissed(id)
  }

  const markAllRead = useCallback(() => {
    all.forEach(n => addDismissed(n.id))
    setToasts([])
  }, [all])

  const dismissed = typeof window !== 'undefined' ? getDismissed() : []
  const unreadCount = all.filter(n => !dismissed.includes(n.id)).length

  return (
    <Ctx.Provider value={{ notifications: all, unreadCount, markAllRead }}>
      {children}
      {/* Toast stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map(n => (
            <div key={n.id} className="pointer-events-auto">
              <Toast n={n} onDismiss={() => dismissToast(n.id)} />
            </div>
          ))}
        </div>
      )}
    </Ctx.Provider>
  )
}
