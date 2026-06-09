import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'

async function getGoals() {
  return prisma.goal.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { metrics: true } } },
  })
}

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  ACTIVE:   { label: 'Ativa',      bg: '#EFF6FF', color: '#3B82F6' },
  ACHIEVED: { label: 'Alcançada',  bg: '#F0FDF4', color: '#22C55E' },
  MISSED:   { label: 'Perdida',    bg: '#FEF2F2', color: '#EF4444' },
  DRAFT:    { label: 'Rascunho',   bg: '#F9FAFB', color: '#6B7280' },
}

export default async function GoalsPage() {
  const goals = await getGoals()
  return (
    <div>
      <Header title="Metas" subtitle={`${goals.length} metas cadastradas`} />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[minmax(200px,2fr)_90px_minmax(120px,1fr)_80px_80px_60px_60px_70px] px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div>Meta</div>
            <div>Status</div>
            <div>Progresso</div>
            <div className="text-right">Atual</div>
            <div className="text-right">Alvo</div>
            <div>Unidade</div>
            <div>Período</div>
            <div className="text-center">Métricas</div>
          </div>

          {goals.length === 0 && (
            <div className="py-16 text-center text-gray-400 text-sm">Nenhuma meta cadastrada.</div>
          )}

          {goals.map((goal, idx) => {
            const pct = goal.targetValue && goal.currentValue
              ? Math.min(100, (Number(goal.currentValue) / Number(goal.targetValue)) * 100)
              : 0
            const st = STATUS_STYLE[goal.status] ?? STATUS_STYLE.DRAFT
            return (
              <div
                key={goal.id}
                className={`grid grid-cols-[minmax(200px,2fr)_90px_minmax(120px,1fr)_80px_80px_60px_60px_70px] px-4 py-3 items-center border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/20'}`}
              >
                <div className="font-medium text-sm text-gray-900 truncate pr-2">{goal.title}</div>
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 pr-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#22C55E' : pct >= 60 ? '#3B82F6' : '#F59E0B' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 shrink-0 w-8 text-right">{pct.toFixed(0)}%</span>
                </div>
                <div className="text-xs text-gray-700 font-medium text-right">{Number(goal.currentValue ?? 0).toFixed(0)}</div>
                <div className="text-xs text-gray-500 text-right">{Number(goal.targetValue ?? 0).toFixed(0)}</div>
                <div className="text-xs text-gray-500">{goal.unit ?? '—'}</div>
                <div className="text-xs text-gray-500">{goal.period ?? '—'}</div>
                <div className="text-xs text-gray-500 text-center">{goal._count.metrics}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
