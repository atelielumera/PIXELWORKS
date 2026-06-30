import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatDate, formatCurrency } from '@/lib/utils'

async function getGoals() {
  try {
    return await prisma.goal.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { metrics: true } } },
    })
  } catch {
    return []
  }
}

export default async function GoalsPage() {
  const goals = await getGoals()
  return (
    <div>
      <Header title="Metas" subtitle="Consolidação de projetos, tarefas e CRM" />
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map(goal => {
            const pct = goal.targetValue && goal.currentValue
              ? Math.min(100, (Number(goal.currentValue) / Number(goal.targetValue)) * 100)
              : 0
            return (
              <div key={goal.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">{goal.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    goal.status === 'ACHIEVED' ? 'bg-green-50 text-green-700' :
                    goal.status === 'ACTIVE' ? 'bg-blue-50 text-blue-700' :
                    goal.status === 'MISSED' ? 'bg-red-50 text-red-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>{goal.status}</span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{Number(goal.currentValue ?? 0).toFixed(0)} {goal.unit}</span>
                    <span>{Number(goal.targetValue ?? 0).toFixed(0)} {goal.unit}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${
                      pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : 'bg-yellow-500'
                    }`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">{pct.toFixed(0)}%</p>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{goal.period}</span>
                  <span>{goal._count.metrics} métricas</span>
                </div>
              </div>
            )
          })}
          {goals.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">Nenhuma meta cadastrada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
