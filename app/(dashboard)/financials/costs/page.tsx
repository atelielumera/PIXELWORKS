import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

async function getCosts() {
  try {
    return await prisma.projectCost.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, name: true, solution: { select: { name: true, color: true } } } },
      },
      take: 200,
    })
  } catch {
    return []
  }
}

export default async function CostsPage() {
  const costs = await getCosts()
  const totalEstimated = costs.reduce((s, c) => s + Number(c.estimated ?? 0), 0)
  const totalActual = costs.reduce((s, c) => s + Number(c.actual ?? 0), 0)
  const variance = totalEstimated - totalActual

  return (
    <div>
      <Header title="Custos" subtitle={`Estimado: ${formatCurrency(totalEstimated)} | Real: ${formatCurrency(totalActual)}`} />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Custo Estimado</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalEstimated)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{costs.length} registros</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Custo Real</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalActual)}</p>
            <p className="text-xs text-gray-500 mt-0.5">lançado até hoje</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Variação</p>
            <p className={`text-xl font-bold mt-1 ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{variance >= 0 ? 'abaixo do estimado' : 'acima do estimado'}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Projeto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Categoria</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estimado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Real</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Fornecedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {costs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Nenhum custo registrado nos projetos.</td></tr>
              )}
              {costs.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.description}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {c.project ? (
                      <Link href={`/projects/${c.project.id}`} className="text-blue-600 hover:underline text-xs">
                        {c.project.name}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{c.category}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{c.estimated ? formatCurrency(Number(c.estimated)) : '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{c.actual ? formatCurrency(Number(c.actual)) : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">{c.supplier ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
