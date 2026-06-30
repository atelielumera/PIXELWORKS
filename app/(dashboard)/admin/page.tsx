import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Users, Package, Layers, Zap, FileText, Activity, Database, Webhook } from 'lucide-react'

async function getAdminStats() {
  try {
    const [users, teams, solutions, templates, automations, imports, auditLogs] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.solution.count(),
      prisma.projectTemplate.count(),
      prisma.automation.count(),
      prisma.import.count(),
      prisma.auditLog.count(),
    ])
    return { users, teams, solutions, templates, automations, imports, auditLogs }
  } catch { return { users: 0, teams: 0, solutions: 0, templates: 0, automations: 0, imports: 0, auditLogs: 0 } }
}

export default async function AdminPage() {
  const stats = await getAdminStats()

  const modules = [
    { name: 'Usuários', href: '/admin/users', icon: Users, count: stats.users, desc: 'Gerenciar usuários e permissões' },
    { name: 'Equipes', href: '/admin/teams', icon: Users, count: stats.teams, desc: 'Organizar equipes' },
    { name: 'Soluções PixelSAV', href: '/admin/solutions', icon: Package, count: stats.solutions, desc: 'Produtos e soluções da PixelSAV' },
    { name: 'Templates', href: '/admin/templates', icon: Layers, count: stats.templates, desc: 'Templates de projeto por solução' },
    { name: 'Automações', href: '/automations', icon: Zap, count: stats.automations, desc: 'Regras de automação do sistema' },
    { name: 'Importações', href: '/import/asana', icon: Database, count: stats.imports, desc: 'Histórico de importações' },
    { name: 'Logs de Auditoria', href: '/admin/logs', icon: Activity, count: stats.auditLogs, desc: 'Rastreamento de ações' },
    { name: 'Webhooks', href: '/admin/webhooks', icon: Webhook, count: 0, desc: 'Integrações externas' },
  ]

  return (
    <div>
      <Header title="Administração" subtitle="Configurações internas do PixelSAV WorkOS" />
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {modules.map(mod => (
            <Link key={mod.href} href={mod.href}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <mod.icon size={18} className="text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{mod.count}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{mod.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{mod.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
