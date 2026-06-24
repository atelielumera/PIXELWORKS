'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ArrowLeft, UserPlus, X, Edit2, Check, Briefcase } from 'lucide-react'
import Link from 'next/link'

type User = { id: string; name: string; email: string; role: string; department: string | null; avatar: string | null }
type TeamMember = { userId: string; role: string; user: User }
type Team = { id: string; name: string; description: string | null; color: string | null; members: TeamMember[] }

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', MANAGER: 'Gerente', MEMBER: 'Membro', VIEWER: 'Visualizador',
}
const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: 'rgba(239,68,68,0.15)', ADMIN: 'rgba(249,115,22,0.15)', MANAGER: 'rgba(59,130,246,0.15)',
  MEMBER: 'rgba(107,114,128,0.15)', VIEWER: 'rgba(107,114,128,0.1)',
}
const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: '#ef4444', ADMIN: '#f97316', MANAGER: '#3b82f6', MEMBER: '#9ca3af', VIEWER: '#6b7280',
}

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [team, setTeam] = useState<Team | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newMemberId, setNewMemberId] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('Membro')
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/teams`).then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([t, u]) => {
      const found = (t.data ?? []).find((x: Team) => x.id === id)
      setTeam(found ?? null)
      setAllUsers(u.data ?? [])
      setLoading(false)
    })
  }, [id])

  async function addMember() {
    if (!newMemberId || !team) return
    const res = await fetch(`/api/teams/${team.id}/members`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newMemberId, role: newMemberRole }),
    })
    if (res.ok) {
      const u = allUsers.find(u => u.id === newMemberId)!
      setTeam(t => t ? { ...t, members: [...t.members.filter(m => m.userId !== newMemberId), { userId: newMemberId, role: newMemberRole, user: u }] } : t)
      setNewMemberId(''); setShowAdd(false)
    }
  }

  async function removeMember(userId: string) {
    if (!team) return
    await fetch(`/api/teams/${team.id}/members?userId=${userId}`, { method: 'DELETE' })
    setTeam(t => t ? { ...t, members: t.members.filter(m => m.userId !== userId) } : t)
  }

  async function saveName() {
    if (!team || !nameVal.trim()) { setEditingName(false); return }
    const res = await fetch(`/api/teams/${team.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameVal }),
    })
    if (res.ok) { const { data } = await res.json(); setTeam(data) }
    setEditingName(false)
  }

  if (loading) return <div><Header title="Equipe" /><div className="p-6 text-sm" style={{ color: '#6b7280' }}>Carregando...</div></div>
  if (!team) return <div><Header title="Equipe" /><div className="p-6 text-sm" style={{ color: '#ef4444' }}>Equipe não encontrada.</div></div>

  const nonMembers = allUsers.filter(u => !team.members.some(m => m.userId === u.id))

  return (
    <div style={{ backgroundColor: '#1e1f21', minHeight: '100%' }}>
      <Header title={team.name} subtitle={`${team.members.length} membro${team.members.length !== 1 ? 's' : ''}`} />
      <div className="p-6 max-w-3xl space-y-6">

        {/* Back */}
        <Link href="/teams" className="flex items-center gap-1.5 text-xs w-fit" style={{ color: '#6b7280' }}>
          <ArrowLeft size={12} />Todas as equipes
        </Link>

        {/* Team header card */}
        <div className="rounded-xl p-5" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0"
              style={{ backgroundColor: team.color ?? '#3B82F6' }}>
              {team.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input autoFocus value={nameVal} onChange={e => setNameVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                    className="text-lg font-bold px-2 py-1 rounded outline-none flex-1"
                    style={{ backgroundColor: '#32343a', border: '1px solid #3b82f6', color: '#f3f4f6' }} />
                  <button onClick={saveName} style={{ color: '#3b82f6' }}><Check size={15} /></button>
                  <button onClick={() => setEditingName(false)} style={{ color: '#6b7280' }}><X size={15} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold truncate" style={{ color: '#f3f4f6' }}>{team.name}</h2>
                  <button onClick={() => { setNameVal(team.name); setEditingName(true) }} style={{ color: '#4b5563' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}>
                    <Edit2 size={13} />
                  </button>
                </div>
              )}
              {team.description && <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{team.description}</p>}
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="rounded-xl p-5" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: '#f3f4f6' }}>Membros</h3>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: '#32343a', color: '#9ca3af', border: '1px solid #3d3f44' }}>
              <UserPlus size={12} />Adicionar
            </button>
          </div>

          {showAdd && (
            <div className="flex gap-2 mb-4 flex-wrap">
              <select value={newMemberId} onChange={e => setNewMemberId(e.target.value)}
                className="text-sm px-3 py-2 rounded-lg flex-1 min-w-48 outline-none"
                style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }}>
                <option value="">Selecionar usuário...</option>
                {nonMembers.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
              </select>
              <input value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)}
                placeholder="Papel" className="text-sm px-3 py-2 rounded-lg w-32 outline-none"
                style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} />
              <button onClick={addMember} className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">Adicionar</button>
              <button onClick={() => setShowAdd(false)} style={{ color: '#6b7280' }}><X size={15} /></button>
            </div>
          )}

          <div className="space-y-2">
            {team.members.map(m => (
              <div key={m.userId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl group"
                style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44' }}>
                {m.user.avatar ? (
                  <img src={m.user.avatar} alt={m.user.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {m.user.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#f3f4f6' }}>{m.user.name}</p>
                  <p className="text-xs truncate" style={{ color: '#6b7280' }}>{m.user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: ROLE_BADGE[m.user.role] ?? 'rgba(107,114,128,0.15)', color: ROLE_COLOR[m.user.role] ?? '#9ca3af' }}>
                    {ROLE_LABEL[m.user.role] ?? m.user.role}
                  </span>
                  {m.role && m.role !== m.user.role && (
                    <span className="text-xs" style={{ color: '#4b5563' }}>{m.role}</span>
                  )}
                  <button onClick={() => removeMember(m.userId)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: '#4b5563' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            {team.members.length === 0 && (
              <p className="text-sm py-4 text-center" style={{ color: '#4b5563' }}>
                Nenhum membro. Clique em Adicionar para incluir.
              </p>
            )}
          </div>
        </div>

        {/* All system users not in team */}
        {nonMembers.length > 0 && (
          <div className="rounded-xl p-5" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: '#f3f4f6' }}>
              <Briefcase size={14} style={{ color: '#6b7280' }} />
              Usuários disponíveis para adicionar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {nonMembers.map(u => (
                <button key={u.id} onClick={() => { setNewMemberId(u.id); setShowAdd(true) }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors group"
                  style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#3d3f44')}>
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                      {u.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#d1d5db' }}>{u.name}</p>
                    <p className="text-xs truncate" style={{ color: '#4b5563' }}>{u.email}</p>
                  </div>
                  <UserPlus size={13} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#3b82f6' }} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
