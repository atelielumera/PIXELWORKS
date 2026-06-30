import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/header'
import Link from 'next/link'
import { ArrowLeft, CheckSquare, Plus } from 'lucide-react'

async function getTemplate(id: string) {
  try {
    return await prisma.projectTemplate.findUnique({
      where: { id },
      include: {
        solution: true,
        tasks: { orderBy: { sortOrder: 'asc' } },
      },
    })
  } catch {
    return null
  }
}

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tpl = await getTemplate(id)
  if (!tpl) notFound()

  return (
    <div>
      <Header title={tpl.name} subtitle={tpl.solution?.name ?? 'Template de Projeto'} />
      <div className="p-6 max-w-3xl space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/projects/templates" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={14} />Templates
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{tpl.name}</h2>
              {tpl.solution && (
                <span className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block font-medium"
                  style={{ backgroundColor: `${tpl.solution.color}20`, color: tpl.solution.color ?? undefined }}>
                  {tpl.solution.name}
                </span>
              )}
              {tpl.description && <p className="text-sm text-gray-500 mt-2">{tpl.description}</p>}
            </div>
            {tpl.isDefault && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Padrão</span>
            )}
          </div>

          <div className="flex gap-3 mt-5">
            <Link
              href={`/projects/new?templateId=${tpl.id}${tpl.solution ? `&solutionId=${tpl.solution.id}` : ''}`}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={15} />Criar Projeto com este Template
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <CheckSquare size={16} className="text-gray-400" />
            <h3 className="font-semibold text-gray-900">{tpl.tasks.length} Tarefas do Template</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {tpl.tasks.length === 0 && (
              <p className="px-5 py-8 text-sm text-gray-500 text-center">Nenhuma tarefa neste template.</p>
            )}
            {tpl.tasks.map((task, i) => (
              <div key={task.id} className="flex items-center gap-4 px-5 py-3">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs flex items-center justify-center font-semibold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{task.name}</p>
                  {task.section && (
                    <p className="text-xs text-gray-400">{task.section}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {task.isRequired && (
                    <span className="text-xs bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-full">Obrigatória</span>
                  )}
                  {task.durationDays && (
                    <span className="text-xs text-gray-400">{task.durationDays}d</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
