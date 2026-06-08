import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

async function getFinancials() {
  const [wonDeals, openDeals, projectCosts, timeEntryCosts, budgets] = await Promise.all([
    prisma.deal.aggregate({ where: { status: 'WON' }, _sum: { value: true }, _count: true }),
    prisma.deal.aggregate({ where: { status: 'OPEN' }, _sum: { value: true }, _count: true }),
    prisma.projectCost.aggregate({ _sum: { actual: true, estimated: true } }),
    prisma.timeEntry.aggregate({ _sum: { totalCost: true, hours: true } }),
    prisma.project.aggregate({ where: { status: { in: ['IN_PROGRESS', 'PLANNING'] } }, _sum: { approvedBudget: true, actualCosts: true } }),
  ])

  const projectsDetail = await prisma.project.findMany({
    where: { status: { in: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'AT_RISK'] } },
    select: { id: true, name: true, approvedBudget: true, actualCosts: true, estimatedCosts: true, status: true, solution: { select: { name: true, color: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return { wonDeals, openDeals, projectCosts, timeEntryCosts, budgets, projectsDetail }
}

export default async function FinancialsPage() {
  const data = await getFinancials()

  const wonValue = Number(data.wonDeals._sum.value ?? 0)
  const pipelineValue = Number(data.openDeals._sum.value ?? 0)
  const totalBudget = Number(data.budgets._sum.approvedBudget ?? 0)
  const totalActualCosts = Number(data.budgets._sum.actualCosts ?? 0)
  const timeTrackingCost = Number(data.timeEntryCosts._sum.totalCost ?? 0)
  const totalHours = Number(data.timeEntryCosts._sum.hours ?? 0)

  return (
    <div>
      <Header title="Financeiro" subtitle="Orçamentos, custos, receitas e margem" />
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Receita Fechada', value: formatCurrency(wonValue), color: 'bg-green-500', sub: `${data.wonDeals._count} deals` },
            { label: 'Pipeline Aberto', value: formatCurrency(pipelineValue), color: 'bg-blue-500', sub: `${data.openDeals._count} deals` },
            { label: 'Orçamento Projetos', value: formatCurrency(totalBudget), color: 'bg-indigo-500', sub: 'projetos ativos' },
            { label: 'Custos Reais', value: formatCurrency(totalActualCosts), color: 'bg-orange-500', sub: `${totalHours.toFixed(0)}h registradas` },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{c.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Projects financial breakdown */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Financeiro por Projeto</h3>
            <Link href="/financials/time-tracking" className="text-xs text-blue-600 hover:underline">Time Tracking</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Projeto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Solução</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Orçamento</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Custo Real</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Margem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.projectsDetail.map(p => {
                  const budget = Number(p.approvedBudget ?? 0)
                  const cost = Number(p.actualCosts ?? 0)
                  const margin = budget - cost
                  const marginPct = budget > 0 ? (margin / budget) * 100 : null
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/projects/${p.id}`} className="font-medium text-gray-900 hover:text-blue-600">{p.name}</Link>
                      </td>
                      <td className="px-4 py-3">
                        {p.solution && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${p.solution.color}20`, color: p.solution.color }}>{p.solution.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{budget > 0 ? formatCurrency(budget) : '-'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{cost > 0 ? formatCurrency(cost) : '-'}</td>
                      <td className={`px-4 py-3 text-right font-medium ${margin < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {budget > 0 ? `${formatCurrency(margin)} (${marginPct?.toFixed(1)}%)` : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
