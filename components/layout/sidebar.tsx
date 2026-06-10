'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, Briefcase, CheckSquare, Calendar,
  DollarSign, ThumbsUp, Folder, Target, Brain, BarChart3,
  Zap, Download, Settings, Shield, FolderKanban, ChevronDown,
  ChevronRight, LogOut, Building2, Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut, useSession } from 'next-auth/react'

type ProjectItem = {
  id: string
  name: string
  solution: { color: string | null } | null
}

type TeamItem = {
  id: string
  name: string
  color: string | null
}

const staticNav = [
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
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Equipes', href: '/teams', icon: Building2 },
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

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as any
  const [expanded, setExpanded] = useState<string[]>(['CRM', 'Projetos', 'Financeiro'])
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [projectsExpanded, setProjectsExpanded] = useState(true)
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [teamsExpanded, setTeamsExpanded] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => setProjects(d.data ?? []))
      .catch(() => {})
    fetch('/api/teams')
      .then(r => r.json())
      .then(d => setTeams(d.data ?? []))
      .catch(() => {})
  }, [])

  const toggle = (name: string) =>
    setExpanded(p => p.includes(name) ? p.filter(n => n !== name) : [...p, name])

  const isProjectActive = pathname.startsWith('/projects')

  return (
    <aside className="flex flex-col w-60 bg-gray-950 h-screen overflow-y-auto sidebar-scroll shrink-0 border-r border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-800 shrink-0">
        <img src="/logo-workos.png" alt="PixelSAV WorkOS" className="w-9 h-9 object-contain shrink-0" />
        <div className="min-w-0">
          <div className="font-bold text-white text-sm leading-tight">PixelSAV</div>
          <div className="text-xs text-gray-500">WorkOS</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {/* Dashboard */}
        <Link
          href="/"
          onClick={onClose}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === '/' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
          )}
        >
          <LayoutDashboard size={15} />Dashboard
        </Link>

        {/* CRM */}
        {(() => {
          const item = staticNav.find(n => n.name === 'CRM')!
          const isOpen = expanded.includes('CRM')
          const children = (item as any).children as { name: string; href: string }[]
          const isActive = children.some(c => pathname.startsWith(c.href))
          return (
            <div key="CRM">
              <button onClick={() => toggle('CRM')} className={cn(
                'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors',
                isActive ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}>
                <span className="flex items-center gap-2.5"><Users size={15} /><span className="font-medium">CRM</span></span>
                {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
              {isOpen && (
                <div className="ml-5 mt-0.5 space-y-0.5 pl-3 border-l border-gray-800">
                  {children.map(child => (
                    <Link key={child.href} href={child.href} onClick={onClose} className={cn(
                      'block px-2 py-1.5 rounded-lg text-xs transition-colors',
                      pathname === child.href ? 'bg-blue-600 text-white font-medium' : 'text-gray-500 hover:text-white hover:bg-gray-800'
                    )}>{child.name}</Link>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* PROJETOS — seção dinâmica estilo Asana */}
        <div>
          <button
            onClick={() => setProjectsExpanded(v => !v)}
            className={cn(
              'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors',
              isProjectActive ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <span className="flex items-center gap-2.5">
              <Briefcase size={15} />
              <span className="font-medium">Projetos</span>
            </span>
            {projectsExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>

          {projectsExpanded && (
            <div className="ml-5 mt-0.5 pl-3 border-l border-gray-800 space-y-0.5">
              {/* Links fixos */}
              <Link href="/projects" onClick={onClose} className={cn(
                'block px-2 py-1.5 rounded-lg text-xs transition-colors',
                pathname === '/projects' ? 'bg-blue-600 text-white font-medium' : 'text-gray-500 hover:text-white hover:bg-gray-800'
              )}>Todos os Projetos</Link>
              <Link href="/projects/templates" onClick={onClose} className={cn(
                'block px-2 py-1.5 rounded-lg text-xs transition-colors',
                pathname.startsWith('/projects/templates') ? 'bg-blue-600 text-white font-medium' : 'text-gray-500 hover:text-white hover:bg-gray-800'
              )}>Templates</Link>

              {/* Divisor */}
              {projects.length > 0 && <div className="my-1 border-t border-gray-800/60" />}

              {/* Projetos individuais — igual Asana */}
              {projects.map(p => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors group',
                    pathname === `/projects/${p.id}` ? 'bg-blue-600 text-white font-medium' : 'text-gray-500 hover:text-white hover:bg-gray-800'
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-sm shrink-0"
                    style={{ backgroundColor: p.solution?.color ?? '#6B7280' }}
                  />
                  <span className="truncate leading-tight">{p.name}</span>
                </Link>
              ))}

              {/* Novo projeto */}
              <Link href="/projects/new" onClick={onClose} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-600 hover:text-blue-400 hover:bg-gray-800 transition-colors">
                <Plus size={11} />
                <span>Novo projeto</span>
              </Link>
            </div>
          )}
        </div>

        {/* Resto dos itens estáticos */}
        <Link href="/tasks" onClick={onClose} className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
          pathname === '/tasks' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
        )}><CheckSquare size={15} />Tarefas</Link>

        {/* EQUIPES — seção dinâmica igual a Projetos */}
        <div>
          <button
            onClick={() => setTeamsExpanded(v => !v)}
            className={cn(
              'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors',
              pathname.startsWith('/teams') ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <span className="flex items-center gap-2.5">
              <Building2 size={15} />
              <span className="font-medium">Equipes</span>
            </span>
            {teamsExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>

          {teamsExpanded && (
            <div className="ml-5 mt-0.5 pl-3 border-l border-gray-800 space-y-0.5">
              <Link href="/teams" onClick={onClose} className={cn(
                'block px-2 py-1.5 rounded-lg text-xs transition-colors',
                pathname === '/teams' ? 'bg-blue-600 text-white font-medium' : 'text-gray-500 hover:text-white hover:bg-gray-800'
              )}>Todas as Equipes</Link>

              {teams.length > 0 && <div className="my-1 border-t border-gray-800/60" />}

              {teams.map(t => (
                <Link
                  key={t.id}
                  href={`/teams/${t.id}`}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors',
                    pathname === `/teams/${t.id}` ? 'bg-blue-600 text-white font-medium' : 'text-gray-500 hover:text-white hover:bg-gray-800'
                  )}
                >
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: t.color ?? '#6B7280' }} />
                  <span className="truncate leading-tight">{t.name}</span>
                </Link>
              ))}

              <Link href="/teams/new" onClick={onClose} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-600 hover:text-blue-400 hover:bg-gray-800 transition-colors">
                <Plus size={11} />
                <span>Nova equipe</span>
              </Link>
            </div>
          )}
        </div>

        <Link href="/agenda" onClick={onClose} className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
          pathname === '/agenda' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
        )}><Calendar size={15} />Agenda</Link>

        {/* Financeiro */}
        {(() => {
          const children = [
            { name: 'Visão Geral', href: '/financials' },
            { name: 'Orçamentos', href: '/financials/budgets' },
            { name: 'Custos', href: '/financials/costs' },
            { name: 'Receitas', href: '/financials/revenues' },
            { name: 'Time Tracking', href: '/financials/time-tracking' },
          ]
          const isOpen = expanded.includes('Financeiro')
          const isActive = children.some(c => pathname.startsWith(c.href))
          return (
            <div>
              <button onClick={() => toggle('Financeiro')} className={cn(
                'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors',
                isActive ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}>
                <span className="flex items-center gap-2.5"><DollarSign size={15} /><span className="font-medium">Financeiro</span></span>
                {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
              {isOpen && (
                <div className="ml-5 mt-0.5 space-y-0.5 pl-3 border-l border-gray-800">
                  {children.map(child => (
                    <Link key={child.href} href={child.href} onClick={onClose} className={cn(
                      'block px-2 py-1.5 rounded-lg text-xs transition-colors',
                      pathname === child.href ? 'bg-blue-600 text-white font-medium' : 'text-gray-500 hover:text-white hover:bg-gray-800'
                    )}>{child.name}</Link>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        <Link href="/approvals" onClick={onClose} className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
          pathname === '/approvals' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
        )}><ThumbsUp size={15} />Aprovações</Link>

        <Link href="/files" onClick={onClose} className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
          pathname === '/files' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
        )}><Folder size={15} />Arquivos</Link>

        <Link href="/portfolios" onClick={onClose} className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
          pathname === '/portfolios' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
        )}><FolderKanban size={15} />Portfólios</Link>

        <Link href="/goals" onClick={onClose} className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
          pathname === '/goals' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
        )}><Target size={15} />Metas</Link>

        <Link href="/ai" onClick={onClose} className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
          pathname === '/ai' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
        )}><Brain size={15} />IA PixelSAV</Link>

        <Link href="/reports" onClick={onClose} className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
          pathname === '/reports' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
        )}><BarChart3 size={15} />Relatórios</Link>

        <Link href="/automations" onClick={onClose} className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
          pathname === '/automations' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
        )}><Zap size={15} />Automações</Link>

        <Link href="/import/asana" onClick={onClose} className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
          pathname === '/import/asana' ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
        )}><Download size={15} />Importar Asana</Link>
      </nav>

      {/* Bottom links */}
      <div className="px-2 py-3 border-t border-gray-800 space-y-0.5">
        {/* User avatar strip */}
        <Link href="/settings" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors mb-1">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.charAt(0) ?? 'U'}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium text-white leading-tight truncate">{user?.name ?? 'Usuário'}</div>
            <div className="text-xs text-gray-500 truncate">{user?.email ?? ''}</div>
          </div>
        </Link>

        <Link href="/admin" onClick={onClose} className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors', pathname.startsWith('/admin') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800')}>
          <Shield size={15} /><span>Admin</span>
        </Link>
        <Link href="/settings" onClick={onClose} className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors', pathname === '/settings' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800')}>
          <Settings size={15} /><span>Configurações</span>
        </Link>
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-colors">
          <LogOut size={15} /><span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
