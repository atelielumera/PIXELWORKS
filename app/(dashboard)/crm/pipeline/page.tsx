import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { PIPELINE_STAGES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Plus } from 'lucide-react'

async function getLeadsByStage() {
  try {
    const leads = await prisma.lead.findMany({
      where: { status: { notIn: ['WON', 'LOST', 'NO_FIT'] } },
      include: { solution: true },
      orderBy: { createdAt: 'desc' },
    })
    const byStage: Record<string, typeof leads> = {}
    for (const stage of PIPELINE_STAGES) byStage[stage.key] = []
    for (const lead of leads) {
      if (byStage[lead.status]) byStage[lead.status].push(lead)
    }
    return byStage
  } catch {
    const byStage: Record<string, never[]> = {}
    for (const stage of PIPELINE_STAGES) byStage[stage.key] = []
    return byStage
  }
}

export default async function PipelinePage() {
  const byStage = await getLeadsByStage()
  const activeStages = PIPELINE_STAGES.filter(s => !['WON', 'LOST', 'NO_FIT'].includes(s.key))

  return (
    <div className="h-screen flex flex-col">
      <Header title="Pipeline Comercial" subtitle="Arraste leads entre as etapas" />
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 min-w-max h-full">
          {activeStages.map(stage => {
            const stageLeads = byStage[stage.key] ?? []
            const total = stageLeads.reduce((sum, l) => sum + Number(l.budget ?? 0), 0)
            return (
              <div key={stage.key} className="w-64 flex flex-col bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-3 py-3 border-b border-gray-200" style={{ borderTopWidth: 3, borderTopColor: stage.color, borderTopStyle: 'solid' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">{stage.label}</span>
                    <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-full px-2 py-0.5">{stageLeads.length}</span>
                  </div>
                  {total > 0 && <p className="text-xs text-gray-500 mt-1">{formatCurrency(total)}</p>}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {stageLeads.map(lead => (
                    <Link key={lead.id} href={`/crm/leads/${lead.id}`}
                      className="block bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all">
                      <p className="text-xs font-semibold text-gray-900">{lead.contactName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{lead.company ?? '—'}</p>
                      {lead.solution && (
                        <span className="inline-block mt-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${lead.solution.color}20`, color: lead.solution.color ?? undefined }}>
                          {lead.solution.name}
                        </span>
                      )}
                      {lead.budget && (
                        <p className="text-xs font-medium text-gray-700 mt-1.5">{formatCurrency(Number(lead.budget))}</p>
                      )}
                    </Link>
                  ))}
                  <Link href="/crm/leads/new"
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 px-2 py-1.5 border border-dashed border-gray-200 rounded-lg hover:border-blue-300 transition-colors w-full">
                    <Plus size={12} />Adicionar
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
