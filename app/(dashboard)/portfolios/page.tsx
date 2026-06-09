import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

async function getPortfolios() {
  return prisma.portfolio.findMany({
    include: {
      projects: {
        include: {
          project: {
            select: { id: true, name: true, status: true, solution: { select: { name: true, color: true } } },
          },
        },
      },
      _count: { select: { projects: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  IN_PROGRESS: { label: 'Em Andamento', color: '#10B981' },
  PLANNING:    { label: 'Planejamento', color: '#3B82F6' },
  COMPLETED:   { label: 'Concluído',    color: '#22C55E' },
  ON_HOLD:     { label: 'Em Pausa',     color: '#F59E0B' },
  AT_RISK:     { label: 'Em Risco',     color: '#EF4444' },
  DRAFT:       { label: 'Rascunho',     color: '#9CA3AF' },
  CANCELLED:   { label: 'Cancelado',    color: '#6B7280' },
}

export default async function PortfoliosPage() {
  const portfolios = await getPortfolios()
  return (
    <div>
      <Header title="Portfólios" subtitle={`${portfolios.length} portfólios`} />
      <div className="p-6 space-y-5">
        {portfolios.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400 text-sm">
            Nenhum portfólio criado ainda.
          </div>
        )}

        {portfolios.map(portfolio => (
          <div key={portfolio.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Cabeçalho do portfólio */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
              {portfolio.color && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: portfolio.color }} />}
              <h3 className="font-semibold text-gray-900 text-sm">{portfolio.name}</h3>
              {portfolio.description && <span className="text-xs text-gray-500">— {portfolio.description}</span>}
              <span className="ml-auto text-xs text-gray-400">{portfolio._count.projects} projetos</span>
            </div>

            {/* Cabeçalho de colunas */}
            {portfolio.projects.length > 0 && (
              <div className="grid grid-cols-[minmax(200px,2fr)_minmax(120px,1fr)_100px] px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <div>Projeto</div>
                <div>Solução</div>
                <div>Status</div>
              </div>
            )}

            {/* Linhas de projetos */}
            {portfolio.projects.map(pp => {
              const st = STATUS_STYLE[pp.project.status] ?? STATUS_STYLE.DRAFT
              return (
                <Link
                  key={pp.projectId}
                  href={`/projects/${pp.project.id}`}
                  className="grid grid-cols-[minmax(200px,2fr)_minmax(120px,1fr)_100px] px-5 py-2.5 items-center border-b border-gray-50 last:border-0 hover:bg-blue-50/30 transition-colors group"
                >
                  <span className="text-sm text-gray-800 group-hover:text-blue-600 truncate font-medium">{pp.project.name}</span>
                  {pp.project.solution ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium w-fit" style={{ backgroundColor: `${pp.project.solution.color}20`, color: pp.project.solution.color ?? undefined }}>
                      {pp.project.solution.name}
                    </span>
                  ) : <span className="text-gray-300 text-xs">—</span>}
                  <span className="text-xs font-medium" style={{ color: st.color }}>{st.label}</span>
                </Link>
              )
            })}

            {portfolio.projects.length === 0 && (
              <div className="px-5 py-6 text-xs text-gray-400 text-center">Nenhum projeto neste portfólio.</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
