'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils'
import { PIPELINE_STAGES, LEAD_ORIGINS } from '@/lib/constants'
import Link from 'next/link'
import { ArrowLeft, Edit2, X, Trash2, MapPin, DollarSign, Calendar, Users } from 'lucide-react'

type Solution = { id: string; name: string; color: string | null }
type User = { id: string; name: string; email: string }
type Deal = { id: string; title: string; value: string | null; status: string }
type Lead = {
  id: string; contactName: string; company: string | null; whatsapp: string | null; email: string | null
  city: string | null; state: string | null; origin: string | null; type: string | null
  eventDate: string | null; eventLocation: string | null; rentalPeriod: string | null
  budget: string | null; status: string; notes: string | null
  responsibleId: string | null; nextAction: string | null; nextActionDate: string | null
  solutionId: string | null; createdAt: string; updatedAt: string
  solution: Solution | null; responsible: User | null; deals: Deal[]
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Lead>>({})

  useEffect(() => {
    Promise.all([
      fetch(`/api/leads/${id}`).then(r => r.json()),
      fetch('/api/solutions').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([l, s, u]) => {
      setLead(l.data); setForm(l.data)
      setSolutions(s.data ?? []); setUsers(u.data ?? [])
      setLoading(false)
    })
  }, [id])

  function openEdit() { setForm(lead!); setShowEdit(true) }

  async function saveLead() {
    setSaving(true)
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, budget: form.budget ? parseFloat(String(form.budget)) : null }),
    })
    if (res.ok) { const { data } = await res.json(); setLead(data); setShowEdit(false) }
    setSaving(false)
  }

  async function deleteLead() {
    if (!confirm('Excluir este lead? Esta ação não pode ser desfeita.')) return
    await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    router.push('/crm/leads')
  }

  async function changeStatus(status: string) {
    const res = await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (res.ok) { const { data } = await res.json(); setLead(data) }
  }

  if (loading) return <div><Header title="Lead" subtitle="Carregando..." /><div className="p-6 text-gray-500">Carregando...</div></div>
  if (!lead) return <div><Header title="Lead" subtitle="Não encontrado" /><div className="p-6 text-gray-500">Lead não encontrado.</div></div>

  const stage = PIPELINE_STAGES.find(s => s.key === lead.status)

  return (
    <div>
      <Header title={lead.contactName} subtitle={lead.company ?? 'Lead'} />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/crm/leads" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={14} />Leads</Link>
          <div className="flex gap-2">
            <button onClick={openEdit} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"><Edit2 size={13} />Editar</button>
            <button onClick={deleteLead} className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"><Trash2 size={13} />Excluir</button>
          </div>
        </div>

        {/* Stage bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {PIPELINE_STAGES.map(s => (
              <button key={s.key} onClick={() => changeStatus(s.key)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${lead.status === s.key ? 'text-white scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={lead.status === s.key ? { backgroundColor: s.color } : {}}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{lead.contactName}</h2>
                  <p className="text-gray-500">{lead.company}</p>
                </div>
                {stage && <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: `${stage.color}20`, color: stage.color ?? undefined }}>{stage.label}</span>}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoRow icon={Users} label="WhatsApp" value={lead.whatsapp} />
                <InfoRow icon={Users} label="E-mail" value={lead.email} />
                <InfoRow icon={MapPin} label="Localização" value={[lead.city, lead.state].filter(Boolean).join(', ')} />
                <InfoRow icon={Calendar} label="Data do Evento" value={formatDate(lead.eventDate)} />
                <InfoRow icon={MapPin} label="Local do Evento" value={lead.eventLocation} />
                <InfoRow icon={DollarSign} label="Orçamento" value={formatCurrency(lead.budget ? Number(lead.budget) : null)} />
                <InfoRow icon={Calendar} label="Período" value={lead.rentalPeriod} />
                <InfoRow icon={Users} label="Tipo" value={lead.type === 'TEMPORARY_EVENT' ? 'Evento Temporário' : lead.type === 'FIXED_INSTALLATION' ? 'Instalação Fixa' : null} />
                <InfoRow icon={Users} label="Origem" value={LEAD_ORIGINS.find(o => o.key === lead.origin)?.label} />
              </div>
              {lead.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Observações</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </div>

            {/* Deals */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Deals ({lead.deals.length})</h3>
                <Link href={`/crm/deals/new?leadId=${lead.id}`} className="text-xs text-blue-600 hover:underline">+ Criar Deal</Link>
              </div>
              {lead.deals.length === 0 ? <p className="text-sm text-gray-500">Nenhum deal associado.</p> : lead.deals.map(deal => (
                <Link key={deal.id} href={`/crm/deals/${deal.id}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:text-blue-600">
                  <span className="text-sm">{deal.title}</span>
                  <span className="text-sm font-medium">{formatCurrency(deal.value ? Number(deal.value) : null)}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Solução PixelSAV</p>
              {lead.solution ? (
                <span className="inline-block text-sm px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: `${lead.solution.color}20`, color: lead.solution.color ?? undefined }}>{lead.solution.name}</span>
              ) : <p className="text-sm text-gray-500">Não definida</p>}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Responsável</p>
              <p className="text-sm text-gray-900">{lead.responsible?.name ?? 'Não atribuído'}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Próxima Ação</p>
              <p className="text-sm text-gray-900">{lead.nextAction ?? '—'}</p>
              {lead.nextActionDate && <p className="text-xs text-gray-500 mt-1">{formatDate(lead.nextActionDate)}</p>}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Datas</p>
              <p className="text-xs text-gray-500">Criado: {formatDateTime(lead.createdAt)}</p>
              <p className="text-xs text-gray-500">Atualizado: {formatDateTime(lead.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Editar Lead</h3>
              <button onClick={() => setShowEdit(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Nome do Contato *', key: 'contactName', type: 'text' },
                { label: 'Empresa', key: 'company', type: 'text' },
                { label: 'WhatsApp', key: 'whatsapp', type: 'text' },
                { label: 'E-mail', key: 'email', type: 'email' },
                { label: 'Cidade', key: 'city', type: 'text' },
                { label: 'Estado', key: 'state', type: 'text' },
                { label: 'Local do Evento', key: 'eventLocation', type: 'text' },
                { label: 'Período de Locação', key: 'rentalPeriod', type: 'text' },
                { label: 'Orçamento (R$)', key: 'budget', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-700 block mb-1">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key] ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Data do Evento</label>
                <input type="date" value={form.eventDate ? String(form.eventDate).slice(0, 10) : ''} onChange={e => setForm(p => ({ ...p, eventDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Status</label>
                <select value={form.status ?? ''} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                  {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Origem</label>
                <select value={form.origin ?? ''} onChange={e => setForm(p => ({ ...p, origin: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="">Selecionar...</option>
                  {LEAD_ORIGINS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
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
                <label className="text-xs font-medium text-gray-700 block mb-1">Próxima Ação</label>
                <input value={form.nextAction ?? ''} onChange={e => setForm(p => ({ ...p, nextAction: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Data da Próxima Ação</label>
                <input type="date" value={form.nextActionDate ? String(form.nextActionDate).slice(0, 10) : ''} onChange={e => setForm(p => ({ ...p, nextActionDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Observações</label>
                <textarea value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowEdit(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={saveLead} disabled={saving} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
      <div><p className="text-xs text-gray-500">{label}</p><p className="text-gray-900">{value}</p></div>
    </div>
  )
}
