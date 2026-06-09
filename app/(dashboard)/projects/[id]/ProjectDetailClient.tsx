'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Pencil, Trash2, X, CheckCircle2, Circle, UserPlus
} from 'lucide-react'
import { PROJECT_STATUSES, TASK_STATUSES } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'

type User = { id: string; name: string; email: string; role: string }
type TaskAssignee = { userId: string; user: { id: string; name: string } }
type Task = {
  id: string; title: string; status: string; priority: string
  section: string | null; dueDate: string | null
  assignees: TaskAssignee[]; _count: { subtasks: number }
}
type ProjectMember = { userId: string; role: string; user: { id: string; name: string; avatar: string | null } }
type Cost = { id: string; category: string; description: string; estimated: string | null; actual: string | null; supplier: string | null }
type Project = {
  id: string; name: string; status: string; scope: string | null
  eventLocation: string | null; eventDate: string | null
  setupStartDate: string | null; setupEndDate: string | null
  operationStartDate: string | null; operationEndDate: string | null
  teardownStartDate: string | null; teardownEndDate: string | null
  approvedBudget: string | null
  client: { id: string; name: string } | null
  solution: { id: string; name: string; color: string | null } | null
  members: ProjectMember[]; tasks: Task[]; costs: Cost[]
  _count: { tasks: number }
}

const COST_CATS = ['Equipamentos', 'Logística', 'Mão de Obra', 'Fornecedor', 'Conteúdo', 'Outros']

