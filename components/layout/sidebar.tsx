'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Users, Briefcase, CheckSquare, Calendar,
  DollarSign, ThumbsUp, Folder, Target, Brain, BarChart3,
  Zap, Download, Settings, Shield, FolderKanban, ChevronDown,
  ChevronRight, Bell, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'

const nav = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    name: 'CRM', icon: Users,
    children: [
      { name: 'Leads', href: '/crm/leads' },
      { name: 'Pipeline', href: '/crm/pipeline' },
      { name: 'Deals', href: '/crm/deals' },
      { name: 'Clientes', href: '/crm/clients' },
      { name: 'Contatos', href: '/crm/contacts' },
    ],
  },
  {
    name: 'Projetos', icon: Briefcase,
    children: [
      { name: 'Todos os Projetos', href: '/projects' },
      { name: 'Novo Projeto', href: '/projects/new' },
      { name: 'Templates', href: '/projects/templates' },
    ],
  },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  {
    name: 'Financeiro', icon: DollarSign,
    children: [
      { name: 'Visão Geral', href: '/financials' },
      { name: 'Orçamentos', href: '/financials/budgets' },
      { name: 'Custos', href: '/financials/costs' },
      { name: 'Receitas', href: '/financials/revenues' },
      { name: 'Time Tracking', href: '/financials/time-tracking' },
    ],
  },
  { name: 'Aprovações', href: '/approvals', icon: ThumbsUp },
  { name: 'Arquivos', href: '/files', icon: Folder },
  { name: 'Portfólios', href: '/portfolios', icon: FolderKanban },
  { name: 'Metas', href: '/goals', icon: Target },
  { name: 'IA PixelSAV', href: '/ai', icon: Brain },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  { name: 'Automações', href: '/automations', icon: Zap },
  { name: 'Importar Asana', href: '/import/asana', icon: Download },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>(['CRM', 'Projetos', 'Financeiro'])

  const toggle = (name: string) =>
    setExpanded(p => p.includes(name) ? p.filter(n => n !== name) : [...p, name])

  return (
    <aside className="flex flex-col w-60 bg-gray-950 h-screen overflow-y-auto sidebar-scroll shrink-0 border-r border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-800 shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0">
          PS
        </div>
        <div className="min-w-0">
          <div className="font-bold text-white text-sm leading-tight">PixelSAV</div>
          <div className="text-xs text-gray-500">WorkOS</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map(item => {
          if ('children' in item) {
            const isOpen = expanded.includes(item.name)
            const isActive = item.children?.some(c => pathname.startsWith(c.href))
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggle(item.name)}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon size={15} />
                    <span className="font-medium">{item.name}</span>
                  </span>
                  {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                {isOpen && (
                  <div className="ml-5 mt-0.5 space-y-0.5 pl-3 border-l border-gray-800">
                    {item.children?.map(child => (
                      <Link
                        key={child.href} href={child.href}
                        className={cn(
                          'block px-2 py-1.5 rounded-lg text-xs transition-colors',
                          pathname === child.href
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-gray-500 hover:text-white hover:bg-gray-800'
                        )}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }
          return (
            <Link
              key={item.href} href={item.href!}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname === item.href
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <item.icon size={15} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom links */}
      <div className="px-2 py-3 border-t border-gray-800 space-y-0.5">
        <Link href="/admin" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors', pathname.startsWith('/admin') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800')}>
          <Shield size={15} /><span>Admin</span>
        </Link>
        <Link href="/settings" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors', pathname === '/settings' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800')}>
          <Settings size={15} /><span>Configurações</span>
        </Link>
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-colors">
          <LogOut size={15} /><span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
