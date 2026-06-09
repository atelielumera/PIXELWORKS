'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { PIPELINE_STAGES } from '@/lib/constants'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Solution = { id: string; name: string; color: string | null }
type User = { id: string; name: string }
type Client = { id: string; name: string }
type Lead = { id: string; contactName: string; company: string | null }

function NewDealForm({ initialLeadId }: { initialLeadId: string | null }) {
  const router = useRouter()
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', leadId: initialLeadId ?? '', clientId: '', solutionId: '',
    value: '', probability: '50', stage: 'NEW', responsibleId: '', expectedCloseDate: '', notes: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/solutions').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/leads').then(r => r.json()),
    ]).then(([s, u, c, l]) => {
      setSolutions(s.data ?? [])
      setUsers(u.data ?? [])
      setClients(c.data ?? [])
      setLeads(l.data ?? [])
    })
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    const res = await fetch('/api/deals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, leadId: form.leadId || null, clientId: form.clientId || null, solutionId: form.solutionId || null, responsibleId: form.responsibleId || null }),
    })
    if (res.ok) { const deal = await res.json(); router.push(`/crm/deals/${deal.id}`) }
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-5">
        <Link href="/crm/deals" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={14} />Deals</Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Novo Deal</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Título *</label>
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Projeção Mapeada – Riachuelo 2025" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Valor (R$)</label>
              <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Probabilidade (%)</label>
              <input type="number" min={0} max={100} value={form.probability} onChange={e => setForm(p => ({ ...p, probability: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Estágio</label>
            <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
              {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Lead (origem)</label>
            <select value={form.leadId} onChange={e => setForm(p => ({ ...p, leadId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
              <option value="">Nenhum</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.contactName}{l.company ? ` – ${l.company}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Cliente</label>
            <select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
              <option value="">Nenhum</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Solução PixelSAV</label>
            <select value={form.solutionId} onChange={e => setForm(p => ({ ...p, solutionId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
              <option value="">Selecionar...</option>
              {solutions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Responsável</label>
            <select value={form.responsibleId} onChange={e => setForm(p => ({ ...p, responsibleId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
              <option value="">Não atribuído</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Previsão de Fechamento</label>
            <input type="date" value={form.expectedCloseDate} onChange={e => setForm(p => ({ ...p, expectedCloseDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Observações</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Link href="/crm/deals" className="flex-1 text-center border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50">Cancelar</Link>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Criar Deal'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NewDealInner() {
  const searchParams = useSearchParams()
  const leadId = searchParams.get('leadId')
  return <NewDealForm initialLeadId={leadId} />
}

export default function NewDealPage() {
  return (
    <div>
      <Header title="Novo Deal" subtitle="CRM" />
      <Suspense fallback={<div className="p-6 text-gray-500">Carregando...</div>}>
        <NewDealInner />
      </Suspense>
    </div>
  )
}
