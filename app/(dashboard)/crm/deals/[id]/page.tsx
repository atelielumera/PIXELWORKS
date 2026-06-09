'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils'
import { PIPELINE_STAGES } from '@/lib/constants'
import Link from 'next/link'
import { ArrowLeft, Edit2, X, Trash2, Trophy, ThumbsDown, RotateCcw } from 'lucide-react'

type Solution = { id: string; name: string; color: string | null }
type User = { id: string; name: string; email: string }
type Proposal = { id: string; code: string; status: string; totalValue: string | null; validUntil: string | null; createdAt: string }
type Deal = {
  id: string; title: string; status: string; stage: string; value: string | null
  probability: number | null; notes: string | null; responsibleId: string | null
  solutionId: string | null; expectedCloseDate: string | null
  createdAt: string; updatedAt: string
  client: { id: string; name: string } | null
  lead: { id: string; contactName: string; company: string | null } | null
  solution: Solution | null; responsible: User | null
  proposal: Proposal | null
}

const PROPOSAL_STATUS_STYLE: Record<string, string> = { DRAFT: 'bg-gray-50 text-gray-600', SENT: 'bg-blue-50 text-blue-700', APPROVED: 'bg-green-50 text-green-700', REJECTED: 'bg-red-50 text-red-700', EXPIRED: 'bg-yellow-50 text-yellow-700' }
const PROPOSAL_STATUS_LABEL: Record<string, string> = { DRAFT: 'Rascunho', SENT: 'Enviada', APPROVED: 'Aprovada', REJECTED: 'Rejeitada', EXPIRED: 'Expirada' }

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Deal & { value: string; probability: string }>>({})

  useEffect(() => {
    Promise.all([
      fetch(`/api/deals/${id}`).then(r => r.json()),
      fetch('/api/solutions').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([d, s, u]) => {
      setDeal(d.data); setForm({ ...d.data, value: d.data?.value ?? '', probability: String(d.data?.probability ?? '') })
      setSolutions(s.data ?? []); setUsers(u.data ?? [])
      setLoading(false)
    })
  }, [id])

  async function saveDeal() {
    setSaving(true)
    const res = await fetch(`/api/deals/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form }),
    })
    if (res.ok) { const { data } = await res.json(); setDeal(data); setShowEdit(false) }
    setSaving(false)
  }

  async function setStatus(status: string) {
    const res = await fetch(`/api/deals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (res.ok) { const { data } = await res.json(); setDeal(prev => prev ? { ...prev, status: data.status } : prev) }
  }

  async function deleteDeal() {
    if (!confirm('Excluir este deal?')) return
    await fetch(`/api/deals/${id}`, { method: 'DELETE' })
    router.push('/crm/deals')
  }

  if (loading) return <div><Header title="Deal" subtitle="Carregando..." /><div className="p-6 text-gray-500">Carregando...</div></div>
  if (!deal) return <div><Header title="Deal" subtitle="Não encontrado" /><div className="p-6 text-gray-500">Deal não encontrado.</div></div>

  const stage = PIPELINE_STAGES.find(s => s.key === deal.stage)

  return (
    <div>
      <Header title={deal.title} subtitle={deal.client?.name ?? deal.lead?.company ?? 'Deal'} />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link href="/crm/deals" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={14} />Deals</Link>
          <div className="flex gap-2">
            {deal.status === 'OPEN' && (
              <>
                <button onClick={() => setStatus('WON')} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"><Trophy size={13} />Ganho</button>
                <button onClick={() => setStatus('LOST')} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"><ThumbsDown size={13} />Perdido</button>
              </>
            )}
            {deal.status !== 'OPEN' && (
              <button onClick={() => setStatus('OPEN')} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"><RotateCcw size={13} />Reabrir</button>
            )}
            <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"><Edit2 size={13} />Editar</button>
            <button onClick={deleteDeal} className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"><Trash2 size={13} />Excluir</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{deal.title}</h2>
                  <p className="text-gray-500">{deal.client?.name ?? deal.lead?.company ?? '—'}</p>
                </div>
                <div className="flex flex-col gap-1.5 items-end">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${deal.status === 'OPEN' ? 'bg-blue-50 text-blue-700' : deal.status === 'WON' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {deal.status === 'OPEN' ? 'Aberto' : deal.status === 'WON' ? 'Ganho' : 'Perdido'}
                  </span>
                  {stage && <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: `${stage.color}20`, color: stage.color ?? undefined }}>{stage.label}</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Valor</p><p className="font-bold text-gray-900">{formatCurrency(deal.value ? Number(deal.value) : null)}</p></div>
                <div><p className="text-xs text-gray-500">Probabilidade</p><p className="font-bold text-gray-900">{deal.probability != null ? `${deal.probability}%` : '—'}</p></div>
                <div><p className="text-xs text-gray-500">Previsão de Fechamento</p><p className="font-medium text-gray-900">{formatDate(deal.expectedCloseDate)}</p></div>
                <div><p className="text-xs text-gray-500">Responsável</p><p className="font-medium text-gray-900">{deal.responsible?.name ?? '—'}</p></div>
              </div>
              {deal.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Observações</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
                </div>
              )}
            </div>

            {/* Proposal */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Proposta</h3>
              {!deal.proposal ? <p className="text-sm text-gray-500">Nenhuma proposta gerada.</p> : (
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{deal.proposal.code}</p>
                    <p className="text-xs text-gray-500">Válido até {formatDate(deal.proposal.validUntil)} • Criado em {formatDate(deal.proposal.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{formatCurrency(deal.proposal.totalValue ? Number(deal.proposal.totalValue) : null)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PROPOSAL_STATUS_STYLE[deal.proposal.status] ?? 'bg-gray-50 text-gray-600'}`}>{PROPOSAL_STATUS_LABEL[deal.proposal.status] ?? deal.proposal.status}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {deal.solution && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Solução PixelSAV</p>
                <span className="inline-block text-sm px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: `${deal.solution.color}20`, color: deal.solution.color ?? undefined }}>{deal.solution.name}</span>
              </div>
            )}
            {deal.lead && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Lead Origem</p>
                <Link href={`/crm/leads/${deal.lead.id}`} className="text-sm text-blue-600 hover:underline">{deal.lead.contactName}</Link>
                {deal.lead.company && <p className="text-xs text-gray-500">{deal.lead.company}</p>}
              </div>
            )}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Datas</p>
              <p className="text-xs text-gray-500">Criado: {formatDateTime(deal.createdAt)}</p>
              <p className="text-xs text-gray-500">Atualizado: {formatDateTime(deal.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Editar Deal</h3>
              <button onClick={() => setShowEdit(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Título *</label>
                <input value={form.title ?? ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Valor (R$)</label>
                <input type="number" value={form.value ?? ''} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Probabilidade (%)</label>
                <input type="number" min={0} max={100} value={form.probability ?? ''} onChange={e => setForm(p => ({ ...p, probability: e.target.value as any }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Estágio</label>
                <select value={form.stage ?? ''} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                  {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Previsão de Fechamento</label>
                <input type="date" value={form.expectedCloseDate ? String(form.expectedCloseDate).slice(0, 10) : ''} onChange={e => setForm(p => ({ ...p, expectedCloseDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Solução PixelSAV</label>
                <select value={form.solutionId ?? ''} onChange={e => setForm(p => ({ ...p, solutionId: e.target.value || null }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="">Selecionar...</option>
                  {solutions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Responsável</label>
                <select value={form.responsibleId ?? ''} onChange={e => setForm(p => ({ ...p, responsibleId: e.target.value || null }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="">Não atribuído</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Observações</label>
                <textarea value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowEdit(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={saveDeal} disabled={saving} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
