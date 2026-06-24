'use client'

import { Header } from '@/components/layout/header'
import { useState, useEffect, useRef } from 'react'
import { User, Lock, Bell, Shield, Camera } from 'lucide-react'

type Profile = {
  name: string; email: string; phone: string; department: string; avatar: string | null
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'profile' | 'password' | 'notifications'>('profile')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState<Profile>({ name: '', email: '', phone: '', department: '', avatar: null })
  const [passwords, setPasswords] = useState({ current: '', new_: '', confirm: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        if (d.data) setProfile({
          name: d.data.name ?? '',
          email: d.data.email ?? '',
          phone: d.data.phone ?? '',
          department: d.data.department ?? '',
          avatar: d.data.avatar ?? null,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  function showSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profile.name, phone: profile.phone, department: profile.department, avatar: profile.avatar }),
    })
    if (res.ok) showSaved()
    else { const d = await res.json(); setError(d.error || 'Erro ao salvar') }
    setSaving(false)
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (passwords.new_ !== passwords.confirm) { setError('Senhas não coincidem'); return }
    if (passwords.new_.length < 6) { setError('Senha deve ter pelo menos 6 caracteres'); return }
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new_ }),
    })
    if (res.ok) { showSaved(); setPasswords({ current: '', new_: '', confirm: '' }) }
    else { const d = await res.json(); setError(d.error || 'Erro ao atualizar senha') }
    setSaving(false)
  }

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Imagem deve ter no máximo 2MB'); return }
    const reader = new FileReader()
    reader.onload = () => setProfile(p => ({ ...p, avatar: reader.result as string }))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div>
      <Header title="Configurações" subtitle="Perfil, senha e preferências da conta" />
      <div className="p-6 max-w-2xl">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          {([
            { key: 'profile', label: 'Perfil', icon: User },
            { key: 'password', label: 'Senha', icon: Lock },
            { key: 'notifications', label: 'Notificações', icon: Bell },
          ] as const).map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setError('') }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <t.icon size={14} />{t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        {tab === 'profile' && (
          <form onSubmit={saveProfile} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><User size={16} />Informações do Perfil</h3>

            <div className="flex items-center gap-4">
              <div className="relative">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xl font-bold">
                    {profile.name?.charAt(0) || 'U'}
                  </div>
                )}
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                  <Camera size={13} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
              </div>
              <div className="text-sm text-gray-500">Clique no ícone para alterar a foto</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                <input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  placeholder="Seu nome" className={inputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input type="email" value={profile.email} disabled
                  className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+55 11 99999-9999" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <input type="text" value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}
                  placeholder="Ex: Comercial, Operações..." className={inputClass} />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
              {saved && <span className="text-sm text-green-600 font-medium">Salvo com sucesso</span>}
            </div>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={savePassword} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Lock size={16} />Alterar Senha</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
              <input type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                placeholder="••••••••" className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
              <input type="password" value={passwords.new_} onChange={e => setPasswords(p => ({ ...p, new_: e.target.value }))}
                placeholder="••••••••" className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
              <input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                placeholder="••••••••" className={inputClass} required />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                {saving ? 'Atualizando...' : 'Atualizar senha'}
              </button>
              {saved && <span className="text-sm text-green-600 font-medium">Senha atualizada</span>}
            </div>
          </form>
        )}

        {tab === 'notifications' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Bell size={16} />Notificações</h3>
            <div className="space-y-4">
              {[
                { label: 'Novos leads atribuídos a mim', desc: 'Alerta quando um lead for atribuído' },
                { label: 'Tarefas com prazo vencendo', desc: 'Notificação 24h antes do vencimento' },
                { label: 'Aprovações pendentes', desc: 'Quando precisar da minha ação' },
                { label: 'Projetos com status crítico', desc: 'AT_RISK ou CRITICAL' },
                { label: 'Deals fechados', desc: 'Quando um deal for marcado como Ganho' },
              ].map(n => (
                <label key={n.label} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{n.label}</p>
                    <p className="text-xs text-gray-500">{n.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <Shield size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700">
            Permissões e papéis são gerenciados em{' '}
            <a href="/admin/users" className="underline font-medium">Admin &rarr; Usuários</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
