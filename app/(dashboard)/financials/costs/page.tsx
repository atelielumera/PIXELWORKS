'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, ChevronDown, ChevronRight, X, Loader2 } from 'lucide-react'

type Installment = { id: string; number: number; amount: number; dueDate: string; paid: boolean }
type Cost = {
  id: string; description: string; category: string; estimated: number | null; actual: number | null
  supplier: string | null; paymentType: string; paymentDate: string | null; installments: Installment[]
}
type ProjectGroup = { id: string; name: string; solution: { name: string; color: string } | null; costs: Cost[] }

const CATEGORIES = ['Geral', 'Equipamentos', 'Mão de obra', 'Logística', 'Fornecedor', 'Marketing', 'Infraestrutura', 'Outros']

export default function CostsPage() {
  const [groups, setGroups] = useState<ProjectGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    projectId: '', category: 'Geral', description: '', estimated: '', actual: '',
    supplier: '', date: '', notes: '', paymentType: 'TOTAL', paymentDate: '',
    installmentCount: 2, installments: [] as { amount: string; dueDate: string }[],
  })

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/costs/grouped')
      const d = await r.json()
      setGroups(d.data ?? [])
      setExpanded(new Set(d.data?.map((g: ProjectGroup) => g.id) ?? []))
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const totals = groups.reduce(
    (acc, g) => {
      g.costs.forEach(c => {
        acc.estimated += c.estimated ?? 0
        acc.actual += c.actual ?? 0
        if (c.paymentType === 'INSTALLMENT') {
          c.installments.forEach(i => { if (i.paid) acc.pago += i.amount })
        } else if (c.actual) acc.pago += c.actual
      })
      return acc
    },
    { estimated: 0, actual: 0, pago: 0 }
  )

  function toggleProject(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function updateInstallments(count: number, estimatedVal: string) {
    const total = parseFloat(estimatedVal.replace(/\./g, '').replace(',', '.')) || 0
    const each = total > 0 ? (total / count).toFixed(2) : ''
    setForm(f => ({
      ...f, installmentCount: count,
      installments: Array.from({ length: count }, (_, i) => ({ amount: each, dueDate: f.installments[i]?.dueDate ?? '' })),
    }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.projectId || !form.description) return
    setSaving(true)
    try {
      await fetch('/api/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: form.projectId, category: form.category, description: form.description,
          estimated: form.estimated || null, actual: form.actual || null,
          supplier: form.supplier || null, date: form.date || null, notes: form.notes || null,
          paymentType: form.paymentType, paymentDate: form.paymentDate || null,
          installments: form.paymentType === 'INSTALLMENT' ? form.installments : undefined,
        }),
      })
      setShowForm(false)
      setForm({ projectId: '', category: 'Geral', description: '', estimated: '', actual: '', supplier: '', date: '', notes: '', paymentType: 'TOTAL', paymentDate: '', installmentCount: 2, installments: [] })
      await load()
    } catch {}
    setSaving(false)
  }

  return (
    <div>
      <Header title="Custos" subtitle="Planejado vs Realizado por projeto" />
      <div className="p-6 space-y-5">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Planejado', value: totals.estimated, color: 'text-gray-900' },
            { label: 'Lançado', value: totals.actual, color: 'text-gray-900' },
            { label: 'Pago', value: totals.pago, color: 'text-green-600' },
            { label: 'Variação', value: totals.estimated - totals.actual, color: totals.estimated - totals.actual >= 0 ? 'text-green-600' : 'text-red-500' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{item.label}</p>
              <p className={`text-xl font-bold mt-1 ${item.color}`}>{formatCurrency(item.value)}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} />Lançar Custo
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 gap-2"><Loader2 size={18} className="animate-spin" />Carregando...</div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">Nenhum custo registrado ainda.</div>
        ) : groups.map(group => {
          const gEst = group.costs.reduce((s, c) => s + (c.estimated ?? 0), 0)
          const gAct = group.costs.reduce((s, c) => s + (c.actual ?? 0), 0)
          const isOpen = expanded.has(group.id)
          return (
            <div key={group.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => toggleProject(group.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
                  <span className="font-semibold text-sm text-gray-900">{group.name}</span>
                  {group.solution && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${group.solution.color}20`, color: group.solution.color }}>
                      {group.solution.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6 text-xs">
                  <span className="text-gray-500">Planejado: <strong className="text-gray-800">{formatCurrency(gEst)}</strong></span>
                  <span className="text-gray-500">Lançado: <strong className={gAct > gEst ? 'text-red-500' : 'text-green-600'}>{formatCurrency(gAct)}</strong></span>
                  <span className="text-gray-400">{group.costs.length} itens</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Categoria</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Fornecedor</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Planejado</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lançado</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pagamento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {group.costs.map(c => (
                        <>
                          <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">{c.description}</td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.category}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{c.supplier ?? '—'}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(c.estimated)}</td>
                            <td className={`px-4 py-3 text-right font-medium ${c.actual && c.estimated && c.actual > c.estimated ? 'text-red-500' : 'text-gray-900'}`}>
                              {formatCurrency(c.actual)}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {c.paymentType === 'INSTALLMENT'
                                ? `${c.installments.length}x parcelado`
                                : c.paymentDate ? formatDate(c.paymentDate) : '—'}
                            </td>
                          </tr>
                          {c.paymentType === 'INSTALLMENT' && c.installments.length > 0 && (
                            <tr key={`${c.id}-inst`}>
                              <td colSpan={6} className="px-8 py-2 bg-gray-50/50">
                                <div className="flex flex-wrap gap-2">
                                  {c.installments.map(inst => (
                                    <div key={inst.id} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border ${inst.paid ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                                      <span className="font-medium">{inst.number}ª</span>
                                      <span>{formatCurrency(inst.amount)}</span>
                                      <span className="text-gray-400">•</span>
                                      <span>{formatDate(inst.dueDate)}</span>
                                      {inst.paid && <span className="font-medium">✓ pago</span>}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Lançar Custo</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Projeto *</label>
                <select required value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">Selecionar projeto...</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fornecedor</label>
                  <input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Opcional" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição *</label>
                <input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Aluguel de equipamentos" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Valor Planejado</label>
                  <input value={form.estimated} onChange={e => {
                    setForm(f => ({ ...f, estimated: e.target.value }))
                    if (form.paymentType === 'INSTALLMENT') updateInstallments(form.installmentCount, e.target.value)
                  }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Valor Real</label>
                  <input value={form.actual} onChange={e => setForm(f => ({ ...f, actual: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="0,00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Tipo de Pagamento</label>
                <div className="flex gap-3">
                  {['TOTAL', 'INSTALLMENT'].map(t => (
                    <button key={t} type="button"
                      onClick={() => { setForm(f => ({ ...f, paymentType: t, installments: [] })); if (t === 'INSTALLMENT') updateInstallments(form.installmentCount, form.estimated) }}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${form.paymentType === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {t === 'TOTAL' ? 'Pagamento Total' : 'Parcelado'}
                    </button>
                  ))}
                </div>
              </div>

              {form.paymentType === 'TOTAL' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Data de Pagamento</label>
                  <input type="date" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}

              {form.paymentType === 'INSTALLMENT' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-xs font-medium text-gray-700">Nº de parcelas:</label>
                    {[2, 3, 4, 5, 6, 10, 12].map(n => (
                      <button key={n} type="button" onClick={() => updateInstallments(n, form.estimated)}
                        className={`w-9 h-8 rounded-lg border text-xs font-medium transition-colors ${form.installmentCount === n ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {n}x
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {form.installments.map((inst, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-6 shrink-0">{i + 1}ª</span>
                        <input value={inst.amount} onChange={e => setForm(f => ({ ...f, installments: f.installments.map((x, j) => j === i ? { ...x, amount: e.target.value } : x) }))}
                          placeholder="Valor" className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                        <input type="date" value={inst.dueDate} onChange={e => setForm(f => ({ ...f, installments: f.installments.map((x, j) => j === i ? { ...x, dueDate: e.target.value } : x) }))}
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Salvando...' : 'Lançar Custo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
