'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Client = { id: string; name: string }
type Solution = { id: string; name: string; color: string | null }
type User = { id: string; name: string }

export default function NewDealPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const leadId = searchParams.get('leadId')

  const [clients, setClients] = useState<Client[]>([])
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    clientId: '',
    leadId: leadId ?? '',
    solutionId: '',
    value: '',
    probability: '50',
    expectedCloseDate: '',
    notes: '',
    responsibleId: '',
  })

  useEffect(() => {
    Promise.all([fetch('/api/clients'), fetch('/api/solutions'), fetch('/api/users')])
      .then(([c, s, u]) => Promise.all([c.json(), s.json(), u.json()]))
      .then(([c, s, u]) => { setClients(c.data ?? []); setSolutions(s.data ?? []); setUsers(u.data ?? []) })
  }, [])

  async function create() {
    if (!form.title) return
    setSaving(true)
    const res = await fetch('/api/deals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, value: form.value || null, probability: form.probability || null, expectedCloseDate: form.expectedCloseDate || null, clientId: form.clientId || null, solutionId: form.solutionId || null, leadId: form.leadId || null, responsibleId: form.responsibleId || null }) })
    if (res.ok) { const d = await res.json(); router.push(`/crm/deals/${d.id ?? d.data?.id}`) }
    setSaving(false)
  }

  return (
    <div>
      <Header title="Novo Deal" subtitle="Criar oportunidade de negócio" />
      <div className="p-6 max-w-2xl space-y-5">
        <Link href="/crm/deals" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 w-fit"><ArrowLeft size={14} />Deals</Link>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Título do Deal *</label><input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Projeto Holografia Itau 2025" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cliente</label>
              <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecionar cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Solução PixelSAV</label>
              <select value={form.solutionId} onChange={e => setForm(f => ({ ...f, solutionId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecionar solução...</option>
                {solutions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Valor (R$)</label><input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Probabilidade (%)</label><input type="number" min="0" max="100" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Previsão de Fechamento</label><input type="date" value={form.expectedCloseDate} onChange={e => setForm(f => ({ ...f, expectedCloseDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Responsável</label>
              <select value={form.responsibleId} onChange={e => setForm(f => ({ ...f, responsibleId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecionar responsável...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Notas</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={create} disabled={!form.title || saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg">{saving ? 'Criando...' : 'Criar Deal'}</button>
            <Link href="/crm/deals" className="border border-gray-300 text-gray-700 text-sm px-5 py-2 rounded-lg hover:bg-gray-50">Cancelar</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
