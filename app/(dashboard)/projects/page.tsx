import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PROJECT_STATUSES } from '@/lib/constants'
import Link from 'next/link'
import { Plus, AlertTriangle, Circle } from 'lucide-react'

async function getProjects(status?: string) {
  return prisma.project.findMany({
    where: status ? { status: status as any } : {},
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true } },
      solution: true,
      members: { include: { user: { select: { name: true } } }, take: 3 },
      _count: { select: { tasks: true, members: true } },
    },
    take: 100,
  })
}

const HEALTH_LABEL: Record<string, string> = {
  GOOD: '',
  AT_RISK: 'Em Risco',
  CRITICAL: 'Crítico',
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const projects = await getProjects(status)

  return (
    <div>
      <Header title="Projetos" subtitle={`${projects.length} projetos`} />
      <div className="p-6">
        {/* Filtros de status */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex gap-1.5 flex-wrap">
            <Link href="/projects" className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              !status ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>Todos</Link>
            {PROJECT_STATUSES.map(s => (
              <Link key={s.key} href={`/projects?status=${s.key}`}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  status === s.key ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >{s.label}</Link>
            ))}
          </div>
          <Link href="/projects/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0">
            <Plus size={15} />Novo Projeto
          </Link>
        </div>

        {/* Lista estilo Asana */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[minmax(220px,2fr)_minmax(120px,1fr)_minmax(140px,1fr)_100px_80px_110px_100px] gap-0 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div>Nome do Projeto</div>
            <div>Cliente</div>
            <div>Solução</div>
            <div>Status</div>
            <div className="text-center">Tarefas</div>
            <div>Data do Evento</div>
            <div>Orçamento</div>
          </div>

          {projects.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-gray-500 text-sm">Nenhum projeto encontrado.</p>
              <Link href="/projects/new" className="mt-3 inline-block text-blue-600 text-sm hover:underline">Criar primeiro projeto</Link>
            </div>
          )}

          {projects.map((project, idx) => {
            const st = PROJECT_STATUSES.find(s => s.key === project.status)
            const isAtRisk = project.health !== 'GOOD'
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={`grid grid-cols-[minmax(220px,2fr)_minmax(120px,1fr)_minmax(140px,1fr)_100px_80px_110px_100px] gap-0 px-4 py-3 items-center hover:bg-blue-50/40 transition-colors border-b border-gray-100 last:border-0 group ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
              >
                {/* Nome */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: project.solution?.color ?? '#9CA3AF' }}
                  />
                  <span className="font-medium text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </span>
                  {isAtRisk && (
                    <AlertTriangle size={13} className="shrink-0 text-red-500" />
                  )}
                </div>

                {/* Cliente */}
                <div className="text-sm text-gray-500 truncate">
                  {project.client?.name ?? <span className="text-gray-300">—</span>}
                </div>

                {/* Solução */}
                <div>
                  {project.solution ? (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium truncate inline-block max-w-[130px]"
                      style={{ backgroundColor: `${project.solution.color}20`, color: project.solution.color ?? undefined }}
                    >
                      {project.solution.name}
                    </span>
                  ) : <span className="text-gray-300 text-sm">—</span>}
                </div>

                {/* Status */}
                <div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                    style={{ backgroundColor: `${st?.color}18`, color: st?.color ?? undefined }}
                  >
                    {st?.label}
                  </span>
                </div>

                {/* Tarefas */}
                <div className="text-center">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {project._count.tasks}
                  </span>
                </div>

                {/* Data do Evento */}
                <div className="text-xs text-gray-500">
                  {project.eventDate ? formatDate(project.eventDate) : <span className="text-gray-300">—</span>}
                </div>

                {/* Orçamento */}
                <div className="text-xs text-gray-500">
                  {project.approvedBudget ? formatCurrency(Number(project.approvedBudget)) : <span className="text-gray-300">—</span>}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
