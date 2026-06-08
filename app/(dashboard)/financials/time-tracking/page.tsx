'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { formatDate, formatCurrency } from '@/lib/utils'

interface TimeEntry {
  id: string
  hours: number | null
  description: string | null
  date: string
  billable: boolean
  totalCost: number | null
  user: { name: string }
  project: { name: string } | null
  task: { title: string } | null
}

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ projectId: '', taskId: '', description: '', hours: '', hourlyRate: '', date: new Date().toISOString().split('T')[0], billable: false })
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/time-entries').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ]).then(([t, p]) => {
      setEntries(t.data ?? [])
      setProjects(p.data ?? [])
      setLoading(false)
    })
  }, [])

  const totalHours = entries.reduce((s, e) => s + Number(e.hours ?? 0), 0)
  const totalCost = entries.reduce((s, e) => s + Number(e.totalCost ?? 0), 0)

  async function addEntry(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/time-entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, startTime: new Date().toISOString() }) })
    const res = await fetch('/api/time-entries')
    const data = await res.json()
    setEntries(data.data ?? [])
    setForm(p => ({ ...p, description: '', hours: '', hourlyRate: '' }))
  }

  return (
    <div>
      <Header title="Time Tracking" subtitle={`${totalHours.toFixed(1)}h registradas • ${formatCurrency(totalCost)}`} />
      <div className="p-6 space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Registrar Horas</h3>
          <form onSubmit={addEntry} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))}>
              <option value="">Projeto...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Descrição" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" type="number" step="0.5" placeholder="Horas" value={form.hours} onChange={e => setForm(p => ({ ...p, hours: e.target.value }))} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" type="number" placeholder="R$/hora" value={form.hourlyRate} onChange={e => setForm(p => ({ ...p, hourlyRate: e.target.value }))} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Registrar</button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Usuário</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Projeto</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Descrição</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Horas</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Custo</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading && <tr><td colSpan={6} className="py-8 text-center text-gray-500 text-sm">Carregando...</td></tr>}
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 text-gray-700">{e.user.name}</td>
                  <td className="px-4 py-3 text-gray-600">{e.project?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{e.description ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{Number(e.hours ?? 0).toFixed(1)}h</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(Number(e.totalCost ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
