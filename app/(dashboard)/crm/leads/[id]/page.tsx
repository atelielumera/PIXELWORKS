'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils'
import { PIPELINE_STAGES } from '@/lib/constants'
import Link from 'next/link'
import { ArrowLeft, Pencil, X, Users, Calendar, MapPin, DollarSign } from 'lucide-react'

type Lead = {
  id: string; contactName: string; company: string | null; whatsapp: string | null; email: string | null
  city: string | null; state: string | null; status: string; budget: string | null
  eventDate: string | null; eventLocation: string | null; rentalPeriod: string | null
  type: string | null; notes: string | null; nextAction: string | null; nextActionDate: string | null
  createdAt: string; updatedAt: string
  solution: { id: string; name: string; color: string | null } | null
  responsible: { id: string; name: string; email: string } | null
  deals: { id: string; title: string; value: string | null }[]
}

export default function LeadDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [lead, setLead] = useState<Lead | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState<Partial<Lead> & Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/leads/${id}`).then(r => r.json()).then(d => {
      setLead(d.data)
      setForm({ ...d.data, budget: d.data.budget ? String(d.data.budget) : '', eventDate: d.data.eventDate ? d.data.eventDate.substring(0, 10) : '', nextActionDate: d.data.nextActionDate ? d.data.nextActionDate.substring(0, 10) : '' })
    })
  }, [id])

  async function saveLead() {
    setSaving(true)
    const res = await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { const d = await res.json(); setLead(d.data); setShowEdit(false) }
    setSaving(false)
  }

  if (!lead) return <div><Header title="Lead" subtitle="Carregando..." /></div>

  const stage = PIPELINE_STAGES.find(s => s.key === lead.status)

  return (
    <div>
      <Header title={lead.contactName} subtitle={lead.company ?? 'Lead'} />
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/crm/leads" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={14} />Leads</Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{lead.contactName}</h2>
                  <p className="text-gray-500">{lead.company}</p>
                </div>
                <div className="flex items-center gap-2">
                  {stage && <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: `${stage.color}20`, color: stage.color ?? undefined }}>{stage.label}</span>}
                  <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <Pencil size={12} />Editar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {lead.whatsapp && <InfoRow icon={Users} label="WhatsApp" value={lead.whatsapp} />}
                {lead.email && <InfoRow icon={Users} label="E-mail" value={lead.email} />}
                {(lead.city || lead.state) && <InfoRow icon={MapPin} label="Localização" value={[lead.city, lead.state].filter(Boolean).join(', ')} />}
                {lead.eventDate && <InfoRow icon={Calendar} label="Data do Evento" value={formatDate(lead.eventDate)} />}
                {lead.eventLocation && <InfoRow icon={MapPin} label="Local" value={lead.eventLocation} />}
                {lead.budget && <InfoRow icon={DollarSign} label="Orçamento" value={formatCurrency(Number(lead.budget))} />}
                {lead.rentalPeriod && <InfoRow icon={Calendar} label="Período" value={lead.rentalPeriod} />}
                {lead.type && <InfoRow icon={Users} label="Tipo" value={lead.type === 'TEMPORARY_EVENT' ? 'Evento Temporário' : 'Instalação Fixa'} />}
              </div>
              {lead.notes && <div className="mt-4 pt-4 border-t border-gray-100"><p className="text-xs font-medium text-gray-500 uppercase mb-1">Observações</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p></div>}
            </div>
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
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Solução PixelSAV</p>
              {lead.solution ? <span className="inline-block text-sm px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: `${lead.solution.color}20`, color: lead.solution.color ?? undefined }}>{lead.solution.name}</span> : <p className="text-sm text-gray-500">Não definida</p>}
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

      {/* Edit Lead Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Editar Lead</h3>
              <button onClick={() => setShowEdit(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Nome do Contato *</label><input value={form.contactName ?? ''} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Empresa</label><input value={form.company ?? ''} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp</label><input value={form.whatsapp ?? ''} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">E-mail</label><input type="email" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Cidade</label><input value={form.city ?? ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Estado</label><input value={form.state ?? ''} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Orçamento (R$)</label><input type="number" value={form.budget ?? ''} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Data do Evento</label><input type="date" value={form.eventDate ?? ''} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Local do Evento</label><input value={form.eventLocation ?? ''} onChange={e => setForm(f => ({ ...f, eventLocation: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Período de Locação</label><input value={form.rentalPeriod ?? ''} onChange={e => setForm(f => ({ ...f, rentalPeriod: e.target.value }))} placeholder="Ex: 3 dias" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Próxima Ação</label><input value={form.nextAction ?? ''} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Data da Próxima Ação</label><input type="date" value={form.nextActionDate ?? ''} onChange={e => setForm(f => ({ ...f, nextActionDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Observações</label><textarea value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveLead} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg">{saving ? 'Salvando...' : 'Salvar alterações'}</button>
                <button onClick={() => setShowEdit(false)} className="border border-gray-300 text-gray-700 text-sm px-5 py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
              </div>
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
