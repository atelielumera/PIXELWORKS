import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { PIPELINE_STAGES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Plus } from 'lucide-react'

async function getLeadsByStage() {
  const leads = await prisma.lead.findMany({
    where: { status: { notIn: ['WON', 'LOST', 'NO_FIT'] } },
    include: { solution: true, responsible: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  const byStage: Record<string, typeof leads> = {}
  for (const stage of PIPELINE_STAGES) byStage[stage.key] = []
  for (const lead of leads) {
    if (byStage[lead.status]) byStage[lead.status].push(lead)
  }
  return { byStage, leads }
}

async function getDealsByResponsible() {
  const deals = await prisma.deal.findMany({
    where: { status: 'OPEN' },
    include: {
      solution: true,
      client: { select: { name: true } },
      responsible: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  const byResponsible: Record<string, { name: string; deals: typeof deals }> = {}
  for (const deal of deals) {
    const key = deal.responsible?.name ?? 'Sem responsável'
    if (!byResponsible[key]) byResponsible[key] = { name: key, deals: [] }
    byResponsible[key].deals.push(deal)
  }
  return byResponsible
}

export default async function PipelinePage() {
  const { byStage } = await getLeadsByStage()
  const dealsByResponsible = await getDealsByResponsible()
  const activeStages = PIPELINE_STAGES.filter(s => !['WON', 'LOST', 'NO_FIT'].includes(s.key))

  return (
    <div className="h-screen flex flex-col">
      <Header title="Pipeline Comercial" subtitle="Leads por etapa e propostas por responsável" />
      <div className="flex-1 overflow-y-auto">

        {/* Propostas em Negociação — por responsável (estilo Asana) */}
        {Object.keys(dealsByResponsible).length > 0 && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Propostas em Negociação</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Object.entries(dealsByResponsible).map(([respName, { deals }]) => {
                const total = deals.reduce((s, d) => s + Number(d.value ?? 0), 0)
                return (
                  <div key={respName} className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-3 py-3 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{respName.charAt(0)}</div>
                          <span className="text-xs font-semibold text-gray-700">{respName}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-full px-2 py-0.5">{deals.length}</span>
                      </div>
                      {total > 0 && <p className="text-xs text-gray-500 mt-1 pl-8">{formatCurrency(total)}</p>}
                    </div>
                    <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
                      {deals.map(deal => (
                        <Link key={deal.id} href={`/crm/deals/${deal.id}`}
                          className="block bg-white rounded-lg border border-gray-200 p-2.5 hover:border-blue-300 hover:shadow-sm transition-all">
                          <p className="text-xs font-semibold text-gray-900">{deal.title}</p>
                          {deal.client && <p className="text-xs text-gray-500 mt-0.5">{deal.client.name}</p>}
                          {deal.solution && (
                            <span className="inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${deal.solution.color}20`, color: deal.solution.color ?? undefined }}>
                              {deal.solution.name}
                            </span>
                          )}
                          {deal.value && (
                            <p className="text-xs font-medium text-gray-700 mt-1">{formatCurrency(Number(deal.value))}</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Funil de Leads — por etapa */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Funil de Leads</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {activeStages.map(stage => {
              const stageLeads = byStage[stage.key] ?? []
              const total = stageLeads.reduce((sum, l) => sum + Number(l.budget ?? 0), 0)
              return (
                <div key={stage.key} className="w-64 shrink-0 flex flex-col bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-3 py-3 border-b border-gray-200" style={{ borderTopWidth: 3, borderTopColor: stage.color, borderTopStyle: 'solid' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">{stage.label}</span>
                      <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-full px-2 py-0.5">{stageLeads.length}</span>
                    </div>
                    {total > 0 && <p className="text-xs text-gray-500 mt-1">{formatCurrency(total)}</p>}
                  </div>
                  <div className="overflow-y-auto p-2 space-y-2 max-h-80">
                    {stageLeads.map(lead => (
                      <Link key={lead.id} href={`/crm/leads/${lead.id}`}
                        className="block bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all">
                        <p className="text-xs font-semibold text-gray-900">{lead.contactName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{lead.company ?? '—'}</p>
                        {lead.responsible && <p className="text-xs text-gray-400 mt-0.5">{lead.responsible.name}</p>}
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
    </div>
  )
}
