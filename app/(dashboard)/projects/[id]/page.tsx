import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/header'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PROJECT_STATUSES, TASK_STATUSES } from '@/lib/constants'
import Link from 'next/link'
import { ArrowLeft, Plus, Clock, CheckSquare, DollarSign, Users, Calendar } from 'lucide-react'

async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      solution: true,
      deal: true,
      contract: true,
      members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      tasks: {
        where: { parentId: null },
        orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
        include: { assignees: { include: { user: { select: { id: true, name: true } } } }, _count: { select: { subtasks: true } } },
        take: 100,
      },
      costs: { orderBy: { createdAt: 'desc' }, take: 20 },
      approvals: { orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { tasks: true, timeEntries: true, files: true } },
    },
  })
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getProject(id)
  if (!project) notFound()

  const status = PROJECT_STATUSES.find(s => s.key === project.status)
  const tasksBySection: Record<string, typeof project.tasks> = {}
  for (const task of project.tasks) {
    const sec = task.section ?? 'Geral'
    if (!tasksBySection[sec]) tasksBySection[sec] = []
    tasksBySection[sec].push(task)
  }

  const totalCosts = project.costs.reduce((s, c) => s + Number(c.actual ?? c.estimated ?? 0), 0)
  const margin = project.approvedBudget ? Number(project.approvedBudget) - totalCosts : null

  return (
    <div>
      <Header title={project.name} subtitle={project.client?.name ?? 'Projeto'} />
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={14} />Projetos
          </Link>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
                {project.solution && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: `${project.solution.color}20`, color: project.solution.color ?? undefined }}>
                    {project.solution.name}
                  </span>
                )}
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: `${status?.color}20`, color: status?.color ?? undefined }}>
                  {status?.label}
                </span>
              </div>
              <p className="text-gray-500 mt-1">{project.client?.name}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/tasks?projectId=${project.id}`} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                <Plus size={13} />Tarefa
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Orçamento Aprovado</p>
              <p className="font-bold text-gray-900">{formatCurrency(project.approvedBudget ? Number(project.approvedBudget) : null)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Custos Reais</p>
              <p className="font-bold text-gray-900">{formatCurrency(totalCosts)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Margem</p>
              <p className={`font-bold ${margin !== null && margin < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(margin)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Data do Evento</p>
              <p className="font-bold text-gray-900">{formatDate(project.eventDate)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Tasks */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Tarefas ({project._count.tasks})</h3>
              <Link href={`/api/tasks/new?projectId=${project.id}`} className="text-xs text-blue-600 hover:underline">+ Nova tarefa</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {Object.entries(tasksBySection).map(([section, tasks]) => (
                <div key={section}>
                  <div className="px-5 py-2 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{section}</p>
                  </div>
                  {tasks.map(task => {
                    const ts = TASK_STATUSES.find(s => s.key === task.status)
                    return (
                      <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ts?.color ?? '#9CA3AF' }} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
                          <p className="text-xs text-gray-500">
                            {task.dueDate ? formatDate(task.dueDate) : 'Sem prazo'}
                            {task._count.subtasks > 0 && ` • ${task._count.subtasks} subtarefas`}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${ts?.color}20`, color: ts?.color ?? undefined }}>{ts?.label}</span>
                      </div>
                    )
                  })}
                </div>
              ))}
              {project.tasks.length === 0 && (
                <p className="px-5 py-8 text-sm text-gray-500 text-center">Nenhuma tarefa. Crie a partir de um template.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Cronograma</p>
              <div className="space-y-2 text-sm">
                <TimelineRow label="Montagem" start={project.setupStartDate} end={project.setupEndDate} />
                <TimelineRow label="Operação" start={project.operationStartDate} end={project.operationEndDate} />
                <TimelineRow label="Desmontagem" start={project.teardownStartDate} end={project.teardownEndDate} />
              </div>
            </div>

            {/* Team */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Equipe ({project.members.length})</p>
              <div className="space-y-2">
                {project.members.map(m => (
                  <div key={m.user.id} className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
                      {m.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">{m.user.name}</p>
                      <p className="text-xs text-gray-500">{m.role}</p>
                    </div>
                  </div>
                ))}
                {project.members.length === 0 && <p className="text-xs text-gray-500">Nenhum membro.</p>}
              </div>
            </div>

            {/* Costs */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Custos</p>
              <div className="space-y-1.5">
                {project.costs.slice(0, 5).map(cost => (
                  <div key={cost.id} className="flex justify-between text-xs">
                    <span className="text-gray-600 truncate">{cost.description}</span>
                    <span className="text-gray-900 font-medium ml-2 shrink-0">{formatCurrency(Number(cost.actual ?? cost.estimated ?? 0))}</span>
                  </div>
                ))}
                {project.costs.length === 0 && <p className="text-xs text-gray-500">Nenhum custo.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineRow({ label, start, end }: { label: string; start: Date | null; end: Date | null }) {
  if (!start && !end) return null
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-gray-900 text-xs">{formatDate(start)} {end ? `— ${formatDate(end)}` : ''}</p>
    </div>
  )
}
