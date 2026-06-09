import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

async function getReportData() {
  const [solutionStats, pipelineByStage, projectsByStatus, tasksStats] = await Promise.all([
    prisma.deal.groupBy({ by: ['solutionId'], _count: { id: true }, _sum: { value: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
    prisma.lead.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.project.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.task.groupBy({ by: ['status'], _count: { id: true } }),
  ])

  const solutionIds = solutionStats.map(s => s.solutionId).filter(Boolean) as string[]
  const solutions = await prisma.solution.findMany({ where: { id: { in: solutionIds } }, select: { id: true, name: true, color: true } })
  const solMap = Object.fromEntries(solutions.map(s => [s.id, s]))

  return { solutionStats, pipelineByStage, projectsByStatus, tasksStats, solMap }
}

export default async function ReportsPage() {
  const data = await getReportData()

  return (
    <div>
      <Header title="Relatórios" subtitle="Análise consolidada de todos os módulos" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soluções mais vendidas */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Soluções Mais Vendidas</h3>
          <div className="space-y-2">
            {data.solutionStats.map(s => {
              const sol = s.solutionId ? data.solMap[s.solutionId] : null
              return (
                <div key={s.solutionId ?? 'none'} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {sol && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sol.color ?? '#6B7280' }} />}
                    <span className="text-sm text-gray-700">{sol?.name ?? 'Sem solução'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{s._count.id} deals</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(Number(s._sum.value ?? 0))}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pipeline por etapa */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Pipeline por Etapa</h3>
          <div className="space-y-2">
            {data.pipelineByStage.map(s => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{s.status}</span>
                <span className="text-sm font-bold text-gray-900">{s._count.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Projetos por status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Projetos por Status</h3>
          <div className="space-y-2">
            {data.projectsByStatus.map(s => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{s.status}</span>
                <span className="text-sm font-bold text-gray-900">{s._count.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tarefas por status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Tarefas por Status</h3>
          <div className="space-y-2">
            {data.tasksStats.map(s => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{s.status}</span>
                <span className="text-sm font-bold text-gray-900">{s._count.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
