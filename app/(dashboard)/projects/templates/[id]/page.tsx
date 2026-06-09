'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckSquare, Plus, Trash2, X } from 'lucide-react'
import { Header } from '@/components/layout/header'

type TemplateTask = {
  id: string; name: string; section: string | null; isRequired: boolean; sortOrder: number; durationDays: number | null
}
type Template = {
  id: string; name: string; description: string | null; isDefault: boolean
  solution: { id: string; name: string; color: string | null } | null
  tasks: TemplateTask[]
}

export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [tpl, setTpl] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState({ name: '', section: 'Geral', isRequired: false })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/templates/${id}/tasks`)
      .then(r => r.json())
      .then(d => { setTpl(d.data); setLoading(false) })
  }, [id])

  async function addTask() {
    if (!newTask.name.trim()) return
    setAdding(true)
    const res = await fetch(`/api/projects/templates/${id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    })
    if (res.ok) {
      const { data } = await res.json()
      setTpl(p => p ? { ...p, tasks: [...p.tasks, data] } : p)
      setNewTask({ name: '', section: 'Geral', isRequired: false })
      setShowAdd(false)
    }
    setAdding(false)
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/projects/templates/${id}/tasks?taskId=${taskId}`, { method: 'DELETE' })
    setTpl(p => p ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p)
  }

  const tasksBySection: Record<string, TemplateTask[]> = {}
  for (const t of tpl?.tasks ?? []) {
    const sec = t.section ?? 'Geral'
    if (!tasksBySection[sec]) tasksBySection[sec] = []
    tasksBySection[sec].push(t)
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Carregando...</div>
  if (!tpl) return <div className="p-6 text-sm text-gray-500">Template não encontrado.</div>

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
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-gray-400" />
              <h3 className="font-semibold text-gray-900">{tpl.tasks.length} Tarefas do Template</h3>
            </div>
            <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium">
              <Plus size={13} />Nova tarefa
            </button>
          </div>

          {showAdd && (
            <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 space-y-2">
              <div className="flex gap-2 flex-wrap">
                <input
                  value={newTask.name} onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  placeholder="Nome da tarefa *" autoFocus
                  className="flex-1 min-w-40 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={newTask.section} onChange={e => setNewTask(p => ({ ...p, section: e.target.value }))}
                  placeholder="Seção"
                  className="w-36 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none"
                />
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" checked={newTask.isRequired} onChange={e => setNewTask(p => ({ ...p, isRequired: e.target.checked }))} className="rounded" />
                  Obrigatória
                </label>
                <button onClick={addTask} disabled={adding} className="bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {adding ? 'Adicionando...' : 'Adicionar'}
                </button>
                <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 px-1.5 py-1.5"><X size={14} /></button>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {tpl.tasks.length === 0 && !showAdd && (
              <p className="px-5 py-8 text-sm text-gray-500 text-center">Nenhuma tarefa. Clique em &quot;Nova tarefa&quot; para adicionar.</p>
            )}
            {Object.entries(tasksBySection).map(([section, sectionTasks]) => (
              <div key={section}>
                <div className="px-5 py-2 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{section}</p>
                </div>
                {sectionTasks.map((task, i) => (
                  <div key={task.id} className="flex items-center gap-4 px-5 py-3 group hover:bg-gray-50 transition-colors">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs flex items-center justify-center font-semibold shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{task.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.isRequired && (
                        <span className="text-xs bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-full">Obrigatória</span>
                      )}
                      {task.durationDays && (
                        <span className="text-xs text-gray-400">{task.durationDays}d</span>
                      )}
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Remover tarefa do template"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
