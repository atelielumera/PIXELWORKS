'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, UserPlus, ChevronDown, ChevronRight, MoreHorizontal, Calendar, DollarSign, Users, Clock } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PROJECT_STATUSES, TASK_STATUSES } from '@/lib/constants'

type User = { id: string; name: string; email: string; role: string; department: string | null; avatar: string | null }
type TaskAssignee = { userId: string; user: { id: string; name: string } }
type Task = {
  id: string; title: string; status: string; priority: string; section: string | null
  dueDate: string | null; completedAt: string | null
  prestador: string | null; fornecedor: string | null; eixoTematico: string | null
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
  notes: string | null
  client: { id: string; name: string } | null
  solution: { id: string; name: string; color: string | null } | null
  tasks: Task[]; members: ProjectMember[]; costs: Cost[]
}

const PRIORITY_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  LOW:    { label: 'Baixa',   color: '#6B7280', bg: '#F3F4F6' },
  MEDIUM: { label: 'Média',   color: '#3B82F6', bg: '#EFF6FF' },
  HIGH:   { label: 'Alta',    color: '#F97316', bg: '#FFF7ED' },
  URGENT: { label: 'Urgente', color: '#EF4444', bg: '#FEF2F2' },
}

const TASK_NEXT: Record<string, string> = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'IN_REVIEW', IN_REVIEW: 'DONE', DONE: 'TODO', CANCELLED: 'TODO' }

type Tab = 'lista' | 'cronograma' | 'equipe' | 'custos'