export default function ProjectDetailClient({ project: init, users }: { project: Project; users: User[] }) {
  const [project, setProject] = useState(init)
  const [tasks, setTasks] = useState<Task[]>(init.tasks)
  const [costs, setCosts] = useState<Cost[]>(init.costs)
  const [members, setMembers] = useState<ProjectMember[]>(init.members)

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [addingSection, setAddingSection] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const [showEditProject, setShowEditProject] = useState(false)
  const [showAddCost, setShowAddCost] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  const [editForm, setEditForm] = useState({
    name: project.name, status: project.status,
    approvedBudget: project.approvedBudget ?? '',
    eventDate: project.eventDate ? project.eventDate.substring(0, 10) : '',
    eventLocation: project.eventLocation ?? '',
    scope: project.scope ?? '',
    setupStartDate: project.setupStartDate ? project.setupStartDate.substring(0, 10) : '',
    setupEndDate: project.setupEndDate ? project.setupEndDate.substring(0, 10) : '',
    operationStartDate: project.operationStartDate ? project.operationStartDate.substring(0, 10) : '',
    operationEndDate: project.operationEndDate ? project.operationEndDate.substring(0, 10) : '',
    teardownStartDate: project.teardownStartDate ? project.teardownStartDate.substring(0, 10) : '',
    teardownEndDate: project.teardownEndDate ? project.teardownEndDate.substring(0, 10) : '',
  })

  const [costForm, setCostForm] = useState({ category: 'Equipamentos', description: '', estimated: '', actual: '', supplier: '' })

  const sections = tasks.length === 0 ? ['Geral'] : Array.from(new Set(tasks.map(t => t.section ?? 'Geral')))
  const tasksBySection: Record<string, Task[]> = {}
  for (const s of sections) tasksBySection[s] = tasks.filter(t => (t.section ?? 'Geral') === s)

  const totalCosts = costs.reduce((s, c) => s + Number(c.actual ?? c.estimated ?? 0), 0)
  const margin = project.approvedBudget ? Number(project.approvedBudget) - totalCosts : null
  const statusInfo = PROJECT_STATUSES.find(s => s.key === project.status)

  async function toggleTask(task: Task) {
    const next = task.status === 'DONE' ? 'TODO' : task.status === 'IN_PROGRESS' ? 'DONE' : 'IN_PROGRESS'
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
    await fetch(`/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
  }

  async function deleteTask(taskId: string) {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
  }

  async function saveEditTask(taskId: string) {
    if (!editingTitle.trim()) { setEditingTaskId(null); return }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, title: editingTitle } : t))
    setEditingTaskId(null)
    await fetch(`/api/tasks/${taskId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: editingTitle }) })
  }

  async function addTask(section: string) {
    if (!newTaskTitle.trim()) { setAddingSection(null); setNewTaskTitle(''); return }
    const title = newTaskTitle
    setNewTaskTitle(''); setAddingSection(null)
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: project.id, title, section: section === 'Geral' ? null : section, status: 'TODO', priority: 'MEDIUM' }) })
    if (res.ok) { const data = await res.json(); setTasks(prev => [...prev, { ...data, assignees: [], _count: { subtasks: 0 } }]) }
  }

  async function saveProject() {
    const res = await fetch(`/api/projects/${project.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editForm, approvedBudget: editForm.approvedBudget || null, eventDate: editForm.eventDate || null, eventLocation: editForm.eventLocation || null, scope: editForm.scope || null, setupStartDate: editForm.setupStartDate || null, setupEndDate: editForm.setupEndDate || null, operationStartDate: editForm.operationStartDate || null, operationEndDate: editForm.operationEndDate || null, teardownStartDate: editForm.teardownStartDate || null, teardownEndDate: editForm.teardownEndDate || null }) })
    if (res.ok) { setProject(prev => ({ ...prev, ...editForm })); setShowEditProject(false) }
  }

  async function addCost() {
    if (!costForm.description) return
    const res = await fetch(`/api/projects/${project.id}/costs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(costForm) })
    if (res.ok) { const data = await res.json(); setCosts(prev => [data.data, ...prev]); setCostForm({ category: 'Equipamentos', description: '', estimated: '', actual: '', supplier: '' }); setShowAddCost(false) }
  }

  async function deleteCost(costId: string) {
    setCosts(prev => prev.filter(c => c.id !== costId))
    await fetch(`/api/projects/${project.id}/costs?costId=${costId}`, { method: 'DELETE' })
  }

  async function addMember(userId: string) {
    const user = users.find(u => u.id === userId)
    if (!user) return
    setMembers(prev => [...prev, { userId, role: 'member', user: { id: user.id, name: user.name, avatar: null } }])
    setShowAddMember(false)
    await fetch(`/api/projects/${project.id}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role: 'member' }) })
  }

  async function removeMember(userId: string) {
    setMembers(prev => prev.filter(m => m.userId !== userId))
    await fetch(`/api/projects/${project.id}/members?userId=${userId}`, { method: 'DELETE' })
  }

  return (
    <div className="p-6 space-y-5">
      <Link href="/projects" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 w-fit">
        <ArrowLeft size={14} />Projetos
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
              {project.solution && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: `${project.solution.color}20`, color: project.solution.color ?? undefined }}>{project.solution.name}</span>
              )}
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: `${statusInfo?.color}20`, color: statusInfo?.color ?? undefined }}>{statusInfo?.label}</span>
            </div>
            <p className="text-gray-500 mt-1 text-sm">{project.client?.name}</p>
            {project.eventLocation && <p className="text-xs text-gray-400 mt-0.5">📍 {project.eventLocation}</p>}
          </div>
          <button onClick={() => setShowEditProject(true)} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            <Pencil size={13} />Editar Projeto
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div><p className="text-xs text-gray-500">Orçamento Aprovado</p><p className="font-bold text-gray-900">{formatCurrency(project.approvedBudget ? Number(project.approvedBudget) : null)}</p></div>
          <div><p className="text-xs text-gray-500">Custos Reais</p><p className="font-bold text-gray-900">{formatCurrency(totalCosts)}</p></div>
          <div><p className="text-xs text-gray-500">Margem</p><p className={`font-bold ${margin !== null && margin < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(margin)}</p></div>
          <div><p className="text-xs text-gray-500">Data do Evento</p><p className="font-bold text-gray-900">{project.eventDate ? formatDate(project.eventDate) : '—'}</p></div>
        </div>
        {project.scope && <p className="text-sm text-gray-600 mt-3 border-t border-gray-100 pt-3 whitespace-pre-line">{project.scope}</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Tasks */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Tarefas ({tasks.length})</h3>
            <button onClick={() => { setAddingSection('Geral'); setNewTaskTitle('') }} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <Plus size={13} />Nova tarefa
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {sections.map(section => (
              <div key={section}>
                <div className="px-5 py-2 bg-gray-50 flex items-center justify-between group/sec">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{section}</span>
                  <button onClick={() => { setAddingSection(section); setNewTaskTitle('') }} className="text-gray-400 hover:text-blue-600 opacity-0 group-hover/sec:opacity-100 transition-opacity">
                    <Plus size={14} />
                  </button>
                </div>
                {tasksBySection[section]?.map(task => {
                  const ts = TASK_STATUSES.find(s => s.key === task.status)
                  const isEditing = editingTaskId === task.id
                  return (
                    <div key={task.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors group/task">
                      <button onClick={() => toggleTask(task)} className="shrink-0 mt-0.5">
                        {task.status === 'DONE' ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} className="text-gray-300 hover:text-green-400 transition-colors" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input autoFocus value={editingTitle} onChange={e => setEditingTitle(e.target.value)}
                            onBlur={() => saveEditTask(task.id)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEditTask(task.id); if (e.key === 'Escape') setEditingTaskId(null) }}
                            className="w-full text-sm border-b border-blue-400 focus:outline-none bg-transparent py-0.5" />
                        ) : (
                          <p onDoubleClick={() => { setEditingTaskId(task.id); setEditingTitle(task.title) }}
                            className={`text-sm cursor-text ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
                        )}
                        {(task.dueDate || task._count.subtasks > 0) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {task.dueDate ? formatDate(task.dueDate) : ''}{task.dueDate && task._count.subtasks > 0 ? ' · ' : ''}{task._count.subtasks > 0 ? `${task._count.subtasks} subtarefas` : ''}
                          </p>
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 hidden sm:block" style={{ backgroundColor: `${ts?.color}20`, color: ts?.color ?? undefined }}>{ts?.label}</span>
                      <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-all shrink-0"><Trash2 size={13} /></button>
                    </div>
                  )
                })}
                {addingSection === section && (
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50/30 border-l-2 border-blue-400">
                    <Circle size={16} className="text-gray-300 shrink-0" />
                    <input autoFocus value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addTask(section); if (e.key === 'Escape') { setAddingSection(null); setNewTaskTitle('') } }}
                      onBlur={() => { if (newTaskTitle.trim()) addTask(section); else { setAddingSection(null); setNewTaskTitle('') } }}
                      placeholder="Nome da tarefa... (Enter para salvar)"
                      className="flex-1 text-sm focus:outline-none bg-transparent" />
                    <button onClick={() => { setAddingSection(null); setNewTaskTitle('') }} className="text-gray-400 hover:text-gray-600 shrink-0"><X size={14} /></button>
                  </div>
                )}
              </div>
            ))}
            {tasks.length === 0 && addingSection !== 'Geral' && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-gray-500 mb-3">Nenhuma tarefa neste projeto.</p>
                <button onClick={() => { setAddingSection('Geral'); setNewTaskTitle('') }} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mx-auto">
                  <Plus size={14} />Criar primeira tarefa
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Cronograma</p>
            <div className="space-y-2">
              {project.setupStartDate && <div><p className="text-xs text-gray-400">Montagem</p><p className="text-xs text-gray-900">{formatDate(project.setupStartDate)}{project.setupEndDate ? ` — ${formatDate(project.setupEndDate)}` : ''}</p></div>}
              {project.operationStartDate && <div><p className="text-xs text-gray-400">Operação</p><p className="text-xs text-gray-900">{formatDate(project.operationStartDate)}{project.operationEndDate ? ` — ${formatDate(project.operationEndDate)}` : ''}</p></div>}
              {project.teardownStartDate && <div><p className="text-xs text-gray-400">Desmontagem</p><p className="text-xs text-gray-900">{formatDate(project.teardownStartDate)}{project.teardownEndDate ? ` — ${formatDate(project.teardownEndDate)}` : ''}</p></div>}
              {!project.setupStartDate && !project.operationStartDate && !project.teardownStartDate && <p className="text-xs text-gray-400">Sem datas. Clique em "Editar Projeto".</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Equipe ({members.length})</p>
              <button onClick={() => setShowAddMember(true)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"><UserPlus size={12} />Adicionar</button>
            </div>
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.userId} className="flex items-center gap-2 group/m">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">{m.user.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-900 truncate">{m.user.name}</p><p className="text-xs text-gray-400">{m.role}</p></div>
                  <button onClick={() => removeMember(m.userId)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover/m:opacity-100 transition-all"><X size={12} /></button>
                </div>
              ))}
              {members.length === 0 && <p className="text-xs text-gray-400">Nenhum membro adicionado.</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Custos ({costs.length})</p>
              <button onClick={() => setShowAddCost(true)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"><Plus size={12} />Adicionar</button>
            </div>
            <div className="space-y-2">
              {costs.slice(0, 10).map(cost => (
                <div key={cost.id} className="flex justify-between items-start text-xs group/cost">
                  <div className="min-w-0 flex-1"><p className="text-gray-700 truncate">{cost.description}</p><p className="text-gray-400">{cost.category}</p></div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <span className="text-gray-900 font-medium">{formatCurrency(Number(cost.actual ?? cost.estimated ?? 0))}</span>
                    <button onClick={() => deleteCost(cost.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover/cost:opacity-100 transition-all"><X size={11} /></button>
                  </div>
                </div>
              ))}
              {costs.length === 0 && <p className="text-xs text-gray-400">Nenhum custo registrado.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      {showEditProject && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Editar Projeto</h3>
              <button onClick={() => setShowEditProject(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Projeto *</label>
                  <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PROJECT_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Orçamento Aprovado (R$)</label>
                  <input type="number" value={editForm.approvedBudget} onChange={e => setEditForm(f => ({ ...f, approvedBudget: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Data do Evento</label>
                  <input type="date" value={editForm.eventDate} onChange={e => setEditForm(f => ({ ...f, eventDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Local do Evento</label>
                  <input value={editForm.eventLocation} onChange={e => setEditForm(f => ({ ...f, eventLocation: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Cronograma</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'setupStartDate', label: 'Montagem Início' }, { key: 'setupEndDate', label: 'Montagem Fim' },
                    { key: 'operationStartDate', label: 'Operação Início' }, { key: 'operationEndDate', label: 'Operação Fim' },
                    { key: 'teardownStartDate', label: 'Desmontagem Início' }, { key: 'teardownEndDate', label: 'Desmontagem Fim' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                      <input type="date" value={(editForm as any)[f.key]} onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Escopo / Descrição</label>
                <textarea value={editForm.scope} onChange={e => setEditForm(f => ({ ...f, scope: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveProject} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">Salvar alterações</button>
                <button onClick={() => setShowEditProject(false)} className="border border-gray-300 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Cost Modal */}
      {showAddCost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Adicionar Custo</h3>
              <button onClick={() => setShowAddCost(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
                <select value={costForm.category} onChange={e => setCostForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {COST_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição *</label>
                <input value={costForm.description} onChange={e => setCostForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Aluguel de projetor 4K..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Valor Estimado (R$)</label>
                  <input type="number" value={costForm.estimated} onChange={e => setCostForm(f => ({ ...f, estimated: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Valor Real (R$)</label>
                  <input type="number" value={costForm.actual} onChange={e => setCostForm(f => ({ ...f, actual: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fornecedor</label>
                <input value={costForm.supplier} onChange={e => setCostForm(f => ({ ...f, supplier: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={addCost} disabled={!costForm.description} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">Adicionar</button>
                <button onClick={() => setShowAddCost(false)} className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Adicionar Membro</h3>
              <button onClick={() => setShowAddMember(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {users.filter(u => !members.some(m => m.userId === u.id)).length === 0 && (
                <p className="px-3 py-6 text-sm text-gray-500 text-center">Todos os usuários já são membros.</p>
              )}
              {users.filter(u => !members.some(m => m.userId === u.id)).map(user => (
                <button key={user.id} onClick={() => addMember(user.id)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">{user.name.charAt(0)}</div>
                  <div><p className="text-sm font-medium text-gray-900">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
