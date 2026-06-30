import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PIPELINE_STAGES } from '@/lib/constants'
import Link from 'next/link'
import { Plus, Filter, Search } from 'lucide-react'

async function getLeads(status?: string) {
  try {
    return await prisma.lead.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        solution: true,
        responsible: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
      take: 100,
    })
  } catch {
    return []
  }
}

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-blue-50 text-blue-700',
  WAITING_RESPONSE: 'bg-yellow-50 text-yellow-700',
  QUALIFIED: 'bg-purple-50 text-purple-700',
  SEND_TO_TECHNICAL: 'bg-orange-50 text-orange-700',
  TECHNICAL_ANALYSIS: 'bg-orange-50 text-orange-700',
  PRICING: 'bg-red-50 text-red-700',
  PROPOSAL_DRAFTING: 'bg-teal-50 text-teal-700',
  PROPOSAL_SENT: 'bg-cyan-50 text-cyan-700',
  NEGOTIATION: 'bg-indigo-50 text-indigo-700',
  WON: 'bg-green-50 text-green-700',
  LOST: 'bg-red-100 text-red-800',
  NO_FIT: 'bg-gray-50 text-gray-600',
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const leads = await getLeads(status)

  return (
    <div>
      <Header title="Leads" subtitle={`${leads.length} leads encontrados`} />
      <div className="p-6">

        {/* Filter chips */}
        <div className="flex gap-2 mb-5 flex-wrap">
          <Link href="/crm/leads" className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
            !status ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}>Todos</Link>
          {PIPELINE_STAGES.filter(s => !['WON', 'LOST', 'NO_FIT'].includes(s.key)).map(s => (
            <Link key={s.key} href={`/crm/leads?status=${s.key}`}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                status === s.key ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >{s.label}</Link>
          ))}
        </div>

        <div className="flex gap-3 mb-5">
          <Link href="/crm/leads/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} />Novo Lead
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contato / Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Solução</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Orçamento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Responsável</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">Nenhum lead encontrado.</td></tr>
              )}
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/crm/leads/${lead.id}`} className="hover:text-blue-600">
                      <div className="font-medium text-gray-900">{lead.contactName}</div>
                      <div className="text-xs text-gray-500">{lead.company ?? '—'} • {lead.city ?? ''} {lead.state ?? ''}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {lead.solution ? (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${lead.solution.color}20`, color: lead.solution.color ?? undefined }}>
                        {lead.solution.name}
                      </span>
                    ) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700 hidden lg:table-cell">{formatCurrency(lead.budget ? Number(lead.budget) : null)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[lead.status] ?? 'bg-gray-50 text-gray-600'}`}>
                      {PIPELINE_STAGES.find(s => s.key === lead.status)?.label ?? lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs">{lead.responsible?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">{formatDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
