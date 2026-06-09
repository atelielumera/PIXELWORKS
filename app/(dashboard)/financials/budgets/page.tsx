import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho', SENT: 'Enviado', VIEWED: 'Visualizado',
  APPROVED: 'Aprovado', REJECTED: 'Recusado', EXPIRED: 'Expirado',
}
const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-50 text-blue-700',
  VIEWED: 'bg-purple-50 text-purple-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  EXPIRED: 'bg-orange-50 text-orange-700',
}

async function getBudgets() {
  return prisma.proposal.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, name: true } },
      solution: { select: { name: true, color: true } },
    },
    take: 100,
  })
}

export default async function BudgetsPage() {
  const proposals = await getBudgets()
  const totalApproved = proposals.filter(p => p.status === 'APPROVED').reduce((s, p) => s + Number(p.totalValue ?? 0), 0)
  const totalPending = proposals.filter(p => ['SENT', 'VIEWED'].includes(p.status)).reduce((s, p) => s + Number(p.totalValue ?? 0), 0)

  return (
    <div>
      <Header title="Orçamentos" subtitle={`Aprovados: ${formatCurrency(totalApproved)} | Aguardando: ${formatCurrency(totalPending)}`} />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total de Propostas', value: String(proposals.length), sub: 'cadastradas' },
            { label: 'Aprovados', value: formatCurrency(totalApproved), sub: `${proposals.filter(p => p.status === 'APPROVED').length} propostas` },
            { label: 'Aguardando Resposta', value: formatCurrency(totalPending), sub: `${proposals.filter(p => ['SENT', 'VIEWED'].includes(p.status)).length} propostas` },
            { label: 'Recusados', value: String(proposals.filter(p => p.status === 'REJECTED').length), sub: 'propostas' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{c.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Proposta</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Solução</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Validade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {proposals.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Nenhum orçamento encontrado.</td></tr>
              )}
              {proposals.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.number}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.client?.name ?? '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {p.solution ? (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${p.solution.color}20`, color: p.solution.color ?? undefined }}>
                        {p.solution.name}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(p.totalValue ? Number(p.totalValue) : null)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{formatDate(p.validUntil)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
