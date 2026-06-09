'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { PIPELINE_STAGES, LEAD_ORIGINS } from '@/lib/constants'
import { useSolutions } from '@/hooks/use-solutions'

export default function NewLeadPage() {
  const router = useRouter()
  const { solutions } = useSolutions()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    contactName: '', company: '', whatsapp: '', email: '', city: '', state: '',
    origin: '', solutionId: '', type: '', eventDate: '', eventLocation: '',
    rentalPeriod: '', budget: '', status: 'NEW', notes: '', nextAction: '', nextActionDate: '',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      router.push(`/crm/leads/${data.id}`)
    } else {
      setLoading(false)
      alert('Erro ao criar lead.')
    }
  }

  return (
    <div>
      <Header title="Novo Lead" subtitle="Cadastrar novo lead no CRM" />
      <div className="p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Informações do Contato</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nome do Contato *" required>
                <input className="input" value={form.contactName} onChange={e => set('contactName', e.target.value)} required />
              </Field>
              <Field label="Empresa / Organização">
                <input className="input" value={form.company} onChange={e => set('company', e.target.value)} />
              </Field>
              <Field label="WhatsApp">
                <input className="input" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="(11) 99999-9999" />
              </Field>
              <Field label="E-mail">
                <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </Field>
              <Field label="Cidade">
                <input className="input" value={form.city} onChange={e => set('city', e.target.value)} />
              </Field>
              <Field label="Estado">
                <input className="input" value={form.state} onChange={e => set('state', e.target.value)} placeholder="SP" maxLength={2} />
              </Field>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Informações Comerciais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Origem do Lead">
                <select className="input" value={form.origin} onChange={e => set('origin', e.target.value)}>
                  <option value="">Selecione...</option>
                  {LEAD_ORIGINS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Solução PixelSAV">
                <select className="input" value={form.solutionId} onChange={e => set('solutionId', e.target.value)}>
                  <option value="">Selecione...</option>
                  {solutions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Tipo">
                <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="">Selecione...</option>
                  <option value="TEMPORARY_EVENT">Evento Temporário</option>
                  <option value="FIXED_INSTALLATION">Instalação Fixa</option>
                </select>
              </Field>
              <Field label="Orçamento Disponível (R$)">
                <input className="input" type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="0,00" />
              </Field>
              <Field label="Data Prevista">
                <input className="input" type="date" value={form.eventDate} onChange={e => set('eventDate', e.target.value)} />
              </Field>
              <Field label="Local do Projeto">
                <input className="input" value={form.eventLocation} onChange={e => set('eventLocation', e.target.value)} />
              </Field>
              <Field label="Período de Locação">
                <input className="input" value={form.rentalPeriod} onChange={e => set('rentalPeriod', e.target.value)} placeholder="Ex: 3 dias" />
              </Field>
              <Field label="Status">
                <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                  {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Próxima Ação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Próxima Ação" className="sm:col-span-2">
                <input className="input" value={form.nextAction} onChange={e => set('nextAction', e.target.value)} placeholder="Descreva a próxima ação" />
              </Field>
              <Field label="Data da Próxima Ação">
                <input className="input" type="date" value={form.nextActionDate} onChange={e => set('nextActionDate', e.target.value)} />
              </Field>
            </div>
          </div>

          <div>
            <Field label="Observações">
              <textarea className="input" rows={4} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Anotações sobre o lead..." />
            </Field>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors">
              {loading ? 'Salvando...' : 'Criar Lead'}
            </button>
            <button type="button" onClick={() => router.back()}
              className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-6 py-2.5 rounded-lg text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        .input { @apply w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white; }
      `}</style>
    </div>
  )
}

function Field({ label, children, className, required }: {
  label: string; children: React.ReactNode; className?: string; required?: boolean
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
