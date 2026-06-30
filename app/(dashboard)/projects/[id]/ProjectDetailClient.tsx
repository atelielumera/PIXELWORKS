'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, UserPlus } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PROJECT_STATUSES, TASK_STATUSES } from '@/lib/constants'
import { TaskDetailPanel } from '@/components/tasks/task-detail-panel'

type User = { id: string; name: string; email: string; role: string; department: string | null; avatar: string | null }
type TaskAssignee = { userId: string; user: { id: string; name: string } }
type Task = {
  id: string; title: string; status: string; priority: string; section: string | null
  description: string | null; dueDate: string | null; completedAt: string | null
  assignees: TaskAssignee[]; _count: { subtasks: number }
}
type ProjectMember = { userId: string; role: string; user: { id: string; name: string; avatar: string | null } }
type Cost = { id: string; category: string; description: string; estimated: string | null; actual: string | null; supplier: string | null }
type Project = {
  id: string; name: string; status: string; health: string
  approvedBudget: string | null; eventDate: string | null
  setupStartDate: string | null; setupEndDate: string | null
  operationStartDate: string | null; operationEndDate: string | null
  teardownStartDate: string | null; teardownEndDate: string | null
  scope: string | null
  client: { id: string; name: string } | null
  solution: { id: string; name: string; color: string | null } | null
  tasks: Task[]; members: ProjectMember[]; costs: Cost[]
}

const TASK_NEXT: Record<string, string> = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'IN_REVIEW', IN_REVIEW: 'DONE', DONE: 'TODO', CANCELLED: 'TODO' }

