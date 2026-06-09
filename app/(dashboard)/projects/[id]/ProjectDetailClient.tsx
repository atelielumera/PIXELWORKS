'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, UserPlus, ChevronDown, ChevronRight, Award, Calendar, DollarSign, Users, LayoutGrid, List, BarChart3, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PROJECT_STATUSES, TASK_STATUSES } from '@/lib/constants'

type User = { id: string; name: string; email: string; role: string; department: string | null; avatar: string | null }
type TaskAssignee = { userId: string; user: { id: string; name: string } }
type CustomField = { id: string; name: string; fieldType: string; sortOrder: number }
type Task = {
  id: string; title: string; status: string; priority: string; section: string | null
  dueDate: string | null; completedAt: string | null
  prestador: string | null; fornecedor: string | null; eixoTematico: string | null
  assignees: TaskAssignee[]; _count: { subtasks: number }
  customFieldValues: { fieldId: string; value: string | null }[]
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
  customFields: CustomField[]
}

const PRIORITY_STYLE: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Baixa',   color: '#6B7280' },
  MEDIUM: { label: 'Média',   color: '#3B82F6' },
  HIGH:   { label: 'Alta',    color: '#F97316' },
  URGENT: { label: 'Urgente', color: '#EF4444' },
}

const STATUS_NEXT: Record<string, string> = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'IN_REVIEW', IN_REVIEW: 'DONE', DONE: 'TODO', CANCELLED: 'TODO' }

type Tab = 'overview' | 'lista' | 'quadro' | 'cronograma' | 'painel'

