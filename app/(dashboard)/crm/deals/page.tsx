import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Plus } from 'lucide-react'

async function getDeals() {
  return prisma.deal.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true } },
      solution: true,
      responsible: { select: { name: true } },
    },
    take: 100,
  })
}

const STATUS_STYLE: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700',
  WON: 'bg-green-50 text-green-700',
  LOST: 'bg-red-50 text-red-700',
}

export default async function DealsPage() {
  const deals = await getDeals()
  const totalValue = deals.filter(d => d.status === 'OPEN').reduce((s, d) => s + Number(d.value ?? 0), 0)
  const wonValue = deals.filter(d => d.status === 'WON').reduce((s, d) => s + Number(d.value ?? 0), 0)

  return (
    <div>
      <Header title="Deals" subtitle={`Pipeline: ${formatCurrency(totalValue)} | Ganho: ${formatCurrency(wonValue)}`} />
      <div className="p-6">
        <div className="flex gap-3 mb-5">
          <Link href="/crm/deals/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} />Novo Deal
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Título</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Solução</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Responsável</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Previsão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {deals.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500 text-sm">Nenhum deal encontrado.</td></tr>
              )}
              {deals.map(deal => (
                <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/crm/deals/${deal.id}`} className="font-medium text-gray-900 hover:text-blue-600">{deal.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{deal.client?.name ?? '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {deal.solution ? (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${deal.solution.color}20`, color: deal.solution.color }}>{deal.solution.name}</span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(deal.value ? Number(deal.value) : null)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[deal.status]}`}>
                      {deal.status === 'OPEN' ? 'Aberto' : deal.status === 'WON' ? 'Ganho' : 'Perdido'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs">{deal.responsible?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">{formatDate(deal.expectedCloseDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
