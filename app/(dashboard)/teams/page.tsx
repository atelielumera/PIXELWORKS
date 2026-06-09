'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Plus, Pencil, Trash2, X, Users, UserPlus } from 'lucide-react'

type TeamMember = { id: string; userId: string; role: string; user: { id: string; name: string; email: string; role: string } }
type Team = { id: string; name: string; description: string | null; color: string | null; createdAt: string; members: TeamMember[] }
type User = { id: string; name: string; email: string; role: string; department: string | null }

const COLORS = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#EC4899','#F97316','#14B8A6','#6366F1']
const ROLE_LABEL: Record<string, string> = { SUPER_ADMIN:'Super Admin', ADMIN:'Admin', MANAGER:'Gerente', MEMBER:'Membro', VIEWER:'Visualizador' }

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', color: '#3B82F6' })
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', color: '' })
  const [addingToTeamId, setAddingToTeamId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetch('/api/teams'), fetch('/api/users')])
      .then(([t, u]) => Promise.all([t.json(), u.json()]))
      .then(([t, u]) => { setTeams(t.data ?? []); setUsers(u.data ?? []); setLoading(false) })
  }, [])

  async function createTeam() {
    if (!form.name) return
    const res = await fetch('/api/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { const d = await res.json(); setTeams(p => [...p, { ...d.data, members: [] }]); setForm({ name: '', description: '', color: '#3B82F6' }); setShowCreate(false) }
  }

  async function updateTeam() {
    if (!editingTeam) return
    const res = await fetch(`/api/teams/${editingTeam.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    if (res.ok) { setTeams(p => p.map(t => t.id === editingTeam.id ? { ...t, ...editForm } : t)); setEditingTeam(null) }
  }

  async function deleteTeam(id: string) {
    if (!confirm('Excluir esta equipe?')) return
    const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' })
    if (res.ok) setTeams(p => p.filter(t => t.id !== id))
  }

  async function addMember(teamId: string, userId: string) {
    const user = users.find(u => u.id === userId)
    if (!user) return
    const res = await fetch(`/api/teams/${teamId}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) })
    if (res.ok) {
      const newM: TeamMember = { id: `tmp-${userId}`, userId, role: 'member', user: { id: user.id, name: user.name, email: user.email, role: user.role } }
      setTeams(p => p.map(t => t.id === teamId ? { ...t, members: [...t.members, newM] } : t))
    }
  }

  async function removeMember(teamId: string, userId: string) {
    const res = await fetch(`/api/teams/${teamId}/members?userId=${userId}`, { method: 'DELETE' })
    if (res.ok) setTeams(p => p.map(t => t.id === teamId ? { ...t, members: t.members.filter(m => m.userId !== userId) } : t))
  }

  const addingTeam = teams.find(t => t.id === addingToTeamId)

  if (loading) return <div><Header title="Equipes" subtitle="Carregando..." /></div>

  return (
    <div>
      <Header title="Equipes" subtitle={`${teams.length} equipes · ${users.length} membros`} />
      <div className="p-6 space-y-6">

        {/* Teams */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Equipes</h3>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={13} />Nova Equipe
            </button>
          </div>
          {teams.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <p className="text-gray-500 mb-3">Nenhuma equipe criada ainda.</p>
              <button onClick={() => setShowCreate(true)} className="text-blue-600 hover:underline text-sm">Criar primeira equipe</button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {teams.map(team => (
              <div key={team.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: team.color ?? '#3B82F6' }}>{team.name.charAt(0)}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{team.name}</h4>
                      {team.description && <p className="text-xs text-gray-500 mt-0.5">{team.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingTeam(team); setEditForm({ name: team.name, description: team.description ?? '', color: team.color ?? '#3B82F6' }) }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={13} /></button>
                    <button onClick={() => deleteTeam(team.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="space-y-1.5 mb-3">
                  {team.members.slice(0, 5).map(m => (
                    <div key={m.userId} className="flex items-center gap-2 group/m">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">{m.user.name.charAt(0)}</div>
                      <span className="text-xs text-gray-700 flex-1 truncate">{m.user.name}</span>
                      <button onClick={() => removeMember(team.id, m.userId)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover/m:opacity-100 transition-all"><X size={11} /></button>
                    </div>
                  ))}
                  {team.members.length > 5 && <p className="text-xs text-gray-400">+{team.members.length - 5} mais</p>}
                  {team.members.length === 0 && <p className="text-xs text-gray-400">Sem membros ainda.</p>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">{team.members.length} membro{team.members.length !== 1 ? 's' : ''}</p>
                  <button onClick={() => setAddingToTeamId(team.id)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"><UserPlus size={12} />Adicionar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Users size={16} />Todos os Membros ({users.length})</h3>
            <a href="/admin/users" className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"><Plus size={13} />Novo membro</a>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Membro</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Departamento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Papel</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Equipes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-500">Nenhum usuário.</td></tr>}
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
                      <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">{ROLE_LABEL[u.role] ?? u.role}</span></td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {userTeams.map(t => <span key={t.id} className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: t.color ?? '#3B82F6' }}>{t.name}</span>)}
                          {userTeams.length === 0 && <span className="text-xs text-gray-400">—</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Nova Equipe</h3>
              <button onClick={() => setShowCreate(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Nome *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Produção, Comercial..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Cor</label>
                <div className="flex gap-2 flex-wrap">{COLORS.map(c => <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}</div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={createTeam} disabled={!form.name} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg">Criar Equipe</button>
                <button onClick={() => setShowCreate(false)} className="border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Editar Equipe</h3>
              <button onClick={() => setEditingTeam(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Nome *</label><input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label><input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Cor</label>
                <div className="flex gap-2 flex-wrap">{COLORS.map(c => <button key={c} onClick={() => setEditForm(f => ({ ...f, color: c }))} className={`w-8 h-8 rounded-full border-2 transition-all ${editForm.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}</div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={updateTeam} disabled={!editForm.name} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg">Salvar</button>
                <button onClick={() => setEditingTeam(null)} className="border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member to Team Modal */}
      {addingTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Adicionar a {addingTeam.name}</h3>
              <button onClick={() => setAddingToTeamId(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {users.filter(u => !addingTeam.members.some(m => m.userId === u.id)).length === 0 && (
                <p className="px-3 py-6 text-sm text-gray-500 text-center">Todos os usuários já são membros.</p>
              )}
              {users.filter(u => !addingTeam.members.some(m => m.userId === u.id)).map(user => (
                <button key={user.id} onClick={() => addMember(addingTeam.id, user.id)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
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
