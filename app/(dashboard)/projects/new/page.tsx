'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { useSolutions } from '@/hooks/use-solutions'

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default function NewProjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { solutions } = useSolutions()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>( [])
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; solutionId: string | null }>>( [])
  const [form, setForm] = useState({
    name: '', clientId: '', dealId: searchParams.get('dealId') ?? '', solutionId: '',
    scope: '', eventLocation: '', eventDate: '', approvedBudget: '',
    setupStartDate: '', setupEndDate: '', operationStartDate: '', operationEndDate: '',
    teardownStartDate: '', teardownEndDate: '', templateId: '',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(d.data ?? []))
    fetch('/api/projects/templates').then(r => r.json()).then(d => setTemplates(d.data ?? []))
  }, [])

  // Auto-suggest template when solution changes
  useEffect(() => {
    if (form.solutionId) {
      const tpl = templates.find(t => t.solutionId === form.solutionId)
      if (tpl) set('templateId', tpl.id)
    }
  }, [form.solutionId, templates])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      router.push(`/projects/${data.id}`)
    } else {
      setLoading(false)
      alert('Erro ao criar projeto.')
    }
  }

  const filteredTemplates = form.solutionId
    ? templates.filter(t => t.solutionId === form.solutionId)
    : templates

  return (
    <div>
      <Header title="Novo Projeto" subtitle="Criar projeto a partir de uma solução PixelSAV" />
      <div className="p-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Informações Gerais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nome do Projeto *" className="sm:col-span-2">
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.name} onChange={e => set('name', e.target.value)} required />
              </Field>
              <Field label="Cliente">
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.clientId} onChange={e => set('clientId', e.target.value)}>
                  <option value="">Selecione o cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Solução PixelSAV *">
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.solutionId} onChange={e => set('solutionId', e.target.value)} required>
                  <option value="">Selecione a solução...</option>
                  {solutions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Template do Projeto">
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.templateId} onChange={e => set('templateId', e.target.value)}>
                  <option value="">Nenhum template</option>
                  {filteredTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
              {form.templateId && (
                <div className="sm:col-span-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
                  ✨ Template selecionado criará automaticamente as tarefas padrão para esta solução.
                </div>
              )}
              <Field label="Orçamento Aprovado (R$)">
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="number" value={form.approvedBudget} onChange={e => set('approvedBudget', e.target.value)} />
              </Field>
              <Field label="Local do Evento">
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.eventLocation} onChange={e => set('eventLocation', e.target.value)} />
              </Field>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Cronograma</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Data do Evento">
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="date" value={form.eventDate} onChange={e => set('eventDate', e.target.value)} />
              </Field>
              <Field label="Montagem - Início">
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="date" value={form.setupStartDate} onChange={e => set('setupStartDate', e.target.value)} />
              </Field>
              <Field label="Montagem - Fim">
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="date" value={form.setupEndDate} onChange={e => set('setupEndDate', e.target.value)} />
              </Field>
              <Field label="Operação - Início">
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="date" value={form.operationStartDate} onChange={e => set('operationStartDate', e.target.value)} />
              </Field>
              <Field label="Operação - Fim">
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="date" value={form.operationEndDate} onChange={e => set('operationEndDate', e.target.value)} />
              </Field>
              <Field label="Desmontagem - Início">
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="date" value={form.teardownStartDate} onChange={e => set('teardownStartDate', e.target.value)} />
              </Field>
              <Field label="Desmontagem - Fim">
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="date" value={form.teardownEndDate} onChange={e => set('teardownEndDate', e.target.value)} />
              </Field>
            </div>
          </div>

          <div>
            <Field label="Escopo">
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4} value={form.scope} onChange={e => set('scope', e.target.value)}
                placeholder="Descreva o escopo do projeto..." />
            </Field>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors">
              {loading ? 'Criando...' : 'Criar Projeto'}
            </button>
            <button type="button" onClick={() => router.back()}
              className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-6 py-2.5 rounded-lg text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
