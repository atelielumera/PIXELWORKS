import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PROJECT_STATUSES } from '@/lib/constants'
import Link from 'next/link'
import { Plus, AlertTriangle } from 'lucide-react'

async function getProjects(status?: string, health?: string) {
  return prisma.project.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(health ? { health: health as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true } },
      solution: true,
      _count: { select: { tasks: true, members: true } },
    },
    take: 100,
  })
}

const HEALTH_STYLE: Record<string, string> = {
  GOOD: 'text-green-600',
  AT_RISK: 'text-yellow-600',
  CRITICAL: 'text-red-600',
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string; health?: string }> }) {
  const { status, health } = await searchParams
  const projects = await getProjects(status, health)

  return (
    <div>
      <Header title="Projetos" subtitle={`${projects.length} projetos`} />
      <div className="p-6">
        <div className="flex gap-2 mb-5 flex-wrap">
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

        <div className="flex gap-3 mb-5">
          <Link href="/projects/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} />Novo Projeto
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">Nenhum projeto encontrado.</p>
              <Link href="/projects/new" className="mt-3 inline-block text-blue-600 text-sm hover:underline">Criar primeiro projeto</Link>
            </div>
          )}
          {projects.map(project => {
            const status = PROJECT_STATUSES.find(s => s.key === project.status)
            return (
              <Link key={project.id} href={`/projects/${project.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{project.client?.name ?? 'Sem cliente'}</p>
                  </div>
                  {project.health !== 'GOOD' && (
                    <AlertTriangle size={16} className={HEALTH_STYLE[project.health]} />
                  )}
                </div>
                {project.solution && (
                  <span className="text-xs px-2 py-0.5 rounded-full mb-3 inline-block"
                    style={{ backgroundColor: `${project.solution.color}20`, color: project.solution.color ?? undefined }}>
                    {project.solution.name}
                  </span>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${status?.color}20`, color: status?.color ?? undefined }}>
                    {status?.label}
                  </span>
                  <span className="text-xs text-gray-500">{project._count.tasks} tarefas</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                  <span>{project.eventDate ? `Evento: ${formatDate(project.eventDate)}` : 'Sem data'}</span>
                  <span>{formatCurrency(project.approvedBudget ? Number(project.approvedBudget) : null)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