export function ProjectDetailClient({ project: initial, users }: { project: Project; users: User[] }) {
  const [project, setProject] = useState(initial)
  const [tasks, setTasks] = useState(initial.tasks)
  const [costs, setCosts] = useState(initial.costs)
  const [members, setMembers] = useState(initial.members)

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const [showEditProject, setShowEditProject] = useState(false)
  const [showAddCost, setShowAddCost] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)

  const [editForm, setEditForm] = useState({
    name: project.name, status: project.status, notes: project.scope ?? '',
    approvedBudget: project.approvedBudget ? String(project.approvedBudget).replace('.', ',') : '',
    eventDate: project.eventDate ? project.eventDate.slice(0, 10) : '',
    setupStartDate: project.setupStartDate ? project.setupStartDate.slice(0, 10) : '',
    setupEndDate: project.setupEndDate ? project.setupEndDate.slice(0, 10) : '',
    operationStartDate: project.operationStartDate ? project.operationStartDate.slice(0, 10) : '',
    operationEndDate: project.operationEndDate ? project.operationEndDate.slice(0, 10) : '',
    teardownStartDate: project.teardownStartDate ? project.teardownStartDate.slice(0, 10) : '',
    teardownEndDate: project.teardownEndDate ? project.teardownEndDate.slice(0, 10) : '',
  })

  const [newCost, setNewCost] = useState({ category: 'Equipamento', description: '', estimated: '', actual: '', supplier: '' })
  const [newMemberId, setNewMemberId] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('member')
  const [newTask, setNewTask] = useState({ title: '', section: 'Geral', priority: 'MEDIUM' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const status = PROJECT_STATUSES.find(s => s.key === project.status)
  const totalCosts = costs.reduce((s, c) => s + Number(c.actual ?? c.estimated ?? 0), 0)
  const margin = project.approvedBudget ? Number(project.approvedBudget) - totalCosts : null

  const tasksBySection: Record<string, Task[]> = {}
  for (const t of tasks) {
    const sec = t.section ?? 'Geral'
    if (!tasksBySection[sec]) tasksBySection[sec] = []
    tasksBySection[sec].push(t)
  }

  async function toggleTask(task: Task) {
    const next = TASK_NEXT[task.status] ?? 'TODO'
    const res = await fetch(`/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
    if (res.ok) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function saveEditTask(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: editingTitle }) })
    if (res.ok) { setTasks(prev => prev.map(t => t.id === id ? { ...t, title: editingTitle } : t)); setEditingTaskId(null) }
  }

  async function addTask() {
    if (!newTask.title.trim()) return
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newTask, projectId: project.id, status: 'TODO' }) })
    if (res.ok) {
      const created = await res.json()
      setTasks(prev => [...prev, { ...created, assignees: [], _count: { subtasks: 0 } }])
      setNewTask({ title: '', section: 'Geral', priority: 'MEDIUM' })
      setShowAddTask(false)
    }
  }

  async function saveProject() {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
      const json = await res.json()
      if (res.ok) {
        setProject(p => ({ ...p, ...json.data }))
        setShowEditProject(false)
      } else {
        setSaveError(json.error ?? 'Erro ao salvar. Tente novamente.')
      }
    } catch {
      setSaveError('Erro de conexão. Verifique sua internet.')
    }
    setSaving(false)
  }

  async function addCost() {
    if (!newCost.description.trim()) return
    const res = await fetch(`/api/projects/${project.id}/costs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCost) })
    if (res.ok) {
      const { data } = await res.json()
      setCosts(prev => [...prev, data])
      setNewCost({ category: 'Equipamento', description: '', estimated: '', actual: '', supplier: '' })
      setShowAddCost(false)
    }
  }

  async function deleteCost(id: string) {
    await fetch(`/api/projects/${project.id}/costs?costId=${id}`, { method: 'DELETE' })
    setCosts(prev => prev.filter(c => c.id !== id))
  }

  async function addMember() {
    if (!newMemberId) return
    const res = await fetch(`/api/projects/${project.id}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: newMemberId, role: newMemberRole }) })
    if (res.ok) {
      const u = users.find(u => u.id === newMemberId)!
      setMembers(prev => [...prev.filter(m => m.userId !== newMemberId), { userId: newMemberId, role: newMemberRole, user: { id: u.id, name: u.name, avatar: u.avatar } }])
      setNewMemberId(''); setShowAddMember(false)
    }
  }

  async function removeMember(userId: string) {
    await fetch(`/api/projects/${project.id}/members?userId=${userId}`, { method: 'DELETE' })
    setMembers(prev => prev.filter(m => m.userId !== userId))
  }

  return (
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
          <button onClick={() => setShowEditProject(true)} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            <Edit2 size={13} />Editar Projeto
          </button>
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
            <p className={`font-bold ${margin !== null && margin < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(margin)}</p>
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
            <h3 className="font-semibold text-gray-900">Tarefas ({tasks.length})</h3>
            <button onClick={() => setShowAddTask(true)} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
              <Plus size={13} />Nova tarefa
            </button>
          </div>

          {showAddTask && (
            <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex gap-2 flex-wrap">
              <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="Nome da tarefa..." className="flex-1 min-w-40 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={newTask.section} onChange={e => setNewTask(p => ({ ...p, section: e.target.value }))} placeholder="Seção" className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none" />
              <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none">
                <option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option>
              </select>
              <button onClick={addTask} className="bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700">Adicionar</button>
              <button onClick={() => setShowAddTask(false)} className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1.5"><X size={14} /></button>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {Object.entries(tasksBySection).map(([section, sectionTasks]) => (
              <div key={section}>
                <div className="px-5 py-2 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{section}</p>
                </div>
                {sectionTasks.map(task => {
                  const ts = TASK_STATUSES.find(s => s.key === task.status)
                  const isEditing = editingTaskId === task.id
                  return (
                    <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
                      <button onClick={() => toggleTask(task)} className="shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                        style={{ borderColor: ts?.color ?? '#9CA3AF', backgroundColor: task.status === 'DONE' ? ts?.color : 'transparent' }}>
                        {task.status === 'DONE' && <Check size={11} className="text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input value={editingTitle} onChange={e => setEditingTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEditTask(task.id); if (e.key === 'Escape') setEditingTaskId(null) }}
                              className="flex-1 border border-blue-400 rounded px-2 py-0.5 text-sm outline-none" autoFocus />
                            <button onClick={() => saveEditTask(task.id)} className="text-green-600"><Check size={14} /></button>
                            <button onClick={() => setEditingTaskId(null)} className="text-gray-400"><X size={14} /></button>
                          </div>
                        ) : (
                          <div className="cursor-pointer" onClick={() => setSelectedTask(task)}>
                            <p className={`text-sm ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'} hover:text-blue-600 transition-colors`}>{task.title}</p>
                            <p className="text-xs text-gray-500">{task.dueDate ? formatDate(task.dueDate) : 'Sem prazo'}{task._count.subtasks > 0 && ` • ${task._count.subtasks} subtarefas`}</p>
                          </div>
                        )}
                      </div>
                      {!isEditing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${ts?.color}20`, color: ts?.color ?? undefined }}>{ts?.label}</span>
                          <button onClick={() => { setEditingTaskId(task.id); setEditingTitle(task.title) }} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Edit2 size={12} /></button>
                          <button onClick={() => deleteTask(task.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="px-5 py-8 text-sm text-gray-500 text-center">Nenhuma tarefa. Clique em &quot;Nova tarefa&quot; para adicionar.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Cronograma</p>
            <div className="space-y-2 text-sm">
              {project.setupStartDate && <div><p className="text-xs text-gray-500">Montagem</p><p className="text-xs text-gray-900">{formatDate(project.setupStartDate)}{project.setupEndDate && ` — ${formatDate(project.setupEndDate)}`}</p></div>}
              {project.operationStartDate && <div><p className="text-xs text-gray-500">Operação</p><p className="text-xs text-gray-900">{formatDate(project.operationStartDate)}{project.operationEndDate && ` — ${formatDate(project.operationEndDate)}`}</p></div>}
              {project.teardownStartDate && <div><p className="text-xs text-gray-500">Desmontagem</p><p className="text-xs text-gray-900">{formatDate(project.teardownStartDate)}{project.teardownEndDate && ` — ${formatDate(project.teardownEndDate)}`}</p></div>}
              {!project.setupStartDate && !project.operationStartDate && !project.teardownStartDate && <p className="text-xs text-gray-500">Sem cronograma definido. Clique em Editar Projeto.</p>}
            </div>
          </div>

          {/* Team */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Equipe ({members.length})</p>
              <button onClick={() => setShowAddMember(true)} className="text-blue-600 hover:text-blue-700"><UserPlus size={14} /></button>
            </div>
            {showAddMember && (
              <div className="mb-3 space-y-2">
                <select value={newMemberId} onChange={e => setNewMemberId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none">
                  <option value="">Selecionar membro...</option>
                  {users.filter(u => !members.some(m => m.userId === u.id)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <input value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} placeholder="Papel (ex: Técnico)" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
                <div className="flex gap-2">
                  <button onClick={addMember} className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded-lg hover:bg-blue-700">Adicionar</button>
                  <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-gray-600 text-xs px-2"><X size={14} /></button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.userId} className="flex items-center gap-2 group">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">{m.user.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{m.user.name}</p>
                    <p className="text-xs text-gray-500">{m.role}</p>
                  </div>
                  <button onClick={() => removeMember(m.userId)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"><X size={13} /></button>
                </div>
              ))}
              {members.length === 0 && <p className="text-xs text-gray-500">Nenhum membro.</p>}
            </div>
          </div>

          {/* Costs */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Custos</p>
              <button onClick={() => setShowAddCost(true)} className="text-blue-600 hover:text-blue-700"><Plus size={14} /></button>
            </div>
            {showAddCost && (
              <div className="mb-3 space-y-2">
                <input value={newCost.description} onChange={e => setNewCost(p => ({ ...p, description: e.target.value }))} placeholder="Descrição *" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
                <input value={newCost.category} onChange={e => setNewCost(p => ({ ...p, category: e.target.value }))} placeholder="Categoria" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
                <div className="flex gap-2">
                  <input value={newCost.estimated} onChange={e => setNewCost(p => ({ ...p, estimated: e.target.value }))} placeholder="Estimado (R$)" className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
                  <input value={newCost.actual} onChange={e => setNewCost(p => ({ ...p, actual: e.target.value }))} placeholder="Real (R$)" className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
                </div>
                <input value={newCost.supplier} onChange={e => setNewCost(p => ({ ...p, supplier: e.target.value }))} placeholder="Fornecedor" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
                <div className="flex gap-2">
                  <button onClick={addCost} className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded-lg hover:bg-blue-700">Adicionar</button>
                  <button onClick={() => setShowAddCost(false)} className="text-gray-400 hover:text-gray-600 text-xs px-2"><X size={14} /></button>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              {costs.map(cost => (
                <div key={cost.id} className="flex justify-between text-xs group">
                  <span className="text-gray-600 truncate">{cost.description}</span>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <span className="text-gray-900 font-medium">{formatCurrency(Number(cost.actual ?? cost.estimated ?? 0))}</span>
                    <button onClick={() => deleteCost(cost.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"><X size={11} /></button>
                  </div>
                </div>
              ))}
              {costs.length > 0 && (
                <div className="pt-1.5 border-t border-gray-100 flex justify-between text-xs font-semibold">
                  <span>Total</span><span>{formatCurrency(totalCosts)}</span>
                </div>
              )}
              {costs.length === 0 && <p className="text-xs text-gray-500">Nenhum custo registrado.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          projectId={project.id}
          users={users.map(u => ({ id: u.id, name: u.name, avatar: u.avatar }))}
          onClose={() => setSelectedTask(null)}
          onTaskUpdate={(taskId, data) => {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data } : t))
          }}
        />
      )}

      {/* Edit Project Modal */}
      {showEditProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Editar Projeto</h3>
              <button onClick={() => { setShowEditProject(false); setSaveError('') }}><X size={18} className="text-gray-400" /></button>
            </div>
            {saveError && (
              <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{saveError}</div>
            )}
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Nome do Projeto</label>
                <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                  {PROJECT_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Orçamento Aprovado (R$)</label>
                <input value={editForm.approvedBudget} onChange={e => setEditForm(p => ({ ...p, approvedBudget: e.target.value }))}
                  type="text" inputMode="decimal" placeholder="Ex: 50000,64"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Data do Evento</label>
                <input value={editForm.eventDate} onChange={e => setEditForm(p => ({ ...p, eventDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Início Montagem</label>
                  <input value={editForm.setupStartDate} onChange={e => setEditForm(p => ({ ...p, setupStartDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Fim Montagem</label>
                  <input value={editForm.setupEndDate} onChange={e => setEditForm(p => ({ ...p, setupEndDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Início Operação</label>
                  <input value={editForm.operationStartDate} onChange={e => setEditForm(p => ({ ...p, operationStartDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Fim Operação</label>
                  <input value={editForm.operationEndDate} onChange={e => setEditForm(p => ({ ...p, operationEndDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Início Desmontagem</label>
                  <input value={editForm.teardownStartDate} onChange={e => setEditForm(p => ({ ...p, teardownStartDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Fim Desmontagem</label>
                  <input value={editForm.teardownEndDate} onChange={e => setEditForm(p => ({ ...p, teardownEndDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Observações</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => { setShowEditProject(false); setSaveError('') }} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={saveProject} disabled={saving} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
