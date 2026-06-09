'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Plus, Edit2, Trash2, X, Check, UserPlus, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type User = { id: string; name: string; email: string; role: string; department: string | null; createdAt: string }
type TeamMember = { userId: string; role: string; user: { id: string; name: string; email: string; role: string; department: string | null } }
type Team = { id: string; name: string; description: string | null; color: string | null; members: TeamMember[] }

const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-50 text-red-700', ADMIN: 'bg-orange-50 text-orange-700',
  MANAGER: 'bg-blue-50 text-blue-700', MEMBER: 'bg-gray-50 text-gray-600', VIEWER: 'bg-gray-50 text-gray-500',
}
const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', MANAGER: 'Gerente', MEMBER: 'Membro', VIEWER: 'Visualizador',
}
const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6']

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '', color: '#3B82F6' })

  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', color: '' })

  const [addMemberTeamId, setAddMemberTeamId] = useState<string | null>(null)
  const [newMemberId, setNewMemberId] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('member')

  useEffect(() => {
    Promise.all([
      fetch('/api/teams').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([t, u]) => {
      setTeams(t.data ?? [])
      setUsers(u.data ?? [])
      setLoading(false)
    })
  }, [])

  async function createTeam() {
    if (!createForm.name.trim()) return
    const res = await fetch('/api/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createForm) })
    if (res.ok) { const { data } = await res.json(); setTeams(p => [...p, data]); setCreateForm({ name: '', description: '', color: '#3B82F6' }); setShowCreate(false) }
  }

  async function saveTeam() {
    if (!editingTeam) return
    const res = await fetch(`/api/teams/${editingTeam.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    if (res.ok) { const { data } = await res.json(); setTeams(p => p.map(t => t.id === data.id ? data : t)); setEditingTeam(null) }
  }

  async function deleteTeam(id: string) {
    if (!confirm('Excluir esta equipe?')) return
    await fetch(`/api/teams/${id}`, { method: 'DELETE' })
    setTeams(p => p.filter(t => t.id !== id))
  }

  async function addMember(teamId: string) {
    if (!newMemberId) return
    const res = await fetch(`/api/teams/${teamId}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: newMemberId, role: newMemberRole }) })
    if (res.ok) {
      const u = users.find(u => u.id === newMemberId)!
      setTeams(p => p.map(t => t.id === teamId ? {
        ...t, members: [...t.members.filter(m => m.userId !== newMemberId), { userId: newMemberId, role: newMemberRole, user: { id: u.id, name: u.name, email: u.email, role: u.role, department: u.department } }]
      } : t))
      setNewMemberId(''); setAddMemberTeamId(null)
    }
  }

  async function removeMember(teamId: string, userId: string) {
    await fetch(`/api/teams/${teamId}/members?userId=${userId}`, { method: 'DELETE' })
    setTeams(p => p.map(t => t.id === teamId ? { ...t, members: t.members.filter(m => m.userId !== userId) } : t))
  }

  if (loading) return <div><Header title="Equipes" subtitle="Carregando..." /><div className="p-6 text-gray-500">Carregando...</div></div>

  return (
    <div>
      <Header title="Equipes" subtitle={`${teams.length} equipes • ${users.length} membros`} />
      <div className="p-6 space-y-6">

        {/* Create Team Button */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Equipes</h3>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} />Nova Equipe
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white rounded-xl border border-blue-200 p-5 space-y-4">
            <h4 className="font-medium text-gray-900">Nova Equipe</h4>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Nome *</label>
              <input value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Equipe Técnica" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Descrição</label>
              <input value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} placeholder="Opcional" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-2">Cor</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setCreateForm(p => ({ ...p, color: c }))} className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: createForm.color === c ? '#1D4ED8' : 'transparent' }} />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={createTeam} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700">Criar Equipe</button>
            </div>
          </div>
        )}

        {/* Teams Grid */}
        {teams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {teams.map(team => (
              <div key={team.id} className="bg-white rounded-xl border border-gray-200 p-5">
                {editingTeam?.id === team.id ? (
                  <div className="space-y-3">
                    <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <input value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} placeholder="Descrição" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                    <div className="flex gap-1.5 flex-wrap">
                      {COLORS.map(c => <button key={c} onClick={() => setEditForm(p => ({ ...p, color: c }))} className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: c, borderColor: editForm.color === c ? '#1D4ED8' : 'transparent' }} />)}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveTeam} className="flex items-center gap-1 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700"><Check size={12} />Salvar</button>
                      <button onClick={() => setEditingTeam(null)} className="border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: team.color ?? '#3B82F6' }}>
                          {team.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{team.name}</h4>
                          {team.description && <p className="text-xs text-gray-500 mt-0.5">{team.description}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingTeam(team); setEditForm({ name: team.name, description: team.description ?? '', color: team.color ?? '#3B82F6' }) }} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Edit2 size={13} /></button>
                        <button onClick={() => deleteTeam(team.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      {team.members.map(m => (
                        <div key={m.userId} className="flex items-center gap-2 group">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">{m.user.name.charAt(0)}</div>
                          <span className="text-xs text-gray-700 flex-1 truncate">{m.user.name}</span>
                          <span className="text-xs text-gray-400">{m.role}</span>
                          <button onClick={() => removeMember(team.id, m.userId)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"><X size={12} /></button>
                        </div>
                      ))}
                      {team.members.length === 0 && <p className="text-xs text-gray-400">Nenhum membro</p>}
                    </div>

                    {addMemberTeamId === team.id ? (
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <select value={newMemberId} onChange={e => setNewMemberId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none">
                          <option value="">Selecionar membro...</option>
                          {users.filter(u => !team.members.some(m => m.userId === u.id)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <input value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} placeholder="Papel" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
                        <div className="flex gap-2">
                          <button onClick={() => addMember(team.id)} className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded-lg">Adicionar</button>
                          <button onClick={() => setAddMemberTeamId(null)} className="text-gray-400 px-2"><X size={13} /></button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAddMemberTeamId(team.id); setNewMemberId(''); setNewMemberRole('member') }} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline mt-2">
                        <UserPlus size={12} />Adicionar membro
                      </button>
                    )}

                    <p className="text-xs text-gray-400 mt-2">{team.members.length} membro{team.members.length !== 1 ? 's' : ''}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {teams.length === 0 && !showCreate && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Users size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhuma equipe cadastrada.</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-blue-600 hover:underline text-sm">Criar primeira equipe</button>
          </div>
        )}

        {/* All Users Table */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users size={16} />Todos os Membros da PixelSAV</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Membro</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Departamento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Papel</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Equipes</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Desde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Nenhum usuário.</td></tr>}
                {users.map(u => {
                  const userTeams = teams.filter(t => t.members.some(m => m.userId === u.id))
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">{u.name.charAt(0)}</div>
                          <div><p className="font-medium text-gray-900">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell text-sm">{u.department ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLE[u.role] ?? 'bg-gray-50 text-gray-600'}`}>{ROLE_LABEL[u.role] ?? u.role}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {userTeams.map(t => <span key={t.id} className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: t.color ?? '#3B82F6' }}>{t.name}</span>)}
                          {userTeams.length === 0 && <span className="text-xs text-gray-400">Sem equipe</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{formatDate(u.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
