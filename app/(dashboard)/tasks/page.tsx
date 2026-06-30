export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { TASK_STATUSES } from '@/lib/constants'
import Link from 'next/link'
import { Plus } from 'lucide-react'

async function getTasks(status?: string, projectId?: string) {
  try { return await prisma.task.findMany({
    where: {
      parentId: null,
      ...(status ? { status: status as any } : {}),
      ...(projectId ? { projectId } : {}),
    },
    orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    include: {
      project: { select: { id: true, name: true } },
      assignees: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { subtasks: true } },
    },
    take: 200,
  }) } catch { return [] }
}

const PRIORITY_STYLE: Record<string, string> = {
  LOW: 'text-gray-500', MEDIUM: 'text-blue-500', HIGH: 'text-orange-500', URGENT: 'text-red-600'
}
const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente'
}

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ status?: string; projectId?: string }> }) {
  const { status, projectId } = await searchParams
  const tasks = await getTasks(status, projectId)
  const now = new Date()

  return (
    <div>
      <Header title="Tarefas" subtitle={`${tasks.length} tarefas`} />
      <div className="p-6">
        <div className="flex gap-2 mb-5 flex-wrap">
          <Link href="/tasks" className={`px-3 py-1.5 text-xs rounded-full border ${ !status ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600' }`}>Todas</Link>
          {TASK_STATUSES.map(s => (
            <Link key={s.key} href={`/tasks?status=${s.key}`}
              className={`px-3 py-1.5 text-xs rounded-full border ${ status === s.key ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600' }`}>{s.label}</Link>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tarefa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Projeto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Prioridade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prazo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tasks.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">Nenhuma tarefa encontrada.</td></tr>
              )}
              {tasks.map(task => {
                const ts = TASK_STATUSES.find(s => s.key === task.status)
                const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'DONE' && task.status !== 'CANCELLED'
                return (
                  <tr key={task.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ts?.color }} />
                        <div>
                          {task.project ? (
                            <Link href={`/projects/${task.project.id}?task=${task.id}`} className={`font-medium hover:text-blue-600 hover:underline ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</Link>
                          ) : (
                            <p className={`font-medium ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
                          )}
                          {task._count.subtasks > 0 && <p className="text-xs text-gray-500">{task._count.subtasks} subtarefas</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {task.project ? <Link href={`/projects/${task.project.id}`} className="hover:text-blue-600">{task.project.name}</Link> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${ts?.color}20`, color: ts?.color ?? undefined }}>{ts?.label}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs font-medium ${PRIORITY_STYLE[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {task.dueDate ? formatDate(task.dueDate) : '—'}
                      {isOverdue && ' ⚠️'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs">
                      {task.assignees.map(a => a.user.name).join(', ') || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
