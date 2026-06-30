export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

const CONTRACT_STATUS: Record<string, string> = {
  DRAFT: 'Rascunho', SENT: 'Enviado', SIGNED: 'Assinado',
  ACTIVE: 'Ativo', COMPLETED: 'Concluído', CANCELLED: 'Cancelado',
}

async function getRevenues() {
  const [wonDeals, contracts] = await Promise.all([
    prisma.deal.findMany({
      where: { status: 'WON' },
      orderBy: { closedAt: 'desc' },
      include: {
        client: { select: { id: true, name: true } },
        solution: { select: { name: true, color: true } },
      },
      take: 100,
    }),
    prisma.contract.findMany({
      where: { status: { in: ['SIGNED', 'ACTIVE', 'COMPLETED'] } },
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { id: true, name: true } } },
      take: 100,
    }),
  ])
  return { wonDeals, contracts }
}

export default async function RevenuesPage() {
  const { wonDeals, contracts } = await getRevenues()
  const totalDeals = wonDeals.reduce((s, d) => s + Number(d.value ?? 0), 0)
  const totalContracts = contracts.reduce((s, c) => s + Number(c.value ?? 0), 0)

  return (
    <div>
      <Header title="Receitas" subtitle={`Deals: ${formatCurrency(totalDeals)} | Contratos: ${formatCurrency(totalContracts)}`} />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Deals Ganhos', value: formatCurrency(totalDeals), sub: `${wonDeals.length} deals` },
            { label: 'Receita em Contratos', value: formatCurrency(totalContracts), sub: `${contracts.length} contratos` },
            { label: 'Receita Total', value: formatCurrency(totalDeals + totalContracts), sub: 'combinado' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{c.label}</p>
              <p className="text-xl font-bold text-green-600 mt-1">{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Deals Fechados (Ganhos)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Deal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Solução</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Fechado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {wonDeals.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Nenhum deal ganho ainda.</td></tr>
                )}
                {wonDeals.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/crm/deals/${d.id}`} className="font-medium text-gray-900 hover:text-blue-600">{d.title}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{d.client?.name ?? '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {d.solution ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${d.solution.color}20`, color: d.solution.color ?? undefined }}>
                          {d.solution.name}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      {formatCurrency(d.value ? Number(d.value) : null)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{formatDate(d.closedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Contratos Ativos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Contrato</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Cliente</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Início</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contracts.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Nenhum contrato ativo.</td></tr>
                )}
                {contracts.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.title}</p>
                      <p className="text-xs text-gray-500">{c.number}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.client?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      {c.value ? formatCurrency(Number(c.value)) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {CONTRACT_STATUS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{formatDate(c.startDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
