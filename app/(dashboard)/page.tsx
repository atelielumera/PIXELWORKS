import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/header'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  Users, Briefcase, CheckSquare, DollarSign, Clock,
  TrendingUp, AlertTriangle, ThumbsUp, Calendar, Zap
} from 'lucide-react'

async function getDashboardData() {
  try {
    const [leadsNew, leadsWaiting, proposalsOpen, dealsWon, dealsLost,
      projectsActive, projectsAtRisk, tasksOverdue, approvalsPending,
      upcomingEvents, revenueDeals] = await Promise.all([
      prisma.lead.count({ where: { status: 'NEW' } }),
      prisma.lead.count({ where: { status: 'WAITING_RESPONSE' } }),
      prisma.proposal.count({ where: { status: { in: ['DRAFT', 'SENT', 'VIEWED'] } } }),
      prisma.deal.count({ where: { status: 'WON' } }),
      prisma.deal.count({ where: { status: 'LOST' } }),
      prisma.project.count({ where: { status: { in: ['PLANNING', 'IN_PROGRESS'] } } }),
      prisma.project.count({ where: { health: 'AT_RISK' } }),
      prisma.task.count({ where: { status: { notIn: ['DONE', 'CANCELLED'] }, dueDate: { lt: new Date() } } }),
      prisma.approval.count({ where: { status: 'PENDING' } }),
      prisma.event.count({ where: { startDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 86400000) } } }),
      prisma.deal.aggregate({ where: { status: 'WON' }, _sum: { value: true } }),
    ])

    const openDealsValue = await prisma.deal.aggregate({
      where: { status: 'OPEN' },
      _sum: { value: true },
    })

    return {
      leadsNew, leadsWaiting, proposalsOpen, dealsWon, dealsLost,
      projectsActive, projectsAtRisk, tasksOverdue, approvalsPending,
      upcomingEvents,
      revenueClosed: Number(revenueDeals._sum.value ?? 0),
      pipelineValue: Number(openDealsValue._sum.value ?? 0),
    }
  } catch {
    return {
      leadsNew: 0, leadsWaiting: 0, proposalsOpen: 0, dealsWon: 0, dealsLost: 0,
      projectsActive: 0, projectsAtRisk: 0, tasksOverdue: 0, approvalsPending: 0,
      upcomingEvents: 0, revenueClosed: 0, pipelineValue: 0,
    }
  }
}

async function getRecentLeads() {
  try {
    return await prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { solution: true, responsible: { select: { name: true } } },
    })
  } catch {
    return []
  }
}

async function getUpcomingEvents() {
  try {
    return await prisma.event.findMany({
      take: 5,
      where: { startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
      include: { project: { select: { name: true } } },
    })
  } catch {
    return []
  }
}

function StatCard({ title, value, sub, icon: Icon, color, href }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; href?: string
}) {
  const Wrapper = href ? Link : 'div'
  return (
    <Wrapper href={href as string} className={`bg-white rounded-xl p-5 border border-gray-200 ${href ? 'hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </Wrapper>
  )
}

export default async function DashboardPage() {
  const [stats, leads, events] = await Promise.all([
    getDashboardData(),
    getRecentLeads(),
    getUpcomingEvents(),
  ])

  const PIPELINE_LABELS: Record<string, string> = {
    NEW: 'Novo', WAITING_RESPONSE: 'Aguardando', QUALIFIED: 'Qualificado',
    PROPOSAL_SENT: 'Proposta Enviada', NEGOTIATION: 'Negociação',
    WON: 'Ganho', LOST: 'Perdido',
  }

  return (
    <div>
      <Header title="Dashboard" subtitle="Visão geral do PixelSAV WorkOS" />
      <div className="p-6 space-y-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
          <StatCard title="Leads Novos" value={stats.leadsNew} icon={Users} color="bg-blue-500" href="/crm/leads?status=NEW" />
          <StatCard title="Aguardando" value={stats.leadsWaiting} icon={Clock} color="bg-yellow-500" href="/crm/leads?status=WAITING_RESPONSE" />
          <StatCard title="Propostas Abertas" value={stats.proposalsOpen} icon={TrendingUp} color="bg-purple-500" />
          <StatCard title="Deals Ganhos" value={stats.dealsWon} sub={formatCurrency(stats.revenueClosed)} icon={DollarSign} color="bg-green-500" href="/crm/deals" />
          <StatCard title="Projetos Ativos" value={stats.projectsActive} icon={Briefcase} color="bg-indigo-500" href="/projects" />
          <StatCard title="Em Risco" value={stats.projectsAtRisk} icon={AlertTriangle} color="bg-red-500" href="/projects?health=AT_RISK" />
          <StatCard title="Tarefas Atrasadas" value={stats.tasksOverdue} icon={CheckSquare} color="bg-orange-500" href="/tasks" />
          <StatCard title="Aprovações" value={stats.approvalsPending} icon={ThumbsUp} color="bg-cyan-500" href="/approvals" />
          <StatCard title="Eventos (7d)" value={stats.upcomingEvents} icon={Calendar} color="bg-teal-500" href="/agenda" />
          <StatCard title="Pipeline" value={formatCurrency(stats.pipelineValue)} icon={Zap} color="bg-violet-500" href="/crm/deals" />
          <StatCard title="Receita Fechada" value={formatCurrency(stats.revenueClosed)} icon={DollarSign} color="bg-emerald-500" />
          <StatCard title="Deals Perdidos" value={stats.dealsLost} icon={AlertTriangle} color="bg-gray-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Leads Recentes</h2>
              <Link href="/crm/leads" className="text-xs text-blue-600 hover:underline">Ver todos</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {leads.length === 0 && (
                <p className="text-sm text-gray-500 px-5 py-6 text-center">Nenhum lead ainda.</p>
              )}
              {leads.map(lead => (
                <Link key={lead.id} href={`/crm/leads/${lead.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lead.contactName}</p>
                    <p className="text-xs text-gray-500">{lead.company ?? 'Sem empresa'} • {lead.solution?.name ?? 'Sem solução'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    lead.status === 'NEW' ? 'bg-blue-50 text-blue-700' :
                    lead.status === 'WON' ? 'bg-green-50 text-green-700' :
                    lead.status === 'LOST' ? 'bg-red-50 text-red-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>{PIPELINE_LABELS[lead.status] ?? lead.status}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Próximos Eventos</h2>
              <Link href="/agenda" className="text-xs text-blue-600 hover:underline">Ver agenda</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {events.length === 0 && (
                <p className="text-sm text-gray-500 px-5 py-6 text-center">Nenhum evento nos próximos 7 dias.</p>
              )}
              {events.map(ev => (
                <div key={ev.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="text-center w-10 shrink-0">
                    <div className="text-lg font-bold text-gray-900 leading-none">{new Date(ev.startDate).getDate()}</div>
                    <div className="text-xs text-gray-500">{new Date(ev.startDate).toLocaleString('pt-BR', { month: 'short' })}</div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                    <p className="text-xs text-gray-500">{ev.project?.name ?? ev.type}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    ev.type === 'EVENT' ? 'bg-blue-50 text-blue-700' :
                    ev.type === 'SETUP' ? 'bg-yellow-50 text-yellow-700' :
                    ev.type === 'OPERATION' ? 'bg-green-50 text-green-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>{ev.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
