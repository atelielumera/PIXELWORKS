import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Plus } from 'lucide-react'

async function getPortfolios() {
  return prisma.portfolio.findMany({
    include: { projects: { include: { project: { select: { id: true, name: true, status: true, solution: { select: { name: true, color: true } } } } } }, _count: { select: { projects: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function PortfoliosPage() {
  const portfolios = await getPortfolios()
  return (
    <div>
      <Header title="Portfólios" subtitle="Consolidação de projetos" />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {portfolios.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    {p.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />}
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  </div>
                  {p.description && <p className="text-sm text-gray-500 mt-0.5">{p.description}</p>}
                </div>
                <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">{p._count.projects} projetos</span>
              </div>
              <div className="space-y-2">
                {p.projects.map(pp => (
                  <Link key={pp.projectId} href={`/projects/${pp.project.id}`} className="flex items-center justify-between py-1.5 hover:text-blue-600">
                    <span className="text-sm">{pp.project.name}</span>
                    {pp.project.solution && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${pp.project.solution.color}20`, color: pp.project.solution.color }}>
                        {pp.project.solution.name}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {portfolios.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">Nenhum portfólio criado ainda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
