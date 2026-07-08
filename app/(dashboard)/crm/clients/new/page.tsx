'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', company: '', cnpj: '', email: '', phone: '',
    whatsapp: '', city: '', state: '', website: '', notes: '',
  })

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      router.push('/crm/clients')
    } else {
      setSaving(false)
    }
  }

  const field = (label: string, key: string, opts?: { type?: string; textarea?: boolean }) => (
    <div key={key}>
      <label className="text-xs font-medium block mb-1" style={{ color: '#9ca3af' }}>{label}</label>
      {opts?.textarea ? (
        <textarea value={(form as any)[key]} onChange={e => set(key, e.target.value)}
          rows={3} className="w-full text-sm px-3 py-2 rounded-lg outline-none resize-none"
          style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} />
      ) : (
        <input type={opts?.type ?? 'text'} value={(form as any)[key]} onChange={e => set(key, e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-lg outline-none"
          style={{ backgroundColor: '#32343a', border: '1px solid #3d3f44', color: '#f3f4f6' }} />
      )}
    </div>
  )

  return (
    <div style={{ backgroundColor: '#1e1f21', minHeight: '100%', color: '#f3f4f6' }}>
      <Header title="Novo Cliente" subtitle="CRM" />
      <div className="p-6 max-w-2xl">
        <Link href="/crm/clients" className="flex items-center gap-1.5 text-xs mb-5 w-fit" style={{ color: '#6b7280' }}>
          <ArrowLeft size={12} />Voltar
        </Link>

        <div className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: '#292a2e', border: '1px solid #3d3f44' }}>
          {field('Nome *', 'name')}
          {field('Empresa', 'company')}
          {field('CNPJ', 'cnpj')}
          <div className="grid grid-cols-2 gap-4">
            {field('E-mail', 'email', { type: 'email' })}
            {field('Telefone', 'phone')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('WhatsApp', 'whatsapp')}
            {field('Website', 'website')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('Cidade', 'city')}
            {field('Estado', 'state')}
          </div>
          {field('Observações', 'notes', { textarea: true })}

          <div className="flex gap-3 pt-2">
            <Link href="/crm/clients"
              className="flex-1 text-sm py-2 rounded-lg text-center transition-colors"
              style={{ border: '1px solid #3d3f44', color: '#9ca3af' }}>
              Cancelar
            </Link>
            <button onClick={save} disabled={saving || !form.name.trim()}
              className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Salvando...' : 'Criar Cliente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
