'use client'

import { Header } from '@/components/layout/header'
import { useState, useEffect, useRef } from 'react'
import { User, Lock, Bell, Camera, Check, Loader2 } from 'lucide-react'

type Profile = {
  id: string; name: string; email: string; avatar: string | null
  phone: string | null; department: string | null; role: string
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'profile' | 'password' | 'notifications'>('profile')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', department: '', avatar: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.data) {
        setProfile(d.data)
        setForm({ name: d.data.name ?? '', phone: d.data.phone ?? '', department: d.data.department ?? '', avatar: d.data.avatar ?? '' })
      }
    })
  }, [])

  function flash(type: 'ok' | 'err', text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, avatar: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, phone: form.phone, department: form.department, avatar: form.avatar || null }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) { setProfile(data.data); flash('ok', 'Perfil salvo!') }
    else flash('err', data.error ?? 'Erro ao salvar')
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) { flash('err', 'As senhas não coincidem'); return }
    if (pwForm.newPassword.length < 6) { flash('err', 'Mínimo 6 caracteres'); return }
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) { setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); flash('ok', 'Senha atualizada!') }
    else flash('err', data.error ?? 'Erro ao atualizar')
  }

  const ROLE_LABEL: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin', ADMIN: 'Administrador', MANAGER: 'Gerente', MEMBER: 'Membro', VIEWER: 'Visualizador'
  }

  const avatarSrc = form.avatar || null

  return (
    <div>
      <Header title="Meu Perfil" subtitle="Foto, dados pessoais e senha" />
      <div className="p-4 md:p-6 max-w-2xl">

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg mb-6 w-fit" style={{ backgroundColor: '#292a2e' }}>
          {([
            { key: 'profile', label: 'Perfil', icon: User },
            { key: 'password', label: 'Senha', icon: Lock },
            { key: 'notifications', label: 'Notificações', icon: Bell },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: tab === t.key ? '#3b82f6' : 'transparent',
                color: tab === t.key ? '#fff' : '#9ca3af',
              }}>
              <t.icon size={14} />{t.label}
            </button>
          ))}
        </div>

        {/* Mensagem */}
        {msg && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
            style={{ backgroundColor: msg.type === 'ok' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'ok' ? '#22c55e' : '#ef4444' }}>
            {msg.text}
          </div>
        )}

        {/* ── PERFIL ── */}
        {tab === 'profile' && (
          <form onSubmit={saveProfile} className="rounded-xl p-6 space-y-6" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>

            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative group">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="avatar" className="w-20 h-20 rounded-full object-cover" style={{ border: '3px solid #3d3f44' }} />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold" style={{ border: '3px solid #3d3f44' }}>
                    {form.name?.charAt(0) || profile?.name?.charAt(0) || '?'}
                  </div>
                )}
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                  <Camera size={18} className="text-white" />
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#f3f4f6' }}>{profile?.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{profile?.email}</p>
                <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                  {ROLE_LABEL[profile?.role ?? ''] ?? profile?.role}
                </span>
                <p className="text-xs mt-2" style={{ color: '#4b5563' }}>Clique na foto para alterar</p>
                {form.avatar && form.avatar !== (profile?.avatar ?? '') && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, avatar: profile?.avatar ?? '' }))}
                    className="text-xs mt-1" style={{ color: '#ef4444' }}>Remover foto</button>
                )}
              </div>
            </div>

            {/* Campos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Nome completo *', key: 'name', type: 'text', placeholder: 'Seu nome' },
                { label: 'Telefone / WhatsApp', key: 'phone', type: 'tel', placeholder: '+55 11 99999-9999' },
                { label: 'Departamento', key: 'department', type: 'text', placeholder: 'Ex: Comercial, Operações...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9ca3af' }}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} required={f.key === 'name'}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9ca3af' }}>E-mail</label>
                <input type="email" value={profile?.email ?? ''} disabled
                  className="w-full rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                  style={{ backgroundColor: '#24252a', border: '1px solid #3d3f44', color: '#4b5563' }} />
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Salvar perfil
            </button>
          </form>
        )}

        {/* ── SENHA ── */}
        {tab === 'password' && (
          <form onSubmit={savePassword} className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
            <h3 className="font-semibold" style={{ color: '#f3f4f6' }}>Alterar Senha</h3>
            {[
              { label: 'Senha atual', key: 'currentPassword' },
              { label: 'Nova senha', key: 'newPassword' },
              { label: 'Confirmar nova senha', key: 'confirmPassword' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9ca3af' }}>{f.label}</label>
                <input type="password" value={(pwForm as any)[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder="••••••••" required
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} />
              </div>
            ))}
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Atualizar senha
            </button>
          </form>
        )}

        {/* ── NOTIFICAÇÕES ── */}
        {tab === 'notifications' && (
          <div className="rounded-xl p-6 space-y-5" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
            <h3 className="font-semibold" style={{ color: '#f3f4f6' }}>Notificações</h3>
            <div className="space-y-4">
              {[
                { label: 'Novos leads atribuídos a mim', desc: 'Alerta quando um lead for atribuído' },
                { label: 'Tarefas com prazo vencendo', desc: 'Notificação 24h antes do vencimento' },
                { label: 'Aprovações pendentes', desc: 'Quando precisar da minha ação' },
                { label: 'Projetos com status crítico', desc: 'AT_RISK ou CRITICAL' },
                { label: 'Deals fechados', desc: 'Quando um deal for marcado como Ganho' },
              ].map(n => (
                <label key={n.label} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 w-4 h-4 rounded" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#e5e7eb' }}>{n.label}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>{n.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
