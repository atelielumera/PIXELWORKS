'use client'

import { Header } from '@/components/layout/header'
import { useState } from 'react'
import { User, Lock, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
  const [tab, setTab] = useState<'profile' | 'password' | 'notifications'>('profile')
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

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
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <t.icon size={14} />{t.label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><User size={16} />Informações do Perfil</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Nome completo', type: 'text', placeholder: 'Seu nome' },
                { label: 'E-mail', type: 'email', placeholder: 'seu@pixelsav.com.br' },
                { label: 'Telefone / WhatsApp', type: 'tel', placeholder: '+55 11 99999-9999' },
                { label: 'Departamento', type: 'text', placeholder: 'Ex: Comercial, Operações...' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                Salvar alterações
              </button>
              {saved && <span className="text-sm text-green-600 font-medium">✓ Salvo</span>}
            </div>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Lock size={16} />Alterar Senha</h3>
            {['Senha atual', 'Nova senha', 'Confirmar nova senha'].map(l => (
              <div key={l}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                <input type="password" placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                Atualizar senha
              </button>
              {saved && <span className="text-sm text-green-600 font-medium">✓ Senha atualizada</span>}
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
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                Salvar preferências
              </button>
              {saved && <span className="text-sm text-green-600 font-medium">✓ Salvo</span>}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <Shield size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700">
            Permissões e papéis são gerenciados em{' '}
            <a href="/admin/users" className="underline font-medium">Admin → Usuários</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
