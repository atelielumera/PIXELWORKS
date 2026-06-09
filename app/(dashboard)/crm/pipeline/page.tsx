import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { PIPELINE_STAGES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Plus } from 'lucide-react'

async function getData(responsibleId?: string) {
  const where = responsibleId ? { responsibleId } : {}

  const [leads, deals, users] = await Promise.all([
    prisma.lead.findMany({
      where: { ...where, status: { notIn: ['WON', 'LOST', 'NO_FIT'] } },
      include: { solution: true, responsible: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.deal.findMany({
      where: { ...where, status: 'OPEN' },
      include: { solution: true, client: { select: { name: true } }, responsible: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const byStage: Record<string, typeof leads> = {}
  for (const stage of PIPELINE_STAGES) byStage[stage.key] = []
  for (const lead of leads) {
    if (byStage[lead.status]) byStage[lead.status].push(lead)
  }

  const byResponsible: Record<string, { name: string; deals: typeof deals }> = {}
  for (const deal of deals) {
    const key = deal.responsible?.name ?? 'Sem responsável'
    if (!byResponsible[key]) byResponsible[key] = { name: key, deals: [] }
    byResponsible[key].deals.push(deal)
  }

  return { byStage, byResponsible, users }
}

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ responsibleId?: string }> }) {
  const { responsibleId } = await searchParams
  const { byStage, byResponsible, users } = await getData(responsibleId)
  const activeStages = PIPELINE_STAGES.filter(s => !['WON', 'LOST', 'NO_FIT'].includes(s.key))

  const selectedUser = users.find(u => u.id === responsibleId)

  return (
    <div className="h-screen flex flex-col">
      <Header title="Pipeline Comercial" subtitle="Leads por etapa e propostas por responsável" />
      <div className="flex-1 overflow-y-auto">

        {/* Filtro por Vendedor */}
        <div className="px-6 pt-4 pb-2 border-b border-gray-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 mr-1">Vendedor:</span>
          <Link
            href="/crm/pipeline"
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${!responsibleId ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
          >
            Todos
          </Link>
          {users.map(u => (
            <Link
              key={u.id}
              href={`/crm/pipeline?responsibleId=${u.id}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${responsibleId === u.id ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${responsibleId === u.id ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'}`}>
                {u.name.charAt(0)}
              </span>
              {u.name}
            </Link>
          ))}
        </div>

        {/* Propostas em Negociação — por responsável (estilo Asana) */}
        {Object.keys(byResponsible).length > 0 && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Propostas em Negociação
              {selectedUser && <span className="ml-2 text-blue-600 font-normal">— {selectedUser.name}</span>}
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Object.entries(byResponsible).map(([respName, { deals }]) => {
                const total = deals.reduce((s, d) => s + Number(d.value ?? 0), 0)
                return (
                  <div key={respName} className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-3 py-3 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{respName.charAt(0)}</div>
                          <span className="text-xs font-semibold text-gray-700 truncate">{respName}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-full px-2 py-0.5 shrink-0">{deals.length}</span>
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
                          {deal.value && <p className="text-xs font-medium text-gray-700 mt-1">{formatCurrency(Number(deal.value))}</p>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {Object.keys(byResponsible).length === 0 && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Propostas em Negociação</h3>
            <p className="text-sm text-gray-400">Nenhuma proposta aberta{selectedUser ? ` para ${selectedUser.name}` : ''}.</p>
          </div>
        )}

        {/* Funil de Leads — por etapa */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Funil de Leads
            {selectedUser && <span className="ml-2 text-blue-600 font-normal">— {selectedUser.name}</span>}
          </h3>
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
                        {lead.budget && <p className="text-xs font-medium text-gray-700 mt-1.5">{formatCurrency(Number(lead.budget))}</p>}
                      </Link>
                    ))}
                    <Link href={`/crm/leads/new${responsibleId ? `?responsibleId=${responsibleId}` : ''}`}
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
