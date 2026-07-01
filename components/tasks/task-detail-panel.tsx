'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X, Check, Plus, Trash2, Paperclip, MessageSquare,
  ListTodo, Calendar, Flag, Send, FileText, Image, File as FileIcon
} from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/utils'
import { TASK_STATUSES } from '@/lib/constants'

type User = { id: string; name: string; avatar?: string | null }
type Subtask = { id: string; title: string; status: string; assignees: { userId: string; user: { id: string; name: string } }[] }
type Comment = { id: string; content: string; createdAt: string; user: User }
type Attachment = { id: string; createdAt: string; file: { id: string; name: string; originalName: string; mimeType: string; size: number; url: string } }

interface TaskDetailPanelProps {
  task: {
    id: string; title: string; status: string; priority: string
    description?: string | null; dueDate?: string | null; section?: string | null
    assignees: { userId: string; user: { id: string; name: string } }[]
    _count: { subtasks: number }
  }
  projectId: string
  users: User[]
  onClose: () => void
  onTaskUpdate: (taskId: string, data: Partial<{ title: string; status: string; description: string; dueDate: string | null; assignees: { userId: string; user: { id: string; name: string } }[] }>) => void
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#6b7280', MEDIUM: '#3b82f6', HIGH: '#f59e0b', URGENT: '#ef4444',
}
const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente',
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.includes('pdf')) return FileText
  return FileIcon
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function TaskDetailPanel({ task, projectId, users, onClose, onTaskUpdate }: TaskDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'subtasks' | 'comments' | 'files'>('subtasks')
  const [description, setDescription] = useState(task.description ?? '')
  const [editingDesc, setEditingDesc] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [assignees, setAssignees] = useState(task.assignees)
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const assigneeRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
    setAssignees(task.assignees)
  }, [task.id])

  useEffect(() => {
    if (!showAssigneeDropdown) return
    const handler = (e: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) setShowAssigneeDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showAssigneeDropdown])

  async function toggleAssignee(userId: string, userName: string) {
    const alreadyAssigned = assignees.some(a => a.userId === userId)
    const next = alreadyAssigned
      ? assignees.filter(a => a.userId !== userId)
      : [...assignees, { userId, user: { id: userId, name: userName } }]
    const ids = next.map(a => a.userId)
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigneeIds: ids }),
    })
    if (res.ok) {
      setAssignees(next)
      onTaskUpdate(task.id, { assignees: next })
    }
  }

  async function loadData() {
    setLoading(true)
    const [subRes, comRes, fileRes] = await Promise.all([
      fetch(`/api/tasks/${task.id}/subtasks`),
      fetch(`/api/tasks/${task.id}/comments`),
      fetch(`/api/tasks/${task.id}/files`),
    ])
    if (subRes.ok) { const d = await subRes.json(); setSubtasks(d.data) }
    if (comRes.ok) { const d = await comRes.json(); setComments(d.data) }
    if (fileRes.ok) { const d = await fileRes.json(); setAttachments(d.data) }
    setLoading(false)
  }

  async function saveDescription() {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    })
    if (res.ok) {
      onTaskUpdate(task.id, { description })
      setEditingDesc(false)
    }
  }

  async function addSubtask() {
    if (!newSubtask.trim()) return
    const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newSubtask.trim() }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setSubtasks(prev => [...prev, data])
      setNewSubtask('')
    }
  }

  async function toggleSubtask(sub: Subtask) {
    const next = sub.status === 'DONE' ? 'TODO' : 'DONE'
    const res = await fetch(`/api/tasks/${sub.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) setSubtasks(prev => prev.map(s => s.id === sub.id ? { ...s, status: next } : s))
  }

  async function deleteSubtask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setSubtasks(prev => prev.filter(s => s.id !== id))
  }

  async function addComment() {
    if (!newComment.trim()) return
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment.trim() }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setComments(prev => [data, ...prev])
      setNewComment('')
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Arquivo "${file.name}" excede 5MB.`)
        continue
      }
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        const res = await fetch(`/api/tasks/${task.id}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, mimeType: file.type, size: file.size, dataUrl }),
        })
        if (res.ok) {
          const { data } = await res.json()
          setAttachments(prev => [data, ...prev])
        }
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  async function deleteFile(attachmentId: string) {
    await fetch(`/api/tasks/${task.id}/files?attachmentId=${attachmentId}`, { method: 'DELETE' })
    setAttachments(prev => prev.filter(a => a.id !== attachmentId))
  }

  const taskStatus = TASK_STATUSES.find(s => s.key === task.status)
  const doneCount = subtasks.filter(s => s.status === 'DONE').length

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div ref={panelRef} className="fixed right-0 top-0 h-full z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: `${taskStatus?.color}20`, color: taskStatus?.color ?? undefined }}>
              {taskStatus?.label}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: `${PRIORITY_COLORS[task.priority]}15`, color: PRIORITY_COLORS[task.priority] }}>
              <Flag size={10} className="inline mr-0.5" />{PRIORITY_LABELS[task.priority]}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Title */}
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-lg font-bold text-gray-900">{task.title}</h2>
            {task.section && <p className="text-xs text-gray-500 mt-0.5">{task.section}</p>}
          </div>

          {/* Meta row */}
          <div className="px-5 pb-4 flex flex-wrap gap-4">
            {/* Assignees editor */}
            <div ref={assigneeRef} className="relative">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Responsáveis:</span>
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-1">
                    {assignees.map(a => (
                      <div key={a.userId} className="relative group/avatar">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-[10px] font-bold border-2 border-white cursor-pointer" title={a.user.name ?? undefined}
                          onClick={() => toggleAssignee(a.userId, a.user.name ?? '')}>
                          {(a.user.name ?? '?').charAt(0)}
                        </div>
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 pointer-events-none z-10">
                          {a.user.name ?? 'Usuário'} ✕
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setShowAssigneeDropdown(o => !o)}
                    className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                    <Plus size={10} />
                  </button>
                </div>
              </div>
              {showAssigneeDropdown && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 min-w-[180px] overflow-hidden">
                  <div className="max-h-48 overflow-y-auto py-1">
                    {users.map(u => {
                      const sel = assignees.some(a => a.userId === u.id)
                      return (
                        <button key={u.id} onClick={() => toggleAssignee(u.id, u.name)}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors">
                          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[9px] font-bold shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <span className={`flex-1 truncate ${sel ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{u.name}</span>
                          {sel && <Check size={12} className="text-blue-500 shrink-0" />}
                        </button>
                      )
                    })}
                    {users.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">Nenhum usuário</p>}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-gray-400" />
              <span className="text-xs text-gray-600">{task.dueDate ? formatDate(task.dueDate) : 'Sem prazo'}</span>
            </div>
          </div>

          {/* Description */}
          <div className="px-5 pb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Descrição</p>
            {editingDesc ? (
              <div className="space-y-2">
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Adicione uma descrição..." autoFocus />
                <div className="flex gap-2">
                  <button onClick={saveDescription} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700">Salvar</button>
                  <button onClick={() => { setEditingDesc(false); setDescription(task.description ?? '') }} className="text-gray-500 text-xs px-3 py-1.5 hover:text-gray-700">Cancelar</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setEditingDesc(true)} className="cursor-pointer min-h-[40px] p-2 rounded-lg hover:bg-gray-50 transition-colors">
                {description ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{description}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Clique para adicionar descrição...</p>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100" />

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button onClick={() => setActiveTab('subtasks')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${activeTab === 'subtasks' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <ListTodo size={14} />Subtarefas {subtasks.length > 0 && `(${subtasks.length})`}
            </button>
            <button onClick={() => setActiveTab('comments')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${activeTab === 'comments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <MessageSquare size={14} />Comentários {comments.length > 0 && `(${comments.length})`}
            </button>
            <button onClick={() => setActiveTab('files')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${activeTab === 'files' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <Paperclip size={14} />Arquivos {attachments.length > 0 && `(${attachments.length})`}
            </button>
          </div>

          {/* Tab content */}
          <div className="px-5 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* SUBTASKS */}
                {activeTab === 'subtasks' && (
                  <div className="space-y-2">
                    {subtasks.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${subtasks.length > 0 ? (doneCount / subtasks.length) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{doneCount}/{subtasks.length}</span>
                      </div>
                    )}
                    {subtasks.map(sub => (
                      <div key={sub.id} className="flex items-center gap-2 group">
                        <button onClick={() => toggleSubtask(sub)}
                          className="shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
                          style={{ borderColor: sub.status === 'DONE' ? '#22c55e' : '#d1d5db', backgroundColor: sub.status === 'DONE' ? '#22c55e' : 'transparent' }}>
                          {sub.status === 'DONE' && <Check size={10} className="text-white" />}
                        </button>
                        <span className={`flex-1 text-sm ${sub.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{sub.title}</span>
                        <button onClick={() => deleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity p-0.5">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-3">
                      <Plus size={14} className="text-gray-400 shrink-0" />
                      <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSubtask()}
                        placeholder="Adicionar subtarefa..."
                        className="flex-1 text-sm border-none outline-none bg-transparent text-gray-700 placeholder-gray-400" />
                      {newSubtask.trim() && (
                        <button onClick={addSubtask} className="text-blue-600 hover:text-blue-700">
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* COMMENTS */}
                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                        placeholder="Escreva um comentário..."
                        rows={2}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                      <button onClick={addComment} disabled={!newComment.trim()}
                        className="self-end p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
                        <Send size={14} />
                      </button>
                    </div>
                    {comments.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">Nenhum comentário ainda.</p>
                    )}
                    {comments.map(c => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold shrink-0 mt-0.5">
                          {c.user.avatar ? (
                            <img src={c.user.avatar} alt={c.user.name} className="w-7 h-7 rounded-full object-cover" />
                          ) : (c.user.name ?? '?').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-800">{c.user.name}</span>
                            <span className="text-[10px] text-gray-400">{timeAgo(c.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* FILES */}
                {activeTab === 'files' && (
                  <div className="space-y-3">
                    <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" />
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 rounded-lg py-4 flex flex-col items-center gap-1.5 text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors">
                      <Plus size={20} />
                      <span className="text-xs">Clique para enviar arquivos (max 5MB)</span>
                    </button>
                    {attachments.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-2">Nenhum arquivo anexado.</p>
                    )}
                    {attachments.map(att => {
                      const Icon = getFileIcon(att.file.mimeType)
                      const isImage = att.file.mimeType.startsWith('image/')
                      return (
                        <div key={att.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 group hover:bg-gray-50">
                          {isImage ? (
                            <img src={att.file.url} alt={att.file.name} className="w-10 h-10 rounded object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
                              <Icon size={18} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{att.file.originalName}</p>
                            <p className="text-[10px] text-gray-400">{formatFileSize(att.file.size)} · {timeAgo(att.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isImage && (
                              <a href={att.file.url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600">
                                <FileText size={13} />
                              </a>
                            )}
                            <button onClick={() => deleteFile(att.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
