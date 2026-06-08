'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'

interface Solution { id: string; name: string; slug: string; category: string | null; color: string | null; isActive: boolean; sortOrder: number }

export default function SolutionsAdminPage() {
  const [solutions, setSolutions] = useState<Solution[]>([])

  useEffect(() => {
    fetch('/api/solutions').then(r => r.json()).then(d => setSolutions(d.data ?? []))
  }, [])

  async function toggleActive(sol: Solution) {
    await fetch('/api/solutions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sol.id, isActive: !sol.isActive }),
    })
    setSolutions(prev => prev.map(s => s.id === sol.id ? { ...s, isActive: !s.isActive } : s))
  }

  return (
    <div>
      <Header title="Soluções PixelSAV" subtitle="Cadastro fixo/editável de soluções" />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Solução</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Cor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {solutions.map(sol => (
                <tr key={sol.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs">{sol.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sol.color ?? '#6B7280' }} />
                      <span className="font-medium text-gray-900">{sol.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-5">{sol.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{sol.category ?? '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-4 rounded border border-gray-200" style={{ backgroundColor: sol.color ?? '#6B7280' }} />
                      <code className="text-xs text-gray-500">{sol.color}</code>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(sol)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        sol.isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}>
                      {sol.isActive ? 'Ativa' : 'Inativa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