// ─── Inline editable cell ───────────────────────────────────────────────────
function InlineCell({ value, onSave, placeholder }: { value: string | null; onSave: (v: string) => void; placeholder: string }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  if (editing) return (
    <input
      autoFocus value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => { onSave(val); setEditing(false) }}
      onKeyDown={e => { if (e.key === 'Enter') { onSave(val); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
      className="w-full px-1.5 py-0.5 text-xs rounded border border-blue-500 bg-[#32343a] text-gray-100 outline-none"
      style={{ minWidth: 80 }}
    />
  )
  return (
    <button onClick={() => { setVal(value ?? ''); setEditing(true) }}
      className="w-full text-left px-2 py-1 rounded text-xs hover:bg-white/5 transition-colors"
      style={{ color: value ? '#d1d5db' : '#4b5563' }}
    >
      {value || <span className="text-[#3d3f44]">{placeholder}</span>}
    </button>
  )
}

export function ProjectDetailClient({ project: initial, users }: { project: Project; users: User[] }) {
  const [project, setProject] = useState(initial)
  const [tasks, setTasks] = useState(initial.tasks)
  const [costs, setCosts] = useState(initial.costs)
  const [members, setMembers] = useState(initial.members)
  const [customFields, setCustomFields] = useState<CustomField[]>(initial.customFields ?? [])
  const [addingField, setAddingField] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
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
  const pct = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0

  const tasksBySection: Record<string, Task[]> = {}
  for (const t of tasks) {
    const sec = t.section ?? 'Sem seção'
    if (!tasksBySection[sec]) tasksBySection[sec] = []
    tasksBySection[sec].push(t)
  }
  const sections = Object.keys(tasksBySection)

  // Kanban columns
  const kanbanCols = TASK_STATUSES.map(s => ({ ...s, tasks: tasks.filter(t => t.status === s.key) }))

  function toggleSection(sec: string) {
    setCollapsedSections(prev => { const n = new Set(prev); n.has(sec) ? n.delete(sec) : n.add(sec); return n })
  }

  async function toggleTask(task: Task) {
    const next = STATUS_NEXT[task.status] ?? 'TODO'
    const res = await fetch(`/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
    if (res.ok) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function patchTask(id: string, data: Partial<Task>) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
  }

  async function saveCustomFieldValue(taskId: string, fieldId: string, value: string) {
    await fetch(`/api/tasks/${taskId}/field-values`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldId, value }),
    })
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      const existing = t.customFieldValues.find(v => v.fieldId === fieldId)
      if (existing) return { ...t, customFieldValues: t.customFieldValues.map(v => v.fieldId === fieldId ? { ...v, value } : v) }
      return { ...t, customFieldValues: [...t.customFieldValues, { fieldId, value }] }
    }))
  }

  async function addCustomField() {
    if (!newFieldName.trim()) { setAddingField(false); return }
    const res = await fetch(`/api/projects/${project.id}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newFieldName.trim() }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setCustomFields(prev => [...prev, data])
      setNewFieldName('')
      setAddingField(false)
    }
  }

  async function deleteCustomField(fieldId: string) {
    await fetch(`/api/projects/${project.id}/fields/${fieldId}`, { method: 'DELETE' })
    setCustomFields(prev => prev.filter(f => f.id !== fieldId))
    setTasks(prev => prev.map(t => ({ ...t, customFieldValues: t.customFieldValues.filter(v => v.fieldId !== fieldId) })))
  }

  function openEditTask(task: Task) {
    setEditingTask(task)
    setEditTaskForm({ title: task.title, status: task.status, priority: task.priority, section: task.section ?? '', dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '', prestador: task.prestador ?? '', fornecedor: task.fornecedor ?? '', eixoTematico: task.eixoTematico ?? '' })
  }

  async function saveTaskModal() {
    if (!editingTask) return
    const body = { title: editTaskForm.title, status: editTaskForm.status, priority: editTaskForm.priority, section: editTaskForm.section || null, dueDate: editTaskForm.dueDate || null, prestador: editTaskForm.prestador || null, fornecedor: editTaskForm.fornecedor || null, eixoTematico: editTaskForm.eixoTematico || null }
    const res = await fetch(`/api/tasks/${editingTask.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...body } : t)); setEditingTask(null) }
  }

  async function addTaskInSection(section: string) {
    if (!newTaskTitle.trim()) { setAddingInSection(null); return }
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTaskTitle.trim(), section, projectId: project.id, status: 'TODO', priority: 'MEDIUM' }) })
    if (res.ok) { const created = await res.json(); setTasks(prev => [...prev, { ...created, assignees: [], _count: { subtasks: 0 } }]) }
    setNewTaskTitle(''); setAddingInSection(null)
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

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview',    label: 'Visão Geral' },
    { key: 'lista',       label: 'Lista' },
    { key: 'quadro',      label: 'Quadro' },
    { key: 'cronograma',  label: 'Cronograma' },
    { key: 'painel',      label: 'Painel' },
  ]

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#1e1f21', color: '#f3f4f6' }}>
      {/* ===== PROJECT HEADER ===== */}
      <div style={{ backgroundColor: '#1e1f21', borderBottom: '1px solid #3d3f44' }} className="px-6 pt-4 pb-0 shrink-0">
        <Link href="/projects" className="flex items-center gap-1.5 text-xs mb-3 w-fit" style={{ color: '#6b7280' }}>
          <ArrowLeft size={12} />Projetos
        </Link>

        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 flex-wrap">
            {project.solution && <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: project.solution.color ?? '#6B7280' }} />}
            <h1 className="text-xl font-bold" style={{ color: '#f3f4f6' }}>{project.name}</h1>
            {project.solution && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${project.solution.color}25`, color: project.solution.color ?? undefined }}>
                {project.solution.name}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${st?.color}25`, color: st?.color }}>
              {st?.label}
            </span>
          </div>
          <button onClick={() => setShowEditProject(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0" style={{ border: '1px solid #3d3f44', color: '#9ca3af', backgroundColor: 'transparent' }}>
            <Edit2 size={12} />Editar
          </button>
        </div>

        <p className="text-sm mb-3" style={{ color: '#6b7280' }}>{project.client?.name}</p>

        {/* Quick stats */}
        <div className="flex items-center gap-5 text-xs mb-3" style={{ color: '#6b7280' }}>
          <span className="flex items-center gap-1.5"><Calendar size={12} />{project.eventDate ? formatDate(project.eventDate) : 'Sem data'}</span>
          <span className="flex items-center gap-1.5"><DollarSign size={12} />{formatCurrency(project.approvedBudget ? Number(project.approvedBudget) : null)}</span>
          <span className="flex items-center gap-1.5"><Check size={12} />{doneTasks}/{tasks.length} tarefas</span>
          <span className="flex items-center gap-1.5"><Users size={12} />{members.length} membros</span>
          {tasks.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#3d3f44' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#22c55e' : '#3b82f6' }} />
              </div>
              <span>{pct}%</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === tab.key ? '#3b82f6' : '#6b7280',
                backgroundColor: 'transparent',
              }}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      {/* ===== TAB CONTENT ===== */}
      <div className="flex-1 overflow-auto" style={{ backgroundColor: '#1e1f21' }}>

        {/* ── VISÃO GERAL ── */}
        {activeTab === 'overview' && (
          <div className="p-6 max-w-3xl space-y-5">
            {/* Status */}
            <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
              <h3 className="text-sm font-semibold" style={{ color: '#f3f4f6' }}>Status do Projeto</h3>
              <div className="flex gap-3">
                {['Em dia', 'Em risco', 'Em atraso'].map(s => (
                  <div key={s} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium" style={{ backgroundColor: '#32343a', color: '#9ca3af', border: '1px solid #3d3f44' }}>
                    <span className={`w-2 h-2 rounded-full ${s === 'Em dia' ? 'bg-green-500' : s === 'Em risco' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    {s}
                  </div>
                ))}
              </div>
              {project.notes && <p className="text-sm" style={{ color: '#9ca3af' }}>{project.notes}</p>}
              {!project.notes && <p className="text-sm italic" style={{ color: '#4b5563' }}>Nenhuma descrição. Clique em Editar para adicionar.</p>}
            </div>

            {/* Equipe / Funções */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: '#f3f4f6' }}>Funções no Projeto</h3>
                <button onClick={() => setShowAddMember(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: '#32343a', color: '#9ca3af', border: '1px solid #3d3f44' }}>
                  <UserPlus size={12} />Adicionar membro
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {members.map(m => (
                  <div key={m.userId} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl group" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44' }}>
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">{m.user.name.charAt(0)}</div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#f3f4f6' }}>{m.user.name}</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>{m.role}</p>
                    </div>
                    <button onClick={() => removeMember(m.userId)} className="opacity-0 group-hover:opacity-100 ml-1" style={{ color: '#4b5563' }}><X size={13} /></button>
                  </div>
                ))}
                {members.length === 0 && <p className="text-sm" style={{ color: '#4b5563' }}>Nenhum membro. Clique em Adicionar.</p>}
              </div>
              {showAddMember && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  <select value={newMemberId} onChange={e => setNewMemberId(e.target.value)} className="text-sm px-3 py-2 rounded-lg flex-1 min-w-48" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }}>
                    <option value="">Selecionar...</option>
                    {users.filter(u => !members.some(m => m.userId === u.id)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <input value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} placeholder="Papel" className="text-sm px-3 py-2 rounded-lg w-32" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} />
                  <button onClick={addMember} className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Adicionar</button>
                  <button onClick={() => setShowAddMember(false)} style={{ color: '#6b7280' }}><X size={15} /></button>
                </div>
              )}
            </div>

            {/* Recursos principais / datas */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#f3f4f6' }}>Recursos Principais</h3>
              <div className="space-y-2">
                {[
                  { label: 'Data do Evento', value: project.eventDate ? formatDate(project.eventDate) : null },
                  { label: 'Montagem', value: project.setupStartDate ? `${formatDate(project.setupStartDate)}${project.setupEndDate ? ` → ${formatDate(project.setupEndDate)}` : ''}` : null },
                  { label: 'Operação', value: project.operationStartDate ? `${formatDate(project.operationStartDate)}${project.operationEndDate ? ` → ${formatDate(project.operationEndDate)}` : ''}` : null },
                  { label: 'Desmontagem', value: project.teardownStartDate ? `${formatDate(project.teardownStartDate)}${project.teardownEndDate ? ` → ${formatDate(project.teardownEndDate)}` : ''}` : null },
                  { label: 'Orçamento', value: project.approvedBudget ? formatCurrency(Number(project.approvedBudget)) : null },
                ].filter(i => i.value).map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: '#3d3f44' }}>
                    <span className="text-xs w-28" style={{ color: '#6b7280' }}>{label}</span>
                    <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>{value}</span>
                  </div>
                ))}
                {!project.eventDate && !project.setupStartDate && (
                  <p className="text-sm" style={{ color: '#4b5563' }}>Nenhuma data. Clique em Editar para adicionar.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── LISTA ── */}
        {activeTab === 'lista' && (
          <div>
            {/* Cabeçalho de colunas */}
            <div className="sticky top-0 z-10 grid px-4 py-2 text-xs font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: '#292a2e',
                borderBottom: '1px solid #3d3f44',
                color: '#6b7280',
                gridTemplateColumns: `28px 1fr 110px 100px 110px 110px 110px${customFields.map(() => ' 120px').join('')} 90px`,
              }}>
              <div />
              <div>Nome da Tarefa</div>
              <div>Responsável</div>
              <div>Prazo</div>
              <div className="flex items-center gap-1"><Award size={11} className="text-yellow-500/70" />Prestador</div>
              <div className="flex items-center gap-1"><Award size={11} className="text-yellow-500/70" />Fornecedor</div>
              <div className="flex items-center gap-1"><Award size={11} className="text-yellow-500/70" />Eixo Temático</div>
              {customFields.map(field => (
                <div key={field.id} className="flex items-center gap-1 group/col">
                  <Award size={11} style={{ color: '#ca8a04', opacity: 0.7 }} />
                  <span className="truncate">{field.name}</span>
                  <button onClick={() => deleteCustomField(field.id)}
                    className="opacity-0 group-hover/col:opacity-100 ml-auto shrink-0 transition-opacity"
                    style={{ color: '#4b5563' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}>
                    <X size={10} />
                  </button>
                </div>
              ))}
              {/* Botão + coluna */}
              <div className="flex items-center">
                {addingField ? (
                  <div className="flex items-center gap-1">
                    <input autoFocus value={newFieldName}
                      onChange={e => setNewFieldName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addCustomField(); if (e.key === 'Escape') { setAddingField(false); setNewFieldName('') } }}
                      onBlur={() => { if (!newFieldName.trim()) setAddingField(false) }}
                      placeholder="Nome..." className="w-20 text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: '#32343a', border: '1px solid #3b82f6', color: '#f3f4f6', outline: 'none' }} />
                    <button onClick={addCustomField} style={{ color: '#3b82f6' }}><Check size={12} /></button>
                  </div>
                ) : (
                  <button onClick={() => setAddingField(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors normal-case font-normal tracking-normal"
                    style={{ color: '#4b5563' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}>
                    <Plus size={12} />Coluna
                  </button>
                )}
              </div>
            </div>

            {sections.map(section => {
              const isCollapsed = collapsedSections.has(section)
              const sectionTasks = tasksBySection[section]
              return (
                <div key={section}>
                  {/* Cabeçalho de seção */}
                  <div className="flex items-center gap-2 px-4 py-2 cursor-pointer group" style={{ borderBottom: '1px solid #3d3f44', backgroundColor: '#24252a' }} onClick={() => toggleSection(section)}>
                    {isCollapsed ? <ChevronRight size={13} style={{ color: '#4b5563' }} /> : <ChevronDown size={13} style={{ color: '#4b5563' }} />}
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9ca3af' }}>{section}</span>
                    <span className="text-xs" style={{ color: '#4b5563' }}>({sectionTasks.length})</span>
                  </div>

                  {!isCollapsed && (
                    <>
                      {sectionTasks.map(task => {
                        const ts = TASK_STATUSES.find(s => s.key === task.status)
                        const isDone = task.status === 'DONE'
                        return (
                          <div key={task.id}
                            className="grid group items-center px-4 py-2 transition-colors"
                            style={{
                              borderBottom: '1px solid #2c2e33',
                              gridTemplateColumns: `28px 1fr 110px 100px 110px 110px 110px${customFields.map(() => ' 120px').join('')} 90px`,
                              backgroundColor: 'transparent',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {/* Checkbox */}
                            <button onClick={() => toggleTask(task)}
                              className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                              style={{ borderColor: ts?.color ?? '#6b7280', backgroundColor: isDone ? ts?.color : 'transparent' }}>
                              {isDone && <Check size={8} className="text-white" />}
                            </button>

                            {/* Nome */}
                            <span className="text-sm truncate pr-2" style={{ color: isDone ? '#4b5563' : '#e5e7eb', textDecoration: isDone ? 'line-through' : 'none' }}>
                              {task.title}
                              {task._count.subtasks > 0 && <span className="ml-1.5 text-xs" style={{ color: '#4b5563' }}>{task._count.subtasks} sub</span>}
                            </span>

                            {/* Responsável */}
                            <div className="flex -space-x-1">
                              {task.assignees.slice(0, 2).map(a => (
                                <div key={a.userId} className="w-5 h-5 rounded-full bg-blue-600 border border-[#1e1f21] flex items-center justify-center text-white text-[9px] font-bold" title={a.user.name}>
                                  {a.user.name.charAt(0)}
                                </div>
                              ))}
                              {task.assignees.length === 0 && <span className="text-xs" style={{ color: '#3d3f44' }}>—</span>}
                            </div>

                            {/* Prazo */}
                            <span className="text-xs" style={{ color: task.dueDate ? '#9ca3af' : '#3d3f44' }}>
                              {task.dueDate ? formatDate(task.dueDate) : '—'}
                            </span>

                            {/* Prestador — inline editable */}
                            <InlineCell value={task.prestador} placeholder="Prestador" onSave={v => patchTask(task.id, { prestador: v || null })} />

                            {/* Fornecedor — inline editable */}
                            <InlineCell value={task.fornecedor} placeholder="Fornecedor" onSave={v => patchTask(task.id, { fornecedor: v || null })} />

                            {/* Eixo Temático — inline editable */}
                            <InlineCell value={task.eixoTematico} placeholder="Eixo Temático" onSave={v => patchTask(task.id, { eixoTematico: v || null })} />

                            {/* Campos personalizados dinâmicos */}
                            {customFields.map(field => {
                              const cfv = task.customFieldValues?.find(v => v.fieldId === field.id)
                              return (
                                <InlineCell key={field.id} value={cfv?.value ?? null} placeholder={field.name}
                                  onSave={v => saveCustomFieldValue(task.id, field.id, v)} />
                              )
                            })}

                            {/* Ações */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 justify-end">
                              <button onClick={() => openEditTask(task)} className="p-1 rounded" style={{ color: '#6b7280' }} onMouseEnter={e => (e.currentTarget.style.color = '#d1d5db')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}><Edit2 size={12} /></button>
                              <button onClick={() => deleteTask(task.id)} className="p-1 rounded" style={{ color: '#6b7280' }} onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}><Trash2 size={12} /></button>
                            </div>
                          </div>
                        )
                      })}

                      {/* Add tarefa na seção */}
                      {addingInSection === section ? (
                        <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid #2c2e33', backgroundColor: 'rgba(59,130,246,0.05)' }}>
                          <div className="w-4 h-4 rounded-full border-2 shrink-0" style={{ borderColor: '#3d3f44' }} />
                          <input autoFocus value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') addTaskInSection(section); if (e.key === 'Escape') { setAddingInSection(null); setNewTaskTitle('') } }}
                            placeholder="Nome da tarefa" className="flex-1 text-sm outline-none bg-transparent" style={{ color: '#f3f4f6' }} />
                          <button onClick={() => addTaskInSection(section)} className="text-xs px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Adicionar</button>
                          <button onClick={() => { setAddingInSection(null); setNewTaskTitle('') }} style={{ color: '#6b7280' }}><X size={14} /></button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingInSection(section)} className="flex items-center gap-2 px-4 py-2 w-full text-left text-xs transition-colors" style={{ borderBottom: '1px solid #2c2e33', color: '#4b5563', backgroundColor: 'transparent' }}
                          onMouseEnter={e => { (e.currentTarget.style.color = '#3b82f6'); (e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.04)') }}
                          onMouseLeave={e => { (e.currentTarget.style.color = '#4b5563'); (e.currentTarget.style.backgroundColor = 'transparent') }}>
                          <Plus size={13} />Adicionar tarefa
                        </button>
                      )}
                    </>
                  )}
                </div>
              )
            })}

            {/* Add tarefa geral */}
            {addingInSection === '__new__' ? (
              <div className="flex items-center gap-2 px-4 py-3">
                <input autoFocus value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTaskInSection(sections[0] ?? 'Geral'); if (e.key === 'Escape') { setAddingInSection(null); setNewTaskTitle('') } }}
                  placeholder="Nome da tarefa" className="flex-1 text-sm px-3 py-2 rounded-lg outline-none" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} />
                <button onClick={() => addTaskInSection(sections[0] ?? 'Geral')} className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white">Adicionar</button>
                <button onClick={() => { setAddingInSection(null); setNewTaskTitle('') }} style={{ color: '#6b7280' }}><X size={14} /></button>
              </div>
            ) : (
              <button onClick={() => setAddingInSection(sections[0] ?? 'Geral')} className="flex items-center gap-2 px-4 py-3 w-full text-left text-sm transition-colors" style={{ color: '#4b5563' }}
                onMouseEnter={e => { (e.currentTarget.style.color = '#3b82f6') }}
                onMouseLeave={e => { (e.currentTarget.style.color = '#4b5563') }}>
                <Plus size={14} />Adicionar tarefa
              </button>
            )}

            {tasks.length === 0 && (
              <div className="py-16 text-center text-sm" style={{ color: '#4b5563' }}>
                Nenhuma tarefa. Clique em "Adicionar tarefa" para começar.
              </div>
            )}
          </div>
        )}

        {/* ── QUADRO (KANBAN) ── */}
        {activeTab === 'quadro' && (
          <div className="p-5 flex gap-4 overflow-x-auto h-full">
            {kanbanCols.map(col => (
              <div key={col.key} className="w-64 shrink-0 flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
                <div className="px-3 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #3d3f44', borderTop: `3px solid ${col.color}` }}>
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9ca3af' }}>{col.label}</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#32343a', color: '#9ca3af' }}>{col.tasks.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ maxHeight: 520 }}>
                  {col.tasks.map(task => (
                    <div key={task.id} className="p-3 rounded-lg cursor-pointer transition-all" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#3d3f44')}>
                      <p className="text-sm font-medium" style={{ color: '#e5e7eb' }}>{task.title}</p>
                      {task.section && <p className="text-xs mt-1" style={{ color: '#4b5563' }}>{task.section}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${PRIORITY_STYLE[task.priority]?.color}20`, color: PRIORITY_STYLE[task.priority]?.color }}>
                          {PRIORITY_STYLE[task.priority]?.label}
                        </span>
                        {task.dueDate && <span className="text-xs" style={{ color: '#6b7280' }}>{formatDate(task.dueDate)}</span>}
                      </div>
                      {(task.prestador || task.fornecedor) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.prestador && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#7c3aed20', color: '#a78bfa' }}>{task.prestador}</span>}
                          {task.fornecedor && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#d9770620', color: '#fb923c' }}>{task.fornecedor}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={() => { setActiveTab('lista'); setTimeout(() => setAddingInSection(sections[0] ?? 'Geral'), 100) }}
                    className="flex items-center gap-1.5 w-full px-2 py-2 rounded-lg text-xs transition-colors" style={{ border: '1px dashed #3d3f44', color: '#4b5563' }}
                    onMouseEnter={e => { (e.currentTarget.style.color = '#3b82f6'); (e.currentTarget.style.borderColor = '#3b82f6') }}
                    onMouseLeave={e => { (e.currentTarget.style.color = '#4b5563'); (e.currentTarget.style.borderColor = '#3d3f44') }}>
                    <Plus size={12} />Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CRONOGRAMA ── */}
        {activeTab === 'cronograma' && (
          <div className="p-6 max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: '#f3f4f6' }}>Cronograma do Projeto</h3>
              <button onClick={() => setShowEditProject(true)} className="text-xs" style={{ color: '#3b82f6' }}>Editar datas</button>
            </div>
            {[
              { label: 'Data do Evento', start: project.eventDate, end: null, color: '#3b82f6' },
              { label: 'Montagem', start: project.setupStartDate, end: project.setupEndDate, color: '#10b981' },
              { label: 'Operação', start: project.operationStartDate, end: project.operationEndDate, color: '#f59e0b' },
              { label: 'Desmontagem', start: project.teardownStartDate, end: project.teardownEndDate, color: '#ef4444' },
            ].filter(i => i.start).map(({ label, start, end, color }) => (
              <div key={label} className="flex items-center gap-4 py-3" style={{ borderBottom: '1px solid #3d3f44' }}>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs w-28" style={{ color: '#6b7280' }}>{label}</span>
                <span className="text-sm font-medium" style={{ color: '#e5e7eb' }}>{formatDate(start!)}{end ? ` → ${formatDate(end)}` : ''}</span>
              </div>
            ))}

            {/* Tarefas com prazo */}
            {tasks.filter(t => t.dueDate).length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#6b7280' }}>Tarefas com Prazo</h4>
                <div className="space-y-1">
                  {tasks.filter(t => t.dueDate).sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1)).map(task => {
                    const ts = TASK_STATUSES.find(s => s.key === task.status)
                    return (
                      <div key={task.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid #2c2e33' }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ts?.color ?? '#6b7280' }} />
                        <span className="flex-1 text-sm truncate" style={{ color: task.status === 'DONE' ? '#4b5563' : '#e5e7eb' }}>{task.title}</span>
                        <span className="text-xs" style={{ color: '#6b7280' }}>{formatDate(task.dueDate)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {!project.eventDate && !project.setupStartDate && tasks.filter(t => t.dueDate).length === 0 && (
              <p className="text-sm" style={{ color: '#4b5563' }}>Nenhuma data definida. Clique em "Editar datas".</p>
            )}
          </div>
        )}

        {/* ── PAINEL ── */}
        {activeTab === 'painel' && (
          <div className="p-6 space-y-5 max-w-4xl">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total de Tarefas', value: tasks.length, color: '#3b82f6' },
                { label: 'Concluídas', value: doneTasks, color: '#22c55e' },
                { label: 'Em Andamento', value: tasks.filter(t => t.status === 'IN_PROGRESS').length, color: '#f59e0b' },
                { label: 'A Fazer', value: tasks.filter(t => t.status === 'TODO').length, color: '#6b7280' },
              ].map(k => (
                <div key={k.label} className="rounded-xl p-4" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
                  <p className="text-xs mb-1" style={{ color: '#6b7280' }}>{k.label}</p>
                  <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Progresso geral */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: '#f3f4f6' }}>Progresso Geral</h3>
                <span className="text-lg font-bold" style={{ color: pct === 100 ? '#22c55e' : '#3b82f6' }}>{pct}%</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#32343a' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#22c55e' : '#3b82f6' }} />
              </div>
              <p className="text-xs mt-2" style={{ color: '#6b7280' }}>{doneTasks} de {tasks.length} tarefas concluídas</p>
            </div>

            {/* Progresso por seção */}
            {sections.length > 0 && (
              <div className="rounded-xl p-5" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: '#f3f4f6' }}>Progresso por Seção</h3>
                <div className="space-y-3">
                  {sections.map(sec => {
                    const secTasks = tasksBySection[sec]
                    const secDone = secTasks.filter(t => t.status === 'DONE').length
                    const secPct = secTasks.length ? Math.round((secDone / secTasks.length) * 100) : 0
                    return (
                      <div key={sec}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs" style={{ color: '#9ca3af' }}>{sec}</span>
                          <span className="text-xs" style={{ color: '#6b7280' }}>{secDone}/{secTasks.length}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#32343a' }}>
                          <div className="h-full rounded-full" style={{ width: `${secPct}%`, backgroundColor: secPct === 100 ? '#22c55e' : '#3b82f6' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Financeiro */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#f3f4f6' }}>Financeiro</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Orçamento Aprovado', value: formatCurrency(project.approvedBudget ? Number(project.approvedBudget) : null), color: '#3b82f6' },
                  { label: 'Custos Reais', value: formatCurrency(totalCosts), color: '#f59e0b' },
                  { label: 'Margem', value: formatCurrency(margin), color: margin !== null && margin < 0 ? '#ef4444' : '#22c55e' },
                ].map(f => (
                  <div key={f.label} className="text-center p-3 rounded-lg" style={{ backgroundColor: '#32343a' }}>
                    <p className="text-xs mb-1" style={{ color: '#6b7280' }}>{f.label}</p>
                    <p className="font-bold text-sm" style={{ color: f.color }}>{f.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button onClick={() => setShowAddCost(true)} className="text-xs" style={{ color: '#3b82f6' }}>+ Adicionar custo</button>
              </div>
              {showAddCost && (
                <div className="mt-3 space-y-2">
                  <input value={newCost.description} onChange={e => setNewCost(p => ({ ...p, description: e.target.value }))} placeholder="Descrição *" className="w-full text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} />
                  <div className="flex gap-2">
                    <input value={newCost.estimated} onChange={e => setNewCost(p => ({ ...p, estimated: e.target.value }))} placeholder="Estimado" className="flex-1 text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} />
                    <input value={newCost.actual} onChange={e => setNewCost(p => ({ ...p, actual: e.target.value }))} placeholder="Real" className="flex-1 text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addCost} className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white">Adicionar</button>
                    <button onClick={() => setShowAddCost(false)} style={{ color: '#6b7280' }}><X size={14} /></button>
                  </div>
                </div>
              )}
              {costs.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {costs.map(c => (
                    <div key={c.id} className="flex items-center justify-between text-xs py-1.5 group" style={{ borderBottom: '1px solid #2c2e33' }}>
                      <span style={{ color: '#9ca3af' }}>{c.description}</span>
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#e5e7eb' }}>{formatCurrency(Number(c.actual ?? c.estimated ?? 0))}</span>
                        <button onClick={() => deleteCost(c.id)} className="opacity-0 group-hover:opacity-100" style={{ color: '#4b5563' }}><X size={11} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL: EDITAR TAREFA ===== */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #3d3f44' }}>
              <h3 className="font-semibold" style={{ color: '#f3f4f6' }}>Editar Tarefa</h3>
              <button onClick={() => setEditingTask(null)} style={{ color: '#6b7280' }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Título *', field: 'title', type: 'text' },
                { label: 'Seção', field: 'section', type: 'text' },
                { label: 'Prazo', field: 'dueDate', type: 'date' },
                { label: 'Prestador', field: 'prestador', type: 'text' },
                { label: 'Fornecedor', field: 'fornecedor', type: 'text' },
                { label: 'Eixo Temático', field: 'eixoTematico', type: 'text' },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#9ca3af' }}>{label}</label>
                  <input type={type} value={(editTaskForm as any)[field]} onChange={e => setEditTaskForm(p => ({ ...p, [field]: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#9ca3af' }}>Status</label>
                  <select value={editTaskForm.status} onChange={e => setEditTaskForm(p => ({ ...p, status: e.target.value }))} className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }}>
                    {TASK_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#9ca3af' }}>Prioridade</label>
                  <select value={editTaskForm.priority} onChange={e => setEditTaskForm(p => ({ ...p, priority: e.target.value }))} className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }}>
                    <option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setEditingTask(null)} className="flex-1 text-sm py-2 rounded-lg" style={{ border: '1px solid #3d3f44', color: '#9ca3af' }}>Cancelar</button>
              <button onClick={saveTaskModal} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDITAR PROJETO ===== */}
      {showEditProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #3d3f44' }}>
              <h3 className="font-semibold" style={{ color: '#f3f4f6' }}>Editar Projeto</h3>
              <button onClick={() => setShowEditProject(false)} style={{ color: '#6b7280' }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="text-xs font-medium block mb-1" style={{ color: '#9ca3af' }}>Nome</label>
                <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} /></div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: '#9ca3af' }}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }}>
                  {PROJECT_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select></div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: '#9ca3af' }}>Orçamento (R$)</label>
                <input type="number" value={editForm.approvedBudget} onChange={e => setEditForm(p => ({ ...p, approvedBudget: e.target.value }))} className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} /></div>
              {[
                { label: 'Data do Evento', field: 'eventDate' },
                { label: 'Início Montagem', field: 'setupStartDate' }, { label: 'Fim Montagem', field: 'setupEndDate' },
                { label: 'Início Operação', field: 'operationStartDate' }, { label: 'Fim Operação', field: 'operationEndDate' },
                { label: 'Início Desmontagem', field: 'teardownStartDate' }, { label: 'Fim Desmontagem', field: 'teardownEndDate' },
              ].map(({ label, field }) => (
                <div key={field}><label className="text-xs font-medium block mb-1" style={{ color: '#9ca3af' }}>{label}</label>
                  <input type="date" value={(editForm as any)[field]} onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))} className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} /></div>
              ))}
              <div><label className="text-xs font-medium block mb-1" style={{ color: '#9ca3af' }}>Observações</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full text-sm px-3 py-2 rounded-lg outline-none resize-none" style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} /></div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowEditProject(false)} className="flex-1 text-sm py-2 rounded-lg" style={{ border: '1px solid #3d3f44', color: '#9ca3af' }}>Cancelar</button>
              <button onClick={saveProject} disabled={saving} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