export function ProjectDetailClient({ project: initial, users }: { project: Project; users: User[] }) {
  const [project, setProject] = useState(initial)
  const [tasks, setTasks] = useState(initial.tasks)
  const [costs, setCosts] = useState(initial.costs)
  const [members, setMembers] = useState(initial.members)
  const [activeTab, setActiveTab] = useState<Tab>('lista')

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [addingInSection, setAddingInSection] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTaskForm, setEditTaskForm] = useState({ title: '', status: '', priority: '', section: '', dueDate: '', prestador: '', fornecedor: '', eixoTematico: '' })

  const [showEditProject, setShowEditProject] = useState(false)
  const [showAddCost, setShowAddCost] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  const [editForm, setEditForm] = useState({
    name: project.name, status: project.status, notes: project.notes ?? '',
    approvedBudget: project.approvedBudget ?? '',
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
  const [saving, setSaving] = useState(false)

  const st = PROJECT_STATUSES.find(s => s.key === project.status)
  const totalCosts = costs.reduce((s, c) => s + Number(c.actual ?? c.estimated ?? 0), 0)
  const margin = project.approvedBudget ? Number(project.approvedBudget) - totalCosts : null
  const doneTasks = tasks.filter(t => t.status === 'DONE').length

  const tasksBySection: Record<string, Task[]> = {}
  for (const t of tasks) {
    const sec = t.section ?? 'Sem seção'
    if (!tasksBySection[sec]) tasksBySection[sec] = []
    tasksBySection[sec].push(t)
  }
  const sections = Object.keys(tasksBySection)

  function toggleSection(sec: string) {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(sec)) next.delete(sec); else next.add(sec)
      return next
    })
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

  function openEditTask(task: Task) {
    setEditingTask(task)
    setEditTaskForm({
      title: task.title, status: task.status, priority: task.priority,
      section: task.section ?? 'Sem seção',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      prestador: task.prestador ?? '', fornecedor: task.fornecedor ?? '', eixoTematico: task.eixoTematico ?? '',
    })
  }

  async function saveTaskModal() {
    if (!editingTask) return
    const body = {
      title: editTaskForm.title, status: editTaskForm.status, priority: editTaskForm.priority,
      section: editTaskForm.section || null,
      dueDate: editTaskForm.dueDate || null,
      prestador: editTaskForm.prestador || null,
      fornecedor: editTaskForm.fornecedor || null,
      eixoTematico: editTaskForm.eixoTematico || null,
    }
    const res = await fetch(`/api/tasks/${editingTask.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...body } : t))
      setEditingTask(null)
    }
  }

  async function addTaskInSection(section: string) {
    if (!newTaskTitle.trim()) { setAddingInSection(null); return }
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTaskTitle.trim(), section, projectId: project.id, status: 'TODO', priority: 'MEDIUM' }) })
    if (res.ok) {
      const created = await res.json()
      setTasks(prev => [...prev, { ...created, assignees: [], _count: { subtasks: 0 } }])
    }
    setNewTaskTitle('')
    setAddingInSection(null)
  }

  async function saveProject() {
    setSaving(true)
    const res = await fetch(`/api/projects/${project.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    if (res.ok) { const { data } = await res.json(); setProject(p => ({ ...p, ...data })); setShowEditProject(false) }
    setSaving(false)
  }

  async function addCost() {
    if (!newCost.description.trim()) return
    const res = await fetch(`/api/projects/${project.id}/costs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCost) })
    if (res.ok) { const { data } = await res.json(); setCosts(prev => [...prev, data]); setNewCost({ category: 'Equipamento', description: '', estimated: '', actual: '', supplier: '' }); setShowAddCost(false) }
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
    <div className="flex flex-col h-full">
      {/* ===== PROJECT HEADER ===== */}
      <div className="border-b border-gray-200 bg-white px-6 pt-5 pb-0">
        <Link href="/projects" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-3 w-fit">
          <ArrowLeft size={12} />Projetos
        </Link>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              {project.solution && (
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: project.solution.color ?? '#6B7280' }} />
              )}
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              {project.solution && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${project.solution.color}20`, color: project.solution.color ?? undefined }}>
                  {project.solution.name}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${st?.color}18`, color: st?.color ?? undefined }}>
                {st?.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{project.client?.name}</p>
          </div>
          <button onClick={() => setShowEditProject(true)} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0">
            <Edit2 size={12} />Editar
          </button>
        </div>

        {/* Métricas rápidas */}
        <div className="flex items-center gap-6 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1.5"><Calendar size={12} />{project.eventDate ? formatDate(project.eventDate) : 'Sem data'}</span>
          <span className="flex items-center gap-1.5"><DollarSign size={12} />{formatCurrency(project.approvedBudget ? Number(project.approvedBudget) : null)}</span>
          <span className="flex items-center gap-1.5"><Check size={12} />{doneTasks}/{tasks.length} tarefas</span>
          <span className="flex items-center gap-1.5"><Users size={12} />{members.length} membros</span>
          {tasks.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(doneTasks / tasks.length) * 100}%` }} />
              </div>
              <span>{Math.round((doneTasks / tasks.length) * 100)}%</span>
            </div>
          )}
        </div>

        {/* Abas */}
        <div className="flex gap-0">
          {(['lista', 'cronograma', 'equipe', 'custos'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'lista' ? 'Lista' : tab === 'cronograma' ? 'Cronograma' : tab === 'equipe' ? 'Equipe' : 'Custos'}
            </button>
          ))}
        </div>
      </div>

      {/* ===== CONTEÚDO DA ABA ===== */}
      <div className="flex-1 overflow-auto bg-white">

        {/* --------- ABA: LISTA (tabela estilo Asana) --------- */}
        {activeTab === 'lista' && (
          <div>
            {/* Cabeçalho de colunas fixo */}
            <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 grid grid-cols-[32px_minmax(200px,1fr)_120px_100px_100px_120px_120px_80px] px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div />
              <div>Nome da Tarefa</div>
              <div>Responsável</div>
              <div>Prazo</div>
              <div>Prioridade</div>
              <div>Status</div>
              <div>Prestador</div>
              <div />
            </div>

            {/* Seções + linhas */}
            {sections.map(section => {
              const isCollapsed = collapsedSections.has(section)
              const sectionTasks = tasksBySection[section]
              return (
                <div key={section}>
                  {/* Cabeçalho da seção */}
                  <div
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50/60 border-b border-gray-100 cursor-pointer hover:bg-gray-100/60 transition-colors group"
                    onClick={() => toggleSection(section)}
                  >
                    {isCollapsed ? <ChevronRight size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{section}</span>
                    <span className="text-xs text-gray-400">({sectionTasks.length})</span>
                  </div>

                  {!isCollapsed && (
                    <>
                      {sectionTasks.map(task => {
                        const ts = TASK_STATUSES.find(s => s.key === task.status)
                        const pr = PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.MEDIUM
                        const isDone = task.status === 'DONE'
                        return (
                          <div
                            key={task.id}
                            className="grid grid-cols-[32px_minmax(200px,1fr)_120px_100px_100px_120px_120px_80px] px-4 py-2.5 border-b border-gray-100 hover:bg-blue-50/30 transition-colors group items-center"
                          >
                            {/* Checkbox */}
                            <button
                              onClick={() => toggleTask(task)}
                              className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0"
                              style={{ borderColor: ts?.color ?? '#9CA3AF', backgroundColor: isDone ? ts?.color : 'transparent' }}
                            >
                              {isDone && <Check size={9} className="text-white" />}
                            </button>

                            {/* Nome */}
                            <span className={`text-sm truncate pr-2 ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {task.title}
                              {task._count.subtasks > 0 && <span className="ml-1.5 text-xs text-gray-400">{task._count.subtasks} sub</span>}
                            </span>

                            {/* Responsável */}
                            <div className="flex -space-x-1">
                              {task.assignees.slice(0, 3).map(a => (
                                <div key={a.userId} className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-700 text-xs font-bold" title={a.user.name}>
                                  {a.user.name.charAt(0)}
                                </div>
                              ))}
                              {task.assignees.length === 0 && <span className="text-xs text-gray-300">—</span>}
                            </div>

                            {/* Prazo */}
                            <span className={`text-xs ${task.dueDate ? 'text-gray-600' : 'text-gray-300'}`}>
                              {task.dueDate ? formatDate(task.dueDate) : '—'}
                            </span>

                            {/* Prioridade */}
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium w-fit" style={{ backgroundColor: pr.bg, color: pr.color }}>
                              {pr.label}
                            </span>

                            {/* Status */}
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium w-fit" style={{ backgroundColor: `${ts?.color}18`, color: ts?.color ?? undefined }}>
                              {ts?.label}
                            </span>

                            {/* Prestador */}
                            <span className="text-xs text-gray-500 truncate">
                              {task.prestador ?? <span className="text-gray-300">—</span>}
                            </span>

                            {/* Ações */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                              <button onClick={() => openEditTask(task)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Edit2 size={13} /></button>
                              <button onClick={() => deleteTask(task.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                            </div>
                          </div>
                        )
                      })}

                      {/* Linha de adicionar tarefa nesta seção */}
                      {addingInSection === section ? (
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-blue-50/40">
                          <div className="w-4 h-4 rounded border-2 border-gray-300 shrink-0" />
                          <input
                            autoFocus
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') addTaskInSection(section); if (e.key === 'Escape') { setAddingInSection(null); setNewTaskTitle('') } }}
                            placeholder="Nome da tarefa"
                            className="flex-1 text-sm outline-none bg-transparent"
                          />
                          <button onClick={() => addTaskInSection(section)} className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700">Adicionar</button>
                          <button onClick={() => { setAddingInSection(null); setNewTaskTitle('') }} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingInSection(section)}
                          className="flex items-center gap-2 px-4 py-2 w-full text-left border-b border-gray-100 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50/20 transition-colors"
                        >
                          <Plus size={13} />Adicionar tarefa
                        </button>
                      )}
                    </>
                  )}
                </div>
              )
            })}

            {/* Nova seção */}
            {addingInSection === '__new__' ? (
              <div className="flex items-center gap-2 px-4 py-2.5">
                <input
                  autoFocus
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTaskInSection('Nova Seção'); if (e.key === 'Escape') { setAddingInSection(null); setNewTaskTitle('') } }}
                  placeholder="Nome da tarefa na nova seção"
                  className="flex-1 text-sm border border-blue-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button onClick={() => addTaskInSection('Nova Seção')} className="text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700">Adicionar</button>
                <button onClick={() => { setAddingInSection(null); setNewTaskTitle('') }} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
              </div>
            ) : (
              <button
                onClick={() => { setAddingInSection(sections.length > 0 ? sections[0] : 'Geral'); setNewTaskTitle('') }}
                className="flex items-center gap-2 px-4 py-3 w-full text-left text-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50/20 transition-colors"
              >
                <Plus size={14} />Adicionar tarefa
              </button>
            )}

            {tasks.length === 0 && (
              <div className="py-16 text-center text-gray-400 text-sm">
                Nenhuma tarefa ainda. Clique em &ldquo;Adicionar tarefa&rdquo; para começar.
              </div>
            )}
          </div>
        )}

        {/* --------- ABA: CRONOGRAMA --------- */}
        {activeTab === 'cronograma' && (
          <div className="p-6 max-w-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Cronograma do Projeto</h3>
              <button onClick={() => setShowEditProject(true)} className="text-xs text-blue-600 hover:underline">Editar datas</button>
            </div>
            {[
              { label: 'Data do Evento', start: project.eventDate, end: null },
              { label: 'Montagem', start: project.setupStartDate, end: project.setupEndDate },
              { label: 'Operação', start: project.operationStartDate, end: project.operationEndDate },
              { label: 'Desmontagem', start: project.teardownStartDate, end: project.teardownEndDate },
            ].map(({ label, start, end }) => start && (
              <div key={label} className="flex items-start gap-4 py-3 border-b border-gray-100">
                <span className="text-xs text-gray-500 w-28 pt-0.5">{label}</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(start)}{end ? ` — ${formatDate(end)}` : ''}</span>
              </div>
            ))}
            {!project.eventDate && !project.setupStartDate && (
              <p className="text-sm text-gray-400">Nenhuma data definida. Clique em &ldquo;Editar datas&rdquo; para adicionar.</p>
            )}
          </div>
        )}

        {/* --------- ABA: EQUIPE --------- */}
        {activeTab === 'equipe' && (
          <div className="p-6 max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Membros da Equipe ({members.length})</h3>
              <button onClick={() => setShowAddMember(true)} className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                <UserPlus size={13} />Adicionar
              </button>
            </div>
            {showAddMember && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
                <select value={newMemberId} onChange={e => setNewMemberId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="">Selecionar membro...</option>
                  {users.filter(u => !members.some(m => m.userId === u.id)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <input value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} placeholder="Papel (ex: Técnico, Diretor)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                <div className="flex gap-2">
                  <button onClick={addMember} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700">Adicionar</button>
                  <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-gray-600 px-3"><X size={14} /></button>
                </div>
              </div>
            )}
            <div className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-200">
              {members.map(m => (
                <div key={m.userId} className="flex items-center gap-3 px-4 py-3 group">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">{m.user.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                    <p className="text-xs text-gray-500">{m.role}</p>
                  </div>
                  <button onClick={() => removeMember(m.userId)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"><X size={14} /></button>
                </div>
              ))}
              {members.length === 0 && <p className="px-4 py-8 text-sm text-gray-400 text-center">Nenhum membro adicionado.</p>}
            </div>
          </div>
        )}

        {/* --------- ABA: CUSTOS --------- */}
        {activeTab === 'custos' && (
          <div className="p-6 max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Custos do Projeto</h3>
                <p className="text-xs text-gray-500 mt-0.5">Orçamento: {formatCurrency(project.approvedBudget ? Number(project.approvedBudget) : null)} · Custos: {formatCurrency(totalCosts)} · Margem: <span className={margin !== null && margin < 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>{formatCurrency(margin)}</span></p>
              </div>
              <button onClick={() => setShowAddCost(true)} className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                <Plus size={13} />Adicionar custo
              </button>
            </div>
            {showAddCost && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
                <input value={newCost.description} onChange={e => setNewCost(p => ({ ...p, description: e.target.value }))} placeholder="Descrição *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                <input value={newCost.category} onChange={e => setNewCost(p => ({ ...p, category: e.target.value }))} placeholder="Categoria" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                <div className="flex gap-2">
                  <input value={newCost.estimated} onChange={e => setNewCost(p => ({ ...p, estimated: e.target.value }))} placeholder="Estimado (R$)" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                  <input value={newCost.actual} onChange={e => setNewCost(p => ({ ...p, actual: e.target.value }))} placeholder="Real (R$)" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <input value={newCost.supplier} onChange={e => setNewCost(p => ({ ...p, supplier: e.target.value }))} placeholder="Fornecedor" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                <div className="flex gap-2">
                  <button onClick={addCost} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700">Adicionar</button>
                  <button onClick={() => setShowAddCost(false)} className="text-gray-400 hover:text-gray-600 px-3"><X size={14} /></button>
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-[1fr_120px_120px_100px_40px] px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <div>Descrição</div><div>Categoria</div><div>Estimado</div><div>Real</div><div />
              </div>
              {costs.map(cost => (
                <div key={cost.id} className="grid grid-cols-[1fr_120px_120px_100px_40px] px-4 py-3 border-b border-gray-100 last:border-0 text-sm items-center group hover:bg-gray-50">
                  <span className="text-gray-900 truncate">{cost.description}</span>
                  <span className="text-gray-500 text-xs">{cost.category}</span>
                  <span className="text-gray-500 text-xs">{cost.estimated ? formatCurrency(Number(cost.estimated)) : '—'}</span>
                  <span className="text-gray-900 font-medium text-xs">{cost.actual ? formatCurrency(Number(cost.actual)) : '—'}</span>
                  <button onClick={() => deleteCost(cost.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"><Trash2 size={13} /></button>
                </div>
              ))}
              {costs.length > 0 && (
                <div className="grid grid-cols-[1fr_120px_120px_100px_40px] px-4 py-2.5 bg-gray-50 border-t border-gray-200 text-xs font-bold text-gray-700">
                  <span>Total</span><span /><span /><span>{formatCurrency(totalCosts)}</span><span />
                </div>
              )}
              {costs.length === 0 && <p className="px-4 py-8 text-sm text-gray-400 text-center">Nenhum custo registrado.</p>}
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL: EDITAR TAREFA ===== */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Editar Tarefa</h3>
              <button onClick={() => setEditingTask(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Título *</label>
                <input value={editTaskForm.title} onChange={e => setEditTaskForm(p => ({ ...p, title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Status</label>
                  <select value={editTaskForm.status} onChange={e => setEditTaskForm(p => ({ ...p, status: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                    {TASK_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Prioridade</label>
                  <select value={editTaskForm.priority} onChange={e => setEditTaskForm(p => ({ ...p, priority: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                    <option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Seção</label>
                  <input value={editTaskForm.section} onChange={e => setEditTaskForm(p => ({ ...p, section: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Prazo</label>
                  <input type="date" value={editTaskForm.dueDate} onChange={e => setEditTaskForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Prestador</label>
                <input value={editTaskForm.prestador} onChange={e => setEditTaskForm(p => ({ ...p, prestador: e.target.value }))} placeholder="Nome do prestador" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Fornecedor</label>
                <input value={editTaskForm.fornecedor} onChange={e => setEditTaskForm(p => ({ ...p, fornecedor: e.target.value }))} placeholder="Nome do fornecedor" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Eixo Temático</label>
                <input value={editTaskForm.eixoTematico} onChange={e => setEditTaskForm(p => ({ ...p, eixoTematico: e.target.value }))} placeholder="Eixo temático" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setEditingTask(null)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={saveTaskModal} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDITAR PROJETO ===== */}
      {showEditProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Editar Projeto</h3>
              <button onClick={() => setShowEditProject(false)}><X size={18} className="text-gray-400" /></button>
            </div>
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
                <input value={editForm.approvedBudget} onChange={e => setEditForm(p => ({ ...p, approvedBudget: e.target.value }))} type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Data do Evento</label>
                <input value={editForm.eventDate} onChange={e => setEditForm(p => ({ ...p, eventDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-700 block mb-1">Início Montagem</label><input value={editForm.setupStartDate} onChange={e => setEditForm(p => ({ ...p, setupStartDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1">Fim Montagem</label><input value={editForm.setupEndDate} onChange={e => setEditForm(p => ({ ...p, setupEndDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1">Início Operação</label><input value={editForm.operationStartDate} onChange={e => setEditForm(p => ({ ...p, operationStartDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1">Fim Operação</label><input value={editForm.operationEndDate} onChange={e => setEditForm(p => ({ ...p, operationEndDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1">Início Desmontagem</label><input value={editForm.teardownStartDate} onChange={e => setEditForm(p => ({ ...p, teardownStartDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1">Fim Desmontagem</label><input value={editForm.teardownEndDate} onChange={e => setEditForm(p => ({ ...p, teardownEndDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Observações</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowEditProject(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={saveProject} disabled={saving} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
