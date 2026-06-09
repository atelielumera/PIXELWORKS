'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Pencil, X, CheckCircle, XCircle, RotateCcw } from 'lucide-react'

type Deal = {
  id: string; title: string; status: string; stage: string
  value: string | null; probability: number | null; expectedCloseDate: string | null
  notes: string | null; createdAt: string
  client: { id: string; name: string } | null
  solution: { id: string; name: string; color: string | null } | null
  lead: { id: string; contactName: string; company: string | null } | null
  responsible: { id: string; name: string; email: string } | null
  project: { id: string; name: string; status: string } | null
  proposals: { id: string; status: string; totalValue: string | null; createdAt: string }[]
}

const STATUS_LABEL: Record<string, string> = { OPEN: 'Aberto', WON: 'Ganho', LOST: 'Perdido' }
const STATUS_COLOR: Record<string, string> = { OPEN: 'bg-blue-50 text-blue-700', WON: 'bg-green-50 text-green-700', LOST: 'bg-red-50 text-red-700' }

export default function DealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [deal, setDeal] = useState<Deal | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/deals/${id}`).then(r => r.json()).then(d => {
      setDeal(d.data)
      setForm({ ...d.data, value: d.data.value ? String(d.data.value) : '', expectedCloseDate: d.data.expectedCloseDate ? d.data.expectedCloseDate.substring(0, 10) : '' })
    })
  }, [id])

  async function patch(data: Record<string, any>) {
    const res = await fetch(`/api/deals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) { const d = await res.json(); setDeal(prev => prev ? { ...prev, ...d.data } : prev) }
  }

  async function saveDeal() {
    setSaving(true)
    await patch(form)
    setShowEdit(false)
    setSaving(false)
  }

  async function deleteDeal() {
    if (!confirm('Excluir este deal?')) return
    await fetch(`/api/deals/${id}`, { method: 'DELETE' })
    router.push('/crm/deals')
  }

  if (!deal) return <div><Header title="Deal" subtitle="Carregando..." /></div>

  return (
    <div>
      <Header title={deal.title} subtitle={deal.client?.name ?? 'Deal'} />
      <div className="p-6 space-y-5">
        <Link href="/crm/deals" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 w-fit"><ArrowLeft size={14} />Deals</Link>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{deal.title}</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[deal.status]}`}>{STATUS_LABEL[deal.status]}</span>
                {deal.solution && <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: `${deal.solution.color}20`, color: deal.solution.color ?? undefined }}>{deal.solution.name}</span>}
              </div>
              <p className="text-gray-500 mt-1 text-sm">{deal.client?.name}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded-lg"><Pencil size={12} />Editar</button>
              <button onClick={deleteDeal} className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium px-3 py-1.5 rounded-lg"><X size={12} />Excluir</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div><p className="text-xs text-gray-500">Valor</p><p className="font-bold text-gray-900">{formatCurrency(deal.value ? Number(deal.value) : null)}</p></div>
            <div><p className="text-xs text-gray-500">Probabilidade</p><p className="font-bold text-gray-900">{deal.probability != null ? `${deal.probability}%` : '—'}</p></div>
            <div><p className="text-xs text-gray-500">Previsão de Fechamento</p><p className="font-bold text-gray-900">{deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : '—'}</p></div>
            <div><p className="text-xs text-gray-500">Responsável</p><p className="font-bold text-gray-900 text-sm">{deal.responsible?.name ?? '—'}</p></div>
          </div>

          {deal.status === 'OPEN' && (
            <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
              <button onClick={() => patch({ status: 'WON' })} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"><CheckCircle size={15} />Marcar como Ganho</button>
              <button onClick={() => patch({ status: 'LOST' })} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"><XCircle size={15} />Marcar como Perdido</button>
            </div>
          )}
          {deal.status !== 'OPEN' && (
            <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
              <button onClick={() => patch({ status: 'OPEN' })} className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"><RotateCcw size={15} />Reabrir Deal</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Informações</h3>
            <div className="space-y-2 text-sm">
              {deal.lead && <div className="flex justify-between"><span className="text-gray-500">Lead:</span><Link href={`/crm/leads/${deal.lead.id}`} className="text-blue-600 hover:underline">{deal.lead.contactName}</Link></div>}
              {deal.project && <div className="flex justify-between"><span className="text-gray-500">Projeto:</span><Link href={`/projects/${deal.project.id}`} className="text-blue-600 hover:underline">{deal.project.name}</Link></div>}
              <div className="flex justify-between"><span className="text-gray-500">Estágio:</span><span className="text-gray-900">{deal.stage}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Criado em:</span><span className="text-gray-900">{formatDate(deal.createdAt)}</span></div>
            </div>
            {deal.notes && <div className="mt-4 pt-4 border-t border-gray-100"><p className="text-xs font-medium text-gray-500 uppercase mb-2">Notas</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.notes}</p></div>}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Propostas ({deal.proposals.length})</h3>
            </div>
            {deal.proposals.length === 0 ? <p className="text-sm text-gray-500">Nenhuma proposta.</p> : (
              <div className="space-y-2">
                {deal.proposals.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${{ DRAFT:'bg-gray-100 text-gray-600', SENT:'bg-blue-50 text-blue-700', APPROVED:'bg-green-50 text-green-700', REJECTED:'bg-red-50 text-red-700' }[p.status] ?? 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                      <span className="text-xs text-gray-400 ml-2">{formatDate(p.createdAt)}</span>
                    </div>
                    <span className="font-medium text-gray-900">{formatCurrency(p.totalValue ? Number(p.totalValue) : null)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Editar Deal</h3>
              <button onClick={() => setShowEdit(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Título *</label><input value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status ?? 'OPEN'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="OPEN">Aberto</option><option value="WON">Ganho</option><option value="LOST">Perdido</option>
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Valor (R$)</label><input type="number" value={form.value ?? ''} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Probabilidade (%)</label><input type="number" min="0" max="100" value={form.probability ?? ''} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Previsão de Fechamento</label><input type="date" value={form.expectedCloseDate ?? ''} onChange={e => setForm(f => ({ ...f, expectedCloseDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Notas</label><textarea value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveDeal} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg">{saving ? 'Salvando...' : 'Salvar'}</button>
                <button onClick={() => setShowEdit(false)} className="border border-gray-300 text-gray-700 text-sm px-5 py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
